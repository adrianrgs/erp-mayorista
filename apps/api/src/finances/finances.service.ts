import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';
import { parseJsonField } from '../shared/parse-json.util';

@Injectable()
export class FinancesService {
  constructor(private readonly dc: DataConnectService) {}

  async findAllInvoices() {
    const data = await this.dc.executeQuery<{ financialInvoices: any[] }>('ListInvoices');
    return data.financialInvoices || [];
  }

  async findAllVouchers() {
    const data = await this.dc.executeQuery<{ paymentVouchers: any[] }>('ListPaymentVouchers');
    return data.paymentVouchers || [];
  }

  async findAllObligations() {
    const data = await this.dc.executeQuery<{ payableObligations: any[] }>('ListPayableObligations');
    return (data.payableObligations || []).map((o) => ({
      ...o,
      payments: parseJsonField(o.payments, []),
    }));
  }

  async findAllStatements() {
    const data = await this.dc.executeQuery<{ providerStatements: any[] }>('ListProviderStatements');
    return data.providerStatements || [];
  }

  async createInvoice(dto: any) {
    await this.dc.executeMutation('InsertInvoice', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async updateInvoice(id: string, dto: any) {
    await this.dc.executeMutation('UpdateInvoice', { id, ...dto, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  async createVoucher(dto: any) {
    await this.dc.executeMutation('InsertPaymentVoucher', { ...dto, updatedAt: new Date().toISOString() });
    return { success: true, id: dto.id };
  }

  async updateVoucher(id: string, dto: any) {
    await this.dc.executeMutation('UpdatePaymentVoucher', { id, ...dto, updatedAt: new Date().toISOString() });
    return { success: true };
  }

  async createObligation(dto: any) {
    await this.dc.executeMutation('InsertPayableObligation', {
      ...dto,
      payments: JSON.stringify(dto.payments || []),
      updatedAt: new Date().toISOString(),
    });
    return { success: true, id: dto.id };
  }

  async updateObligation(id: string, dto: any) {
    await this.dc.executeMutation('UpdatePayableObligation', {
      id, ...dto,
      ...(dto.payments && { payments: JSON.stringify(dto.payments) }),
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  }
}
