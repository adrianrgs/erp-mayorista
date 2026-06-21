import React, { useState } from "react";
import { ProjectView, HotelProperty, Reservation, FlightLeg, TransferService, FinancialInvoice, B2BClient, FleetVehicle, FleetDriver, PayableObligation, ProviderStatement } from "./types";
import { Property, RoomType, RatePlan, StopSale } from "./types/producto";
import { 
  initialProperties, 
  initialReservas, 
  initialFlights, 
  initialTransfers, 
  initialInvoices,
  initialClients,
  initialDetailedProperties,
  initialRoomTypes,
  initialRatePlans,
  initialStopSales,
  initialFleetVehicles,
  initialFleetDrivers,
  initialPayableObligations,
  initialProviderStatements
} from "./mockData";
import PropiedadesView from "./views/PropiedadesView";
import ReservasView from "./views/ReservasView";
import VuelosView from "./views/VuelosView";
import OperacionesView from "./views/OperacionesView";
import AdministracionView from "./views/AdministracionView";
import ClientesView from "./views/ClientesView";
import FacturacionView from "./views/FacturacionView";
import CobranzasView from "./views/CobranzasView";
import CuentasPorPagarView from "./views/CuentasPorPagarView";

import { 
  Building2, 
  Calendar, 
  Plane, 
  Route, 
  Wallet, 
  Compass, 
  Settings, 
  HelpCircle,
  Sparkles,
  LayoutDashboard,
  Bell,
  RefreshCw,
  Globe,
  Check,
  Eye,
  Terminal,
  Users,
  FileText,
  ReceiptText,
  TrendingDown
} from "lucide-react";

