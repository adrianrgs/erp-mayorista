import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class ProveedoresService {
  constructor(private readonly dc: DataConnectService) {}

  async findAll() {
    const data = await this.dc.executeQuery<{ proveedors: any[] }>('ListProveedores');
    return data.proveedors || [];
  }

  async create(dto: any) {
    await this.dc.executeMutation('InsertProveedor', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async update(id: string, dto: any) {
    await this.dc.executeMutation('UpdateProveedor', { id, ...dto, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  async remove(id: string) {
    await this.dc.executeMutation('DeleteProveedor', { id });
    return { success: true };
  }
}
