import { useState } from "react";
import { Plus, X } from "lucide-react";
import { WithholdingCertificate } from "../types";
import { TaxJurisdiction } from "../lib/taxEngine";
import { formatCurrency, getOperatingCurrency, getCurrencySymbol } from "../lib/taxEngine";
import { nextSequentialId } from "../lib/idGenerator";

interface Props {
  clientId: string;
  clientName: string;
  clientTaxId: string;              // RIF / cédula del cliente
  certs: WithholdingCertificate[];  // todos los comprobantes (para id y filtro)
  jurisdiction?: TaxJurisdiction;
  onAdd?: (c: WithholdingCertificate) => void;
  onDelete?: (id: string) => void;
}

// Sección reutilizable de comprobantes de retención por cliente (B2B y Directos).
// La retención la practica el cliente (contribuyente especial) y aquí se transcribe
// el comprobante físico. Alimenta la pestaña "Retenciones" de Contabilidad.
export default function WithholdingClienteSection({
  clientId,
  clientName,
  clientTaxId,
  certs,
  jurisdiction,
  onAdd,
  onDelete,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    number: "",
    type: "VAT" as "VAT" | "INCOME_TAX",
    percentage: 0,
    taxableBase: 0,
    amountWithheld: 0,
    date: new Date().toISOString().slice(0, 10),
    invoiceId: "",
  });

  const clientCerts = certs.filter(c => c.clientId === clientId);

  const guardar = () => {
    if (!form.number || form.amountWithheld <= 0) return;
    const period = `${form.date.slice(5, 7)}-${form.date.slice(0, 4)}`;
    const cert: WithholdingCertificate = {
      id: nextSequentialId("WH", certs.map(c => c.id)),
      number: form.number,
      clientId,
      clientTaxId,
      clientName,
      type: form.type,
      percentage: form.percentage,
      taxableBase: form.taxableBase,
      amountWithheld: form.amountWithheld,
      date: form.date,
      period,
      invoiceId: form.invoiceId || undefined,
      updatedAt: new Date().toISOString(),
    };
    onAdd?.(cert);
    setShowForm(false);
    setForm({ number: "", type: "VAT", percentage: 0, taxableBase: 0, amountWithheld: 0, date: new Date().toISOString().slice(0, 10), invoiceId: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black uppercase tracking-wider text-zinc-700">
          Comprobantes de Retención — {clientName}
        </span>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold uppercase"
        >
          <Plus className="w-3 h-3" /> Registrar
        </button>
      </div>

      {showForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
          <p className="text-[10px] font-black uppercase text-indigo-700">Nuevo Comprobante</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">N° Comprobante</label>
              <input
                type="text"
                value={form.number}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
                placeholder="0000-001234"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as "VAT" | "INCOME_TAX" }))}
                className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
              >
                <option value="VAT">Retención {jurisdiction?.taxName ?? "IVA"}</option>
                <option value="INCOME_TAX">Retención {jurisdiction?.incomeTaxWithholdingLabel ?? "Renta"}</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">% Retención</label>
              <input
                type="number"
                value={form.percentage}
                onChange={e => setForm(f => ({ ...f, percentage: Number(e.target.value) }))}
                className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">Base Imponible ({getCurrencySymbol()})</label>
              <input
                type="number"
                value={form.taxableBase}
                onChange={e => setForm(f => ({ ...f, taxableBase: Number(e.target.value) }))}
                className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">Monto Retenido ({getCurrencySymbol()})</label>
              <input
                type="number"
                value={form.amountWithheld}
                onChange={e => setForm(f => ({ ...f, amountWithheld: Number(e.target.value) }))}
                className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">N° Factura Aplicada (opcional)</label>
              <input
                type="text"
                value={form.invoiceId}
                onChange={e => setForm(f => ({ ...f, invoiceId: e.target.value }))}
                className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5"
                placeholder="FAC-1234"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={guardar}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold uppercase"
            >
              Guardar Comprobante
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[9px] font-bold uppercase"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {clientCerts.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-xs">
          No hay comprobantes de retención registrados para este cliente.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-zinc-100">
            <thead>
              <tr className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                <th className="pb-2 pr-3">N° Comprobante</th>
                <th className="pb-2 pr-3">Fecha</th>
                <th className="pb-2 pr-3">Tipo</th>
                <th className="pb-2 pr-3">%</th>
                <th className="pb-2 pr-3 text-right">Base</th>
                <th className="pb-2 pr-3 text-right">Retenido</th>
                <th className="pb-2">Factura</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {clientCerts.map(c => (
                <tr key={c.id} className="hover:bg-zinc-50">
                  <td className="py-2 pr-3 font-mono font-bold text-indigo-700">{c.number}</td>
                  <td className="py-2 pr-3 text-zinc-600">{c.date}</td>
                  <td className="py-2 pr-3">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${c.type === "VAT" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {c.type === "VAT" ? jurisdiction?.taxName ?? "IVA" : jurisdiction?.incomeTaxWithholdingLabel ?? "Renta"}
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-mono">{c.percentage}%</td>
                  <td className="py-2 pr-3 text-right font-mono">{formatCurrency(c.taxableBase, getOperatingCurrency())}</td>
                  <td className="py-2 pr-3 text-right font-mono text-red-650 font-bold">{formatCurrency(c.amountWithheld, getOperatingCurrency())}</td>
                  <td className="py-2 text-zinc-500">{c.invoiceId || "—"}</td>
                  <td className="py-2">
                    {onDelete && (
                      <button
                        onClick={() => onDelete(c.id)}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded"
                        title="Eliminar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
