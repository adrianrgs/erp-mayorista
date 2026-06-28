import { Injectable } from '@nestjs/common';
import {
  Reservation,
  ServiceItem,
  B2BClient,
  PayableObligation,
  FinancialVariation,
  B2BWalletTransaction,
} from './types';

export interface ReconciliationResult {
  updatedRes: Reservation;
  updatedClient: B2BClient | null;
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
    payableObligations: PayableObligation[],
  ): ReconciliationResult {
    const log: string[] = [];
    const newVariations: FinancialVariation[] = [];
    const newWalletTransactions: B2BWalletTransaction[] = [];
    let updatedPayableObligations = [...payableObligations];

    const agencyName = newRes.agenciaName || oldRes.agenciaName;
    const clientIndex = clients.findIndex(
      (c) => c.nombre.toLowerCase() === (agencyName || '').toLowerCase(),
    );
    let updatedClient: B2BClient | null =
      clientIndex !== -1 ? { ...clients[clientIndex] } : null;

    const isBilled = (oldRes.servicios || []).some(
      (s) => s.statusFacturacion === 'Facturado',
    );
    const isCreditClient =
      updatedClient?.tipo === 'A Crédito' ||
      newRes.facturacionTipo === 'Crédito';

    const oldServices = oldRes.servicios || [];
    const newServices = newRes.servicios || [];
    const currentVariations = [...(oldRes.variaciones || [])];

    const genId = (prefix: string) =>
      `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const applyCreditToClient = (amount: number, reason: string) => {
      if (!updatedClient) return;
      if (isCreditClient) {
        const originalDebt = updatedClient.saldoDeber;
        updatedClient.saldoDeber = Math.max(0, updatedClient.saldoDeber - amount);
        log.push(
          `[Crédito B2B] Se redujo la deuda de ${updatedClient.nombre} por $${amount.toFixed(2)} (Deuda anterior: $${originalDebt.toFixed(2)}, Deuda actual: $${updatedClient.saldoDeber.toFixed(2)})`,
        );
      } else {
        const originalWallet = updatedClient.saldoFavor;
        updatedClient.saldoFavor += amount;
        log.push(
          `[Billetera Virtual] Se abonaron $${amount.toFixed(2)} al saldo a favor de ${updatedClient.nombre} (Saldo anterior: $${originalWallet.toFixed(2)}, Saldo actual: $${updatedClient.saldoFavor.toFixed(2)})`,
        );
        newWalletTransactions.push({
          id: genId('TX-WLT'),
          clientId: updatedClient.id,
          reservationId: newRes.id,
          type: 'Abono_Cancelacion',
          amount,
          status: 'Disponible',
          notes: reason,
          createdAt: new Date().toISOString(),
        });
      }
    };

    const applyDebitToClient = (amount: number, reason: string) => {
      if (!updatedClient) return;
      const originalDebt = updatedClient.saldoDeber;
      updatedClient.saldoDeber += amount;
      log.push(
        `[Suplemento B2B] Se incrementó la deuda de ${updatedClient.nombre} por $${amount.toFixed(2)} (Deuda anterior: $${originalDebt.toFixed(2)}, Deuda actual: $${updatedClient.saldoDeber.toFixed(2)})`,
      );
      if (!isCreditClient && updatedClient.saldoFavor > 0) {
        const applyAmount = Math.min(updatedClient.saldoFavor, updatedClient.saldoDeber);
        updatedClient.saldoFavor -= applyAmount;
        updatedClient.saldoDeber -= applyAmount;
        log.push(
          `[Billetera Virtual] Se aplicaron automáticamente $${applyAmount.toFixed(2)} del saldo a favor de ${updatedClient.nombre} para pagar el suplemento.`,
        );
        newWalletTransactions.push({
          id: genId('TX-WLT'),
          clientId: updatedClient.id,
          reservationId: newRes.id,
          type: 'Cargo_Pago',
          amount: applyAmount,
          status: 'Disponible',
          notes: `Pago automático de suplemento: ${reason}`,
          createdAt: new Date().toISOString(),
        });
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
              applyDebitToClient(deltaSale, `Suplemento tarifa: ${sNew.descripcion}`);
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
          log.push(`[Servicio Adicional] Nuevo servicio "${sNew.descripcion}" agregado.`);
          const variation: FinancialVariation = {
            id: genId('VAR-SUP'),
            reservationId: newRes.id,
            serviceItemId: sNew.id,
            type: 'Suplemento',
            amountNet: sNew.precioNeto,
            amountSale: sNew.precioVenta,
            reason: `Servicio adicional: ${sNew.descripcion}`,
            date: new Date().toISOString().split('T')[0],
          };
          newVariations.push(variation);
          currentVariations.push(variation);
          applyDebitToClient(sNew.precioVenta, `Servicio adicional: ${sNew.descripcion}`);

          const newOblId = genId('OBL');
          const newObl: PayableObligation = {
            id: newOblId,
            dueDate: newRes.checkIn,
            providerName: sNew.proveedor || 'Proveedor Desconocido',
            serviceDetail: `${sNew.tipo}: ${sNew.descripcion}`,
            locatorId: newRes.id,
            netCost: sNew.precioNeto,
            paidAmount: 0,
            status: 'Pendiente',
            date: new Date().toISOString().split('T')[0],
            currency: 'USD',
            updatedAt: new Date().toISOString(),
          };
          updatedPayableObligations.unshift(newObl);
          log.push(`[Cuentas por Pagar] Se creó la obligación ${newOblId} para el nuevo servicio.`);
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
