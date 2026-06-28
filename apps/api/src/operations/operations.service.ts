import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class OperationsService {
  constructor(private readonly dc: DataConnectService) {}

  async findAllVehicles() {
    const data = await this.dc.executeQuery<{ fleetVehicles: any[] }>('ListFleetVehicles');
    return data.fleetVehicles || [];
  }

  async findAllDrivers() {
    const data = await this.dc.executeQuery<{ fleetDrivers: any[] }>('ListFleetDrivers');
    return data.fleetDrivers || [];
  }

  async createVehicle(dto: any) {
    await this.dc.executeMutation('InsertFleetVehicle', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async updateVehicle(id: string, dto: any) {
    await this.dc.executeMutation('UpdateFleetVehicle', { id, ...dto, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  async createDriver(dto: any) {
    await this.dc.executeMutation('InsertFleetDriver', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async updateDriver(id: string, dto: any) {
    await this.dc.executeMutation('UpdateFleetDriver', { id, ...dto, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  async removeVehicle(id: string) {
    await this.dc.executeMutation('DeleteFleetVehicle', { id });
    return { success: true };
  }

  async removeDriver(id: string) {
    await this.dc.executeMutation('DeleteFleetDriver', { id });
    return { success: true };
  }
}
