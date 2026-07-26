import { useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { useIdLookup } from "../../hooks/useIdLookup";

/**
 * Buscador por id directo (trae de la base, no filtra en memoria). Reutilizable en cada
 * módulo y en el buscador global. Al encontrar el registro llama onFound(record).
 */
export default function IdSearchBox<T>({
  fetcher, onFound, placeholder = "Buscar por ID…", label,
}: {
  fetcher: (id: string) => Promise<T | null>;
  onFound: (record: T) => void;
  placeholder?: string;
  label?: string;
}) {
  const [q, setQ] = useState("");
  const { status, search, reset } = useIdLookup<T>(fetcher);

  const submit = async () => {
    const found = await search(q);
    if (found) onFound(found);
  };
  const clear = () => { setQ(""); reset(); };

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</label>}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder={placeholder}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-zinc-200 focus:border-zinc-400 focus:outline-none font-mono"
          />
          {q && (
            <button type="button" onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={status === "loading" || !q.trim()}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Buscar
        </button>
      </div>
      {status === "notfound" && <span className="text-[10.5px] text-amber-600 font-semibold">No existe “{q}” en la base.</span>}
      {status === "error" && <span className="text-[10.5px] text-red-600 font-semibold">Error al buscar. Intenta de nuevo.</span>}
    </div>
  );
}
