import React from "react";
import { StatementConfig } from "./EstadoCuentaClientePDF";
import { X, FileText, SlidersHorizontal } from "lucide-react";

interface Props {
  clientName: string;
  config: StatementConfig;
  onChange: (c: StatementConfig) => void;
  onGenerate: () => void;
  onClose: () => void;
}

function ToggleRow({ label, desc, checked, onToggle }: { label: string; desc: string; checked: boolean; onToggle: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-0.5 rounded text-zinc-900 focus:ring-zinc-500 w-4 h-4 cursor-pointer"
      />
      <div>
        <span className="text-xs font-bold text-zinc-900 block leading-tight">{label}</span>
        <span className="text-[10.5px] text-zinc-500 font-medium leading-tight block mt-0.5">{desc}</span>
      </div>
    </label>
  );
}

export default function EstadoCuentaConfigModal({ clientName, config, onChange, onGenerate, onClose }: Props) {
  const set = (patch: Partial<StatementConfig>) => onChange({ ...config, ...patch });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
            <div>
              <h3 className="font-black text-sm text-zinc-900 uppercase tracking-wide leading-none">Estado de Cuenta</h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 truncate max-w-[240px]">{clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Opciones */}
        <div className="px-5 py-3 overflow-y-auto space-y-1 divide-y divide-zinc-50">
          <div className="py-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5">Mostrar desde (opcional)</label>
            <input
              type="date"
              value={config.fromDate || ""}
              onChange={(e) => set({ fromDate: e.target.value || undefined })}
              className="w-full px-2.5 py-1.5 border border-zinc-200 rounded text-xs font-bold bg-white focus:outline-none focus:border-zinc-500"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Incluye solo facturas y abonos desde esta fecha. Vacío = todo el historial.</p>
          </div>

          <ToggleRow
            label="Incluir facturas ya pagadas"
            desc="Muestra también las facturas saldadas (estado de cuenta histórico). Por defecto solo pendientes."
            checked={config.includePaidInvoices}
            onToggle={(v) => set({ includePaidInvoices: v })}
          />
          <ToggleRow
            label="Mostrar desglose de vencimiento"
            desc="Cuadros de Vencido / Por vencer (aging)."
            checked={config.showAging}
            onToggle={(v) => set({ showAging: v })}
          />
          <ToggleRow
            label="Mostrar detalle de abonos"
            desc="Lista de pagos recibidos con su fecha, método y referencia."
            checked={config.showAbonos}
            onToggle={(v) => set({ showAbonos: v })}
          />
          {config.showAbonos && (
            <div className="py-2 pl-6">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5">Cantidad de abonos</label>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-zinc-600 font-semibold">Últimos</span>
                <input
                  type="number"
                  min={1}
                  value={config.abonosCantidad}
                  disabled={config.abonosAll}
                  onChange={(e) => set({ abonosCantidad: Math.max(1, parseInt(e.target.value) || 1), abonosAll: false })}
                  className="w-16 px-2 py-1 border border-zinc-200 rounded text-xs font-bold bg-white focus:outline-none focus:border-zinc-500 disabled:opacity-40 disabled:bg-zinc-50"
                />
                <span className="text-[11px] text-zinc-600 font-semibold">abonos</span>
                <label className="flex items-center gap-1.5 cursor-pointer ml-2 select-none">
                  <input
                    type="checkbox"
                    checked={config.abonosAll}
                    onChange={(e) => set({ abonosAll: e.target.checked })}
                    className="rounded text-zinc-900 focus:ring-zinc-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-600 font-semibold">Mostrar todos</span>
                </label>
              </div>
            </div>
          )}

          <div className="py-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5">Nota al cliente (opcional)</label>
            <textarea
              value={config.nota || ""}
              onChange={(e) => set({ nota: e.target.value })}
              rows={2}
              placeholder="Ej. Favor regularizar su saldo antes del check-in. ¡Gracias!"
              className="w-full px-2.5 py-1.5 border border-zinc-200 rounded text-xs font-medium bg-white focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-100">
          <button onClick={onClose} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-600 hover:bg-zinc-100 rounded cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={onGenerate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
