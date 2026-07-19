import React from "react";
import { FinancialInvoice, PaymentVoucher, CompanyConfig, Reservation } from "../types";
import { formatCurrency, getOperatingCurrency } from "../lib/taxEngine";
import { getReservationReceivable } from "../lib/receivables";

interface Props {
  res: Reservation;
  clientName: string;
  taxId?: string;
  taxIdLabel?: string;
  invoices: FinancialInvoice[];
  vouchers: PaymentVoucher[];
  companyConfig: CompanyConfig;
  elementId?: string;
}

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return d;
  }
};

export default function EstadoCuentaReservaPDF({
  res, clientName, taxId, taxIdLabel = "RIF", invoices, vouchers, companyConfig, elementId = "estado-cuenta-reserva-content",
}: Props) {
  const cur = getOperatingCurrency();
  const money = (n: number) => formatCurrency(n, cur);
  const r = getReservationReceivable(res, invoices, vouchers);

  // Abonos (pagos verificados) del expediente, con su fecha. En el estado de cuenta por reserva se
  // muestran TODOS (sin límite): una reserva puntual no debería acumular tantos como para paginar,
  // y conviene evitar cualquier ambigüedad sobre pagos omitidos.
  const resInvoiceIds = new Set(r.lines.map(l => l.inv.id));
  const abonos = vouchers
    .filter(v => v.status === "Verificado" && (v.locatorId === res.id || (!!v.invoiceId && resInvoiceIds.has(v.invoiceId))))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const th = "text-left font-black text-zinc-500 uppercase tracking-wider text-[8px] px-2 py-1.5 border-b border-zinc-300";
  const td = "px-2 py-1.5 border-b border-zinc-100 align-top";

  const info = (label: string, value: React.ReactNode) => (
    <div>
      <p className="text-[7.5px] font-black text-zinc-400 uppercase tracking-wider">{label}</p>
      <p className="text-[11px] font-bold text-zinc-800 leading-tight">{value}</p>
    </div>
  );

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
          <div className="mt-1.5">
            <span className="inline-block px-2.5 py-0.5 bg-blue-100 border border-blue-200 text-blue-900 font-mono font-black text-sm rounded tracking-wider">
              Expediente {res.id}
            </span>
          </div>
          <p className="text-[9px] font-bold text-zinc-400 mt-1.5 uppercase tracking-wider">
            Emitido: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
            r.isOverdue ? "bg-red-50 border-red-200 text-red-700"
              : r.hasDebt ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}>
            {r.isOverdue ? "● Vencido" : r.hasDebt ? "● Con Saldo Pendiente" : "● Cuenta al Día"}
          </span>
        </div>
      </div>

      {/* Datos del expediente */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {info("Cliente / Agencia", <>{clientName}{taxId ? <span className="block text-[9px] font-mono text-zinc-500">{taxIdLabel}: {taxId}</span> : null}</>)}
        {info("Titular / Pasajero", res.holder || "—")}
        {info("Check-in", fmtDate(res.checkIn))}
        {info("Check-out", fmtDate(res.checkOut))}
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-center">
          <p className="text-[7.5px] font-black text-zinc-400 uppercase tracking-wider">{r.billed ? "Total Facturado" : "Total Venta"}</p>
          <p className="font-black text-zinc-800 text-sm font-mono mt-0.5">{money(r.totalCargos)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-center">
          <p className="text-[7.5px] font-black text-emerald-600 uppercase tracking-wider">Abonado</p>
          <p className="font-black text-emerald-700 text-sm font-mono mt-0.5">{money(r.abonado)}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-center">
          <p className="text-[7.5px] font-black text-zinc-400 uppercase tracking-wider">Notas de Crédito</p>
          <p className="font-black text-zinc-700 text-sm font-mono mt-0.5">{money(r.ncTotal)}</p>
        </div>
        <div className={`rounded-lg p-2.5 text-center border ${r.hasDebt ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
          <p className={`text-[7.5px] font-black uppercase tracking-wider ${r.hasDebt ? "text-red-500" : "text-emerald-600"}`}>Saldo Pendiente</p>
          <p className={`font-black text-sm font-mono mt-0.5 ${r.hasDebt ? "text-red-700" : "text-emerald-700"}`}>{money(r.saldo)}</p>
        </div>
      </div>

      {/* Detalle de facturas */}
      {r.billed ? (
        <>
          <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1.5">Detalle de Facturas del Expediente</p>
          <table className="w-full border-collapse" style={{ fontSize: "9.5px" }}>
            <thead>
              <tr className="bg-zinc-50">
                <th className={th}>Nº Factura</th>
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
              {r.lines.map(l => {
                const pagada = l.remaining <= 0.005;
                return (
                  <tr key={l.inv.id}>
                    <td className={`${td} font-mono font-bold text-zinc-800`}>{l.inv.fiscalDocNumber || l.inv.id}</td>
                    <td className={`${td} text-zinc-600`}>{fmtDate(l.inv.date)}</td>
                    <td className={`${td} text-zinc-600`}>{fmtDate(l.inv.dueDate)}</td>
                    <td className={`${td} text-right font-mono`}>{money(l.inv.amount)}</td>
                    <td className={`${td} text-right font-mono text-emerald-700`}>{l.paid > 0 ? money(l.paid) : "—"}</td>
                    <td className={`${td} text-right font-mono text-zinc-500`}>{l.ncApplied > 0 ? money(l.ncApplied) : "—"}</td>
                    <td className={`${td} text-right font-mono font-black ${pagada ? "text-emerald-700" : "text-red-700"}`}>{money(l.remaining)}</td>
                    <td className={`${td} text-center`}>
                      <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase ${
                        pagada ? "bg-emerald-100 text-emerald-700" : l.vencida ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {pagada ? "Pagada" : l.vencida ? "Vencida" : "Por vencer"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center text-amber-800 text-xs">
          Expediente aún no facturado. El total de la venta ({money(r.totalCargos)}) queda pendiente; el vencimiento de referencia es el check-in ({fmtDate(res.checkIn)}).
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

      {/* Total a pagar + vencimiento */}
      {r.hasDebt && (
        <div className="flex justify-end mt-4">
          <div className="bg-zinc-950 text-white rounded-lg px-4 py-2.5 text-right">
            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Total a Pagar</p>
            <p className="font-black text-lg font-mono leading-none mt-0.5">{money(r.saldo)}</p>
            {r.dueDate && (
              <p className={`text-[9px] mt-1 font-bold ${r.isOverdue ? "text-red-400" : "text-amber-300"}`}>
                {r.isOverdue ? `Vencido hace ${Math.abs(r.daysUntilDue!)} día(s)` : `Vence: ${fmtDate(r.dueDate)}${r.daysUntilDue !== null ? ` (en ${r.daysUntilDue} día${r.daysUntilDue === 1 ? "" : "s"})` : ""}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-zinc-200 text-[8px] text-zinc-400 leading-relaxed">
        <p>Estado de cuenta del expediente {res.id} a la fecha de emisión. Para conciliaciones o reportar pagos, contacte a {companyConfig.email || companyConfig.name}. Montos expresados en {cur}.</p>
      </div>
    </div>
  );
}
