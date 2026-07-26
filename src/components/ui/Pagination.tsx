import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Fase 0 — control de paginación Prev/Siguiente (sin total; usa `hasMore`).
 * Reutilizable por cualquier listado con paginación server-side.
 */
export default function Pagination({
  page, hasMore, loading, onPrev, onNext, count,
}: {
  page: number;
  hasMore: boolean;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  count?: number;
}) {
  const btn = "inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-zinc-200 text-zinc-600 hover:bg-zinc-50 cursor-pointer";
  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <span className="text-[11px] text-zinc-400 font-semibold">
        Página {page + 1}
        {typeof count === "number" ? ` · ${count} en esta página` : ""}
        {loading ? " · cargando…" : ""}
      </span>
      <div className="flex gap-2">
        <button type="button" className={btn} onClick={onPrev} disabled={page === 0 || loading}>
          <ChevronLeft className="w-3.5 h-3.5" /> Anterior
        </button>
        <button type="button" className={btn} onClick={onNext} disabled={!hasMore || loading}>
          Siguiente <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
