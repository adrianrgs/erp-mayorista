import {
  FinancialInvoice,
  PaymentVoucher,
  PayableObligation,
  WithholdingCertificate,
  ExchangeRate,
  JournalEntry,
} from "../types";
import { TaxJurisdiction } from "./taxEngine";
import { round2 } from "./money";

// ─────────────────────────────────────────────────────────────────────────────
// Libro Diario (partida doble) DERIVADO en vivo de las fuentes de verdad.
// No se persiste: se recalcula a partir de facturas, cobros (vouchers), pagos a
// proveedor (obligaciones) y retenciones. Así nunca hay drift ni eventos perdidos.
//
// Cada asiento cuadra: Σ débitos = Σ créditos (todos los montos con round2).
// ─────────────────────────────────────────────────────────────────────────────

// Plan de cuentas mínimo (códigos estilo VEN-NIF, ajustables).
export const ACCOUNTS = {
  BANCO:        { code: "1101", name: "Banco / Caja" },
  CXC:          { code: "1102", name: "Cuentas por Cobrar" },
  IVA_RET_CLI:  { code: "1104", name: "IVA Retenido por Clientes (anticipo)" },
  ISLR_RET_CLI: { code: "1105", name: "ISLR Retenido por Clientes (anticipo)" },
  CXP:          { code: "2101", name: "Cuentas por Pagar" },
  IVA_DEBITO:   { code: "2103", name: "IVA Débito Fiscal por Pagar" },
  IGTF_PAGAR:   { code: "2105", name: "Recargo (IGTF) por Pagar" },
  INGRESOS:     { code: "4101", name: "Ingresos por Ventas" },
} as const;

// Tasa de cambio vigente para una fecha (a la moneda local). Usa la del día, o la
// más reciente anterior; si no hay ninguna devuelve 0 (informativo, no rompe cuadre).
function rateForDate(date: string, localCurrency: string, rates: ExchangeRate[]): number {
  const rel = rates
    .filter(r => r.toCurrency === localCurrency && r.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date));
  return rel[0]?.rate ?? 0;
}

