import React, { useState } from "react";
import { ExtraService, ServiceRate, ServiceCategory, PricingModel, Proveedor } from "../types/producto";
import { nextSequentialId } from "../lib/idGenerator";
import { Search, Plus, MapPin, Edit3, Trash2, Tag, Compass, X, Save } from "lucide-react";

interface ServiciosViewProps {
  extraServices: ExtraService[];
  serviceRates: ServiceRate[];
  onAddExtraService: (srv: ExtraService) => void;
  onUpdateExtraService: (srv: ExtraService) => void;
  onAddServiceRate: (rate: ServiceRate) => void;
  onDeleteServiceRate: (id: string) => void;
  proveedores?: Proveedor[];
}

export default function ServiciosView({
  extraServices,
  serviceRates,
  onAddExtraService,
  onUpdateExtraService,
  onAddServiceRate,
  onDeleteServiceRate,
  proveedores = []
}: ServiciosViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<ServiceCategory | "ALL">("ALL");
  const [providerSearch, setProviderSearch] = useState("");
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"detalles" | "tarifas">("detalles");

  // Form states
  const [serviceForm, setServiceForm] = useState<Partial<ExtraService>>({});
  const [rateForm, setRateForm] = useState<Partial<ServiceRate>>({
    pricingModel: PricingModel.POR_PERSONA
  });
  const [margen, setMargen] = useState<number>(15);

  const calculatePVP = (neto: number | undefined, pct: number) => {
    if (!neto) return 0;
    return Math.round((neto / (1 - pct / 100)) * 100) / 100;
  };

  // Reverse of calculatePVP — used when the provider gives the PVP/venta directly (commission
  // already included) and the neto needs to be derived from the margin instead.
  const calculateNeto = (venta: number | undefined, pct: number) => {
    if (!venta) return 0;
    return Math.round((venta * (1 - pct / 100)) * 100) / 100;
  };

  const filteredServices = extraServices.filter(s => {
    const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.providerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCategory === "ALL" || s.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenService = (s?: ExtraService) => {
    if (s) {
      setActiveServiceId(s.id);
      setServiceForm(s);
      setProviderSearch(s.providerName || "");
    } else {
      setActiveServiceId("new");
      setServiceForm({
        nombre: "",
        providerName: "",
        category: ServiceCategory.EXCURSION,
        ubicacion: "",
        descripcion: "",
        politicasCancelacion: "",
        status: "Activo"
      });
      setProviderSearch("");
    }
    setActiveTab("detalles");
  };

  const handleSaveService = () => {
    if (activeServiceId === "new") {
      const newSrv = { ...serviceForm, id: nextSequentialId("srv", extraServices.map(s => s.id)) } as ExtraService;
      onAddExtraService(newSrv);
      setActiveServiceId(newSrv.id);
    } else {
      onUpdateExtraService(serviceForm as ExtraService);
    }
  };

  const activeService = activeServiceId !== "new" ? extraServices.find(s => s.id === activeServiceId) : null;
  const activeServiceRates = serviceRates.filter(r => r.extraServiceId === activeServiceId);

  const handleSaveRate = () => {
    if (!activeServiceId || activeServiceId === "new") return;
    const newRate = { ...rateForm, id: nextSequentialId("rate", serviceRates.map(r => r.id)), extraServiceId: activeServiceId } as ServiceRate;
    onAddServiceRate(newRate);
    setRateForm({ pricingModel: PricingModel.POR_PERSONA }); // reset
  };

  const handleDeleteRate = (id: string) => {
    onDeleteServiceRate(id);
  };

  return (
    <div className="p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6" /> Directorio de Servicios Varios
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Gestiona traslados, excursiones, tickets y otros servicios turísticos.
          </p>
        </div>
        <button 
          onClick={() => handleOpenService()}
          className="bg-zinc-950 hover:bg-zinc-800 text-white px-4 py-2 rounded shadow-xs text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Crear Servicio
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar por nombre o proveedor..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded focus:outline-none focus:border-zinc-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="border border-zinc-200 rounded px-3 py-2 text-sm font-semibold bg-white focus:outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
          >
            <option value="ALL">Todas las Categorías</option>
            <option value={ServiceCategory.TRASLADO}>Traslados</option>
            <option value={ServiceCategory.EXCURSION}>Excursiones</option>
            <option value={ServiceCategory.TICKET}>Tickets/Entradas</option>
            <option value={ServiceCategory.ASISTENCIA}>Asistencia</option>
          </select>
        </div>

        {/* DataTable */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-zinc-700">
            <thead className="bg-zinc-100 text-[10px] uppercase font-bold text-zinc-500 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 border-b border-zinc-200">Servicio</th>
                <th className="px-6 py-3 border-b border-zinc-200">Categoría</th>
                <th className="px-6 py-3 border-b border-zinc-200">Proveedor</th>
                <th className="px-6 py-3 border-b border-zinc-200">Ubicación</th>
                <th className="px-6 py-3 border-b border-zinc-200 text-center">Estado</th>
                <th className="px-6 py-3 border-b border-zinc-200"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-400 font-medium">
                    No hay servicios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : filteredServices.map(s => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-bold text-zinc-900">{s.nombre}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{s.id}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      <Tag className="w-3 h-3" /> {s.category}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-medium text-zinc-800">{s.providerName}</td>
                  <td className="px-6 py-3 text-xs text-zinc-600 flex items-center gap-1.5 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {s.ubicacion}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${s.status === "Activo" ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => handleOpenService(s)} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {activeServiceId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <div>
                <h3 className="text-lg font-black text-zinc-900">
                  {activeServiceId === "new" ? "Nuevo Servicio" : activeService?.nombre}
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono font-bold">{activeServiceId}</p>
              </div>
              <button onClick={() => setActiveServiceId(null)} className="p-1.5 bg-white border border-zinc-200 rounded hover:bg-zinc-100 transition-colors">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-200 px-6 bg-zinc-50">
              <button 
                onClick={() => setActiveTab("detalles")}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "detalles" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-700"}`}
              >
                Detalles del Servicio
              </button>
              <button 
                onClick={() => {
                  if(activeServiceId !== "new") setActiveTab("tarifas");
                  else alert("Guarda el servicio primero antes de configurar tarifas.");
                }}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "tarifas" ? "border-zinc-950 text-zinc-950" : "border-transparent text-zinc-400 hover:text-zinc-700"} ${activeServiceId === "new" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Configuración de Tarifas
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto bg-zinc-50/30">
              {activeTab === "detalles" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Nombre del Servicio</label>
                      <input 
                        type="text" 
                        value={serviceForm.nombre || ""} 
                        onChange={e => setServiceForm({...serviceForm, nombre: e.target.value})}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white"
                      />
                    </div>
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Proveedor Local (DMC)</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type="text"
                          value={providerSearch}
                          onChange={e => {
                            const val = e.target.value;
                            setProviderSearch(val);
                            setShowProviderDropdown(true);
                            // Free typing without picking a suggestion just records the name as-is,
                            // same fallback behavior as before when no proveedores catalog existed.
                            const matched = proveedores.find(p => p.nombre.toLowerCase() === val.toLowerCase());
                            setServiceForm({
                              ...serviceForm,
                              providerName: val,
                              providerId: matched?.id
                            });
                          }}
                          onFocus={() => setShowProviderDropdown(true)}
                          placeholder="Buscar o escribir proveedor..."
                          className="w-full pl-8 pr-7 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white"
                        />
                        {providerSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setProviderSearch("");
                              setServiceForm({ ...serviceForm, providerName: "", providerId: undefined });
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-100 rounded text-zinc-400 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {showProviderDropdown && (
                        <div className="fixed inset-0 z-40" onClick={() => setShowProviderDropdown(false)} />
                      )}

                      {showProviderDropdown && proveedores.length > 0 && (() => {
                        const query = providerSearch.toLowerCase();
                        const matches = proveedores.filter(p => p.status === "Activo" && p.nombre.toLowerCase().includes(query));
                        return (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-52 overflow-y-auto divide-y divide-zinc-150">
                            {matches.length === 0 ? (
                              <div className="p-3 text-xs text-zinc-400 italic">
                                Ningún proveedor del catálogo coincide. Se guardará como "{providerSearch || "Manual"}".
                              </div>
                            ) : (
                              matches.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setProviderSearch(p.nombre);
                                    setServiceForm({ ...serviceForm, providerId: p.id, providerName: p.nombre });
                                    setShowProviderDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                >
                                  {p.nombre} <span className="text-zinc-400 font-normal">({p.tipo})</span>
                                </button>
                              ))
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Categoría</label>
                      <select 
                        value={serviceForm.category || ServiceCategory.EXCURSION} 
                        onChange={e => setServiceForm({...serviceForm, category: e.target.value as ServiceCategory})}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white"
                      >
                        <option value={ServiceCategory.TRASLADO}>Traslado</option>
                        <option value={ServiceCategory.EXCURSION}>Excursión</option>
                        <option value={ServiceCategory.TICKET}>Ticket / Entrada</option>
                        <option value={ServiceCategory.ASISTENCIA}>Asistencia al Viajero</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Ubicación / Ciudad</label>
                      <input 
                        type="text" 
                        value={serviceForm.ubicacion || ""} 
                        onChange={e => setServiceForm({...serviceForm, ubicacion: e.target.value})}
                        className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Descripción del Servicio</label>
                    <textarea 
                      rows={3}
                      value={serviceForm.descripcion || ""} 
                      onChange={e => setServiceForm({...serviceForm, descripcion: e.target.value})}
                      className="w-full px-3 py-2 border border-zinc-200 rounded text-sm bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Políticas de Cancelación</label>
                    <textarea 
                      rows={2}
                      value={serviceForm.politicasCancelacion || ""} 
                      onChange={e => setServiceForm({...serviceForm, politicasCancelacion: e.target.value})}
                      className="w-full px-3 py-2 border border-zinc-200 rounded text-sm bg-white"
                    />
                  </div>

                  <div className="pt-4 border-t border-zinc-200 flex justify-end">
                    <button 
                      onClick={handleSaveService}
                      className="bg-zinc-950 hover:bg-zinc-800 text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Guardar Perfil del Servicio
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "tarifas" && (
                <div className="space-y-6">
                  {/* Lista de Tarifas */}
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-widest mb-3">Tarifas Registradas</h4>
                    {activeServiceRates.length === 0 ? (
                      <div className="bg-white border border-zinc-200 rounded-lg p-6 text-center text-sm text-zinc-500 font-medium">
                        No hay tarifas registradas para este servicio. Agrega una nueva a continuación.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeServiceRates.map(r => (
                          <div key={r.id} className="bg-white border border-zinc-200 rounded-lg p-4 flex justify-between items-center shadow-sm">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-black uppercase border border-zinc-200">
                                  {r.pricingModel}
                                </span>
                                <span className="text-[11px] font-bold text-zinc-800">
                                  {r.temporadaInicio} a {r.temporadaFin}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-zinc-600 mt-2">
                                {r.pricingModel === PricingModel.POR_PERSONA ? (
                                  <div className="flex gap-4 text-xs">
                                    <span>Adulto: <span className="text-blue-600 font-bold">${r.netoAdulto}</span> neto / <span className="text-green-600 font-bold">${r.ventaAdulto}</span> vta</span>
                                    <span>Niño: <span className="text-blue-600 font-bold">${r.netoNino}</span> neto / <span className="text-green-600 font-bold">${r.ventaNino}</span> vta</span>
                                  </div>
                                ) : (
                                  <div className="flex gap-4 text-xs">
                                    <span>Capacidad Max: <span className="font-bold text-zinc-800">{r.capacidadMaxima} pax</span></span>
                                    <span>Vehículo/Grupo: <span className="text-blue-600 font-bold">${r.netoTotal}</span> neto / <span className="text-green-600 font-bold">${r.ventaTotal}</span> vta</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button onClick={() => handleDeleteRate(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Formulario Nueva Tarifa */}
                  <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm mt-8">
                    <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-widest mb-4 border-b border-zinc-150 pb-2">Añadir Nueva Temporada / Tarifa</h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Modelo de Precios</label>
                        <select 
                          value={rateForm.pricingModel} 
                          onChange={e => setRateForm({...rateForm, pricingModel: e.target.value as PricingModel})}
                          className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold bg-zinc-50"
                        >
                          <option value={PricingModel.POR_PERSONA}>Por Persona</option>
                          <option value={PricingModel.POR_VEHICULO_GRUPO}>Por Vehículo / Grupo</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Inicio Temporada</label>
                        <input 
                          type="date" 
                          value={rateForm.temporadaInicio || ""} 
                          onChange={e => setRateForm({...rateForm, temporadaInicio: e.target.value})}
                          className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Fin Temporada</label>
                        <input 
                          type="date" 
                          value={rateForm.temporadaFin || ""} 
                          onChange={e => setRateForm({...rateForm, temporadaFin: e.target.value})}
                          className="w-full px-3 py-2 border border-zinc-200 rounded text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                      <div className="mb-4 pb-4 border-b border-zinc-200">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                          Margen Sugerido (%) para Autocalcular PVP
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="relative w-48">
                            <input 
                              type="number" 
                              value={margen} 
                              onChange={e => {
                                const newMargen = parseFloat(e.target.value) || 0;
                                setMargen(newMargen);
                                if (rateForm.pricingModel === PricingModel.POR_PERSONA) {
                                  setRateForm({
                                    ...rateForm,
                                    ventaAdulto: calculatePVP(rateForm.netoAdulto, newMargen),
                                    ventaNino: calculatePVP(rateForm.netoNino, newMargen)
                                  });
                                } else {
                                  setRateForm({
                                    ...rateForm,
                                    ventaTotal: calculatePVP(rateForm.netoTotal, newMargen)
                                  });
                                }
                              }}
                              className="w-full px-3 py-2 pr-8 border border-zinc-200 rounded text-sm font-bold text-zinc-900 bg-white focus:outline-none" 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">%</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            Al ingresar el Costo Neto, el PVP se calculará usando este porcentaje de ganancia.
                          </span>
                        </div>
                      </div>

                      {rateForm.pricingModel === PricingModel.POR_PERSONA ? (
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Neto Adulto ($)</label>
                            <input 
                              type="number" 
                              value={rateForm.netoAdulto || ""} 
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setRateForm({...rateForm, netoAdulto: val, ventaAdulto: calculatePVP(val, margen)});
                              }} 
                              className="w-full px-3 py-2 border border-blue-200 rounded text-sm font-mono" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-green-600 uppercase tracking-widest block">Venta Adulto ($)</label>
                            <input
                              type="number"
                              value={rateForm.ventaAdulto || ""}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setRateForm({...rateForm, ventaAdulto: val, netoAdulto: calculateNeto(val, margen)});
                              }}
                              className="w-full px-3 py-2 border border-green-200 rounded text-sm font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Neto Niño ($)</label>
                            <input 
                              type="number" 
                              value={rateForm.netoNino || ""} 
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setRateForm({...rateForm, netoNino: val, ventaNino: calculatePVP(val, margen)});
                              }} 
                              className="w-full px-3 py-2 border border-blue-200 rounded text-sm font-mono" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-green-600 uppercase tracking-widest block">Venta Niño ($)</label>
                            <input
                              type="number"
                              value={rateForm.ventaNino || ""}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setRateForm({...rateForm, ventaNino: val, netoNino: calculateNeto(val, margen)});
                              }}
                              className="w-full px-3 py-2 border border-green-200 rounded text-sm font-mono"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block">Capacidad Máxima (Pax)</label>
                            <input type="number" value={rateForm.capacidadMaxima || ""} onChange={e => setRateForm({...rateForm, capacidadMaxima: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Costo Neto Total ($)</label>
                            <input 
                              type="number" 
                              value={rateForm.netoTotal || ""} 
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setRateForm({...rateForm, netoTotal: val, ventaTotal: calculatePVP(val, margen)});
                              }} 
                              className="w-full px-3 py-2 border border-blue-200 rounded text-sm font-mono" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-green-600 uppercase tracking-widest block">Venta Total (PVP) ($)</label>
                            <input
                              type="number"
                              value={rateForm.ventaTotal || ""}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setRateForm({...rateForm, ventaTotal: val, netoTotal: calculateNeto(val, margen)});
                              }}
                              className="w-full px-3 py-2 border border-green-200 rounded text-sm font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={handleSaveRate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Agregar Tarifa
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
