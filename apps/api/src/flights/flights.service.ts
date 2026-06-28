import { Injectable } from '@nestjs/common';
import { DataConnectService } from '../shared/dataconnect/dataconnect.service';
import { PnrParserService } from '../shared/pnr-parser.service';
import { parseJsonField } from '../shared/parse-json.util';

@Injectable()
export class FlightsService {
  constructor(
    private readonly dc: DataConnectService,
    private readonly pnrParser: PnrParserService,
  ) {}

  async findAllTickets() {
    const data = await this.dc.executeQuery<{ flightTickets: any[] }>('ListFlightTickets');
    return (data.flightTickets || []).map((t) => ({
      ...t,
      pasajeros: parseJsonField(t.pasajeros, []),
      segmentos: parseJsonField(t.segmentos, []),
    }));
  }

  async findAllLegs() {
    const data = await this.dc.executeQuery<{ flightLegs: any[] }>('ListFlightLegs');
    return data.flightLegs || [];
  }

  parsePnr(rawText: string) {
    return this.pnrParser.parse(rawText);
  }

  async createTicket(dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('InsertFlightTicket', {
      ...dto,
      pasajeros: JSON.stringify(dto.pasajeros || []),
      segmentos: JSON.stringify(dto.segmentos || []),
      updatedAt: now,
    });
    return { success: true, id: dto.id };
  }

  async updateTicket(id: string, dto: any) {
    const now = new Date().toISOString();
    await this.dc.executeMutation('UpdateFlightTicket', {
      id,
      ...dto,
      ...(dto.pasajeros && { pasajeros: JSON.stringify(dto.pasajeros) }),
      ...(dto.segmentos && { segmentos: JSON.stringify(dto.segmentos) }),
      updatedAt: now,
    });
    return { success: true };
  }

  async removeTicket(id: string) {
    await this.dc.executeMutation('DeleteFlightTicket', { id });
    return { success: true };
  }
}
