import { useState, useEffect, useRef, type ReactNode } from "react";
import { Search, X, Loader2 } from "lucide-react";

/**
 * Modal buscador reutilizable para seleccionar UNA entidad de un catálogo.
 * El `search` puede ser síncrono (filtra en memoria — Fase 1) o asíncrono (consulta
 * server-side — Fase 2), sin cambiar la UX: internamente siempre se espera el resultado.
 */
export default function PickerModal<T>({
  open, onClose, onSelect,
  title, placeholder = "Buscar por nombre…",
  search, getKey, renderItem,
  emptyHint = "Escribe para buscar.",
  noResultsHint = "Sin coincidencias.",
  maxResults = 50,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
  title: string;
  placeholder?: string;
  search: (term: string) => T[] | Promise<T[]>;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  emptyHint?: string;
  noResultsHint?: string;
  maxResults?: number;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  // Al abrir: limpia y enfoca el buscador.
  useEffect(() => {
    if (open) {
      setTerm("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Búsqueda con pequeño debounce; tolera search síncrono o asíncrono.
  useEffect(() => {
    if (!open) return;
    const myReq = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await Promise.resolve(search(term));
        if (reqId.current === myReq) setResults(res.slice(0, maxResults));
      } catch {
        if (reqId.current === myReq) setResults([]);
      } finally {
        if (reqId.current === myReq) setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center z-[60] p-4 pt-[10vh] font-sans" onClick={onClose}>
      <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <h4 className="font-black text-xs text-zinc-900 uppercase tracking-widest">{title}</h4>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-700 cursor-pointer text-lg leading-none">×</button>
        </div>
        <div className="p-3 border-b border-zinc-100">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              value={term}
              onChange={e => setTerm(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-md border border-zinc-200 focus:border-zinc-500 focus:outline-none font-semibold"
            />
            {loading
              ? <Loader2 className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
              : term && <button type="button" onClick={() => setTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 cursor-pointer"><X className="w-4 h-4" /></button>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
          {results.length === 0 ? (
            <p className="p-6 text-center text-[11px] text-zinc-400 font-semibold italic">
              {loading ? "Buscando…" : term ? noResultsHint : emptyHint}
            </p>
          ) : (
            results.map(item => (
              <button
                key={getKey(item)}
                type="button"
                onClick={() => { onSelect(item); onClose(); }}
                className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 cursor-pointer transition-colors"
              >
                {renderItem(item)}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
