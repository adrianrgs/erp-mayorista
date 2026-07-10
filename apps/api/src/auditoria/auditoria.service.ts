import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class AuditoriaService {
  constructor(private readonly dc: DataConnectService) {}

  async findAll() {
    const data = await this.dc.executeQuery<{ registroAuditorias: any[] }>('ListRegistrosAuditoria');
    return data.registroAuditorias || [];
  }

  async create(dto: {
    id: string;
    tipo: string;
    usuarioId: string;
    usuarioNombre: string;
    detalle?: string;
    entidadTipo?: string;
    entidadId?: string;
  }) {
    await this.dc.executeMutation('InsertRegistroAuditoria', {
      id: dto.id,
      tipo: dto.tipo,
      usuarioId: dto.usuarioId,
      usuarioNombre: dto.usuarioNombre,
      detalle: dto.detalle ?? null,
      entidadTipo: dto.entidadTipo ?? null,
      entidadId: dto.entidadId ?? null,
      createdAt: new Date().toISOString(),
    });
    return { success: true, id: dto.id };
  }
}
