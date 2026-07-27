import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class ProveedoresService implements OnModuleInit {
  private readonly logger = new Logger(ProveedoresService.name);
  constructor(private readonly dc: DataConnectService) {}

  // Backfill único al arrancar: rellena nombreLower en proveedores existentes que no lo tengan
  // (idempotente; tras la primera pasada no vuelve a escribir). Habilita la búsqueda insensible
  // a mayúsculas para el catálogo cargado antes de la Fase 2.
  async onModuleInit() {
    try {
      const data = await this.dc.executeQuery<{ proveedors: any[] }>('ListProveedores');
      const faltantes = (data.proveedors || []).filter(
        (p) => p.nombre && (!p.nombreLower || p.nombreLower !== p.nombre.toLowerCase()),
      );
      for (const p of faltantes) {
        await this.dc.executeMutation('UpdateProveedor', {
          id: p.id,
          nombreLower: p.nombre.toLowerCase(),
          updatedAt: new Date().toISOString(),
        });
      }
      if (faltantes.length) this.logger.log(`Backfill nombreLower: ${faltantes.length} proveedor(es).`);
    } catch (e) {
      this.logger.error(`Backfill nombreLower falló (no crítico): ${(e as any)?.message || e}`);
    }
  }

  async findAll() {
    const data = await this.dc.executeQuery<{ proveedors: any[] }>('ListProveedores');
    return data.proveedors || [];
  }

  // Búsqueda server-side por nombre (insensible a mayúsculas vía nombreLower). Fase 2.
  async search(term: string, limit = 25) {
    const t = (term || '').trim().toLowerCase();
    const data = await this.dc.executeQuery<{ proveedors: any[] }>('SearchProveedores', {
      term: t,
      limit: Math.max(1, Math.min(limit, 100)),
    });
    return data.proveedors || [];
  }

  async create(dto: any) {
    const nombreLower = (dto.nombre || '').toLowerCase();
    await this.dc.executeMutation('InsertProveedor', { ...dto, nombreLower, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async update(id: string, dto: any) {
    const nombreLower = dto.nombre != null ? String(dto.nombre).toLowerCase() : undefined;
    await this.dc.executeMutation('UpdateProveedor', { id, ...dto, nombreLower, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  async remove(id: string) {
    await this.dc.executeMutation('DeleteProveedor', { id });
    return { success: true };
  }
}
