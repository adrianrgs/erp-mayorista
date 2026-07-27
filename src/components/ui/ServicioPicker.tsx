import { useState } from "react";
import { Search, X } from "lucide-react";
import { ExtraService } from "../../types/producto";
import PickerModal from "./PickerModal";

/**
 * Selector de servicio del catálogo por MODAL buscador (consistente con hotel/proveedor).
 * Busca en el catálogo cargado (los servicios se cargan al entrar a Reservas). `category`
 * filtra por categoría (ej. "Traslado"). onSelect(null) = quitar la selección.
 */
export default function ServicioPicker({
  value, extraServices, category, onSelect,
  placeholder = "Seleccionar del catálogo…",
}: {
  value: string;
  extraServices: ExtraService[];
  category?: string;
  onSelect: (service: ExtraService | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = extraServices.find(s => s.id === value);
  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 flex items-center justify-between gap-2 px-3 py-2.5 border border-zinc-200 rounded text-xs font-bold bg-white hover:border-zinc-400 cursor-pointer text-left"
        >
          <span className={selected ? "text-zinc-900 truncate" : "text-zinc-400"}>{selected?.nombre || placeholder}</span>
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        </button>
        {selected && (
          <button type="button" onClick={() => onSelect(null)} title="Quitar" className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <PickerModal<ExtraService>
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(s) => onSelect(s)}
        title="Seleccionar del catálogo"
        placeholder="Buscar servicio por nombre…"
        search={(term) => {
          const q = term.trim().toLowerCase();
          return extraServices
            .filter(s => (!category || s.category === category) && s.status === "Activo" && (q === "" || s.nombre.toLowerCase().includes(q)))
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
        }}
        getKey={(s) => s.id}
        renderItem={(s) => (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-zinc-800 truncate">{s.nombre}</span>
            <span className="text-[10px] font-semibold text-zinc-400 shrink-0">{s.providerName}</span>
          </div>
        )}
        emptyHint="Sin servicios en el catálogo."
        noResultsHint="Ningún servicio coincide."
      />
    </>
  );
}
