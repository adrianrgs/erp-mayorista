import React, { useState, useMemo } from "react";
import {
  TransferService,
  FleetVehicle,
  FleetDriver,
  FleetVehicleStatus,
  FleetDriverStatus
} from "../types";
import {
  Route,
  MapPin,
  Navigation,
  Search,
  AlertTriangle,
  Truck,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Car,
  UserCheck,
  Filter,
  Bell,
  PlusCircle,
  Plane,
  MessageSquare,
  Activity,
  Wrench,
  CalendarDays,
  ArrowRight,
  Info,
  X
} from "lucide-react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type OpsTab = "despacho" | "flota" | "alertas";
type FleetSubTab = "vehiculos" | "conductores";

interface OperacionesViewProps {
  transfers: TransferService[];
  onUpdateTransfer: (updated: TransferService) => void;
  fleetVehicles: FleetVehicle[];
  onUpdateVehicle: (updated: FleetVehicle) => void;
  onAddVehicle: (v: FleetVehicle) => void;
  fleetDrivers: FleetDriver[];
  onUpdateDriver: (updated: FleetDriver) => void;
  onAddDriver: (d: FleetDriver) => void;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const statusConfig: Record<TransferService["status"], { label: string; dot: string; badge: string }> = {
  "No Asignado":  { label: "Sin Asignar",  dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  "Asignado":     { label: "Asignado",      dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
  "En Ruta":      { label: "En Ruta",       dot: "bg-emerald-400 animate-pulse", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "Completado":   { label: "Completado",    dot: "bg-zinc-400",    badge: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  "Cancelado":    { label: "Cancelado",     dot: "bg-red-400",     badge: "bg-red-50 text-red-700 border-red-200" },
};

const vehicleStatusConfig: Record<FleetVehicleStatus, { badge: string; dot: string }> = {
  "Disponible":   { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  "En Servicio":  { badge: "bg-blue-50 text-blue-700 border-blue-200",           dot: "bg-blue-400 animate-pulse" },
  "Mantenimiento":{ badge: "bg-orange-50 text-orange-700 border-orange-200",     dot: "bg-orange-400" },
  "Reservado":    { badge: "bg-violet-50 text-violet-700 border-violet-200",     dot: "bg-violet-400" },
};

const driverStatusConfig: Record<FleetDriverStatus, { badge: string; dot: string }> = {
  "Disponible":    { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  "En Servicio":   { badge: "bg-blue-50 text-blue-700 border-blue-200",           dot: "bg-blue-400 animate-pulse" },
  "Fuera de Turno":{ badge: "bg-zinc-100 text-zinc-500 border-zinc-200",          dot: "bg-zinc-300" },
};

function StatusDot({ className }: { className: string }) {
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${className}`} />;
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function OperacionesView({
  transfers,
  onUpdateTransfer,
  fleetVehicles,
  onUpdateVehicle,
  onAddVehicle,
  fleetDrivers,
  onUpdateDriver,
  onAddDriver,
}: OperacionesViewProps) {
  const [activeTab, setActiveTab] = useState<OpsTab>("despacho");
  const [fleetSubTab, setFleetSubTab] = useState<FleetSubTab>("vehiculos");
  const [selectedTransfer, setSelectedTransfer] = useState<TransferService | null>(transfers[0] || null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransferService["status"] | "Todos">("Todos");
  const [actionMsg, setActionMsg] = useState("");
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // Assign form
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [assignDriverId, setAssignDriverId] = useState("");

  // New vehicle / driver form
  const emptyVehicle: Omit<FleetVehicle, "id"> = {
    placa: "", tipo: "", marca: "", modelo: "", capacidad: 4,
    proveedor: "", status: "Disponible", observaciones: ""
  };
  const emptyDriver: Omit<FleetDriver, "id"> = {
    nombre: "", telefono: "", licencia: "",
    status: "Disponible", observaciones: ""
  };
  const [newVehicle, setNewVehicle] = useState(emptyVehicle);
  const [newDriver, setNewDriver] = useState(emptyDriver);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const todayTransfers = useMemo(() => transfers.filter(t => t.date === today), [transfers, today]);
  const kpis = useMemo(() => ({
    total:       todayTransfers.length,
    sinAsignar:  transfers.filter(t => t.status === "No Asignado").length,
    enRuta:      transfers.filter(t => t.status === "En Ruta").length,
    completados: transfers.filter(t => t.status === "Completado").length,
    paxHoy:      todayTransfers.reduce((s, t) => s + t.paxCount, 0),
  }), [transfers, todayTransfers]);

  // ── Filtrado de traslados ──────────────────────────────────────────────────
  const filtered = useMemo(() => transfers.filter(t => {
    const matchSearch =
      t.leadPassenger.toLowerCase().includes(search.toLowerCase()) ||
      t.pickupLocation.toLowerCase().includes(search.toLowerCase()) ||
      t.dropoffLocation.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || t.status === statusFilter;
    return matchSearch && matchStatus;
  }), [transfers, search, statusFilter]);

  // ── Vehículos disponibles para el traslado seleccionado ───────────────────
  const availableVehicles = useMemo(() => {
    if (!selectedTransfer) return fleetVehicles.filter(v => v.status === "Disponible");
    return fleetVehicles.filter(v =>
      v.status === "Disponible" && v.capacidad >= selectedTransfer.paxCount
    );
  }, [fleetVehicles, selectedTransfer]);

  const availableDrivers = useMemo(() =>
    fleetDrivers.filter(d => d.status === "Disponible"),
    [fleetDrivers]
  );

  // ── Alertas automáticas ────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const list: { id: string; severity: "alta" | "media" | "baja"; title: string; desc: string; transferId?: string }[] = [];

    transfers.forEach(t => {
      if (t.status === "No Asignado" || t.status === "Asignado") {
        const tDate = new Date(t.date + "T" + t.time);
        const diffHrs = (tDate.getTime() - Date.now()) / 3_600_000;

        if (t.status === "No Asignado") {
          const sev = diffHrs < 24 ? "alta" : diffHrs < 72 ? "media" : "baja";
          list.push({
            id: `alert-unassigned-${t.id}`,
            severity: sev,
            title: `Traslado sin asignar — ${t.id}`,
            desc: `${t.leadPassenger} · ${t.paxCount} pax · ${t.date} ${t.time} · ${diffHrs < 0 ? "¡VENCIDO!" : `${Math.round(diffHrs)}h restantes`}`,
            transferId: t.id,
          });
        }

        const vehicleOk = t.vehicleId
          ? fleetVehicles.find(v => v.id === t.vehicleId)?.capacidad ?? 99
          : 99;
        if (t.vehicleId && vehicleOk < t.paxCount) {
          list.push({
            id: `alert-cap-${t.id}`,
            severity: "alta",
            title: `Vehículo con capacidad insuficiente — ${t.id}`,
            desc: `${t.leadPassenger} requiere ${t.paxCount} plazas pero el vehículo asignado solo tiene ${vehicleOk}.`,
            transferId: t.id,
          });
        }
      }
    });

    const vehiclesInMaint = fleetVehicles.filter(v => v.status === "Mantenimiento");
    vehiclesInMaint.forEach(v => {
      list.push({
        id: `alert-maint-${v.id}`,
        severity: "baja",
        title: `Vehículo en mantenimiento — ${v.placa}`,
        desc: `${v.marca} ${v.modelo} (${v.tipo}) fuera de servicio. ${v.observaciones ?? ""}`,
      });
    });

    return list.sort((a, b) =>
      ["alta","media","baja"].indexOf(a.severity) - ["alta","media","baja"].indexOf(b.severity)
    );
  }, [transfers, fleetVehicles]);

  // ── Acciones de despacho ───────────────────────────────────────────────────
  const notify = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 4000);
  };

  const handleAssign = () => {
    if (!selectedTransfer || !assignVehicleId || !assignDriverId) return;
    const vehicle = fleetVehicles.find(v => v.id === assignVehicleId);
    const driver  = fleetDrivers.find(d => d.id === assignDriverId);
    if (!vehicle || !driver) return;

    onUpdateTransfer({
      ...selectedTransfer,
      vehicleId:   vehicle.id,
      vehicleType: `${vehicle.marca} ${vehicle.modelo}`,
      driverId:    driver.id,
      driverName:  driver.nombre,
      status:      "Asignado",
    });
    onUpdateVehicle({ ...vehicle, status: "En Servicio", conductorAsignadoId: driver.id });
    onUpdateDriver({ ...driver, status: "En Servicio", vehiculoAsignadoId: vehicle.id });
    setSelectedTransfer(prev => prev ? { ...prev, vehicleId: vehicle.id, driverId: driver.id, driverName: driver.nombre, status: "Asignado" } : null);
    setAssignVehicleId("");
    setAssignDriverId("");
    notify("✓ Servicio asignado. Conductor y vehículo actualizados en flota.");
  };

  const handleSetStatus = (newStatus: TransferService["status"]) => {
    if (!selectedTransfer) return;
    const updated = { ...selectedTransfer, status: newStatus };
    onUpdateTransfer(updated);
    setSelectedTransfer(updated);

    if (newStatus === "Completado") {
      if (selectedTransfer.vehicleId) {
        const veh = fleetVehicles.find(v => v.id === selectedTransfer.vehicleId);
        if (veh) onUpdateVehicle({ ...veh, status: "Disponible", conductorAsignadoId: undefined });
      }
      if (selectedTransfer.driverId) {
        const drv = fleetDrivers.find(d => d.id === selectedTransfer.driverId);
        if (drv) onUpdateDriver({ ...drv, status: "Disponible", vehiculoAsignadoId: undefined });
      }
      notify("✓ Servicio completado. Flota liberada y disponible.");
    } else {
      notify(`✓ Estado actualizado a: "${newStatus}"`);
    }
  };

  // ── Alta de vehículo ───────────────────────────────────────────────────────
  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `VEH-${String(Date.now()).slice(-4)}`;
    onAddVehicle({ id, ...newVehicle });
    setNewVehicle(emptyVehicle);
    setShowVehicleModal(false);
    notify("✓ Vehículo registrado en la flota.");
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `DRV-${String(Date.now()).slice(-4)}`;
    onAddDriver({ id, ...newDriver });
    setNewDriver(emptyDriver);
    setShowDriverModal(false);
    notify("✓ Conductor registrado en el sistema.");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 font-sans">

      {/* ── KPI HEADER ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: CalendarDays, label: "Servicios Hoy",  value: kpis.total,       color: "text-zinc-800", bg: "bg-zinc-50", border: "border-zinc-200" },
          { icon: AlertTriangle,label: "Sin Asignar",    value: kpis.sinAsignar,   color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
          { icon: Activity,     label: "En Ruta",         value: kpis.enRuta,       color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
          { icon: CheckCircle2, label: "Completados",    value: kpis.completados,  color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
          { icon: Users,        label: "Pax Hoy",         value: kpis.paxHoy,       color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-lg p-4 flex items-center gap-3`}>
            <div className={`p-2 rounded-md ${bg} border ${border}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
              <p className={`text-2xl font-extrabold leading-none mt-0.5 ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── SUB-NAV TABS ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="border-b border-zinc-200 px-4 flex items-center gap-1">
          {([
            { id: "despacho", icon: Route,        label: "Board de Despacho" },
            { id: "flota",    icon: Truck,         label: "Gestión de Flota"  },
            { id: "alertas",  icon: Bell,          label: `Alertas Operativas${alerts.length ? ` (${alerts.length})` : ""}` },
          ] as { id: OpsTab; icon: React.FC<any>; label: string }[]).map(tab => (
            <button
              key={tab.id}
              id={`ops-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === "alertas" && alerts.filter(a => a.severity === "alta").length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {alerts.filter(a => a.severity === "alta").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB 1: BOARD DE DESPACHO ─────────────────────────────────────── */}
        {activeTab === "despacho" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100" style={{ minHeight: "calc(100vh - 22rem)" }}>
            
            {/* Panel izquierdo: Lista */}
            <div className="lg:col-span-5 flex flex-col overflow-hidden">
              {/* Barra de búsqueda y filtros */}
              <div className="p-4 border-b border-zinc-100 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    id="transfer-search-input"
                    type="text"
                    placeholder="Buscar por pasajero, ID, origen, destino..."
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-md text-xs bg-white focus:outline-none focus:border-zinc-400 font-medium"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {(["Todos","No Asignado","Asignado","En Ruta","Completado","Cancelado"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                        statusFilter === s
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {s === "No Asignado" ? "Sin Asignar" : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de traslados */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                {filtered.length === 0 ? (
                  <div className="p-10 text-center text-zinc-400 text-xs">
                    Ningún traslado coincide con el filtro.
                  </div>
                ) : filtered.map(item => {
                  const cfg = statusConfig[item.status];
                  const isSelected = selectedTransfer?.id === item.id;
                  return (
                    <div
                      id={`transfer-row-${item.id}`}
                      key={item.id}
                      onClick={() => { setSelectedTransfer(item); setAssignVehicleId(""); setAssignDriverId(""); }}
                      className={`p-4 cursor-pointer transition-colors flex items-start gap-3 ${
                        isSelected ? "bg-zinc-50 border-l-4 border-l-zinc-900" : "hover:bg-zinc-50/60"
                      }`}
                    >
                      <StatusDot className={`mt-1.5 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-[9px] font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">{item.id}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded ${cfg.badge}`}>{cfg.label}</span>
                          {item.flightRef && (
                            <span className="flex items-center gap-1 text-[9px] text-zinc-400 font-semibold">
                              <Plane className="w-3 h-3" />{item.flightRef}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-xs text-zinc-900 truncate">{item.leadPassenger}</p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500 font-medium">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.pickupLocation}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                          <ChevronRight className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.dropoffLocation}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-zinc-800">{item.time}</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">{item.date}</p>
                        <p className="text-[9px] text-zinc-500 font-semibold mt-1 bg-zinc-100 px-1.5 py-0.5 rounded">{item.paxCount} pax</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel derecho: Detalle del traslado */}
            <div className="lg:col-span-7 flex flex-col overflow-hidden">
              {selectedTransfer ? (
                <div className="flex flex-col h-full">
                  {/* Header del detalle */}
                  <div className="p-5 border-b border-zinc-100 bg-zinc-50/40 flex-shrink-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-mono text-[9px] font-bold bg-zinc-800 text-white px-2 py-0.5 rounded">{selectedTransfer.id}</span>
                          {selectedTransfer.reservationId && (
                            <span className="font-mono text-[9px] text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
                              ← {selectedTransfer.reservationId}
                            </span>
                          )}
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded ${statusConfig[selectedTransfer.status].badge}`}>
                            {statusConfig[selectedTransfer.status].label}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-zinc-900 leading-tight">{selectedTransfer.leadPassenger}</h2>
                        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 uppercase tracking-wide">{selectedTransfer.provider}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-extrabold text-zinc-900">{selectedTransfer.time}</p>
                        <p className="text-[10px] text-zinc-400">{selectedTransfer.date}</p>
                        <p className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded mt-1">{selectedTransfer.paxCount} pax</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    
                    {/* Mensaje de acción */}
                    {actionMsg && (
                      <div className="bg-zinc-900 text-white text-xs p-3 rounded-lg flex items-center gap-2 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {actionMsg}
                      </div>
                    )}

                    {/* Itinerario */}
                    <div>
                      <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3">Itinerario de Traslado</h4>
                      <div className="relative border-l-2 border-zinc-200 pl-5 ml-2 space-y-4">
                        <div className="relative">
                          <span className="absolute -left-[22px] top-0.5 bg-zinc-900 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">A</span>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Pickup — Origen</p>
                          <p className="text-sm font-bold text-zinc-800 mt-0.5">{selectedTransfer.pickupLocation}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                            📅 {selectedTransfer.date} &nbsp; 🕐 {selectedTransfer.time}
                            {selectedTransfer.flightRef && ` &nbsp; ✈ ${selectedTransfer.flightRef}`}
                          </p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-[22px] top-0.5 bg-zinc-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">B</span>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Dropoff — Destino</p>
                          <p className="text-sm font-bold text-zinc-800 mt-0.5">{selectedTransfer.dropoffLocation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Notas */}
                    {selectedTransfer.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-medium">{selectedTransfer.notes}</p>
                      </div>
                    )}

                    {/* Asignación actual */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                      <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3">Conductor & Vehículo Asignado</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] text-zinc-400 font-bold uppercase">Conductor</p>
                          <p className={`text-xs font-bold mt-1 ${selectedTransfer.driverName ? "text-zinc-800" : "text-amber-600"}`}>
                            {selectedTransfer.driverName || "⚠ Sin Asignar"}
                          </p>
                          {selectedTransfer.driverId && (
                            <p className="text-[9px] text-zinc-400 font-mono mt-0.5">{selectedTransfer.driverId}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-400 font-bold uppercase">Vehículo</p>
                          <p className={`text-xs font-bold mt-1 ${selectedTransfer.vehicleId ? "text-zinc-800" : "text-amber-600"}`}>
                            {selectedTransfer.vehicleId
                              ? (() => { const v = fleetVehicles.find(v => v.id === selectedTransfer.vehicleId); return v ? `${v.marca} ${v.modelo}` : selectedTransfer.vehicleType; })()
                              : "⚠ Sin Vehículo"}
                          </p>
                          {selectedTransfer.vehicleId && (
                            <p className="text-[9px] text-zinc-400 font-mono mt-0.5">
                              {fleetVehicles.find(v => v.id === selectedTransfer.vehicleId)?.placa}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Formulario de asignación (solo si no está completado/cancelado) */}
                    {selectedTransfer.status !== "Completado" && selectedTransfer.status !== "Cancelado" && (
                      <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
                        <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">
                          Asignar / Reasignar Flota
                        </h4>

                        {/* Vehículo */}
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                            Vehículo Disponible (cap. ≥ {selectedTransfer.paxCount} pax)
                          </label>
                          <select
                            id="assign-vehicle-select"
                            value={assignVehicleId}
                            onChange={e => setAssignVehicleId(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-md text-xs bg-white focus:outline-none focus:border-zinc-500 font-semibold"
                          >
                            <option value="">— Selecciona un vehículo —</option>
                            {availableVehicles.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.id} · {v.marca} {v.modelo} · {v.tipo} · {v.capacidad} plazas · {v.placa}
                              </option>
                            ))}
                          </select>
                          {availableVehicles.length === 0 && (
                            <p className="text-[10px] text-amber-600 font-semibold mt-1">
                              ⚠ No hay vehículos disponibles con capacidad suficiente.
                            </p>
                          )}
                        </div>

                        {/* Conductor */}
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                            Conductor Disponible
                          </label>
                          <select
                            id="assign-driver-select"
                            value={assignDriverId}
                            onChange={e => setAssignDriverId(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-md text-xs bg-white focus:outline-none focus:border-zinc-500 font-semibold"
                          >
                            <option value="">— Selecciona un conductor —</option>
                            {availableDrivers.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.id} · {d.nombre} · Lic: {d.licencia}
                              </option>
                            ))}
                          </select>
                          {availableDrivers.length === 0 && (
                            <p className="text-[10px] text-amber-600 font-semibold mt-1">
                              ⚠ No hay conductores disponibles.
                            </p>
                          )}
                        </div>

                        <button
                          id="assign-fleet-btn"
                          onClick={handleAssign}
                          disabled={!assignVehicleId || !assignDriverId}
                          className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white text-xs font-bold rounded-md transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          <UserCheck className="w-3.5 h-3.5 inline-block mr-1.5" />
                          Confirmar Asignación
                        </button>
                      </div>
                    )}

                    {/* Flujo de estado */}
                    <div>
                      <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">Flujo Operativo</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          id="set-enruta-btn"
                          onClick={() => handleSetStatus("En Ruta")}
                          disabled={!selectedTransfer.driverName || selectedTransfer.status === "En Ruta" || selectedTransfer.status === "Completado" || selectedTransfer.status === "Cancelado"}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-100 disabled:text-zinc-400 text-white text-xs font-bold rounded-md transition-colors cursor-pointer uppercase tracking-wide flex items-center gap-1.5"
                        >
                          <Activity className="w-3.5 h-3.5" /> Marcar En Ruta
                        </button>
                        <button
                          id="set-completado-btn"
                          onClick={() => handleSetStatus("Completado")}
                          disabled={selectedTransfer.status === "Completado" || !selectedTransfer.driverName || selectedTransfer.status === "Cancelado"}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-100 disabled:text-zinc-400 text-white text-xs font-bold rounded-md transition-colors cursor-pointer uppercase tracking-wide flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completado
                        </button>
                        <button
                          id="set-cancelado-btn"
                          onClick={() => handleSetStatus("Cancelado")}
                          disabled={selectedTransfer.status === "Completado" || selectedTransfer.status === "Cancelado"}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-md transition-colors cursor-pointer uppercase tracking-wide flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-zinc-400">
                  <Route className="w-10 h-10 mb-3 text-zinc-200" />
                  <p className="text-sm font-semibold">Selecciona un traslado del listado</p>
                  <p className="text-xs mt-1">para ver el detalle y despachar la unidad.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: GESTIÓN DE FLOTA ──────────────────────────────────────── */}
        {activeTab === "flota" && (
          <div className="p-5 space-y-5">

            {/* Sub-tabs Vehículos / Conductores */}
            <div className="flex items-center gap-1 border-b border-zinc-100 pb-0">
              {([
                { id: "vehiculos", icon: Car,    label: `Vehículos (${fleetVehicles.length})` },
                { id: "conductores", icon: UserCheck, label: `Conductores (${fleetDrivers.length})` },
              ] as { id: FleetSubTab; icon: React.FC<any>; label: string }[]).map(t => (
                <button
                  key={t.id}
                  id={`fleet-subtab-${t.id}`}
                  onClick={() => setFleetSubTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    fleetSubTab === t.id
                      ? "border-zinc-900 text-zinc-900"
                      : "border-transparent text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tabla de Vehículos */}
            {fleetSubTab === "vehiculos" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-zinc-700">Flota Registrada</h4>
                  <button
                    id="add-vehicle-btn"
                    onClick={() => setShowVehicleModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Nuevo Vehículo
                  </button>
                </div>
                <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        {["ID","Placa","Tipo","Marca / Modelo","Cap.","Proveedor","Estado","Conductor","Notas"].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {fleetVehicles.map(v => {
                        const driver = fleetDrivers.find(d => d.id === v.conductorAsignadoId);
                        const vc = vehicleStatusConfig[v.status];
                        return (
                          <tr key={v.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-3 py-3 font-mono text-[10px] text-zinc-500 font-bold">{v.id}</td>
                            <td className="px-3 py-3 font-mono text-[10px] font-bold text-zinc-800">{v.placa}</td>
                            <td className="px-3 py-3 font-semibold text-zinc-700 whitespace-nowrap">{v.tipo}</td>
                            <td className="px-3 py-3 font-semibold text-zinc-800 whitespace-nowrap">{v.marca} {v.modelo}</td>
                            <td className="px-3 py-3 font-bold text-zinc-800 text-center">{v.capacidad}</td>
                            <td className="px-3 py-3 text-zinc-600 whitespace-nowrap">{v.proveedor}</td>
                            <td className="px-3 py-3">
                              <span className={`flex items-center gap-1.5 px-2 py-1 border rounded text-[9px] font-bold uppercase w-fit whitespace-nowrap ${vc.badge}`}>
                                <StatusDot className={vc.dot} />{v.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-zinc-600 whitespace-nowrap">
                              {driver ? driver.nombre : <span className="text-zinc-300">—</span>}
                            </td>
                            <td className="px-3 py-3 text-zinc-400 max-w-[180px] truncate">{v.observaciones}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tabla de Conductores */}
            {fleetSubTab === "conductores" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-zinc-700">Conductores y Operadores</h4>
                  <button
                    id="add-driver-btn"
                    onClick={() => setShowDriverModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Nuevo Conductor
                  </button>
                </div>
                <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        {["ID","Nombre","Teléfono","Licencia","Vehículo Asignado","Estado","Observaciones"].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {fleetDrivers.map(d => {
                        const vehicle = fleetVehicles.find(v => v.id === d.vehiculoAsignadoId);
                        const dc = driverStatusConfig[d.status];
                        return (
                          <tr key={d.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-3 py-3 font-mono text-[10px] text-zinc-500 font-bold">{d.id}</td>
                            <td className="px-3 py-3 font-bold text-zinc-900 whitespace-nowrap">{d.nombre}</td>
                            <td className="px-3 py-3 text-zinc-600 font-mono whitespace-nowrap">{d.telefono}</td>
                            <td className="px-3 py-3 font-mono text-[10px] text-zinc-700">{d.licencia}</td>
                            <td className="px-3 py-3 text-zinc-700 whitespace-nowrap">
                              {vehicle ? (
                                <span>
                                  <span className="font-bold">{vehicle.placa}</span>
                                  <span className="text-zinc-400 ml-1">· {vehicle.tipo}</span>
                                </span>
                              ) : <span className="text-zinc-300">—</span>}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`flex items-center gap-1.5 px-2 py-1 border rounded text-[9px] font-bold uppercase w-fit whitespace-nowrap ${dc.badge}`}>
                                <StatusDot className={dc.dot} />{d.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-zinc-400 max-w-[200px] truncate">{d.observaciones}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: ALERTAS OPERATIVAS ────────────────────────────────────── */}
        {activeTab === "alertas" && (
          <div className="p-5">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-300">
                <CheckCircle2 className="w-12 h-12 mb-3" />
                <p className="text-sm font-semibold text-zinc-400">Sin alertas operativas activas</p>
                <p className="text-xs text-zinc-300 mt-1">Todos los traslados tienen flota y conductores asignados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
                  {alerts.length} incidencia(s) detectada(s) automáticamente
                </p>
                {alerts.map(alert => {
                  const severityStyles: Record<string, { border: string; bg: string; icon: string; label: string }> = {
                    alta:  { border: "border-red-200",    bg: "bg-red-50",    icon: "text-red-500",    label: "Alta" },
                    media: { border: "border-amber-200",  bg: "bg-amber-50",  icon: "text-amber-500",  label: "Media" },
                    baja:  { border: "border-zinc-200",   bg: "bg-zinc-50",   icon: "text-zinc-400",   label: "Baja" },
                  };
                  const s = severityStyles[alert.severity];
                  return (
                    <div key={alert.id} className={`border ${s.border} ${s.bg} rounded-lg p-4 flex items-start gap-3`}>
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.icon}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${s.border} ${s.bg} ${s.icon}`}>
                            PRIORIDAD {s.label}
                          </span>
                          {alert.transferId && (
                            <span className="font-mono text-[9px] text-zinc-500">{alert.transferId}</span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-zinc-800">{alert.title}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">{alert.desc}</p>
                        {alert.transferId && (
                          <button
                            onClick={() => {
                              const t = transfers.find(t => t.id === alert.transferId);
                              if (t) { setSelectedTransfer(t); setActiveTab("despacho"); }
                            }}
                            className="mt-2 text-[10px] font-bold text-zinc-700 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowRight className="w-3 h-3" /> Ir al traslado
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: NUEVO VEHÍCULO ─────────────────────────────────────────────── */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-zinc-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-900">Registrar Nuevo Vehículo</h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddVehicle} className="p-5 grid grid-cols-2 gap-3">
              {[
                { label: "Placa", key: "placa", type: "text" },
                { label: "Tipo", key: "tipo", type: "text" },
                { label: "Marca", key: "marca", type: "text" },
                { label: "Modelo", key: "modelo", type: "text" },
                { label: "Capacidad (pax)", key: "capacidad", type: "number" },
                { label: "Proveedor", key: "proveedor", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">{label}</label>
                  <input
                    required
                    type={type}
                    value={String((newVehicle as any)[key])}
                    onChange={e => setNewVehicle(prev => ({ ...prev, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded text-xs focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={newVehicle.observaciones}
                  onChange={e => setNewVehicle(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-xs focus:outline-none focus:border-zinc-400 font-medium resize-none"
                />
              </div>
              <div className="col-span-2 flex gap-2 pt-2">
                <button type="button" onClick={() => setShowVehicleModal(false)}
                  className="flex-1 py-2 border border-zinc-200 text-zinc-600 text-xs font-bold rounded-md cursor-pointer hover:bg-zinc-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2 bg-zinc-900 text-white text-xs font-bold rounded-md cursor-pointer hover:bg-zinc-800">
                  Guardar Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: NUEVO CONDUCTOR ────────────────────────────────────────────── */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-zinc-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-900">Registrar Nuevo Conductor</h3>
              <button onClick={() => setShowDriverModal(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddDriver} className="p-5 space-y-3">
              {[
                { label: "Nombre completo", key: "nombre" },
                { label: "Teléfono", key: "telefono" },
                { label: "Número de Licencia", key: "licencia" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">{label}</label>
                  <input
                    required
                    type="text"
                    value={String((newDriver as any)[key])}
                    onChange={e => setNewDriver(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded text-xs focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={newDriver.observaciones}
                  onChange={e => setNewDriver(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded text-xs focus:outline-none focus:border-zinc-400 font-medium resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowDriverModal(false)}
                  className="flex-1 py-2 border border-zinc-200 text-zinc-600 text-xs font-bold rounded-md cursor-pointer hover:bg-zinc-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2 bg-zinc-900 text-white text-xs font-bold rounded-md cursor-pointer hover:bg-zinc-800">
                  Guardar Conductor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