export default function App() {
  // Navigation Section
  const [currentSection, setCurrentSection] = useState<ProjectView>(ProjectView.PROPIEDADES);
  
  // App state managers
  const [properties, setProperties] = useState<HotelProperty[]>(initialProperties);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservas);
  const [flights, setFlights] = useState<FlightLeg[]>(initialFlights);
  const [transfers, setTransfers] = useState<TransferService[]>(initialTransfers);
  const [invoices, setInvoices] = useState<FinancialInvoice[]>(initialInvoices);
  const [clients, setClients] = useState<B2BClient[]>(initialClients);

  const [detailedProperties, setDetailedProperties] = useState<Property[]>(initialDetailedProperties);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(initialRoomTypes);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>(initialRatePlans);
  const [stopSales, setStopSales] = useState<StopSale[]>(initialStopSales);

  // Fleet state
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>(initialFleetVehicles);
  const [fleetDrivers, setFleetDrivers] = useState<FleetDriver[]>(initialFleetDrivers);

  // Accounts Payable state
  const [payableObligations, setPayableObligations] = useState<PayableObligation[]>(initialPayableObligations);
  const [providerStatements, setProviderStatements] = useState<ProviderStatement[]>(initialProviderStatements);

  const handleUpdateObligation = (updated: PayableObligation) => {
    setPayableObligations(prev => prev.map(o => o.id === updated.id ? updated : o));
  };

  const handleAddStatement = (newDoc: ProviderStatement) => {
    setProviderStatements(prev => [newDoc, ...prev]);
  };

  // Selector for showing Literal Next.js Phase 0 empty placeholders vs Interactive fully-realized previews
  const [isFase0SkeletonView, setIsFase0SkeletonView] = useState<boolean>(false);

  // Trigger cross-view state propagation
  const handleUpdateProperty = (updated: HotelProperty) => {
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleAddReservation = (newRes: Reservation) => {
    setReservations(prev => [newRes, ...prev]);

    // Only run side-effects for Real Bookings (tipo is NOT "Cotización")
    if (newRes.tipo !== "Cotización") {
      // SIDE-EFFECT: Deduct hotel allotment automatically in real-time cross-module modeling!
      const matchedProp = properties.find(p => p.name === newRes.hotelName);
      if (matchedProp) {
        handleUpdateProperty({
          ...matchedProp,
          allotment: Math.max(0, matchedProp.allotment - 1)
        });
      }

      // SIDE-EFFECT: Auto-generate ground transfer task!
      const matchedFlight = flights.find(f => f.flightNo === newRes.flightNo);
      const newTrans: TransferService = {
        id: `TR-${Math.floor(200 + Math.random() * 800)}`,
        leadPassenger: newRes.holder,
        paxCount: newRes.pax,
        pickupLocation: matchedFlight ? `Llegadas Aeropuerto (Vuelo ${matchedFlight.flightNo})` : "Aeropuerto Internacional Local",
        dropoffLocation: newRes.hotelName,
        date: newRes.checkIn,
        time: "14:00",
        provider: "Foratour Receptivo S.A.",
        status: "No Asignado",
        vehicleType: newRes.pax > 4 ? "Minivan de Línea" : "Berlina Ejecutiva"
      };
      setTransfers(prev => [newTrans, ...prev]);
    }
  };

  const handleUpdateReservation = (updatedRes: Reservation) => {
    setReservations(prev => prev.map(r => r.id === updatedRes.id ? updatedRes : r));

    // Propagar cambios a Facturas asociadas (solo facturas de cobro normales con prefijo FAC-, no notas de crédito NC- ni abonos ABO-)
    setInvoices(prev => prev.map(inv => {
      if (inv.clientName.includes(`Localizador ${updatedRes.id}`) && inv.id.startsWith("FAC-")) {
        return {
          ...inv,
          amount: updatedRes.totalPrice,
          vatAmount: Math.round(updatedRes.totalPrice * 0.16),
          dueDate: updatedRes.checkIn
        };
      }
      return inv;
    }));

    // Propagar cambios a Traslados asociados
    setTransfers(prev => prev.map(t => {
      const oldRes = reservations.find(r => r.id === updatedRes.id);
      if (oldRes && (t.leadPassenger === oldRes.holder || t.dropoffLocation === oldRes.hotelName)) {
        return {
          ...t,
          leadPassenger: updatedRes.holder,
          paxCount: updatedRes.pax,
          date: updatedRes.checkIn,
          dropoffLocation: updatedRes.hotelName,
          vehicleType: updatedRes.pax > 4 ? "Minivan de Línea" : "Berlina Ejecutiva"
        };
      }
      return t;
    }));
  };

  const handleUpdateTransfer = (updated: TransferService) => {
    setTransfers(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleUpdateVehicle = (updated: FleetVehicle) => {
    setFleetVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
  };

  const handleAddVehicle = (newV: FleetVehicle) => {
    setFleetVehicles(prev => [newV, ...prev]);
  };

  const handleUpdateDriver = (updated: FleetDriver) => {
    setFleetDrivers(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const handleAddDriver = (newD: FleetDriver) => {
    setFleetDrivers(prev => [newD, ...prev]);
  };

  const handleUpdateInvoice = (updated: FinancialInvoice) => {
    setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const handleAddInvoice = (newInv: FinancialInvoice) => {
    setInvoices(prev => [newInv, ...prev]);
  };

  const handleUpdateClient = (updated: B2BClient) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleAddClient = (newClient: B2BClient) => {
    setClients(prev => [newClient, ...prev]);
  };

  // Helper title strings for literal Next.js files preview matching
  const getSectionTitle = () => {
    switch (currentSection) {
      case ProjectView.PROPIEDADES:
        return "Módulo de Propiedades y Tarifas - Dpto. Producto";
      case ProjectView.RESERVAS:
        return "Módulo de Reservas - Dpto. Reservas";
      case ProjectView.VUELOS:
        return "Módulo de Vuelos - Dpto. Aéreos";
      case ProjectView.OPERACIONES:
        return "Módulo de Operaciones Terrestres - Dpto. Operaciones";
      case ProjectView.ADMINISTRACION:
        return "Módulo de Administración y Finanzas - Dpto. Administración";
      case ProjectView.CLIENTES:
        return "Módulo B2B de Clientes y Agencias - Dpto. Ventas";
      case ProjectView.FACTURACION:
        return "Módulo de Facturación - Dpto. Facturación";
      case ProjectView.COBRANZAS:
        return "Módulo de Cuentas por Cobrar - Dpto. Tesorería";
      case ProjectView.CUENTAS_PAGAR:
        return "Módulo de Cuentas por Pagar - Dpto. Tesorería y Pagos";
    }
  };

  const getSectionDescription = () => {
    switch (currentSection) {
      case ProjectView.PROPIEDADES:
        return "Este es el lienzo en blanco para la gestión de hoteles, inventario de habitaciones, tarifas dinámicas y contratos de alojamiento de Foratour ERP. Aquí se configurará la arquitectura de datos y la sincronización con el Channel Manager.";
      case ProjectView.RESERVAS:
        return "Este es el lienzo en blanco para la gestión de expedientes, estados de pago y asignación de peticiones especiales. Aquí se procesarán las solicitudes y cotizaciones personalizadas de los clientes.";
      case ProjectView.VUELOS:
        return "Este es el lienzo en blanco para la gestión de conectores GDS (Sabre, Amadeus), bloqueos, cupos de asientos y tarifas aéreas tanto regulares como de charters.";
      case ProjectView.OPERACIONES:
        return "Este es el lienzo en blanco para la gestión y despacho de traslados, asignación de guías turísticos, itinerarios de viaje diarios, vehículos y servicios locales receptivos.";
      case ProjectView.ADMINISTRACION:
        return "Este es el lienzo en blanco para la facturación, cuentas por cobrar y pagar, balances, cuentas de proveedores locales (DMCs) y conciliaciones bancarias automatizadas.";
      case ProjectView.CLIENTES:
        return "Este es el lienzo para la gestión de agencias de viajes minoristas, freelancers, cuentas a crédito, límites de financiamiento, estados de mora y balances comerciales.";
      case ProjectView.FACTURACION:
        return "Este es el lienzo de trabajo del departamento de facturación y cobranzas. Aquí se consolidan las facturas de expedientes y servicios adicionales emitidos a agencias B2B.";
      case ProjectView.COBRANZAS:
        return "Este es el espacio de control de cuentas por cobrar, gestión de deudas activas de agencias, conciliación bancaria y validación de comprobantes de pago de Foratour ERP.";
      case ProjectView.CUENTAS_PAGAR:
        return "Este es el lienzo de trabajo para el control de deudas netas de servicios, conciliaciones con proveedores locales, hoteles y aerolíneas, y la emisión de transferencias bancarias de egresos.";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex font-sans antialiased">
      
      {/* SIDEBAR PERSISTENTE IZQUIERDO */}
      <aside className="w-72 bg-zinc-950 flex flex-col h-screen fixed left-0 top-0 text-white p-5 border-r border-zinc-900 z-20 font-sans">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-9 px-2">
          <div className="w-10 h-10 rounded-md bg-white text-zinc-950 flex items-center justify-center font-extrabold text-xl shadow-xs">
            F
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-sans">
              <h1 className="font-bold text-base tracking-tight leading-none text-white">Foratour ERP</h1>
              <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono px-1.5 py-0.5 rounded-sm">V0</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium mt-1 uppercase tracking-wider">Wholesale Logistics</p>
          </div>
        </div>

        {/* Navigation Modules (5 Departments) */}
        <div className="px-1 mb-3">
          <p className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider mb-2.5 px-3">Departamentos ERP</p>
        </div>
        <nav className="flex-1 space-y-1.5">
          <button
            id="nav-propiedades"
            onClick={() => setCurrentSection(ProjectView.PROPIEDADES)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${
              currentSection === ProjectView.PROPIEDADES
                ? "bg-zinc-900 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold">1. Propiedades y Tarifas</span>
            </div>
            {currentSection !== ProjectView.PROPIEDADES && (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
            )}
          </button>

          <button
            id="nav-reservas"
            onClick={() => setCurrentSection(ProjectView.RESERVAS)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${
              currentSection === ProjectView.RESERVAS
                ? "bg-zinc-900 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold">2. Reservas (Booking)</span>
            </div>
            {currentSection !== ProjectView.RESERVAS && (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
            )}
          </button>

          <button
            id="nav-vuelos"
            onClick={() => setCurrentSection(ProjectView.VUELOS)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${
              currentSection === ProjectView.VUELOS
                ? "bg-zinc-900 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <Plane className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold">3. Vuelos (Air Control)</span>
            </div>
            {currentSection !== ProjectView.VUELOS && (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
            )}
          </button>

          <button
            id="nav-operaciones"
            onClick={() => setCurrentSection(ProjectView.OPERACIONES)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${
              currentSection === ProjectView.OPERACIONES
                ? "bg-zinc-900 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <Route className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold">4. Ops. Receptivo</span>
            </div>
            {currentSection !== ProjectView.OPERACIONES && (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
            )}
          </button>

          <button
            id="nav-administracion"
            onClick={() => setCurrentSection(ProjectView.ADMINISTRACION)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${
              currentSection === ProjectView.ADMINISTRACION
                ? "bg-zinc-900 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold">5. Administración/BI</span>
            </div>
            {currentSection !== ProjectView.ADMINISTRACION && (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
            )}
          </button>

          <button
            id="nav-clientes"
            onClick={() => setCurrentSection(ProjectView.CLIENTES)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${
              currentSection === ProjectView.CLIENTES
                ? "bg-zinc-900 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold">6. Clientes B2B</span>
            </div>
            {currentSection !== ProjectView.CLIENTES && (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
            )}
          </button>

          <button
            id="nav-facturacion"
            onClick={() => setCurrentSection(ProjectView.FACTURACION)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${
              currentSection === ProjectView.FACTURACION
                ? "bg-zinc-900 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold">7. Dpto. Facturación</span>
            </div>
            {currentSection !== ProjectView.FACTURACION && (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
            )}
          </button>

          <button
            id="nav-cobranzas"
            onClick={() => setCurrentSection(ProjectView.COBRANZAS)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${
              currentSection === ProjectView.COBRANZAS
                ? "bg-zinc-900 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <ReceiptText className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold">8. Cuentas por Cobrar</span>
            </div>
            {currentSection !== ProjectView.COBRANZAS && (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
            )}
          </button>

          <button
            id="nav-cuentaspagar"
            onClick={() => setCurrentSection(ProjectView.CUENTAS_PAGAR)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${
              currentSection === ProjectView.CUENTAS_PAGAR
                ? "bg-zinc-900 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <TrendingDown className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-semibold">9. Cuentas por Pagar</span>
            </div>
            {currentSection !== ProjectView.CUENTAS_PAGAR && (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
            )}
          </button>
        </nav>

        {/* Footer info showing standard constraints */}
        <div className="border-t border-zinc-900 pt-5 space-y-3 mt-auto">
          <div className="bg-zinc-900/65 p-3 rounded-lg border border-zinc-900 text-xs font-sans">
            <span className="text-zinc-500 text-[9px] uppercase tracking-wider font-extrabold block">Firma del compilador</span>
            <div className="flex items-center gap-1.5 text-zinc-400 font-mono mt-1 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              <span>Next.js App Router (15+)</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium px-1 font-sans">
            Fase 0: Cascarón de Navegación ERP para Agencia Mayorista.
          </p>
        </div>
      </aside>

      {/* CONTINENTE DE CONTENIDO PRINCIPAL (COLUMNA DERECHA) */}
      <div className="flex-1 pl-72 flex flex-col min-h-screen">
        
        {/* TOP GENERAL BAR */}
        <header className="h-16 bg-white border-b border-zinc-200/80 flex items-center justify-between px-8 sticky top-0 z-10">
          
          {/* Left indicator */}
          <div className="flex items-center gap-4 font-sans">
            <div className="flex items-center gap-2 text-zinc-800 bg-zinc-50 px-3.5 py-1.5 rounded border border-zinc-200 font-semibold text-xs">
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              <span>Canal Directo Multi-Divisa</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              Foratour Wholesale Ltd.
            </p>
          </div>

          {/* Toggle Switches for Demonstration */}
          <div className="flex items-center gap-3 font-sans">
            <span className="text-xs text-zinc-400 font-bold hidden sm:inline-block">Modo de Demostración:</span>
            <div className="bg-zinc-50 p-1 rounded-md flex items-center border border-zinc-200">
              <button
                id="toggle-fase0-true"
                onClick={() => setIsFase0SkeletonView(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                  isFase0SkeletonView 
                    ? "bg-zinc-950 text-white" 
                    : "text-zinc-500 hover:text-zinc-905"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Lienzo Neutro (Fase 0)
              </button>
              <button
                id="toggle-fase0-false"
                onClick={() => setIsFase0SkeletonView(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                  !isFase0SkeletonView 
                    ? "bg-zinc-950 text-white" 
                    : "text-zinc-500 hover:text-zinc-905"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Maqueta Interactiva
              </button>
            </div>

            {/* Profile */}
            <div className="h-9 w-[1px] bg-zinc-200 mx-1.5"></div>
            <div className="flex items-center gap-3">
              <div className="w-8.5 h-8.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold flex items-center justify-center text-xs">
                JD
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-bold text-zinc-800 leading-tight">Juan Delgado</p>
                <p className="text-[10px] text-zinc-400 leading-none">Administrador Senior</p>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <main className="flex-1 p-8 space-y-6">

          {/* Glowing Top Banner informing the status */}
          <div className="p-4 bg-white border border-zinc-200 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 font-sans">
              <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-650 rounded">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900">
                  {isFase0SkeletonView 
                    ? "Visualizando: Lienzo Neutro del Cascarón (Fase 0 Next.js)" 
                    : "Visualizando: Maqueta Interactiva de Alta Fidelidad"}
                </h3>
                <p className="text-xs text-zinc-450 mt-0.5">
                  {isFase0SkeletonView 
                    ? "Esta pantalla imita exactamente el contenido del archivo page.tsx en disco." 
                    : "Usa el menú izquierdo para simular cómo opera la lógica y datos del ERP mayorista."}
                </p>
              </div>
            </div>
            
            <button
              id="action-banner-toggle"
              onClick={() => setIsFase0SkeletonView(!isFase0SkeletonView)}
              className="px-4.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded text-xs font-bold flex items-center gap-2 transition-all cursor-pointer font-sans"
            >
              <Eye className="w-4 h-4 text-zinc-500" />
              {isFase0SkeletonView ? "Activar Maqueta Interactiva" : "Ver Código del Lienzo Plano"}
            </button>
          </div>

          {/* DYNAMIC COMPONENT LOADER */}
          <div className="transition-all duration-300">
            {isFase0SkeletonView ? (
              /* LITERAL BLANK CANVAS AS REQUESTED */
              <div className="bg-white border border-zinc-200 rounded-lg p-10 space-y-5 text-center max-w-4xl mx-auto my-10 animate-fade-in font-sans">
                <div className="w-12 h-12 rounded bg-zinc-50 border border-zinc-205 text-zinc-400 flex items-center justify-center mx-auto">
                  <Terminal className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                    {getSectionTitle()}
                  </h2>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-50 py-1 px-3.5 rounded inline-block border border-zinc-200/60">
                    PROYECTO COMPILADO: /app/{currentSection}/page.tsx
                  </p>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl mx-auto">
                  {getSectionDescription()}
                </p>
                <div className="pt-6 border-t border-zinc-200/80 flex items-center justify-center gap-6 text-xs text-zinc-400 font-semibold font-sans">
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-zinc-800" /> Enrutamiento verificado
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-zinc-800" /> Cero recargas de página
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-zinc-800" /> Next.js App Router compatible
                  </span>
                </div>
              </div>
            ) : (
              /* INTERACTIVE LIVE MODEL SHOWN BY DEFAULT */
              <div className="animate-fade-in">
                 {currentSection === ProjectView.PROPIEDADES && (
                   <PropiedadesView 
                     properties={properties} 
                     onUpdateProperty={handleUpdateProperty} 
                     detailedProperties={detailedProperties}
                     setDetailedProperties={setDetailedProperties}
                     roomTypes={roomTypes}
                     setRoomTypes={setRoomTypes}
                     ratePlans={ratePlans}
                     setRatePlans={setRatePlans}
                     stopSales={stopSales}
                     setStopSales={setStopSales}
                   />
                 )}
                  {currentSection === ProjectView.RESERVAS && (
                    <ReservasView 
                      reservations={reservations} 
                      properties={properties}
                      clients={clients}
                      onAddReservation={handleAddReservation}
                      onUpdateReservation={handleUpdateReservation}
                      onAddInvoice={handleAddInvoice}
                      detailedProperties={detailedProperties}
                      roomTypes={roomTypes}
                      ratePlans={ratePlans}
                    />
                  )}
                  {currentSection === ProjectView.FACTURACION && (
                    <FacturacionView 
                      reservations={reservations} 
                      invoices={invoices}
                      onUpdateReservation={handleUpdateReservation}
                      onAddInvoice={handleAddInvoice}
                      clients={clients}
                      roomTypes={roomTypes}
                      ratePlans={ratePlans}
                      detailedProperties={detailedProperties}
                      onUpdateClient={handleUpdateClient}
                    />
                  )}
                {currentSection === ProjectView.VUELOS && (
                  <VuelosView 
                    flights={flights} 
                  />
                )}
                {currentSection === ProjectView.OPERACIONES && (
                  <OperacionesView
                    transfers={transfers}
                    onUpdateTransfer={handleUpdateTransfer}
                    fleetVehicles={fleetVehicles}
                    onUpdateVehicle={handleUpdateVehicle}
                    onAddVehicle={handleAddVehicle}
                    fleetDrivers={fleetDrivers}
                    onUpdateDriver={handleUpdateDriver}
                    onAddDriver={handleAddDriver}
                  />
                )}
                {currentSection === ProjectView.ADMINISTRACION && (
                  <AdministracionView 
                    invoices={invoices} 
                    onUpdateInvoice={handleUpdateInvoice} 
                  />
                )}
                {currentSection === ProjectView.CLIENTES && (
                  <ClientesView 
                    clients={clients} 
                    onUpdateClient={handleUpdateClient} 
                    onAddClient={handleAddClient} 
                    invoices={invoices}
                    reservations={reservations}
                    roomTypes={roomTypes}
                    ratePlans={ratePlans}
                    detailedProperties={detailedProperties}
                  />
                )}
                {currentSection === ProjectView.COBRANZAS && (
                  <CobranzasView 
                    clients={clients} 
                    onUpdateClient={handleUpdateClient} 
                    invoices={invoices}
                    onUpdateInvoice={handleUpdateInvoice}
                    reservations={reservations}
                    onAddInvoice={handleAddInvoice}
                  />
                )}
                {currentSection === ProjectView.CUENTAS_PAGAR && (
                  <CuentasPorPagarView 
                    obligations={payableObligations} 
                    onUpdateObligation={handleUpdateObligation} 
                    statements={providerStatements}
                    onAddStatement={handleAddStatement}
                  />
                )}
              </div>
            )}
          </div>

        </main>
      </div>

    </div>
  );
}
