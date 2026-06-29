import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';

@Injectable()
export class PropertiesService {
  constructor(private readonly dc: DataConnectService) {}

  async findAll() {
    const [detailed, simple] = await Promise.all([
      this.dc.executeQuery<{ detailedProperties: any[] }>('ListDetailedProperties'),
      this.dc.executeQuery<{ hotelProperties: any[] }>('ListProperties'),
    ]);
    return {
      detailed: detailed.detailedProperties || [],
      simple: simple.hotelProperties || [],
    };
  }

  async findRoomTypes(propertyId?: string) {
    const data = await this.dc.executeQuery<{ roomTypes: any[] }>('ListRoomTypes');
    const all = data.roomTypes || [];
    return propertyId ? all.filter((r) => r.propertyId === propertyId) : all;
  }

  async findRatePlans(propertyId?: string) {
    const data = await this.dc.executeQuery<{ ratePlans: any[] }>('ListRatePlans');
    const all = data.ratePlans || [];
    return propertyId ? all.filter((r) => r.propertyId === propertyId) : all;
  }

  async findStopSales() {
    const data = await this.dc.executeQuery<{ stopSales: any[] }>('ListStopSales');
    return data.stopSales || [];
  }

  async createRoomType(dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('InsertRoomType', { ...dto, updatedAt: now });
    return { success: true, id: dto.id };
  }

  async updateRoomType(id: string, dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('UpdateRoomType', { id, ...dto, updatedAt: now });
    return { success: true };
  }

  async removeRoomType(id: string) {
    await this.dc.executeMutation('DeleteRoomType', { id });
    return { success: true };
  }

  async createRatePlan(dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('InsertRatePlan', { ...dto, updatedAt: now });
    return { success: true, id: dto.id };
  }

  async updateRatePlan(id: string, dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('UpdateRatePlan', { id, ...dto, updatedAt: now });
    return { success: true };
  }

  async removeRatePlan(id: string) {
    await this.dc.executeMutation('DeleteRatePlan', { id });
    return { success: true };
  }

  async createStopSale(dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('InsertStopSale', { ...dto, updatedAt: now });
    return { success: true, id: dto.id };
  }

  async updateStopSale(id: string, dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('UpdateStopSale', { id, ...dto, updatedAt: now });
    return { success: true };
  }

  async removeStopSale(id: string) {
    await this.dc.executeMutation('DeleteStopSale', { id });
    return { success: true };
  }

  async create(dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('InsertDetailedProperty', { ...dto, updatedAt: now });
    return { success: true, id: dto.id };
  }

  async update(id: string, dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('UpdateDetailedProperty', { id, ...dto, updatedAt: now });
    return { success: true };
  }

  async remove(id: string) {
    await this.dc.executeMutation('DeleteDetailedProperty', { id });
    return { success: true };
  }

  async deductAllotment(propertyId: string, rooms: number) {
    const data = await this.dc.executeQuery<{ hotelProperties: any[] }>('ListProperties');
    const prop = (data.hotelProperties || []).find((p) => p.id === propertyId);
    if (!prop) return;
    const newAllotment = Math.max(0, (prop.allotment || 0) - rooms);
    await this.dc.executeMutation('UpdateHotelProperty', {
      id: propertyId,
      allotment: newAllotment,
      updatedAt: new Date().toISOString(),
    });
  }
}
