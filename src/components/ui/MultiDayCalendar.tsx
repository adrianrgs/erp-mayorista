import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StopSale, StopSaleTipo } from "../../types/producto";
import { nextSequentialId } from "../../lib/idGenerator";
import { useDialog } from "./DialogProvider";

interface MultiDayCalendarProps {
  propertyId: string;
  stopSales: StopSale[]; // se filtra por propertyId adentro
  onAddStopSale: (stop: StopSale) => void;
  onDeleteStopSale: (id: string) => void;
  minDate?: string; // por defecto hoy — un stop sale es siempre a futuro
  // El calendario siempre se puede VER (pinta los cierres existentes); estos dos flags
  // controlan de forma independiente si además se puede crear uno nuevo (clic en día libre)
  // o liberar uno existente (clic en día rojo/ámbar) — permisos separados en ACCIONES_POR_MODULO.
  puedeCrear?: boolean;
  puedeEliminar?: boolean;
}

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];
const DAY_NAMES = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};

const buildMonthGrid = (year: number, month: number): Date[] => {
  const first = new Date(year, month, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = lunes
  const start = new Date(year, month, 1 - firstWeekday);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
};

// Expande cada StopSale (fechaInicio..fechaFin) del hotel día por día, para pintar el
// calendario "de un vistazo" con todos los cierres ya registrados. Los registros sin `tipo`
// (creados antes de este campo) se tratan como "Cierre" por compatibilidad.
const expandCommittedDays = (stopSales: StopSale[], propertyId: string): Map<string, { id: string; tipo: StopSaleTipo }> => {
  const map = new Map<string, { id: string; tipo: StopSaleTipo }>(); // iso -> stop sale que lo cubre
  stopSales.filter(s => s.property_id === propertyId).forEach(s => {
    let cursor = parseISO(s.fechaInicio);
    const end = parseISO(s.fechaFin);
    while (cursor <= end) {
      map.set(toISO(cursor), { id: s.id, tipo: s.tipo ?? "Cierre" });
      cursor = new Date(cursor.getTime() + 86400000);
    }
  });
  return map;
};

// Agrupa fechas seleccionadas (posiblemente salteadas) en tramos de días consecutivos —
// cada tramo se convierte en un único registro StopSale (fechaInicio/fechaFin de ese tramo).
const groupConsecutiveDates = (selectedIsos: string[]): { fechaInicio: string; fechaFin: string }[] => {
  const sorted = Array.from(new Set(selectedIsos)).sort();
  const groups: { fechaInicio: string; fechaFin: string }[] = [];
  for (const iso of sorted) {
    const last = groups[groups.length - 1];
    if (last) {
      const nextExpected = toISO(new Date(parseISO(last.fechaFin).getTime() + 86400000));
      if (iso === nextExpected) {
        last.fechaFin = iso;
        continue;
      }
    }
    groups.push({ fechaInicio: iso, fechaFin: iso });
  }
  return groups;
};

// Calendario mensual siempre visible (no un popover de campo, como DateRangePicker) para
// gestionar Stop Sales de un hotel: pinta en rojo los días con cierre duro (sin disponibilidad),
// en ámbar los días "bajo solicitud" (hay que preguntarle al hotel), y permite marcar en azul
// días sueltos/salteados (no necesariamente consecutivos) para declararlos en una sola acción —
// cada tramo consecutivo se guarda como un registro StopSale aparte.
export default function MultiDayCalendar({
  propertyId,
  stopSales,
  onAddStopSale,
  onDeleteStopSale,
  minDate,
  puedeCrear = true,
  puedeEliminar = true
}: MultiDayCalendarProps) {
  const { showConfirm } = useDialog();
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [pendingSelection, setPendingSelection] = useState<Set<string>>(new Set());
  const [motivo, setMotivo] = useState("");
  const [pendingTipo, setPendingTipo] = useState<StopSaleTipo>("Cierre");

  const effectiveMinDate = minDate ?? toISO(new Date());
  const committedByDay = useMemo(() => expandCommittedDays(stopSales, propertyId), [stopSales, propertyId]);
  const grid = buildMonthGrid(viewMonth.getFullYear(), viewMonth.getMonth());

  const handleDayClick = (iso: string) => {
    if (iso < effectiveMinDate) return;
    const committed = committedByDay.get(iso);
    if (committed) {
      if (!puedeEliminar) return; // sin permiso de eliminar: un día rojo/ámbar es solo informativo
      const record = stopSales.find(s => s.id === committed.id);
      if (!record) return;
      const esSolicitud = (record.tipo ?? "Cierre") === "EnSolicitud";
      showConfirm({
        title: esSolicitud ? "Quitar marca de Bajo Solicitud" : "Liberar Stop Sale",
        message: `¿${esSolicitud ? "Quitar la marca de disponibilidad bajo solicitud" : "Liberar el cierre completo"} del ${record.fechaInicio} al ${record.fechaFin}${record.motivo ? ` (${record.motivo})` : ""}?`,
        type: "warning",
        confirmText: esSolicitud ? "Quitar marca" : "Liberar",
        onConfirm: () => onDeleteStopSale(committed.id)
      });
      return;
    }
    if (!puedeCrear) return; // sin permiso de crear: no se puede seleccionar un día libre
    setPendingSelection(prev => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso); else next.add(iso);
      return next;
    });
  };

  const handleSave = () => {
    if (pendingSelection.size === 0) return;
    const groups = groupConsecutiveDates(Array.from(pendingSelection));
    const existingIds = stopSales.map(s => s.id);
    groups.forEach(g => {
      const id = nextSequentialId("stop", existingIds);
      existingIds.push(id);
      onAddStopSale({
        id,
        property_id: propertyId,
        fechaInicio: g.fechaInicio,
        fechaFin: g.fechaFin,
        motivo: motivo || (pendingTipo === "EnSolicitud" ? "Consultar disponibilidad con el hotel" : "Corte de ventas contractual"),
        tipo: pendingTipo
      });
    });
    setPendingSelection(new Set());
    setMotivo("");
    setPendingTipo("Cierre");
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
          className="p-1.5 hover:bg-zinc-100 rounded cursor-pointer text-zinc-500"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-zinc-800 capitalize">
          {MONTH_NAMES[viewMonth.getMonth()]} de {viewMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
          className="p-1.5 hover:bg-zinc-100 rounded cursor-pointer text-zinc-500"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map(d => (
          <span key={d} className="text-[9.5px] font-bold uppercase text-zinc-400 text-center py-1">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((date, i) => {
          const iso = toISO(date);
          const inCurrentMonth = date.getMonth() === viewMonth.getMonth();
          const committed = committedByDay.get(iso);
          const isCommitted = !!committed;
          const isSolicitud = committed?.tipo === "EnSolicitud";
          const isPending = pendingSelection.has(iso);
          const isInteractive = isCommitted ? puedeEliminar : puedeCrear;
          const isDisabled = iso < effectiveMinDate || !isInteractive;

          return (
            <button
              key={i}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDayClick(iso)}
              title={
                iso < effectiveMinDate ? undefined :
                isCommitted ? (puedeEliminar ? (isSolicitud ? "Clic para quitar la marca de bajo solicitud" : "Clic para liberar este cierre") : "Sin permiso para modificar este día") :
                (puedeCrear ? "Clic para marcar/desmarcar" : "Sin permiso para declarar cierres")
              }
              className={`h-9 w-full text-xs font-semibold rounded-md transition-colors
                ${!inCurrentMonth ? "text-zinc-300" : "text-zinc-700"}
                ${isDisabled ? (isCommitted ? "opacity-70 cursor-not-allowed" : "opacity-30 cursor-not-allowed") : "cursor-pointer"}
                ${!isDisabled && !isCommitted && !isPending ? "hover:bg-zinc-100" : ""}
                ${isCommitted && !isSolicitud ? "bg-red-500 text-white hover:bg-red-600" : ""}
                ${isCommitted && isSolicitud ? "bg-amber-400 text-zinc-900 hover:bg-amber-500" : ""}
                ${isPending ? "bg-sky-400 text-white hover:bg-sky-500" : ""}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Con Stop Sale</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Bajo Solicitud</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-400 inline-block" /> Selección pendiente</span>
      </div>

      {puedeCrear && (
        <div className="flex flex-col gap-3 pt-3 border-t border-zinc-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tipo de bloqueo</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPendingTipo("Cierre")}
                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer border transition-colors
                  ${pendingTipo === "Cierre" ? "bg-red-500 border-red-500 text-white" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}
              >
                Stop Sale (Cierre)
              </button>
              <button
                type="button"
                onClick={() => setPendingTipo("EnSolicitud")}
                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer border transition-colors
                  ${pendingTipo === "EnSolicitud" ? "bg-amber-400 border-amber-400 text-zinc-900" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}
              >
                Bajo Solicitud
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Motivo o Justificación</label>
              <input
                type="text"
                placeholder="Ej: Mantenimiento, Reservas Bloqueadas"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={pendingSelection.size === 0}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Bloquear {pendingSelection.size > 0 ? `${pendingSelection.size} día(s)` : "Días Seleccionados"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
