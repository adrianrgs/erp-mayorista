import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class ServicesService {
  constructor(private readonly dc: DataConnectService) {}

  async findAll() {
    const [services, rates] = await Promise.all([
      this.dc.executeQuery<{ extraServices: any[] }>('ListExtraServices'),
      this.dc.executeQuery<{ serviceRates: any[] }>('ListServiceRates'),
    ]);
    return {
      services: services.extraServices || [],
      rates: rates.serviceRates || [],
    };
  }

  async create(dto: any) {
    await this.dc.executeMutation('InsertExtraService', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async update(id: string, dto: any) {
    await this.dc.executeMutation('UpdateExtraService', { id, ...dto, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  async remove(id: string) {
    await this.dc.executeMutation('DeleteExtraService', { id });
    return { success: true };
  }

  async createRate(dto: any) {
    await this.dc.executeMutation('InsertServiceRate', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async updateRate(id: string, dto: any) {
    await this.dc.executeMutation('UpdateServiceRate', { id, ...dto, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  async removeRate(id: string) {
    await this.dc.executeMutation('DeleteServiceRate', { id });
    return { success: true };
  }
}
