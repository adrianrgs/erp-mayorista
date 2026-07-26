import { Injectable, ConflictException } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';
import { PnrParserService } from '../shared/pnr-parser.service';
import { parseJsonField } from '../shared/parse-json.util';
import { nextSequentialId } from '../shared/next-sequential-id.util';

@Injectable()
export class FlightsService {
  constructor(
    private readonly dc: DataConnectService,
    private readonly pnrParser: PnrParserService,
  ) {}

  async findAllTickets() {
    const data = await this.dc.executeQuery<{ flightTickets: any[] }>('ListFlightTickets');
    return (data.flightTickets || []).map((t) => ({
      ...t,
      pasajeros: parseJsonField(t.pasajeros, []),
      segmentos: parseJsonField(t.segmentos, []),
    }));
  }

  async findAllLegs() {
    const data = await this.dc.executeQuery<{ flightLegs: any[] }>('ListFlightLegs');
    return data.flightLegs || [];
  }

  parsePnr(rawText: string) {
    return this.pnrParser.parse(rawText);
  }

  /** Ids ya en uso como boleto (PK) o como expediente aéreo embebido (AER dentro del JSON). */
  private async getUsedTicketIds(): Promise<Set<string>> {
    const data = await this.dc.executeQuery<{ flightTickets: any[] }>('ListFlightTickets');
    const used = new Set<string>();
    for (const t of data.flightTickets || []) {
      if (t?.id) used.add(t.id);
      const aer = t?.expedienteAereo?.id;
      if (aer) used.add(aer);
    }
    return used;
  }

  /** Reescribe id del boleto, id del expediente aéreo y boletoId de cada segmento a partir del AER dado. */
  private withReassignedId(dto: any, id: string) {
    const nAer = id.replace(/^AER-/, '');
    const segmentos = Array.isArray(dto.segmentos)
      ? dto.segmentos.map((s: any, i: number) => ({ ...s, boletoId: `BOL-${nAer}-${i + 1}` }))
      : dto.segmentos;
    const expedienteAereo = dto.expedienteAereo
      ? { ...dto.expedienteAereo, id }
      : dto.expedienteAereo;
    return { ...dto, id, segmentos, expedienteAereo };
  }

  async createTicket(dto: any) {
    const now = new Date().toISOString();
    // El id del boleto ES el id AER (clave primaria en Postgres). Asignación server-side
    // anti-colisión, igual que en reservas: honra el propuesto si sigue libre; ante colisión
    // real recalcula el siguiente AER y reescribe las referencias anidadas (expediente y segmentos).
    const proposed = dto.id;
    const MAX_ATTEMPTS = 8;
    let lastErr: any;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const used = await this.getUsedTicketIds();
      const id =
        attempt === 0 && proposed && !used.has(proposed)
          ? proposed
          : nextSequentialId('AER', used);
      const ticket = this.withReassignedId(dto, id);
      try {
        await this.dc.executeMutation('InsertFlightTicket', {
          ...ticket,
          pasajeros: JSON.stringify(ticket.pasajeros || []),
          segmentos: JSON.stringify(ticket.segmentos || []),
          updatedAt: now,
        });
        return { success: true, id, reassigned: id !== proposed };
      } catch (e) {
        lastErr = e;
        const after = await this.getUsedTicketIds();
        if (after.has(id)) continue; // colisión de PK: recalcular y reintentar
        throw e; // error real: propagar
      }
    }
    throw new ConflictException(
      `No se pudo asignar un identificador único para el boleto tras ${MAX_ATTEMPTS} intentos`,
    );
  }

  async updateTicket(id: string, dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('UpdateFlightTicket', {
      id,
      ...dto,
      ...(dto.pasajeros && { pasajeros: JSON.stringify(dto.pasajeros) }),
      ...(dto.segmentos && { segmentos: JSON.stringify(dto.segmentos) }),
      updatedAt: now,
    });
    return { success: true };
  }

  async removeTicket(id: string) {
    await this.dc.executeMutation('DeleteFlightTicket', { id });
    return { success: true };
  }
}
