import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';
import { FinancialReconcilerService } from '../shared/financial-reconciler.service';
import { parseJsonField } from '../shared/parse-json.util';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { nextSequentialId } from '../shared/next-sequential-id.util';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly dc: DataConnectService,
    private readonly reconciler: FinancialReconcilerService,
  ) {}

  private parseReservation(r: any) {
    return {
      ...r,
      servicios: parseJsonField(r.servicios, []),
      variaciones: parseJsonField(r.variaciones, []),
      pasajeros: parseJsonField(r.pasajeros, []),
    };
  }

  async findAll() {
    const data = await this.dc.executeQuery<{ reservations: any[] }>('ListReservations');
    return (data.reservations || []).map((r) => this.parseReservation(r));
  }

  async findOne(id: string) {
    const data = await this.dc.executeQuery<{ reservations: any[] }>('ListReservations');
    const reservation = (data.reservations || []).find((r) => r.id === id);
    if (!reservation) throw new NotFoundException(`Reserva ${id} no encontrada`);
    return this.parseReservation(reservation);
  }

  private async getAllReservationIds(): Promise<Set<string>> {
    const data = await this.dc.executeQuery<{ reservations: any[] }>('ListReservations');
    return new Set((data.reservations || []).map((r) => r.id).filter(Boolean));
  }

  async create(dto: CreateReservationDto) {
    const now = new Date().toISOString();
    // Campos fijos del expediente; el id se resuelve de forma atómica más abajo.
    const baseFields = {
      holder: dto.holder,
      hotelName: dto.hotelName,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      pax: dto.pax,
      status: dto.status,
      totalPrice: dto.totalPrice,
      netPrice: dto.netPrice,
      agenciaName: dto.agenciaName || null,
      telefono: dto.telefono || null,
      email: dto.email || null,
      mercado: dto.mercado || 'NACIONAL',
      tipo: dto.tipo || 'Reserva Real',
      facturacionTipo: dto.facturacionTipo || null,
      specialRequests: dto.specialRequests || null,
      servicios: JSON.stringify(dto.servicios || []),
      variaciones: JSON.stringify([]),
      pasajeros: JSON.stringify(dto.pasajeros || []),
      canalVenta: dto.canalVenta || 'B2B',
      clienteDirectoId: dto.clienteDirectoId || null,
      localizadorProveedor: dto.localizadorProveedor || null,
      asesor: dto.asesor || null,
      createdAt: now.split('T')[0],
      updatedAt: now,
    };

    // Asignación de id server-side, a prueba de concurrencia (10 asesores creando a la vez):
    // se honra el id propuesto por el cliente si sigue libre; ante colisión real (otro asesor
    // tomó ese RES-N entre la lectura y el insert) se recalcula el siguiente y se reintenta.
    // El id es clave primaria en Postgres, así que un duplicado JAMÁS pasa silenciosamente.
    const MAX_ATTEMPTS = 8;
    let lastErr: any;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const usedIds = await this.getAllReservationIds();
      const proposed = dto.id;
      const id =
        attempt === 0 && proposed && !usedIds.has(proposed)
          ? proposed
          : nextSequentialId('RES', usedIds);
      try {
        await this.dc.executeMutation('InsertReservation', { ...baseFields, id });
        return { success: true, id, reassigned: id !== proposed };
      } catch (e) {
        lastErr = e;
        // ¿Fue colisión de clave primaria (carrera con otro insert concurrente)?
        // Si el id que intentamos ahora ya existe, sí: recalculamos y reintentamos.
        // Si no existe, es un error real (validación, red, etc.) y lo propagamos de una.
        const after = await this.getAllReservationIds();
        if (after.has(id)) continue;
        throw e;
      }
    }
    throw new ConflictException(
      `No se pudo asignar un identificador único para la reserva tras ${MAX_ATTEMPTS} intentos`,
    );
  }

  async update(id: string, dto: UpdateReservationDto) {
    const now = new Date().toISOString();

    // Si viene estado anterior para reconciliación financiera
    if (dto.previousState && dto.servicios) {
      const [clientsData, directClientsData, obligationsData] = await Promise.all([
        this.dc.executeQuery<{ b2BClients: any[] }>('ListClients'),
        this.dc.executeQuery<{ directClients: any[] }>('ListDirectClients'),
        this.dc.executeQuery<{ payableObligations: any[] }>('ListPayableObligations'),
      ]);

      const clients = clientsData.b2BClients || [];
      const directClients = directClientsData.directClients || [];
      const obligations = obligationsData.payableObligations || [];

      const oldRes = {
        ...dto.previousState,
        servicios: dto.previousState.servicios || [],
        variaciones: dto.previousState.variaciones || [],
        pasajeros: dto.previousState.pasajeros || [],
      };
      const newRes = {
        ...oldRes,
        ...dto,
        id,
        servicios: dto.servicios,
        variaciones: dto.variaciones || oldRes.variaciones,
        pasajeros: dto.pasajeros || oldRes.pasajeros,
      };

      const result = this.reconciler.reconcileDossierUpdate(oldRes, newRes, clients, directClients, obligations);

      // Persistir reserva actualizada
      await this.dc.executeMutation('UpdateReservation', {
        id,
        status: result.updatedRes.status,
        totalPrice: result.updatedRes.totalPrice,
        netPrice: result.updatedRes.netPrice,
        servicios: JSON.stringify(result.updatedRes.servicios || []),
        variaciones: JSON.stringify(result.updatedRes.variaciones || []),
        pasajeros: JSON.stringify((result.updatedRes as any).pasajeros || []),
        updatedAt: now,
        ...(dto.holder && { holder: dto.holder }),
        ...(dto.checkIn && { checkIn: dto.checkIn }),
        ...(dto.checkOut && { checkOut: dto.checkOut }),
        ...(dto.pax && { pax: dto.pax }),
        ...(dto.tipo && { tipo: dto.tipo }),
        ...(dto.facturacionTipo && { facturacionTipo: dto.facturacionTipo }),
        ...(dto.specialRequests !== undefined && { specialRequests: dto.specialRequests }),
        ...(dto.canalVenta && { canalVenta: dto.canalVenta }),
        ...(dto.clienteDirectoId !== undefined && { clienteDirectoId: dto.clienteDirectoId }),
        ...(dto.localizadorProveedor !== undefined && { localizadorProveedor: dto.localizadorProveedor }),
      });

      // Persistir cliente actualizado
      if (result.updatedClient) {
        const { kind, client } = result.updatedClient;
        await this.dc.executeMutation(kind === 'Directo' ? 'UpdateDirectClient' : 'UpdateClient', {
          id: client.id,
          saldoFavor: client.saldoFavor,
          saldoDeber: client.saldoDeber,
          updatedAt: now,
        });
      }

      // Persistir obligaciones actualizadas
      await Promise.all(
        result.updatedPayableObligations
          .filter((o) => o.status === 'Congelado' || o.netCost !== undefined)
          .map((o) =>
            this.dc.executeMutation('UpdatePayableObligation', {
              id: o.id,
              status: o.status,
              netCost: o.netCost,
              isFrozen: o.isFrozen || false,
              notes: o.notes || null,
              updatedAt: now,
            }),
          ),
      );

      return { success: true, reconciliationLog: result.log };
    }

    // Actualización simple sin reconciliación
    await this.dc.executeMutation('UpdateReservation', {
      id,
      updatedAt: now,
      ...(dto.status && { status: dto.status }),
      ...(dto.holder && { holder: dto.holder }),
      ...(dto.checkIn && { checkIn: dto.checkIn }),
      ...(dto.checkOut && { checkOut: dto.checkOut }),
      ...(dto.pax !== undefined && { pax: dto.pax }),
      ...(dto.totalPrice !== undefined && { totalPrice: dto.totalPrice }),
      ...(dto.netPrice !== undefined && { netPrice: dto.netPrice }),
      ...(dto.tipo && { tipo: dto.tipo }),
      ...(dto.facturacionTipo && { facturacionTipo: dto.facturacionTipo }),
      ...(dto.specialRequests !== undefined && { specialRequests: dto.specialRequests }),
      ...(dto.servicios && { servicios: JSON.stringify(dto.servicios) }),
      ...(dto.variaciones && { variaciones: JSON.stringify(dto.variaciones) }),
      ...(dto.pasajeros && { pasajeros: JSON.stringify(dto.pasajeros) }),
      ...(dto.canalVenta && { canalVenta: dto.canalVenta }),
      ...(dto.clienteDirectoId !== undefined && { clienteDirectoId: dto.clienteDirectoId }),
      ...(dto.localizadorProveedor !== undefined && { localizadorProveedor: dto.localizadorProveedor }),
    });

    return { success: true };
  }

  async remove(id: string) {
    await this.dc.executeMutation('DeleteReservation', { id });
    return { success: true };
  }
}
