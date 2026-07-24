import { FinancialInvoice, PaymentVoucher, Reservation } from "../types";

// Extrae el localizador (RES-x / AER-x) del nombre/descripción de una factura.
export function extractLocator(name: string): string {
  const m = name.match(/Localizador\s+([A-Z]{2,4}-\d+)/i) || name.match(/\b((?:RES|AER)-\d+)\b/);
  return m ? m[1].toUpperCase() : "";
}

// Ids de facturas de venta (FAC-) que fueron cobradas mediante un "Recibo de Cobro" (referenciadas
// en el nombre del recibo). Al pagar una factura a crédito se marca la FAC como Pagada Y se crea un
// recibo (también Pagado); esto permite NO contar las dos como cobros distintos (doble conteo).
export function facturasConReciboDeCobro(invoices: FinancialInvoice[]): Set<string> {
  const set = new Set<string>();
  invoices.forEach(i => {
    if ((i.clientName ?? "").startsWith("Recibo de Cobro")) {
      (i.clientName.match(/FAC-\d+/g) || []).forEach(ref => set.add(ref));
    }
  });
  return set;
}

// ¿Esta factura de venta (FAC-) debe EXCLUIRSE del conteo de cobros porque su cobro ya está
// representado por un "Recibo de Cobro"? (Evita contar la factura Y el recibo.)
export function esFacturaCobradaPorRecibo(inv: FinancialInvoice, facsConRecibo: Set<string>): boolean {
  return (inv.id ?? "").startsWith("FAC-")
    && !(inv.clientName ?? "").startsWith("Recibo de Cobro")
    && facsConRecibo.has(inv.id);
}

export interface InvoiceNet { paid: number; ncApplied: number; remaining: number; }

// Neto por factura: descuenta pagos verificados y notas de crédito (NC-) por localizador.
// Misma lógica que usan CobranzasB2BPanel / CobranzasDirectosPanel (extraída para reutilizar).
export function computeNetByInvoice(
  invoices: FinancialInvoice[],
  vouchers: PaymentVoucher[],
): Record<string, InvoiceNet> {
  const ncByLoc: Record<string, number> = {};
  invoices.forEach(inv => {
    if (inv.type === "Cobro" && inv.id.startsWith("NC-") && inv.amount < 0) {
      const loc = extractLocator(inv.clientName);
      if (loc) ncByLoc[loc] = (ncByLoc[loc] || 0) + Math.abs(inv.amount);
    }
  });
  const ncLeft: Record<string, number> = { ...ncByLoc };
  const result: Record<string, InvoiceNet> = {};
  invoices.forEach(inv => {
    if (!inv.id.startsWith("FAC-") || inv.type !== "Cobro") return;
    const paid = vouchers
      .filter(v => v.invoiceId === inv.id && v.status === "Verificado")
      .reduce((s, v) => s + v.amount, 0);
    let remaining = Math.max(0, inv.amount - paid);
    let ncApplied = 0;
    const isUnpaid = inv.status === "Facturado" || inv.status === "Vencido";
    const loc = extractLocator(inv.clientName);
    if (isUnpaid && loc && ncLeft[loc] > 0 && remaining > 0) {
      ncApplied = Math.min(remaining, ncLeft[loc]);
      remaining -= ncApplied;
      ncLeft[loc] -= ncApplied;
    }
    result[inv.id] = { paid, ncApplied, remaining };
  });
  return result;
}

// Facturas-cargo de un expediente (FAC-/SUP-), excluyendo recibos de cobro y notas de crédito.
export function reservationChargeInvoices(res: Reservation, invoices: FinancialInvoice[]): FinancialInvoice[] {
  return invoices.filter(inv =>
    inv.type === "Cobro" &&
    (inv.id.startsWith("FAC-") || inv.id.startsWith("SUP-")) &&
    !inv.clientName.startsWith("Recibo de Cobro") &&
    (inv.reservationId === res.id || inv.clientName.includes(res.id))
  );
}

const todayStr = () => new Date().toISOString().split("T")[0];
function daysBetween(fromDay: string, toDay: string): number | null {
  const a = new Date(fromDay + "T00:00:00").getTime();
  const b = new Date(toDay + "T00:00:00").getTime();
  if (isNaN(a) || isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

export interface ReservationReceivableLine {
  inv: FinancialInvoice;
  paid: number;
  ncApplied: number;
  remaining: number;
  vencida: boolean;
}

export interface ReservationReceivable {
  hasDebt: boolean;
  billed: boolean;          // ¿ya tiene facturas emitidas?
  totalCargos: number;      // suma facturada (o total de venta si aún no se factura)
  abonado: number;
  ncTotal: number;
  saldo: number;            // pendiente neto
  dueDate?: string;         // vencimiento más próximo con saldo (o check-in si no hay factura)
  daysUntilDue: number | null;
  isOverdue: boolean;       // vencido (con saldo)
  isNear: boolean;          // vence en <= alertDays (con saldo)
  lines: ReservationReceivableLine[];
}

// Resumen de cobranza + alerta de vencimiento de un expediente.
// Si aún no se factura, considera el total de venta como pendiente y el check-in como vencimiento
// (recordatorio para facturar/cobrar antes del viaje).
export function getReservationReceivable(
  res: Reservation,
  invoices: FinancialInvoice[],
  vouchers: PaymentVoucher[],
  alertDays = 7,
): ReservationReceivable {
  const today = todayStr();
  const net = computeNetByInvoice(invoices, vouchers);
  const charges = reservationChargeInvoices(res, invoices);
  const billed = charges.length > 0;

  const lines: ReservationReceivableLine[] = charges.map(inv => {
    const paidFallback = vouchers
      .filter(v => v.invoiceId === inv.id && v.status === "Verificado")
      .reduce((s, v) => s + v.amount, 0);
    const n = net[inv.id] || { paid: paidFallback, ncApplied: 0, remaining: Math.max(0, inv.amount - paidFallback) };
    const vencida = (inv.status === "Vencido" || (!!inv.dueDate && inv.dueDate < today)) && n.remaining > 0.005;
    return { inv, ...n, vencida };
  });

  let totalCargos: number, abonado: number, ncTotal: number, saldo: number, dueDate: string | undefined;

  if (billed) {
    totalCargos = lines.reduce((s, l) => s + l.inv.amount, 0);
    abonado = lines.reduce((s, l) => s + l.paid, 0);
    ncTotal = lines.reduce((s, l) => s + l.ncApplied, 0);
    saldo = lines.reduce((s, l) => s + l.remaining, 0);
    const pend = lines.filter(l => l.remaining > 0.005 && l.inv.dueDate).map(l => l.inv.dueDate!).sort();
    dueDate = pend[0];
  } else {
    // Sin facturar: el total de venta queda pendiente y el vencimiento de referencia es el check-in.
    const activo = res.status !== "Cancelada";
    totalCargos = activo ? (res.totalPrice || 0) : 0;
    abonado = 0;
    ncTotal = 0;
    saldo = totalCargos;
    dueDate = res.checkIn || undefined;
  }

  const hasDebt = saldo > 0.005;
  const daysUntilDue = dueDate ? daysBetween(today, dueDate) : null;
  const isOverdue = hasDebt && daysUntilDue !== null && daysUntilDue < 0;
  const isNear = hasDebt && daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= alertDays;

  return { hasDebt, billed, totalCargos, abonado, ncTotal, saldo, dueDate, daysUntilDue, isOverdue, isNear, lines };
}
