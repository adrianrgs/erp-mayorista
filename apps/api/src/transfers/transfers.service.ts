import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class TransfersService {
  constructor(private readonly dc: DataConnectService) {}

  async findAll() {
    const data = await this.dc.executeQuery<{ transferServices: any[] }>('ListTransferServices');
    return data.transferServices || [];
  }

  async create(dto: any) {
    await this.dc.executeMutation('InsertTransferService', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async update(id: string, dto: any) {
    await this.dc.executeMutation('UpdateTransferService', { id, ...dto, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  async remove(id: string) {
    await this.dc.executeMutation('DeleteTransferService', { id });
    return { success: true };
  }
}
