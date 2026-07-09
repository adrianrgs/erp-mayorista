import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Proveedor } from "../../types/producto";

interface ProveedorPickerProps {
  nombre: string;
  proveedorId?: string;
  onChange: (nombre: string, proveedorId: string | undefined) => void;
  proveedores: Proveedor[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

// Combobox de "elegir del catálogo de Proveedores O dejar el texto libre tal cual" — igual que
// ya funciona a mano en ServiciosView.tsx para el proveedor de un ExtraService, generalizado
// para usarse en cualquier tipo de servicio de Reservas. A diferencia de SearchableSelect (que
// asume que el valor SIEMPRE es una opción de la lista), acá el texto escrito se conserva aunque
// no matchee ningún proveedor del catálogo (proveedorId queda undefined en ese caso).
export default function ProveedorPicker({
  nombre,
  proveedorId,
  onChange,
  proveedores,
  placeholder = "Buscar o escribir proveedor...",
  disabled,
  required,
  className = ""
}: ProveedorPickerProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const matches = proveedores.filter(
    p => p.status === "Activo" && p.nombre.toLowerCase().includes(nombre.toLowerCase())
  );

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        <input
          type="text"
          required={required}
          disabled={disabled}
          value={nombre}
          onChange={(e) => {
            const val = e.target.value;
            const matched = proveedores.find(p => p.nombre.toLowerCase() === val.toLowerCase());
            onChange(val, matched?.id);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className={`w-full pl-8 pr-7 p-2.5 border rounded text-xs font-bold focus:outline-none ${
            disabled ? "bg-zinc-100 text-zinc-600 cursor-not-allowed border-zinc-200" : "bg-white text-zinc-900 border-zinc-200"
          }`}
        />
        {nombre && !disabled && (
          <button
            type="button"
            onClick={() => onChange("", undefined)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-100 rounded text-zinc-400 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showDropdown && !disabled && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}

      {showDropdown && !disabled && proveedores.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-52 overflow-y-auto divide-y divide-zinc-100">
          {matches.length === 0 ? (
            <div className="p-3 text-xs text-zinc-400 italic">
              Ningún proveedor del catálogo coincide. Se guardará como "{nombre || "texto libre"}".
            </div>
          ) : (
            matches.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p.nombre, p.id);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                {p.nombre} <span className="text-zinc-400 font-normal">({p.tipo})</span>
                {proveedorId === p.id && <span className="ml-1 text-emerald-600 font-bold">✓</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
