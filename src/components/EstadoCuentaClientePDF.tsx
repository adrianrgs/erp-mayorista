import React from "react";
import { FinancialInvoice, PaymentVoucher, CompanyConfig } from "../types";
import { formatCurrency, getOperatingCurrency } from "../lib/taxEngine";

// (PaymentVoucher se usa para listar los abonos recibidos con su fecha.)

// Forma mínima estructural del cliente (sirve tanto para B2BClient como DirectClient).
interface StatementClient {
  id: string;
  nombre: string;
  saldoDeber: number;
  saldoFavor: number;
  limiteCredito?: number;
  email?: string;
  telefono?: string;
}

interface Props {
  client: StatementClient;
  taxId?: string;           // RIF (B2B) o cédula (Directo)
  taxIdLabel?: string;      // etiqueta: "RIF" | "Cédula" | ...
  invoices: FinancialInvoice[];
  vouchers?: PaymentVoucher[];
  netByInvoice: Record<string, { paid: number; ncApplied: number; remaining: number }>;
  companyConfig: CompanyConfig;
  elementId?: string;       // id del contenedor imprimible (default "estado-cuenta-content")
}

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return d;
  }
};

const extractExpediente = (inv: FinancialInvoice): string => {
  if (inv.reservationId) return inv.reservationId;
  const m = inv.clientName.match(/\b((?:RES|AER)-\d+)\b/);
  return m ? m[1] : "—";
};

