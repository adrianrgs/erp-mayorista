import React from "react";
import { WalletTransaction, CompanyConfig } from "../types";
import { formatCurrency, getOperatingCurrency } from "../lib/taxEngine";

interface Props {
  tx: WalletTransaction;
  companyConfig: CompanyConfig;
  clientTaxId?: string;
  clientTaxIdLabel?: string;
  saldoFavorActual?: number;   // saldo a favor del cliente tras el movimiento
  elementId?: string;          // default "comprobante-pago-content"
}

const TITULOS: Record<string, string> = {
  Deposito: "Comprobante de Abono",
  Retiro: "Comprobante de Retiro",
  Aplicacion: "Comprobante de Aplicación",
  Ajuste: "Comprobante de Ajuste",
};

const fmtDateLong = (d?: string) => {
  if (!d) return "—";
  try { return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return d; }
};

export default function ComprobantePagoPDF({
  tx, companyConfig, clientTaxId, clientTaxIdLabel = "RIF", saldoFavorActual, elementId = "comprobante-pago-content",
}: Props) {
  const cur = getOperatingCurrency();
  const money = (n: number) => formatCurrency(n, cur);
  const esIngreso = tx.type === "Deposito" || tx.type === "Ajuste";
  const titulo = TITULOS[tx.type] || "Comprobante de Pago";

  const field = (label: string, value: React.ReactNode) => (
    <div>
      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">{label}</p>
      <p className="text-[11px] font-bold text-zinc-800 leading-tight">{value || "—"}</p>
    </div>
  );

  return (
    <div id={elementId} className="print-receipt bg-white text-zinc-900" style={{ fontFamily: "system-ui, sans-serif", fontSize: "11px", maxWidth: "760px", margin: "0 auto", padding: "28px" }}>
      {/* Header empresa + folio */}
      <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4 mb-5">
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
            {titulo}
          </div>
          <p className="text-[10px] font-mono font-black text-zinc-700 mt-2">Nº {tx.voucherId || tx.id}</p>
          {tx.voucherId && <p className="text-[8.5px] font-mono text-zinc-400 mt-0.5">Mov. billetera: {tx.id}</p>}
          <p className="text-[10px] text-zinc-500 mt-0.5">{fmtDateLong(tx.date)}</p>
        </div>
      </div>

      {/* Recibido de / Entregado a */}
      <div className="mb-4">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{esIngreso ? "Recibimos de" : "Entregado a"}</p>
        <p className="text-base font-black text-zinc-900 uppercase leading-tight">{tx.clientName}</p>
        {clientTaxId && <p className="text-[10px] font-mono text-zinc-500">{clientTaxIdLabel}: {clientTaxId}</p>}
      </div>

      {/* Monto destacado */}
      <div className={`rounded-lg p-4 mb-4 flex items-center justify-between ${esIngreso ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
        <div>
          <p className={`text-[9px] font-black uppercase tracking-widest ${esIngreso ? "text-emerald-600" : "text-red-500"}`}>
            {esIngreso ? "Monto Recibido" : "Monto Entregado"}
          </p>
          <p className={`text-3xl font-black font-mono leading-none mt-1 ${esIngreso ? "text-emerald-700" : "text-red-700"}`}>
            {money(tx.amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">Concepto</p>
          <p className="text-xs font-bold text-zinc-700">{esIngreso ? "Abono a saldo a favor" : "Retiro de saldo a favor"}</p>
        </div>
      </div>

      {/* Detalle */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-zinc-200 rounded-lg p-3 mb-4">
        {field("Método", tx.method)}
        {field("Oficina", tx.office)}
        {field("Referencia", tx.reference)}
        {field("Registrado por", tx.createdBy)}
        {tx.reservationId && field("Expediente", tx.reservationId)}
        {tx.notes && field("Notas", tx.notes)}
      </div>

      {typeof saldoFavorActual === "number" && (
        <div className="flex justify-end mb-6">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-right">
            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Saldo a Favor Actual</p>
            <p className="text-base font-black text-emerald-700 font-mono">{money(saldoFavorActual)}</p>
          </div>
        </div>
      )}

      {/* Firmas */}
      <div className="grid grid-cols-2 gap-8 mt-10">
        <div className="text-center">
          <div className="border-t border-zinc-400 pt-1 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Recibido por</div>
        </div>
        <div className="text-center">
          <div className="border-t border-zinc-400 pt-1 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Firma / Sello {companyConfig.name}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-3 border-t border-zinc-200 text-[8px] text-zinc-400 leading-relaxed text-center">
        <p>Este comprobante certifica el movimiento indicado en la fecha señalada. Montos expresados en {cur}. Conserve este documento.</p>
      </div>
    </div>
  );
}
