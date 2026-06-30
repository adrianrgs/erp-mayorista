import React, { useState, useMemo } from "react";
import {
  OperationalTransfer,
  TransferDirection,
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
  AlertTriangle, Sparkles,
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
  PlaneLanding,
  PlaneTakeoff,
  ArrowLeftRight,
  MessageSquare,
  Activity,
  Wrench,
  CalendarDays,
  ArrowRight,
  Info,
  X,
  Printer,
  PhoneOff
} from "lucide-react";

import { DriverManifest } from "../components/operaciones/DriverManifest";
import { DailyDispatchManifest } from "../components/operaciones/DailyDispatchManifest";

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type OpsTab = "despacho" | "flota" | "alertas";
type FleetSubTab = "vehiculos" | "conductores";

interface OperacionesViewProps {
  transfers: OperationalTransfer[];
  onUpdateTransfer: (updated: OperationalTransfer) => void;
  fleetVehicles: FleetVehicle[];
  onUpdateVehicle: (updated: FleetVehicle) => void;
  onAddVehicle: (v: FleetVehicle) => void;
  fleetDrivers: FleetDriver[];
  onUpdateDriver: (updated: FleetDriver) => void;
  onAddDriver: (d: FleetDriver) => void;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const statusConfig: Record<OperationalTransfer["status"], { label: string; dot: string; badge: string }> = {
  "Sin Asignar":  { label: "Sin Asignar",  dot: "bg-amber-400 animate-pulse",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
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

const formatDateStr = (d: Date) => {
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatTimeStr = (d: Date) => {
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── DIRECTION HELPERS ────────────────────────────────────────────────────────
type DirectionFilter = TransferDirection | 'Todos';

const directionConfig: Record<TransferDirection, { label: string; icon: React.FC<any>; badge: string; dot: string }> = {
  'IN':         { label: 'Llegada',    icon: PlaneLanding,   badge: 'bg-sky-50 text-sky-700 border-sky-200',         dot: 'bg-sky-400' },
  'OUT':        { label: 'Salida',     icon: PlaneTakeoff,   badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400' },
  'INTERHOTEL': { label: 'Interhotel', icon: ArrowLeftRight, badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-400' },
  'DISPO':      { label: 'Dispo',      icon: Car,            badge: 'bg-zinc-100 text-zinc-600 border-zinc-200',      dot: 'bg-zinc-400' },
};

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
  const [selectedTransfer, setSelectedTransfer] = useState<OperationalTransfer | null>(transfers[0] || null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OperationalTransfer["status"] | "Todos">("Todos");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('Todos');
  const [dateFilter, setDateFilter] = useState<'Todos' | 'Hoy' | 'Mañana' | 'Esta Semana'>('Todos');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [actionMsg, setActionMsg] = useState("");
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // Formulario de asignación
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [assignDriverId, setAssignDriverId] = useState("");
  const [overlapTolerance, setOverlapTolerance] = useState(2);

  // Formularios de registro
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

  // Impresión
  const [printingManifests, setPrintingManifests] = useState<Array<{ driver: FleetDriver; date: Date; transfers: OperationalTransfer[] }>>([]);
  const [printingDailyManifest, setPrintingDailyManifest] = useState<{ date: Date; subtitle: string; transfers: OperationalTransfer[] } | null>(null);

  React.useEffect(() => {
    if (printingManifests.length > 0 || printingDailyManifest) {
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          setPrintingManifests([]);
          setPrintingDailyManifest(null);
        }, 500);
      }, 500);
    }
  }, [printingManifests, printingDailyManifest]);

  const handlePrintDriver = (driver: FleetDriver, targetDate?: Date) => {
    const dateToPrint = targetDate || new Date();
    // Start of day, end of day bounds
    const start = new Date(dateToPrint);
    start.setHours(0,0,0,0);
    const end = new Date(dateToPrint);
    end.setHours(23,59,59,999);

    const dTransfers = transfers.filter(t => 
      t.conductorId === driver.id && 
      t.fechaHora >= start && 
      t.fechaHora <= end && 
      t.status !== 'Cancelado'
    );
    setPrintingManifests([{ driver, date: dateToPrint, transfers: dTransfers }]);
  };



  // ── KPIs ───────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const activeTransfers = useMemo(() => transfers.filter(t => t.status !== "Cancelado"), [transfers]);
  const todayTransfers = useMemo(() => activeTransfers.filter(t => formatDateStr(t.fechaHora) === today), [activeTransfers, today]);
  const kpis = useMemo(() => ({
    total:       todayTransfers.length,
    sinAsignar:  activeTransfers.filter(t => t.status === "Sin Asignar").length,
    enRuta:      activeTransfers.filter(t => t.status === "En Ruta").length,
    completados: activeTransfers.filter(t => t.status === "Completado").length,
    paxHoy:      todayTransfers.reduce((s, t) => s + t.paxCount, 0),
    llegadas:    activeTransfers.filter(t => t.direction === 'IN').length,
    salidas:     activeTransfers.filter(t => t.direction === 'OUT').length,
  }), [transfers, todayTransfers]);

  // ── Filtrado de traslados ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const result = transfers.filter(t => {
      const matchSearch =
        t.pasajeroPrincipal.toLowerCase().includes(search.toLowerCase()) ||
        t.origen.toLowerCase().includes(search.toLowerCase()) ||
        t.destino.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "Todos" ? t.status !== "Cancelado" : t.status === statusFilter;
      const matchDirection = directionFilter === 'Todos' || t.direction === directionFilter;
      
      let matchDate = true;
      if (dateFilter !== 'Todos') {
        const tDate = t.fechaHora;
        const todayDate = new Date();
        if (dateFilter === 'Hoy') {
           matchDate = tDate.getDate() === todayDate.getDate() && tDate.getMonth() === todayDate.getMonth() && tDate.getFullYear() === todayDate.getFullYear();
        } else if (dateFilter === 'Mañana') {
           const tomorrow = new Date(todayDate);
           tomorrow.setDate(tomorrow.getDate() + 1);
           matchDate = tDate.getDate() === tomorrow.getDate() && tDate.getMonth() === tomorrow.getMonth() && tDate.getFullYear() === tomorrow.getFullYear();
        } else if (dateFilter === 'Esta Semana') {
           const endOfWeek = new Date(todayDate);
           endOfWeek.setDate(endOfWeek.getDate() + 7);
           matchDate = tDate >= todayDate && tDate <= endOfWeek;
        }
      }

      return matchSearch && matchStatus && matchDirection && matchDate;
    });

    return result.sort((a, b) => {
      const timeA = a.fechaHora.getTime();
      const timeB = b.fechaHora.getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [transfers, search, statusFilter, directionFilter, dateFilter, sortOrder]);

  const handlePrintAll = () => {
    if (filtered.length === 0) {
      notify("No hay traslados en la lista actual para imprimir.");
      return;
    }
    
    let dateStr = dateFilter;
    const today = new Date();
    if (dateFilter === "Hoy") {
      dateStr = today.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase();
    } else if (dateFilter === "Mañana") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateStr = tomorrow.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase();
    } else if (dateFilter === "Esta Semana") {
      const endOfWeek = new Date(today);
      const daysUntilSunday = 7 - (today.getDay() || 7);
      endOfWeek.setDate(today.getDate() + daysUntilSunday);
      dateStr = `${today.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()} - ${endOfWeek.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}`;
    }

    const subtitle = `Filtros aplicados - Fecha: ${dateStr} | Estado: ${statusFilter} | Ruta: ${directionFilter}`;
    setPrintingDailyManifest({ date: new Date(), subtitle, transfers: filtered });
  };

  // ── Vehículos disponibles para el traslado seleccionado ───────────────────
  const availableVehicles = useMemo(() => {
    if (!selectedTransfer) return fleetVehicles.filter(v => v.status !== "Mantenimiento");
    
    const sTime = selectedTransfer.fechaHora.getTime();

    return fleetVehicles.filter(v => {
      if (v.status === "Mantenimiento") return false;
      
      // Encontrar traslados solapados para ESTE vehiculo
      const overlapping = transfers.filter(t => {
        if (t.id === selectedTransfer.id) return false;
        if (t.vehiculoId !== v.id) return false;
        if (t.status === "Cancelado") return false;
        const diffHours = Math.abs(t.fechaHora.getTime() - sTime) / (1000 * 60 * 60);
        return diffHours <= overlapTolerance;
      });

      if (overlapping.length > 0) {
        // Regla Privado
        if (selectedTransfer.tipoTraslado === "Privado" || selectedTransfer.tipoTraslado === undefined) return false;
        if (overlapping.some(t => t.tipoTraslado === "Privado" || t.tipoTraslado === undefined)) return false;
        
        // Regla Compartido: suma de pasajeros no debe exceder capacidad
        const totalPax = selectedTransfer.paxCount + overlapping.reduce((sum, t) => sum + t.paxCount, 0);
        if (totalPax > v.capacidad) return false;
      } else {
        if (v.capacidad < selectedTransfer.paxCount) return false;
      }

      return true;
    });
  }, [fleetVehicles, selectedTransfer, transfers, overlapTolerance]);

  const availableDrivers = useMemo(() => {
    if (!selectedTransfer) return fleetDrivers.filter(d => d.status !== "Fuera de Turno");

    const sTime = selectedTransfer.fechaHora.getTime();

    return fleetDrivers.filter(d => {
      if (d.status === "Fuera de Turno") return false;

      // Encontrar traslados solapados para ESTE conductor
      const overlapping = transfers.filter(t => {
        if (t.id === selectedTransfer.id) return false;
        if (t.conductorId !== d.id) return false;
        if (t.status === "Cancelado") return false;
        const diffHours = Math.abs(t.fechaHora.getTime() - sTime) / (1000 * 60 * 60);
        return diffHours <= overlapTolerance;
      });

      if (overlapping.length > 0) {
        if (selectedTransfer.tipoTraslado === "Privado" || selectedTransfer.tipoTraslado === undefined) return false;
        if (overlapping.some(t => t.tipoTraslado === "Privado" || t.tipoTraslado === undefined)) return false;
        
        // Si el conductor tiene un vehiculo asignado, validar la capacidad de su vehiculo
        if (d.vehiculoAsignadoId) {
          const vehicle = fleetVehicles.find(v => v.id === d.vehiculoAsignadoId);
          if (vehicle) {
            const totalPax = selectedTransfer.paxCount + overlapping.reduce((sum, t) => sum + t.paxCount, 0);
            if (totalPax > vehicle.capacidad) return false;
          }
        }
      } else {
         if (d.vehiculoAsignadoId) {
           const vehicle = fleetVehicles.find(v => v.id === d.vehiculoAsignadoId);
           if (vehicle && vehicle.capacidad < selectedTransfer.paxCount) return false;
         }
      }
      return true;
    });
  }, [fleetDrivers, selectedTransfer, transfers, overlapTolerance, fleetVehicles]);

  // ── Alertas automáticas ────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const list: { id: string; severity: "alta" | "media" | "baja"; title: string; desc: string; transferId?: string }[] = [];

    transfers.forEach(t => {
      if (t.status === "Sin Asignar" || t.status === "Asignado") {
        const tDate = t.fechaHora;
        const diffHrs = (tDate.getTime() - Date.now()) / 3_600_000;

        if (t.status === "Sin Asignar") {
          const sev = diffHrs < 24 ? "alta" : diffHrs < 72 ? "media" : "baja";
          list.push({
            id: `alert-unassigned-${t.id}`,
            severity: sev,
            title: `Traslado sin asignar — ${t.id}`,
            desc: `${t.pasajeroPrincipal} · ${t.paxCount} pax · ${formatDateStr(t.fechaHora)} ${formatTimeStr(t.fechaHora)} · ${diffHrs < 0 ? "¡VENCIDO!" : `${Math.round(diffHrs)}h restantes`}`,
            transferId: t.id,
          });
        }

        const vehicleOk = t.vehiculoId
          ? fleetVehicles.find(v => v.id === t.vehiculoId)?.capacidad ?? 99
          : 99;
        if (t.vehiculoId && vehicleOk < t.paxCount) {
          list.push({
            id: `alert-cap-${t.id}`,
            severity: "alta",
            title: `Vehículo con capacidad insuficiente — ${t.id}`,
            desc: `${t.pasajeroPrincipal} requiere ${t.paxCount} plazas pero el vehículo asignado solo tiene ${vehicleOk}.`,
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
      vehiculoId:   vehicle.id,
      vehicleType: `${vehicle.marca} ${vehicle.modelo}`,
      conductorId:    driver.id,
      driverName:  driver.nombre,
      status:      "Asignado",
    });
    // Updating only the default vehicle/driver bindings, without changing global status
    onUpdateVehicle({ ...vehicle, conductorAsignadoId: driver.id });
    onUpdateDriver({ ...driver, vehiculoAsignadoId: vehicle.id });
    setSelectedTransfer(prev => prev ? { ...prev, vehiculoId: vehicle.id, conductorId: driver.id, driverName: driver.nombre, status: "Asignado" } : null);
    setAssignVehicleId("");
    setAssignDriverId("");
    notify("✓ Servicio asignado. Conductor y vehículo actualizados en flota.");
  };

  const handleSetStatus = (newStatus: OperationalTransfer["status"]) => {
    if (!selectedTransfer) return;
    const updated = { ...selectedTransfer, status: newStatus };
    onUpdateTransfer(updated);
    setSelectedTransfer(updated);

    if (newStatus === "Completado") {
      if (selectedTransfer.vehiculoId) {
        const veh = fleetVehicles.find(v => v.id === selectedTransfer.vehiculoId);
        if (veh) onUpdateVehicle({ ...veh, status: "Disponible", conductorAsignadoId: undefined });
      }
      if (selectedTransfer.conductorId) {
        const drv = fleetDrivers.find(d => d.id === selectedTransfer.conductorId);
        if (drv) onUpdateDriver({ ...drv, status: "Disponible", vehiculoAsignadoId: undefined });
      }
      notify("✓ Servicio completado. Flota liberada y disponible.");
    } else {
      notify(`✓ Estado actualizado a: "${newStatus}"`);
    }
  };

  // Alta de vehículo
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

  // Cuenta regresiva / Tiempo restante del traslado
  const getRemainingTimeBadge = (t: OperationalTransfer) => {
    const diffMin = Math.round((t.fechaHora.getTime() - Date.now()) / 60000);
    const isToday = formatDateStr(t.fechaHora) === today;

    if (t.status === "Completado") {
      return <span className="bg-zinc-100 text-zinc-500 text-[9px] font-bold px-2 py-0.5 rounded-full border border-zinc-200">Finalizado</span>;
    }
    if (t.status === "Cancelado") {
      return <span className="bg-red-50 text-red-500 text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-200">Cancelado</span>;
    }

    if (diffMin < 0) {
      return (
        <span className="flex items-center gap-0.5 bg-red-50 text-red-700 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-red-200 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-red-500" /> ¡Vencido! ({Math.abs(Math.round(diffMin / 60))}h)
        </span>
      );
    }

    if (isToday) {
      if (diffMin <= 120) {
        return (
          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3 text-amber-500" /> Próximo ({diffMin}m)
          </span>
        );
      }
      return (
        <span className="bg-sky-50 text-sky-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-sky-200">
          Hoy ({Math.round(diffMin / 60)}h)
        </span>
      );
    }

    return (
      <span className="bg-zinc-50 text-zinc-500 text-[9px] font-medium px-2 py-0.5 rounded-full border border-zinc-200">
        Programado
      </span>
    );
  };

  const handleOptimizeShared = () => {
    // 1. Filtrar traslados activos
    const activeTransfers = transfers.filter(t =>
      t.status !== 'Completado' && t.status !== 'Cancelado'
    );

    const sharedTransfers = activeTransfers.filter(t => t.tipoTraslado === 'Compartido');
    // Incluir traslados sin tipoTraslado definido (e.g. auto-generados desde reservas)
    const unassignedPrivateTransfers = activeTransfers.filter(t =>
      t.tipoTraslado !== 'Compartido' && !t.vehiculoId
    );

    if (sharedTransfers.length === 0 && unassignedPrivateTransfers.length === 0) {
      notify("No hay traslados activos para optimizar.");
      return;
    }

    // Mapas locales para rastrear asignaciones dentro del loop y evitar leer estado obsoleto
    const vehicleToDriver = new Map<string, string>(
      fleetVehicles.filter(v => v.conductorAsignadoId).map(v => [v.id, v.conductorAsignadoId!])
    );
    const driverToVehicle = new Map<string, string>(
      fleetDrivers.filter(d => d.vehiculoAsignadoId).map(d => [d.id, d.vehiculoAsignadoId!])
    );

    const assignDriver = (vehicle: FleetVehicle): string | undefined => {
      if (vehicleToDriver.has(vehicle.id)) return vehicleToDriver.get(vehicle.id);
      const d = fleetDrivers.find(drv =>
        drv.status !== "Fuera de Turno" && !driverToVehicle.has(drv.id)
      );
      if (d) {
        vehicleToDriver.set(vehicle.id, d.id);
        driverToVehicle.set(d.id, vehicle.id);
        onUpdateDriver({ ...d, vehiculoAsignadoId: vehicle.id });
        onUpdateVehicle({ ...vehicle, conductorAsignadoId: d.id });
        return d.id;
      }
      return undefined;
    };

    const groups: OperationalTransfer[][] = [];
    const unvisited = [...sharedTransfers];

    // 2. Agrupar traslados compartidos por ventanas de tiempo
    while (unvisited.length > 0) {
      const current = unvisited.shift()!;
      const sTime = current.fechaHora.getTime();
      const group = [current];
      for (let i = unvisited.length - 1; i >= 0; i--) {
        const t = unvisited[i];
        const diffHrs = Math.abs(t.fechaHora.getTime() - sTime) / (1000 * 60 * 60);
        if (diffHrs <= overlapTolerance) {
          group.push(t);
          unvisited.splice(i, 1);
        }
      }
      groups.push(group);
    }

    let optimizedCount = 0;

    // 3. Asignar compartidos: First-Fit Decreasing por grupo de tiempo
    for (const group of groups) {
      group.sort((a, b) => b.paxCount - a.paxCount);

      const availableVehicles = fleetVehicles
        .filter(v => v.status !== "Mantenimiento")
        .sort((a, b) => b.capacidad - a.capacidad);

      const vehicleOccupancy = new Map<string, number>();

      for (const t of group) {
        let assigned = false;
        for (const v of availableVehicles) {
          const currentOccupancy = vehicleOccupancy.get(v.id) || 0;
          if (currentOccupancy + t.paxCount <= v.capacidad) {
            vehicleOccupancy.set(v.id, currentOccupancy + t.paxCount);
            const dId = assignDriver(v);
            const driverName = fleetDrivers.find(drv => drv.id === dId)?.nombre;
            if (t.vehiculoId !== v.id || t.conductorId !== dId) {
              onUpdateTransfer({
                ...t,
                vehiculoId: v.id,
                vehicleType: `${v.marca} ${v.modelo}`,
                conductorId: dId || null,
                driverName: driverName || undefined,
                status: "Asignado",
              });
              optimizedCount++;
            }
            assigned = true;
            break;
          }
        }
        if (!assigned && (t.status !== "Sin Asignar" || t.vehiculoId)) {
          onUpdateTransfer({
            ...t,
            vehiculoId: undefined,
            vehicleType: undefined,
            conductorId: null,
            driverName: undefined,
            status: "Sin Asignar",
          });
          optimizedCount++;
        }
      }
    }

    // 4. Asignar privados/sin-tipo: menor vehículo disponible sin conflicto horario
    unassignedPrivateTransfers.sort((a, b) => b.paxCount - a.paxCount);

    for (const t of unassignedPrivateTransfers) {
      const availableVehicles = fleetVehicles
        .filter(v => v.status !== "Mantenimiento" && v.capacidad >= t.paxCount)
        .sort((a, b) => a.capacidad - b.capacidad);

      for (const v of availableVehicles) {
        const sTime = t.fechaHora.getTime();
        const isInUse = activeTransfers.some(otherT =>
          otherT.vehiculoId === v.id &&
          Math.abs(otherT.fechaHora.getTime() - sTime) / (1000 * 60 * 60) <= overlapTolerance
        );
        if (!isInUse) {
          const dId = assignDriver(v);
          const driverName = fleetDrivers.find(drv => drv.id === dId)?.nombre;
          const updated: OperationalTransfer = {
            ...t,
            vehiculoId: v.id,
            vehicleType: `${v.marca} ${v.modelo}`,
            conductorId: dId || null,
            driverName: driverName || undefined,
            status: "Asignado",
          };
          onUpdateTransfer(updated);
          activeTransfers.push(updated);
          optimizedCount++;
          break;
        }
      }
    }

    if (optimizedCount > 0) {
      notify(`✨ Auto-Optimización completada: ${optimizedCount} traslados reasignados óptimamente.`);
    } else {
      notify(`✓ La asignación actual de traslados ya es óptima.`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-5 font-sans">

      {/* ── KPI HEADER ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: CalendarDays, label: "Servicios Hoy",  value: kpis.total,       color: "text-zinc-800", bg: "bg-zinc-50", border: "border-zinc-200" },
          { icon: AlertTriangle, label: "Sin Asignar",    value: kpis.sinAsignar,   color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
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
        <div className="border-b border-zinc-200 px-4 flex items-center gap-1 bg-zinc-50/50">
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
                  ? "border-zinc-900 text-zinc-900 bg-white"
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
            
            {/* Panel izquierdo: Lista de Traslados */}
            <div className="lg:col-span-5 flex flex-col overflow-hidden max-h-[650px]">
              {/* Barra de búsqueda y filtros */}
              <div className="p-3 border-b border-zinc-100 bg-white space-y-3 flex-shrink-0">
                {/* Fila 1: Búsqueda y Optimizador */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      id="transfer-search-input"
                      type="text"
                      placeholder="Buscar por ID, pasajero, origen..."
                      className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 rounded-md text-[11px] bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-400 font-medium transition-colors"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => handlePrintAll()}
                    title="Imprimir Manifiestos"
                    className="flex-shrink-0 flex items-center justify-center px-3 py-1.5 bg-zinc-800 hover:bg-black text-white font-bold text-[10px] uppercase tracking-wider rounded-md transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" /> Imprimir
                  </button>
                  <button
                    onClick={handleOptimizeShared}
                    title="Optimizar Compartidos"
                    className="flex-shrink-0 flex items-center justify-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] uppercase tracking-wider rounded-md border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Optimizar
                  </button>
                </div>

                {/* Fila 2: Filtros Compactos (Selects) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <select
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value as any)}
                    className={`px-2 py-1.5 text-[10px] font-bold rounded-md border focus:outline-none focus:border-zinc-400 cursor-pointer ${dateFilter !== 'Todos' ? 'border-indigo-400 text-indigo-700 bg-indigo-50' : 'border-zinc-200 text-zinc-600 bg-zinc-50'}`}
                  >
                    <option value="Todos">📅 Todas las Fechas</option>
                    <option value="Hoy">📍 Hoy</option>
                    <option value="Mañana">🔜 Mañana</option>
                    <option value="Esta Semana">🗓️ Esta Semana</option>
                  </select>

                  <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="px-2 py-1.5 text-[10px] font-bold rounded-md border border-zinc-200 bg-zinc-50 text-zinc-600 focus:outline-none focus:border-zinc-400 cursor-pointer"
                  >
                    <option value="Todos">🚦 Todos los Estados</option>
                    <option value="Sin Asignar">Sin Asignar</option>
                    <option value="Asignado">Asignado</option>
                    <option value="En Ruta">En Ruta</option>
                    <option value="Completado">Completado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>

                  <select 
                    value={directionFilter} 
                    onChange={e => setDirectionFilter(e.target.value as any)}
                    className="px-2 py-1.5 text-[10px] font-bold rounded-md border border-zinc-200 bg-zinc-50 text-zinc-600 focus:outline-none focus:border-zinc-400 cursor-pointer"
                  >
                    <option value="Todos">✈️ Todos los Sentidos</option>
                    <option value="IN">Llegada (IN)</option>
                    <option value="OUT">Salida (OUT)</option>
                    <option value="INTERHOTEL">Interhotel</option>
                    <option value="DISPO">Dispo</option>
                  </select>

                  <select 
                    value={sortOrder} 
                    onChange={e => setSortOrder(e.target.value as any)}
                    className="px-2 py-1.5 text-[10px] font-bold rounded-md border border-zinc-200 bg-zinc-50 text-zinc-600 focus:outline-none focus:border-zinc-400 cursor-pointer"
                  >
                    <option value="asc">⏱️ Horario: Más Temprano</option>
                    <option value="desc">⏱️ Horario: Más Tarde</option>
                  </select>
                </div>
              </div>
              {/* Lista de traslados */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                {filtered.length === 0 ? (
                  <div className="p-10 text-center text-zinc-400 text-xs">
                    Ningún traslado coincide con el filtro.
                  </div>
                ) : filtered.map(item => {
                  const cfg = statusConfig[item.status] || { label: item.status, dot: "bg-zinc-400", badge: "bg-zinc-100 text-zinc-700" };
                  const isSelected = selectedTransfer?.id === item.id;
                  const directionData = item.direction ? directionConfig[item.direction] : null;
                  const DirIcon = directionData?.icon;

                  return (
                    <div
                      id={`transfer-row-${item.id}`}
                      key={item.id}
                      onClick={() => { setSelectedTransfer(item); setAssignVehicleId(""); setAssignDriverId(""); }}
                      className={`p-4 cursor-pointer transition-colors flex items-start gap-3 border-l-4 ${
                        isSelected ? "bg-zinc-50/80 border-l-zinc-900" : "hover:bg-zinc-50/40 border-l-transparent"
                      }`}
                    >
                      <StatusDot className={`mt-1.5 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono text-[9px] font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">{item.id}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded ${cfg.badge}`}>{cfg.label}</span>
                          {directionData && DirIcon && (
                            <span className={`flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${directionData.badge}`}>
                              <DirIcon className="w-2.5 h-2.5 mr-0.5" />{directionData.label}
                            </span>
                          )}
                          <span className={`flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${item.tipoTraslado === 'Compartido' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'}`}>
                            {item.tipoTraslado || 'Privado'}
                          </span>
                          {getRemainingTimeBadge(item)}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-zinc-950 truncate">{item.pasajeroPrincipal}</p>
                          {(!item.telefonoPax || item.telefonoPax === "Sin registrar") && (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full flex-shrink-0" title="Pasajero sin número de teléfono">
                              <PhoneOff className="w-2.5 h-2.5" />
                              <span>SIN TLF</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Ruta Compacta de Despacho */}
                        <div className="mt-1.5 bg-zinc-50 rounded p-1.5 space-y-1">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-700 font-semibold truncate">
                            <span className="text-[8px] bg-zinc-300 text-zinc-800 font-black px-1 rounded flex-shrink-0">A</span>
                            <span>{item.origen}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500 truncate">
                            <span className="text-[8px] bg-zinc-200 text-zinc-600 font-black px-1 rounded flex-shrink-0">B</span>
                            <span>{item.destino}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 pl-2">
                        <p className="text-xs font-bold text-zinc-900">{formatTimeStr(item.fechaHora)}</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5 font-semibold">{formatDateStr(item.fechaHora)}</p>
                        <p className="text-[9px] text-zinc-500 font-semibold mt-1 bg-zinc-100 px-1.5 py-0.5 rounded">{item.paxCount} pax</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel derecho: Detalle del traslado */}
            <div className="lg:col-span-7 flex flex-col overflow-hidden bg-zinc-50/20 max-h-[650px]">
              {selectedTransfer ? (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Header del detalle */}
                  <div className="p-5 border-b border-zinc-100 bg-white flex-shrink-0 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-mono text-[9px] font-bold bg-zinc-900 text-white px-2 py-0.5 rounded">{selectedTransfer.id}</span>
                          {selectedTransfer.reservationId && (
                            <span className="font-mono text-[9px] text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
                              Expediente: {selectedTransfer.reservationId}
                            </span>
                          )}
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded ${statusConfig[selectedTransfer.status]?.badge || "bg-zinc-50"}`}>
                            {statusConfig[selectedTransfer.status]?.label || selectedTransfer.status}
                          </span>
                          {selectedTransfer.direction && (() => {
                            const dc = directionConfig[selectedTransfer.direction];
                            const DirIcon = dc.icon;
                            return (
                              <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded ${dc.badge}`}>
                                <DirIcon className="w-3 h-3" />{dc.label}
                              </span>
                            );
                          })()}
                          <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded ${selectedTransfer.tipoTraslado === 'Compartido' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'}`}>
                            {selectedTransfer.tipoTraslado || 'Privado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-zinc-950 leading-tight">{selectedTransfer.pasajeroPrincipal}</h2>
                          {(!selectedTransfer.telefonoPax || selectedTransfer.telefonoPax === "Sin registrar") && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full" title="Pasajero sin número de teléfono">
                              <PhoneOff className="w-3 h-3" />
                              <span>SIN TLF</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] text-zinc-400 font-bold mt-0.5 uppercase tracking-wide">Proveedor: {selectedTransfer.provider || "Foratour Receptivo S.A."}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-black text-zinc-950">{formatTimeStr(selectedTransfer.fechaHora)}</p>
                        <p className="text-[10px] text-zinc-400 font-bold">{formatDateStr(selectedTransfer.fechaHora)}</p>
                        <span className="inline-block text-[9px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded mt-1">{selectedTransfer.paxCount} Pasajeros</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
                    
                    {/* Mensaje de acción */}
                    {actionMsg && (
                      <div className="bg-zinc-900 text-white text-xs p-3 rounded-lg flex items-center gap-2 font-semibold shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {actionMsg}
                      </div>
                    )}

                    {/* Ruta Gráfica Interactiva */}
                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                      <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1">
                        <Route className="w-3.5 h-3.5 text-zinc-500" /> Ruta del Servicio
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-11 gap-2 items-center">
                        <div className="md:col-span-5 bg-white p-3 rounded-lg border border-zinc-200 shadow-sm relative">
                          <span className="absolute left-2.5 top-2.5 bg-zinc-950 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">A</span>
                          <div className="pl-5">
                            <p className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">Origen de Recogida</p>
                            <p className="text-xs font-bold text-zinc-800 mt-0.5 leading-tight">{selectedTransfer.origen}</p>
                            <p className="text-[9px] text-zinc-400 mt-1 font-semibold">📅 {formatDateStr(selectedTransfer.fechaHora)} &nbsp; 🕐 {formatTimeStr(selectedTransfer.fechaHora)}</p>
                          </div>
                        </div>

                        <div className="md:col-span-1 flex items-center justify-center">
                          <ChevronRight className="w-5 h-5 text-zinc-400 rotate-90 md:rotate-0" />
                        </div>

                        <div className="md:col-span-5 bg-white p-3 rounded-lg border border-zinc-200 shadow-sm relative">
                          <span className="absolute left-2.5 top-2.5 bg-zinc-400 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">B</span>
                          <div className="pl-5">
                            <p className="text-[8px] font-extrabold text-zinc-400 uppercase tracking-wider">Destino Final</p>
                            <p className="text-xs font-bold text-zinc-800 mt-0.5 leading-tight">{selectedTransfer.destino}</p>
                            {selectedTransfer.datosVuelo && (
                              <p className="text-[9px] text-zinc-400 mt-1 font-semibold flex items-center gap-0.5">
                                <Plane className="w-2.5 h-2.5 text-zinc-500" /> {selectedTransfer.datosVuelo}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notas */}
                    {selectedTransfer.notes && (
                      <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3.5 flex gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-bold text-amber-600 uppercase tracking-wider">Comentarios Operativos</p>
                          <p className="text-xs text-amber-800 font-semibold">{selectedTransfer.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Asignación actual */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 shadow-sm">
                      <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-zinc-500" /> Asignación de Recursos de Flota
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-zinc-200">
                          <p className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-wider">Chofer / Operador</p>
                          <p className={`text-xs font-black mt-1 ${selectedTransfer.driverName ? "text-zinc-955" : "text-amber-600 animate-pulse"}`}>
                            {selectedTransfer.driverName || "⚠ Sin Asignar"}
                          </p>
                          {selectedTransfer.conductorId && (
                            <p className="text-[9px] text-zinc-400 font-mono mt-0.5">ID: {selectedTransfer.conductorId}</p>
                          )}
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-zinc-200">
                          <p className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-wider">Vehículo Autorizado</p>
                          <p className={`text-xs font-black mt-1 ${selectedTransfer.vehiculoId ? "text-zinc-955" : "text-amber-600 animate-pulse"}`}>
                            {selectedTransfer.vehiculoId
                              ? (() => { const v = fleetVehicles.find(v => v.id === selectedTransfer.vehiculoId); return v ? `${v.marca} ${v.modelo}` : selectedTransfer.vehicleType; })()
                              : "⚠ Sin Vehículo"}
                          </p>
                          {selectedTransfer.vehiculoId && (
                            <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">
                              Placa: <span className="font-mono font-bold text-zinc-700 bg-zinc-100 px-1 rounded">{fleetVehicles.find(v => v.id === selectedTransfer.vehiculoId)?.placa}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Formulario de asignación (solo si no está completado/cancelado) */}
                    {selectedTransfer.status !== "Completado" && selectedTransfer.status !== "Cancelado" && (
                      <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/30 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-200 pb-2 mb-2 gap-2">
                          <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">
                            Despacho Rápido de Unidad
                          </h4>
                          <div className="flex items-center gap-2">
                            <label className="text-[9px] font-extrabold text-zinc-500 uppercase">
                              Tolerancia Traslapes (Hrs):
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={overlapTolerance}
                              onChange={e => setOverlapTolerance(parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-zinc-200 rounded-md text-xs font-bold text-center"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Vehículo */}
                          <div>
                            <label className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">
                              Vehículo Libre (Capacidad ≥ {selectedTransfer.paxCount} pax)
                            </label>
                            <select
                              id="assign-vehicle-select"
                              value={assignVehicleId}
                              onChange={e => {
                                const vId = e.target.value;
                                setAssignVehicleId(vId);
                                const veh = fleetVehicles.find(v => v.id === vId);
                                if (veh && veh.conductorAsignadoId) {
                                  if (availableDrivers.some(d => d.id === veh.conductorAsignadoId)) {
                                    setAssignDriverId(veh.conductorAsignadoId);
                                  }
                                }
                              }}
                              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-xs bg-white focus:outline-none focus:border-zinc-500 font-semibold text-zinc-800"
                            >
                              <option value="">— Selecciona un vehículo —</option>
                              {availableVehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                  {v.id} · {v.marca} {v.modelo} ({v.placa})
                                </option>
                              ))}
                            </select>
                            {availableVehicles.length === 0 && (
                              <p className="text-[9px] text-amber-600 font-bold mt-1">
                                ⚠ No hay vehículos libres con capacidad de {selectedTransfer.paxCount} pax.
                              </p>
                            )}
                          </div>
                          
                          {(() => {
                            if (selectedTransfer.tipoTraslado !== 'Compartido' || !assignVehicleId) return null;
                            const vehicle = fleetVehicles.find(v => v.id === assignVehicleId);
                            if (!vehicle) return null;
                            
                            const sTime = selectedTransfer.fechaHora.getTime();
                            const assigned = transfers.filter(t => 
                              t.id !== selectedTransfer.id &&
                              t.vehiculoId === assignVehicleId &&
                              t.status !== 'Cancelado' &&
                              t.tipoTraslado === 'Compartido' &&
                              Math.abs(t.fechaHora.getTime() - sTime) / (1000 * 60 * 60) <= overlapTolerance
                            );
                            
                            const totalAssignedPax = assigned.reduce((s, t) => s + t.paxCount, 0);
                            const potentialTotal = totalAssignedPax + selectedTransfer.paxCount;
                            const pct = Math.min(100, Math.round((potentialTotal / vehicle.capacidad) * 100));

                            return (
                              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg col-span-1 sm:col-span-2">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[9px] font-bold text-indigo-800 uppercase">Ocupación Prevista (Compartido)</span>
                                  <span className="text-[9px] font-bold text-indigo-800">{potentialTotal} / {vehicle.capacidad} pax</span>
                                </div>
                                <div className="w-full bg-indigo-200 rounded-full h-1.5 mb-2 overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${potentialTotal > vehicle.capacidad ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${pct}%` }}></div>
                                </div>
                                {assigned.length > 0 && (
                                  <div className="space-y-1 mt-2 border-t border-indigo-200/50 pt-2">
                                    <p className="text-[8px] font-bold text-indigo-600 uppercase">Ya asignados a este vehículo en este horario:</p>
                                    {assigned.map(t => (
                                      <div key={t.id} className="flex justify-between items-center text-[9px] text-indigo-900 bg-white/60 px-2 py-1 rounded shadow-sm border border-indigo-100/50">
                                        <span className="font-semibold truncate mr-2">{t.pasajeroPrincipal} <span className="text-indigo-400 font-mono text-[8px]">({t.id})</span></span>
                                        <span className="font-bold flex-shrink-0 bg-indigo-100 px-1.5 rounded">{t.paxCount} pax</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Conductor */}
                          <div>
                            <label className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">
                              Conductor Libre
                            </label>
                            <select
                              id="assign-driver-select"
                              value={assignDriverId}
                              onChange={e => {
                                const dId = e.target.value;
                                setAssignDriverId(dId);
                                const drv = fleetDrivers.find(d => d.id === dId);
                                if (drv && drv.vehiculoAsignadoId) {
                                  if (availableVehicles.some(v => v.id === drv.vehiculoAsignadoId)) {
                                    setAssignVehicleId(drv.vehiculoAsignadoId);
                                  }
                                }
                              }}
                              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-xs bg-white focus:outline-none focus:border-zinc-500 font-semibold text-zinc-800"
                            >
                              <option value="">— Selecciona un conductor —</option>
                              {availableDrivers.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.id} · {d.nombre}
                                </option>
                              ))}
                            </select>
                            {availableDrivers.length === 0 && (
                              <p className="text-[9px] text-amber-600 font-bold mt-1">
                                ⚠ No hay conductores libres en turno.
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          id="assign-fleet-btn"
                          onClick={handleAssign}
                          disabled={!assignVehicleId || !assignDriverId}
                          className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white text-xs font-black rounded-md transition-colors cursor-pointer uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <UserCheck className="w-4 h-4" />
                          Confirmar Despacho
                        </button>
                      </div>
                    )}

                    {/* Flujo de estado */}
                    <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-200">
                      <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3">Actualizar Estado Operativo</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          id="set-enruta-btn"
                          onClick={() => handleSetStatus("En Ruta")}
                          disabled={!selectedTransfer.driverName || selectedTransfer.status === "En Ruta" || selectedTransfer.status === "Completado" || selectedTransfer.status === "Cancelado"}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-100 disabled:text-zinc-400 text-white text-xs font-bold rounded-md transition-colors cursor-pointer uppercase tracking-wide flex items-center gap-1.5"
                        >
                          <Activity className="w-3.5 h-3.5" /> En Ruta
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
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-md transition-colors cursor-pointer uppercase tracking-wide flex items-center gap-1.5 animate-fade-in"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancelar Servicio
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-zinc-400 bg-white">
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
              <div className="bg-white rounded-lg">
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
              <div className="bg-white rounded-lg">
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
                        {["ID","Nombre","Teléfono","Licencia","Vehículo Asignado","Estado","Observaciones","Acciones"].map(h => (
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
                            <td className="px-3 py-3 text-zinc-500 whitespace-nowrap">{d.observaciones || "—"}</td>
                            <td className="px-3 py-3">
                              <button 
                                onClick={() => handlePrintDriver(d)}
                                title="Imprimir manifiesto de hoy"
                                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase text-zinc-600 bg-white hover:bg-zinc-100 hover:text-black border border-zinc-200 rounded cursor-pointer transition-colors"
                              >
                                <Printer className="w-3 h-3" /> Imprimir
                              </button>
                            </td>
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
                <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500" />
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
      {/* COMPONENTES DE IMPRESIÓN (Visibles solo en @media print) */}
      {printingManifests.length > 0 && (
        <div className="print-manifest-container">
          {printingManifests.map((manifest, idx) => (
            <div key={manifest.driver.id} className={idx > 0 ? "page-break" : ""}>
              <DriverManifest 
                driver={manifest.driver}
                date={manifest.date}
                transfers={manifest.transfers}
              />
            </div>
          ))}
        </div>
      )}
      
      {printingDailyManifest && (
        <DailyDispatchManifest 
          title="Board de Despacho"
          subtitle={printingDailyManifest.subtitle}
          transfers={printingDailyManifest.transfers}
          drivers={fleetDrivers}
        />
      )}
    </>
  );
}
