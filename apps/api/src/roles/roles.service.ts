import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class RolesService {
  constructor(private readonly dc: DataConnectService) {}

  async findAll() {
    const data = await this.dc.executeQuery<{ rols: any[] }>('ListRoles');
    return data.rols || [];
  }

  async create(dto: any) {
    await this.dc.executeMutation('InsertRol', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async update(id: string, dto: any) {
    await this.dc.executeMutation('UpdateRol', { id, ...dto, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  async remove(id: string) {
    await this.dc.executeMutation('DeleteRol', { id });
    return { success: true };
  }
}
