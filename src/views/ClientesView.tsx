import React, { useState } from "react";
import { B2BClient, ClientType, ClientStatus, FinancialInvoice, Reservation, ServiceType } from "../types";
import { RoomType, RatePlan, TipoCobro, Property } from "../types/producto";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  ArrowLeft, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2,
  DollarSign,
  X,
  Edit2,
  Phone,
  Mail,
  User,
  FileText,
  Calendar,
  AlertTriangle
} from "lucide-react";

interface ClientesViewProps {
  clients: B2BClient[];
  onUpdateClient: (updated: B2BClient) => void;
  onAddClient: (newClient: B2BClient) => void;
  invoices: FinancialInvoice[];
  reservations: Reservation[];
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  detailedProperties: Property[];
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const calculateRoomRates = (
  room: any,
  detalles: any,
  mercado: "NACIONAL" | "INTERNACIONAL",
  ratePlans: RatePlan[],
  roomTypes: RoomType[]
) => {
  const { hotelId, selectedPromoName, checkInDate, checkOutDate, comisionB2B = 10, comisionPropia = 5 } = detalles;
  
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  let nights = 1;
  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
    const diff = end.getTime() - start.getTime();
    nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const roomRatePlan = ratePlans.find(rp => 
    rp.property_id === hotelId && 
    rp.mercado === mercado && 
    rp.nombrePromocion === selectedPromoName && 
    rp.roomType_id === room.roomTypeId
  );
  
  const rate = roomRatePlan || ratePlans.find(rp => rp.roomType_id === room.roomTypeId);
  if (!rate) return { pvp: 0, sale: 0, net: 0, comisionB2BVal: 0 };
  
  let roomRatePerNight = 0;
  if (rate.tipoCobro === TipoCobro.POR_HABITACION) {
    roomRatePerNight = rate.tarifaBase;
  } else {
    const adults = room.guests.filter((g: any) => g.type === "Adulto").length;
    const children = room.guests.filter((g: any) => g.type === "Niño").length;
    
    const rt = roomTypes.find(type => type.id === room.roomTypeId);
    const baseOcc = rt?.ocupacionBase || 2;
    const baseOccupants = Math.min(baseOcc, adults);
    const extraAdults = Math.max(0, adults - baseOccupants);
    
    roomRatePerNight = (rate.tarifaBase * baseOccupants) + 
                      (rate.tarifaExtraAdulto * extraAdults) + 
                      (rate.tarifaExtraNino * children);
  }
  
  const pvp = roomRatePerNight * nights;
  const sale = Math.round(pvp * (1 - comisionB2B / 100) * 100) / 100;
  const net = Math.round(pvp * (1 - (comisionB2B + comisionPropia) / 100) * 100) / 100;
  const comisionB2BVal = pvp - sale;

  return { pvp, sale, net, comisionB2BVal };
};

export default function ClientesView({ 
  clients, 
  onUpdateClient, 
  onAddClient,
  invoices,
  reservations,
  roomTypes,
  ratePlans,
  detailedProperties
}: ClientesViewProps) {
  // Navigation inside the module (Level 1: List, Level 2: Ficha Técnica, Level 3: Detalle Expediente)
  const [viewLevel, setViewLevel] = useState<1 | 2 | 3>(1);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [selectedResId, setSelectedResId] = useState<string | null>(null);

  // Filters & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [filterMorosoOnly, setFilterMorosoOnly] = useState<boolean>(false);

  // Registration Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    nombre: "",
    rif: "",
    tipo: ClientType.CREDITO,
    status: ClientStatus.ACTIVO,
    contactoNombre: "",
    email: "",
    telefono: "",
    saldoFavor: "",
    saldoDeber: "",
    limiteCredito: "",
    diasCredito: "",
    moroso: false,
    observaciones: ""
  });

  // Edit Form state (for Level 2)
  const [editForm, setEditForm] = useState<B2BClient | null>(null);

  // Active client selection
  const activeClient = clients.find(c => c.id === activeClientId);

  // Selected reservation details (Level 3)
  const selectedRes = reservations.find(r => r.id === selectedResId);

  // KPI Calculations
  const totalActivos = clients.filter(c => c.status === ClientStatus.ACTIVO).length;
  const totalMorosos = clients.filter(c => c.moroso).length;
  const totalListaNegra = clients.filter(c => c.status === ClientStatus.LISTA_NEGRA).length;

  // Filter clients list
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.rif.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactoNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === "ALL" || c.tipo === selectedType;
    const matchesStatus = selectedStatus === "ALL" || c.status === selectedStatus;
    const matchesMoroso = !filterMorosoOnly || c.moroso;

    return matchesSearch && matchesType && matchesStatus && matchesMoroso;
  });

  // Notification helper
  const [notification, setNotification] = useState("");
  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  // Handle Add Client Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.nombre || !newClientForm.rif) {
      triggerNotify("✕ Nombre y RIF/ID Fiscal son campos requeridos.");
      return;
    }

    const newClient: B2BClient = {
      id: `CLI-${Math.floor(100 + Math.random() * 900)}`,
      nombre: newClientForm.nombre,
      rif: newClientForm.rif,
      tipo: newClientForm.tipo,
      status: newClientForm.status,
      contactoNombre: newClientForm.contactoNombre || "Sin asignar",
      email: newClientForm.email || "contacto@empresa.com",
      telefono: newClientForm.telefono || "N/A",
      saldoFavor: parseFloat(newClientForm.saldoFavor) || 0,
      saldoDeber: parseFloat(newClientForm.saldoDeber) || 0,
      moroso: newClientForm.moroso,
      limiteCredito: parseFloat(newClientForm.limiteCredito) || 0,
      diasCredito: parseInt(newClientForm.diasCredito) || 0,
      observaciones: newClientForm.observaciones
    };

    onAddClient(newClient);
    setIsModalOpen(false);
    // Reset form
    setNewClientForm({
      nombre: "",
      rif: "",
      tipo: ClientType.CREDITO,
      status: ClientStatus.ACTIVO,
      contactoNombre: "",
      email: "",
      telefono: "",
      saldoFavor: "",
      saldoDeber: "",
      limiteCredito: "",
      diasCredito: "",
      moroso: false,
      observaciones: ""
    });
    triggerNotify(`✓ Cliente "${newClient.nombre}" registrado con éxito.`);
  };

  // Open Detail view
  const handleOpenDetail = (client: B2BClient) => {
    setActiveClientId(client.id);
    setEditForm({ ...client });
    setViewLevel(2);
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    onUpdateClient(editForm);
    setViewLevel(1);
    triggerNotify(`✓ Cambios guardados para "${editForm.nombre}".`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 bg-zinc-900 border border-zinc-700 text-white text-xs font-bold px-4 py-3 rounded-md shadow-lg z-50 flex items-center gap-2 animate-bounce">
          <span>{notification}</span>
        </div>
      )}

      {viewLevel === 1 && (
        <>
          {/* SECCIÓN 1: CABECERA Y RESUMEN DE COMPRA B2B */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Módulo de Clientes B2B - Ventas & Cuentas por Cobrar</h2>
              <p className="text-xs text-zinc-400 mt-1">Gestión integral de agencias minoristas, límites de crédito, días de gracia y carteras de cobro.</p>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> Registrar Cliente B2B
            </button>
          </div>

          {/* SECCIÓN 2: KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CARD 1: ACTIVOS */}
            <div 
              onClick={() => {
                setSelectedStatus(prev => prev === ClientStatus.ACTIVO ? "ALL" : ClientStatus.ACTIVO);
                setFilterMorosoOnly(false);
              }}
              className={`p-5 border rounded-lg flex items-center justify-between shadow-xs cursor-pointer transition-all ${
                selectedStatus === ClientStatus.ACTIVO 
                  ? "bg-emerald-50/20 border-emerald-500 ring-2 ring-emerald-500/10" 
                  : "bg-white border-zinc-200 hover:border-zinc-350 hover:shadow-sm"
              }`}
            >
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">Clientes Activos</span>
                <span className="text-3xl font-black text-zinc-900 block">{totalActivos}</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Operativos
                </span>
              </div>
              <div className={`p-3 rounded-lg border ${
                selectedStatus === ClientStatus.ACTIVO ? "bg-emerald-50 border-emerald-200 text-emerald-650" : "bg-zinc-50 border-zinc-200 text-zinc-650"
              }`}>
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* CARD 2: MOROSOS */}
            <div 
              onClick={() => {
                setFilterMorosoOnly(prev => !prev);
                setSelectedStatus("ALL");
              }}
              className={`p-5 border rounded-lg flex items-center justify-between shadow-xs cursor-pointer transition-all ${
                filterMorosoOnly 
                  ? "bg-red-50/20 border-red-500 ring-2 ring-red-500/10" 
                  : "bg-white border-zinc-200 hover:border-zinc-350 hover:shadow-sm"
              }`}
            >
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">Clientes Morosos</span>
                <span className="text-3xl font-black text-red-650 block">{totalMorosos}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 border ${
                  totalMorosos > 0 ? "text-red-600 bg-red-50 border-red-200" : "text-zinc-500 bg-zinc-50 border-zinc-200"
                }`}>
                  <AlertCircle className="w-3 h-3" /> Facturas Vencidas
                </span>
              </div>
              <div className={`p-3 rounded-lg border ${
                filterMorosoOnly ? "bg-red-100 border-red-300 text-red-600" : (totalMorosos > 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-zinc-50 border-zinc-200 text-zinc-650")
              }`}>
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            {/* CARD 3: LISTA NEGRA */}
            <div 
              onClick={() => {
                setSelectedStatus(prev => prev === ClientStatus.LISTA_NEGRA ? "ALL" : ClientStatus.LISTA_NEGRA);
                setFilterMorosoOnly(false);
              }}
              className={`p-5 border rounded-lg flex items-center justify-between shadow-xs cursor-pointer transition-all ${
                selectedStatus === ClientStatus.LISTA_NEGRA 
                  ? "bg-amber-50/20 border-amber-500 ring-2 ring-amber-500/10" 
                  : "bg-white border-zinc-200 hover:border-zinc-350 hover:shadow-sm"
              }`}
            >
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">Lista Negra / Bloqueados</span>
                <span className="text-3xl font-black text-zinc-900 block">{totalListaNegra}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 border ${
                  totalListaNegra > 0 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-zinc-500 bg-zinc-50 border-zinc-200"
                }`}>
                  <ShieldAlert className="w-3 h-3" /> Sin Financiamiento
                </span>
              </div>
              <div className={`p-3 rounded-lg border ${
                selectedStatus === ClientStatus.LISTA_NEGRA ? "bg-amber-100 border-amber-300 text-amber-600" : (totalListaNegra > 0 ? "bg-amber-50 border-amber-250 text-amber-600" : "bg-zinc-50 border-zinc-200 text-zinc-650")
              }`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: FILTROS Y BÚSQUEDA */}
          <div className="bg-white p-4 border border-zinc-200 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, RIF, email, contacto..."
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-500 font-semibold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters Selection */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-zinc-450" />
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Tipo:</span>
                <select
                  className="p-1.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="ALL">TODOS LOS TIPOS</option>
                  <option value={ClientType.CREDITO}>A CRÉDITO</option>
                  <option value={ClientType.SATELITE}>SATÉLITE</option>
                  <option value={ClientType.FREELANCER}>FREELANCER</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Estatus:</span>
                <select
                  className="p-1.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="ALL">TODOS LOS ESTATUS</option>
                  <option value={ClientStatus.ACTIVO}>ACTIVO</option>
                  <option value={ClientStatus.INACTIVO}>INACTIVO</option>
                  <option value={ClientStatus.LISTA_NEGRA}>LISTA NEGRA</option>
                </select>
              </div>

              {(selectedType !== "ALL" || selectedStatus !== "ALL" || searchQuery !== "" || filterMorosoOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType("ALL");
                    setSelectedStatus("ALL");
                    setSearchQuery("");
                    setFilterMorosoOnly(false);
                  }}
                  className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[9px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer border border-zinc-200"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* SECCIÓN 4: TABLA DE CLIENTES B2B */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[9px] font-extrabold tracking-wider">
                    <th className="p-4 w-24">ID</th>
                    <th className="p-4">Cliente B2B / Agencia</th>
                    <th className="p-4">RIF / ID Fiscal</th>
                    <th className="p-4">Contacto Principal</th>
                    <th className="p-4">Tipo Cliente</th>
                    <th className="p-4">Estatus</th>
                    <th className="p-4 text-right">Saldo Favor</th>
                    <th className="p-4 text-right">Deuda Actual</th>
                    <th className="p-4 text-center">Estado Financiero</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-zinc-400 italic">
                        No se encontraron clientes B2B con los filtros activos.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((c) => (
                      <tr 
                        key={c.id} 
                        onClick={() => handleOpenDetail(c)}
                        className="hover:bg-zinc-50/60 transition-colors cursor-pointer group"
                      >
                        <td className="p-4 font-mono font-bold text-zinc-900">{c.id}</td>
                        <td className="p-4 font-bold text-zinc-900 group-hover:underline">{c.nombre}</td>
                        <td className="p-4 font-semibold text-zinc-700">{c.rif}</td>
                        <td className="p-4 text-zinc-650">{c.contactoNombre}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            c.tipo === ClientType.CREDITO ? "bg-blue-50 border-blue-200 text-blue-700" :
                            c.tipo === ClientType.SATELITE ? "bg-purple-50 border-purple-200 text-purple-700" :
                            "bg-indigo-50 border-indigo-200 text-indigo-700"
                          }`}>
                            {c.tipo}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border inline-flex items-center gap-1 ${
                            c.status === ClientStatus.ACTIVO ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                            c.status === ClientStatus.INACTIVO ? "bg-zinc-50 border-zinc-200 text-zinc-600" :
                            "bg-amber-50 border-amber-250 text-amber-700"
                          }`}>
                            ● {c.status}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-zinc-900">${c.saldoFavor.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right font-bold text-zinc-900">${c.saldoDeber.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-center">
                          {c.moroso ? (
                            <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-650 text-[9px] font-bold uppercase inline-flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" /> Moroso
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-zinc-500 text-[9px] font-bold uppercase">
                              Al día
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {viewLevel === 2 && activeClient && editForm && (
        <div className="space-y-6">
            {/* Header Breadcrumbs */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewLevel(1)}
                  className="p-1.5 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer border border-zinc-200 bg-white"
                >
                  <ArrowLeft className="w-4 h-4 text-zinc-700" />
                </button>
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    <span>Clientes B2B</span>
                    <span>/</span>
                    <span className="font-mono">{activeClient.id}</span>
                  </div>
                  <h3 className="font-black text-lg text-zinc-950 uppercase">{activeClient.nombre}</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  activeClient.status === ClientStatus.ACTIVO ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                  activeClient.status === ClientStatus.INACTIVO ? "bg-zinc-50 border-zinc-200 text-zinc-500" :
                  "bg-amber-50 border-amber-250 text-amber-700"
                }`}>
                  ● {activeClient.status}
                </span>
                <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  activeClient.tipo === ClientType.CREDITO ? "bg-blue-50 border-blue-200 text-blue-700" :
                  activeClient.tipo === ClientType.SATELITE ? "bg-purple-50 border-purple-200 text-purple-700" :
                  "bg-indigo-50 border-indigo-200 text-indigo-700"
                }`}>
                  {activeClient.tipo}
                </span>
              </div>
            </div>

            {/* Financial Overview Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tile 1: Saldo a Favor */}
              <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Saldo a Favor (B2B)</span>
                <div className="flex items-center gap-1 text-emerald-700">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xl font-black">${activeClient.saldoFavor.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                </div>
                <span className="text-[9.5px] text-zinc-400 block font-medium">Fondos prepagados o notas de crédito</span>
              </div>

              {/* Tile 2: Deuda Pendiente */}
              <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Deuda por Cobrar</span>
                <div className="flex items-center gap-1 text-zinc-900">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xl font-black">${activeClient.saldoDeber.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                </div>
                <span className="text-[9.5px] text-zinc-400 block font-medium">Vouchers y reservas facturadas</span>
              </div>

              {/* Tile 3: Límite de Crédito */}
              <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Límite Otorgado</span>
                <div className="flex items-center gap-1 text-zinc-950">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xl font-black">${(activeClient.limiteCredito || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                </div>
                <span className="text-[9.5px] text-zinc-400 block font-medium">Cupo financiero: {activeClient.diasCredito || 0} días de gracia</span>
              </div>

              {/* Tile 4: Condición Financiera */}
              <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Condición Financiera</span>
                <div>
                  {activeClient.moroso ? (
                    <span className="px-2.5 py-1 rounded bg-red-50 border border-red-200 text-red-650 text-xs font-black uppercase inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Cuenta Morosa
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cartera al Día
                    </span>
                  )}
                </div>
                <span className="text-[9.5px] text-zinc-400 block font-medium">Evaluación en tiempo real</span>
              </div>
            </div>

            {/* Warning Callouts */}
            {activeClient.status === ClientStatus.LISTA_NEGRA && (
              <div className="p-4 bg-amber-50 border border-amber-250 rounded-lg text-amber-800 text-xs flex gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-extrabold text-[13px] uppercase">Agencia Bloqueada en Lista Negra</h5>
                  <p className="font-semibold leading-relaxed">Este cliente B2B ha sido bloqueado de nuestro canal mayorista. Toda solicitud de reserva realizada por esta cuenta está denegada y no se emitirán vouchers de servicios hasta solventar su situación.</p>
                </div>
              </div>
            )}

            {activeClient.moroso && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-750 text-xs flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-extrabold text-[13px] uppercase">Alerta de Suspensión de Crédito</h5>
                  <p className="font-semibold leading-relaxed">El cliente posee facturas con días de gracia vencidos. El límite de financiamiento ha sido congelado automáticamente y las reservas pendientes no pasarán a estatus confirmado.</p>
                </div>
              </div>
            )}

            {/* Historial de Movimientos Financieros */}
            {(() => {
              const getClientInvoices = (clientName: string) => {
                const cleanName = (name: string) => name.toLowerCase()
                  .replace(/s\.a\./g, "")
                  .replace(/s\.l\./g, "")
                  .replace(/c\.a\./g, "")
                  .replace(/sl/g, "")
                  .replace(/sa/g, "")
                  .replace(/ca/g, "")
                  .replace(/[^a-z0-9]/g, "")
                  .trim();

                const normalizedClient = cleanName(clientName);

                return invoices.filter(inv => {
                  const normalizedInv = cleanName(inv.clientName);
                  
                  // 1. Name matches
                  if (normalizedInv.includes(normalizedClient) || normalizedClient.includes(normalizedInv)) {
                    return true;
                  }

                  // 2. Word matches
                  const clientWords = clientName.toLowerCase()
                    .replace(/s\.a\./g, "")
                    .replace(/s\.l\./g, "")
                    .replace(/c\.a\./g, "")
                    .split(/\s+/)
                    .filter(w => w.length > 3 && !["viajes", "tours", "sl", "sa", "ca"].includes(w));
                  
                  if (clientWords.length > 0 && clientWords.every(word => inv.clientName.toLowerCase().includes(word))) {
                    return true;
                  }
                  
                  // 3. Localizador / Expediente match
                  const match = inv.clientName.match(/Localizador\s+(RES-\d+)/i);
                  if (match) {
                    const locator = match[1];
                    const res = reservations.find(r => r.id === locator);
                    if (res && res.agenciaName && cleanName(res.agenciaName) === normalizedClient) {
                      return true;
                    }
                  }

                  // 4. Anulación localizador match
                  const matchAnulacion = inv.clientName.match(/Anulación:.*(RES-\d+)/i);
                  if (matchAnulacion) {
                    const locator = matchAnulacion[1];
                    const res = reservations.find(r => r.id === locator);
                    if (res && res.agenciaName && cleanName(res.agenciaName) === normalizedClient) {
                      return true;
                    }
                  }

                  return false;
                });
              };

              const clientInvoices = getClientInvoices(activeClient.nombre);

              return (
                <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-150 pb-3">
                    <FileText className="w-4.5 h-4.5 text-zinc-700" /> Historial de Movimientos Financieros (Facturaciones, Pagos y Reintegros)
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-zinc-200">
                      <thead>
                        <tr className="text-zinc-500 font-bold bg-zinc-50 uppercase tracking-wider text-[9px] border-b border-zinc-200">
                          <th className="p-3">Referencia / Código</th>
                          <th className="p-3">Detalle del Movimiento</th>
                          <th className="p-3">Fecha Emisión</th>
                          <th className="p-3 text-right">Importe</th>
                          <th className="p-3 text-center">Estado</th>
                          <th className="p-3 text-center">Tipo de Movimiento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium">
                        {clientInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-zinc-450 italic">
                              No se registran movimientos financieros ni reintegros para este cliente.
                            </td>
                          </tr>
                        ) : (
                          clientInvoices.map((inv) => {
                            const isCreditNote = inv.id.startsWith("NC-") || inv.amount < 0;
                            const isExcess = inv.id.startsWith("ABO-");
                            const isPayment = inv.status === "Pagado" && inv.amount > 0 && !isExcess;
                            
                            return (
                              <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="p-3 font-mono font-bold text-zinc-600">{inv.id}</td>
                                <td className="p-3 text-zinc-900 font-bold">{inv.clientName}</td>
                                <td className="p-3 text-zinc-500 font-mono">{inv.date}</td>
                                <td className={`p-3 text-right font-black font-mono text-xs ${isCreditNote ? "text-red-650" : isExcess ? "text-emerald-700 font-extrabold" : "text-zinc-900"}`}>
                                  {isCreditNote ? "" : "+"}${inv.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${
                                    inv.status === "Pagado" ? "bg-emerald-50 text-emerald-700 border-emerald-250 font-bold" : 
                                    inv.status === "Facturado" ? "bg-amber-50 text-amber-700 border-amber-250" : 
                                    inv.status === "Vencido" ? "bg-red-50 text-red-700 border-red-200 font-bold animate-pulse" : "bg-zinc-50 text-zinc-650 border-zinc-200"
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border ${
                                    isCreditNote 
                                      ? "bg-red-50 border-red-200 text-red-750" 
                                      : isExcess
                                        ? "bg-emerald-50 border-emerald-250 text-emerald-750"
                                        : isPayment 
                                          ? "bg-emerald-50 border-emerald-205 text-emerald-700" 
                                          : "bg-blue-50 border-blue-200 text-blue-750"
                                  }`}>
                                    {isCreditNote ? "Reintegro / NC" : isExcess ? "Excedente / Abono" : isPayment ? "Pago Recibido" : "Factura Emitida"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Historial de Expedientes Validados */}
            {(() => {
              const clientReservations = reservations.filter(r => 
                r.agenciaName && r.agenciaName.toLowerCase() === activeClient.nombre.toLowerCase()
              );

              return (
                <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-150 pb-3">
                    <Calendar className="w-4.5 h-4.5 text-zinc-700" /> Historial de Expedientes (Reservas de la Agencia)
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-zinc-200">
                      <thead>
                        <tr className="text-zinc-500 font-bold bg-zinc-50 uppercase tracking-wider text-[9px] border-b border-zinc-200">
                          <th className="p-3">Localizador</th>
                          <th className="p-3">Titular / Grupo</th>
                          <th className="p-3">Hotel / Servicio Principal</th>
                          <th className="p-3 text-center">Fecha Check-in</th>
                          <th className="p-3 text-right">Monto Venta</th>
                          <th className="p-3 text-center">Estado Reserva</th>
                          <th className="p-3 text-center">Estado de Deuda</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium">
                        {clientReservations.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-zinc-450 italic">
                              No se registran expedientes de reservas para esta agencia.
                            </td>
                          </tr>
                        ) : (
                          clientReservations.map((res) => {
                            // Match invoices that mention the locator ID
                            const resInvoices = invoices.filter(inv => inv.clientName.includes(res.id));
                            const unpaidInvoices = resInvoices.filter(inv => inv.status === "Facturado" || inv.status === "Vencido");
                            const hasDebt = unpaidInvoices.length > 0;
                            const debtAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

                            return (
                              <tr 
                                key={res.id} 
                                onClick={() => {
                                  setSelectedResId(res.id);
                                  setViewLevel(3);
                                }}
                                className="hover:bg-zinc-50/60 transition-colors cursor-pointer group"
                              >
                                <td className="p-3 font-mono font-bold text-zinc-650 group-hover:underline">{res.id}</td>
                                <td className="p-3 text-zinc-900 font-bold">{res.holder}</td>
                                <td className="p-3 text-zinc-650 font-semibold">{res.hotelName}</td>
                                <td className="p-3 text-center text-zinc-500 font-mono">{res.checkIn}</td>
                                <td className="p-3 text-right font-black font-mono text-zinc-900">${res.totalPrice.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</td>
                                <td className="p-3 text-center">
                                  <span className={`text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${
                                    res.status === "Confirmada" ? "bg-emerald-50 text-emerald-700 border-emerald-250 font-bold" :
                                    res.status === "Cancelada" ? "bg-red-50 text-red-700 border-red-200" :
                                    "bg-amber-50 text-amber-700 border-amber-250"
                                  }`}>
                                    {res.status}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  {hasDebt ? (
                                    <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-650 text-[9px] font-black uppercase inline-flex items-center gap-1 animate-pulse" title="Existe saldo pendiente de pago para este expediente">
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                      Deuda: ${debtAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      Saldado
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Editar Ficha de Cliente Form */}
            <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs">
              <h4 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-150 pb-3 mb-5">
                <Edit2 className="w-4 h-4 text-zinc-700" /> Editar Ficha Técnica y Datos Comerciales
              </h4>

              <form onSubmit={handleEditSubmit} className="space-y-5">
                {/* 1. Nombre + RIF + Estatus + Tipo */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Razón Social de la Agencia</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                      value={editForm.nombre}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, nombre: e.target.value }) : null)}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">RIF / ID Fiscal</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-mono font-semibold text-zinc-800 focus:outline-none"
                      value={editForm.rif}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, rif: e.target.value }) : null)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Estatus de la Cuenta</label>
                    <select
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                      value={editForm.status}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, status: e.target.value as ClientStatus }) : null)}
                    >
                      <option value={ClientStatus.ACTIVO}>ACTIVO</option>
                      <option value={ClientStatus.INACTIVO}>INACTIVO</option>
                      <option value={ClientStatus.LISTA_NEGRA}>LISTA NEGRA</option>
                    </select>
                  </div>
                </div>

                {/* 2. Contacto + Email + Teléfono + Tipo */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Contacto de Cobro / Reserva</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={editForm.contactoNombre}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, contactoNombre: e.target.value }) : null)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Email de Facturación</label>
                    <input
                      type="email"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Teléfono Comercial</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={editForm.telefono}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, telefono: e.target.value }) : null)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Modelo Comercial B2B</label>
                    <select
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                      value={editForm.tipo}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, tipo: e.target.value as ClientType }) : null)}
                    >
                      <option value={ClientType.CREDITO}>A CRÉDITO</option>
                      <option value={ClientType.SATELITE}>SATÉLITE</option>
                      <option value={ClientType.FREELANCER}>FREELANCER</option>
                    </select>
                  </div>
                </div>

                {/* 3. Balances + Límite + Gracia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Saldo a Favor ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none text-right"
                      value={editForm.saldoFavor}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, saldoFavor: parseFloat(e.target.value) || 0 }) : null)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Saldo Deudor / Cobros ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none text-right"
                      value={editForm.saldoDeber}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, saldoDeber: parseFloat(e.target.value) || 0 }) : null)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Límite de Crédito ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none text-right"
                      value={editForm.limiteCredito}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, limiteCredito: parseFloat(e.target.value) || 0 }) : null)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Días de Gracia (Crédito)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none text-right"
                      value={editForm.diasCredito}
                      onChange={(e) => setEditForm(prev => prev ? ({ ...prev, diasCredito: parseInt(e.target.value) || 0 }) : null)}
                    />
                  </div>
                </div>

                {/* 4. Moroso Checkbox */}
                <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
                  <input
                    id="edit-moroso-checkbox"
                    type="checkbox"
                    className="w-4.5 h-4.5 accent-zinc-900 cursor-pointer"
                    checked={editForm.moroso}
                    onChange={(e) => setEditForm(prev => prev ? ({ ...prev, moroso: e.target.checked }) : null)}
                  />
                  <label htmlFor="edit-moroso-checkbox" className="text-xs font-bold text-zinc-800 uppercase tracking-wide cursor-pointer">
                    Declarar esta cuenta en estado de Morosidad (Congela automáticamente créditos mayoristas)
                  </label>
                </div>

                {/* 5. Observaciones */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Notas y Observaciones Internas</label>
                  <textarea
                    rows={3}
                    className="w-full p-3 border border-zinc-200 bg-white rounded text-xs text-zinc-700 font-semibold focus:outline-none"
                    value={editForm.observaciones || ""}
                    onChange={(e) => setEditForm(prev => prev ? ({ ...prev, observaciones: e.target.value }) : null)}
                  />
                </div>

                {/* Actions Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setViewLevel(1)}
                    className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
      )}

      {viewLevel === 3 && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Breadcrumbs */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewLevel(2)}
                className="p-1.5 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer border border-zinc-200 bg-white"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-700" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  <span>Clientes B2B</span>
                  <span>/</span>
                  <span>{activeClient?.nombre}</span>
                  <span>/</span>
                  <span className="font-mono">{selectedResId}</span>
                </div>
                <h3 className="font-black text-lg text-zinc-950 uppercase">Detalle del Expediente: {selectedResId}</h3>
              </div>
            </div>
            
            {selectedRes && (
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  selectedRes.status === "Confirmada" ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" :
                  selectedRes.status === "Cancelada" ? "bg-red-50 border-red-200 text-red-700" :
                  "bg-amber-50 border-amber-250 text-amber-700"
                }`}>
                  ● {selectedRes.status}
                </span>
                <span className="px-2.5 py-0.5 border border-zinc-200 bg-zinc-50 rounded-full text-[9px] font-bold uppercase text-zinc-650">
                  {selectedRes.mercado || "NACIONAL"}
                </span>
              </div>
            )}
          </div>

          {/* Ficha General de la Reserva */}
          {selectedRes && (
            <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Titular del Grupo</span>
                <span className="text-xs font-bold text-zinc-900">{selectedRes.holder}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Hotel / Servicio Principal</span>
                <span className="text-xs font-bold text-zinc-900">{selectedRes.hotelName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fechas Check-in / Check-out</span>
                <span className="text-xs font-mono font-bold text-zinc-800">{selectedRes.checkIn} al {selectedRes.checkOut}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Pasajeros (Pax)</span>
                <span className="text-xs font-bold text-zinc-900">{selectedRes.pax} pasajeros</span>
              </div>
            </div>
          )}

          {/* KPI Tiles Financieros */}
          {(() => {
            const resInvoices = invoices.filter(inv => selectedResId && inv.clientName.includes(selectedResId));
            const unpaidInvoices = resInvoices.filter(inv => inv.status === "Facturado" || inv.status === "Vencido");
            const paidInvoices = resInvoices.filter(inv => inv.status === "Pagado");
            
            const totalFacturado = resInvoices.reduce((sum, inv) => sum + inv.amount, 0);
            const totalPagado = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
            const totalPendiente = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
            
            const profitMargin = selectedRes ? selectedRes.totalPrice - selectedRes.netPrice : 0;
            const profitMarginPct = selectedRes && selectedRes.totalPrice > 0 
              ? (profitMargin / selectedRes.totalPrice) * 100 
              : 0;

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tarjeta 1: Total Venta */}
                  <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Total Venta (PVP)</span>
                    <div className="flex items-center gap-1 text-zinc-900">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xl font-black">${(selectedRes?.totalPrice || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <span className="text-[9.5px] text-zinc-400 block font-medium">Monto total facturado a la agencia B2B</span>
                  </div>

                  {/* Tarjeta 2: Costo Neto */}
                  <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Costo Neto (Net Price)</span>
                    <div className="flex items-center gap-1 text-zinc-700">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xl font-black">${(selectedRes?.netPrice || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <span className="text-[9.5px] text-zinc-400 block font-medium">Importe liquidación a proveedores</span>
                  </div>

                  {/* Tarjeta 3: Utilidad Mayorista */}
                  <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Comisión / Utilidad Mayorista</span>
                    <div className="flex items-center gap-1 text-emerald-700">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xl font-black">${profitMargin.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <span className="text-[9.5px] text-emerald-600 block font-bold">Rentabilidad: {profitMarginPct.toFixed(1)}%</span>
                  </div>

                  {/* Tarjeta 4: Estado de Cobros */}
                  <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Pendiente de Cobro (Deuda)</span>
                    <div>
                      {totalPendiente > 0 ? (
                        <div className="flex items-center gap-1 text-red-650">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-xl font-black">${totalPendiente.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs font-black uppercase inline-flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Todo Saldado
                        </span>
                      )}
                    </div>
                    <span className="text-[9.5px] text-zinc-455 block font-medium">
                      {totalPendiente > 0 ? `Pagado: $${totalPagado.toLocaleString("es-ES", { minimumFractionDigits: 2 })}` : "Sin deudas activas"}
                    </span>
                  </div>
                </div>

                {/* Callout de Advertencia si hay Deuda */}
                {totalPendiente > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-750 text-xs flex gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-[13px] uppercase">Expediente con Deuda Activa</h5>
                      <p className="font-semibold leading-relaxed">
                        Este expediente posee una deuda pendiente de <strong>${totalPendiente.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</strong>. Se han cobrado <strong>${totalPagado.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</strong> de un total facturado de <strong>${totalFacturado.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</strong>. Por favor, gestione el cobro o concilie con el saldo a favor de la agencia.
                      </p>
                    </div>
                  </div>
                )}

                {/* Desglose de Servicios */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-150 pb-3">
                    <Calendar className="w-4.5 h-4.5 text-zinc-700" /> Desglose Detallado de Servicios Contratados
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-zinc-200">
                      <thead>
                        <tr className="text-zinc-500 font-bold bg-zinc-50 uppercase tracking-wider text-[9px] border-b border-zinc-200">
                          <th className="p-3">ID Servicio</th>
                          <th className="p-3">Categoría</th>
                          <th className="p-3">Detalle / Descripción del Servicio</th>
                          <th className="p-3 text-right">Costo Neto</th>
                          <th className="p-3 text-right">Precio Venta (PVP)</th>
                          <th className="p-3 text-right">Comisión Agencia</th>
                          <th className="p-3 text-center">Estado Facturación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                        {selectedRes?.servicios && selectedRes.servicios.length > 0 ? (
                          selectedRes.servicios.map((srv) => {
                            const b2bCom = srv.comisionB2B || (srv.precioVenta - srv.precioNeto);
                            
                            if (srv.tipo === ServiceType.ALOJAMIENTO && srv.detalles?.lodgingRooms) {
                              const hotelName = detailedProperties.find(p => p.id === srv.detalles.hotelId)?.nombre || srv.descripcion.split(" (")[0]?.replace("Hotel: ", "") || "Hotel";
                              return (
                                <React.Fragment key={srv.id}>
                                  {/* Main Hotel Row */}
                                  <tr className="bg-zinc-50/40 font-semibold border-t border-zinc-200">
                                    <td className="p-3 font-mono font-bold text-zinc-500">{srv.id}</td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                                        {srv.tipo}
                                      </span>
                                    </td>
                                    <td className="p-3 text-left leading-normal text-zinc-900 font-semibold">
                                      <span className="font-extrabold text-zinc-900">{hotelName}</span>
                                      <span className="block text-[9.5px] text-zinc-450 font-medium mt-0.5">
                                        IN: {formatDate(srv.detalles.checkInDate)} / OUT: {formatDate(srv.detalles.checkOutDate)} ({srv.detalles.selectedPromoName || "Tarifa Directa"})
                                      </span>
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-zinc-650">${srv.precioNeto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-right font-mono font-black text-zinc-900">${srv.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-right font-mono text-zinc-500">${b2bCom.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-center">
                                      <span className={`text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${
                                        srv.statusFacturacion === "Facturado" ? "bg-emerald-50 text-emerald-700 border-emerald-250" :
                                        srv.statusFacturacion === "Solicitado" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                        srv.statusFacturacion === "Rechazado" ? "bg-red-50 text-red-750 border-red-200 font-bold" :
                                        "bg-zinc-50 text-zinc-500 border-zinc-200"
                                      }`}>
                                        {srv.statusFacturacion || "Borrador"}
                                      </span>
                                    </td>
                                  </tr>
                                  {/* Room Rows */}
                                  {srv.detalles.lodgingRooms.map((room: any, rIdx: number) => {
                                    const rates = calculateRoomRates(room, srv.detalles, selectedRes.mercado || "NACIONAL", ratePlans, roomTypes);
                                    const roomTypeName = roomTypes.find(rt => rt.id === room.roomTypeId)?.nombre || "Habitación";
                                    const guestsNames = room.guests?.map((g: any) => `${g.name} (${g.type === "Adulto" ? "ADT" : "CHD"})`).filter((str: string) => str.replace(/\s*\([^)]+\)/g, "").trim() !== "").join(", ");
                                    const roomB2bCom = rates.pvp - rates.sale;
                                    return (
                                      <tr key={`${srv.id}-rm-${rIdx}`} className="border-b border-zinc-100 last:border-b-zinc-205 bg-white hover:bg-zinc-50/30 transition-colors">
                                        <td className="p-2.5"></td>
                                        <td className="p-2.5 text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider pl-5">Hab {rIdx + 1}</td>
                                        <td className="p-2.5 text-zinc-650 pl-5 text-left">
                                          <span className="font-semibold text-zinc-850 text-xs">{roomTypeName}</span>
                                          {guestsNames && <span className="block text-[10px] text-zinc-400 italic">Pasajeros: {guestsNames}</span>}
                                        </td>
                                        <td className="p-2.5 text-right text-zinc-500 text-xs font-mono">${rates.net.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                        <td className="p-2.5 text-right text-zinc-850 font-bold text-xs font-mono">${rates.sale.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                        <td className="p-2.5 text-right text-zinc-500 font-mono text-[10.5px]">${roomB2bCom.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                        <td className="p-2.5"></td>
                                      </tr>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            }

                            return (
                              <tr key={srv.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="p-3 font-mono font-bold text-zinc-500">{srv.id}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                                    {srv.tipo}
                                  </span>
                                </td>
                                <td className="p-3 text-zinc-900 font-semibold">{srv.descripcion}</td>
                                <td className="p-3 text-right font-mono font-bold text-zinc-650">${srv.precioNeto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                <td className="p-3 text-right font-mono font-black text-zinc-900">${srv.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                <td className="p-3 text-right font-mono text-zinc-500">${b2bCom.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                <td className="p-3 text-center">
                                  <span className={`text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${
                                    srv.statusFacturacion === "Facturado" ? "bg-emerald-50 text-emerald-700 border-emerald-250" :
                                    srv.statusFacturacion === "Solicitado" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    srv.statusFacturacion === "Rechazado" ? "bg-red-50 text-red-750 border-red-200 font-bold" :
                                    "bg-zinc-50 text-zinc-500 border-zinc-200"
                                  }`}>
                                    {srv.statusFacturacion || "Borrador"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : selectedRes ? (
                          <tr className="hover:bg-zinc-50/50 transition-colors">
                            <td className="p-3 font-mono font-bold text-zinc-500">SRV-GEN</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                                Alojamiento
                              </span>
                            </td>
                            <td className="p-3 text-zinc-900 font-semibold">{selectedRes.hotelName} (Servicio Base)</td>
                            <td className="p-3 text-right font-mono font-bold text-zinc-650">${selectedRes.netPrice.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono font-black text-zinc-900">${selectedRes.totalPrice.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono text-zinc-500">${(selectedRes.totalPrice - selectedRes.netPrice).toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-center">
                              <span className="text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold bg-emerald-50 text-emerald-700 border-emerald-250">
                                Facturado
                              </span>
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Historial de Movimientos de Facturación */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-150 pb-3">
                    <FileText className="w-4.5 h-4.5 text-zinc-700" /> Registro de Transacciones y Movimientos del Expediente
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-zinc-200">
                      <thead>
                        <tr className="text-zinc-500 font-bold bg-zinc-50 uppercase tracking-wider text-[9px] border-b border-zinc-200">
                          <th className="p-3">Referencia</th>
                          <th className="p-3">Detalle del Movimiento</th>
                          <th className="p-3">Fecha Emisión</th>
                          <th className="p-3 text-right">Importe</th>
                          <th className="p-3 text-center">Estado</th>
                          <th className="p-3 text-center">Tipo de Movimiento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                        {resInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-zinc-450 italic">
                              No se registran movimientos ni transacciones financieras para este localizador.
                            </td>
                          </tr>
                        ) : (
                          resInvoices.map((inv) => {
                            const isCreditNote = inv.id.startsWith("NC-") || inv.amount < 0;
                            const isExcess = inv.id.startsWith("ABO-");
                            const isPayment = inv.status === "Pagado" && inv.amount > 0 && !isExcess;
                            
                            return (
                              <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="p-3 font-mono font-bold text-zinc-650">{inv.id}</td>
                                <td className="p-3 text-zinc-900 font-bold">{inv.clientName}</td>
                                <td className="p-3 text-zinc-500 font-mono">{inv.date}</td>
                                <td className={`p-3 text-right font-black font-mono text-xs ${isCreditNote ? "text-red-650" : isExcess ? "text-emerald-700 font-extrabold" : "text-zinc-900"}`}>
                                  {isCreditNote ? "" : "+"}${inv.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${
                                    inv.status === "Pagado" ? "bg-emerald-50 text-emerald-700 border-emerald-250 font-bold" : 
                                    inv.status === "Facturado" ? "bg-amber-50 text-amber-700 border-amber-250" : 
                                    inv.status === "Vencido" ? "bg-red-50 text-red-700 border-red-200 font-bold animate-pulse" : "bg-zinc-50 text-zinc-650 border-zinc-200"
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border ${
                                    isCreditNote 
                                      ? "bg-red-50 border-red-200 text-red-750" 
                                      : isExcess
                                        ? "bg-emerald-50 border-emerald-250 text-emerald-750"
                                        : isPayment 
                                          ? "bg-emerald-50 border-emerald-205 text-emerald-700" 
                                          : "bg-blue-50 border-blue-200 text-blue-750"
                                  }`}>
                                    {isCreditNote ? "Reintegro / NC" : isExcess ? "Excedente / Abono" : isPayment ? "Pago Recibido" : "Factura Emitida"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* REGISTRATION MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4.5 h-4.5" /> Registrar Nuevo Cliente B2B
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Asigne el tipo comercial, ID fiscal y configure el estatus financiero de inicio.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* 1. Nombre + RIF */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Razón Social / Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Viajes B2B América C.A."
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-bold bg-white text-zinc-900 focus:outline-none"
                    value={newClientForm.nombre}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">RIF / ID Fiscal</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: J-443322110"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-mono font-semibold bg-white text-zinc-900 focus:outline-none"
                    value={newClientForm.rif}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, rif: e.target.value }))}
                  />
                </div>
              </div>

              {/* 2. Tipo + Estatus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Modelo Comercial</label>
                  <select
                    className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                    value={newClientForm.tipo}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, tipo: e.target.value as ClientType }))}
                  >
                    <option value={ClientType.CREDITO}>A CRÉDITO</option>
                    <option value={ClientType.SATELITE}>SATÉLITE</option>
                    <option value={ClientType.FREELANCER}>FREELANCER</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Estatus Inicial</label>
                  <select
                    className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                    value={newClientForm.status}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, status: e.target.value as ClientStatus }))}
                  >
                    <option value={ClientStatus.ACTIVO}>ACTIVO</option>
                    <option value={ClientStatus.INACTIVO}>INACTIVO</option>
                    <option value={ClientStatus.LISTA_NEGRA}>LISTA NEGRA</option>
                  </select>
                </div>
              </div>

              {/* 3. Contacto + Email + Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Contacto de Reservas</label>
                  <input
                    type="text"
                    placeholder="Ej: Laura Pérez"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none"
                    value={newClientForm.contactoNombre}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, contactoNombre: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Email de Facturación</label>
                  <input
                    type="email"
                    placeholder="Ej: laura@viajes.com"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none"
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Teléfono Comercial</label>
                  <input
                    type="text"
                    placeholder="Ej: +58 414 123 4567"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none"
                    value={newClientForm.telefono}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, telefono: e.target.value }))}
                  />
                </div>
              </div>

              {/* 4. Finanzas (Límites + Días + Balances) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Límite Crédito ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none text-right"
                    value={newClientForm.limiteCredito}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, limiteCredito: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Días de Crédito</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="15"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none text-right"
                    value={newClientForm.diasCredito}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, diasCredito: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Saldo a Favor ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none text-right"
                    value={newClientForm.saldoFavor}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, saldoFavor: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Deuda Inicial ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none text-right"
                    value={newClientForm.saldoDeber}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, saldoDeber: e.target.value }))}
                  />
                </div>
              </div>

              {/* 5. Moroso checkbox */}
              <div className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-md">
                <input
                  id="modal-moroso-checkbox"
                  type="checkbox"
                  className="w-4 h-4 accent-zinc-900 cursor-pointer"
                  checked={newClientForm.moroso}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, moroso: e.target.checked }))}
                />
                <label htmlFor="modal-moroso-checkbox" className="text-[11px] font-bold text-zinc-700 uppercase tracking-wide cursor-pointer">
                  Marcar cliente como Moroso (Facturas vencidas)
                </label>
              </div>

              {/* 6. Observaciones */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Observaciones y Notas</label>
                <textarea
                  rows={2}
                  placeholder="Instrucciones especiales de facturación, condiciones pactadas o notas operativas internas..."
                  className="w-full p-2.5 border border-zinc-200 rounded text-xs text-zinc-700 font-semibold focus:outline-none"
                  value={newClientForm.observaciones}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, observaciones: e.target.value }))}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Guardar Cliente B2B
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