export function buildLedger(
  invoices: FinancialInvoice[],
  vouchers: PaymentVoucher[],
  obligations: PayableObligation[],
  certs: WithholdingCertificate[],
  jurisdiction: TaxJurisdiction,
  exchangeRates: ExchangeRate[],
): JournalEntry[] {
  const lc = jurisdiction.localCurrency;
  const tc = (d: string) => rateForDate(d, lc, exchangeRates);
  const entries: JournalEntry[] = [];

  // ── 1) Reconocimiento de ingreso (emisión de facturas de venta FAC-/SUP-) ──
  //    Nota de crédito (NC-, monto negativo) genera el asiento inverso.
  invoices.forEach(inv => {
    if (inv.type !== "Cobro") return;
    const id = inv.id ?? "";
    if ((inv.clientName ?? "").startsWith("Recibo de Cobro")) return; // es un cobro, no una venta
    if (id.startsWith("ABO-") || id.startsWith("RET-")) return;       // no son ventas

    const esNC = id.startsWith("NC-");
    const esVenta = id.startsWith("FAC-") || id.startsWith("SUP-");
    if (!esNC && !esVenta) return;

    const total = round2(Math.abs(inv.amount));
    if (total <= 0) return;
    const iva = round2(Math.abs(inv.vatAmount ?? 0));
    const igtf = round2(Math.abs(inv.surchargeAmount ?? 0));
    const ingreso = round2(total - iva - igtf);

    const lines = esNC
      ? [
          // Reversa: se anula el ingreso y el IVA débito, se acredita la CxC.
          { account: ACCOUNTS.INGRESOS.code,   name: ACCOUNTS.INGRESOS.name,   debit: ingreso, credit: 0 },
          ...(iva > 0  ? [{ account: ACCOUNTS.IVA_DEBITO.code, name: ACCOUNTS.IVA_DEBITO.name, debit: iva,  credit: 0 }] : []),
          ...(igtf > 0 ? [{ account: ACCOUNTS.IGTF_PAGAR.code, name: ACCOUNTS.IGTF_PAGAR.name, debit: igtf, credit: 0 }] : []),
          { account: ACCOUNTS.CXC.code, name: ACCOUNTS.CXC.name, debit: 0, credit: total },
        ]
      : [
          { account: ACCOUNTS.CXC.code, name: ACCOUNTS.CXC.name, debit: total, credit: 0 },
          { account: ACCOUNTS.INGRESOS.code, name: ACCOUNTS.INGRESOS.name, debit: 0, credit: ingreso },
          ...(iva > 0  ? [{ account: ACCOUNTS.IVA_DEBITO.code, name: ACCOUNTS.IVA_DEBITO.name, debit: 0, credit: iva }]  : []),
          ...(igtf > 0 ? [{ account: ACCOUNTS.IGTF_PAGAR.code, name: ACCOUNTS.IGTF_PAGAR.name, debit: 0, credit: igtf }] : []),
        ];

    entries.push({
      id: `JE-${id}`,
      date: inv.date,
      description: esNC ? `Nota de crédito ${id} — ${inv.clientName}` : `Venta ${id} — ${inv.clientName}`,
      type: "INCOME_RECOGNITION",
      reference: inv.reservationId || id,
      exchangeRate: tc(inv.date),
      lines,
    });
  });

  // ── 2) Cobros (comprobantes de pago verificados) ──
  //    Débito Banco / Crédito Cuentas por Cobrar.
  vouchers.forEach(v => {
    if (v.status !== "Verificado") return;
    const monto = round2(v.amount);
    if (monto <= 0) return;
    entries.push({
      id: `JE-COB-${v.id}`,
      date: v.date,
      description: `Cobro ${v.invoiceId ? `de ${v.invoiceId}` : ""} — ${v.clientName}`.trim(),
      type: "DEPOSIT",
      reference: v.invoiceId || v.locatorId || v.id,
      exchangeRate: tc(v.date),
      lines: [
        { account: ACCOUNTS.BANCO.code, name: ACCOUNTS.BANCO.name, debit: monto, credit: 0 },
        { account: ACCOUNTS.CXC.code,   name: ACCOUNTS.CXC.name,   debit: 0, credit: monto },
      ],
    });
  });

  // ── 3) Pagos a proveedor (obligaciones con monto pagado) ──
  //    Débito Cuentas por Pagar / Crédito Banco.
  obligations.forEach(o => {
    if (o.status === "Anulado" || o.status === "Congelado") return;
    const pagado = round2(o.paidAmount ?? 0);
    if (pagado <= 0) return;
    const fecha = o.date ?? o.dueDate;
    entries.push({
      id: `JE-PAG-${o.id}`,
      date: fecha,
      description: `Pago a proveedor — ${o.providerName}${o.serviceDetail ? ` (${o.serviceDetail})` : ""}`,
      type: "SUPPLIER_PAYMENT",
      reference: o.locatorId || o.id,
      exchangeRate: tc(fecha),
      lines: [
        { account: ACCOUNTS.CXP.code,   name: ACCOUNTS.CXP.name,   debit: pagado, credit: 0 },
        { account: ACCOUNTS.BANCO.code, name: ACCOUNTS.BANCO.name, debit: 0, credit: pagado },
      ],
    });
  });

  // ── 4) Retenciones que nos practican los clientes ──
  //    Débito Anticipo (IVA/ISLR retenido) / Crédito Cuentas por Cobrar.
  certs.forEach(c => {
    const monto = round2(c.amountWithheld);
    if (monto <= 0) return;
    const cuenta = c.type === "VAT" ? ACCOUNTS.IVA_RET_CLI : ACCOUNTS.ISLR_RET_CLI;
    entries.push({
      id: `JE-RET-${c.id}`,
      date: c.date,
      description: `Retención ${c.type === "VAT" ? (jurisdiction.taxName || "IVA") : (jurisdiction.incomeTaxWithholdingLabel || "ISLR")} ${c.percentage}% — ${c.clientName}`,
      type: "WITHHOLDING",
      reference: c.invoiceId || c.number,
      exchangeRate: tc(c.date),
      lines: [
        { account: cuenta.code,       name: cuenta.name,       debit: monto, credit: 0 },
        { account: ACCOUNTS.CXC.code, name: ACCOUNTS.CXC.name, debit: 0, credit: monto },
      ],
    });
  });

  // Orden cronológico descendente (más reciente primero).
  return entries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}
