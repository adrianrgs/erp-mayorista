import { Reservation, ServiceItem, B2BClient, DirectClient, PayableObligation, FinancialVariation, B2BWalletTransaction } from "../types";
import { nextSequentialId } from "./idGenerator";
import { getOperatingCurrency, formatCurrency } from "./taxEngine";

export type UpdatedClientRef =
  | { kind: "B2B"; client: B2BClient }
  | { kind: "Directo"; client: DirectClient };

export interface ReconciliationResult {
  updatedRes: Reservation;
  updatedClient: UpdatedClientRef | null;
  updatedPayableObligations: PayableObligation[];
  newWalletTransactions: B2BWalletTransaction[];
  newVariations: FinancialVariation[];
  // Servicios agregados a una reserva YA facturada. No generan efecto financiero aquí (se
  // difieren a Facturación para no cobrar doble); se reportan solo para dar visibilidad
  // (disparar el modal de impacto y mostrarse en el widget de la reserva).
  addedServices: ServiceItem[];
  log: string[];
}

/**
 * Reconciles the financial states when a reservation is created, updated, or cancelled.
 */
export function reconcileDossierUpdate(
  oldRes: Reservation,
  newRes: Reservation,
  clients: B2BClient[],
  directClients: DirectClient[],
  payableObligations: PayableObligation[]
): ReconciliationResult {
  const log: string[] = [];
  const newVariations: FinancialVariation[] = [];
  const newWalletTransactions: B2BWalletTransaction[] = [];
  const addedServices: ServiceItem[] = [];
  let updatedPayableObligations = [...payableObligations];

  // Find the client (B2B or Directo) associated with the reservation
  const isDirecto = (newRes.canalVenta || oldRes.canalVenta) === "Directo";
  let updatedClient: UpdatedClientRef | null = null;
  if (isDirecto) {
    const clienteDirectoId = newRes.clienteDirectoId || oldRes.clienteDirectoId;
    const dIndex = directClients.findIndex(c => c.id === clienteDirectoId);
    if (dIndex !== -1) updatedClient = { kind: "Directo", client: { ...directClients[dIndex] } };
  } else {
    const agencyName = newRes.agenciaName || oldRes.agenciaName;
    const clientIndex = clients.findIndex(c => c.nombre.toLowerCase() === (agencyName || "").toLowerCase());
    if (clientIndex !== -1) updatedClient = { kind: "B2B", client: { ...clients[clientIndex] } };
  }

  const isBilled = (oldRes.servicios || []).some(s => s.statusFacturacion === "Facturado");

  const oldServices = oldRes.servicios || [];
  const newServices = newRes.servicios || [];

  // Initialize variation array on newRes if not present
  const currentVariations = [...(oldRes.variaciones || [])];

  // Utility to generate unique ID. VAR- variations are numbered sequentially within this
  // reservation's own variaciones list (currentVariations already grows as they're created below).
  // TX-WLT has no persisted collection to check against, so it keeps the old random form.
  const genId = (prefix: string) =>
    prefix.startsWith("VAR-")
      ? nextSequentialId(prefix, currentVariations.map(v => v.id))
      : `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

  // HELPER: Register a credit event for logging only.
  // The actual saldoDeber / saldoFavor adjustment is computed in App.tsx where invoice and
  // voucher data is available to correctly split debt-clearance vs. overpayment-refund.
  const applyCreditToClient = (amount: number, reason: string) => {
    if (!updatedClient) return;
    log.push(`[Crédito Registrado] ${updatedClient.client.nombre}: ${formatCurrency(amount, getOperatingCurrency())} crédito pendiente de ajuste de saldo — ${reason}`);
  };

  // HELPER: Apply debit/supplement to client — auto-applies saldoFavor for all client types
  const applyDebitToClient = (amount: number, reason: string) => {
    if (!updatedClient) return;
    const client = updatedClient.client;

    // First, offset with any available saldo a favor
    if (client.saldoFavor > 0) {
      const autoApply = Math.min(client.saldoFavor, amount);
      client.saldoFavor -= autoApply;
      amount -= autoApply;
      log.push(`[Billetera Virtual] Se aplicaron ${formatCurrency(autoApply, getOperatingCurrency())} del saldo a favor de ${client.nombre} para pagar el suplemento.`);
      newWalletTransactions.push({
        id: genId("TX-WLT"),
        clientId: client.id,
        reservationId: newRes.id,
        type: "Cargo_Pago",
        amount: autoApply,
        status: "Disponible",
        notes: `Pago automático de suplemento: ${reason}`,
        createdAt: new Date().toISOString()
      });
    }

    if (amount > 0) {
      const previousDebt = client.saldoDeber;
      client.saldoDeber += amount;
      log.push(`[Suplemento] ${client.nombre}: deuda ${formatCurrency(previousDebt, getOperatingCurrency())}→${formatCurrency(client.saldoDeber, getOperatingCurrency())} (${reason})`);
    }
  };

  // SCENARIO 3: COMPLETE ANNULMENT (Reservation status transition to "Cancelada")
  if (newRes.status === "Cancelada" && oldRes.status !== "Cancelada") {
    log.push(`[Anulación Total] Expediente ${newRes.id} anulado por completo.`);
    
    // Cancel all services in the reservation
    const cancelledServices = newServices.map(s => ({
      ...s,
      status: "Cancelado" as const
    }));
    newRes.servicios = cancelledServices;

    if (isBilled) {
      // Calculate total billed amount to refund
      const totalRefund = oldServices
        .filter(s => s.statusFacturacion === "Facturado")
        .reduce((sum, s) => sum + s.precioVenta, 0);

      if (totalRefund > 0) {
        applyCreditToClient(totalRefund, `Reembolso por anulación total del expediente ${newRes.id}`);
        
        const variation: FinancialVariation = {
          id: genId("VAR-CR"),
          reservationId: newRes.id,
          type: "Credito",
          amountNet: -oldRes.netPrice,
          amountSale: -totalRefund,
          reason: "Anulación total del expediente",
          date: new Date().toISOString().split("T")[0]
        };
        newVariations.push(variation);
        currentVariations.push(variation);
      }
    }

    // Freeze all payable obligations linked to this locator
    updatedPayableObligations = updatedPayableObligations.map(obl => {
      if (obl.locatorId === newRes.id) {
        const isAlreadyPaid = obl.paidAmount > 0;
        const newStatus = isAlreadyPaid ? "Congelado" as const : "Congelado" as const;
        
        log.push(`[Cuentas por Pagar] Obligación ${obl.id} (${obl.providerName}) congelada. (Monto pagado: ${formatCurrency(obl.paidAmount, getOperatingCurrency())})`);
        
        return {
          ...obl,
          status: newStatus,
          isFrozen: true,
          notes: `${obl.notes || ""}\n[Bloqueado] Reserva anulada. Verificar penalidad del proveedor.`
        };
      }
      return obl;
    });

    newRes.variaciones = currentVariations;
    return {
      updatedRes: newRes,
      updatedClient,
      updatedPayableObligations,
      newWalletTransactions,
      newVariations,
      addedServices,
      log
    };
  }

  // SCENARIOS 1 & 2: PARTIAL CANCELLATIONS AND PRICE VARIATIONS
  if (isBilled) {
    // 1. Process deletions or cancellations of services
    oldServices.forEach(sOld => {
      const sNew = newServices.find(s => s.id === sOld.id);
      const isNowCancelled = !sNew || sNew.status === "Cancelado";
      const wasCancelled = sOld.status === "Cancelado";

      if (isNowCancelled && !wasCancelled && sOld.statusFacturacion === "Facturado") {
        // Service cancelled!
        log.push(`[Cancelación Parcial] Servicio "${sOld.descripcion}" cancelado.`);
        applyCreditToClient(sOld.precioVenta, `Cancelación de servicio: ${sOld.descripcion}`);

        // Register financial variation
        const variation: FinancialVariation = {
          id: genId("VAR-CR"),
          reservationId: newRes.id,
          serviceItemId: sOld.id,
          type: "Credito",
          amountNet: -sOld.precioNeto,
          amountSale: -sOld.precioVenta,
          reason: `Cancelación: ${sOld.descripcion}`,
          date: new Date().toISOString().split("T")[0]
        };
        newVariations.push(variation);
        currentVariations.push(variation);

        // Reconcile Accounts Payable for this service item
        updatedPayableObligations = updatedPayableObligations.map(obl => {
          if (
            obl.locatorId === oldRes.id &&
            (obl.serviceDetail.toLowerCase().includes(sOld.descripcion.toLowerCase()) ||
             obl.providerName.toLowerCase().includes((sOld.proveedor || "").toLowerCase()))
          ) {
            log.push(`[Cuentas por Pagar] Obligación ${obl.id} asociada a servicio cancelado congelada.`);
            return {
              ...obl,
              status: "Congelado" as const,
              isFrozen: true,
              notes: `${obl.notes || ""}\n[Bloqueado] Servicio cancelado en reserva. Verificar penalidad.`
            };
          }
          return obl;
        });
      }
    });

    // 2. Process modifications (price deltas) and additions of new services
    newServices.forEach(sNew => {
      const sOld = oldServices.find(s => s.id === sNew.id);

      if (sOld) {
        // Price modification
        const deltaSale = sNew.precioVenta - sOld.precioVenta;
        const deltaNet = sNew.precioNeto - sOld.precioNeto;

        if ((deltaSale !== 0 || deltaNet !== 0) && sOld.statusFacturacion === "Facturado") {
          log.push(`[Modificación Tarifa] Servicio "${sNew.descripcion}" varió de precio. Delta venta: ${formatCurrency(deltaSale, getOperatingCurrency())}, Delta neto: ${formatCurrency(deltaNet, getOperatingCurrency())}`);

          // ── Impacto al CLIENTE: SOLO si cambió el PRECIO DE VENTA ──
          // Si únicamente cambió el costo neto (p.ej. se ajustó la comisión), el cliente paga
          // exactamente lo mismo → NO se genera suplemento ni crédito. (Antes, con deltaSale = 0,
          // se creaba una variación "Crédito" de $0 que terminaba emitiendo una nota de crédito de $0.)
          if (deltaSale !== 0) {
            const varType = deltaSale > 0 ? "Suplemento" as const : "Credito" as const;

            const variation: FinancialVariation = {
              id: genId("VAR-MOD"),
              reservationId: newRes.id,
              serviceItemId: sNew.id,
              type: varType,
              amountNet: deltaNet,
              amountSale: deltaSale,
              reason: `Modificación tarifa: ${sNew.descripcion}`,
              date: new Date().toISOString().split("T")[0],
              // Tanto suplementos como créditos por modificación de tarifa quedan en "Borrador" —
              // invisibles para Facturación (y sin impacto en el saldo del cliente) hasta que el
              // operador de Reservas los envíe explícitamente con "Enviar a Facturación".
              status: "Borrador"
            };
            newVariations.push(variation);
            currentVariations.push(variation);

            if (deltaSale > 0) {
              // Supplement: balance update deferred to FacturacionView when user approves billing
              log.push(`[Suplemento Pendiente] ${formatCurrency(deltaSale, getOperatingCurrency())} sobre "${sNew.descripcion}" — pendiente de enviar a Facturación.`);
            } else {
              applyCreditToClient(Math.abs(deltaSale), `Crédito por rebaja tarifa: ${sNew.descripcion}`);
            }
          }

          // ── Impacto al PROVEEDOR: si cambió el COSTO NETO ──
          if (deltaNet !== 0) {
            // Ajusta la obligación existente del servicio, si la hay.
            let matchedObligation = false;
            updatedPayableObligations = updatedPayableObligations.map(obl => {
              if (
                obl.locatorId === oldRes.id &&
                (obl.serviceDetail.toLowerCase().includes(sNew.descripcion.toLowerCase()) ||
                 obl.providerName.toLowerCase().includes((sNew.proveedor || "").toLowerCase()))
              ) {
                matchedObligation = true;
                const newNet = Math.max(0, obl.netCost + deltaNet);
                log.push(`[Cuentas por Pagar] Obligación ${obl.id} ajustada neto de ${formatCurrency(obl.netCost, getOperatingCurrency())} a ${formatCurrency(newNet, getOperatingCurrency())}`);
                return {
                  ...obl,
                  netCost: newNet,
                  status: obl.paidAmount >= newNet ? ("Pagado Total" as const) : obl.paidAmount > 0 ? ("Pagado Parcial" as const) : ("Pendiente" as const)
                };
              }
              return obl;
            });

            // Si el servicio se facturó SIN costo neto (p.ej. 100% de comisión → neto $0, sin
            // obligación) y ahora sí tiene costo real, se CREA la cuenta por pagar que faltaba.
            if (!matchedObligation && sNew.precioNeto > 0.01 && sOld.precioNeto < 0.01 && (sNew.proveedor || "").trim()) {
              const newObl: PayableObligation = {
                id: nextSequentialId("PAY", updatedPayableObligations.map(o => o.id)),
                dueDate: newRes.checkIn || new Date().toISOString().split("T")[0],
                providerName: (sNew.proveedor || "").trim(),
                serviceDetail: sNew.descripcion,
                locatorId: newRes.id,
                netCost: sNew.precioNeto,
                paidAmount: 0,
                status: "Pendiente",
                date: new Date().toISOString().split("T")[0],
                currency: getOperatingCurrency(),
              };
              updatedPayableObligations = [...updatedPayableObligations, newObl];
              log.push(`[Cuentas por Pagar] Nueva obligación ${newObl.id} creada para "${sNew.descripcion}" (${newObl.providerName}) por ${formatCurrency(newObl.netCost, getOperatingCurrency())} — el servicio pasó de costo neto 0 a costo real.`);
            }
          }
        }
      } else {
        // New service detected — financial effects (obligation, client debit) are handled
        // exclusively by FacturacionView when the service is billed. Processing them here
        // would cause double-charging since FacturacionView always runs for billing approval.
        // Se reporta (sin efecto financiero) para dar visibilidad en el modal de impacto y el widget.
        addedServices.push(sNew);
        log.push(`[Nuevo Servicio] "${sNew.descripcion}" (${sNew.statusFacturacion}) detectado. Pendiente de aprobación en Facturación.`);
      }
    });
  }

  // Recalculate totals of newRes based on current confirmed/modified services
  const activeConfirmedServices = newServices.filter(s => s.status !== "Cancelado");
  newRes.totalPrice = activeConfirmedServices.reduce((sum, s) => sum + s.precioVenta, 0);
  newRes.netPrice = activeConfirmedServices.reduce((sum, s) => sum + s.precioNeto, 0);

  // If reservation total has changed, log adjustment
  log.push(`[Recálculo Reserva] Total expediente recalculado: ${formatCurrency(newRes.totalPrice, getOperatingCurrency())} (Neto: ${formatCurrency(newRes.netPrice, getOperatingCurrency())})`);

  newRes.variaciones = currentVariations;

  return {
    updatedRes: newRes,
    updatedClient,
    updatedPayableObligations,
    newWalletTransactions,
    newVariations,
    addedServices,
    log
  };
}