export default function EstadoCuentaClientePDF({
  client, taxId, taxIdLabel = "RIF", invoices, vouchers = [], netByInvoice, companyConfig, elementId = "estado-cuenta-content",
}: Props) {
  const cur = getOperatingCurrency();
  const money = (n: number) => formatCurrency(n, cur);
  const today = new Date().toISOString().slice(0, 10);

  // Abonos (pagos verificados) del cliente, con su fecha.
  const abonos = vouchers
    .filter(v => v.status === "Verificado" && v.clientId === client.id)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  // Facturas por cobrar del cliente con saldo pendiente (mismo criterio de match que el panel).
  // isUnpaid excluye los "Recibos de Cobro" (facturas type "Cobro" con status "Pagado" que se
  // generan al registrar un pago): NO son deuda, son el comprobante del abono. Sin este filtro,
  // el abono aparecía como una factura nueva (FAC-2) y duplicaba el saldo.
  const rows = invoices
    .filter(inv =>
      inv.type === "Cobro" &&
      inv.id.startsWith("FAC-") &&
      (inv.status === "Facturado" || inv.status === "Vencido") &&
      (inv.clientId === client.id || inv.clientName.toLowerCase().includes(client.nombre.toLowerCase()))
    )
    .map(inv => {
      const net = netByInvoice[inv.id] || { paid: 0, ncApplied: 0, remaining: Math.max(0, inv.amount) };
      const vencida = inv.status === "Vencido" || (!!inv.dueDate && inv.dueDate < today);
      return { inv, ...net, vencida };
    })
    .filter(r => r.remaining > 0.005)
    .sort((a, b) => (a.inv.dueDate || "").localeCompare(b.inv.dueDate || ""));

  const totalMonto = rows.reduce((s, r) => s + r.inv.amount, 0);
  const totalAbonado = rows.reduce((s, r) => s + r.paid, 0);
  const totalNC = rows.reduce((s, r) => s + r.ncApplied, 0);
  const totalSaldo = rows.reduce((s, r) => s + r.remaining, 0);
  const vencido = rows.filter(r => r.vencida).reduce((s, r) => s + r.remaining, 0);
  const porVencer = totalSaldo - vencido;

  const th = "text-left font-black text-zinc-500 uppercase tracking-wider text-[8px] px-2 py-1.5 border-b border-zinc-300";
  const td = "px-2 py-1.5 border-b border-zinc-100 align-top";

  return (
    <div id={elementId} className="print-receipt bg-white text-zinc-900" style={{ fontFamily: "system-ui, sans-serif", fontSize: "11px", maxWidth: "820px", margin: "0 auto", padding: "24px" }}>
      {/* Header empresa + título */}
      <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4 mb-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded bg-zinc-950 text-white flex items-center justify-center font-black text-lg flex-shrink-0">
            {companyConfig.logoLetter}
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-zinc-950 uppercase leading-none">{companyConfig.name}</h1>
            <p className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">{companyConfig.subtitle}</p>
            <p className="text-[8.5px] text-zinc-500 mt-1 leading-tight">
              {companyConfig.rif && <>RIF: {companyConfig.rif}<br /></>}
              {companyConfig.address}<br />
              {companyConfig.phone}{companyConfig.email ? ` · ${companyConfig.email}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-zinc-950 text-white font-black text-sm rounded tracking-wider uppercase">
            Estado de Cuenta
          </div>
          <p className="text-[9px] font-bold text-zinc-400 mt-2 uppercase tracking-wider">
            Emitido: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
            totalSaldo > 0.005 ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}>
            {totalSaldo > 0.005 ? "● Con Saldo Pendiente" : "● Cuenta al Día"}
          </span>
        </div>
      </div>

      {/* Datos del cliente + resumen */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <div className="col-span-5 bg-zinc-50 border border-zinc-200 rounded-lg p-3">
          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-wider mb-1">Cliente</p>
          <p className="font-black text-sm text-zinc-900 uppercase leading-tight">{client.nombre}</p>
          {taxId && <p className="text-[9px] font-mono text-zinc-600 mt-0.5">{taxIdLabel}: {taxId}</p>}
          {(client.email || client.telefono) && (
            <p className="text-[8.5px] text-zinc-500 mt-1">{[client.telefono, client.email].filter(Boolean).join(" · ")}</p>
          )}
        </div>
        <div className="col-span-7 grid grid-cols-3 gap-2">
          <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-center">
            <p className="text-[7.5px] font-black text-red-500 uppercase tracking-wider">Deuda Total</p>
            <p className="font-black text-red-700 text-sm font-mono mt-0.5">{money(client.saldoDeber)}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-center">
            <p className="text-[7.5px] font-black text-emerald-600 uppercase tracking-wider">Saldo a Favor</p>
            <p className="font-black text-emerald-700 text-sm font-mono mt-0.5">{money(client.saldoFavor)}</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-center">
            <p className="text-[7.5px] font-black text-zinc-400 uppercase tracking-wider">Límite Crédito</p>
            <p className="font-black text-zinc-700 text-sm font-mono mt-0.5">{money(client.limiteCredito || 0)}</p>
          </div>
        </div>
      </div>

      {/* Tabla de facturas pendientes */}
      <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1.5">Detalle de Facturas Pendientes</p>
      {rows.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center text-emerald-700 font-bold text-xs">
          Sin saldos pendientes. La cuenta está al día. ✓
        </div>
      ) : (
        <table className="w-full border-collapse" style={{ fontSize: "9.5px" }}>
          <thead>
            <tr className="bg-zinc-50">
              <th className={th}>Nº Factura</th>
              <th className={th}>Expediente</th>
              <th className={th}>Emisión</th>
              <th className={th}>Vence</th>
              <th className={`${th} text-right`}>Monto</th>
              <th className={`${th} text-right`}>Abonado</th>
              <th className={`${th} text-right`}>N. Créd.</th>
              <th className={`${th} text-right`}>Saldo</th>
              <th className={`${th} text-center`}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.inv.id}>
                <td className={`${td} font-mono font-bold text-zinc-800`}>{r.inv.fiscalDocNumber || r.inv.id}</td>
                <td className={`${td} font-mono text-zinc-500`}>{extractExpediente(r.inv)}</td>
                <td className={`${td} text-zinc-600`}>{fmtDate(r.inv.date)}</td>
                <td className={`${td} text-zinc-600`}>{fmtDate(r.inv.dueDate)}</td>
                <td className={`${td} text-right font-mono`}>{money(r.inv.amount)}</td>
                <td className={`${td} text-right font-mono text-emerald-700`}>{r.paid > 0 ? money(r.paid) : "—"}</td>
                <td className={`${td} text-right font-mono text-zinc-500`}>{r.ncApplied > 0 ? money(r.ncApplied) : "—"}</td>
                <td className={`${td} text-right font-mono font-black text-red-700`}>{money(r.remaining)}</td>
                <td className={`${td} text-center`}>
                  <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase ${r.vencida ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {r.vencida ? "Vencido" : "Por vencer"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-100 font-black">
              <td className={`${td} border-t-2 border-zinc-400`} colSpan={4}>TOTALES ({rows.length} factura{rows.length !== 1 ? "s" : ""})</td>
              <td className={`${td} border-t-2 border-zinc-400 text-right font-mono`}>{money(totalMonto)}</td>
              <td className={`${td} border-t-2 border-zinc-400 text-right font-mono text-emerald-700`}>{money(totalAbonado)}</td>
              <td className={`${td} border-t-2 border-zinc-400 text-right font-mono text-zinc-500`}>{money(totalNC)}</td>
              <td className={`${td} border-t-2 border-zinc-400 text-right font-mono text-red-700`}>{money(totalSaldo)}</td>
              <td className={`${td} border-t-2 border-zinc-400`}></td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Aging + total a pagar */}
      {rows.length > 0 && (
        <div className="flex justify-between items-end mt-4 gap-4">
          <div className="flex gap-2">
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <p className="text-[7.5px] font-black text-red-500 uppercase tracking-wider">Vencido</p>
              <p className="font-black text-red-700 text-xs font-mono mt-0.5">{money(vencido)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <p className="text-[7.5px] font-black text-amber-600 uppercase tracking-wider">Por Vencer</p>
              <p className="font-black text-amber-700 text-xs font-mono mt-0.5">{money(porVencer)}</p>
            </div>
          </div>
          <div className="bg-zinc-950 text-white rounded-lg px-4 py-2.5 text-right">
            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Total a Pagar</p>
            <p className="font-black text-lg font-mono leading-none mt-0.5">{money(totalSaldo)}</p>
            {client.saldoFavor > 0.005 && (
              <p className="text-[8px] text-emerald-400 mt-1">Aplicando saldo a favor: {money(Math.max(0, totalSaldo - client.saldoFavor))}</p>
            )}
          </div>
        </div>
      )}

      {/* Abonos recibidos (con fecha) */}
      {abonos.length > 0 && (
        <div className="mt-4">
          <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1.5">Pagos / Abonos Recibidos</p>
          <table className="w-full border-collapse" style={{ fontSize: "9.5px" }}>
            <thead>
              <tr className="bg-zinc-50">
                <th className={th}>Fecha</th>
                <th className={th}>Método</th>
                <th className={th}>Referencia</th>
                <th className={`${th} text-right`}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {abonos.map(v => (
                <tr key={v.id}>
                  <td className={`${td} font-mono text-zinc-700`}>{fmtDate(v.date)}</td>
                  <td className={`${td} text-zinc-600`}>{v.method}</td>
                  <td className={`${td} font-mono text-zinc-500`}>{v.reference || "—"}</td>
                  <td className={`${td} text-right font-mono font-bold text-emerald-700`}>{money(v.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-zinc-200 text-[8px] text-zinc-400 leading-relaxed">
        <p>Este estado de cuenta refleja los saldos pendientes a la fecha de emisión. Para conciliaciones o reportar pagos, contacte a {companyConfig.email || companyConfig.name}. Montos expresados en {cur}.</p>
      </div>
    </div>
  );
}
