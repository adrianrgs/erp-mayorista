import React, { useState } from "react";
import { WalletTransaction, CompanyConfig } from "../types";
import { formatCurrency, getOperatingCurrency } from "../lib/taxEngine";
import { useAuth } from "../context/AuthContext";
import { printElementById } from "../lib/print";
import ComprobantePagoPDF from "./ComprobantePagoPDF";
import { Wallet, X, Plus, ArrowDownCircle, ArrowUpCircle, Printer } from "lucide-react";

interface WalletClient {
  id: string;
  nombre: string;
  saldoFavor: number;
}

interface Props {
  client: WalletClient;
  clientKind: "B2B" | "Directo";
  transactions: WalletTransaction[];
  companyConfig: CompanyConfig;
  clientTaxId?: string;
  clientTaxIdLabel?: string;
  onRegisterDeposit: (tx: WalletTransaction) => void; // el padre agrega la tx y ajusta saldoFavor
  onClose: () => void;
}

const METODOS = ["Efectivo", "Transferencia", "Punto de Venta", "Pago Móvil", "Otro"];

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try { return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }); }
  catch { return d; }
};

export default function WalletClienteModal({ client, clientKind, transactions, companyConfig, clientTaxId, clientTaxIdLabel, onRegisterDeposit, onClose }: Props) {
  const { usuario } = useAuth();
  const money = (n: number) => formatCurrency(n, getOperatingCurrency());
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({ amount: "", office: "", method: "Efectivo", reference: "", notes: "", date: today });
  // Transacción para la que se imprime comprobante (se renderiza oculta y se clona al imprimir).
  const [receiptTx, setReceiptTx] = useState<WalletTransaction | null>(null);
  const [justRegistered, setJustRegistered] = useState<WalletTransaction | null>(null);
  const printComprobante = (t: WalletTransaction) => {
    setReceiptTx(t);
    setTimeout(() => printElementById("comprobante-pago-content"), 60);
  };

  const movimientos = transactions
    .filter(t => t.clientId === client.id)
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || "").localeCompare(a.createdAt || ""));

  const esCredito = (t: WalletTransaction) => t.type === "Deposito" || t.type === "Ajuste";

  const handleRegister = () => {
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) { alert("Ingrese un monto válido."); return; }
    const tx: WalletTransaction = {
      id: "WTX-" + Date.now().toString(36).toUpperCase(),
      clientId: client.id,
      clientKind,
      clientName: client.nombre,
      type: "Deposito",
      amount: Number(amount.toFixed(2)),
      office: form.office.trim() || undefined,
      method: form.method,
      reference: form.reference.trim() || undefined,
      notes: form.notes.trim() || undefined,
      date: form.date || today,
      createdBy: usuario?.nombre || undefined,
      createdAt: new Date().toISOString(),
    };
    onRegisterDeposit(tx);
    setForm({ amount: "", office: "", method: "Efectivo", reference: "", notes: "", date: today });
    setJustRegistered(tx);
  };

  const label = "text-[9px] font-black text-zinc-400 uppercase tracking-wider block mb-1";
  const inputCls = "w-full px-2.5 py-1.5 border border-zinc-200 rounded text-xs font-semibold bg-white focus:outline-none focus:border-zinc-500";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header + saldo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-950 rounded-t-xl">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-black text-sm text-white uppercase tracking-wide leading-none">Billetera del Cliente</h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 truncate max-w-[300px]">{client.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Saldo a Favor</p>
              <p className="text-lg font-black text-emerald-400 font-mono leading-none">{money(client.saldoFavor)}</p>
            </div>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Registrar depósito */}
        <div className="px-5 py-4 border-b border-zinc-100 bg-emerald-50/40">
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <ArrowDownCircle className="w-3.5 h-3.5" /> Registrar Abono a la Billetera
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className={label}>Monto</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} placeholder="0.00" />
            </div>
            <div>
              <label className={label}>Método</label>
              <select value={form.method} onChange={(e) => setForm(f => ({ ...f, method: e.target.value }))} className={inputCls}>
                {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Oficina</label>
              <input type="text" value={form.office} onChange={(e) => setForm(f => ({ ...f, office: e.target.value }))} className={inputCls} placeholder="Ej. Centro" />
            </div>
            <div>
              <label className={label}>Fecha</label>
              <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={label}>Referencia</label>
              <input type="text" value={form.reference} onChange={(e) => setForm(f => ({ ...f, reference: e.target.value }))} className={inputCls} placeholder="Nº comprobante / recibo" />
            </div>
            <div className="col-span-2">
              <label className={label}>Notas</label>
              <input type="text" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="Opcional" />
            </div>
          </div>
          <div className="flex justify-end mt-2.5">
            <button onClick={handleRegister} className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Registrar Abono
            </button>
          </div>
          {justRegistered && (
            <div className="mt-2.5 flex items-center justify-between gap-2 bg-white border border-emerald-200 rounded-lg px-3 py-2">
              <span className="text-[11px] font-bold text-emerald-800">✓ Abono de {money(justRegistered.amount)} registrado.</span>
              <button
                onClick={() => printComprobante(justRegistered)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Comprobante
              </button>
            </div>
          )}
        </div>

        {/* Historial */}
        <div className="px-5 py-3 overflow-y-auto">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Historial de Movimientos ({movimientos.length})</p>
          {movimientos.length === 0 ? (
            <p className="text-[11px] text-zinc-400 italic py-4 text-center">Sin movimientos registrados en la billetera.</p>
          ) : (
            <table className="w-full text-left" style={{ fontSize: "11px" }}>
              <thead>
                <tr className="text-[8.5px] uppercase tracking-wider text-zinc-400 border-b border-zinc-200">
                  <th className="py-1.5 pr-2">Fecha</th>
                  <th className="py-1.5 pr-2">Tipo</th>
                  <th className="py-1.5 pr-2">Detalle</th>
                  <th className="py-1.5 pr-2 text-right">Monto</th>
                  <th className="py-1.5 pr-1"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {movimientos.map(t => (
                  <tr key={t.id}>
                    <td className="py-1.5 pr-2 font-mono text-zinc-600">{fmtDate(t.date)}</td>
                    <td className="py-1.5 pr-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${esCredito(t) ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {esCredito(t) ? <ArrowDownCircle className="w-2.5 h-2.5" /> : <ArrowUpCircle className="w-2.5 h-2.5" />}
                        {t.type}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-zinc-600">
                      <span className="font-semibold">{[t.method, t.office].filter(Boolean).join(" · ") || "—"}</span>
                      {t.voucherId && <span className="text-zinc-400 font-mono block text-[9.5px]">Voucher: {t.voucherId}</span>}
                      {t.reference && <span className="text-zinc-400 font-mono block text-[9.5px]">Ref: {t.reference}</span>}
                      {t.reservationId && <span className="text-zinc-400 font-mono block text-[9.5px]">{t.reservationId}</span>}
                    </td>
                    <td className={`py-1.5 pr-2 text-right font-mono font-black ${esCredito(t) ? "text-emerald-700" : "text-red-700"}`}>
                      {esCredito(t) ? "+" : "−"}{money(t.amount)}
                    </td>
                    <td className="py-1.5 pr-1 text-right">
                      <button
                        onClick={() => printComprobante(t)}
                        title="Imprimir comprobante"
                        className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Comprobante imprimible (oculto; se clona al imprimir) */}
        {receiptTx && (
          <div className="hidden">
            <ComprobantePagoPDF
              tx={transactions.find(t => t.id === receiptTx.id) || receiptTx}
              companyConfig={companyConfig}
              clientTaxId={clientTaxId}
              clientTaxIdLabel={clientTaxIdLabel}
              saldoFavorActual={client.saldoFavor}
            />
          </div>
        )}
      </div>
    </div>
  );
}
