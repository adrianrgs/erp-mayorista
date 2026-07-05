import { Injectable, NotFoundException } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class DirectClientsService {
  constructor(private readonly dc: DataConnectService) {}

  async findAll() {
    const data = await this.dc.executeQuery<{ directClients: any[] }>('ListDirectClients');
    return data.directClients || [];
  }

  async findOne(id: string) {
    const all = await this.findAll();
    const client = all.find((c) => c.id === id);
    if (!client) throw new NotFoundException(`Cliente directo ${id} no encontrado`);
    return client;
  }

  async create(dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('InsertDirectClient', { ...dto, updatedAt: now });
    return { success: true, id: dto.id };
  }

  async update(id: string, dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('UpdateDirectClient', { id, ...dto, updatedAt: now });
    return { success: true };
  }

  async remove(id: string) {
    await this.dc.executeMutation('DeleteDirectClient', { id });
    return { success: true };
  }
}
