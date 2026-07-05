import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  onChange: (checkIn: string, checkOut: string) => void;
  minDate?: string; // YYYY-MM-DD, por defecto hoy
  checkInLabel?: string;
  checkOutLabel?: string;
  required?: boolean;
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
const formatDisplay = (s: string) => {
  if (!s) return "";
  const d = parseISO(s);
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};

// Inserta guiones automáticamente mientras se escribe (dd-mm-aaaa), para quienes prefieren
// tipear la fecha en vez de usar el calendario.
const maskTypingValue = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join("-");
};

// Convierte "dd-mm-aaaa" a ISO (YYYY-MM-DD) solo si es una fecha real y completa; devuelve
// null mientras el usuario sigue escribiendo o si la fecha no existe (ej. 31-02-2026).
const parseTypedDate = (masked: string): string | null => {
  const match = masked.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const dd = Number(match[1]);
  const mm = Number(match[2]);
  const yyyy = Number(match[3]);
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return `${yyyy}-${pad(mm)}-${pad(dd)}`;
};

// Devuelve las 42 celdas (6 semanas, lunes a domingo) de un mes, incluyendo días de relleno
// del mes anterior/siguiente — el mismo criterio visual del picker nativo del navegador.
const buildMonthGrid = (year: number, month: number): Date[] => {
  const first = new Date(year, month, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = lunes
  const start = new Date(year, month, 1 - firstWeekday);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
};

// Selector de rango de fechas reutilizable (reemplazo del <input type="date"> nativo, cuyo
// popup varía entre navegadores y no visualiza el rango check-in/check-out de una vez).
// Un solo calendario controla ambos campos: el primer clic fija el check-in, el segundo el
// check-out — igual que en Booking/Airbnb — resaltando el rango completo en el calendario.
export default function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  minDate,
  checkInLabel = "Check-In",
  checkOutLabel = "Check-Out",
  required
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => (checkIn ? parseISO(checkIn) : new Date()));
  const effectiveMinDate = minDate ?? toISO(new Date());
  const todayIso = toISO(new Date());

  // Buffers de texto editable — se resincronizan con las props cada vez que la fecha cambia
  // desde el calendario (o desde afuera), pero no interfieren mientras el usuario está tipeando
  // un valor todavía incompleto.
  const [checkInText, setCheckInText] = useState(() => formatDisplay(checkIn));
  const [checkOutText, setCheckOutText] = useState(() => formatDisplay(checkOut));
  useEffect(() => setCheckInText(formatDisplay(checkIn)), [checkIn]);
  useEffect(() => setCheckOutText(formatDisplay(checkOut)), [checkOut]);

  const toggleOpen = () => {
    if (!open) setViewMonth(checkIn ? parseISO(checkIn) : new Date());
    setOpen(o => !o);
  };

  const handleCheckInTextChange = (raw: string) => {
    const masked = maskTypingValue(raw);
    setCheckInText(masked);
    const iso = parseTypedDate(masked);
    if (iso && iso >= effectiveMinDate) {
      onChange(iso, checkOut && checkOut > iso ? checkOut : "");
      setViewMonth(parseISO(iso));
    }
  };

  const handleCheckOutTextChange = (raw: string) => {
    const masked = maskTypingValue(raw);
    setCheckOutText(masked);
    const iso = parseTypedDate(masked);
    if (iso && (!checkIn || iso > checkIn)) {
      onChange(checkIn, iso);
      setViewMonth(parseISO(iso));
    }
  };

  const handleDayClick = (iso: string) => {
    if (iso < effectiveMinDate) return;
    if (!checkIn || checkOut) {
      onChange(iso, "");
      return;
    }
    if (iso <= checkIn) {
      onChange(iso, "");
    } else {
      onChange(checkIn, iso);
      setOpen(false);
    }
  };

  const handleToday = () => {
    const t = new Date();
    const tomorrow = new Date(t.getTime() + 86400000);
    onChange(toISO(t), toISO(tomorrow));
    setViewMonth(t);
  };

  const handleClear = () => onChange("", "");

  const nights = checkIn && checkOut
    ? Math.round((parseISO(checkOut).getTime() - parseISO(checkIn).getTime()) / 86400000)
    : 0;

  const grid = buildMonthGrid(viewMonth.getFullYear(), viewMonth.getMonth());

  return (
    <div className="relative sm:col-span-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
            {checkInLabel}{required && !checkIn && <span className="text-red-500"> *</span>}
          </label>
          <div className={`relative w-full border rounded transition-colors ${
            required && !checkIn ? "border-red-200 bg-red-50/30" : "border-zinc-200 bg-white focus-within:border-zinc-400"
          }`}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="dd-mm-aaaa"
              value={checkInText}
              onChange={(e) => handleCheckInTextChange(e.target.value)}
              className="w-full p-2.5 pr-8 bg-transparent rounded text-xs font-semibold text-zinc-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleOpen}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              title="Abrir calendario"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
            {checkOutLabel}{required && !checkOut && <span className="text-red-500"> *</span>}
          </label>
          <div className={`relative w-full border rounded transition-colors ${
            required && !checkOut ? "border-red-200 bg-red-50/30" : "border-zinc-200 bg-white focus-within:border-zinc-400"
          }`}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="dd-mm-aaaa"
              value={checkOutText}
              onChange={(e) => handleCheckOutTextChange(e.target.value)}
              className="w-full p-2.5 pr-8 bg-transparent rounded text-xs font-semibold text-zinc-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleOpen}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              title="Abrir calendario"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Resumen de noches siempre visible (no solo dentro del calendario), para que el
          vendedor detecte de inmediato si se equivocó al elegir las fechas. */}
      {checkIn && checkOut && (
        <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
          nights > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {nights > 0 ? (
            <>🌙 {nights} noche{nights === 1 ? "" : "s"} seleccionada{nights === 1 ? "" : "s"}</>
          ) : (
            <>⚠ El check-out debe ser posterior al check-in</>
          )}
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 left-0 mt-1.5 w-full sm:w-80 bg-white border border-zinc-200 rounded-lg shadow-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setViewMonth(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
                className="p-1 hover:bg-zinc-100 rounded cursor-pointer text-zinc-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-zinc-800 capitalize">
                {MONTH_NAMES[viewMonth.getMonth()]} de {viewMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
                className="p-1 hover:bg-zinc-100 rounded cursor-pointer text-zinc-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAY_NAMES.map(d => (
                <span key={d} className="text-[9.5px] font-bold uppercase text-zinc-400 text-center py-1">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {grid.map((date, i) => {
                const iso = toISO(date);
                const inCurrentMonth = date.getMonth() === viewMonth.getMonth();
                const isDisabled = iso < effectiveMinDate;
                const isCheckIn = iso === checkIn;
                const isCheckOut = iso === checkOut;
                const isEndpoint = isCheckIn || isCheckOut;
                const isInRange = !!checkIn && !!checkOut && iso > checkIn && iso < checkOut;
                const isToday = iso === todayIso;

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDayClick(iso)}
                    className={`h-8 w-full text-[11px] font-semibold rounded-md transition-colors
                      ${!inCurrentMonth ? "text-zinc-300" : "text-zinc-700"}
                      ${isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                      ${!isDisabled && !isEndpoint ? "hover:bg-zinc-100" : ""}
                      ${isInRange ? "bg-blue-50 text-blue-700" : ""}
                      ${isEndpoint ? "bg-zinc-950 text-white hover:bg-zinc-900" : ""}
                      ${isToday && !isEndpoint ? "ring-1 ring-inset ring-zinc-300" : ""}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
              <div className="flex gap-3">
                <button type="button" onClick={handleClear} className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer">
                  Borrar
                </button>
                <button type="button" onClick={handleToday} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer">
                  Hoy
                </button>
              </div>
              {nights > 0 && (
                <span className="text-[10.5px] font-bold text-zinc-600">{nights} noche{nights === 1 ? "" : "s"}</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
