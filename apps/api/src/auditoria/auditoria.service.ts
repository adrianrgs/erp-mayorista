import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class AuditoriaService {
  constructor(private readonly dc: DataConnectService) {}

  async findAll() {
    const data = await this.dc.executeQuery<{ registroAuditorias: any[] }>('ListRegistrosAuditoria');
    return data.registroAuditorias || [];
  }

  /**
   * Página de auditoría (Fase 1: paginación server-side). Pide limit+1 filas para saber si
   * hay página siguiente sin necesidad de un count. Devuelve { items, hasMore }.
   */
  async findPaged(limit: number, offset: number) {
    const take = Math.max(1, Math.min(limit, 200));
    const data = await this.dc.executeQuery<{ registroAuditorias: any[] }>(
      'ListRegistrosAuditoriaPaged',
      { limit: take + 1, offset: Math.max(0, offset) },
    );
    const rows = data.registroAuditorias || [];
    return { items: rows.slice(0, take), hasMore: rows.length > take };
  }

  /** Historial acotado a una entidad (ej. un expediente), filtrado en la base. */
  async findByEntidad(entidadTipo: string, entidadId: string, limit: number, offset: number) {
    const take = Math.max(1, Math.min(limit, 500));
    const data = await this.dc.executeQuery<{ registroAuditorias: any[] }>(
      'ListRegistrosAuditoriaByEntidad',
      { entidadTipo, entidadId, limit: take + 1, offset: Math.max(0, offset) },
    );
    const rows = data.registroAuditorias || [];
    return { items: rows.slice(0, take), hasMore: rows.length > take };
  }

  async create(dto: {
    id?: string;
    tipo: string;
    usuarioId: string;
    usuarioNombre: string;
    detalle?: string;
    entidadTipo?: string;
    entidadId?: string;
  }) {
    // El id se asigna server-side: colisión-libre sin depender de tener toda la lista en el
    // cliente (necesario ahora que la auditoría ya no se carga entera en memoria).
    const id = `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await this.dc.executeMutation('InsertRegistroAuditoria', {
      id,
      tipo: dto.tipo,
      usuarioId: dto.usuarioId,
      usuarioNombre: dto.usuarioNombre,
      detalle: dto.detalle ?? null,
      entidadTipo: dto.entidadTipo ?? null,
      entidadId: dto.entidadId ?? null,
      createdAt: new Date().toISOString(),
    });
    return { success: true, id };
  }

  async removeByEntidad(entidadTipo: string, entidadId: string) {
    await this.dc.executeMutation('DeleteRegistrosAuditoriaByEntidad', {
      entidadTipo,
      entidadId,
    });
    return { success: true };
  }

  async removeByTipo(entidadTipo: string) {
    await this.dc.executeMutation('DeleteRegistrosAuditoriaByTipo', { entidadTipo });
    return { success: true };
  }
}
