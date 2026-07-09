import React, { useState } from "react";
import { DirectClient, DirectClientTipo, ClientStatus, FinancialInvoice, Reservation, ServiceType } from "../types";
import { FlightTicket } from "../types/aereos";
import { RoomType, RatePlan, TipoCobro, Property } from "../types/producto";
import { nextSequentialId } from "../lib/idGenerator";
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
  AlertTriangle,
  Trash2
} from "lucide-react";
import { ProjectView } from "../types";
import { AccionPermiso } from "../types/usuarios";
import { usePermissions } from "../hooks/usePermissions";
import { useDialog } from "../components/ui/DialogProvider";

interface ClientesDirectosPanelProps {
  clients: DirectClient[];
  onUpdateClient: (updated: DirectClient) => void;
  onAddClient: (newClient: DirectClient) => void;
  onDeleteClient: (id: string) => void;
  invoices: FinancialInvoice[];
  reservations: Reservation[];
  boletos?: FlightTicket[];
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  detailedProperties: Property[];
  onNavigateToCobranzas?: (clientId: string) => void;
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

export default function ClientesDirectosPanel({
  clients,
  onUpdateClient,
  onAddClient,
  onDeleteClient,
  invoices,
  reservations,
  boletos = [],
  roomTypes,
  ratePlans,
  detailedProperties,
  onNavigateToCobranzas
}: ClientesDirectosPanelProps) {
  const { puede } = usePermissions();
  const { showConfirm } = useDialog();
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
    cedula: "",
    tipo: DirectClientTipo.CONTADO,
    status: ClientStatus.ACTIVO,
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
  const [editForm, setEditForm] = useState<DirectClient | null>(null);

  // Selected client detail sub-tabs
  const [detailTab, setDetailTab] = useState<"ficha" | "movimientos" | "expedientes">("ficha");

  // Filters for client movements (Pestaña 2)
  const [movSearch, setMovSearch] = useState("");
  const [movType, setMovType] = useState<"ALL" | "FACTURA" | "PAGO" | "REINTEGRO" | "EXCEDENTE">("ALL");
  const [movStatus, setMovStatus] = useState<"ALL" | "PAGADO" | "FACTURADO" | "VENCIDO">("ALL");

  // Filters for client reservations (Pestaña 3)
  const [resSearch, setResSearch] = useState("");
  const [resStatus, setResStatus] = useState("ALL");
  const [resDebtStatus, setResDebtStatus] = useState<"ALL" | "SALDADO" | "DEUDA">("ALL");

  // Active client selection
  const activeClient = clients.find(c => c.id === activeClientId);

  // Selected reservation details (Level 3)
  const selectedRes = reservations.find(r => r.id === selectedResId);

  // Match limpio por clientId/clienteDirectoId — a diferencia del panel B2B (que hereda un
  // matching por nombre normalizado, ver ClientesB2BPanel.tsx), esta es plumbing nueva sin
  // datos históricos que forcen un matching difuso.
  const clientInvoices = activeClient ? invoices.filter(inv => inv.clientId === activeClient.id) : [];

  const clientReservations = activeClient
    ? reservations.filter(r => r.clienteDirectoId === activeClient.id)
    : [];

  // Filtered invoices for Tab 2
  const filteredInvoices = clientInvoices.filter(inv => {
    const isCreditNote = inv.id.startsWith("NC-") || inv.amount < 0;
    const isExcess = inv.id.startsWith("ABO-");
    const isPayment = inv.status === "Pagado" && inv.amount > 0 && !isExcess;
    const typeStr = isCreditNote ? "REINTEGRO" : isExcess ? "EXCEDENTE" : isPayment ? "PAGO" : "FACTURA";

    const matchesSearch = 
      inv.id.toLowerCase().includes(movSearch.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(movSearch.toLowerCase()) ||
      inv.date.toLowerCase().includes(movSearch.toLowerCase());

    const matchesType = movType === "ALL" || typeStr === movType;
    const matchesStatus = movStatus === "ALL" || inv.status.toUpperCase() === movStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtered reservations for Tab 3
  const filteredBookings = clientReservations.filter(res => {
    const resInvoices = invoices.filter(inv => inv.clientName.includes(res.id));
    const unpaidInvoices = resInvoices.filter(inv => inv.status === "Facturado" || inv.status === "Vencido");
    const hasDebt = unpaidInvoices.length > 0;
    const debtStatusStr = hasDebt ? "DEUDA" : "SALDADO";

    const matchesSearch =
      res.id.toLowerCase().includes(resSearch.toLowerCase()) ||
      res.holder.toLowerCase().includes(resSearch.toLowerCase()) ||
      res.hotelName.toLowerCase().includes(resSearch.toLowerCase());

    const matchesStatus = resStatus === "ALL" || res.status === resStatus;
    const matchesDebt = resDebtStatus === "ALL" || debtStatusStr === resDebtStatus;

    return matchesSearch && matchesStatus && matchesDebt;
  });

  // KPI Calculations
  const totalActivos = clients.filter(c => c.status === ClientStatus.ACTIVO).length;
  const totalMorosos = clients.filter(c => c.moroso).length;
  const totalListaNegra = clients.filter(c => c.status === ClientStatus.LISTA_NEGRA).length;

  // Filter clients list
  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.cedula || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.telefono.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    if (!newClientForm.nombre) {
      triggerNotify("✕ El nombre es un campo requerido.");
      return;
    }

    const newClient: DirectClient = {
      id: nextSequentialId("CDI", clients.map(c => c.id)),
      nombre: newClientForm.nombre,
      cedula: newClientForm.cedula || undefined,
      tipo: newClientForm.tipo,
      status: newClientForm.status,
      email: newClientForm.email || "N/A",
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
      cedula: "",
      tipo: DirectClientTipo.CONTADO,
      status: ClientStatus.ACTIVO,
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
  const handleOpenDetail = (client: DirectClient) => {
    setActiveClientId(client.id);
    setEditForm({ ...client });
    setDetailTab("ficha");
    setMovSearch("");
    setMovType("ALL");
    setMovStatus("ALL");
    setResSearch("");
    setResStatus("ALL");
    setResDebtStatus("ALL");
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
          {/* SECCIÓN 1: CABECERA Y RESUMEN DE CLIENTES DIRECTOS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Cartera de Clientes Directos</h2>
              <p className="text-xs text-zinc-400 mt-1">Gestión de clientes finales, límites de crédito, días de gracia y carteras de cobro.</p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> Registrar Cliente Directo
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
                  : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
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
                selectedStatus === ClientStatus.ACTIVO ? "bg-emerald-50 border-emerald-200 text-emerald-650" : "bg-zinc-50 border-zinc-200 text-zinc-600"
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
                  : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
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
                filterMorosoOnly ? "bg-red-100 border-red-300 text-red-600" : (totalMorosos > 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-zinc-50 border-zinc-200 text-zinc-600")
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
                  : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
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
                selectedStatus === ClientStatus.LISTA_NEGRA ? "bg-amber-100 border-amber-300 text-amber-600" : (totalListaNegra > 0 ? "bg-amber-50 border-amber-250 text-amber-600" : "bg-zinc-50 border-zinc-200 text-zinc-600")
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
                placeholder="Buscar por nombre, cédula, email, teléfono..."
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-500 font-semibold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters Selection */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Tipo:</span>
                <select
                  className="p-1.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="ALL">TODOS LOS TIPOS</option>
                  <option value={DirectClientTipo.CREDITO}>A CRÉDITO</option>
                  <option value={DirectClientTipo.CONTADO}>CONTADO</option>
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

          {/* SECCIÓN 4: TABLA DE CLIENTES DIRECTOS */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[9px] font-extrabold tracking-wider">
                    <th className="p-4 w-24">ID</th>
                    <th className="p-4">Cliente Directo</th>
                    <th className="p-4">Cédula</th>
                    <th className="p-4">Teléfono / Email</th>
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
                        No se encontraron clientes directos con los filtros activos.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((c) => {
                      const clientInvoices = invoices.filter(inv => inv.clientId === c.id);
                      const unpaidClientInvoices = clientInvoices.filter(inv => (inv.status === "Facturado" || inv.status === "Vencido") && inv.type === "Cobro");
                      const calculatedDeuda = unpaidClientInvoices.reduce((sum, inv) => sum + inv.amount, 0);

                      return (
                      <tr
                        key={c.id}
                        onClick={() => handleOpenDetail(c)}
                        className="hover:bg-zinc-50/60 transition-colors cursor-pointer group"
                      >
                        <td className="p-4 font-mono font-bold text-zinc-900">{c.id}</td>
                        <td className="p-4 font-bold text-zinc-900 group-hover:underline">{c.nombre}</td>
                        <td className="p-4 font-semibold text-zinc-700">{c.cedula || "—"}</td>
                        <td className="p-4 text-zinc-600">{c.telefono} {c.email && c.email !== "N/A" ? `/ ${c.email}` : ""}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            c.tipo === DirectClientTipo.CREDITO ? "bg-blue-50 border-blue-200 text-blue-700" :
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
                        <td className="p-4 text-right font-bold text-zinc-900">${calculatedDeuda.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
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
                    );
                    })
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
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 sticky top-16 bg-zinc-50/95 backdrop-blur-xs pt-2 z-10 -mx-8 px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewLevel(1)}
                  className="p-1.5 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer border border-zinc-200 bg-white"
                >
                  <ArrowLeft className="w-4 h-4 text-zinc-700" />
                </button>
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    <span>Clientes Directos</span>
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
                  activeClient.tipo === DirectClientTipo.CREDITO ? "bg-blue-50 border-blue-200 text-blue-700" :
                  "bg-indigo-50 border-indigo-200 text-indigo-700"
                }`}>
                  {activeClient.tipo}
                </span>
                {puede(ProjectView.CLIENTES, AccionPermiso.ELIMINAR) && (
                  <button
                    onClick={() => showConfirm({
                      title: "Eliminar Cliente",
                      message: `¿Estás seguro que deseas eliminar a ${activeClient.nombre}? Esto podría afectar reservas y facturas asociadas.`,
                      type: "danger",
                      confirmText: "Eliminar",
                      requireInputToConfirm: activeClient.nombre,
                      onConfirm: () => { onDeleteClient(activeClient.id); setViewLevel(1); }
                    })}
                    className="p-1.5 rounded hover:bg-red-50 text-zinc-400 hover:text-red-600 cursor-pointer border border-transparent hover:border-red-200"
                    title="Eliminar Cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Financial Overview Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tile 1: Saldo a Favor */}
              <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Saldo a Favor</span>
                <div className="flex items-center gap-1 text-emerald-700">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xl font-black">${activeClient.saldoFavor.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                </div>
                <span className="text-[9.5px] text-zinc-400 block font-medium">Fondos prepagados o notas de crédito</span>
              </div>

              {/* Tile 2: Deuda Pendiente */}
              {(() => {
                const calculatedDeuda = clientInvoices
                  .filter(inv => (inv.status === "Facturado" || inv.status === "Vencido") && inv.type === "Cobro")
                  .reduce((sum, inv) => sum + inv.amount, 0);
                
                return (
                  <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Deuda por Cobrar</span>
                    <div className="flex items-center gap-1 text-zinc-900">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xl font-black">${calculatedDeuda.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <span className="text-[9.5px] text-zinc-400 block font-medium">Vouchers y reservas facturadas</span>
                  </div>
                );
              })()}

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
                  <h5 className="font-extrabold text-[13px] uppercase">Cliente Bloqueado en Lista Negra</h5>
                  <p className="font-semibold leading-relaxed">Este cliente ha sido bloqueado. Toda solicitud de reserva realizada a su nombre está denegada y no se emitirán vouchers de servicios hasta solventar su situación.</p>
                </div>
              </div>
            )}

            {activeClient.moroso && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-750 text-xs flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-extrabold text-[13px] uppercase">Alerta de Suspensión de Crédito</h5>
                  <p className="font-semibold leading-relaxed">El cliente posee facturas con días de gracia vencidos. Su límite de crédito ha sido congelado automáticamente.</p>
                </div>
              </div>
            )}

            {/* Sub-tabs Selection Bar */}
            <div className="flex border-b border-zinc-200 gap-1 bg-zinc-50/50 p-1 rounded-lg border">
              <button
                type="button"
                onClick={() => setDetailTab("ficha")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  detailTab === "ficha"
                    ? "bg-white text-zinc-950 shadow-sm border border-zinc-200/80 font-black"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-white/40"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Ficha Comercial
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("movimientos")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  detailTab === "movimientos"
                    ? "bg-white text-zinc-950 shadow-sm border border-zinc-200/80 font-black"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-white/40"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Movimientos Financieros ({clientInvoices.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab("expedientes")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  detailTab === "expedientes"
                    ? "bg-white text-zinc-950 shadow-sm border border-zinc-200/80 font-black"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-white/40"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Expedientes ({clientReservations.length})
              </button>
            </div>

            {/* TAB CONTENT: Ficha Comercial */}
            {detailTab === "ficha" && (
              <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs">
                <h4 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3 mb-5">
                  <Edit2 className="w-4 h-4 text-zinc-700" /> Editar Ficha Técnica y Datos Comerciales
                </h4>

                <form onSubmit={handleEditSubmit} className="space-y-5">
                  {/* 1. Nombre + Cédula + Estatus */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                        value={editForm.nombre}
                        onChange={(e) => setEditForm(prev => prev ? ({ ...prev, nombre: e.target.value }) : null)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cédula / ID (Opcional)</label>
                      <input
                        type="text"
                        className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-mono font-semibold text-zinc-800 focus:outline-none"
                        value={editForm.cedula || ""}
                        onChange={(e) => setEditForm(prev => prev ? ({ ...prev, cedula: e.target.value }) : null)}
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

                  {/* 2. Email + Teléfono + Tipo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Email</label>
                      <input
                        type="email"
                        className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Teléfono</label>
                      <input
                        type="text"
                        className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                        value={editForm.telefono}
                        onChange={(e) => setEditForm(prev => prev ? ({ ...prev, telefono: e.target.value }) : null)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Tipo de Cliente</label>
                      <select
                        className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                        value={editForm.tipo}
                        onChange={(e) => setEditForm(prev => prev ? ({ ...prev, tipo: e.target.value as DirectClientTipo }) : null)}
                      >
                        <option value={DirectClientTipo.CREDITO}>A CRÉDITO</option>
                        <option value={DirectClientTipo.CONTADO}>CONTADO</option>
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
                      Declarar esta cuenta en estado de Morosidad (Congela automáticamente el crédito otorgado)
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
                      className="px-6 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: Movimientos Financieros */}
            {detailTab === "movimientos" && (
              <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs space-y-4">
                <h4 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3">
                  <FileText className="w-4.5 h-4.5 text-zinc-700" /> Historial de Movimientos Financieros (Facturaciones, Pagos y Reintegros)
                </h4>

                {/* Filters Bar */}
                <div className="flex flex-col md:flex-row gap-3 bg-zinc-50 p-4 border border-zinc-200 rounded-lg">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Buscar por referencia o detalle de movimiento..."
                      className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded bg-white text-xs font-semibold focus:outline-none focus:border-zinc-300"
                      value={movSearch}
                      onChange={(e) => setMovSearch(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <select
                      className="w-full p-2 border border-zinc-200 rounded bg-white text-xs font-bold text-zinc-700 focus:outline-none"
                      value={movType}
                      onChange={(e) => setMovType(e.target.value as any)}
                    >
                      <option value="ALL">TODOS LOS TIPOS</option>
                      <option value="FACTURA">FACTURAS EMITIDAS</option>
                      <option value="PAGO">PAGOS RECIBIDOS</option>
                      <option value="REINTEGRO">REINTEGROS / NC</option>
                      <option value="EXCEDENTE">EXCEDENTES / ABONOS</option>
                    </select>
                  </div>
                  <div className="w-full md:w-48">
                    <select
                      className="w-full p-2 border border-zinc-200 rounded bg-white text-xs font-bold text-zinc-700 focus:outline-none"
                      value={movStatus}
                      onChange={(e) => setMovStatus(e.target.value as any)}
                    >
                      <option value="ALL">TODOS LOS ESTADOS</option>
                      <option value="PAGADO">PAGADOS</option>
                      <option value="FACTURADO">FACTURADOS (PENDIENTES)</option>
                      <option value="VENCIDO">VENCIDOS</option>
                    </select>
                  </div>
                </div>
                
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
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-zinc-400 italic">
                            No se registran movimientos financieros que coincidan con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((inv) => {
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
                                  inv.status === "Vencido" ? "bg-red-50 text-red-700 border-red-200 font-bold animate-pulse" : "bg-zinc-50 text-zinc-600 border-zinc-200"
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
            )}

            {/* TAB CONTENT: Expedientes de Reservas */}
            {detailTab === "expedientes" && (
              <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs space-y-4">
                <h4 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3">
                  <Calendar className="w-4.5 h-4.5 text-zinc-700" /> Historial de Expedientes (Reservas del Cliente)
                </h4>

                {/* Filters Bar */}
                <div className="flex flex-col md:flex-row gap-3 bg-zinc-50 p-4 border border-zinc-200 rounded-lg">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Buscar por localizador, titular o servicio principal..."
                      className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded bg-white text-xs font-semibold focus:outline-none focus:border-zinc-300"
                      value={resSearch}
                      onChange={(e) => setResSearch(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <select
                      className="w-full p-2 border border-zinc-200 rounded bg-white text-xs font-bold text-zinc-700 focus:outline-none"
                      value={resStatus}
                      onChange={(e) => setResStatus(e.target.value)}
                    >
                      <option value="ALL">TODOS LOS ESTADOS</option>
                      <option value="Confirmada">CONFIRMADA</option>
                      <option value="Pendiente">PENDIENTE (COTIZACIÓN)</option>
                      <option value="Pendiente de Pago">PENDIENTE DE PAGO</option>
                      <option value="Modificada">MODIFICADA</option>
                      <option value="Cancelada">CANCELADA</option>
                      <option value="Petición Especial">PETICIÓN ESPECIAL</option>
                    </select>
                  </div>
                  <div className="w-full md:w-48">
                    <select
                      className="w-full p-2 border border-zinc-200 rounded bg-white text-xs font-bold text-zinc-700 focus:outline-none"
                      value={resDebtStatus}
                      onChange={(e) => setResDebtStatus(e.target.value as any)}
                    >
                      <option value="ALL">TODOS LOS SALDOS</option>
                      <option value="SALDADO">SALDADO</option>
                      <option value="DEUDA">CON SALDO PENDIENTE</option>
                    </select>
                  </div>
                </div>
                
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
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-zinc-400 italic">
                            No se registran expedientes de reservas que coincidan con los filtros.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((res) => {
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
                              <td className="p-3 font-mono font-bold text-zinc-600 group-hover:underline">{res.id}</td>
                              <td className="p-3 text-zinc-900 font-bold">{res.holder}</td>
                              <td className="p-3 text-zinc-600 font-semibold">{res.hotelName}</td>
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
            )}
          </div>
      )}

      {viewLevel === 3 && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Breadcrumbs */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 sticky top-16 bg-zinc-50/95 backdrop-blur-xs pt-2 z-10 -mx-8 px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewLevel(2)}
                className="p-1.5 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer border border-zinc-200 bg-white"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-700" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  <span>Clientes Directos</span>
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
                <span className="px-2.5 py-0.5 border border-zinc-200 bg-zinc-50 rounded-full text-[9px] font-bold uppercase text-zinc-600">
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
                    <span className="text-[9.5px] text-zinc-400 block font-medium">Monto total facturado al cliente</span>
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
                    <span className="text-[9.5px] text-zinc-500 block font-medium">
                      {totalPendiente > 0 ? `Pagado: $${totalPagado.toLocaleString("es-ES", { minimumFractionDigits: 2 })}` : "Sin deudas activas"}
                    </span>
                  </div>
                </div>

                {/* Callout de Advertencia si hay Deuda */}
                {totalPendiente > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-750 text-xs flex items-center justify-between gap-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                      <div className="space-y-1">
                        <h5 className="font-extrabold text-[13px] uppercase">Expediente con Deuda Activa</h5>
                        <p className="font-semibold leading-relaxed">
                          Este expediente posee una deuda pendiente de <strong>${totalPendiente.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</strong>. Se han cobrado <strong>${totalPagado.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</strong> de un total facturado de <strong>${totalFacturado.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</strong>. Por favor, gestione el cobro o concilie con el saldo a favor del cliente.
                        </p>
                      </div>
                    </div>
                    {onNavigateToCobranzas && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => onNavigateToCobranzas(activeClient?.id || "")}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-colors shadow-sm whitespace-nowrap"
                        >
                          Ir a Cobranzas
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Desglose de Servicios */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3">
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
                          <th className="p-3 text-right">Comisión</th>
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
                                      <span className="block text-[9.5px] text-zinc-400 font-medium mt-0.5">
                                        IN: {formatDate(srv.detalles.checkInDate)} / OUT: {formatDate(srv.detalles.checkOutDate)} ({srv.detalles.selectedPromoName || "Tarifa Directa"})
                                      </span>
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-zinc-600">${srv.precioNeto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
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
                                      <tr key={`${srv.id}-rm-${rIdx}`} className="border-b border-zinc-100 last:border-b-zinc-200 bg-white hover:bg-zinc-50/30 transition-colors">
                                        <td className="p-2.5"></td>
                                        <td className="p-2.5 text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider pl-5">Hab {rIdx + 1}</td>
                                        <td className="p-2.5 text-zinc-600 pl-5 text-left">
                                          <span className="font-semibold text-zinc-800 text-xs">{roomTypeName}</span>
                                          {guestsNames && <span className="block text-[10px] text-zinc-400 italic">Pasajeros: {guestsNames}</span>}
                                        </td>
                                        <td className="p-2.5 text-right text-zinc-500 text-xs font-mono">${rates.net.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                        <td className="p-2.5 text-right text-zinc-800 font-bold text-xs font-mono">${rates.sale.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
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
                                <td className="p-3 text-right font-mono font-bold text-zinc-600">${srv.precioNeto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
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
                            <td className="p-3 text-right font-mono font-bold text-zinc-600">${selectedRes.netPrice.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono font-black text-zinc-900">${selectedRes.totalPrice.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right font-mono text-zinc-500">${(selectedRes.totalPrice - selectedRes.netPrice).toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-center">
                              <span className="text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold bg-emerald-50 text-emerald-700 border-emerald-250">
                                Facturado
                              </span>
                            </td>
                          </tr>
                        ) : null}
                        
                        {/* Vuelos Conjuntos Facturados */}
                        {selectedRes && boletos.filter(b => b.expedienteId === selectedRes.id && b.facturarConjunto).map(vuelo => {
                          const b2bCom = vuelo.comisionB2B || (vuelo.precioVenta - vuelo.costoNeto);
                          const segmentos = vuelo.segmentos?.map ? vuelo.segmentos : [];
                          const rutaStr = segmentos.length > 0 
                            ? (segmentos.length === 1 ? `${segmentos[0].origen}-${segmentos[0].destino}` : `${segmentos[0].origen}-${segmentos[segmentos.length-1].destino}`)
                            : "—";
                            
                          return (
                            <tr key={vuelo.id} className="hover:bg-zinc-50/50 transition-colors border-t border-zinc-200">
                              <td className="p-3 font-mono font-bold text-zinc-500">{vuelo.pnr}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                  AÉREO
                                </span>
                              </td>
                              <td className="p-3 text-zinc-900 font-semibold">Boleto Aéreo GDS - Ruta: {rutaStr}</td>
                              <td className="p-3 text-right font-mono font-bold text-zinc-600">${vuelo.costoNeto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                              <td className="p-3 text-right font-mono font-black text-zinc-900">${vuelo.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                              <td className="p-3 text-right font-mono text-zinc-500">${b2bCom.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                              <td className="p-3 text-center">
                                <span className={`text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${
                                  vuelo.expedienteAereo?.status === "Facturado" || vuelo.expedienteAereo?.status === "PagadoAerolinea" ? "bg-emerald-50 text-emerald-700 border-emerald-250" :
                                  "bg-zinc-50 text-zinc-500 border-zinc-200"
                                }`}>
                                  {vuelo.expedienteAereo?.status || "Borrador"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Historial de Movimientos de Facturación */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-3">
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
                            <td colSpan={6} className="p-6 text-center text-zinc-400 italic">
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
                                    inv.status === "Vencido" ? "bg-red-50 text-red-700 border-red-200 font-bold animate-pulse" : "bg-zinc-50 text-zinc-600 border-zinc-200"
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
                  <Users className="w-4.5 h-4.5" /> Registrar Nuevo Cliente Directo
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Configure el tipo de cliente y el estatus financiero de inicio.</p>
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
              {/* 1. Nombre + Cédula */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Laura Pérez"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-bold bg-white text-zinc-900 focus:outline-none"
                    value={newClientForm.nombre}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cédula / ID (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: V-12345678"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-mono font-semibold bg-white text-zinc-900 focus:outline-none"
                    value={newClientForm.cedula}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, cedula: e.target.value }))}
                  />
                </div>
              </div>

              {/* 2. Tipo + Estatus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Tipo de Cliente</label>
                  <select
                    className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                    value={newClientForm.tipo}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, tipo: e.target.value as DirectClientTipo }))}
                  >
                    <option value={DirectClientTipo.CREDITO}>A CRÉDITO</option>
                    <option value={DirectClientTipo.CONTADO}>CONTADO</option>
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

              {/* 3. Email + Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Email</label>
                  <input
                    type="email"
                    placeholder="Ej: laura@correo.com"
                    className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none"
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Teléfono</label>
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
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Guardar Cliente Directo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
