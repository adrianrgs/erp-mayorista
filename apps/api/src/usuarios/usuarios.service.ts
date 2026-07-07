import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class UsuariosService {
  constructor(private readonly dc: DataConnectService) {}

  async findAll() {
    const data = await this.dc.executeQuery<{ usuarios: any[] }>('ListUsuarios');
    return (data.usuarios || []).map(({ passwordHash, ...rest }) => rest);
  }

  async create(dto: { id: string; username: string; password: string; nombre: string; email: string; rolId: string; activo?: boolean }) {
    const { password, ...rest } = dto;
    const passwordHash = await bcrypt.hash(password, 10);
    await this.dc.executeMutation('InsertUsuario', {
      ...rest,
      activo: dto.activo !== undefined ? dto.activo : true,
      passwordHash,
      updatedAt: new Date().toISOString(),
    });
    return { success: true, id: dto.id };
  }

  async update(id: string, dto: any) {
    const { password, ...rest } = dto;
    const payload: any = { id, ...rest, updatedAt: new Date().toISOString() };
    if (password) {
      payload.passwordHash = await bcrypt.hash(password, 10);
    }
    await this.dc.executeMutation('UpdateUsuario', payload);
    return { success: true };
  }
}
