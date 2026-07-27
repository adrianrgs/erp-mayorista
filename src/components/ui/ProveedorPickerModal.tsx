import { useState } from "react";
import { Search } from "lucide-react";
import { Proveedor } from "../../types/producto";
import PickerModal from "./PickerModal";
import { searchProveedores } from "../../lib/dataconnect-shim";

/**
 * Selector de proveedor por MODAL buscador, forzando elegir uno del catálogo (sin texto libre).
 * Mismas props que ProveedorPicker (nombre/onChange) para poder intercambiarlo como drop-in.
 * onChange(nombre, proveedorId) — proveedorId SIEMPRE definido (viene del catálogo).
 */
export default function ProveedorPickerModal({
  nombre, onChange,
  placeholder = "Seleccionar proveedor del catálogo…",
  className = "",
}: {
  nombre: string;
  proveedorId?: string; // aceptado por compatibilidad (no se usa)
  onChange: (nombre: string, proveedorId: string | undefined) => void;
  proveedores?: Proveedor[]; // Fase 2: la búsqueda es server-side; el prop ya no se usa.
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 border border-zinc-200 rounded text-xs font-bold bg-white hover:border-zinc-400 cursor-pointer text-left ${className}`}
      >
        <span className={nombre ? "text-zinc-900 truncate" : "text-zinc-400"}>{nombre || placeholder}</span>
        <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      </button>
      <PickerModal<Proveedor>
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(p) => onChange(p.nombre, p.id)}
        title="Seleccionar proveedor"
        placeholder="Buscar proveedor por nombre…"
        search={async (term) => {
          const res = await searchProveedores(term, 40);
          return (res as Proveedor[]).filter(p => p.status === "Activo");
        }}
        getKey={(p) => p.id}
        renderItem={(p) => (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-zinc-800">{p.nombre}</span>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase shrink-0">{p.tipo}</span>
          </div>
        )}
        emptyHint="Sin proveedores activos en el catálogo."
        noResultsHint="Ningún proveedor coincide."
      />
    </>
  );
}
