import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class AutorizacionesService {
  constructor(private readonly dc: DataConnectService) {}

  // ── Reglas de autorización ──────────────────────────────────────────────
  async findAllReglas() {
    const data = await this.dc.executeQuery<{ reglaAutorizacions: any[] }>('ListReglasAutorizacion');
    return data.reglaAutorizacions || [];
  }

  async createRegla(dto: any) {
    await this.dc.executeMutation('InsertReglaAutorizacion', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async updateRegla(id: string, dto: any) {
    await this.dc.executeMutation('UpdateReglaAutorizacion', { id, ...dto, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  // ── Solicitudes de autorización ─────────────────────────────────────────
  async findAllSolicitudes() {
    const data = await this.dc.executeQuery<{ solicitudAutorizacions: any[] }>('ListSolicitudesAutorizacion');
    return data.solicitudAutorizacions || [];
  }

  async createSolicitud(dto: any) {
    await this.dc.executeMutation('InsertSolicitudAutorizacion', dto);
    return { success: true, id: dto.id };
  }

  async resolveSolicitud(id: string, dto: { estado: 'Aprobada' | 'Rechazada'; comentarioResolucion?: string; resolutorId: string }) {
    await this.dc.executeMutation('UpdateSolicitudAutorizacion', {
      id,
      ...dto,
      resolvedAt: new Date().toISOString(),
    });
    return { success: true };
  }
}
