import React, { useState } from "react";
import { Proveedor, TipoProveedor } from "../types/producto";
import { Search, Plus, Edit3, X, Save, Phone, Mail, MapPin, Tag, DollarSign, Briefcase, Building2 } from "lucide-react";

interface ProveedoresViewProps {
  proveedores: Proveedor[];
  onAddProveedor: (p: Proveedor) => void;
  onUpdateProveedor: (p: Proveedor) => void;
}

const TIPO_COLORS: Record<TipoProveedor, string> = {
  [TipoProveedor.EXCURSION]: "bg-purple-50 text-purple-700 border-purple-200",
  [TipoProveedor.TRASLADO]: "bg-blue-50 text-blue-700 border-blue-200",
  [TipoProveedor.BUCEO]: "bg-cyan-50 text-cyan-700 border-cyan-200",
  [TipoProveedor.FULL_DAY]: "bg-orange-50 text-orange-700 border-orange-200",
  [TipoProveedor.TICKET]: "bg-yellow-50 text-yellow-700 border-yellow-200",
  [TipoProveedor.ASISTENCIA]: "bg-green-50 text-green-700 border-green-200",
  [TipoProveedor.GUIA]: "bg-teal-50 text-teal-700 border-teal-200",
  [TipoProveedor.OTRO]: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const EMPTY_FORM: Partial<Proveedor> = {
  nombre: "",
  tipo: TipoProveedor.EXCURSION,
  contactoPrincipal: "",
  telefono: "",
  email: "",
  rif: "",
  ubicacion: "",
  pais: "Venezuela",
  comision: 10,
  condicionesPago: "",
  datosBancarios: "",
  status: "Activo",
  notas: "",
};

export default function ProveedoresView({ proveedores, onAddProveedor, onUpdateProveedor }: ProveedoresViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<TipoProveedor | "ALL">("ALL");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Proveedor>>({});
  const [activeTab, setActiveTab] = useState<"info" | "financiero">("info");

  const filtered = proveedores.filter(p => {
    const matchSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contactoPrincipal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === "ALL" || p.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  const handleOpen = (p?: Proveedor) => {
    if (p) {
      setActiveId(p.id);
      setForm({ ...p });
    } else {
      setActiveId("new");
      setForm({ ...EMPTY_FORM });
    }
    setActiveTab("info");
  };

  const handleSave = () => {
    if (activeId === "new") {
      const newP = { ...form, id: `prov-${Date.now()}` } as Proveedor;
      onAddProveedor(newP);
      setActiveId(newP.id);
    } else {
      onUpdateProveedor(form as Proveedor);
    }
  };

  const activeProveedor = activeId && activeId !== "new" ? proveedores.find(p => p.id === activeId) : null;

  return (
    <div className="p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6" /> Directorio de Proveedores
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Empresas de servicios turísticos: excursiones, traslados, buceo, full day y más.
          </p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="bg-zinc-950 hover:bg-zinc-800 text-white px-4 py-2 rounded shadow-xs text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, contacto o ubicación..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded focus:outline-none focus:border-zinc-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-zinc-200 rounded px-3 py-2 text-sm font-semibold bg-white focus:outline-none"
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value as TipoProveedor | "ALL")}
          >
            <option value="ALL">Todos los Tipos</option>
            {Object.values(TipoProveedor).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="px-6 py-2.5 border-b border-zinc-100 bg-zinc-50/60 flex gap-6">
          <span className="text-xs text-zinc-500 font-medium">
            Total: <span className="font-bold text-zinc-800">{proveedores.length}</span>
          </span>
          <span className="text-xs text-zinc-500 font-medium">
            Activos: <span className="font-bold text-green-700">{proveedores.filter(p => p.status === "Activo").length}</span>
          </span>
          <span className="text-xs text-zinc-500 font-medium">
            Mostrando: <span className="font-bold text-zinc-800">{filtered.length}</span>
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-zinc-700">
            <thead className="bg-zinc-100 text-[10px] uppercase font-bold text-zinc-500 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 border-b border-zinc-200">Proveedor</th>
                <th className="px-6 py-3 border-b border-zinc-200">Tipo de Servicio</th>
                <th className="px-6 py-3 border-b border-zinc-200">Contacto</th>
                <th className="px-6 py-3 border-b border-zinc-200">Ubicación</th>
                <th className="px-6 py-3 border-b border-zinc-200 text-center">Comisión</th>
                <th className="px-6 py-3 border-b border-zinc-200 text-center">Estado</th>
                <th className="px-6 py-3 border-b border-zinc-200"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-zinc-400">
                      <Building2 className="w-10 h-10 opacity-30" />
                      <p className="font-medium text-sm">
                        {proveedores.length === 0
                          ? "No hay proveedores registrados"
                          : "No hay proveedores que coincidan"}
                      </p>
                      {proveedores.length === 0 && (
                        <p className="text-xs">Crea tu primer proveedor con el botón "Nuevo Proveedor"</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr
                    key={p.id}
                    className="hover:bg-zinc-50 transition-colors cursor-pointer"
                    onClick={() => handleOpen(p)}
                  >
                    <td className="px-6 py-3">
                      <div className="font-bold text-zinc-900">{p.nombre}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">RIF: {p.rif || "—"}</div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border ${TIPO_COLORS[p.tipo]}`}>
                        <Tag className="w-3 h-3" /> {p.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-medium text-zinc-800 text-xs">{p.contactoPrincipal || "—"}</div>
                      {p.telefono && (
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                          <Phone className="w-3 h-3" /> {p.telefono}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1 text-xs text-zinc-600">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        {p.ubicacion}{p.pais ? `, ${p.pais}` : ""}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="font-bold text-zinc-800 text-sm">{p.comision}%</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${p.status === "Activo" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right" onClick={e => { e.stopPropagation(); handleOpen(p); }}>
                      <button className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editor */}
      {activeId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">

            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <div>
                <h3 className="text-lg font-black text-zinc-900">
                  {activeId === "new" ? "Nuevo Proveedor" : (activeProveedor?.nombre ?? form.nombre)}
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono font-bold">
                  {activeId !== "new" ? activeId : "ID asignado al guardar"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={form.status || "Activo"}
                  onChange={e => setForm({ ...form, status: e.target.value as "Activo" | "Inactivo" })}
                  className={`text-xs font-bold px-2 py-1 rounded border cursor-pointer ${form.status === "Activo" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
                <button onClick={() => setActiveId(null)} className="p-1.5 bg-white border border-zinc-200 rounded hover:bg-zinc-100 transition-colors">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-200 px-6 bg-zinc-50">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "info" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-700"}`}
              >
                Información General
              </button>
              <button
                onClick={() => setActiveTab("financiero")}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "financiero" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-700"}`}
              >
                Datos Financieros
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              {activeTab === "info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Nombre del Proveedor / Empresa</label>
                      <input
                        type="text"
                        value={form.nombre || ""}
                        onChange={e => setForm({ ...form, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white focus:outline-none focus:border-zinc-400"
                        placeholder="Ej: Buceo Caribe C.A."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Tipo de Servicio Principal</label>
                      <select
                        value={form.tipo || TipoProveedor.EXCURSION}
                        onChange={e => setForm({ ...form, tipo: e.target.value as TipoProveedor })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white focus:outline-none"
                      >
                        {Object.values(TipoProveedor).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">RIF / Identificación Fiscal</label>
                      <input
                        type="text"
                        value={form.rif || ""}
                        onChange={e => setForm({ ...form, rif: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white focus:outline-none"
                        placeholder="Ej: J-12345678-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Contacto Principal</label>
                      <input
                        type="text"
                        value={form.contactoPrincipal || ""}
                        onChange={e => setForm({ ...form, contactoPrincipal: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white focus:outline-none"
                        placeholder="Nombre y apellido"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Teléfono
                      </label>
                      <input
                        type="tel"
                        value={form.telefono || ""}
                        onChange={e => setForm({ ...form, telefono: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white focus:outline-none"
                        placeholder="+58 412 000 0000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </label>
                      <input
                        type="email"
                        value={form.email || ""}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white focus:outline-none"
                        placeholder="contacto@proveedor.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Ciudad / Ubicación
                      </label>
                      <input
                        type="text"
                        value={form.ubicacion || ""}
                        onChange={e => setForm({ ...form, ubicacion: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white focus:outline-none"
                        placeholder="Ej: Porlamar, Isla de Margarita"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">País</label>
                      <input
                        type="text"
                        value={form.pais || ""}
                        onChange={e => setForm({ ...form, pais: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white focus:outline-none"
                        placeholder="Venezuela"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Notas Internas</label>
                    <textarea
                      rows={3}
                      value={form.notas || ""}
                      onChange={e => setForm({ ...form, notas: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 rounded text-sm bg-white focus:outline-none"
                      placeholder="Notas sobre este proveedor..."
                    />
                  </div>
                </div>
              )}

              {activeTab === "financiero" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Comisión (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={form.comision ?? 10}
                          onChange={e => setForm({ ...form, comision: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 pr-8 border border-zinc-200 rounded text-sm font-bold bg-white focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Condiciones de Pago</label>
                      <input
                        type="text"
                        value={form.condicionesPago || ""}
                        onChange={e => setForm({ ...form, condicionesPago: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white focus:outline-none"
                        placeholder="Ej: 30 días, pago anticipado..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Datos Bancarios</label>
                    <textarea
                      rows={5}
                      value={form.datosBancarios || ""}
                      onChange={e => setForm({ ...form, datosBancarios: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 rounded text-sm bg-white focus:outline-none"
                      placeholder="Banco, número de cuenta, tipo de cuenta, titular, RIF del titular..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
              <button
                onClick={handleSave}
                className="bg-zinc-950 hover:bg-zinc-800 text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                {activeId === "new" ? "Crear Proveedor" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
