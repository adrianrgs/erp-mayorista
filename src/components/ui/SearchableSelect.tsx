import React, { useState } from "react";
import { Search, X } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
}

// Combobox reutilizable: siempre muestra la lista desplegable de opciones, pero además
// permite escribir para filtrarla — mismo patrón visual ya usado en los buscadores de
// hotel/agencia/cliente directo de Reservas, generalizado para cualquier catálogo.
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Buscar...",
  emptyLabel = "Sin resultados.",
  disabled,
  className = ""
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find(o => o.value === value);
  const displayValue = open ? query : (selected?.label || "");

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.sublabel || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setQuery(""); setOpen(true); }}
          className="w-full p-2.5 pl-8 pr-7 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => { onChange(""); setQuery(""); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-100 rounded text-zinc-400 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-zinc-150">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-zinc-400 italic">{emptyLabel}</div>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setQuery(""); setOpen(false); }}
                  className="w-full text-left p-2.5 hover:bg-zinc-50 flex flex-col text-xs transition-colors cursor-pointer border-none font-sans"
                >
                  <span className="font-bold text-zinc-900">{o.label}</span>
                  {o.sublabel && <span className="text-[10px] text-zinc-450 font-mono">{o.sublabel}</span>}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
