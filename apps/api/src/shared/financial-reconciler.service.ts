import { Injectable } from '@nestjs/common';
import {
  Reservation,
  ServiceItem,
  B2BClient,
  DirectClient,
  PayableObligation,
  FinancialVariation,
  B2BWalletTransaction,
} from './types';

export type UpdatedClientRef =
  | { kind: 'B2B'; client: B2BClient }
  | { kind: 'Directo'; client: DirectClient };

export interface ReconciliationResult {
  updatedRes: Reservation;
  updatedClient: UpdatedClientRef | null;
  updatedPayableObligations: PayableObligation[];
  newWalletTransactions: B2BWalletTransaction[];
  newVariations: FinancialVariation[];
  log: string[];
}

@Injectable()
export class FinancialReconcilerService {
  reconcileDossierUpdate(
    oldRes: Reservation,
    newRes: Reservation,
    clients: B2BClient[],
    directClients: DirectClient[],
    payableObligations: PayableObligation[],
  ): ReconciliationResult {
    const log: string[] = [];
    const newVariations: FinancialVariation[] = [];
    const newWalletTransactions: B2BWalletTransaction[] = [];
    let updatedPayableObligations = [...payableObligations];

    const isDirecto = (newRes.canalVenta || oldRes.canalVenta) === 'Directo';
    let updatedClient: UpdatedClientRef | null = null;
    if (isDirecto) {
      const clienteDirectoId = newRes.clienteDirectoId || oldRes.clienteDirectoId;
      const idx = directClients.findIndex((c) => c.id === clienteDirectoId);
      if (idx !== -1) updatedClient = { kind: 'Directo', client: { ...directClients[idx] } };
    } else {
      const agencyName = newRes.agenciaName || oldRes.agenciaName;
      const idx = clients.findIndex(
        (c) => c.nombre.toLowerCase() === (agencyName || '').toLowerCase(),
      );
      if (idx !== -1) updatedClient = { kind: 'B2B', client: { ...clients[idx] } };
    }

    const isBilled = (oldRes.servicios || []).some(
      (s) => s.statusFacturacion === 'Facturado',
    );

    const oldServices = oldRes.servicios || [];
    const newServices = newRes.servicios || [];
    const currentVariations = [...(oldRes.variaciones || [])];

    const genId = (prefix: string) =>
      `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    // HELPER: Register a credit event for logging only.
    // The actual saldoDeber / saldoFavor adjustment is computed in the calling service where
    // invoice and voucher data is available to correctly split debt-clearance vs. overpayment-refund.
    const applyCreditToClient = (amount: number, reason: string) => {
      if (!updatedClient) return;
      log.push(`[Crédito Registrado] ${updatedClient.client.nombre}: $${amount.toFixed(2)} crédito pendiente de ajuste de saldo — ${reason}`);
    };

    const applyDebitToClient = (amount: number, reason: string) => {
      if (!updatedClient) return;
      const client = updatedClient.client;

      if (client.saldoFavor > 0) {
        const autoApply = Math.min(client.saldoFavor, amount);
        client.saldoFavor -= autoApply;
        amount -= autoApply;
        log.push(
          `[Billetera Virtual] Se aplicaron $${autoApply.toFixed(2)} del saldo a favor de ${client.nombre} para pagar el suplemento.`,
        );
        newWalletTransactions.push({
          id: genId('TX-WLT'),
          clientId: client.id,
          reservationId: newRes.id,
          type: 'Cargo_Pago',
          amount: autoApply,
          status: 'Disponible',
          notes: `Pago automático de suplemento: ${reason}`,
          createdAt: new Date().toISOString(),
        });
      }

      if (amount > 0) {
        const previousDebt = client.saldoDeber;
        client.saldoDeber += amount;
        log.push(
          `[Suplemento] ${client.nombre}: deuda $${previousDebt.toFixed(2)}→$${client.saldoDeber.toFixed(2)} (${reason})`,
        );
      }
    };

    // Anulación total
    if (newRes.status === 'Cancelada' && oldRes.status !== 'Cancelada') {
      log.push(`[Anulación Total] Expediente ${newRes.id} anulado por completo.`);
      newRes.servicios = newServices.map((s) => ({ ...s, status: 'Cancelado' as const }));

      if (isBilled) {
        const totalRefund = oldServices
          .filter((s) => s.statusFacturacion === 'Facturado')
          .reduce((sum, s) => sum + s.precioVenta, 0);

        if (totalRefund > 0) {
          applyCreditToClient(totalRefund, `Reembolso por anulación total del expediente ${newRes.id}`);
          const variation: FinancialVariation = {
            id: genId('VAR-CR'),
            reservationId: newRes.id,
            type: 'Credito',
            amountNet: -oldRes.netPrice,
            amountSale: -totalRefund,
            reason: 'Anulación total del expediente',
            date: new Date().toISOString().split('T')[0],
          };
          newVariations.push(variation);
          currentVariations.push(variation);
        }
      }

      updatedPayableObligations = updatedPayableObligations.map((obl) => {
        if (obl.locatorId === newRes.id) {
          log.push(`[Cuentas por Pagar] Obligación ${obl.id} (${obl.providerName}) congelada.`);
          return {
            ...obl,
            status: 'Congelado' as const,
            isFrozen: true,
            notes: `${obl.notes || ''}\n[Bloqueado] Reserva anulada. Verificar penalidad del proveedor.`,
          };
        }
        return obl;
      });

      newRes.variaciones = currentVariations;
      return { updatedRes: newRes, updatedClient, updatedPayableObligations, newWalletTransactions, newVariations, log };
    }

    // Cancelaciones parciales y variaciones de precio
    if (isBilled) {
      oldServices.forEach((sOld) => {
        const sNew = newServices.find((s) => s.id === sOld.id);
        const isNowCancelled = !sNew || sNew.status === 'Cancelado';
        const wasCancelled = sOld.status === 'Cancelado';

        if (isNowCancelled && !wasCancelled && sOld.statusFacturacion === 'Facturado') {
          log.push(`[Cancelación Parcial] Servicio "${sOld.descripcion}" cancelado.`);
          applyCreditToClient(sOld.precioVenta, `Cancelación de servicio: ${sOld.descripcion}`);

          const variation: FinancialVariation = {
            id: genId('VAR-CR'),
            reservationId: newRes.id,
            serviceItemId: sOld.id,
            type: 'Credito',
            amountNet: -sOld.precioNeto,
            amountSale: -sOld.precioVenta,
            reason: `Cancelación: ${sOld.descripcion}`,
            date: new Date().toISOString().split('T')[0],
          };
          newVariations.push(variation);
          currentVariations.push(variation);

          updatedPayableObligations = updatedPayableObligations.map((obl) => {
            if (
              obl.locatorId === oldRes.id &&
              (obl.serviceDetail.toLowerCase().includes(sOld.descripcion.toLowerCase()) ||
                obl.providerName.toLowerCase().includes((sOld.proveedor || '').toLowerCase()))
            ) {
              log.push(`[Cuentas por Pagar] Obligación ${obl.id} asociada a servicio cancelado congelada.`);
              return { ...obl, status: 'Congelado' as const, isFrozen: true, notes: `${obl.notes || ''}\n[Bloqueado] Servicio cancelado.` };
            }
            return obl;
          });
        }
      });

      newServices.forEach((sNew) => {
        const sOld = oldServices.find((s) => s.id === sNew.id);

        if (sOld) {
          const deltaSale = sNew.precioVenta - sOld.precioVenta;
          const deltaNet = sNew.precioNeto - sOld.precioNeto;

          if ((deltaSale !== 0 || deltaNet !== 0) && sOld.statusFacturacion === 'Facturado') {
            log.push(`[Modificación Tarifa] Servicio "${sNew.descripcion}" varió. Delta venta: $${deltaSale.toFixed(2)}, Delta neto: $${deltaNet.toFixed(2)}`);
            const varType = deltaSale > 0 ? ('Suplemento' as const) : ('Credito' as const);
            const variation: FinancialVariation = {
              id: genId('VAR-MOD'),
              reservationId: newRes.id,
              serviceItemId: sNew.id,
              type: varType,
              amountNet: deltaNet,
              amountSale: deltaSale,
              reason: `Modificación tarifa: ${sNew.descripcion}`,
              date: new Date().toISOString().split('T')[0],
            };
            newVariations.push(variation);
            currentVariations.push(variation);

            if (deltaSale > 0) {
              log.push(`[Suplemento Pendiente] $${deltaSale.toFixed(2)} sobre "${sNew.descripcion}" — pendiente de aprobación en Facturación.`);
            } else {
              applyCreditToClient(Math.abs(deltaSale), `Crédito por rebaja tarifa: ${sNew.descripcion}`);
            }

            updatedPayableObligations = updatedPayableObligations.map((obl) => {
              if (
                obl.locatorId === oldRes.id &&
                (obl.serviceDetail.toLowerCase().includes(sNew.descripcion.toLowerCase()) ||
                  obl.providerName.toLowerCase().includes((sNew.proveedor || '').toLowerCase()))
              ) {
                const newNet = Math.max(0, obl.netCost + deltaNet);
                return {
                  ...obl,
                  netCost: newNet,
                  status: obl.paidAmount >= newNet ? ('Pagado Total' as const) : obl.paidAmount > 0 ? ('Pagado Parcial' as const) : ('Pendiente' as const),
                };
              }
              return obl;
            });
          }
        } else {
          // New service — financial effects are handled exclusively by FacturacionView
          // when billing is approved, to avoid double-charging.
          log.push(
            `[Nuevo Servicio] "${sNew.descripcion}" (${sNew.statusFacturacion}) detectado. Pendiente de aprobación en Facturación.`,
          );
        }
      });
    }

    const activeServices = newServices.filter((s) => s.status !== 'Cancelado');
    newRes.totalPrice = activeServices.reduce((sum, s) => sum + s.precioVenta, 0);
    newRes.netPrice = activeServices.reduce((sum, s) => sum + s.precioNeto, 0);
    log.push(`[Recálculo Reserva] Total expediente recalculado: $${newRes.totalPrice.toFixed(2)} (Neto: $${newRes.netPrice.toFixed(2)})`);

    newRes.variaciones = currentVariations;
    return { updatedRes: newRes, updatedClient, updatedPayableObligations, newWalletTransactions, newVariations, log };
  }
}
