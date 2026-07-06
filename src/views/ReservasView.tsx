import React, { useState } from "react";
import { Reservation, HotelProperty, ServiceItem, ServiceType, B2BClient, DirectClient, DirectClientTipo, ClientStatus, FleetVehicle, CompanyConfig, ReservationPassenger, PassengerType } from "../types";
import { createEmptyPassenger, deriveHolderName, derivePassengersFromLegacyReservation, markTitular } from "../lib/passengers";
import { Tabs } from "../components/reservas/Tabs";
import { Property, RoomType, RatePlan, TipoCobro, ExtraService, ServiceRate, StopSale } from "../types/producto";
import type { FlightTicket } from "../types/aereos";
import { buildRoute, formatGDSDate } from "../lib/parsers/pnrParser";
import { 
  Calendar, 
  User, 
  MapPin, 
  Plane,
  Plus, 
  Search,
  Filter,
  AlertCircle,
  AlertTriangle,
  Compass,
  TrendingUp,
  XCircle,
  FileText,
  DollarSign,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  X,
  ChevronRight,
  ArrowUpDown,
  ArrowLeft,
  Printer,
  Download,
  Info,
  ShoppingCart,
  Trash2,
  Car,
  Shield,
  Truck,
  Edit,
  Share2,
  FileCheck,
  Send,
  Clock,
  ArrowRight,
  Activity
} from "lucide-react";
import { FinancialInvoice, PayableObligation, PaymentVoucher } from "../types";
import { useDialog } from "../components/ui/DialogProvider";
import DateRangePicker from "../components/ui/DateRangePicker";
import SearchableSelect from "../components/ui/SearchableSelect";
import { reconcileDossierUpdate } from "../lib/financialReconciler";
import { resolveSaleClient, isCreditEligible } from "../lib/clientResolver";
import { nextSequentialId } from "../lib/idGenerator";
import { TaxJurisdiction, DEFAULT_JURISDICTION, formatCurrency, formatDualCurrency } from "../lib/taxEngine";
import { getStatusBadge, formatDate } from "../components/reservas/reservasFormat";

interface ReservasViewProps {
  reservations: Reservation[];
  properties: HotelProperty[];
  clients: B2BClient[];
  directClients: DirectClient[];
  onAddDirectClient: (newClient: DirectClient) => void;
  onAddReservation: (newRes: Reservation) => void;
  onUpdateReservation?: (updatedRes: Reservation) => void;
  onDeleteReservation?: (id: string) => void;
  onAddInvoice?: (newInv: FinancialInvoice) => void;
  detailedProperties: Property[];
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  stopSales?: StopSale[];
  invoices: FinancialInvoice[];
  payableObligations: PayableObligation[];
  vouchers?: PaymentVoucher[];
  // ── Conexión con Módulo de Vuelos ──────────────────────────────────────────
  boletos?: FlightTicket[];
  onBoletosChange?: React.Dispatch<React.SetStateAction<FlightTicket[]>>;
  onUpdateBoleto?: (b: FlightTicket) => void;
  fleetVehicles?: FleetVehicle[];
  extraServices?: ExtraService[];
  serviceRates?: ServiceRate[];
  companyConfig: CompanyConfig;
  jurisdiction?: TaxJurisdiction;
  currentExchangeRate?: number;
}

// Helper to calculate pricing for an individual room. Usa el mismo prorrateo por tramos de
// tarifa que el formulario de configuración (getRateSegments/calculateRoomPvpBySegments más
// abajo) para que el desglose por habitación siempre sume igual al total ya guardado del
// servicio, incluso cuando la estadía cruza más de una temporada.
const calculateRoomRates = (
  room: any,
  detalles: any,
  mercado: "NACIONAL" | "INTERNACIONAL",
  ratePlans: RatePlan[],
  roomTypes: RoomType[]
) => {
  const { hotelId, checkInDate, checkOutDate, comisionB2B = 10, comisionPropia = 5 } = detalles;

  const segments = getRateSegments(hotelId, room.roomTypeId, mercado, checkInDate, checkOutDate, ratePlans);
  if (segments.length === 0) return { pvp: 0, sale: 0, net: 0, comisionB2BVal: 0 };

  const pvp = calculateRoomPvpBySegments(room, segments, roomTypes);
  const sale = Math.round(pvp * (1 - comisionB2B / 100) * 100) / 100;
  const net = Math.round(pvp * (1 - (comisionB2B + comisionPropia) / 100) * 100) / 100;
  const comisionB2BVal = pvp - sale;

  return { pvp, sale, net, comisionB2BVal };
};

// Segmenta una estadía en tramos de noches consecutivas cubiertas por el mismo RatePlan,
// para que una estadía que cruce dos temporadas (ej. Temporada Alta → Temporada Baja) se
// cobre proporcionalmente por noche en vez de aplicar una sola tarifa a toda la estadía.
// Si alguna noche no cae dentro de la vigencia (fechaInicio/fechaFin) de ningún RatePlan,
// usa como respaldo cualquier tarifa del mismo tipo de habitación (mismo criterio que ya
// existía cuando no había match exacto).
const getRateSegments = (
  propertyId: string,
  roomTypeId: string,
  mercado: "NACIONAL" | "INTERNACIONAL",
  checkInDate: string,
  checkOutDate: string,
  ratePlans: RatePlan[]
): { ratePlan: RatePlan; nights: number }[] => {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return [];

  const fallback =
    ratePlans.find(rp => rp.property_id === propertyId && rp.roomType_id === roomTypeId && rp.mercado === mercado) ||
    ratePlans.find(rp => rp.roomType_id === roomTypeId);

  const segments: { ratePlan: RatePlan; nights: number }[] = [];
  let cursor = start;
  while (cursor < end) {
    const dateStr = cursor.toISOString().split("T")[0];
    const match = ratePlans.find(rp =>
      rp.property_id === propertyId &&
      rp.roomType_id === roomTypeId &&
      rp.mercado === mercado &&
      dateStr >= rp.fechaInicio &&
      dateStr < rp.fechaFin
    ) || fallback;

    if (match) {
      const last = segments[segments.length - 1];
      if (last && last.ratePlan.id === match.id) {
        last.nights += 1;
      } else {
        segments.push({ ratePlan: match, nights: 1 });
      }
    }
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return segments;
};

// Calcula el PVP de una habitación sumando cada tramo de tarifa por su cantidad de noches.
const calculateRoomPvpBySegments = (
  room: { roomTypeId: string; guests: { name: string; type: "Adulto" | "Niño" }[] },
  segments: { ratePlan: RatePlan; nights: number }[],
  roomTypes: RoomType[]
): number => {
  const rt = roomTypes.find(type => type.id === room.roomTypeId);
  const baseOcc = rt?.ocupacionBase || 2;
  const adults = room.guests.filter(g => g.type === "Adulto").length;
  const children = room.guests.filter(g => g.type === "Niño").length;
  const baseOccupants = Math.min(baseOcc, adults);
  const extraAdults = Math.max(0, adults - baseOccupants);

  return segments.reduce((sum, seg) => {
    const rate = seg.ratePlan;
    const perNight = rate.tipoCobro === TipoCobro.POR_HABITACION
      ? rate.tarifaBase
      : (rate.tarifaBase * baseOccupants) + (rate.tarifaExtraAdulto * extraAdults) + (rate.tarifaExtraNino * children);
    return sum + perNight * seg.nights;
  }, 0);
};

export default function ReservasView({ 
  reservations,
  properties,
  clients,
  directClients,
  onAddDirectClient,
  onAddReservation,
  onUpdateReservation,
  onDeleteReservation,
  onAddInvoice,
  detailedProperties,
  roomTypes,
  ratePlans,
  stopSales = [],
  invoices,
  payableObligations,
  vouchers = [],
  boletos = [],
  onBoletosChange,
  onUpdateBoleto,
  fleetVehicles = [],
  extraServices = [],
  serviceRates = [],
  companyConfig,
  jurisdiction,
  currentExchangeRate,
}: ReservasViewProps) {
  const jur = jurisdiction ?? DEFAULT_JURISDICTION;
  const { showAlert, showConfirm } = useDialog();
  // Navigation inside the module:
  // 1: List (dashboard), 2: Expediente unificado (Resumen/Datos Generales/Pasajeros/Servicios/Administración), 3: Configurar Servicio
  const [viewLevel, setViewLevel] = useState<1 | 2 | 3>(1);
  const [selectedResId, setSelectedResId] = useState<string | null>(reservations[0]?.id || null);
  const [financialImpactPreview, setFinancialImpactPreview] = useState<any | null>(null);
  const [pendingSaveReservation, setPendingSaveReservation] = useState<Reservation | null>(null);

  // Pestaña activa dentro del expediente unificado (Level 2)
  type ExpedienteTab = "resumen" | "datosGenerales" | "pasajeros" | "servicios" | "administracion";
  const [activeExpedienteTab, setActiveExpedienteTab] = useState<ExpedienteTab>("resumen");
  const [cartPasajeros, setCartPasajeros] = useState<ReservationPassenger[]>([]);

  // Search & Filters (Level 1)
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Todas");
  const [sortBy, setSortBy] = useState<"ultimas" | "checkin">("ultimas");

  // --- VISOR DE COMPROBANTE MODAL STATES ---
  const [showProvReceiptModal, setShowProvReceiptModal] = useState(false);
  const [selectedObligationForReceipt, setSelectedObligationForReceipt] = useState<PayableObligation | null>(null);
  const [showClientReceiptModal, setShowClientReceiptModal] = useState(false);
  const [selectedVoucherForReceipt, setSelectedVoucherForReceipt] = useState<PaymentVoucher | null>(null);

  // Fallback a `agenciaName` solo por si quedan reservas históricas creadas antes de que
  // `canalVenta` existiera como columna en el esquema.
  const isCanalDirecto = (r: Pick<Reservation, "canalVenta" | "agenciaName">) =>
    (r.canalVenta || (!r.agenciaName ? "Directo" : "B2B")) === "Directo";

  // --- HELPERS TO RESOLVE PAYMENT STATUSES ---
  const getClientPaymentStatus = (resId: string) => {
    const resInvoices = (invoices || []).filter(inv => inv.clientName.includes(`Localizador ${resId}`) && inv.type === "Cobro");
    if (resInvoices.length === 0) return { status: "Sin Facturar", color: "text-zinc-550 bg-zinc-50 border-zinc-200" };
    const allPaid = resInvoices.every(inv => inv.status === "Pagado");
    const anyPaid = resInvoices.some(inv => inv.status === "Pagado");
    if (allPaid) return { status: "Cobrado Total", color: "text-emerald-700 bg-emerald-50 border-emerald-250 font-extrabold" };
    if (anyPaid) return { status: "Cobrado Parcial", color: "text-blue-700 bg-blue-50 border-blue-200 font-bold" };
    return { status: "Pendiente Cobro", color: "text-amber-700 bg-amber-50 border-amber-250 font-bold" };
  };

  const getProviderPaymentStatus = (resId: string) => {
    const obligation = (payableObligations || []).find(o => o.locatorId === resId);
    if (!obligation) return { status: "No Emitido", color: "text-zinc-550 bg-zinc-50 border-zinc-200", obligation: null };
    if (obligation.status === "Pagado Total") {
      return { status: "Pagado", color: "text-emerald-700 bg-emerald-50 border-emerald-250 font-extrabold", obligation };
    }
    if (obligation.status === "Pagado Parcial") {
      return { status: "Abono Parcial", color: "text-blue-700 bg-blue-50 border-blue-200 font-bold", obligation };
    }
    if (obligation.status === "Vencido") {
      return { status: "Vencido", color: "text-red-750 bg-red-50 border-red-200 font-black animate-pulse", obligation };
    }
    return { status: "Pendiente Pago", color: "text-amber-700 bg-amber-50 border-amber-250 font-bold", obligation };
  };

  // --- SEND TO BILLING MODAL STATES ---
  const [showSendBillingModal, setShowSendBillingModal] = useState(false);
  const [billingMetodo, setBillingMetodo] = useState("Transferencia Bancaria");
  const [billingRef, setBillingRef] = useState("");
  const [billingMonto, setBillingMonto] = useState("");
  const [billingFile, setBillingFile] = useState("");
  const [billingFacturacionTipo, setBillingFacturacionTipo] = useState<"Crédito" | "Pago Contado">("Pago Contado");
  const [billingModalError, setBillingModalError] = useState("");

  // --- CART BUILDER STATES (Level 3) ---
  const [cartId, setCartId] = useState("");
  const [cartCheckIn, setCartCheckIn] = useState("");
  const [cartCheckOut, setCartCheckOut] = useState("");
  const [cartHolder, setCartHolder] = useState("");
  const [cartMercado, setCartMercado] = useState<"NACIONAL" | "INTERNACIONAL">("NACIONAL");
  const [cartAgencia, setCartAgencia] = useState("Viajes El Corte Inglés S.A.");
  const [cartTelefono, setCartTelefono] = useState("");
  const [cartEmail, setCartEmail] = useState("");
  const [cartSpecialRequests, setCartSpecialRequests] = useState("");
  const [cartFlightNo, setCartFlightNo] = useState("");
  const [cartServices, setCartServices] = useState<ServiceItem[]>([]);
  const [cartTipo, setCartTipo] = useState<"Cotización" | "Reserva Real">("Cotización");
  const [cartCanalVenta, setCartCanalVenta] = useState<"B2B" | "Directo">("B2B");
  const [cartLocalizadorProveedor, setCartLocalizadorProveedor] = useState("");
  // Cliente Directo: no hay agencia B2B de por medio, así que la Comisión B2B por defecto es 0%
  // (el cliente paga el PVP completo) en vez del 10% que se asume para una venta B2B.
  const getDefaultComisionB2B = () => cartCanalVenta === "Directo" ? 0 : 10;

  // ── Estado de vinculación con Módulo de Vuelos ─────────────────────────────
  // Multiple linked flights
  const [cartLinkedFlights, setCartLinkedFlights] = useState<{id: string, facturarConjunto: boolean}[]>([]);
  /** Controla apertura del drawer de búsqueda de boletos */
  const [showBoletoDrawer, setShowBoletoDrawer] = useState(false);
  /** Query de búsqueda dentro del drawer */
  const [boletoSearch, setBoletoSearch] = useState("");

  // --- B2B Agency Combobox States ---
  const [agencySearch, setAgencySearch] = useState("");
  const [showAgencyDropdown, setShowAgencyDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState<B2BClient | null>(null);

  // --- Direct Client Combobox States ---
  const [directClientSearch, setDirectClientSearch] = useState("");
  const [showDirectClientDropdown, setShowDirectClientDropdown] = useState(false);
  const [selectedDirectClient, setSelectedDirectClient] = useState<DirectClient | null>(null);
  const [cartClienteDirectoId, setCartClienteDirectoId] = useState("");
  const [showNewDirectClientModal, setShowNewDirectClientModal] = useState(false);
  const [newDirectClientForm, setNewDirectClientForm] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    email: "",
    tipo: DirectClientTipo.CONTADO as DirectClientTipo
  });

  // Al seleccionar (o crear) un cliente directo, alimenta Teléfono/Email de la reserva con los
  // datos ya guardados del cliente, para no tener que volver a tipearlos. "N/A" es el valor
  // centinela que se guarda cuando el cliente se registró sin esos datos — no sobrescribe con eso.
  const applyDirectClientContact = (client: DirectClient) => {
    if (client.telefono && client.telefono !== "N/A") setCartTelefono(client.telefono);
    if (client.email && client.email !== "N/A") setCartEmail(client.email);
  };

  // --- EDIT MODES ---
  const [isEditingReservationId, setIsEditingReservationId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  // --- B2B MODAL VIEW ---
  const [showB2BModal, setShowB2BModal] = useState<boolean>(false);
  const [showVoucherModal, setShowVoucherModal] = useState<boolean>(false);

  // --- SERVICE FORM STATES (Level 4) ---
  const [activeServiceType, setActiveServiceType] = useState<ServiceType | null>(null);
  
  // Lodging states
  const [hotelId, setHotelId] = useState("");
  const [roomDescription, setRoomDescription] = useState("Habitación Standard Doble");
  const [checkInDate, setCheckInDate] = useState("2026-06-20");
  const [checkOutDate, setCheckOutDate] = useState("2026-06-27");
  const [paxCount, setPaxCount] = useState(2);

  // --- DETAILED LODGING (ALOJAMIENTO) STATES ---
  const [selectedRatePlanId, setSelectedRatePlanId] = useState("");
  const [lodgingRooms, setLodgingRooms] = useState<{
    id: string;
    roomTypeId: string;
    adultsCount: number;
    guests: { name: string; type: "Adulto" | "Niño"; passengerId?: string }[];
  }[]>([]);
  const [comisionB2B, setComisionB2B] = useState(10);
  const [comisionPropia, setComisionPropia] = useState(5);
  const [hotelSearchQuery, setHotelSearchQuery] = useState("");
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);
  const [selectedPromoName, setSelectedPromoName] = useState("");

  // Auto-selecciona el plan de tarifa vigente para la fecha de check-in apenas se conocen
  // hotel/fechas/mercado, en vez de forzar al usuario a elegirlo manualmente. Si la estadía
  // cruza más de una temporada, calculateTotalPvpLodgingPrice ya reparte el costo por tramos
  // de noches sin depender de esta selección — esto solo define la tarifa "principal" que se
  // muestra y que filtra los tipos de habitación disponibles.
  React.useEffect(() => {
    if (!hotelId || !checkInDate || !cartMercado) return;
    const defaultRoomTypeId = lodgingRooms[0]?.roomTypeId || roomTypes.find(rt => rt.property_id === hotelId)?.id;
    if (!defaultRoomTypeId) return;
    const match = ratePlans.find(rp =>
      rp.property_id === hotelId &&
      rp.roomType_id === defaultRoomTypeId &&
      rp.mercado === cartMercado &&
      checkInDate >= rp.fechaInicio &&
      checkInDate < rp.fechaFin
    );
    if (match && match.id !== selectedRatePlanId) {
      setSelectedPromoName(match.nombrePromocion);
      setSelectedRatePlanId(match.id);
    }
  }, [hotelId, checkInDate, cartMercado, ratePlans, roomTypes]);

  // Propaga la estructura de comisión configurada en el hotel (Property.comisionBruta) y en
  // el plan de tarifa seleccionado (RatePlan.comisionCedidaB2B) a los campos de comisión del
  // expediente — mismo mecanismo ya usado para Traslado/Servicio Vario (ver ServiceRate). Se
  // usa solo el plan "principal" (selectedRatePlanId) aunque la estadía cruce temporadas
  // (tarifa mixta), igual que ya hace el auto-select de arriba; queda editable a mano para
  // ajustes de último momento. Hoteles/planes sin comisión configurada no tocan los campos,
  // para no pisar la entrada manual existente.
  React.useEffect(() => {
    if (activeServiceType !== ServiceType.ALOJAMIENTO) return;
    const property = detailedProperties.find(p => p.id === hotelId);
    if (!property || property.comisionBruta === undefined) return;
    const plan = ratePlans.find(rp => rp.id === selectedRatePlanId);
    if (cartCanalVenta === "Directo") {
      setComisionB2B(0);
      setComisionPropia(property.comisionBruta);
    } else {
      const cedida = plan?.comisionCedidaB2B ?? property.comisionBruta;
      setComisionB2B(cedida);
      setComisionPropia(Math.max(0, property.comisionBruta - cedida));
    }
  }, [hotelId, selectedRatePlanId, cartCanalVenta, activeServiceType, detailedProperties, ratePlans]);

  // Aviso no bloqueante: si el hotel + rango de fechas elegido se solapa con un Stop Sale
  // vigente, se avisa UNA sola vez por combinación (el vendedor puede seguir igual, a veces
  // el hotel libera cupo pese al cierre nominal). El ref evita repetir el aviso en cada
  // render mientras la combinación hotel+fechas no cambie a una nueva que también solape.
  const lastWarnedStopSaleKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!hotelId || !checkInDate || !checkOutDate) return;
    const key = `${hotelId}|${checkInDate}|${checkOutDate}`;
    if (lastWarnedStopSaleKeyRef.current === key) return;

    // Recorre cada noche de la estadía y marca si esa fecha puntual cae dentro de algún
    // Stop Sale del hotel, para mostrar la secuencia día por día (verde = libre, rojo =
    // con cierre) en vez de un aviso genérico de "hay solape".
    const nightDays: { day: number; iso: string; blocked: boolean }[] = [];
    let cursor = new Date(checkInDate);
    const end = new Date(checkOutDate);
    while (cursor < end) {
      const iso = cursor.toISOString().split("T")[0];
      const blocked = stopSales.some(s => s.property_id === hotelId && iso >= s.fechaInicio && iso <= s.fechaFin);
      nightDays.push({ day: cursor.getUTCDate(), iso, blocked });
      cursor = new Date(cursor.getTime() + 86400000);
    }

    if (nightDays.some(d => d.blocked)) {
      lastWarnedStopSaleKeyRef.current = key;
      showAlert({
        title: "Stop Sale Registrado",
        message: (
          <div className="space-y-2.5">
            <p>El hotel seleccionado tiene un Stop Sale (cierre de ventas) vigente que se solapa con las fechas elegidas. Puede continuar si el hotel confirma disponibilidad igualmente.</p>
            <div className="flex flex-wrap gap-1.5">
              {nightDays.map(d => (
                <span
                  key={d.iso}
                  title={d.iso}
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold border ${
                    d.blocked
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-emerald-100 text-emerald-700 border-emerald-300"
                  }`}
                >
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        ),
        type: "warning"
      });
    }
  }, [hotelId, checkInDate, checkOutDate, stopSales]);

  // Transfer states
  const [transPickup, setTransPickup] = useState("");
  const [transDropoff, setTransDropoff] = useState("");
  const [transDate, setTransDate] = useState("2026-06-20");
  const [transTime, setTransTime] = useState("14:00");
  const [transVehicle, setTransVehicle] = useState("Berlina Ejecutiva");
  const [transTripType, setTransTripType] = useState<"one-way" | "round-trip">("one-way");
  const [transReturnDropoff, setTransReturnDropoff] = useState("");
  const [transReturnDate, setTransReturnDate] = useState("2026-06-27");
  const [transReturnTime, setTransReturnTime] = useState("14:00");
  const [transServiceType, setTransServiceType] = useState<"privado" | "compartido">("privado");
  const [transPax, setTransPax] = useState(2);
  const [transSupplier, setTransSupplier] = useState("");
  // Marca si este traslado (cuando no viene de un servicio del catálogo, que ya implica un
  // proveedor tercero) lo opera la propia agencia — con el catálogo el proveedor se asume
  // tercero automáticamente; sin catálogo, este checkbox es la única forma de marcarlo como
  // propio, evitando que el nombre de la agencia se tenga que escribir a mano.
  const [transEsPropio, setTransEsPropio] = useState(false);

  // Car Rental states
  const [carCategory, setCarCategory] = useState("Compacto Automático");
  const [carSupplier, setCarSupplier] = useState("Hertz Rent A Car");
  const [carStartDate, setCarStartDate] = useState("");
  const [carEndDate, setCarEndDate] = useState("");
  const [carDays, setCarDays] = useState(7);

  // Travel Insurance states
  const [insPlan, setInsPlan] = useState("Plan Cobertura Total Europa");
  const [insStartDate, setInsStartDate] = useState("");
  const [insEndDate, setInsEndDate] = useState("");
  const [insDays, setInsDays] = useState(7);
  const [insPax, setInsPax] = useState(1);
  const [insSupplier, setInsSupplier] = useState("Asistencia Global Travel");

  // Manual Entry states
  const [manualDescription, setManualDescription] = useState("");
  const [manualSupplier, setManualSupplier] = useState("");

  // Servicio Vario states
  const [svExtraServiceId, setSvExtraServiceId] = useState("");
  const [svRateId, setSvRateId] = useState("");
  const [svAdults, setSvAdults] = useState(1);
  const [svChildren, setSvChildren] = useState(0);
  const [svVehicles, setSvVehicles] = useState(1);

  // Auto-selecciona la tarifa de Servicio Vario vigente para la fecha de check-in del
  // expediente (cartCheckIn), en vez de forzar al vendedor a elegirla manualmente — mismo
  // criterio que ya se usa para el plan de tarifa de Alojamiento.
  React.useEffect(() => {
    if (activeServiceType !== ServiceType.SERVICIO_VARIO) return;
    if (!svExtraServiceId || !cartCheckIn) return;
    const match = (serviceRates || []).find(r =>
      r.extraServiceId === svExtraServiceId &&
      cartCheckIn >= r.temporadaInicio &&
      cartCheckIn <= r.temporadaFin
    );
    if (match && match.id !== svRateId) {
      setSvRateId(match.id);
      if (match.pricingModel === "Por Persona") {
        setSalePrice((((match.ventaAdulto || 0) * svAdults) + ((match.ventaNino || 0) * svChildren)).toFixed(2));
        setNetPrice((((match.netoAdulto || 0) * svAdults) + ((match.netoNino || 0) * svChildren)).toFixed(2));
      } else {
        setSalePrice(((match.ventaTotal || 0) * svVehicles).toFixed(2));
        setNetPrice(((match.netoTotal || 0) * svVehicles).toFixed(2));
      }
    }
  }, [activeServiceType, svExtraServiceId, cartCheckIn, serviceRates]);

  // Propaga la estructura de comisión configurada en la tarifa (ServiceRate.comisionBruta /
  // comisionCedidaB2B) a los campos de comisión del expediente, en vez de que el vendedor la
  // tipee a mano cada vez — se dispara al seleccionar/cambiar de tarifa (manual o auto-elegida
  // arriba) o al cambiar el canal de venta. Tarifas antiguas sin comisión configurada
  // (comisionBruta === undefined) no tocan los campos, para no pisar la entrada manual existente.
  // Sin agencia B2B intermediaria (Cliente Directo), la comisión bruta completa queda para la
  // propia agencia.
  React.useEffect(() => {
    if (activeServiceType !== ServiceType.SERVICIO_VARIO && activeServiceType !== ServiceType.TRASLADO) return;
    const rate = (serviceRates || []).find(r => r.id === svRateId);
    if (!rate || rate.comisionBruta === undefined) return;
    if (cartCanalVenta === "Directo") {
      setComisionB2B(0);
      setComisionPropia(rate.comisionBruta);
    } else {
      const cedida = rate.comisionCedidaB2B ?? rate.comisionBruta;
      setComisionB2B(cedida);
      setComisionPropia(Math.max(0, rate.comisionBruta - cedida));
    }
  }, [svRateId, cartCanalVenta, activeServiceType, serviceRates]);

  // Common Pricing states for Level 4
  const [netPrice, setNetPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");

  const [submitSuccess, setSubmitSuccess] = useState("");

  const activeRes = reservations.find(r => r.id === selectedResId);

  // Modo derivado del expediente unificado: sin reserva activa = creando una nueva;
  // con reserva activa + edición en curso = editando; si no, solo viendo (solo lectura).
  const expedienteMode: "create" | "view" | "edit" =
    !activeRes ? "create" : (isEditingReservationId ? "edit" : "view");

  // Lista de pasajeros "efectiva" a mostrar: el borrador en memoria mientras se crea/edita,
  // o (para reservas ya guardadas que aún no tienen `pasajeros` persistido) una lista
  // reconstruida al vuelo a partir del titular + huéspedes de Alojamiento ya cargados.
  const effectivePasajeros: ReservationPassenger[] = expedienteMode !== "view"
    ? cartPasajeros
    : derivePassengersFromLegacyReservation(activeRes);

  const handleAutofillTransfer = () => {
    // Buscar vuelo vinculado (priorizar el seleccionado en el carrito, luego el de la base de datos)
    let linkedFlight = cartLinkedFlights.length > 0 
      ? boletos.find(b => b.id === cartLinkedFlights[0].id)
      : (activeRes ? boletos.find(b => b.expedienteId === activeRes.id) : undefined);

    // Si no se vinculó con el botón, pero el agente escribió el PNR en "Vuelo Asociado"
    if (!linkedFlight && cartFlightNo) {
      const cleanFlightNo = cartFlightNo.trim().toUpperCase();
      linkedFlight = boletos.find(b => b.pnr.toUpperCase() === cleanFlightNo || b.id === cleanFlightNo);
    }

    let origin = "";
    let firstArrTime = "14:00";
    let lastDepTime = "14:00";

    if (linkedFlight?.segmentos && linkedFlight.segmentos.length > 0) {
      const firstSegment = linkedFlight.segmentos[0];
      const lastSegment = linkedFlight.segmentos[linkedFlight.segmentos.length - 1];
      
      origin = `Aeropuerto ${firstSegment.destino || ""}`;
      
      // La hora de pick-up del traslado de ida es la llegada del vuelo
      if (firstSegment.horaLlegada) {
        const cleanTime = firstSegment.horaLlegada.slice(0, 5);
        firstArrTime = cleanTime.includes(':') 
          ? cleanTime 
          : `${cleanTime.slice(0, 2)}:${cleanTime.slice(2, 4)}`;
      }
      
      // La hora de pick-up del retorno (si hay) es la salida del vuelo de vuelta
      if (lastSegment.horaSalida) {
        const cleanTime = lastSegment.horaSalida.slice(0, 5);
        lastDepTime = cleanTime.includes(':')
          ? cleanTime
          : `${cleanTime.slice(0, 2)}:${cleanTime.slice(2, 4)}`;
      }
    } else if (cartFlightNo || activeRes?.flightNo) {
      origin = `Llegadas Aeropuerto (Vuelo ${cartFlightNo || activeRes?.flightNo})`;
    } else {
      origin = "Aeropuerto Internacional";
    }

    // Buscar hotel reservado en los servicios (priorizar carrito sobre expediente activo)
    const currentServices = cartServices.length > 0 ? cartServices : (activeRes?.servicios || []);
    const hotelService = currentServices.find(s => s.tipo === ServiceType.ALOJAMIENTO);
    let destination = activeRes?.hotelName || "Hotel del cliente";
    
    // Priorizar si el agente acaba de llenar el formulario de Alojamiento pero no lo ha guardado al carrito
    if (hotelId) {
      const h = detailedProperties.find(p => p.id === hotelId);
      if (h) destination = h.nombre;
    } else if (hotelSearchQuery) {
      destination = hotelSearchQuery;
    } else if (hotelService?.detalles?.hotelId) {
      const h = detailedProperties.find(p => p.id === hotelService.detalles.hotelId);
      if (h) destination = h.nombre;
    } else if (hotelService) {
      destination = hotelService.descripcion.split(" (")[0]?.replace("Hotel: ", "") || destination;
    }

    setTransPickup(origin);
    setTransDropoff(destination);
    setTransTime(firstArrTime);
    
    // Auto-detect round trip if we have a flight and we found a lastDepTime
    const isProbablyRoundTrip = linkedFlight?.segmentos && linkedFlight.segmentos.length > 1;
    if (transTripType === "round-trip" || isProbablyRoundTrip) {
      if (isProbablyRoundTrip && transTripType !== "round-trip") {
        setTransTripType("round-trip");
      }
      setTransReturnDropoff(origin); // Return is usually from hotel to airport
      setTransReturnTime(lastDepTime);
    }
    
    // Auto-fill date if hotel exists
    if (hotelService?.detalles?.checkInDate) {
      setTransDate(hotelService.detalles.checkInDate);
      if (hotelService.detalles.checkOutDate) {
        setTransReturnDate(hotelService.detalles.checkOutDate);
      }
    } else if (checkInDate) {
      setTransDate(checkInDate);
      setTransReturnDate(checkOutDate);
    }
  };

  const handleOpenSendBillingModal = () => {
    if (!activeRes) return;
    const saleClient = resolveSaleClient(activeRes, clients, directClients);
    setBillingFacturacionTipo(isCreditEligible(saleClient) ? "Crédito" : "Pago Contado");

    setBillingRef("");
    setBillingMetodo("Transferencia Bancaria");
    
    const services = activeRes.servicios || [];
    const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto);
    const unsentServices = services.filter(s => s.statusFacturacion === "Borrador" || s.statusFacturacion === "Rechazado" || s.statusFacturacion === undefined);
    const unsentFlights = jointFlights.filter(b => !b.expedienteAereo || b.expedienteAereo.status === "Borrador" || b.expedienteAereo.status === undefined);
    const unsentAdjustments = (activeRes.variaciones || []).filter(v => (v.type === "Suplemento" || v.type === "Credito") && v.status === "Borrador" && !v.invoiceId);
    const pendingTotal = unsentServices.reduce((sum, s) => sum + s.precioVenta, 0) + unsentFlights.reduce((sum, b) => sum + b.precioVenta, 0)
      + unsentAdjustments.reduce((sum, v) => sum + v.amountSale, 0);
    setBillingMonto(pendingTotal.toString());
    setBillingModalError("");
    setShowSendBillingModal(true);
  };

  const handleConfirmSendBilling = () => {
    if (!activeRes) return;
    
    if (billingFacturacionTipo === "Pago Contado" && !billingRef.trim()) {
      setBillingModalError("Por favor ingrese el número de referencia del comprobante de pago.");
      return;
    }

    const services = activeRes.servicios || [];
    const updatedServices = services.map(s => {
      if (s.statusFacturacion === "Borrador" || s.statusFacturacion === "Rechazado" || s.statusFacturacion === undefined) {
        return { ...s, statusFacturacion: "Solicitado" as const };
      }
      return s;
    });

    const updatedVariations = (activeRes.variaciones || []).map(v => {
      if ((v.type === "Suplemento" || v.type === "Credito") && v.status === "Borrador" && !v.invoiceId) {
        return { ...v, status: "Solicitado" as const };
      }
      return v;
    });

    const updatedRes: Reservation = {
      ...activeRes,
      tipo: "Reserva Real",
      // Al enviar a Facturación el expediente deja de ser una simple cotización (status
      // "Pendiente") y pasa a Confirmada — salvo que ya estuviera Cancelada, caso en el que
      // no tiene sentido reactivarla solo por facturar un ajuste.
      status: activeRes.status === "Cancelada" ? activeRes.status : "Confirmada",
      servicios: updatedServices,
      variaciones: updatedVariations,
      facturacionTipo: billingFacturacionTipo,
      comprobanteRef: billingFacturacionTipo === "Pago Contado" ? billingRef.trim() : undefined,
      comprobanteMonto: billingFacturacionTipo === "Pago Contado" ? (parseFloat(billingMonto) || 0) : undefined,
      comprobanteMetodo: billingFacturacionTipo === "Pago Contado" ? billingMetodo : undefined,
      comprobanteArchivo: billingFacturacionTipo === "Pago Contado" ? billingFile : undefined,
      facturacionRechazoMotivo: "",
      facturacionRechazoArchivos: "",
      __billingOnly: true
    } as any;

    if (onUpdateBoleto) {
      boletos?.forEach(b => {
        if (b.expedienteId === activeRes.id && b.facturarConjunto && (!b.expedienteAereo || b.expedienteAereo.status === "Borrador" || b.expedienteAereo.status === undefined)) {
          const updatedB = {
            ...b,
            expedienteAereo: b.expedienteAereo
              ? { ...b.expedienteAereo, status: "Solicitado" as const }
              : {
                  id: `EXP-AER-${b.id}`,
                  status: "Solicitado" as const,
                  titular: b.pasajeros?.[0]?.nombre || "Pasajero",
                  createdAt: new Date().toISOString()
                }
          };
          onUpdateBoleto(updatedB);
        }
      });
    }

    if (onUpdateReservation) {
      onUpdateReservation(updatedRes);
    }

    setShowSendBillingModal(false);
    setSubmitSuccess("✓ Solicitud de facturación enviada exitosamente al Dpto. de Facturación.");
    setTimeout(() => setSubmitSuccess(""), 4000);
  };

  // KPI Calculations (Level 1)
  const totalRes = reservations.length;
  const totalConfirmadas = reservations.filter(r => r.status === "Confirmada").length;
  const totalPendientes = reservations.filter(r => r.status === "Pendiente" || r.status === "Pendiente de Pago" || r.status === "Petición Especial" || r.status === "Modificada").length;
  const totalCanceladas = reservations.filter(r => r.status === "Cancelada").length;

  const [activeTab, setActiveTab] = useState<"Activos" | "Canceladas">("Activos");

  // Filter and Sort (Level 1)
  const filteredAndSorted = reservations
    .filter((r) => {
      const isCancelada = r.status === "Cancelada";
      if (activeTab === "Activos" && isCancelada) return false;
      if (activeTab === "Canceladas" && !isCancelada) return false;

      const matchesSearch = 
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.holder.toLowerCase().includes(search.toLowerCase()) ||
        r.hotelName.toLowerCase().includes(search.toLowerCase()) ||
        (r.telefono || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.agenciaName || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.flightNo || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.localizadorProveedor || "").toLowerCase().includes(search.toLowerCase());
      
      let matchesStatus = false;
      if (filterStatus === "Todas") {
        matchesStatus = true;
      } else if (filterStatus === "Pendientes") {
        matchesStatus = r.status === "Pendiente" || r.status === "Pendiente de Pago" || r.status === "Petición Especial" || r.status === "Modificada";
      } else if (filterStatus === "Rechazadas") {
        matchesStatus = !!r.facturacionRechazoMotivo || !!(r.servicios && r.servicios.some(s => s.statusFacturacion === "Rechazado"));
      } else {
        matchesStatus = r.status === filterStatus;
      }

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "ultimas") {
        const dateA = a.createdAt || "";
        const dateB = b.createdAt || "";
        if (dateB !== dateA) return dateB.localeCompare(dateA);
        return b.id.localeCompare(a.id);
      } else {
        const checkA = a.checkIn || "";
        const checkB = b.checkIn || "";
        return checkA.localeCompare(checkB);
      }
    });

  // Init cart and navigate to Level 3
  const handleStartNewExpediente = () => {
    setCartId(nextSequentialId("RES", reservations.map(r => r.id)));
    setCartHolder("");
    setCartCheckIn("");
    setCartCheckOut("");
    setCartMercado("NACIONAL");
    
    setCartAgencia("");
    setAgencySearch("");
    setSelectedClient(null);
    setCartClienteDirectoId("");
    setDirectClientSearch("");
    setSelectedDirectClient(null);
    setCartTelefono("");
    setCartEmail("");
    setCartTipo("Cotización");
    setCartCanalVenta("B2B");
    setCartLocalizadorProveedor("");

    setCartSpecialRequests("");
    setCartFlightNo("");
    setCartServices([]);
    setCartPasajeros([]);
    setComisionB2B(10);
    setComisionPropia(5);
    setSelectedResId(null);
    setIsEditingReservationId(null);
    setActiveExpedienteTab("datosGenerales");
    setViewLevel(2);
  };

  // Navigate to Level 4 to add service
  const handleOpenAddService = (type: ServiceType) => {
    setActiveServiceType(type);
    
    // Set some smart defaults
    setNetPrice("");
    setSalePrice("");
    setManualDescription("");
    setManualSupplier("");
    setTransPickup("");
    setTransDropoff("");
    
    if (type === ServiceType.ALOJAMIENTO) {
      setCheckInDate(cartCheckIn || "2026-06-20");
      setCheckOutDate(cartCheckOut || "2026-06-27");

      setHotelId("");
      setHotelSearchQuery("");
      setSelectedPromoName("");
      setSelectedRatePlanId("");

      setLodgingRooms([{ 
        id: `rm-${Date.now()}-1`, 
        roomTypeId: "", 
        adultsCount: 2, 
        guests: [
          { name: cartHolder || "", type: "Adulto" },
          { name: "", type: "Adulto" }
        ] 
      }]);
      setComisionB2B(getDefaultComisionB2B());
      setComisionPropia(5);
    } else if (type === ServiceType.TRASLADO) {
      setTransDate(cartCheckIn || "2026-06-20");
      setTransTripType("one-way");
      setTransReturnDropoff("");
      setTransReturnDate(cartCheckOut || "2026-06-27");
      setTransServiceType("privado");
      setTransPax(paxCount || 2);
      setSvExtraServiceId("");
      setTransEsPropio(false);
      setTransSupplier("");
      setComisionB2B(getDefaultComisionB2B());
      setComisionPropia(5);
    } else if (type === ServiceType.RENT_A_CAR) {
      const start = cartCheckIn || "2026-06-20";
      const end = cartCheckOut || "2026-06-27";
      setCarStartDate(start);
      setCarEndDate(end);
      const s = new Date(start);
      const eDate = new Date(end);
      if (!isNaN(s.getTime()) && !isNaN(eDate.getTime())) {
        setCarDays(Math.max(1, Math.ceil((eDate.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))));
      } else {
        setCarDays(7);
      }
    } else if (type === ServiceType.SEGURO) {
      const start = cartCheckIn || "2026-06-20";
      const end = cartCheckOut || "2026-06-27";
      setInsStartDate(start);
      setInsEndDate(end);
      setInsPlan("");
      const s = new Date(start);
      const eDate = new Date(end);
      if (!isNaN(s.getTime()) && !isNaN(eDate.getTime())) {
        setInsDays(Math.max(1, Math.ceil((eDate.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))));
      } else {
        setInsDays(7);
      }
      setInsPax(paxCount || 1);
      setComisionB2B(getDefaultComisionB2B());
      setComisionPropia(5);
    } else if (type === ServiceType.SERVICIO_VARIO) {
      setSvExtraServiceId("");
      setSvRateId("");
      setSvAdults(1);
      setSvChildren(0);
      setSvVehicles(1);
    }

    setViewLevel(3);
  };

  const getStayNights = () => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Tramos de tarifa por habitación para la estadía actual — una habitación puede cruzar más
  // de una temporada (ej. 3 noches Temporada Alta + 4 noches Temporada Baja).
  const getRoomSegments = (room: { roomTypeId: string }) =>
    getRateSegments(hotelId, room.roomTypeId, cartMercado, checkInDate, checkOutDate, ratePlans);

  // Etiqueta de tarifa para un servicio de alojamiento ya guardado (resumen de carrito, PDF de
  // cotización): recalcula los tramos a partir de sus `detalles` guardados, para que también
  // se vea el desglose de tarifa mixta al reabrir/compartir un expediente ya existente.
  const formatTarifaLabel = (detalles: any, roomTypeId: string, mercado: "NACIONAL" | "INTERNACIONAL") => {
    const segments = getRateSegments(detalles.hotelId, roomTypeId, mercado, detalles.checkInDate, detalles.checkOutDate, ratePlans);
    if (segments.length === 0) return detalles.selectedPromoName || "Tarifa Directa";
    if (segments.length === 1) return segments[0].ratePlan.nombrePromocion;
    return segments.map(s => `${s.nights}n ${s.ratePlan.nombrePromocion}`).join(" + ");
  };

  const calculateTotalPvpLodgingPrice = () => {
    let totalPvp = 0;
    lodgingRooms.forEach(room => {
      totalPvp += calculateRoomPvpBySegments(room, getRoomSegments(room), roomTypes);
    });
    return totalPvp;
  };

  const calculateTotalNetLodgingPrice = () => {
    const pvp = calculateTotalPvpLodgingPrice();
    return Math.round(pvp * (1 - (comisionB2B + comisionPropia) / 100) * 100) / 100;
  };

  const calculateTotalSaleLodgingPrice = () => {
    const pvp = calculateTotalPvpLodgingPrice();
    return Math.round(pvp * (1 - comisionB2B / 100) * 100) / 100;
  };

  const handleAddRoom = () => {
    // Get room types active in this promo
    const promoPlans = ratePlans.filter(rp => 
      rp.property_id === hotelId && 
      rp.mercado === cartMercado && 
      rp.nombrePromocion === selectedPromoName
    );
    const promoRoomTypes = roomTypes.filter(rt => 
      promoPlans.some(rp => rp.roomType_id === rt.id)
    );
    const fallbackRoomTypes = roomTypes.filter(rt => rt.property_id === hotelId);
    const activeRoomTypes = promoRoomTypes.length > 0 ? promoRoomTypes : fallbackRoomTypes;
    const defaultRoomTypeId = activeRoomTypes[0]?.id || "";

    setLodgingRooms(prev => [
      ...prev,
      { 
        id: `rm-${Date.now()}-${prev.length + 1}`, 
        roomTypeId: defaultRoomTypeId, 
        adultsCount: 2, 
        guests: [
          { name: "", type: "Adulto" },
          { name: "", type: "Adulto" }
        ] 
      }
    ]);
  };

  const handleRoomTypeChange = (roomId: string, rtId: string) => {
    setLodgingRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      return { ...room, roomTypeId: rtId };
    }));
  };

  const handleRoomPaxChange = (roomId: string, count: number) => {
    const val = Math.max(1, count);
    setLodgingRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      const currentGuests = [...room.guests];
      const newGuests = Array.from({ length: val }, (_, i) => currentGuests[i] || { name: "", type: "Adulto" as "Adulto" | "Niño" });
      return { ...room, adultsCount: val, guests: newGuests };
    }));
  };

  const handleRoomGuestNameChange = (roomId: string, guestIndex: number, name: string) => {
    setLodgingRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      const updatedGuests = [...room.guests];
      updatedGuests[guestIndex] = { ...updatedGuests[guestIndex], name };
      return { ...room, guests: updatedGuests };
    }));
  };

  // Asigna un pasajero de la lista de la reserva (pestaña Pasajeros) a un huésped de la habitación
  const handleRoomGuestAssign = (roomId: string, guestIndex: number, passengerId: string) => {
    const p = cartPasajeros.find(x => x.id === passengerId);
    if (!p) return;
    setLodgingRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      const updatedGuests = [...room.guests];
      const current = updatedGuests[guestIndex];
      const suggestedType: "Adulto" | "Niño" = p.tipo === "Adulto" ? "Adulto" : "Niño";
      updatedGuests[guestIndex] = {
        ...current,
        name: p.nombre,
        passengerId: p.id,
        // Solo sugiere el tipo si el huésped no tenía uno asignado manualmente antes
        type: current?.name ? current.type : suggestedType,
      };
      return { ...room, guests: updatedGuests };
    }));
  };

  const handleRoomGuestTypeChange = (roomId: string, guestIndex: number, type: "Adulto" | "Niño") => {
    setLodgingRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      const updatedGuests = [...room.guests];
      updatedGuests[guestIndex] = { ...updatedGuests[guestIndex], type };
      return { ...room, guests: updatedGuests };
    }));
  };

  const handleRemoveRoom = (roomId: string) => {
    if (lodgingRooms.length === 1) {
      showAlert({ title: "Atención", message: "Debe incluir al menos 1 habitación para el alojamiento.", type: "warning" });
      return;
    }
    setLodgingRooms(prev => prev.filter(r => r.id !== roomId));
  };

  // Add configured service item to cart and return to Level 3
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeServiceType) return;

    if (activeServiceType === ServiceType.ALOJAMIENTO) {
      if (!checkInDate || !checkOutDate) {
        showAlert({ title: "Atención", message: "Por favor seleccione las fechas de check-in y check-out.", type: "warning" });
        return;
      }
      if (!hotelId) {
        showAlert({ title: "Atención", message: "Por favor seleccione un hotel.", type: "warning" });
        return;
      }
      if (!selectedRatePlanId) {
        showAlert({ title: "Atención", message: "Por favor seleccione un plan de tarifa.", type: "warning" });
        return;
      }
    }

    let desc = "";
    let nPrice = parseFloat(netPrice) || 0;
    let sPrice = parseFloat(salePrice) || 0;

    switch (activeServiceType) {
      case ServiceType.ALOJAMIENTO:
        const matchedHotel = detailedProperties.find(p => p.id === hotelId);
        const hotelName = matchedHotel ? matchedHotel.nombre : "Hotel Boutique";
        const ratePlan = ratePlans.find(rp => rp.id === selectedRatePlanId);
        const firstRoomSegments = lodgingRooms[0] ? getRoomSegments(lodgingRooms[0]) : [];
        const promoName = firstRoomSegments.length > 1
          ? firstRoomSegments.map(s => `${s.nights}n ${s.ratePlan.nombrePromocion}`).join(" + ")
          : (ratePlan ? ratePlan.nombrePromocion : "Tarifa Directa");
        const totalRooms = lodgingRooms.length;
        const totalPax = lodgingRooms.reduce((sum, r) => sum + r.adultsCount, 0);

        const roomsDesc = lodgingRooms.map((r, index) => {
          const guestStr = r.guests
            .map(g => `${g.name} (${g.type === "Adulto" ? "ADT" : "CHD"})`)
            .filter(str => str.replace(/\s*\([^)]+\)/g, "").trim() !== "")
            .join(", ");
          return `Hab ${index + 1}: [${guestStr || "Sin nombre asignado"}]`;
        }).join(" | ");

        desc = `Hotel: ${hotelName} (${roomsDesc}) - ${totalRooms} Hab / ${totalPax} Pax (Tarifa: ${promoName}) - IN: ${formatDate(checkInDate)} / OUT: ${formatDate(checkOutDate)}`;
        nPrice = calculateTotalNetLodgingPrice();
        sPrice = calculateTotalSaleLodgingPrice();
        break;
      case ServiceType.TRASLADO: {
        const pvpVal = parseFloat(salePrice) || 0;
        const b2bComVal = comisionB2B;
        const ownComVal = comisionPropia;
        sPrice = Math.round(pvpVal * (1 - b2bComVal / 100) * 100) / 100;
        nPrice = Math.round(pvpVal * (1 - (b2bComVal + ownComVal) / 100) * 100) / 100;

        const tripTypeLabel = transTripType === "one-way" ? "Sólo Ida" : "Ida y Vuelta";
        const serviceTypeLabel = transServiceType === "privado" ? "Privado" : "Compartido";
        const routeDesc = transTripType === "one-way"
          ? `${transPickup} ➔ ${transDropoff}`
          : `${transPickup} ➔ ${transDropoff} ➔ ${transReturnDropoff || transPickup} (Retorno: ${formatDate(transReturnDate)})`;

        const srv = extraServices?.find(s => s.id === svExtraServiceId);
        const providerText = srv ? srv.nombre : (transSupplier || "Local");
        desc = `(${tripTypeLabel} - ${serviceTypeLabel}): ${routeDesc} - ${transPax} Pax - Fecha: ${formatDate(transDate)} (${transVehicle}) - Op. ${providerText}`;
        break;
      }
      case ServiceType.RENT_A_CAR:
        desc = `${carCategory} con ${carSupplier} - Alquiler por ${carDays} días`;
        sPrice = (parseFloat(salePrice) || 0) * (1 - comisionB2B / 100);
        break;
      case ServiceType.SEGURO: {
        const pvpVal = (parseFloat(salePrice) || 0) * insPax;
        const b2bComVal = comisionB2B;
        const ownComVal = comisionPropia;
        sPrice = Math.round(pvpVal * (1 - b2bComVal / 100) * 100) / 100;
        nPrice = Math.round(pvpVal * (1 - (b2bComVal + ownComVal) / 100) * 100) / 100;
        desc = `${insPlan || "Plan Estándar"} - Cobertura por ${insDays} días (Vigencia: ${formatDate(insStartDate)} ➔ ${formatDate(insEndDate)}) - ${insPax} Pax`;
        break;
      }
      case ServiceType.MANUAL:
        desc = `${manualDescription} (Proveedor: ${manualSupplier || "Directo"})`;
        sPrice = (parseFloat(salePrice) || 0) * (1 - comisionB2B / 100);
        break;
      case ServiceType.SERVICIO_VARIO: {
        const srv = extraServices?.find(s => s.id === svExtraServiceId);
        const rate = serviceRates?.find(r => r.id === svRateId);
        if (srv && rate) {
          const pvpVal = parseFloat(salePrice) || 0;
          // Cobro B2B = PVP menos comisión B2B
          sPrice = Math.round(pvpVal * (1 - comisionB2B / 100) * 100) / 100;
          // Neto = costo fijo del proveedor según la tarifa (no se deriva del PVP)
          nPrice = parseFloat(netPrice) || 0;
          if (rate.pricingModel === "Por Persona") {
            desc = `${srv.nombre} - ${svAdults} Adultos, ${svChildren} Niños (Del ${rate.temporadaInicio} al ${rate.temporadaFin})`;
          } else {
            desc = `${srv.nombre} - ${svVehicles} Vehículo(s)/Grupo(s) (Del ${rate.temporadaInicio} al ${rate.temporadaFin})`;
          }
        }
        break;
      }
    }

    let det: any = {};
    if (activeServiceType === ServiceType.ALOJAMIENTO) {
      det = {
        hotelId,
        hotelSearchQuery,
        checkInDate,
        checkOutDate,
        selectedPromoName,
        selectedRatePlanId,
        lodgingRooms,
        comisionB2B,
        comisionPropia
      };
    } else if (activeServiceType === ServiceType.TRASLADO) {
      det = {
        transPickup,
        transDropoff,
        transDate,
        transTime,
        transVehicle,
        transTripType,
        transReturnDropoff,
        transReturnDate,
        transReturnTime,
        transServiceType,
        transPax,
        svExtraServiceId,
        // true solo si se marcó explícitamente como propio Y no viene de un servicio del
        // catálogo (el catálogo siempre implica un proveedor tercero, ver checkbox en el form).
        transEsPropio: !svExtraServiceId && transEsPropio,
        netPrice: nPrice,
        salePrice: salePrice,
        comisionB2B: comisionB2B,
        comisionPropia: comisionPropia
      };
    } else if (activeServiceType === ServiceType.RENT_A_CAR) {
      det = {
        carCategory,
        carSupplier,
        carStartDate,
        carEndDate,
        carDays,
        netPrice: netPrice,
        salePrice: salePrice,
        comisionB2B: comisionB2B
      };
    } else if (activeServiceType === ServiceType.SEGURO) {
      det = {
        insPlan,
        insStartDate,
        insEndDate,
        insDays,
        insPax,
        netPrice: nPrice,
        salePrice: salePrice,
        comisionB2B: comisionB2B,
        comisionPropia: comisionPropia
      };
    } else if (activeServiceType === ServiceType.MANUAL) {
      det = {
        manualDescription,
        manualSupplier,
        netPrice: netPrice,
        salePrice: salePrice,
        comisionB2B: comisionB2B
      };
    } else if (activeServiceType === ServiceType.SERVICIO_VARIO) {
      det = {
        svExtraServiceId,
        svRateId,
        svAdults,
        svChildren,
        svVehicles,
        pvp: parseFloat(salePrice) || 0,
        netPrice: nPrice,
        salePrice: sPrice,
        comisionB2B,
        comisionPropia
      };
    }

    const calculatedPvp = activeServiceType === ServiceType.ALOJAMIENTO 
      ? calculateTotalPvpLodgingPrice() 
      : activeServiceType === ServiceType.SEGURO
        ? (parseFloat(salePrice) || 0) * insPax
        : activeServiceType === ServiceType.SERVICIO_VARIO
          ? sPrice
          : (parseFloat(salePrice) || 0);

    if (editingServiceId) {
      setCartServices(prev => prev.map(s => {
        if (s.id === editingServiceId) {
          return {
            ...s,
            descripcion: desc,
            precioNeto: nPrice,
            precioVenta: sPrice,
            precioPvp: calculatedPvp,
            comisionB2B: comisionB2B,
            proveedor: activeServiceType === ServiceType.ALOJAMIENTO ? (detailedProperties.find(p => p.id === hotelId)?.nombre || hotelSearchQuery || activeRes?.hotelName) :
                       activeServiceType === ServiceType.TRASLADO ? transSupplier :
                       activeServiceType === ServiceType.RENT_A_CAR ? carSupplier :
                       activeServiceType === ServiceType.SEGURO ? insSupplier :
                       activeServiceType === ServiceType.MANUAL ? manualSupplier :
                       activeServiceType === ServiceType.SERVICIO_VARIO ? extraServices?.find(s => s.id === svExtraServiceId)?.providerName : undefined,
            detalles: det
          };
        }
        return s;
      }));
      setSubmitSuccess(`✓ Servicio "${activeServiceType}" actualizado en el carrito.`);
      setEditingServiceId(null);
    } else {
      const newService: ServiceItem = {
        id: nextSequentialId("SRV", [...reservations.flatMap(r => r.servicios?.map(s => s.id) || []), ...cartServices.map(s => s.id)]),
        tipo: activeServiceType,
        descripcion: desc,
        precioNeto: nPrice,
        precioVenta: sPrice,
        precioPvp: calculatedPvp,
        comisionB2B: comisionB2B,
        proveedor: activeServiceType === ServiceType.ALOJAMIENTO ? (detailedProperties.find(p => p.id === hotelId)?.nombre || hotelSearchQuery || activeRes?.hotelName) :
                   activeServiceType === ServiceType.TRASLADO ? transSupplier :
                   activeServiceType === ServiceType.RENT_A_CAR ? carSupplier :
                   activeServiceType === ServiceType.SEGURO ? insSupplier :
                   activeServiceType === ServiceType.MANUAL ? manualSupplier :
                   activeServiceType === ServiceType.SERVICIO_VARIO ? extraServices?.find(s => s.id === svExtraServiceId)?.providerName : undefined,
        detalles: det,
        statusFacturacion: "Borrador"
      };
      setCartServices(prev => [...prev, newService]);
      setSubmitSuccess(`✓ Servicio "${activeServiceType}" agregado al carrito.`);
    }

    setViewLevel(2);
    setActiveExpedienteTab("servicios");
    setTimeout(() => setSubmitSuccess(""), 4000);
  };

  // Remove service from cart
  const handleRemoveService = (srvId: string) => {
    setCartServices(prev => prev.filter(s => s.id !== srvId));
    setSubmitSuccess("✓ Servicio removido del carrito.");
    setTimeout(() => setSubmitSuccess(""), 4000);
  };

  // Clear filters helper (fixes undefined bug)
  const clearFilters = () => {
    setSearch("");
    setFilterStatus("Todas");
    setSortBy("ultimas");
  };

  // Carga el estado del carrito/borrador a partir de una reserva ya guardada.
  // Se usa tanto para "Ver" (solo lectura) como para "Editar" un expediente.
  const loadReservationIntoCart = (res: Reservation) => {
    setCartId(res.id);
    setCartHolder(res.holder);
    setCartCheckIn(res.checkIn);
    setCartCheckOut(res.checkOut);
    setCartMercado(res.mercado || "INTERNACIONAL");
    setCartAgencia(res.agenciaName || "");
    setAgencySearch(res.agenciaName || "");

    const matchedClient = clients.find(c => c.nombre.toLowerCase() === (res.agenciaName || "").toLowerCase());
    setSelectedClient(matchedClient || null);

    setCartClienteDirectoId(res.clienteDirectoId || "");
    const matchedDirectClient = directClients.find(c => c.id === res.clienteDirectoId);
    setSelectedDirectClient(matchedDirectClient || null);
    setDirectClientSearch(matchedDirectClient?.nombre || "");

    setCartTelefono(res.telefono || "");
    setCartEmail(res.email || "");
    setCartTipo(res.tipo || "Reserva Real");
    setCartCanalVenta(res.canalVenta || (!res.agenciaName ? "Directo" : "B2B"));
    setCartLocalizadorProveedor(res.localizadorProveedor || "");
    setCartSpecialRequests(res.specialRequests || "");
    setCartFlightNo(res.flightNo || "");
    setCartPasajeros(derivePassengersFromLegacyReservation(res));

    // Restaurar boletos ya vinculados a este expediente — si no se hace, el guardado
    // interpreta que todos los vuelos previamente vinculados se "quitaron" y los desvincula.
    const linkedBoletos = boletos.filter(b => b.expedienteId === res.id);
    setCartLinkedFlights(linkedBoletos.map(b => ({ id: b.id, facturarConjunto: !!b.facturarConjunto })));

    if (res.servicios && res.servicios.length > 0) {
      const seenIds = new Set<string>();
      const sanitizedServices = res.servicios.map(s => {
        let sid = s.id;
        if (!sid || seenIds.has(sid)) {
          sid = nextSequentialId("SRV", [...reservations.flatMap(r => r.servicios?.map(sv => sv.id) || []), ...seenIds]);
        }
        seenIds.add(sid);
        return { ...s, id: sid };
      });
      setCartServices(sanitizedServices);
    } else {
      // Legacy reservation service mapping
      const legacyService: ServiceItem = {
        id: nextSequentialId("SRV", reservations.flatMap(r => r.servicios?.map(s => s.id) || [])),
        tipo: ServiceType.ALOJAMIENTO,
        descripcion: `Hotel: ${res.hotelName} - 7 noches - ${res.pax} Pax - IN: ${formatDate(res.checkIn)} / OUT: ${formatDate(res.checkOut)}`,
        precioNeto: res.netPrice,
        precioVenta: res.totalPrice,
        detalles: {
          hotelSearchQuery: res.hotelName,
          checkInDate: res.checkIn,
          checkOutDate: res.checkOut,
          comisionB2B: 10,
          comisionPropia: 5,
          lodgingRooms: [{
            id: `rm-${Date.now()}-1`,
            roomTypeId: roomTypes.filter(rt => rt.property_id === (detailedProperties.find(p => p.nombre.toLowerCase() === res.hotelName.toLowerCase())?.id || ""))[0]?.id || "",
            adultsCount: res.pax,
            guests: [{ name: res.holder, type: "Adulto" }]
          }]
        }
      };
      setCartServices([legacyService]);
    }
  };

  // Abrir un expediente ya guardado en modo solo-lectura (Level 2, pestaña Resumen)
  const handleOpenReservation = (id: string) => {
    const res = reservations.find(r => r.id === id);
    if (res) loadReservationIntoCart(res);
    setSelectedResId(id);
    setIsEditingReservationId(null);
    setActiveExpedienteTab("resumen");
    setViewLevel(2);
  };

  // Backing out from cart
  const handleCancelCart = () => {
    if (isEditingReservationId) {
      // Descartar cambios no guardados: recargar el borrador desde el último estado persistido
      if (activeRes) loadReservationIntoCart(activeRes);
      setIsEditingReservationId(null);
      setActiveExpedienteTab("resumen");
    } else {
      setViewLevel(1);
    }
  };

  // Backing out from Service Configuration form
  const handleBackToCart = () => {
    setEditingServiceId(null);
    setViewLevel(2);
    setActiveExpedienteTab("servicios");
  };

  // Prepare reservation fields to edit
  const handleEditReservation = () => {
    if (!activeRes) return;
    loadReservationIntoCart(activeRes);
    setIsEditingReservationId(activeRes.id);
    setActiveExpedienteTab("datosGenerales");
  };

  // --- PASAJEROS (Level 2, pestaña Pasajeros) ---
  const handleAddPasajero = () => {
    setCartPasajeros(prev => [...prev, createEmptyPassenger(prev.length === 0)]);
  };

  const handleUpdatePasajeroNombre = (id: string, nombre: string) => {
    setCartPasajeros(prev => prev.map(p => p.id === id ? { ...p, nombre } : p));
  };

  const handleUpdatePasajeroTipo = (id: string, tipo: PassengerType) => {
    setCartPasajeros(prev => prev.map(p => p.id === id ? { ...p, tipo } : p));
  };

  const handleRemovePasajero = (id: string) => {
    setCartPasajeros(prev => {
      const removed = prev.find(p => p.id === id);
      const rest = prev.filter(p => p.id !== id);
      if (removed?.esTitular && rest.length > 0) {
        rest[0] = { ...rest[0], esTitular: true };
      }
      return rest;
    });
  };

  const handleSetTitular = (id: string) => {
    setCartPasajeros(prev => markTitular(prev, id));
  };

  // Deriva cartHolder automáticamente a partir del pasajero titular
  React.useEffect(() => {
    const derived = deriveHolderName(cartPasajeros);
    if (derived !== cartHolder) setCartHolder(derived);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartPasajeros]);

  // Prepare service fields to edit
  const handleEditService = (service: ServiceItem) => {
    setEditingServiceId(service.id);
    setActiveServiceType(service.tipo);

    if (service.detalles) {
      const det = service.detalles;
      if (service.tipo === ServiceType.ALOJAMIENTO) {
        setHotelId(det.hotelId || "");
        setHotelSearchQuery(det.hotelSearchQuery || "");
        setCheckInDate(det.checkInDate || "");
        setCheckOutDate(det.checkOutDate || "");
        setSelectedPromoName(det.selectedPromoName || "");
        setSelectedRatePlanId(det.selectedRatePlanId || "");
        setLodgingRooms(det.lodgingRooms ? JSON.parse(JSON.stringify(det.lodgingRooms)) : []);
        setComisionB2B(det.comisionB2B !== undefined ? det.comisionB2B : getDefaultComisionB2B());
        setComisionPropia(det.comisionPropia !== undefined ? det.comisionPropia : 5);
      } else if (service.tipo === ServiceType.TRASLADO) {
        setTransPickup(det.transPickup || "");
        setTransDropoff(det.transDropoff || "");
        setTransDate(det.transDate || "");
        setTransVehicle(det.transVehicle || "Berlina Ejecutiva");
        setTransTripType(det.transTripType || "one-way");
        setTransReturnDropoff(det.transReturnDropoff || "");
        setTransReturnDate(det.transReturnDate || "");
        setTransServiceType(det.transServiceType || "privado");
        setTransPax(det.transPax !== undefined ? det.transPax : 2);
        setSvExtraServiceId(det.svExtraServiceId || "");
        setTransEsPropio(!!det.transEsPropio);
        setTransSupplier(service.proveedor || "");
        setNetPrice(det.netPrice || "");
        setSalePrice(det.salePrice || "");
        setComisionB2B(det.comisionB2B !== undefined ? det.comisionB2B : getDefaultComisionB2B());
        setComisionPropia(det.comisionPropia !== undefined ? det.comisionPropia : 5);
      } else if (service.tipo === ServiceType.RENT_A_CAR) {
        setCarCategory(det.carCategory || "Compacto Automático");
        setCarSupplier(service.proveedor || det.carSupplier || "");
        setCarStartDate(det.carStartDate || "");
        setCarEndDate(det.carEndDate || "");
        setCarDays(det.carDays || 7);
        setNetPrice(det.netPrice || "");
        setSalePrice(det.salePrice || "");
        setComisionB2B(det.comisionB2B !== undefined ? det.comisionB2B : getDefaultComisionB2B());
      } else if (service.tipo === ServiceType.SEGURO) {
        setInsPlan(det.insPlan || "");
        setInsStartDate(det.insStartDate || "");
        setInsEndDate(det.insEndDate || "");
        setInsDays(det.insDays || 7);
        setInsPax(det.insPax !== undefined ? det.insPax : 1);
        setInsSupplier(service.proveedor || "Asistencia Global Travel");
        setNetPrice(det.netPrice || "");
        setSalePrice(det.salePrice || "");
        setComisionB2B(det.comisionB2B !== undefined ? det.comisionB2B : getDefaultComisionB2B());
        setComisionPropia(det.comisionPropia !== undefined ? det.comisionPropia : 5);
      } else if (service.tipo === ServiceType.MANUAL) {
        setManualDescription(det.manualDescription || "");
        setManualSupplier(service.proveedor || det.manualSupplier || "");
        setNetPrice(det.netPrice || "");
        setSalePrice(det.salePrice || "");
        setComisionB2B(det.comisionB2B !== undefined ? det.comisionB2B : getDefaultComisionB2B());
      } else if (service.tipo === ServiceType.SERVICIO_VARIO) {
        setSvExtraServiceId(det.svExtraServiceId || "");
        setSvRateId(det.svRateId || "");
        setSvAdults(det.svAdults !== undefined ? det.svAdults : 1);
        setSvChildren(det.svChildren !== undefined ? det.svChildren : 0);
        setSvVehicles(det.svVehicles !== undefined ? det.svVehicles : 1);
      }
    } else {
      // Legacy fallback
      setNetPrice(service.precioNeto.toString());
      setSalePrice(service.precioVenta.toString());

      if (service.tipo === ServiceType.ALOJAMIENTO) {
        setCheckInDate(cartCheckIn || "2026-06-20");
        setCheckOutDate(cartCheckOut || "2026-06-27");
        const defaultHotel = detailedProperties.find(p => p.nombre.toLowerCase().includes(activeRes?.hotelName.toLowerCase() || "")) || detailedProperties[0];
        setHotelId(defaultHotel?.id || "");
        setHotelSearchQuery(defaultHotel?.nombre || "");
        
        const plans = ratePlans.filter(rp => rp.property_id === (defaultHotel?.id || "") && rp.mercado === cartMercado);
        const defaultPromo = plans[0]?.nombrePromocion || "";
        setSelectedPromoName(defaultPromo);
        
        const defaultRoomType = roomTypes.filter(rt => rt.property_id === (defaultHotel?.id || ""))[0];
        const defaultRoomTypeId = defaultRoomType?.id || "";
        
        const matchedPlan = plans.find(rp => rp.nombrePromocion === defaultPromo && rp.roomType_id === defaultRoomTypeId);
        setSelectedRatePlanId(matchedPlan ? matchedPlan.id : (plans[0]?.id || ""));

        setLodgingRooms([{
          id: `rm-${Date.now()}-1`,
          roomTypeId: defaultRoomTypeId,
          adultsCount: activeRes?.pax || 2,
          guests: [{ name: activeRes?.holder || cartHolder || "", type: "Adulto" }]
        }]);
        setComisionB2B(getDefaultComisionB2B());
        setComisionPropia(5);
      } else if (service.tipo === ServiceType.TRASLADO) {
        setTransPickup("");
        setTransDropoff("");
        setTransDate(cartCheckIn || "2026-06-20");
        setTransVehicle("Berlina Ejecutiva");
        setSvExtraServiceId("");
        setTransEsPropio(false);
        setTransSupplier("");
      } else if (service.tipo === ServiceType.RENT_A_CAR) {
        setCarCategory("Compacto Automático");
        setCarSupplier("Hertz Rent A Car");
        setCarStartDate(cartCheckIn || "2026-06-20");
        setCarEndDate(cartCheckOut || "2026-06-27");
        setCarDays(7);
      } else if (service.tipo === ServiceType.SEGURO) {
        setInsPlan("Plan Cobertura Total Europa");
        setInsStartDate(cartCheckIn || "2026-06-20");
        setInsEndDate(cartCheckOut || "2026-06-27");
        setInsDays(7);
      } else if (service.tipo === ServiceType.MANUAL) {
        setManualDescription(service.descripcion);
        setManualSupplier("Directo");
      }
    }
    setViewLevel(3);
  };

  // Save the entire booking file (Level 3 to Level 2)
  const handleConfirmExpediente = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!cartHolder.trim()) {
      showAlert({ title: "Atención", message: "Por favor ingrese el titular del viaje.", type: "warning" });
      return;
    }
    if (!cartCheckIn || !cartCheckOut) {
      showAlert({ title: "Atención", message: "Por favor seleccione las fechas de check-in y check-out del expediente.", type: "warning" });
      return;
    }
    if (cartServices.length === 0 && cartLinkedFlights.filter(f => f.facturarConjunto).length === 0) {
      showAlert({ title: "Atención", message: "Debe agregar al menos un servicio o vuelo facturado conjuntamente al carrito para generar el expediente.", type: "warning" });
      return;
    }

    let totalNeto = cartServices.reduce((sum, s) => sum + s.precioNeto, 0);
    let totalVenta = cartServices.reduce((sum, s) => sum + s.precioVenta, 0);

    // Si hay boletos vinculados que se deben facturar conjuntamente
    const jointFlights = cartLinkedFlights.filter(f => f.facturarConjunto).map(f => boletos.find(b => b.id === f.id)).filter(Boolean) as any[];
    jointFlights.forEach(f => {
      totalNeto += f.costoNeto;
      totalVenta += f.precioVenta;
    });

    const hotelSrv = cartServices.find(s => s.tipo === ServiceType.ALOJAMIENTO);
    const hotelName = hotelSrv
      ? hotelSrv.descripcion.split(" - ")[0].replace("Hotel: ", "").replace(/\s*\(Hab\s*\d+:.*$/i, "").trim()
      : "Multi-servicio Terrestre";

    if (isEditingReservationId) {
      const updatedRes: Reservation = {
        id: isEditingReservationId,
        holder: cartHolder,
        hotelName,
        checkIn: cartCheckIn || checkInDate,
        checkOut: cartCheckOut || checkOutDate,
        pax: lodgingRooms.length > 0 ? lodgingRooms.reduce((sum, r) => sum + r.adultsCount, 0) : paxCount,
        status: activeRes?.status || "Confirmada",
        totalPrice: totalVenta,
        netPrice: totalNeto,
        specialRequests: cartSpecialRequests,
        flightNo: cartFlightNo || undefined,
        telefono: cartTelefono || "Sin registrar",
        email: cartEmail || "Sin registrar",
        agenciaName: cartCanalVenta === "Directo" ? undefined : cartAgencia,
        clienteDirectoId: cartCanalVenta === "Directo" ? (cartClienteDirectoId || undefined) : undefined,
        createdAt: activeRes?.createdAt || new Date().toISOString().split("T")[0],
        mercado: cartMercado,
        servicios: cartServices,
        pasajeros: cartPasajeros,
        tipo: cartTipo,
        canalVenta: cartCanalVenta,
        localizadorProveedor: cartLocalizadorProveedor || undefined
      };

      // ── AUTO-VINCULAR boletos seleccionados (EDICION) ──────────────────────────────
      if (onUpdateBoleto) {
        cartLinkedFlights.forEach(linked => {
          const b = boletos.find(x => x.id === linked.id);
          if (b && (!b.vinculadoAExpediente || b.expedienteId !== isEditingReservationId || b.facturarConjunto !== linked.facturarConjunto)) {
            onUpdateBoleto({ ...b, vinculadoAExpediente: true, expedienteId: isEditingReservationId, facturarConjunto: linked.facturarConjunto });
          }
        });
        // Si se quitaron vuelos que antes estaban vinculados, desvincularlos
        const prevLinked = boletos.filter(b => b.expedienteId === isEditingReservationId);
        prevLinked.forEach(b => {
          if (!cartLinkedFlights.find(linked => linked.id === b.id)) {
            onUpdateBoleto({ ...b, vinculadoAExpediente: false, expedienteId: undefined, facturarConjunto: false });
          }
        });
      }
      setCartLinkedFlights([]);

      // ── PREVISUALIZAR IMPACTO FINANCIERO ANTES DE GUARDAR ──
      const oldRes = reservations.find(r => r.id === isEditingReservationId);
      if (oldRes) {
        const result = reconcileDossierUpdate(oldRes, updatedRes, clients, directClients, payableObligations);
        const hasImpact = result.newVariations.length > 0 || 
                          result.newWalletTransactions.length > 0 || 
                          result.updatedPayableObligations.some(o => {
                            const prev = payableObligations.find(po => po.id === o.id);
                            return !prev || prev.status !== o.status || prev.netCost !== o.netCost;
                          });

        if (hasImpact) {
          setFinancialImpactPreview(result);
          setPendingSaveReservation(updatedRes);
          return;
        }
      }

      if (onUpdateReservation) {
        onUpdateReservation(updatedRes);
      }
      setSelectedResId(isEditingReservationId);
      setIsEditingReservationId(null);
      setActiveExpedienteTab("resumen");
      setViewLevel(2);
      setSubmitSuccess(`✓ Cambios guardados en el expediente "${isEditingReservationId}".`);
    } else {
      const newRes: Reservation = {
        id: cartId,
        holder: cartHolder,
        hotelName,
        checkIn: cartCheckIn || checkInDate,
        checkOut: cartCheckOut || checkOutDate,
        pax: paxCount,
        // Un expediente nuevo nace como Cotización (cartTipo se resetea a "Cotización" al
        // empezar uno) — recién pasa a "Confirmada" cuando se envía a Facturación
        // (ver handleConfirmSendBilling), no antes.
        status: cartTipo === "Cotización" ? "Pendiente" : "Confirmada",
        totalPrice: totalVenta,
        netPrice: totalNeto,
        specialRequests: cartSpecialRequests,
        flightNo: cartFlightNo || undefined,
        telefono: cartTelefono || "Sin registrar",
        email: cartEmail || "Sin registrar",
        agenciaName: cartCanalVenta === "Directo" ? undefined : cartAgencia,
        clienteDirectoId: cartCanalVenta === "Directo" ? (cartClienteDirectoId || undefined) : undefined,
        createdAt: new Date().toISOString().split("T")[0],
        mercado: cartMercado,
        servicios: cartServices.map(s => ({ ...s, statusFacturacion: s.statusFacturacion || "Borrador" as const })),
        pasajeros: cartPasajeros,
        tipo: cartTipo,
        canalVenta: cartCanalVenta,
        localizadorProveedor: cartLocalizadorProveedor || undefined
      };

      onAddReservation(newRes);

      // ── AUTO-VINCULAR boletos seleccionados (NUEVO) ──────────────────────────────
      if (onUpdateBoleto) {
        cartLinkedFlights.forEach(linked => {
          const b = boletos.find(x => x.id === linked.id);
          if (b) {
            onUpdateBoleto({ ...b, vinculadoAExpediente: true, expedienteId: cartId, facturarConjunto: linked.facturarConjunto });
          }
        });
      }
      setCartLinkedFlights([]);
      // ─────────────────────────────────────────────────────────────────────

      setSelectedResId(cartId);
      setActiveExpedienteTab("resumen");
      setViewLevel(2);
      setSubmitSuccess(`✓ Expediente "${cartId}" creado exitosamente.`);
    }

    setTimeout(() => setSubmitSuccess(""), 4000);
  };

  const handleConfirmFinancialImpactSave = () => {
    if (pendingSaveReservation && onUpdateReservation) {
      onUpdateReservation(pendingSaveReservation);
      setSelectedResId(pendingSaveReservation.id);
      setIsEditingReservationId(null);
      setActiveExpedienteTab("resumen");
      setViewLevel(2);
      setSubmitSuccess(`✓ Cambios guardados en el expediente "${pendingSaveReservation.id}".`);
    }
    setFinancialImpactPreview(null);
    setPendingSaveReservation(null);
    setTimeout(() => setSubmitSuccess(""), 4000);
  };

  const rejectedReservations = reservations.filter(r => r.facturacionRechazoMotivo || (r.servicios && r.servicios.some(s => s.statusFacturacion === "Rechazado")));

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {submitSuccess && (
        <div className="fixed bottom-5 right-5 bg-zinc-900 border border-zinc-700 text-white text-xs font-bold px-4 py-3 rounded-md shadow-lg z-50 flex items-center gap-2 animate-bounce">
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* VIEW LEVEL 1: LISTADO PRINCIPAL */}
      {viewLevel === 1 && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Módulo de Reservas y Booking Terrestre</h2>
              <p className="text-xs text-zinc-400 mt-1">Gestión de expedientes de viaje B2B, allotments de alojamiento y liquidación de costos netos.</p>
            </div>
            
            <button
              onClick={handleStartNewExpediente}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> Nuevo Expediente
            </button>
          </div>

          {/* Tabs */}
          <div className="inline-flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
            <button
              type="button"
              onClick={() => setActiveTab("Activos")}
              className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "Activos"
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Activos ({reservations.filter((r) => r.status !== "Cancelada").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Canceladas")}
              className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "Canceladas"
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Anuladas ({totalCanceladas})
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div 
              onClick={() => setFilterStatus("Todas")}
              className={`p-4.5 border rounded-lg flex items-center justify-between shadow-xs cursor-pointer transition-all ${
                filterStatus === "Todas"
                  ? "bg-zinc-950 text-white border-zinc-950 ring-2 ring-zinc-900/10"
                  : "bg-white border-zinc-200 hover:border-zinc-350 hover:shadow-xs"
              }`}
            >
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest block text-zinc-400">Total Reservas</span>
                <span className="text-2xl font-black block">{totalRes}</span>
                <span className={`text-[9.5px] font-semibold block ${filterStatus === "Todas" ? "text-zinc-300" : "text-zinc-450"}`}>Expedientes generales</span>
              </div>
              <div className={`p-2.5 rounded-md border ${filterStatus === "Todas" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-650"}`}>
                <FileText className="w-5.5 h-5.5" />
              </div>
            </div>

            <div 
              onClick={() => setFilterStatus("Confirmada")}
              className={`p-4.5 border rounded-lg flex items-center justify-between shadow-xs cursor-pointer transition-all ${
                filterStatus === "Confirmada"
                  ? "bg-emerald-50/20 border-emerald-500 ring-2 ring-emerald-500/10"
                  : "bg-white border-zinc-200 hover:border-zinc-350 hover:shadow-xs"
              }`}
            >
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block">Confirmadas</span>
                <span className="text-2xl font-black text-zinc-900 block">{totalConfirmadas}</span>
                <span className="text-[9.5px] text-emerald-600 font-semibold block">Vouchers aprobados</span>
              </div>
              <div className={`p-2.5 rounded-md border ${filterStatus === "Confirmada" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-zinc-50 border-zinc-200 text-zinc-650"}`}>
                <CheckCircle2 className="w-5.5 h-5.5" />
              </div>
            </div>

            <div 
              onClick={() => setFilterStatus("Pendientes")}
              className={`p-4.5 border rounded-lg flex items-center justify-between shadow-xs cursor-pointer transition-all ${
                filterStatus === "Pendientes"
                  ? "bg-amber-50/20 border-amber-500 ring-2 ring-amber-500/10"
                  : "bg-white border-zinc-200 hover:border-zinc-350 hover:shadow-xs"
              }`}
            >
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block">Pendientes</span>
                <span className="text-2xl font-black text-amber-700 block">{totalPendientes}</span>
                <span className="text-[9.5px] text-amber-600 font-semibold block">Falta pago o cotización</span>
              </div>
              <div className={`p-2.5 rounded-md border ${filterStatus === "Pendientes" ? "bg-amber-50 border-amber-200 text-amber-750" : "bg-zinc-50 border-zinc-200 text-zinc-650"}`}>
                <TrendingUp className="w-5.5 h-5.5" />
              </div>
            </div>

            <div 
              onClick={() => setFilterStatus("Cancelada")}
              className={`p-4.5 border rounded-lg flex items-center justify-between shadow-xs cursor-pointer transition-all ${
                filterStatus === "Cancelada"
                  ? "bg-red-50/20 border-red-500 ring-2 ring-red-500/10"
                  : "bg-white border-zinc-200 hover:border-zinc-350 hover:shadow-xs"
              }`}
            >
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block">Canceladas</span>
                <span className="text-2xl font-black text-red-650 block">{totalCanceladas}</span>
                <span className="text-[9.5px] text-red-500 font-semibold block">Créditos de anulación</span>
              </div>
              <div className={`p-2.5 rounded-md border ${filterStatus === "Cancelada" ? "bg-red-50 border-red-200 text-red-600" : "bg-zinc-50 border-zinc-200 text-zinc-650"}`}>
                <XCircle className="w-5.5 h-5.5" />
              </div>
            </div>

            <div 
              onClick={() => setFilterStatus("Rechazadas")}
              className={`p-4.5 border rounded-lg flex items-center justify-between shadow-xs cursor-pointer transition-all ${
                filterStatus === "Rechazadas"
                  ? "bg-red-100 border-red-600 ring-2 ring-red-500/20"
                  : "bg-white border-zinc-200 hover:border-zinc-350 hover:shadow-xs"
              }`}
            >
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Rechazadas</span>
                <span className="text-2xl font-black text-red-700 block">{rejectedReservations.length}</span>
                <span className="text-[9.5px] text-red-600 font-semibold block">Facturas devueltas</span>
              </div>
              <div className={`p-2.5 rounded-md border ${filterStatus === "Rechazadas" ? "bg-red-200 border-red-300 text-red-700" : "bg-zinc-50 border-zinc-200 text-zinc-650"}`}>
                <AlertTriangle className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 border border-zinc-200 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por localizador, titular, tfl, email..."
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:border-zinc-500 font-semibold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-zinc-450" />
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Estatus:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="p-1.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none cursor-pointer"
                >
                  <option value="Todas">TODOS LOS ESTATUS</option>
                  <option value="Confirmada">CONFIRMADAS</option>
                  <option value="Pendientes">PENDIENTES</option>
                  <option value="Pendiente">PENDIENTE (COTIZACIÓN)</option>
                  <option value="Pendiente de Pago">PENDIENTES DE PAGO</option>
                  <option value="Petición Especial">PETICIÓN ESPECIAL</option>
                  <option value="Modificada">MODIFICADAS</option>
                  <option value="Cancelada">CANCELADAS</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-450" />
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "ultimas" | "checkin")}
                  className="p-1.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none cursor-pointer"
                >
                  <option value="ultimas">ÚLTIMAS AGREGADAS</option>
                  <option value="checkin">CHECK-IN MÁS PRÓXIMO</option>
                </select>
              </div>

              {(search !== "" || filterStatus !== "Todas" || sortBy !== "ultimas") && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[9.5px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer border border-zinc-200"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Listado Completo en Tabla */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs table-fixed">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[9px] font-extrabold tracking-tight">
                    <th className="px-2 py-3 w-[12%] whitespace-nowrap">Localizador</th>
                    <th className="px-2 py-3 w-[14%]">Pasajero Titular</th>
                    <th className="px-2 py-3 w-[16%]">Establecimiento / Detalle</th>
                    <th className="px-2 py-3 w-[8%] text-center">Servicios</th>
                    <th className="px-2 py-3 w-[9%] text-right whitespace-nowrap">Total PVP</th>
                    <th className="px-2 py-3 w-[11%]">Agencia B2B</th>
                    <th className="px-2 py-3 w-[10%] whitespace-nowrap text-center">Estatus</th>
                    <th className="px-2 py-3 w-[8%] text-center whitespace-nowrap">Cobro</th>
                    <th className="px-2 py-3 w-[8%] text-center whitespace-nowrap">Pago Prov.</th>
                    <th className="px-2 py-3 w-[4%] text-center whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredAndSorted.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-zinc-400 italic">
                        No se encontraron expedientes de reserva.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSorted.map((r) => (
                      <React.Fragment key={r.id}>
                        <tr 
                          onClick={() => { handleOpenReservation(r.id); }}
                          className="hover:bg-zinc-50/60 transition-colors cursor-pointer group"
                        >
                        <td className="px-2 py-2.5 font-mono font-bold text-zinc-900 whitespace-nowrap truncate text-[11px]">
                          {r.id}
                          <span className={`ml-1.5 px-1 py-0.5 rounded text-[7px] font-extrabold uppercase border ${
                            r.mercado === "INTERNACIONAL" ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-blue-50 border-blue-200 text-blue-700"
                          }`}>
                            {r.mercado === "INTERNACIONAL" ? "INTL" : "NAC"}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 font-bold text-zinc-900 group-hover:underline truncate text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                            <span className="truncate">{r.holder}</span>
                          </div>
                          {r.localizadorProveedor && (
                            <div className="font-mono font-semibold text-zinc-400 text-[9.5px] truncate normal-case">
                              Prov: {r.localizadorProveedor}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-zinc-750 font-semibold truncate text-[11px]">
                          {r.hotelName}
                        </td>
                        <td className="px-2 py-2.5 text-zinc-500 font-bold whitespace-nowrap text-center text-[11px]">
                          {r.servicios?.length || 1}
                        </td>
                        <td className="px-2 py-2.5 text-right font-bold text-zinc-950 whitespace-nowrap text-[11px]">{formatDualCurrency(r.totalPrice, jur, currentExchangeRate)}</td>
                        <td className="px-2 py-2.5 text-zinc-650 font-semibold truncate text-[11px]">{r.agenciaName || "Directo"}</td>
                        <td className="px-2 py-2.5 whitespace-nowrap text-center text-[11px]">
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase border inline-flex items-center gap-1 truncate max-w-full ${getStatusBadge(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center whitespace-nowrap text-[11px]">
                          {(() => {
                            const cPay = getClientPaymentStatus(r.id);
                            return (
                              <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border font-bold truncate max-w-full inline-block ${cPay.color}`}>
                                {cPay.status}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-2 py-2.5 text-center whitespace-nowrap text-[11px]" onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const pPay = getProviderPaymentStatus(r.id);
                            return (
                              <div className="flex items-center justify-center gap-1">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border font-bold truncate max-w-full ${pPay.color}`}>
                                  {pPay.status}
                                </span>
                                {pPay.obligation?.attachedFile && (
                                  <button
                                    title="Descargar/Ver Soporte de Pago de Tesorería"
                                    onClick={() => {
                                      setSelectedObligationForReceipt(pPay.obligation);
                                      setShowProvReceiptModal(true);
                                    }}
                                    className="p-1 hover:bg-zinc-150 rounded text-zinc-600 transition-colors cursor-pointer"
                                  >
                                    <Download className="w-3 h-3 text-emerald-600" />
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-2 py-2.5 text-center whitespace-nowrap text-[11px]" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { handleOpenReservation(r.id); }}
                            className="p-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-900 hover:text-white rounded text-[10px] cursor-pointer transition-all inline-flex items-center justify-center"
                            title="Ver Expediente"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        </tr>
                        {filterStatus === "Rechazadas" && (r.facturacionRechazoMotivo || (r.servicios && r.servicios.some(s => s.statusFacturacion === "Rechazado"))) && (
                          <tr className="bg-red-50 border-b border-red-100 hover:bg-red-50 cursor-pointer" onClick={() => { handleOpenReservation(r.id); }}>
                            <td colSpan={10} className="px-4 py-3">
                              <div className="flex flex-col gap-2">
                                <div className="text-zinc-700 text-xs flex gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                  <div>
                                    <span className="font-bold block text-red-800 mb-0.5">Motivo del rechazo de facturación:</span>
                                    {r.facturacionRechazoMotivo || "Sin motivo especificado."}
                                  </div>
                                </div>
                                {r.facturacionRechazoArchivos && (
                                  <div className="ml-6 text-[10px] flex items-center gap-2">
                                    <span className="font-bold text-zinc-600">Adjuntos:</span>
                                    <div className="flex gap-2 flex-wrap">
                                      {JSON.parse(r.facturacionRechazoArchivos).map((url: string, idx: number) => (
                                        <a 
                                          key={idx}
                                          href={url}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
                                        >
                                          <FileText className="w-3 h-3" /> Ver Adjunto {idx + 1}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW LEVEL 2: DETALLE DEL EXPEDIENTE (B2B BOOKING FILE) */}
      {viewLevel === 2 && (
        <div className="space-y-6 animate-fade-in">
          {/* Header + Tabs: se mueven juntos como un solo bloque sticky para que nunca se superpongan */}
          <div className="sticky top-16 z-20 bg-zinc-50/95 backdrop-blur-xs -mx-8 px-8 pt-2 space-y-0">
          {/* Header — modo creación (sin expediente guardado todavía) */}
          {expedienteMode === "create" && (
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={handleCancelCart}
                  className="p-1 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer border border-zinc-200 bg-white shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-zinc-700" />
                </button>
                <div className="min-w-0">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block leading-none">Nuevo Registro</span>
                  <h3 className="font-black text-xl text-zinc-950 font-mono tracking-tight leading-tight">{cartId}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCancelCart}
                  className="px-2.5 py-1 border border-zinc-200 hover:bg-zinc-50 rounded text-[10.5px] font-bold uppercase cursor-pointer bg-white whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmExpediente()}
                  disabled={(cartServices.length === 0 && cartLinkedFlights.filter(f => f.facturarConjunto).length === 0) || !cartHolder.trim()}
                  className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-[10.5px] font-black uppercase cursor-pointer transition-all whitespace-nowrap disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
                >
                  Guardar Reserva
                </button>
              </div>
            </div>
          )}

          {/* Header — expediente ya guardado (ver/editar) */}
          {expedienteMode !== "create" && activeRes && (
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setViewLevel(1)}
                className="p-1 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer border border-zinc-200 bg-white shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-700" />
              </button>
              <div className="min-w-0">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block leading-none">Expedientes de Reserva</span>
                <div className="flex items-center gap-2 leading-tight">
                  <h3 className="font-black text-xl text-zinc-950 font-mono tracking-tight">{activeRes.id}</h3>
                  <span className="text-xs font-bold text-zinc-500 uppercase truncate">{activeRes.holder}</span>
                  {expedienteMode === "edit" && <span className="px-1.5 py-0.25 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold uppercase shrink-0">Editando</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-zinc-200 shadow-3xs">
                <span className="text-[8.5px] uppercase font-black text-zinc-400 pl-2 whitespace-nowrap">Estatus:</span>
                <select
                  value={activeRes.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as Reservation["status"];
                    if (onUpdateReservation) {
                      onUpdateReservation({
                        ...activeRes,
                        status: newStatus
                      });
                    }
                  }}
                  className={`px-2 py-0.5 border rounded-full text-[9.5px] font-black uppercase tracking-wider focus:outline-none cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all ${getStatusBadge(activeRes.status)}`}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Pendiente de Pago">Pendiente de Pago</option>
                  <option value="Modificada">Modificada</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="Petición Especial">Petición Especial</option>
                </select>
              </div>

              <button
                onClick={() => setShowB2BModal(true)}
                className="px-2.5 py-1 border border-zinc-900 bg-zinc-900 hover:bg-zinc-800 rounded text-white font-bold text-[10.5px] uppercase cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap"
                title={isCanalDirecto(activeRes) ? "Compartir Cotización con Cliente" : "Compartir Formato B2B"}
              >
                <Share2 className="w-3 h-3" />
                <span>{isCanalDirecto(activeRes) ? "Cotización Cliente" : "Formato B2B"}</span>
              </button>

              {activeRes.servicios?.some(s => s.statusFacturacion === "Facturado") && (
                <button
                  onClick={() => setShowVoucherModal(true)}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10.5px] font-bold uppercase cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap animate-fade-in"
                  title="Generar Voucher de Viaje Oficial para Pasajero"
                >
                  <Printer className="w-3 h-3" />
                  <span>Voucher</span>
                </button>
              )}

              {expedienteMode === "edit" ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelCart}
                    className="px-2.5 py-1 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-zinc-700 hover:text-zinc-950 font-bold text-[10.5px] uppercase cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap"
                    title="Cancelar Edición"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmExpediente()}
                    disabled={(cartServices.length === 0 && cartLinkedFlights.filter(f => f.facturarConjunto).length === 0) || !cartHolder.trim()}
                    className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-[10.5px] font-black uppercase cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
                    title="Guardar Cambios"
                  >
                    <span>Guardar</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditReservation}
                  className="px-2.5 py-1 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-zinc-700 hover:text-zinc-950 font-bold text-[10.5px] uppercase cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap"
                  title="Editar Expediente"
                >
                  <Edit className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              )}
            </div>
          </div>
          )}

          {(() => {
            // Cuenta lo mismo que ya muestra "Pendientes de Enviar" en Administración: servicios/vuelos
            // sin enviar a Facturación y ajustes (Suplemento/Crédito) todavía en Borrador — así el
            // operador ve de un vistazo, desde el propio tab, que hay algo que requiere atención.
            const pendingAdminCount = activeRes ? (
              (activeRes.servicios || []).filter(s => s.statusFacturacion === "Borrador" || s.statusFacturacion === "Rechazado" || s.statusFacturacion === undefined).length +
              boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto && (!b.expedienteAereo || b.expedienteAereo.status === "Borrador" || b.expedienteAereo.status === undefined)).length +
              (activeRes.variaciones || []).filter(v => (v.type === "Suplemento" || v.type === "Credito") && v.status === "Borrador" && !v.invoiceId).length
            ) : 0;

            return (
              <Tabs
                tabs={[
                  { key: "resumen", label: "Resumen" },
                  { key: "datosGenerales", label: "Datos Generales" },
                  { key: "pasajeros", label: "Pasajeros", badge: effectivePasajeros.length },
                  { key: "servicios", label: "Servicios", badge: cartServices.length },
                  { key: "administracion", label: "Administración", badge: pendingAdminCount > 0 ? pendingAdminCount : undefined, badgeVariant: "alert" },
                ]}
                active={activeExpedienteTab}
                onChange={(k) => setActiveExpedienteTab(k as ExpedienteTab)}
              />
            );
          })()}
          </div>

          {activeExpedienteTab === "resumen" && !activeRes && (
            <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-zinc-500 text-xs font-semibold">
              Complete Datos Generales, Pasajeros y Servicios y guarde el expediente para ver aquí el resumen completo.
            </div>
          )}

          {activeExpedienteTab === "resumen" && activeRes && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda */}
            <div className="lg:col-span-8 space-y-6">

              {/* Resumen Comercial */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest border-b border-zinc-150 pb-2">Datos Comerciales del Expediente</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-zinc-800">
                  <div>
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Agencia Emisora</span>
                    <span className="text-zinc-900 font-bold block">{activeRes.agenciaName || "Directo"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Mercado Objetivo</span>
                    <span className="text-zinc-900 font-bold block uppercase">{activeRes.mercado || "INTERNACIONAL"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Fecha Creación</span>
                    <span className="text-zinc-900 font-mono block">{formatDate(activeRes.createdAt || "2026-06-01")}</span>
                  </div>
                </div>
              </div>

              {/* Listado de Servicios del Carrito */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest border-b border-zinc-150 pb-2">Servicios Incluidos en el Expediente</h4>
                
                <div className="divide-y divide-zinc-250">
                  {activeRes.servicios && activeRes.servicios.length > 0 ? (
                    activeRes.servicios.map((s) => {
                      const comisionPct = s.comisionB2B !== undefined ? s.comisionB2B : 10;
                      const pvp = s.precioPvp !== undefined ? s.precioPvp : (s.precioVenta / (1 - comisionPct / 100));
                      const comisionAmt = pvp - s.precioVenta;
                      const gananciaMayorista = s.precioVenta - s.precioNeto;
                      return (
                        <div key={s.id} className="py-3.5 flex flex-col gap-3">
                          {/* Main Row */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-1 max-w-md">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-zinc-300 bg-zinc-100 text-zinc-850">
                                  {s.tipo}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-400">{s.id}</span>
                                {(activeRes.tipo === "Reserva Real" || activeRes.tipo === undefined) && (() => {
                                  const status = s.statusFacturacion || "Borrador";
                                  if (status === "Facturado") {
                                    return (
                                      <span className="px-1.5 py-0.25 rounded-full text-[7.5px] font-bold bg-emerald-50 border border-emerald-250 text-emerald-700 uppercase tracking-wider">
                                        Facturado (Aprobado)
                                      </span>
                                    );
                                  } else if (status === "Solicitado") {
                                    return (
                                      <span className="px-1.5 py-0.25 rounded-full text-[7.5px] font-bold bg-blue-50 border border-blue-250 text-blue-700 uppercase tracking-wider">
                                        Enviado a Facturación (En Revisión)
                                      </span>
                                    );
                                  } else if (status === "Rechazado") {
                                    return (
                                      <span className="px-1.5 py-0.25 rounded-full text-[7.5px] font-bold bg-red-50 border border-red-250 text-red-700 uppercase tracking-wider">
                                        Facturación Rechazada
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="px-1.5 py-0.25 rounded-full text-[7.5px] font-bold bg-amber-50 border border-amber-250 text-amber-700 uppercase tracking-wider">
                                        Pendiente de Enviar
                                      </span>
                                    );
                                  }
                                })()}
                                {s.status && (
                                  <span className={`px-1.5 py-0.25 rounded-full text-[7.5px] font-bold uppercase tracking-wider ${
                                    s.status === "Cancelado" 
                                      ? "bg-red-100 border border-red-300 text-red-800" 
                                      : s.status === "Modificado"
                                        ? "bg-indigo-50 border border-indigo-250 text-indigo-700"
                                        : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                  }`}>
                                    {s.status === "Cancelado" ? "Cancelado (Servicio)" : s.status}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs font-bold leading-tight ${s.status === "Cancelado" ? "text-red-700/60 line-through font-semibold" : "text-zinc-900"}`}>
                                {s.tipo === ServiceType.ALOJAMIENTO && s.detalles?.lodgingRooms
                                  ? (detailedProperties.find(p => p.id === s.detalles.hotelId)?.nombre || s.descripcion.split(" (")[0]?.replace("Hotel: ", "") || "Hotel")
                                  : s.descripcion
                                }
                              </p>
                            </div>
                            
                            <div className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-5 md:flex md:items-center gap-x-4 gap-y-2 md:gap-6 text-xs font-semibold text-zinc-800 border-t md:border-t-0 border-zinc-100 pt-2 md:pt-0">
                              <div className="text-left md:text-right">
                                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">PVP (Público)</span>
                                <span className="text-zinc-900 font-bold">${pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                              </div>
                              
                              <div className="text-left md:text-right">
                                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">Comisión ({comisionPct}%)</span>
                                <span className="text-amber-600 font-bold">-${comisionAmt.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                              </div>

                              <div className="text-left md:text-right">
                                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-black text-zinc-950">Neto B2B (Cobrar)</span>
                                <span className="text-zinc-950 font-black">${s.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                              </div>

                              <div className="text-left md:text-right">
                                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">Neto Proveedor (Costo)</span>
                                <span className="text-zinc-500 font-bold">${s.precioNeto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                              </div>

                              <div className="text-left md:text-right">
                                <span className="text-[9px] text-emerald-600 uppercase tracking-wider block font-bold">Ganancia Foratour</span>
                                <span className="text-emerald-700 font-bold">+${gananciaMayorista.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Room breakdown */}
                          {s.tipo === ServiceType.ALOJAMIENTO && s.detalles?.lodgingRooms && (
                            <div className="pl-4 border-l-2 border-zinc-200 mt-1 space-y-2 text-left w-full">
                              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Desglose por Habitación:</p>
                              <div className="space-y-2">
                                {s.detalles.lodgingRooms.map((room: any, rIdx: number) => {
                                  const rates = calculateRoomRates(room, s.detalles, activeRes.mercado || "NACIONAL", ratePlans, roomTypes);
                                  const roomTypeName = roomTypes.find(rt => rt.id === room.roomTypeId)?.nombre || "Habitación";
                                  const guestsNames = room.guests?.map((g: any) => `${g.name} (${g.type === "Adulto" ? "ADT" : "CHD"})`).filter((str: string) => str.replace(/\s*\([^)]+\)/g, "").trim() !== "").join(", ");
                                  const roomProfit = rates.sale - rates.net;
                                  return (
                                    <div key={room.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 py-1.5 border-b border-zinc-100 last:border-b-0 text-[11px] text-zinc-700">
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-zinc-800">Hab {rIdx + 1}: {roomTypeName}</p>
                                        {guestsNames && <p className="text-zinc-500 text-[10px] italic">Pasajeros: {guestsNames}</p>}
                                      </div>
                                      <div className="flex flex-wrap gap-4 text-right">
                                        <div>
                                          <span className="text-[8px] text-zinc-400 block uppercase font-bold">PVP (Público)</span>
                                          <span className="text-zinc-900 font-semibold">${rates.pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div>
                                          <span className="text-[8px] text-zinc-400 block uppercase font-bold">Comisión ({comisionPct}%)</span>
                                          <span className="text-amber-600 font-semibold">-${rates.comisionB2BVal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div>
                                          <span className="text-[8px] text-zinc-500 block uppercase font-black text-zinc-950 font-mono">Neto B2B</span>
                                          <span className="text-zinc-950 font-black">${rates.sale.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div>
                                          <span className="text-[8px] text-zinc-400 block uppercase font-bold">Neto Prov</span>
                                          <span className="text-zinc-500 font-semibold">${rates.net.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div>
                                          <span className="text-[8px] text-emerald-600 block uppercase font-bold">Ganancia</span>
                                          <span className="text-emerald-700 font-bold">+${roomProfit.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    /* Fallback para compatibilidad con reservas iniciales antiguas */
                    (() => {
                      const pvp = activeRes.totalPrice / 0.9;
                      const comisionAmt = pvp - activeRes.totalPrice;
                      const gananciaMayorista = activeRes.totalPrice - activeRes.netPrice;
                      return (
                        <div className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1 max-w-md">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase border border-zinc-300 bg-zinc-100 text-zinc-800">
                                Alojamiento
                              </span>
                            </div>
                            <p className="text-xs font-bold text-zinc-900 mt-1">{activeRes.hotelName} - 7 noches - {activeRes.pax} Pax</p>
                            <p className="text-[9px] text-zinc-400 font-mono mt-0.5">Check-in: {formatDate(activeRes.checkIn)} ➔ Out: {formatDate(activeRes.checkOut)}</p>
                          </div>
                          
                          <div className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-5 md:flex md:items-center gap-x-4 gap-y-2 md:gap-6 text-xs font-semibold text-zinc-800 border-t md:border-t-0 border-zinc-100 pt-2 md:pt-0">
                            <div className="text-left md:text-right">
                              <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">PVP (Público)</span>
                              <span className="text-zinc-900 font-bold">${pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="text-left md:text-right">
                              <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">Comisión (10%)</span>
                              <span className="text-amber-600 font-bold">-${comisionAmt.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="text-left md:text-right">
                              <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-black text-zinc-950">Neto B2B (Cobrar)</span>
                              <span className="text-zinc-950 font-black">${activeRes.totalPrice.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="text-left md:text-right">
                              <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">Neto Proveedor (Costo)</span>
                              <span className="text-zinc-500 font-bold">${activeRes.netPrice.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="text-left md:text-right">
                              <span className="text-[9px] text-emerald-600 uppercase tracking-wider block font-bold">Ganancia Foratour</span>
                              <span className="text-emerald-700 font-bold">+${gananciaMayorista.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {(() => {
                    const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto);
                    return jointFlights.map(vuelo => {
                      const vProfit = vuelo.precioVenta - vuelo.costoNeto;
                      const statusFact = vuelo.expedienteAereo?.status === "Facturado" || vuelo.expedienteAereo?.status === "PagadoAerolinea" ? "Facturado (Aprobado)" : "Enviado a Facturación (Conjunta)";
                      const pvp = vuelo.precioPvp || vuelo.precioVenta;
                      const comisionPct = vuelo.comisionB2B || 0;
                      const comisionAmt = pvp - vuelo.precioVenta;

                      return (
                        <div key={vuelo.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-t border-zinc-150">
                          <div className="space-y-1 max-w-md">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-blue-300 bg-blue-100 text-blue-800">
                                Aéreo GDS
                              </span>
                              <span className="text-[9px] font-mono text-zinc-400">Vuelo Vinculado</span>
                              <span className={`px-1.5 py-0.25 rounded-full text-[7.5px] font-bold uppercase tracking-wider ${vuelo.expedienteAereo?.status === 'Facturado' ? 'bg-emerald-50 border-emerald-250 text-emerald-700' : 'bg-blue-50 border-blue-250 text-blue-700'}`}>
                                {statusFact}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-zinc-900 mt-1 truncate">Itinerario Vuelo - PNR: {vuelo.pnr}</p>
                            <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                              {(vuelo.segmentos?.map ? vuelo.segmentos : []).map((s, i) => <span key={i} className="mr-2">{s.origen} ➔ {s.destino}</span>)}
                            </div>
                          </div>
                          
                          <div className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-5 md:flex md:items-center gap-x-4 gap-y-2 md:gap-6 text-xs font-semibold text-zinc-800 border-t md:border-t-0 border-zinc-100 pt-2 md:pt-0">
                            <div className="text-left md:text-right">
                              <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">PVP (Público)</span>
                              <span className="text-zinc-900 font-bold">${pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                            </div>
                            
                            <div className="text-left md:text-right">
                              <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">Comisión ({comisionPct}%)</span>
                              <span className="text-amber-600 font-bold">-${comisionAmt.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="text-left md:text-right">
                              <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-black text-zinc-950">Neto B2B (Cobrar)</span>
                              <span className="text-zinc-950 font-black">${vuelo.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="text-left md:text-right">
                              <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">Neto Proveedor (Costo)</span>
                              <span className="text-zinc-500 font-bold">${vuelo.costoNeto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="text-left md:text-right">
                              <span className="text-[9px] text-emerald-600 uppercase tracking-wider block font-bold">Ganancia Foratour</span>
                              <span className="text-emerald-700 font-bold">+${vProfit.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Peticiones especiales */}
              {activeRes.specialRequests && (
                <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-2 shadow-xs">
                  <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest block flex items-center gap-1.5 text-zinc-650">
                    <Info className="w-4 h-4" /> Notas Especiales del Expediente
                  </h4>
                  <p className="text-xs text-zinc-700 leading-relaxed font-semibold p-3 bg-zinc-50 border border-zinc-200 rounded-md">
                    {activeRes.specialRequests}
                  </p>
                </div>
              )}
            </div>

            {/* Columna Derecha */}
            <div className="lg:col-span-4 space-y-6">
            {/* Desglose de Liquidación */}
            <div className="bg-zinc-950 text-white rounded-lg p-5 space-y-4 shadow-md">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                <DollarSign className="w-4.5 h-4.5 text-zinc-400" /> Liquidación Total
              </h4>

              {(() => {
                const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto);
                let totalPvp = activeRes.servicios && activeRes.servicios.length > 0
                  ? activeRes.servicios.reduce((sum, s) => {
                      const comisionPct = s.comisionB2B !== undefined ? s.comisionB2B : 10;
                      const itemPvp = s.precioPvp !== undefined ? s.precioPvp : (s.precioVenta / (1 - comisionPct / 100));
                      return sum + itemPvp;
                    }, 0)
                  : (activeRes.totalPrice / 0.9);
                
                let totalVenta = activeRes.totalPrice;
                let totalNeto = activeRes.netPrice;

                jointFlights.forEach(f => {
                   totalPvp += (f.precioPvp || f.precioVenta);
                });

                const totalComisionesB2B = totalPvp - totalVenta;
                const nuestraGanancia = totalVenta - totalNeto;
                
                return (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-zinc-850">
                      <span className="font-semibold text-zinc-400 uppercase text-[9.5px] tracking-wider">Total Venta Final (PVP)</span>
                      <span className="font-black text-lg text-white">{formatDualCurrency(totalPvp, jur, currentExchangeRate)}</span>
                    </div>

                      <div className="flex items-center justify-between py-2 border-b border-zinc-850 text-amber-400 font-semibold">
                        <span>Comisión Retenida B2B</span>
                        <span>-{formatCurrency(totalComisionesB2B, "USD")}</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-zinc-850">
                        <span className="text-zinc-450">Total a Cobrar B2B (Monto Facturado)</span>
                        <span className="font-black text-base text-zinc-100">{formatDualCurrency(totalVenta, jur, currentExchangeRate)}</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-zinc-850">
                        <span className="text-zinc-400">Costo Neto Mayorista (a Pagar)</span>
                        <span className="font-bold text-zinc-250">{formatCurrency(totalNeto, "USD")}</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-zinc-850">
                        <span className="text-zinc-400">Margen de Utilidad Propio</span>
                        <span className="font-extrabold text-emerald-400">+{formatCurrency(nuestraGanancia, "USD")}</span>
                      </div>

                      <div className="flex items-center justify-between py-1 text-[9.5px] text-zinc-500 font-mono">
                        <span>Rentabilidad Mayorista:</span>
                        <span>{totalNeto > 0 ? Math.round((nuestraGanancia / totalNeto) * 100) : 0}% de margen</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Historial de Variaciones y Ajustes como Línea de Tiempo */}
              {activeRes.variaciones && activeRes.variaciones.length > 0 && (
                <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
                  <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest border-b border-zinc-150 pb-2 flex items-center gap-1.5 text-zinc-650">
                    <Activity className="w-4 h-4 text-zinc-500" /> Línea de Tiempo Contable
                  </h4>
                  
                  {/* Timeline layout */}
                  <div className="relative pl-5 border-l-2 border-zinc-150 ml-1.5 space-y-4 py-1 text-left">
                    {activeRes.variaciones.map((v, idx) => {
                      const isSupplement = v.type === "Suplemento";
                      return (
                        <div key={v.id || idx} className="relative">
                          {/* Dot marker */}
                          <span className={`absolute -left-[26px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                            isSupplement ? "bg-amber-500" : "bg-red-500"
                          }`} />
                          
                          <div className="space-y-0.5 text-xs">
                            <div className="flex justify-between items-center">
                              <span className={`px-1.5 py-0.25 rounded text-[8px] font-black uppercase tracking-wider ${
                                isSupplement ? "bg-amber-50 border border-amber-250 text-amber-700" : "bg-red-50 border border-red-200 text-red-750"
                              }`}>
                                {isSupplement ? "Suplemento" : "Crédito"}
                              </span>
                              <span className="font-mono text-[9px] text-zinc-400 font-semibold">{v.date}</span>
                            </div>
                            <p className="text-[11px] text-zinc-800 leading-tight font-bold mt-1">{v.reason}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1 font-semibold">
                              <span>Monto Venta:</span>
                              <span className={`font-mono font-black ${isSupplement ? "text-amber-600" : "text-emerald-700"}`}>
                                {isSupplement ? "+" : ""}${v.amountSale.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-zinc-300">|</span>
                              <span>Neto:</span>
                              <span className="font-mono font-bold text-zinc-650">
                                {isSupplement ? "+" : ""}${v.amountNet.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {activeExpedienteTab === "administracion" && !activeRes && (
            <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-zinc-500 text-xs font-semibold flex flex-col items-center gap-2">
              <Clock className="w-5 h-5 text-zinc-400" />
              Esta información estará disponible después de guardar el expediente.
            </div>
          )}

          {activeExpedienteTab === "administracion" && activeRes && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Acciones del Expediente */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3 shadow-xs lg:col-span-2">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest block text-zinc-650 border-b border-zinc-150 pb-2">Acciones del Expediente</h4>
                <div className="flex flex-wrap items-center gap-2">
                  {activeRes.status !== "Cancelada" ? (
                    <button
                      onClick={() => {
                        showConfirm({
                          title: "Anular Expediente de Reserva",
                          message: "Escriba el Localizador exacto para confirmar la anulación. El expediente cambiará a estado Cancelada.",
                          requireInputToConfirm: activeRes.id,
                          type: "danger",
                          confirmText: "Sí, Anular",
                          onConfirm: () => {
                            if (onUpdateReservation) {
                              onUpdateReservation({ ...activeRes, status: "Cancelada" });
                              showAlert({ title: "Expediente Anulado", message: "El expediente ha sido anulado correctamente.", type: "success" });
                            }
                          }
                        });
                      }}
                      className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 rounded text-red-600 font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1"
                      title="Anular Expediente"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Anular</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          showConfirm({
                            title: "Reactivar Expediente",
                            message: "¿Está seguro que desea reactivar este expediente? Volverá al estado Pendiente de Pago.",
                            type: "warning",
                            confirmText: "Sí, Reactivar",
                            onConfirm: () => {
                              if (onUpdateReservation) {
                                onUpdateReservation({ ...activeRes, status: "Pendiente de Pago" });
                                showAlert({ title: "Expediente Reactivado", message: "El expediente ha sido devuelto al estado Pendiente de Pago.", type: "success" });
                              }
                            }
                          });
                        }}
                        className="px-3 py-1.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded text-amber-700 font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1"
                        title="Reactivar Expediente"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Reactivar</span>
                      </button>
                      <button
                        onClick={() => {
                          showConfirm({
                            title: "Eliminar Permanentemente",
                            message: "Esta acción no se puede deshacer. El expediente y sus traslados serán eliminados de la base de datos de manera definitiva, liberando su identificador.",
                            requireInputToConfirm: activeRes.id,
                            type: "danger",
                            confirmText: "Sí, Eliminar Permanentemente",
                            onConfirm: () => {
                              if (onDeleteReservation) {
                                onDeleteReservation(activeRes.id);
                                showAlert({ title: "Expediente Eliminado", message: "El expediente ha sido eliminado de forma permanente.", type: "success" });
                                setViewLevel(1);
                              }
                            }
                          });
                        }}
                        className="px-3 py-1.5 border border-red-300 bg-red-100 hover:bg-red-200 rounded text-red-700 font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1"
                        title="Eliminar Permanente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Permanente</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Tipo de Expediente y Facturación */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest block text-zinc-650">Estado del Expediente</h4>
                {activeRes.tipo === "Cotización" ? (
                  <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs rounded font-semibold leading-relaxed flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span>Este expediente es una <strong>Cotización (Presupuesto)</strong>. Se confirma automáticamente como Reserva Real al enviarlo a facturación.</span>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs rounded font-semibold leading-relaxed flex items-center gap-2">
                    <FileCheck className="w-4.5 h-4.5 text-emerald-600" />
                    <span>Este expediente es una <strong>Reserva Real Confirmada</strong>.</span>
                  </div>
                )}

                <div className="space-y-3">
                    {/* Billed breakdown */}
                    {(() => {
                      const services = activeRes.servicios || [];
                      const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto);
                      
                      const unsentAdjustments = (activeRes.variaciones || []).filter(v => (v.type === "Suplemento" || v.type === "Credito") && v.status === "Borrador" && !v.invoiceId);
                      const sentAdjustments = (activeRes.variaciones || []).filter(v => (v.type === "Suplemento" || v.type === "Credito") && v.status === "Solicitado" && !v.invoiceId);

                      const billedCount = services.filter(s => s.statusFacturacion === "Facturado").length +
                                         jointFlights.filter(b => b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "PagadoAerolinea").length;

                      const totalCount = services.length + jointFlights.length;

                      const hasPending = services.some(s => s.statusFacturacion !== "Facturado") ||
                                         jointFlights.some(b => b.expedienteAereo?.status !== "Facturado" && b.expedienteAereo?.status !== "PagadoAerolinea") ||
                                         unsentAdjustments.length > 0 || sentAdjustments.length > 0;

                      return (
                        <div className="space-y-3 text-xs font-semibold">
                          <div className="flex justify-between text-[11px] text-zinc-655">
                            <span>Estado Facturación:</span>
                            <span className={hasPending ? "text-amber-700 font-bold" : "text-emerald-700 font-extrabold"}>
                              {hasPending ? "Pendiente por Facturar" : "Totalmente Facturado"}
                            </span>
                          </div>

                          {(() => {
                            const hasBorradorOrRechazado = services.some(s => s.statusFacturacion === "Borrador" || s.statusFacturacion === "Rechazado" || s.statusFacturacion === undefined) ||
                                                           jointFlights.some(b => !b.expedienteAereo || b.expedienteAereo.status === "Borrador" || b.expedienteAereo.status === undefined) ||
                                                           unsentAdjustments.length > 0;
                            const hasSolicitado = services.some(s => s.statusFacturacion === "Solicitado") ||
                                                  jointFlights.some(b => b.expedienteAereo?.status === "Solicitado") ||
                                                  sentAdjustments.length > 0;

                            const billedServices = services.filter(s => s.statusFacturacion === "Facturado");
                            const billedFlights = jointFlights.filter(b => b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "PagadoAerolinea");

                            const pendingServices = services.filter(s => s.statusFacturacion === "Solicitado");
                            const pendingFlights = jointFlights.filter(b => b.expedienteAereo?.status === "Solicitado");

                            const unsentServices = services.filter(s => s.statusFacturacion === "Borrador" || s.statusFacturacion === "Rechazado" || s.statusFacturacion === undefined);
                            const unsentFlights = jointFlights.filter(b => !b.expedienteAereo || b.expedienteAereo.status === "Borrador" || b.expedienteAereo.status === undefined);
                            const pendingTotal = unsentServices.reduce((sum, s) => sum + s.precioVenta, 0) + unsentFlights.reduce((sum, b) => sum + b.precioVenta, 0)
                              + unsentAdjustments.reduce((sum, v) => sum + v.amountSale, 0);

                            return (
                              <div className="space-y-3 text-xs font-semibold">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] text-zinc-655">
                                    <span>Servicios/Vuelos Facturados:</span>
                                    <span className="text-emerald-700 font-extrabold">{billedServices.length + billedFlights.length} / {services.length + jointFlights.length}</span>
                                  </div>
                                  {hasSolicitado && (
                                    <div className="flex justify-between text-[11px] text-zinc-655">
                                      <span>En Revisión Facturación:</span>
                                      <span className="text-blue-700 font-extrabold">{pendingServices.length + pendingFlights.length + sentAdjustments.length}</span>
                                    </div>
                                  )}
                                  {hasBorradorOrRechazado && (
                                    <div className="flex justify-between text-[11px] text-zinc-655">
                                      <span>Pendientes de Enviar:</span>
                                      <span className="text-amber-700 font-extrabold">{unsentServices.length + unsentFlights.length + unsentAdjustments.length} (${pendingTotal} USD)</span>
                                    </div>
                                  )}
                                </div>

                                {hasBorradorOrRechazado && (
                                  <button
                                    onClick={handleOpenSendBillingModal}
                                    className="w-full py-2 px-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    Enviar a Facturación
                                  </button>
                                )}

                                {!hasBorradorOrRechazado && hasSolicitado && (
                                  <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 text-center rounded text-[10.5px] uppercase font-bold flex items-center justify-center gap-1.5">
                                    <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                                    Esperando Aprobación de Facturación
                                  </div>
                                )}

                                {!hasBorradorOrRechazado && !hasSolicitado && (
                                  <div className="p-2.5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-center rounded text-[10.5px] uppercase font-bold flex items-center justify-center gap-1.5">
                                    <FileCheck className="w-4.5 h-4.5 text-emerald-600" />
                                    Totalmente Facturado
                                  </div>
                                )}
                              </div>
                            );
                          })()}                  </div>
                      );
                    })()}
                  </div>
              </div>

              {/* Status de Pago + Historial de Comprobantes del Cliente */}
              {(() => {
                const b2bPayment = getClientPaymentStatus(activeRes.id);
                const resInvoiceIds = (invoices || [])
                  .filter(inv => inv.clientName.includes(`Localizador ${activeRes.id}`) && inv.type === "Cobro")
                  .map(inv => inv.id);
                const clientVouchers = (vouchers || [])
                  .filter(v => v.locatorId === activeRes.id || (v.invoiceId && resInvoiceIds.includes(v.invoiceId)))
                  .sort((a, b) => (a.date < b.date ? 1 : -1));

                return (
                  <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-zinc-150 pb-2">
                      <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest text-zinc-650">Condición de Cobro B2B</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        activeRes.status === "Cancelada" ? "text-red-750 bg-red-50 border-red-200" : b2bPayment.color
                      }`}>
                        {activeRes.status === "Cancelada" ? "Anulado" : b2bPayment.status}
                      </span>
                    </div>

                    {clientVouchers.length === 0 ? (
                      <div className="py-4 text-center text-zinc-400 italic text-[11px]">
                        No se han registrado pagos del cliente para este expediente.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-150">
                        {clientVouchers.map(v => (
                          <div key={v.id} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10.5px] font-mono font-bold text-zinc-700 truncate">{v.reference}</span>
                                <span className={`px-1.5 py-0.25 rounded-full border text-[8px] font-bold uppercase ${
                                  v.status === "Verificado" ? "bg-emerald-50 text-emerald-700 border-emerald-250" :
                                  v.status === "Rechazado" ? "bg-red-50 text-red-750 border-red-200" :
                                  "bg-amber-50 text-amber-700 border-amber-250"
                                }`}>
                                  {v.status}
                                </span>
                              </div>
                              <p className="text-[9.5px] text-zinc-450 font-medium truncate">
                                {v.method}{v.bankName ? ` (${v.bankName})` : ""} · {formatDate(v.date)}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-2 shrink-0">
                              <span className="font-mono font-black text-xs text-zinc-900">
                                ${v.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                              </span>
                              <button
                                type="button"
                                onClick={() => { setSelectedVoucherForReceipt(v); setShowClientReceiptModal(true); }}
                                className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950 rounded cursor-pointer transition-all border border-transparent hover:border-zinc-200"
                                title="Ver comprobante adjunto"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeRes.status === "Cancelada" && (
                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-750 text-[10.5px] rounded font-semibold leading-relaxed">
                        Expediente anulado. No se procesarán nuevas transacciones de cobro.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Resumen de Salud Financiera (Widget de Conciliación) */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest border-b border-zinc-150 pb-2 flex items-center gap-1.5 text-zinc-600">
                  🛡️ Estado de Caja y Saldos
                </h4>
                {(() => {
                  const resInvoices = invoices.filter(inv => inv.clientName.includes(`Localizador ${activeRes.id}`) && inv.type === "Cobro");
                  // FAC- (regular invoices) and SUP- (suplementos facturados vía "Facturar Suplemento")
                  // represent cash collected; NC- (credits) and ABO- (wallet transfers) are excluded
                  const isCollectibleInvoice = (inv: FinancialInvoice) => inv.id.startsWith("FAC-") || inv.id.startsWith("SUP-");
                  const paidInvoicesTotal = resInvoices
                    .filter(inv => inv.status === "Pagado" && isCollectibleInvoice(inv))
                    .reduce((sum, inv) => sum + inv.amount, 0);
                  const unpaidFacIds = resInvoices.filter(inv => inv.status !== "Pagado" && isCollectibleInvoice(inv)).map(inv => inv.id);
                  // Vouchers on unpaid FAC invoices count as partial collections. Vouchers already
                  // tied to a fully "Pagado" invoice must NOT be counted here too — their amount is
                  // already included in paidInvoicesTotal above, so only vouchers without an
                  // invoiceId (not yet imputed to any specific invoice) fall back to the locator match.
                  const partialVerifiedVouchers = (vouchers || []).filter(v =>
                    v.status === "Verificado" &&
                    ((!v.invoiceId && v.locatorId === activeRes.id) || (v.invoiceId && unpaidFacIds.includes(v.invoiceId)))
                  );
                  const totalCobrado = Math.max(0, paidInvoicesTotal + partialVerifiedVouchers.reduce((sum, v) => sum + v.amount, 0));
                  // Este cuadro refleja el estado de cobro de lo YA facturado a la agencia — no de servicios
                  // nuevos que todavía están en borrador/pendientes de enviar a Facturación. Si se incluyera
                  // el total completo de la reserva, agregar un servicio nuevo (sin facturar aún) desalinearía
                  // "Ajustes" (que solo registra modificaciones de servicios ya facturados) con el total mostrado.
                  const billedJointFlights = boletos.filter(b =>
                    b.expedienteId === activeRes.id && b.facturarConjunto &&
                    (b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "PagadoAerolinea")
                  );
                  // Suplementos still pending manual approval ("Facturar Suplemento" en Facturación,
                  // sin invoiceId todavía) no deben contarse como ya facturados/cobrables — el precio
                  // del servicio ya refleja el monto nuevo, pero el cobro al cliente sigue pendiente.
                  const pendingSupplementTotal = (activeRes.variaciones || [])
                    .filter(v => v.type === "Suplemento" && !v.invoiceId)
                    .reduce((sum, v) => sum + v.amountSale, 0);
                  const billedTotal = (activeRes.servicios || [])
                    .filter(s => s.statusFacturacion === "Facturado")
                    .reduce((sum, s) => sum + s.precioVenta, 0)
                    + billedJointFlights.reduce((sum, b) => sum + b.precioVenta, 0)
                    - pendingSupplementTotal;
                  const adjustments = (activeRes.variaciones || [])
                    .filter(v => v.type !== "Suplemento" || v.invoiceId)
                    .reduce((sum, v) => sum + v.amountSale, 0);
                  const originalPrice = billedTotal - adjustments;
                  const pctCobrado = billedTotal > 0 ? Math.min(100, Math.round((totalCobrado / billedTotal) * 100)) : 0;

                  return (
                    <div className="space-y-3.5">
                      {/* KPIs */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-zinc-50 border border-zinc-150 rounded p-2.5 text-left">
                          <span className="text-[9px] uppercase font-bold text-zinc-400 block">Precio Original</span>
                          <span className="font-mono text-zinc-700 font-bold block mt-0.5">${originalPrice.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-150 rounded p-2.5 text-left">
                          <span className="text-[9px] uppercase font-bold text-zinc-400 block">Ajustes (Modif.)</span>
                          <span className={`font-mono font-bold block mt-0.5 ${adjustments >= 0 ? "text-amber-600" : "text-emerald-700"}`}>
                            {adjustments >= 0 ? "+" : ""}${adjustments.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-600">
                          <span>Total Cobrado (${totalCobrado.toFixed(2)})</span>
                          <span>{pctCobrado}%</span>
                        </div>
                        <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden border border-zinc-200">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              pctCobrado === 100 ? "bg-emerald-600" : "bg-amber-500"
                            }`}
                            style={{ width: `${pctCobrado}%` }}
                          />
                        </div>
                      </div>

                      {/* Pending to collect */}
                      <div className="flex justify-between items-center bg-zinc-50 border border-zinc-150 rounded p-2.5">
                        <span className="text-[10px] font-bold text-zinc-500">Saldo Pendiente de Cobro:</span>
                        <span className={`font-mono font-black text-sm ${pctCobrado === 100 ? "text-emerald-700" : "text-red-600 animate-pulse"}`}>
                          ${Math.max(0, billedTotal - totalCobrado).toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Liquidación a Proveedores */}
              {(() => {
                const resObligations = (payableObligations || []).filter(o => o.locatorId === activeRes.id);
                const totalNeto = resObligations.reduce((s, o) => s + o.netCost, 0);
                const totalAbonado = resObligations.reduce((s, o) => s + o.paidAmount, 0);
                const totalPendiente = totalNeto - totalAbonado;

                const oblStatusInfo = (o: any) => {
                  if (o.isFrozen || o.status === "Congelado") return { label: "Congelado", color: "text-red-700 bg-red-50 border-red-200" };
                  if (o.status === "Pagado Total") return { label: "Pagado", color: "text-emerald-700 bg-emerald-50 border-emerald-250" };
                  if (o.status === "Pagado Parcial") return { label: "Abono Parcial", color: "text-blue-700 bg-blue-50 border-blue-200" };
                  if (o.status === "Vencido") return { label: "Vencido", color: "text-red-750 bg-red-50 border-red-200" };
                  return { label: "Pendiente", color: "text-amber-700 bg-amber-50 border-amber-250" };
                };

                return (
                  <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3 shadow-xs text-left">
                    <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest border-b border-zinc-150 pb-2 text-zinc-650">
                      Liquidación a Proveedores
                    </h4>

                    {resObligations.length === 0 ? (
                      <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-550 text-[11px] rounded font-semibold leading-relaxed">
                        No hay obligaciones de costo neto emitidas en Cuentas por Pagar para este expediente. Asegúrese de enviar a facturar y aprobar la reserva.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {resObligations.map(obl => {
                          const { label, color } = oblStatusInfo(obl);
                          const remaining = obl.netCost - obl.paidAmount;
                          return (
                            <div key={obl.id} className="border border-zinc-150 rounded-lg overflow-hidden">
                              {/* Provider header */}
                              <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 border-b border-zinc-150">
                                <span className="text-[10px] font-extrabold text-zinc-800 uppercase tracking-wide">{obl.providerName}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider border font-bold ${color}`}>{label}</span>
                              </div>
                              {/* Obligation detail */}
                              <div className="px-3 py-2.5 space-y-1.5 text-xs font-semibold">
                                <p className="text-[10px] text-zinc-500 leading-snug">{obl.serviceDetail}</p>
                                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10.5px]">
                                  <div className="text-center">
                                    <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Costo Neto</span>
                                    <span className="text-zinc-800 font-black">{formatCurrency(obl.netCost, obl.currency || "USD")}</span>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Abonado</span>
                                    <span className="text-emerald-700 font-black">{formatCurrency(obl.paidAmount, obl.currency || "USD")}</span>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Pendiente</span>
                                    <span className={`font-black ${remaining > 0 ? "text-red-600" : remaining < 0 ? "text-emerald-700" : "text-zinc-400"}`}>
                                      {remaining < 0 ? "-" : ""}{formatCurrency(Math.abs(remaining), obl.currency || "USD")}
                                    </span>
                                  </div>
                                </div>
                                {obl.attachedFile && (
                                  <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between">
                                    <span className="font-mono text-[10px] text-zinc-600 truncate max-w-[160px]" title={obl.attachedFile}>
                                      {obl.attachedFile}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => { setSelectedObligationForReceipt(obl); setShowProvReceiptModal(true); }}
                                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                                    >
                                      <Download className="w-3 h-3" /> Ver
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Totals row — only shown when there are multiple obligations */}
                        {resObligations.length > 1 && (
                          <div className="border-t border-zinc-200 pt-2 grid grid-cols-3 gap-2 text-center font-mono text-[10.5px]">
                            <div>
                              <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Total Neto</span>
                              <span className="text-zinc-800 font-black">{formatCurrency(totalNeto, "USD")}</span>
                            </div>
                            <div>
                              <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Total Abonado</span>
                              <span className="text-emerald-700 font-black">{formatCurrency(totalAbonado, "USD")}</span>
                            </div>
                            <div>
                              <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Total Pendiente</span>
                              <span className={`font-black ${totalPendiente > 0 ? "text-red-600" : totalPendiente < 0 ? "text-emerald-700" : "text-zinc-400"}`}>
                                {totalPendiente < 0 ? "-" : ""}{formatCurrency(Math.abs(totalPendiente), "USD")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
          )}

          {activeExpedienteTab === "datosGenerales" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              {/* Datos Generales / Cabecera */}
              <fieldset disabled={expedienteMode === "view"} className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs border-0 min-w-0">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest border-b border-zinc-150 pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" /> Datos Generales del Expediente
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Pasajero Titular</label>
                    <div className="w-full p-2.5 border border-zinc-200 bg-zinc-50 rounded text-xs font-bold text-zinc-900 flex items-center justify-between gap-2">
                      <span className={cartHolder ? "" : "text-zinc-400 font-semibold"}>{cartHolder || "Agregue pasajeros para definir el titular"}</span>
                      {expedienteMode !== "view" && (
                        <button
                          type="button"
                          onClick={() => setActiveExpedienteTab("pasajeros")}
                          className="text-[9px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-900 cursor-pointer whitespace-nowrap"
                        >
                          Ir a Pasajeros
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Mercado Objetivo</label>
                    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-md border border-zinc-200">
                      <button
                        type="button"
                        onClick={() => setCartMercado("NACIONAL")}
                        className={`flex-1 py-1.5 px-3 rounded text-xs font-bold whitespace-nowrap transition-all cursor-pointer text-center ${
                          cartMercado === "NACIONAL"
                            ? "bg-zinc-950 text-white shadow-xs"
                            : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        Nacional
                      </button>
                      <button
                        type="button"
                        onClick={() => setCartMercado("INTERNACIONAL")}
                        className={`flex-1 py-1.5 px-3 rounded text-xs font-bold whitespace-nowrap transition-all cursor-pointer text-center ${
                          cartMercado === "INTERNACIONAL"
                            ? "bg-zinc-950 text-white shadow-xs"
                            : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        Internacional
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Canal de Venta</label>
                    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-md border border-zinc-200">
                      <button
                        type="button"
                        onClick={() => {
                          setCartCanalVenta("B2B");
                          setCartClienteDirectoId("");
                          setDirectClientSearch("");
                          setSelectedDirectClient(null);
                        }}
                        className={`flex-1 py-1.5 px-3 rounded text-xs font-bold whitespace-nowrap transition-all cursor-pointer text-center ${
                          cartCanalVenta === "B2B"
                            ? "bg-zinc-950 text-white shadow-xs"
                            : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        Agencia B2B
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCartCanalVenta("Directo");
                          setCartAgencia("");
                          setAgencySearch("");
                          setSelectedClient(null);
                        }}
                        className={`flex-1 py-1.5 px-3 rounded text-xs font-bold whitespace-nowrap transition-all cursor-pointer text-center ${
                          cartCanalVenta === "Directo"
                            ? "bg-zinc-950 text-white shadow-xs"
                            : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        Cliente Directo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fechas de estadía en la cabecera */}
                <DateRangePicker
                  checkIn={cartCheckIn}
                  checkOut={cartCheckOut}
                  onChange={(ci, co) => { setCartCheckIn(ci); setCartCheckOut(co); }}
                  checkInLabel="Fecha Check-In General"
                  checkOutLabel="Fecha Check-Out General"
                  required
                />


                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5 md:col-span-2 relative">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                      {cartCanalVenta === "Directo" ? "Cliente Directo" : "Agencia de Origen B2B"}
                    </label>

                    {cartCanalVenta === "Directo" ? (
                    <>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar cliente directo por nombre, cédula o teléfono..."
                        className="w-full p-2.5 pl-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                        value={directClientSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDirectClientSearch(val);
                          const matched = directClients.find(c => c.nombre.toLowerCase() === val.toLowerCase());
                          setSelectedDirectClient(matched || null);
                          setCartClienteDirectoId(matched?.id || "");
                          if (matched) applyDirectClientContact(matched);
                          setShowDirectClientDropdown(true);
                        }}
                        onFocus={() => setShowDirectClientDropdown(true)}
                      />
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      {directClientSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setDirectClientSearch("");
                            setSelectedDirectClient(null);
                            setCartClienteDirectoId("");
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-100 rounded text-zinc-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Backdrop to close list */}
                    {showDirectClientDropdown && (
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDirectClientDropdown(false)}
                      />
                    )}

                    {/* Filtered options dropdown */}
                    {showDirectClientDropdown && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-zinc-150">
                        {directClients.filter(c => {
                          const query = directClientSearch.toLowerCase();
                          return (
                            c.nombre.toLowerCase().includes(query) ||
                            (c.cedula || "").toLowerCase().includes(query) ||
                            c.id.toLowerCase().includes(query) ||
                            (c.telefono || "").toLowerCase().includes(query)
                          );
                        }).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setDirectClientSearch(c.nombre);
                              setSelectedDirectClient(c);
                              setCartClienteDirectoId(c.id);
                              applyDirectClientContact(c);
                              setShowDirectClientDropdown(false);
                            }}
                            className="w-full text-left p-3 hover:bg-zinc-50 flex items-center justify-between text-xs transition-colors cursor-pointer border-none font-sans"
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-zinc-900 block">{c.nombre}</span>
                              <span className="text-[10px] text-zinc-400 font-mono block">
                                Cod: {c.id} {c.cedula ? `| Cédula: ${c.cedula}` : ""}
                              </span>
                              <span className="text-[9.5px] text-zinc-450 font-medium block truncate max-w-[280px] sm:max-w-md">
                                {c.telefono} {c.email && c.email !== "N/A" ? `| ${c.email}` : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-zinc-100 border border-zinc-200 text-zinc-700">
                                {c.tipo}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                c.status === "Activo"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : c.status === "Lista Negra"
                                  ? "bg-red-50 border-red-200 text-red-700"
                                  : "bg-zinc-50 border-zinc-200 text-zinc-500"
                              }`}>
                                {c.status}
                              </span>
                            </div>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setShowDirectClientDropdown(false);
                            setNewDirectClientForm(f => ({ ...f, nombre: directClientSearch }));
                            setShowNewDirectClientModal(true);
                          }}
                          className="w-full text-left p-3 hover:bg-zinc-50 flex items-center gap-1.5 text-xs font-bold text-zinc-700 cursor-pointer border-none font-sans"
                        >
                          <Plus className="w-3.5 h-3.5" /> Nuevo Cliente Directo{directClientSearch ? `: "${directClientSearch}"` : ""}
                        </button>
                      </div>
                    )}

                    {/* Warnings */}
                    {selectedDirectClient && selectedDirectClient.status === "Lista Negra" && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-750 text-[10px] rounded font-bold flex items-center gap-1.5 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 text-red-650" />
                        <span>ADVERTENCIA: Este cliente está en la LISTA NEGRA.</span>
                      </div>
                    )}
                    {selectedDirectClient && selectedDirectClient.moroso && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-250 text-amber-850 text-[10px] rounded font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>ALERTA DE MORA: Cliente con saldo vencido (${selectedDirectClient.saldoDeber.toLocaleString("es-ES")} USD).</span>
                      </div>
                    )}
                    </>
                    ) : (
                    <>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar agencia B2B por nombre..."
                        className="w-full p-2.5 pl-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                        value={agencySearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAgencySearch(val);
                          setCartAgencia(val);
                          const matched = clients.find(c => c.nombre.toLowerCase() === val.toLowerCase());
                          setSelectedClient(matched || null);
                          setShowAgencyDropdown(true);
                        }}
                        onFocus={() => setShowAgencyDropdown(true)}
                      />
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      {agencySearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setAgencySearch("");
                            setCartAgencia("");
                            setSelectedClient(null);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-100 rounded text-zinc-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Backdrop to close list */}
                    {showAgencyDropdown && (
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowAgencyDropdown(false)}
                      />
                    )}

                    {/* Filtered options dropdown */}
                    {showAgencyDropdown && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-zinc-150">
                        {clients.filter(c => {
                          const query = agencySearch.toLowerCase();
                          return (
                            c.nombre.toLowerCase().includes(query) ||
                            c.rif.toLowerCase().includes(query) ||
                            c.id.toLowerCase().includes(query) ||
                            (c.email || "").toLowerCase().includes(query) ||
                            (c.contactoNombre || "").toLowerCase().includes(query)
                          );
                        }).length === 0 ? (
                          <div className="p-3 text-xs text-zinc-400 italic">
                            Ninguna agencia coincide. Se registrará como "{agencySearch || 'Manual'}".
                          </div>
                        ) : (
                          clients.filter(c => {
                            const query = agencySearch.toLowerCase();
                            return (
                              c.nombre.toLowerCase().includes(query) ||
                              c.rif.toLowerCase().includes(query) ||
                              c.id.toLowerCase().includes(query) ||
                              (c.email || "").toLowerCase().includes(query) ||
                              (c.contactoNombre || "").toLowerCase().includes(query)
                            );
                          }).map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setCartAgencia(c.nombre);
                                setAgencySearch(c.nombre);
                                setSelectedClient(c);
                                setShowAgencyDropdown(false);
                              }}
                              className="w-full text-left p-3 hover:bg-zinc-50 flex items-center justify-between text-xs transition-colors cursor-pointer border-none font-sans"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-zinc-900 block">{c.nombre}</span>
                                <span className="text-[10px] text-zinc-400 font-mono block">
                                  Cod: {c.id} | RIF: {c.rif}
                                </span>
                                <span className="text-[9.5px] text-zinc-450 font-medium block truncate max-w-[280px] sm:max-w-md">
                                  Contacto: {c.contactoNombre} | {c.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-zinc-100 border border-zinc-200 text-zinc-700">
                                  {c.tipo}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                  c.status === "Activo" 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                    : c.status === "Lista Negra"
                                    ? "bg-red-50 border-red-200 text-red-700"
                                    : "bg-zinc-50 border-zinc-200 text-zinc-500"
                                }`}>
                                  {c.status}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {/* Warnings */}
                    {selectedClient && selectedClient.status === "Lista Negra" && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-750 text-[10px] rounded font-bold flex items-center gap-1.5 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 text-red-650" />
                        <span>ADVERTENCIA: Esta agencia está en la LISTA NEGRA.</span>
                      </div>
                    )}
                    {selectedClient && selectedClient.moroso && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-250 text-amber-850 text-[10px] rounded font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>ALERTA DE MORA: Agencia con saldo vencido (${selectedClient.saldoDeber.toLocaleString("es-ES")} USD).</span>
                      </div>
                    )}
                    </>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Teléfono Contacto</label>
                    <input
                      type="text"
                      placeholder="+34 91..."
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={cartTelefono}
                      onChange={(e) => setCartTelefono(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Email de Notificación</label>
                    <input
                      type="email"
                      placeholder="reservas@agencia.com"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={cartEmail}
                      onChange={(e) => setCartEmail(e.target.value)}
                    />
                  </div>
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Localizador del Proveedor (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: ABC123 (si se compró a través de otro mayorista)"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={cartLocalizadorProveedor}
                      onChange={(e) => setCartLocalizadorProveedor(e.target.value)}
                    />
                    <p className="text-[9.5px] text-zinc-400">Su propio número de reserva, para referencia y búsqueda.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Peticiones / Instrucciones Terrestres</label>
                    <input
                      type="text"
                      placeholder="Ej: Alérgenos, cunas, traslados prioritarios..."
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={cartSpecialRequests}
                      onChange={(e) => setCartSpecialRequests(e.target.value)}
                    />
                  </div>
                </div>

                {/* ── BOLETO AÉREO VINCULADO ──────────────────────────────── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5" />
                      Boletos Aéreos Vinculados ({cartLinkedFlights.length})
                    </label>
                  </div>

                  <div className="space-y-3">
                    {cartLinkedFlights.map(linked => {
                      const b = boletos.find(x => x.id === linked.id);
                      if (!b) return null;
                      const ruta = buildRoute(b.segmentos);
                      const primerSeg = b.segmentos[0];
                      return (
                        <div key={b.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded flex flex-col gap-3 relative">
                          <button
                            type="button"
                            onClick={() => setCartLinkedFlights(prev => prev.filter(f => f.id !== b.id))}
                            className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Desvincular"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="flex items-center justify-between pr-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center flex-shrink-0">
                                <Plane className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-emerald-800 font-mono">{b.pnr} — {ruta}</p>
                                <p className="text-[10px] text-emerald-600 font-medium">
                                  {(b.pasajeros?.map ? b.pasajeros : []).map(p => p.nombre.split("/")[0]).join(" · ")} · {primerSeg ? formatGDSDate(primerSeg.fecha) : ""}
                                </p>
                              </div>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 mt-1 cursor-pointer w-max">
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600"
                              checked={linked.facturarConjunto}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setCartLinkedFlights(prev => prev.map(f => f.id === b.id ? { ...f, facturarConjunto: checked } : f));
                              }}
                            />
                            <span className="text-[10px] font-bold text-emerald-800">
                              Facturar conjuntamente con esta reserva terrestre (Unifica precios y voucher)
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setBoletoSearch(""); setShowBoletoDrawer(true); }}
                    className="w-full flex items-center justify-between p-3 border border-dashed border-zinc-300 rounded hover:border-zinc-500 hover:bg-zinc-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-700 transition-colors">
                      <Plus className="w-4 h-4" />
                      <span className="text-xs font-semibold">
                        Vincular vuelo existente...
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                  </button>
                </div>
              </fieldset>
            </div>
            {expedienteMode !== "view" && (
            <div className="lg:col-span-4 space-y-6">
              {/* Totalizadores de Carrito */}
              <div className="bg-zinc-900 text-white rounded-lg p-5 space-y-4 shadow-md">
                <h4 className="font-extrabold text-white text-xs uppercase tracking-widest border-b border-zinc-800 pb-2">
                  Cotización Mayorista (Carrito)
                </h4>

                {(() => {
                  let totalNeto = cartServices.reduce((sum, s) => sum + s.precioNeto, 0);
                  let totalVenta = cartServices.reduce((sum, s) => sum + s.precioVenta, 0);

                  const targetResId = isEditingReservationId || cartId;
                  const jointFlightsToRender = cartLinkedFlights.filter(f => f.facturarConjunto).map(f => boletos.find(b => b.id === f.id)).filter(Boolean) as FlightTicket[];

                  jointFlightsToRender.forEach(f => {
                    totalNeto += f.costoNeto;
                    totalVenta += f.precioVenta;
                  });

                  const totalMargen = totalVenta - totalNeto;
                  const ratioMargen = totalNeto > 0 ? Math.round((totalMargen / totalNeto) * 100) : 0;
                  
                  return (
                    <div className="space-y-3.5 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                        <span className="text-zinc-400 uppercase text-[9.5px]">Total Venta B2B PVP</span>
                        <span className="font-black text-xl text-white">${totalVenta.toLocaleString("es-ES")} USD</span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                        <span className="text-zinc-400">Total Costo Neto</span>
                        <span className="font-bold text-zinc-300">${totalNeto.toLocaleString("es-ES")} USD</span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                        <span className="text-zinc-450">Margen Mayorista Directo</span>
                        <span className="font-bold text-emerald-400">+${totalMargen.toLocaleString("es-ES")} USD</span>
                      </div>

                      <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                        <span>Margen promedio:</span>
                        <span>{ratioMargen}% de recargo</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            )}
          </div>
          )}

          {activeExpedienteTab === "pasajeros" && (
            <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs max-w-3xl">
              <div className="flex items-center justify-between border-b border-zinc-150 pb-2">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest">Pasajeros del Expediente</h4>
                {expedienteMode !== "view" && (
                  <button
                    type="button"
                    onClick={handleAddPasajero}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[10.5px] font-bold uppercase cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Pasajero
                  </button>
                )}
              </div>

              {effectivePasajeros.length === 0 ? (
                <div className="p-4 bg-zinc-50 border border-zinc-200 text-zinc-500 text-xs rounded font-semibold text-center">
                  Aún no hay pasajeros cargados. {expedienteMode !== "view" && "Agregue al menos uno — el primero se marca automáticamente como titular."}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {(expedienteMode === "view" ? effectivePasajeros : cartPasajeros).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 border border-zinc-150 rounded-md p-3 bg-zinc-50/50">
                      {expedienteMode === "view" ? (
                        <>
                          <span className="flex-1 text-xs font-bold text-zinc-900">{p.nombre || "(sin nombre)"}</span>
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase">{p.tipo}</span>
                          {p.esTitular && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-zinc-900 text-white">Titular</span>
                          )}
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            required
                            placeholder="Nombre completo"
                            value={p.nombre}
                            onChange={(e) => handleUpdatePasajeroNombre(p.id, e.target.value)}
                            className="flex-1 p-2 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                          />
                          <select
                            value={p.tipo}
                            onChange={(e) => handleUpdatePasajeroTipo(p.id, e.target.value as PassengerType)}
                            className="p-2 border border-zinc-200 bg-white rounded text-[11px] font-bold text-zinc-700 cursor-pointer focus:outline-none"
                          >
                            <option value="Adulto">Adulto</option>
                            <option value="Niño">Niño</option>
                            <option value="Infante">Infante</option>
                          </select>
                          {p.esTitular ? (
                            <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase bg-zinc-900 text-white whitespace-nowrap">Titular</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetTitular(p.id)}
                              className="px-2 py-1 rounded-full text-[9px] font-bold uppercase bg-zinc-100 hover:bg-zinc-200 text-zinc-600 whitespace-nowrap cursor-pointer border-none"
                            >
                              Marcar Titular
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePasajero(p.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                            title="Quitar pasajero"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeExpedienteTab === "servicios" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <fieldset disabled={expedienteMode === "view"} className="border-0 p-0 m-0 min-w-0 space-y-6">
              {/* Carrito de Servicios */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-zinc-150 pb-2">
                  <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-zinc-500" /> Carrito de Servicios del Expediente
                  </h4>
                  <span className="text-[10px] font-bold text-zinc-450 uppercase">{cartServices.length} Servicios Agregados</span>
                </div>

                <div className="divide-y divide-zinc-200">
                  {cartServices.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 italic text-xs space-y-1">
                      <p>El carrito está vacío. Agrega al menos un servicio a continuación.</p>
                      <p className="text-[10px] text-zinc-300">Cada servicio configurado se abrirá en un nuevo nivel.</p>
                    </div>
                  ) : (
                    cartServices.map((item) => {
                      const sProfit = item.precioVenta - item.precioNeto;
                      return (
                        <div key={item.id} className="py-3 flex justify-between items-center gap-4 group">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-zinc-50 border border-zinc-200 text-zinc-700">
                                {item.tipo}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-400">{item.id}</span>
                            </div>
                            {item.tipo === ServiceType.ALOJAMIENTO && item.detalles?.lodgingRooms ? (
                              <div className="space-y-1 mt-1 text-xs">
                                <p className="font-bold text-zinc-900 leading-tight">
                                  {detailedProperties.find(p => p.id === item.detalles.hotelId)?.nombre || item.descripcion.split(" (")[0]?.replace("Hotel: ", "") || "Hotel"}
                                </p>
                                <p className="text-[9.5px] text-zinc-500 font-semibold font-mono text-left">
                                  IN: {item.detalles.checkInDate} / OUT: {item.detalles.checkOutDate} ({formatTarifaLabel(item.detalles, item.detalles.lodgingRooms[0]?.roomTypeId, cartMercado)})
                                </p>
                                <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-zinc-200">
                                  {item.detalles.lodgingRooms.map((room: any, rIdx: number) => {
                                    const rates = calculateRoomRates(room, item.detalles, cartMercado, ratePlans, roomTypes);
                                    const roomTypeName = roomTypes.find(rt => rt.id === room.roomTypeId)?.nombre || "Habitación";
                                    const guestsNames = room.guests
                                      ?.map((g: any) => `${g.name} (${g.type === "Adulto" ? "ADT" : "CHD"})`)
                                      .filter((str: string) => str.replace(/\s*\([^)]+\)/g, "").trim() !== "")
                                      .join(", ");
                                    return (
                                      <div key={room.id} className="text-[11px] flex justify-between items-start gap-2 py-0.5 border-b border-zinc-100 last:border-0">
                                        <div className="text-zinc-650 text-left">
                                          <span className="font-bold text-zinc-800">Hab {rIdx + 1}: {roomTypeName}</span>
                                          {guestsNames && <span className="block text-[10px] text-zinc-400 italic">Pasajeros: {guestsNames}</span>}
                                        </div>
                                        <div className="text-right flex-shrink-0 font-medium">
                                          <span className="font-bold text-zinc-900">${rates.sale.toLocaleString("es-ES")} USD</span>
                                          <span className="block text-[9.5px] text-zinc-400 font-normal">Neto: ${rates.net.toLocaleString("es-ES")} | PVP: ${rates.pvp.toLocaleString("es-ES")}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs font-bold text-zinc-900 leading-tight truncate">{item.descripcion}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 flex items-center gap-2">
                            <div>
                              <p className="text-xs font-black text-zinc-955">${item.precioVenta.toLocaleString("es-ES")} USD</p>
                              <p className="text-[9px] text-zinc-400 font-medium">Neto: ${item.precioNeto.toLocaleString("es-ES")} | Margen: +${sProfit.toLocaleString("es-ES")}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEditService(item)}
                              className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950 rounded cursor-pointer transition-all border border-transparent hover:border-zinc-200"
                              title="Editar Servicio"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveService(item.id)}
                              className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-655 rounded cursor-pointer transition-all border border-transparent hover:border-red-200"
                              title="Eliminar Servicio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {(() => {
                    const targetResId = isEditingReservationId || cartId;
                    const jointFlightsToRender = cartLinkedFlights.filter(f => f.facturarConjunto).map(f => boletos.find(b => b.id === f.id)).filter(Boolean) as FlightTicket[];
                    
                    return jointFlightsToRender.map(vuelo => {
                      const vProfit = vuelo.precioVenta - vuelo.costoNeto;
                      return (
                        <div key={vuelo.id} className="p-4 bg-blue-50/20 hover:bg-zinc-50 flex items-start gap-4 transition-colors group">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 border border-blue-200">
                            <Plane className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-750 text-[9px] font-black uppercase tracking-wider rounded border border-blue-200">
                                Boleto Aéreo GDS
                              </span>
                            </div>
                            <p className="text-xs font-bold text-zinc-900 leading-tight truncate">Itinerario Vuelo - PNR: {vuelo.pnr}</p>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                            <p className="text-[9px] text-zinc-400 font-bold uppercase block">Neto B2B a Cobrar</p>
                            <p className="text-sm font-black text-zinc-955">${vuelo.precioVenta.toLocaleString("es-ES")} USD</p>
                            <p className="text-[9px] text-zinc-500 font-medium">PVP: ${(vuelo.precioPvp || vuelo.precioVenta).toLocaleString("es-ES")} | Margen: <span className="text-emerald-600 font-bold">+${vProfit.toLocaleString("es-ES")}</span></p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Botonera de Agregar Servicios */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest border-b border-zinc-150 pb-2">
                  Añadir Servicio a esta Reserva
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {/* Alojamiento */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddService(ServiceType.ALOJAMIENTO)}
                    className="p-4 border border-zinc-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 hover:border-zinc-400 transition-all cursor-pointer text-center text-zinc-700 hover:text-zinc-950"
                  >
                    <Calendar className="w-6 h-6 text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Alojamiento</span>
                  </button>

                  {/* Traslado */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddService(ServiceType.TRASLADO)}
                    className="p-4 border border-zinc-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 hover:border-zinc-400 transition-all cursor-pointer text-center text-zinc-700 hover:text-zinc-950"
                  >
                    <Truck className="w-6 h-6 text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Traslados</span>
                  </button>

                  {/* Rent a Car */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddService(ServiceType.RENT_A_CAR)}
                    className="p-4 border border-zinc-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 hover:border-zinc-400 transition-all cursor-pointer text-center text-zinc-700 hover:text-zinc-950"
                  >
                    <Car className="w-6 h-6 text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Rent a Car</span>
                  </button>

                  {/* Seguro */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddService(ServiceType.SEGURO)}
                    className="p-4 border border-zinc-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 hover:border-zinc-400 transition-all cursor-pointer text-center text-zinc-700 hover:text-zinc-950"
                  >
                    <Shield className="w-6 h-6 text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Seguro de Viaje</span>
                  </button>

                  {/* Entrada Manual */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddService(ServiceType.MANUAL)}
                    className="p-4 border border-zinc-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 hover:border-zinc-400 transition-all cursor-pointer text-center text-zinc-700 hover:text-zinc-950"
                  >
                    <FileText className="w-6 h-6 text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Entrada Manual</span>
                  </button>

                  {/* Servicio Vario */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddService(ServiceType.SERVICIO_VARIO)}
                    className="p-4 border border-zinc-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 hover:border-zinc-400 transition-all cursor-pointer text-center text-zinc-700 hover:text-zinc-950"
                  >
                    <Compass className="w-6 h-6 text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Servicio Vario</span>
                  </button>
                </div>
              </div>
              </fieldset>
            </div>
            {expedienteMode !== "view" && (
            <div className="lg:col-span-4 space-y-6">
              {/* Totalizadores de Carrito */}
              <div className="bg-zinc-900 text-white rounded-lg p-5 space-y-4 shadow-md">
                <h4 className="font-extrabold text-white text-xs uppercase tracking-widest border-b border-zinc-800 pb-2">
                  Cotización Mayorista (Carrito)
                </h4>

                {(() => {
                  let totalNeto = cartServices.reduce((sum, s) => sum + s.precioNeto, 0);
                  let totalVenta = cartServices.reduce((sum, s) => sum + s.precioVenta, 0);

                  const targetResId = isEditingReservationId || cartId;
                  const jointFlightsToRender = cartLinkedFlights.filter(f => f.facturarConjunto).map(f => boletos.find(b => b.id === f.id)).filter(Boolean) as FlightTicket[];

                  jointFlightsToRender.forEach(f => {
                    totalNeto += f.costoNeto;
                    totalVenta += f.precioVenta;
                  });

                  const totalMargen = totalVenta - totalNeto;
                  const ratioMargen = totalNeto > 0 ? Math.round((totalMargen / totalNeto) * 100) : 0;
                  
                  return (
                    <div className="space-y-3.5 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                        <span className="text-zinc-400 uppercase text-[9.5px]">Total Venta B2B PVP</span>
                        <span className="font-black text-xl text-white">${totalVenta.toLocaleString("es-ES")} USD</span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                        <span className="text-zinc-400">Total Costo Neto</span>
                        <span className="font-bold text-zinc-300">${totalNeto.toLocaleString("es-ES")} USD</span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                        <span className="text-zinc-450">Margen Mayorista Directo</span>
                        <span className="font-bold text-emerald-400">+${totalMargen.toLocaleString("es-ES")} USD</span>
                      </div>

                      <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                        <span>Margen promedio:</span>
                        <span>{ratioMargen}% de recargo</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            )}
          </div>
          )}
        </div>
      )}


      {/* VIEW LEVEL 3: CONFIGURAR SERVICIO INDIVIDUAL */}
      {viewLevel === 3 && activeServiceType && (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 sticky top-16 bg-zinc-50/95 backdrop-blur-xs pt-2 z-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToCart}
                className="p-1.5 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer border border-zinc-200 bg-white"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-700" />
              </button>
              <div>
                <span className="text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider block">
                  {editingServiceId ? "Editar Servicio" : "Agregar Servicio"}
                </span>
                <h3 className="font-black text-lg text-zinc-900 uppercase font-sans">
                  {editingServiceId ? `Modificar: ${activeServiceType}` : `Configurar: ${activeServiceType}`}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBackToCart}
              className="px-3.5 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer bg-white"
            >
              Volver al Carrito
            </button>
          </div>

          {/* Formulario de Servicio */}
          <form onSubmit={handleSaveService} className="bg-white border border-zinc-200 rounded-lg p-6 space-y-5 shadow-sm">
            
            {/* --- FORMULARIO ESPECÍFICO SEGÚN TIPO DE SERVICIO --- */}

            {/* 1. ALOJAMIENTO */}
            {activeServiceType === ServiceType.ALOJAMIENTO && (
              <div className="space-y-5">
                {/* Fechas de estadía */}
                <DateRangePicker
                  checkIn={checkInDate}
                  checkOut={checkOutDate}
                  onChange={(ci, co) => { setCheckInDate(ci); setCheckOutDate(co); }}
                  checkInLabel="Fecha Check-In"
                  checkOutLabel="Fecha Check-Out"
                  required
                />

                {/* Hotel and Rate Plan selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Establecimiento / Hotel</label>
                    
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar hotel por nombre o código..."
                        className="w-full p-2.5 pl-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                        value={hotelSearchQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHotelSearchQuery(val);
                          const matched = detailedProperties.find(p => p.nombre.toLowerCase() === val.toLowerCase() || p.id.toLowerCase() === val.toLowerCase());
                          if (matched) {
                            setHotelId(matched.id);
                            setSelectedPromoName("");
                            setSelectedRatePlanId("");
                            const hotelRooms = roomTypes.filter(rt => rt.property_id === matched.id);
                            const defaultRoomTypeId = hotelRooms[0]?.id || "";
                            setLodgingRooms(prev => prev.map(room => ({ ...room, roomTypeId: defaultRoomTypeId })));
                          }
                          setShowHotelDropdown(true);
                        }}
                        onFocus={() => setShowHotelDropdown(true)}
                      />
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      {hotelSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setHotelSearchQuery("");
                            setHotelId("");
                            setSelectedPromoName("");
                            setSelectedRatePlanId("");
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-100 rounded text-zinc-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Backdrop */}
                    {showHotelDropdown && (
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowHotelDropdown(false)}
                      />
                    )}

                    {/* Filtered options dropdown */}
                    {showHotelDropdown && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-zinc-150">
                        {detailedProperties.filter(p => 
                          p.nombre.toLowerCase().includes(hotelSearchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(hotelSearchQuery.toLowerCase())
                        ).length === 0 ? (
                          <div className="p-3 text-xs text-zinc-400 italic">
                            Ningún hotel coincide.
                          </div>
                        ) : (
                          detailedProperties.filter(p => 
                            p.nombre.toLowerCase().includes(hotelSearchQuery.toLowerCase()) ||
                            p.id.toLowerCase().includes(hotelSearchQuery.toLowerCase())
                          ).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setHotelId(p.id);
                                setHotelSearchQuery(p.nombre);
                                
                                setSelectedPromoName("");
                                setSelectedRatePlanId("");
                                
                                const hotelRooms = roomTypes.filter(rt => rt.property_id === p.id);
                                const defaultRoomTypeId = hotelRooms[0]?.id || "";
                                
                                setLodgingRooms(prev => prev.map(room => ({ ...room, roomTypeId: defaultRoomTypeId })));
                                setShowHotelDropdown(false);
                              }}
                              className="w-full text-left p-3 hover:bg-zinc-50 flex items-center justify-between text-xs transition-colors cursor-pointer border-none font-sans"
                            >
                              <div>
                                <span className="font-bold text-zinc-900 block">{p.nombre}</span>
                                <span className="text-[10px] text-zinc-400 font-mono">Cod: {p.id} | {p.ciudad}, {p.pais}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-zinc-100 border border-zinc-200 text-zinc-700">
                                  {p.categoria} Estrellas
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Plan de Tarifa B2B ({cartMercado})</label>
                    <select
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                      value={selectedPromoName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedPromoName(val);
                        const plans = ratePlans.filter(rp => rp.property_id === hotelId && rp.mercado === cartMercado && rp.nombrePromocion === val);
                        if (plans.length > 0) {
                          const firstRoomTypeId = plans[0]?.roomType_id || "";
                          setSelectedRatePlanId(plans[0]?.id || "");
                          setLodgingRooms(prev => prev.map(room => ({ ...room, roomTypeId: firstRoomTypeId })));
                        } else {
                          setSelectedRatePlanId("");
                        }
                      }}
                    >
                      {!hotelId ? (
                        <option value="">-- Seleccione un hotel primero --</option>
                      ) : (() => {
                        const availablePromos = Array.from(new Set(
                          ratePlans
                            .filter(rp => rp.property_id === hotelId && rp.mercado === cartMercado)
                            .map(rp => rp.nombrePromocion)
                        ));
                        if (availablePromos.length === 0) {
                          return <option value="">No hay promociones vigentes ({cartMercado})</option>;
                        }
                        return (
                          <>
                            <option value="">-- Seleccione un plan de tarifa --</option>
                            {availablePromos.map(promo => (
                              <option key={promo} value={promo}>{promo}</option>
                            ))}
                          </>
                        );
                      })()}
                    </select>
                  </div>
                </div>

                {/* Rooms Configuration Builder */}
                <div className="space-y-4 border-t border-zinc-150 pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Distribución de Habitaciones</h4>
                      <p className="text-[10.5px] text-zinc-450 mt-0.5">Estadía calculada: <span className="font-bold text-zinc-805">{getStayNights()} noche(s)</span></p>
                      {(() => {
                        const roomTypeId = lodgingRooms[0]?.roomTypeId;
                        if (!roomTypeId) return null;
                        const segments = getRateSegments(hotelId, roomTypeId, cartMercado, checkInDate, checkOutDate, ratePlans);
                        if (segments.length <= 1) return null;
                        return (
                          <p className="text-[10.5px] text-blue-700 font-semibold mt-1 bg-blue-50 border border-blue-150 rounded px-2 py-1 inline-block">
                            Tarifa mixta: {segments.map(s => `${s.nights} noche(s) ${s.ratePlan.nombrePromocion}`).join(" + ")}
                          </p>
                        );
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddRoom}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[10.5px] font-bold uppercase tracking-wide cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Añadir Habitación
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {lodgingRooms.map((room, index) => {
                      const promoPlans = ratePlans.filter(rp => 
                        rp.property_id === hotelId && 
                        rp.mercado === cartMercado && 
                        rp.nombrePromocion === selectedPromoName
                      );
                      const promoRoomTypes = roomTypes.filter(rt => 
                        promoPlans.some(rp => rp.roomType_id === rt.id)
                      );
                      const fallbackRoomTypes = roomTypes.filter(rt => rt.property_id === hotelId);
                      const activeRoomTypes = promoRoomTypes.length > 0 ? promoRoomTypes : fallbackRoomTypes;

                      return (
                        <div key={room.id} className="p-4 border border-zinc-205 rounded-lg bg-zinc-50/50 space-y-4 shadow-2xs font-sans">
                          <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60">
                            <span className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">Habitación #{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRoom(room.id)}
                              className="text-[10.5px] text-red-655 hover:text-red-800 font-bold uppercase cursor-pointer border-none bg-transparent"
                            >
                              Quitar
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block">Tipo de Habitación</label>
                              <select
                                className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                                value={room.roomTypeId}
                                onChange={(e) => handleRoomTypeChange(room.id, e.target.value)}
                              >
                                {activeRoomTypes.length === 0 ? (
                                  <option value="">No hay habitaciones configuradas</option>
                                ) : (
                                  activeRoomTypes.map(rt => {
                                    const rp = promoPlans.find(plan => plan.roomType_id === rt.id);
                                    const ratePrice = rp ? `($${rp.tarifaBase} / ${rp.tipoCobro})` : "";
                                    return (
                                      <option key={rt.id} value={rt.id}>
                                        {rt.nombre} {ratePrice}
                                      </option>
                                    );
                                  })
                                )}
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block">Huéspedes en Habitación</label>
                              <input
                                type="number"
                                min="1"
                                max="6"
                                className="w-full p-2.5 border border-zinc-250 rounded text-xs font-bold bg-white text-zinc-900 focus:outline-none"
                                value={room.adultsCount}
                                onChange={(e) => handleRoomPaxChange(room.id, parseInt(e.target.value) || 1)}
                              />
                            </div>
                          </div>

                          {/* Guest Names Inputs */}
                          <div className="space-y-2">
                            <label className="text-[9.5px] font-bold text-zinc-455 uppercase tracking-widest block">Asignación de Pasajeros</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {room.guests.map((guest, guestIndex) => (
                                <div key={guestIndex} className="space-y-2 bg-white border border-zinc-150 p-2.5 rounded-md shadow-2xs">
                                  <div className="relative flex items-center">
                                    <select
                                      required
                                      value={guest.passengerId || cartPasajeros.find(p => p.nombre && p.nombre === guest.name)?.id || ""}
                                      onChange={(e) => {
                                        if (e.target.value === "__nuevo__") {
                                          setActiveExpedienteTab("pasajeros");
                                          setViewLevel(2);
                                          return;
                                        }
                                        handleRoomGuestAssign(room.id, guestIndex, e.target.value);
                                      }}
                                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-850 focus:outline-none cursor-pointer"
                                    >
                                      <option value="" disabled>Seleccionar pasajero...</option>
                                      {cartPasajeros.map(p => (
                                        <option key={p.id} value={p.id}>
                                          {p.nombre || "(sin nombre)"}{p.esTitular ? " — Titular" : ""} · {p.tipo}
                                        </option>
                                      ))}
                                      <option value="__nuevo__">+ Agregar nuevo pasajero…</option>
                                    </select>
                                  </div>
                                  {cartPasajeros.length === 0 && (
                                    <p className="text-[9.5px] text-amber-700 font-semibold">
                                      No hay pasajeros cargados. Agréguelos primero en la pestaña Pasajeros.
                                    </p>
                                  )}

                                  <div className="flex items-center gap-4 pt-0.5">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Tipo:</span>
                                    <div className="flex gap-3">
                                      <label className="flex items-center gap-1 text-[10.5px] font-semibold text-zinc-700 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`gtype-${room.id}-${guestIndex}`}
                                          checked={guest.type === "Adulto"}
                                          onChange={() => handleRoomGuestTypeChange(room.id, guestIndex, "Adulto")}
                                          className="w-3 h-3 accent-zinc-950 cursor-pointer"
                                        />
                                        Adulto
                                      </label>
                                      <label className="flex items-center gap-1 text-[10.5px] font-semibold text-zinc-700 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`gtype-${room.id}-${guestIndex}`}
                                          checked={guest.type === "Niño"}
                                          onChange={() => handleRoomGuestTypeChange(room.id, guestIndex, "Niño")}
                                          className="w-3 h-3 accent-zinc-950 cursor-pointer"
                                        />
                                        Child (Niño)
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 2. TRASLADOS */}
            {activeServiceType === ServiceType.TRASLADO && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block flex items-center gap-1">
                      <Search className="w-3 h-3" /> Seleccionar del Catálogo
                    </label>
                    <SearchableSelect
                      value={svExtraServiceId}
                      onChange={(val) => {
                        setSvExtraServiceId(val);
                        setSvRateId("");
                        const selected = extraServices?.find(s => s.id === val);
                        if (selected) {
                          // Un traslado del catálogo siempre implica un proveedor tercero.
                          setTransEsPropio(false);
                          setTransSupplier(selected.providerName);
                        } else {
                          setTransSupplier("");
                        }
                      }}
                      options={(extraServices || []).filter(s => s.category === "Traslado").map(s => ({ value: s.id, label: s.nombre, sublabel: s.providerName }))}
                      placeholder="-- Seleccione un Traslado (Opcional) --"
                      emptyLabel="Ningún traslado coincide."
                    />
                  </div>

                  {svExtraServiceId && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Tarifa / Temporada</label>
                      <SearchableSelect
                        value={svRateId}
                        onChange={(val) => {
                          setSvRateId(val);
                          const rate = serviceRates?.find(r => r.id === val);
                          if (rate) {
                            if (rate.pricingModel === "Por Persona") {
                              const vta = ((rate.ventaAdulto || 0) * transPax).toFixed(2);
                              const net = ((rate.netoAdulto || 0) * transPax).toFixed(2);
                              setSalePrice(vta);
                              setNetPrice(net);
                            } else {
                              // By default, 1 vehicle
                              setSalePrice((rate.ventaTotal || 0).toFixed(2));
                              setNetPrice((rate.netoTotal || 0).toFixed(2));
                            }
                          }
                        }}
                        options={(serviceRates || []).filter(r => r.extraServiceId === svExtraServiceId).map(r => ({ value: r.id, label: `Del ${r.temporadaInicio} al ${r.temporadaFin}` }))}
                        placeholder="-- Seleccione Tarifa --"
                        emptyLabel="No hay tarifas cargadas para este traslado."
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Tipo de Traslado</label>
                    <select
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                      value={transTripType}
                      onChange={(e) => setTransTripType(e.target.value as "one-way" | "round-trip")}
                    >
                      <option value="one-way">Sólo Ida (One Way)</option>
                      <option value="round-trip">Ida y Vuelta (Round Trip)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Modalidad de Servicio</label>
                    <select
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                      value={transServiceType}
                      onChange={(e) => setTransServiceType(e.target.value as "privado" | "compartido")}
                    >
                      <option value="privado">Privado</option>
                      <option value="compartido">Compartido</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Pasajeros</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                      value={transPax}
                      onChange={(e) => {
                        const newPax = Math.max(1, parseInt(e.target.value) || 1);
                        setTransPax(newPax);
                        if (svRateId) {
                          const rate = serviceRates?.find(r => r.id === svRateId);
                          if (rate && rate.pricingModel === "Por Persona") {
                            setSalePrice(((rate.ventaAdulto || 0) * newPax).toFixed(2));
                            setNetPrice(((rate.netoAdulto || 0) * newPax).toFixed(2));
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Proveedor Operador</label>
                    <input
                      type="text"
                      readOnly={!!svExtraServiceId || transEsPropio}
                      className={`w-full p-2.5 border border-zinc-200 rounded text-xs font-bold text-zinc-900 focus:outline-none placeholder:text-zinc-300 ${(svExtraServiceId || transEsPropio) ? "bg-zinc-100 cursor-not-allowed text-zinc-600" : "bg-white"}`}
                      value={transSupplier}
                      onChange={(e) => setTransSupplier(e.target.value)}
                      placeholder={svExtraServiceId ? "" : "Escriba el proveedor, o marque la casilla si lo opera su propia agencia"}
                    />
                    {!svExtraServiceId && (
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={transEsPropio}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setTransEsPropio(checked);
                            setTransSupplier(checked ? companyConfig.name : "");
                          }}
                        />
                        Este traslado lo opera mi propia agencia
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-zinc-800">Ruta del Traslado</h4>
                  <button 
                    type="button" 
                    onClick={handleAutofillTransfer}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-bold transition-colors"
                  >
                    <Plane className="w-3.5 h-3.5" />
                    Autocompletar desde Vuelo/Hotel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Origen / Pickup</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Aeropuerto Internacional Local"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={transPickup}
                      onChange={(e) => setTransPickup(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Destino / Dropoff</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Lidotel Hotel Boutique"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={transDropoff}
                      onChange={(e) => setTransDropoff(e.target.value)}
                    />
                  </div>
                </div>

                {transTripType === "round-trip" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Destino de Vuelta (Retorno)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Aeropuerto Internacional Local"
                        className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                        value={transReturnDropoff}
                        onChange={(e) => setTransReturnDropoff(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha Retorno</label>
                      <input
                        type="date"
                        required
                        className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none"
                        value={transReturnDate}
                        onChange={(e) => setTransReturnDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Hora de Retorno</label>
                      <input
                        type="time"
                        required
                        className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none"
                        value={transReturnTime}
                        onChange={(e) => setTransReturnTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha (Ida)</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none"
                      value={transDate}
                      onChange={(e) => setTransDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Hora de Pick up</label>
                    <input
                      type="time"
                      required
                      className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none"
                      value={transTime}
                      onChange={(e) => setTransTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Categoría de Vehículo</label>
                    <select
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                      value={transVehicle}
                      onChange={(e) => setTransVehicle(e.target.value)}
                    >
                      {fleetVehicles.length > 0 ? (
                        Array.from(new Set(fleetVehicles.map(v => v.tipo))).map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))
                      ) : (
                        <>
                          <option value="Berlina Ejecutiva">Berlina Ejecutiva (Sedán 1-3 Pax)</option>
                          <option value="Minivan Ejecutiva">Minivan Ejecutiva (SUV 1-6 Pax)</option>
                          <option value="Mini Bus Charter">Mini Bus Charter (Coaster 7-19 Pax)</option>
                          <option value="Autobús de Línea">Autobús de Línea (Coach 20+ Pax)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 3. RENT A CAR */}
            {activeServiceType === ServiceType.RENT_A_CAR && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha Entrega / Pick Up</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none"
                      value={carStartDate}
                      onChange={(e) => {
                        const start = e.target.value;
                        setCarStartDate(start);
                        if (carEndDate) {
                          const s = new Date(start);
                          const eDate = new Date(carEndDate);
                          if (!isNaN(s.getTime()) && !isNaN(eDate.getTime())) {
                            setCarDays(Math.max(1, Math.ceil((eDate.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))));
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha Devolución / Drop Off</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none"
                      value={carEndDate}
                      onChange={(e) => {
                        const end = e.target.value;
                        setCarEndDate(end);
                        if (carStartDate) {
                          const s = new Date(carStartDate);
                          const eDate = new Date(end);
                          if (!isNaN(s.getTime()) && !isNaN(eDate.getTime())) {
                            setCarDays(Math.max(1, Math.ceil((eDate.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))));
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Categoría Vehículo</label>
                    <select
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                      value={carCategory}
                      onChange={(e) => setCarCategory(e.target.value)}
                    >
                      {fleetVehicles.length > 0 ? (
                        Array.from(new Set(fleetVehicles.map(v => v.tipo))).map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))
                      ) : (
                        <>
                          <option value="Económico Mecánico">Económico Mecánico (Ford Ka o similar)</option>
                          <option value="Compacto Automático">Compacto Automático (Toyota Yaris o similar)</option>
                          <option value="SUV Familiar 4x2">SUV Familiar 4x2 (Hyundai Tucson o similar)</option>
                          <option value="Camioneta Pick-Up">Camioneta Pick-Up (Toyota Hilux o similar)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Rentadora (Proveedor)</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={carSupplier}
                      onChange={(e) => setCarSupplier(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cantidad de Días</label>
                    <input
                      type="number"
                      min="1"
                      readOnly
                      className="w-full p-2.5 border border-zinc-150 bg-zinc-50 rounded text-xs font-bold text-zinc-500 text-right cursor-not-allowed"
                      value={carDays}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. SEGUROS DE VIAJE */}
            {activeServiceType === ServiceType.SEGURO && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha de Inicio</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none"
                      value={insStartDate}
                      onChange={(e) => {
                        const start = e.target.value;
                        setInsStartDate(start);
                        if (insEndDate) {
                          const s = new Date(start);
                          const eDate = new Date(insEndDate);
                          if (!isNaN(s.getTime()) && !isNaN(eDate.getTime())) {
                            setInsDays(Math.max(1, Math.ceil((eDate.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))));
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha de Fin</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none"
                      value={insEndDate}
                      onChange={(e) => {
                        const end = e.target.value;
                        setInsEndDate(end);
                        if (insStartDate) {
                          const s = new Date(insStartDate);
                          const eDate = new Date(end);
                          if (!isNaN(s.getTime()) && !isNaN(eDate.getTime())) {
                            setInsDays(Math.max(1, Math.ceil((eDate.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))));
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cantidad de Pax</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                      value={insPax}
                      onChange={(e) => setInsPax(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Plan de Asistencia</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Plan Cobertura Total Schengen"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={insPlan}
                      onChange={(e) => setInsPlan(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Proveedor Operador</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none placeholder:text-zinc-300"
                      value={insSupplier}
                      onChange={(e) => setInsSupplier(e.target.value)}
                      placeholder="Ej. Asistencia Global Travel"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cantidad de Días</label>
                    <input
                      type="number"
                      min="1"
                      readOnly
                      className="w-full p-2.5 border border-zinc-150 bg-zinc-50 rounded text-xs font-bold text-zinc-500 text-right cursor-not-allowed"
                      value={insDays}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. ENTRADA MANUAL */}
            {activeServiceType === ServiceType.MANUAL && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Descripción del Servicio</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Entradas a Parques Temáticos Disney 2 días"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Proveedor Local (Supplier)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Disney Ticket Wholesaler"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={manualSupplier}
                      onChange={(e) => setManualSupplier(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. SERVICIOS VARIOS */}
            {activeServiceType === ServiceType.SERVICIO_VARIO && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Seleccionar Servicio del Catálogo</label>
                    <SearchableSelect
                      value={svExtraServiceId}
                      onChange={(val) => {
                        setSvExtraServiceId(val);
                        setSvRateId("");
                      }}
                      options={(extraServices || []).map(s => ({ value: s.id, label: s.nombre, sublabel: s.providerName }))}
                      placeholder="-- Seleccione un Servicio --"
                      emptyLabel="Ningún servicio coincide."
                    />
                  </div>

                  {svExtraServiceId && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Seleccionar Tarifa / Temporada</label>
                      <SearchableSelect
                        value={svRateId}
                        onChange={(val) => {
                          setSvRateId(val);
                          const rate = serviceRates?.find(r => r.id === val);
                          if (rate) {
                            if (rate.pricingModel === "Por Persona") {
                              const vta = (rate.ventaAdulto || 0) * svAdults + (rate.ventaNino || 0) * svChildren;
                              const net = (rate.netoAdulto || 0) * svAdults + (rate.netoNino || 0) * svChildren;
                              setSalePrice(vta.toFixed(2));
                              setNetPrice(net.toFixed(2));
                            } else {
                              setSalePrice(((rate.ventaTotal || 0) * svVehicles).toFixed(2));
                              setNetPrice(((rate.netoTotal || 0) * svVehicles).toFixed(2));
                            }
                          }
                        }}
                        options={(serviceRates || []).filter(r => r.extraServiceId === svExtraServiceId).map(r => ({ value: r.id, label: `Del ${r.temporadaInicio} al ${r.temporadaFin} - ${r.pricingModel}` }))}
                        placeholder="-- Seleccione una Tarifa --"
                        emptyLabel="No hay tarifas cargadas para este servicio."
                      />
                    </div>
                  )}
                </div>

                {/* Aviso de tarifa mixta: el rango de fechas del expediente toca más de una
                    temporada distinta para este servicio — a diferencia de Alojamiento (que
                    prorratea por noche), acá no hay un concepto de "noches" para repartir el
                    costo, así que solo se avisa para que el vendedor verifique manualmente. */}
                {(() => {
                  if (!svExtraServiceId || !cartCheckIn || !cartCheckOut) return null;
                  const overlappingRateIds = new Set(
                    (serviceRates || [])
                      .filter(r => r.extraServiceId === svExtraServiceId && cartCheckIn < r.temporadaFin && cartCheckOut > r.temporadaInicio)
                      .map(r => r.id)
                  );
                  if (overlappingRateIds.size <= 1) return null;
                  return (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Tarifa mixta: hay {overlappingRateIds.size} temporadas distintas vigentes dentro del rango de fechas del expediente para este servicio. Verifique cuál corresponde antes de continuar.</span>
                    </div>
                  );
                })()}

                {svRateId && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {serviceRates?.find(r => r.id === svRateId)?.pricingModel === "Por Persona" ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cantidad Adultos</label>
                          <input
                            type="number"
                            min="1"
                            className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                            value={svAdults}
                            onChange={(e) => {
                              const newAd = Math.max(1, parseInt(e.target.value) || 1);
                              setSvAdults(newAd);
                              const rate = serviceRates?.find(r => r.id === svRateId);
                              if (rate) {
                                setSalePrice(((rate.ventaAdulto || 0) * newAd + (rate.ventaNino || 0) * svChildren).toFixed(2));
                                setNetPrice(((rate.netoAdulto || 0) * newAd + (rate.netoNino || 0) * svChildren).toFixed(2));
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cantidad Niños</label>
                          <input
                            type="number"
                            min="0"
                            className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                            value={svChildren}
                            onChange={(e) => {
                              const newCh = Math.max(0, parseInt(e.target.value) || 0);
                              setSvChildren(newCh);
                              const rate = serviceRates?.find(r => r.id === svRateId);
                              if (rate) {
                                setSalePrice(((rate.ventaAdulto || 0) * svAdults + (rate.ventaNino || 0) * newCh).toFixed(2));
                                setNetPrice(((rate.netoAdulto || 0) * svAdults + (rate.netoNino || 0) * newCh).toFixed(2));
                              }
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cantidad Vehículos / Grupos</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                          value={svVehicles}
                          onChange={(e) => setSvVehicles(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* --- COSTOS COMUNES --- */}
            {activeServiceType === ServiceType.ALOJAMIENTO ? (
              <div className="border-t border-zinc-150 pt-4 space-y-4 font-sans">
                {/* Inputs for Commissions and PVP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">PVP Total de Tarifa ($)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                      <input
                        type="text"
                        readOnly
                        className="w-full pl-6 pr-3 py-2.5 border border-zinc-150 bg-zinc-50 rounded text-xs font-extrabold text-zinc-700 text-right cursor-not-allowed"
                        value={calculateTotalPvpLodgingPrice().toLocaleString("es-ES")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Comisión Agencia B2B (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        required
                        className="w-full p-2.5 pr-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
                        value={comisionB2B}
                        disabled={cartCanalVenta === "Directo"}
                        onChange={(e) => setComisionB2B(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Comisión Mi Agencia (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        required
                        className="w-full p-2.5 pr-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                        value={comisionPropia}
                        onChange={(e) => setComisionPropia(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                </div>

                {/* Financial breakdown outputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-100 pt-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block">Costo Neto Mayorista (a Pagar)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                      <input
                        type="text"
                        readOnly
                        className="w-full pl-6 pr-3 py-2.5 border border-emerald-100 bg-emerald-50/20 rounded text-xs font-black text-emerald-800 text-right cursor-not-allowed"
                        value={calculateTotalNetLodgingPrice().toLocaleString("es-ES")}
                      />
                    </div>
                    <span className="text-[9px] text-zinc-450 font-medium leading-tight block">
                      Reteniendo {comisionB2B + comisionPropia}% de descuento sobre el PVP.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block">Cobro B2B (A Pagar por Agencia)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                      <input
                        type="text"
                        readOnly
                        className="w-full pl-6 pr-3 py-2.5 border border-zinc-200 bg-zinc-50 rounded text-xs font-black text-zinc-900 text-right cursor-not-allowed"
                        value={calculateTotalSaleLodgingPrice().toLocaleString("es-ES")}
                      />
                    </div>
                    <span className="text-[9px] text-zinc-450 font-medium leading-tight block">
                      {cartCanalVenta === "Directo" ? "Cliente Directo: sin comisión de agencia, precio de venta = PVP." : `Agencia B2B retiene su ${comisionB2B}% de comisión.`}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block">Nuestra Ganancia Mayorista</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-[10px]">$</span>
                      <input
                        type="text"
                        readOnly
                        className="w-full pl-6 pr-3 py-2.5 border border-emerald-250 bg-emerald-50 rounded text-xs font-black text-emerald-755 text-right cursor-not-allowed"
                        value={(calculateTotalSaleLodgingPrice() - calculateTotalNetLodgingPrice()).toLocaleString("es-ES")}
                      />
                    </div>
                    <span className="text-[9px] text-emerald-600 font-bold leading-tight block">
                      Equivale al {comisionPropia}% de comisión propia.
                    </span>
                  </div>
                </div>
              </div>
            ) : (activeServiceType === ServiceType.SERVICIO_VARIO) ? (
              <div className="border-t border-zinc-150 pt-4 space-y-4 font-sans">
                {(() => {
                  const rate = serviceRates?.find(r => r.id === svRateId);
                  let pvp = 0;
                  let costoNeto = 0;
                  if (rate) {
                    if (rate.pricingModel === "Por Persona") {
                      pvp = (rate.ventaAdulto || 0) * svAdults + (rate.ventaNino || 0) * svChildren;
                      costoNeto = (rate.netoAdulto || 0) * svAdults + (rate.netoNino || 0) * svChildren;
                    } else {
                      pvp = (rate.ventaTotal || 0) * svVehicles;
                      costoNeto = (rate.netoTotal || 0) * svVehicles;
                    }
                  }
                  const cobroB2B = Math.round(pvp * (1 - comisionB2B / 100) * 100) / 100;
                  const ganancia = cobroB2B - costoNeto;

                  return (
                    <>
                      {/* Inputs de comisión */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">PVP del Servicio ($)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                            <input
                              type="text"
                              readOnly
                              className="w-full pl-6 pr-3 py-2.5 border border-zinc-150 bg-zinc-50 rounded text-xs font-extrabold text-zinc-700 text-right cursor-not-allowed"
                              value={pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Comisión Agencia B2B (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              className="w-full p-2.5 pr-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
                              value={comisionB2B}
                              disabled={cartCanalVenta === "Directo"}
                              onChange={(e) => setComisionB2B(Math.max(0, parseFloat(e.target.value) || 0))}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Comisión Mi Agencia (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              className="w-full p-2.5 pr-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                              value={comisionPropia}
                              onChange={(e) => setComisionPropia(Math.max(0, parseFloat(e.target.value) || 0))}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Resumen financiero calculado */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-100 pt-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block">Costo Neto Mayorista (a Pagar)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                            <input
                              type="text"
                              readOnly
                              className="w-full pl-6 pr-3 py-2.5 border border-emerald-100 bg-emerald-50/20 rounded text-xs font-black text-emerald-800 text-right cursor-not-allowed"
                              value={costoNeto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                            />
                          </div>
                          <span className="text-[9px] text-zinc-450 font-medium leading-tight block">
                            Costo fijo del proveedor según tarifa.
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block">Cobro B2B (A Pagar por Agencia)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                            <input
                              type="text"
                              readOnly
                              className="w-full pl-6 pr-3 py-2.5 border border-zinc-200 bg-zinc-50 rounded text-xs font-black text-zinc-900 text-right cursor-not-allowed"
                              value={cobroB2B.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                            />
                          </div>
                          <span className="text-[9px] text-zinc-450 font-medium leading-tight block">
                            {cartCanalVenta === "Directo" ? "Cliente Directo: sin comisión de agencia, precio de venta = PVP." : `Agencia B2B retiene su ${comisionB2B}% de comisión.`}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block">Nuestra Ganancia Mayorista</label>
                          <div className="relative">
                            <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-[10px] ${ganancia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>$</span>
                            <input
                              type="text"
                              readOnly
                              className={`w-full pl-6 pr-3 py-2.5 rounded text-xs font-black text-right cursor-not-allowed ${ganancia >= 0 ? 'border border-emerald-250 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}
                              value={ganancia.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                            />
                          </div>
                          <span className={`text-[9px] font-bold leading-tight block ${ganancia >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            Cobro B2B menos costo neto del proveedor.
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (activeServiceType === ServiceType.TRASLADO || activeServiceType === ServiceType.SEGURO || activeServiceType === ServiceType.MANUAL) ? (
              <div className="border-t border-zinc-150 pt-4 space-y-4 font-sans">
                {/* Inputs for PVP and Commissions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                      {activeServiceType === ServiceType.SEGURO ? "PVP por Pax ($)" : "Precio Venta PVP ($)"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none text-right"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                      />
                    </div>
                    {activeServiceType === ServiceType.SEGURO && (
                      <span className="text-[9.5px] text-zinc-450 font-bold leading-tight block mt-1">
                        PVP Total: ${((parseFloat(salePrice) || 0) * insPax).toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD ({insPax} Pax)
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Comisión Agencia B2B (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        required
                        className="w-full p-2.5 pr-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
                        value={comisionB2B}
                        disabled={cartCanalVenta === "Directo"}
                        onChange={(e) => setComisionB2B(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Comisión Mi Agencia (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        required
                        className="w-full p-2.5 pr-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                        value={comisionPropia}
                        onChange={(e) => setComisionPropia(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                </div>

                {/* Financial breakdown outputs */}
                {(() => {
                  const factor = activeServiceType === ServiceType.SEGURO ? insPax : 1;
                  const pvpUnit = parseFloat(salePrice) || 0;
                  const pvp = pvpUnit * factor;
                  const netoB2B = Math.round(pvp * (1 - comisionB2B / 100) * 100) / 100;
                  const costoNeto = Math.round(pvp * (1 - (comisionB2B + comisionPropia) / 100) * 100) / 100;
                  const ganancia = netoB2B - costoNeto;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-100 pt-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block">Costo Neto Mayorista (a Pagar)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                          <input
                            type="text"
                            readOnly
                            className="w-full pl-6 pr-3 py-2.5 border border-emerald-100 bg-emerald-50/20 rounded text-xs font-black text-emerald-800 text-right cursor-not-allowed"
                            value={costoNeto.toLocaleString("es-ES")}
                          />
                        </div>
                        <span className="text-[9px] text-zinc-450 font-medium leading-tight block">
                          Reteniendo {comisionB2B + comisionPropia}% de descuento sobre el PVP Base.
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block">Cobro B2B (A Pagar por Agencia)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                          <input
                            type="text"
                            readOnly
                            className="w-full pl-6 pr-3 py-2.5 border border-zinc-200 bg-zinc-50 rounded text-xs font-black text-zinc-900 text-right cursor-not-allowed"
                            value={netoB2B.toLocaleString("es-ES")}
                          />
                        </div>
                        <span className="text-[9px] text-zinc-450 font-medium leading-tight block">
                          {cartCanalVenta === "Directo" ? "Cliente Directo: sin comisión de agencia, precio de venta = PVP." : `Agencia B2B retiene su ${comisionB2B}% de comisión.`}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest block">Nuestra Ganancia Mayorista</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-[10px]">$</span>
                          <input
                            type="text"
                            readOnly
                            className="w-full pl-6 pr-3 py-2.5 border border-emerald-250 bg-emerald-50 rounded text-xs font-black text-emerald-755 text-right cursor-not-allowed"
                            value={ganancia.toLocaleString("es-ES")}
                          />
                        </div>
                        <span className="text-[9px] text-emerald-600 font-bold leading-tight block">
                          Equivale al {comisionPropia}% de comisión propia.
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <>
                <div className="border-t border-zinc-150 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Costo Neto Mayorista ($)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none text-right"
                        value={netPrice}
                        onChange={(e) => setNetPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Precio Venta PVP ($)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none text-right"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Comisión Agencia B2B (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        required
                        className="w-full p-2.5 pr-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
                        value={comisionB2B}
                        disabled={cartCanalVenta === "Directo"}
                        onChange={(e) => setComisionB2B(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                </div>

                {/* Margen Informativo en Formulario */}
                {netPrice && salePrice && (
                  <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-md text-xs space-y-2 text-zinc-700 font-semibold">
                    <div className="flex justify-between items-center">
                      <span>{cartCanalVenta === "Directo" ? "Importe a Pagar por el Cliente:" : "Importe Neto B2B (a Pagar por Agencia):"}</span>
                      <span className="text-zinc-955 font-black">
                        ${((parseFloat(salePrice) || 0) * (1 - comisionB2B / 100)).toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-700 font-bold">
                      <span>Nuestra Ganancia Mayorista:</span>
                      <span>
                        +${(((parseFloat(salePrice) || 0) * (1 - comisionB2B / 100)) - (parseFloat(netPrice) || 0)).toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-150">
              <button
                type="button"
                onClick={handleBackToCart}
                className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Volver
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
              >
                {editingServiceId ? "Guardar Cambios del Servicio" : "Agregar al Carrito"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL DE COMPARTIR/IMPRIMIR FORMATO B2B */}
      {showB2BModal && activeRes && (() => {
        const isDirecto = isCanalDirecto(activeRes);
        return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans print-modal-container">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh] print-modal-content">

            {/* Modal Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between no-print">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 font-sans">
                  <Share2 className="w-4.5 h-4.5 text-zinc-400" /> {isDirecto ? "Cotización para Cliente Directo" : "Formato para Compartir con Agencia B2B"}
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 font-sans">
                  {isDirecto
                    ? "Versión limpia para el pasajero. Sin desglose de comisiones ni costos internos."
                    : "Versión limpia optimizada para cliente. Costos netos y márgenes mayoristas ocultos."}
                </p>
              </div>
              <button
                onClick={() => setShowB2BModal(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Container */}
            <div className="p-8 overflow-y-auto flex-1 bg-white" id="printable-b2b-doc">

              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-zinc-900 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-zinc-950 text-white flex items-center justify-center font-black text-base font-sans">
                      {companyConfig.logoLetter}
                    </div>
                    <div>
                      <h2 className="font-black text-base tracking-tight leading-none text-zinc-955 font-sans uppercase">{companyConfig.name}</h2>
                      <span className="text-[8px] uppercase tracking-widest font-extrabold text-zinc-400 block font-sans">{companyConfig.subtitle}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium font-sans">
                    {companyConfig.tagline || companyConfig.subtitle}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 rounded text-[9px] font-black uppercase tracking-wider text-zinc-800 font-sans">
                    {isDirecto ? "Cotización de Viaje" : "Ficha de Reserva B2B"}
                  </span>
                  <div className="mt-2 text-xs font-bold text-zinc-900 font-sans">
                    Localizador: <span className="font-mono text-zinc-955 font-black">{activeRes.id}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium font-sans">
                    Fecha Emisión: {formatDate(activeRes.createdAt || "2026-06-01")}
                  </div>
                </div>
              </div>

              {/* Passenger & Agency Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-zinc-200 pb-6 mb-6 text-xs font-sans">
                <div className="space-y-2.5">
                  <h4 className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider">Información del Viaje</h4>
                  <div className="grid grid-cols-3 gap-y-1 text-zinc-700">
                    <span className="font-bold text-zinc-450">Pasajero Titular:</span>
                    <span className="col-span-2 font-extrabold text-zinc-950">{activeRes.holder}</span>

                    <span className="font-bold text-zinc-450">Pasajeros:</span>
                    <span className="col-span-2 font-bold text-zinc-900">{activeRes.pax} Pax</span>

                    <span className="font-bold text-zinc-455">Check-In:</span>
                    <span className="col-span-2 font-mono text-zinc-900">{formatDate(activeRes.checkIn)}</span>

                    <span className="font-bold text-zinc-455">Check-Out:</span>
                    <span className="col-span-2 font-mono text-zinc-900">{formatDate(activeRes.checkOut)}</span>
                    
                    {activeRes.flightNo && (
                      <>
                        <span className="font-bold text-zinc-455">Vuelo Asignado:</span>
                        <span className="col-span-2 font-bold text-zinc-900 uppercase">{activeRes.flightNo}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="font-bold text-[10px] uppercase text-zinc-455 tracking-wider">{isDirecto ? "Información de Contacto" : "Agencia Minorista (Emisora)"}</h4>
                  <div className="grid grid-cols-3 gap-y-1 text-zinc-700">
                    {!isDirecto && (
                      <>
                        <span className="font-bold text-zinc-450">Agencia B2B:</span>
                        <span className="col-span-2 font-extrabold text-zinc-950">{activeRes.agenciaName || "Directo"}</span>
                      </>
                    )}

                    <span className="font-bold text-zinc-450">Teléfono:</span>
                    <span className="col-span-2 font-semibold text-zinc-900">{activeRes.telefono || "Sin registrar"}</span>

                    <span className="font-bold text-zinc-450">Email:</span>
                    <span className="col-span-2 font-semibold text-zinc-900">{activeRes.email || "Sin registrar"}</span>

                    {!isDirecto && (
                      <>
                        <span className="font-bold text-zinc-455">Mercado Tarifario:</span>
                        <span className="col-span-2 font-bold text-zinc-900 uppercase">{activeRes.mercado || "INTERNACIONAL"}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Line Items Table & Totals */}
              {(() => {
                const jointFlights = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto);
                const flightServices = jointFlights.map(b => ({
                  id: b.pnr,
                  tipo: "Aéreo GDS",
                  descripcion: `${b.aerolineaValidadora || b.segmentos?.[0]?.aerolinea || "Aerolínea"} - Ruta: ${b.segmentos?.map(s => `${s.origen}-${s.destino}`).join(', ')} - PNR: ${b.pnr}`,
                  precioVenta: b.precioVenta,
                  precioPvp: b.precioPvp || b.precioVenta,
                  comisionB2B: b.comisionB2B || 0,
                  detalles: null
                }));
                const allServices = [...(activeRes.servicios || []), ...flightServices];

                const totalPvp = allServices.length > 0
                  ? allServices.reduce((sum, s) => {
                      const comisionPct = s.comisionB2B !== undefined ? s.comisionB2B : 10;
                      const itemPvp = s.precioPvp !== undefined ? s.precioPvp : (s.precioVenta / (1 - comisionPct / 100));
                      return sum + itemPvp;
                    }, 0)
                  : (activeRes.totalPrice / 0.9);
                
                const totalVenta = allServices.length > 0 
                  ? allServices.reduce((sum, s) => sum + s.precioVenta, 0)
                  : activeRes.totalPrice;
                  
                const totalComisionesB2B = totalPvp - totalVenta;

                return (
                  <React.Fragment>
                    <div className="space-y-3 font-sans">
                      <h4 className="font-bold text-[10px] uppercase text-zinc-450 tracking-wider">Detalle de Servicios Incluidos</h4>
                      <div className="border border-zinc-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[9px] font-extrabold tracking-wider">
                              <th className="p-3 w-16">Cod</th>
                              <th className="p-3 w-24">Tipo</th>
                              <th className="p-3">Descripción / Itinerario del Servicio</th>
                              {isDirecto ? (
                                <th className="p-3 text-right w-28">Precio</th>
                              ) : (
                                <>
                                  <th className="p-3 text-right w-24">PVP Tarifa</th>
                                  <th className="p-3 text-center w-36">Comisión B2B</th>
                                  <th className="p-3 text-right w-28">Neto a Pagar B2B</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 text-zinc-800">
                            {allServices.length > 0 ? (
                              allServices.map((s, idx) => {
                                const comisionPct = s.comisionB2B !== undefined ? s.comisionB2B : 10;
                                const pvp = s.precioPvp !== undefined ? s.precioPvp : (s.precioVenta / (1 - comisionPct / 100));
                                const comisionAmt = pvp - s.precioVenta;
                                
                                if (s.tipo === ServiceType.ALOJAMIENTO && s.detalles?.lodgingRooms) {
                                  const hotelName = detailedProperties.find(p => p.id === s.detalles.hotelId)?.nombre || s.descripcion.split(" (")[0]?.replace("Hotel: ", "") || "Hotel";
                                  return (
                                    <React.Fragment key={s.id || idx}>
                                      {/* Header Hotel Row */}
                                      <tr className="bg-zinc-50/40 font-semibold border-t border-zinc-200">
                                        <td className="p-3 font-mono text-[10.5px] text-zinc-400">{s.id}</td>
                                        <td className="p-3 font-bold text-zinc-900">{s.tipo}</td>
                                        <td className="p-3 text-left leading-normal">
                                          <span className="text-zinc-900 font-extrabold">{hotelName}</span>
                                          <span className="block text-[9.5px] text-zinc-455 font-medium mt-0.5">
                                            IN: {formatDate(s.detalles.checkInDate)} / OUT: {formatDate(s.detalles.checkOutDate)} ({formatTarifaLabel(s.detalles, s.detalles.lodgingRooms[0]?.roomTypeId, activeRes.mercado || "NACIONAL")})
                                          </span>
                                        </td>
                                        {isDirecto ? (
                                          <td className="p-3 text-right font-bold text-zinc-955">${s.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                        ) : (
                                          <>
                                            <td className="p-3 text-right font-bold text-zinc-900">${pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-center font-bold text-zinc-650">
                                              {comisionPct}%
                                              <span className="text-[10.5px] text-zinc-400 block font-normal">
                                                (${Math.max(0, comisionAmt).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                                              </span>
                                            </td>
                                            <td className="p-3 text-right font-bold text-zinc-955">${s.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                          </>
                                        )}
                                      </tr>
                                      {/* Room Rows */}
                                      {s.detalles.lodgingRooms.map((room: any, rIdx: number) => {
                                        const rates = calculateRoomRates(room, s.detalles, activeRes.mercado || "NACIONAL", ratePlans, roomTypes);
                                        const roomTypeName = roomTypes.find(rt => rt.id === room.roomTypeId)?.nombre || "Habitación";
                                        const guestsNames = room.guests?.map((g: any) => `${g.name} (${g.type === "Adulto" ? "ADT" : "CHD"})`).filter((str: string) => str.replace(/\s*\([^)]+\)/g, "").trim() !== "").join(", ");
                                        return (
                                          <tr key={`${s.id}-rm-${rIdx}`} className="border-b border-zinc-100 last:border-b-zinc-200 bg-white">
                                            <td className="p-2.5"></td>
                                            <td className="p-2.5 text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider pl-5">Hab {rIdx + 1}</td>
                                            <td className="p-2.5 text-zinc-650 pl-5 text-left">
                                              <span className="font-semibold text-zinc-850 text-xs">{roomTypeName}</span>
                                              {guestsNames && <span className="block text-[10px] text-zinc-400 italic">Pasajeros: {guestsNames}</span>}
                                            </td>
                                            {isDirecto ? (
                                              <td className="p-2.5 text-right text-zinc-850 font-bold text-xs">${rates.sale.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                            ) : (
                                              <>
                                                <td className="p-2.5 text-right text-zinc-700 text-xs font-semibold">${rates.pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                                <td className="p-2.5 text-center text-zinc-500 text-[10.5px]">
                                                  {comisionPct}%
                                                  <span className="text-[9.5px] text-zinc-400 block font-normal">
                                                    (${rates.comisionB2BVal.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                                                  </span>
                                                </td>
                                                <td className="p-2.5 text-right text-zinc-850 font-bold text-xs">${rates.sale.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                              </>
                                            )}
                                          </tr>
                                        );
                                      })}
                                    </React.Fragment>
                                  );
                                }
                                
                                return (
                                  <tr key={s.id || idx} className="hover:bg-zinc-50/50">
                                    <td className="p-3 font-mono text-[10.5px] text-zinc-400">{s.id}</td>
                                    <td className="p-3 font-bold text-zinc-900">{s.tipo}</td>
                                    <td className="p-3 font-medium text-zinc-700 leading-normal">{s.descripcion}</td>
                                    {isDirecto ? (
                                      <td className="p-3 text-right font-bold text-zinc-955">${s.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                    ) : (
                                      <>
                                        <td className="p-3 text-right font-bold text-zinc-900">${pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                        <td className="p-3 text-center font-bold text-zinc-650">
                                          {comisionPct}%
                                          <span className="text-[10.5px] text-zinc-400 block font-normal">
                                            (${Math.max(0, comisionAmt).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                                          </span>
                                        </td>
                                        <td className="p-3 text-right font-bold text-zinc-955">${s.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })
                            ) : (
                              /* Fallback */
                              (() => {
                                const pvp = activeRes.totalPrice / 0.9;
                                const comisionAmt = pvp - activeRes.totalPrice;
                                return (
                                  <tr>
                                    <td className="p-3 font-mono text-[10.5px] text-zinc-400">SRV-01</td>
                                    <td className="p-3 font-bold text-zinc-900">Alojamiento</td>
                                    <td className="p-3 font-medium text-zinc-700 leading-normal">
                                      {activeRes.hotelName} - 7 noches - {activeRes.pax} Pax - Check-in: {formatDate(activeRes.checkIn)} ➔ Out: {formatDate(activeRes.checkOut)}
                                    </td>
                                    {isDirecto ? (
                                      <td className="p-3 text-right font-bold text-zinc-950">${activeRes.totalPrice.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                    ) : (
                                      <>
                                        <td className="p-3 text-right font-bold text-zinc-900">${pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                        <td className="p-3 text-center font-bold text-zinc-600">
                                          10%
                                          <span className="text-[10.5px] text-zinc-400 block font-normal">
                                            (${Math.max(0, comisionAmt).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                                          </span>
                                        </td>
                                        <td className="p-3 text-right font-bold text-zinc-950">${activeRes.totalPrice.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })()
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Notes */}
                    {activeRes.specialRequests && (
                      <div className="mt-6 space-y-2 font-sans">
                        <h5 className="font-bold text-[10px] uppercase text-zinc-455 tracking-wider">Observaciones / Requerimientos Especiales</h5>
                        <p className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-700 rounded text-xs leading-relaxed font-semibold">
                          {activeRes.specialRequests}
                        </p>
                      </div>
                    )}

                    {/* Totals Summary Card */}
                    <div className="mt-8 flex justify-end font-sans">
                      <div className="w-full sm:w-80 bg-zinc-50 border border-zinc-200 p-4.5 rounded-lg space-y-2.5">
                        {isDirecto ? (
                          <div className="flex justify-between items-end">
                            <span className="text-xs text-zinc-655 uppercase font-black tracking-wide">Total a Pagar:</span>
                            <span className="text-lg font-black text-zinc-955 font-mono">${totalPvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center text-xs text-zinc-550 uppercase font-bold tracking-wider">
                              <span>Total Venta Final (PVP):</span>
                              <span className="text-zinc-900 font-bold">${totalPvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-zinc-550 uppercase font-bold tracking-wider">
                              <span>Comisión de Agencia B2B:</span>
                              <span className="text-zinc-900 font-bold">-${totalComisionesB2B.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                            </div>
                            <div className="h-[1px] bg-zinc-200"></div>
                            <div className="flex justify-between items-end">
                              <span className="text-xs text-zinc-655 uppercase font-black tracking-wide">Neto a Pagar a Foratour:</span>
                              <span className="text-lg font-black text-zinc-955 font-mono">${totalVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })()}

              {/* Legal Disclaimer */}
              <div className="mt-10 border-t border-zinc-200 pt-6 text-center text-[10px] text-zinc-400 font-medium space-y-1 font-sans">
                <p>
                  {isDirecto
                    ? `Este documento es una cotización de viaje emitida por ${companyConfig.name} para uso exclusivo del pasajero.`
                    : <>Este documento es un comprobante de reserva comercial para uso exclusivo entre {companyConfig.name} y la agencia emisora.</>}
                </p>
                <p>{companyConfig.name} | RIF: {companyConfig.rif} | {companyConfig.address} | Email: {companyConfig.email}</p>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-zinc-50 border-t border-zinc-200 px-5 py-4 flex justify-between items-center no-print">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Info className="w-3.5 h-3.5 text-zinc-450" />
                Presione Ctrl+P o use el botón para imprimir o guardar como PDF
              </span>
              
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowB2BModal(false)}
                  className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer font-sans"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs flex items-center gap-1.5 font-sans"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isDirecto ? "Imprimir / PDF Cotización" : "Imprimir / PDF B2B"}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
        );
      })()}

      {showB2BModal && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              visibility: hidden !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-b2b-doc, #printable-b2b-doc * {
              visibility: visible !important;
            }
            #printable-b2b-doc {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 20px !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            /* Ocultar elementos de pantalla físicamente */
            aside, header, footer, .no-print, button, .modal-backdrop {
              display: none !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            {/* Resetear contenedores padres */}
            html, body, #root, .min-h-screen, .fixed:not(.print-modal-container) {
              position: static !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
            }
            .print-modal-container {
              position: static !important;
              display: block !important;
              background: transparent !important;
              backdrop-filter: none !important;
              padding: 0 !important;
              margin: 0 !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
              z-index: 99999 !important;
            }
            .print-modal-content {
              background: none !important;
              border: none !important;
              box-shadow: none !important;
              max-width: 100% !important;
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
              display: block !important;
            }
          }
        `}} />
      )}

      {/* MODAL VOUCHER DE VIAJE OFICIAL EN RESERVAS */}
      {showVoucherModal && activeRes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans print-modal-container">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh] print-modal-content">
            {/* Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between no-print">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 font-sans">
                  <Printer className="w-4.5 h-4.5 text-zinc-400" /> Voucher de Servicios de Viaje
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 font-sans">
                  Documento de viaje oficial para el pasajero (sin precios ni márgenes expuestos).
                </p>
              </div>
              <button 
                onClick={() => setShowVoucherModal(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area */}
            <div className="p-8 overflow-y-auto flex-1 bg-white" id="printable-voucher-doc">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-zinc-900 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-zinc-950 text-white flex items-center justify-center font-black text-base font-sans">
                      {companyConfig.logoLetter}
                    </div>
                    <div>
                      <h2 className="font-black text-base tracking-tight leading-none text-zinc-955 font-sans uppercase">{companyConfig.name}</h2>
                      <span className="text-[8px] uppercase tracking-widest font-extrabold text-zinc-400 block font-sans">{companyConfig.subtitle}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium font-sans">
                    {companyConfig.tagline || companyConfig.subtitle}
                  </p>
                </div>
                
                <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-1.5 font-sans">
                  <span className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-250 text-emerald-800 rounded text-[9px] font-black uppercase tracking-wider">
                    VOUCHER DE SERVICIOS
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-900">LOCALIZADOR: {activeRes.id}</span>
                </div>
              </div>

              {/* Paid Stamp */}
              <div className="border border-emerald-250 bg-emerald-50/40 rounded-lg p-4 mb-6 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold uppercase text-emerald-800 font-sans">Estado: SERVICIOS CONCILIADOS Y CONFIRMADOS</h4>
                  <p className="text-[10.5px] text-zinc-650 leading-relaxed font-semibold font-sans">
                    Este documento acredita que los servicios listados a continuación están totalmente pagados al proveedor y garantizados por {companyConfig.name}. Presente este voucher al proveedor del servicio al iniciar su viaje.
                  </p>
                </div>
                <div className="flex-shrink-0 w-24 h-24 border-4 border-emerald-600/40 rounded-full flex flex-col items-center justify-center text-center rotate-12 font-sans select-none">
                  <span className="text-[9px] font-black uppercase text-emerald-600/60 leading-none">{companyConfig.name.split(' ')[0]}</span>
                  <span className="text-sm font-black text-emerald-600 uppercase tracking-widest mt-1">CONFIRMADO</span>
                  <span className="text-[8px] font-mono text-emerald-500 mt-0.5 leading-none">OK</span>
                </div>
              </div>

              {/* Pax lead and travel info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 border-b border-zinc-200 pb-6">
                <div className="space-y-1.5">
                  <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-wider font-sans">Titular de la Reserva</h5>
                  <p className="text-sm font-black text-zinc-955 leading-tight uppercase font-sans">{activeRes.holder}</p>
                  <div className="text-xs text-zinc-650 font-semibold space-y-0.5">
                    <p className="font-mono">📱 Contacto Tel: {activeRes.telefono || "Sin registrar"}</p>
                    <p className="font-mono">✉ Contacto Email: {activeRes.email || "Sin registrar"}</p>
                  </div>
                </div>
                
                <div className="space-y-1.5 sm:text-right font-sans">
                  <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Detalles de Operación</h5>
                  <p className="text-xs font-semibold text-zinc-850">
                    Fecha de Ingreso: <span className="font-bold text-zinc-950 font-mono">{activeRes.checkIn}</span>
                  </p>
                  <p className="text-xs font-semibold text-zinc-850">
                    Fecha de Salida: <span className="font-bold text-zinc-950 font-mono">{activeRes.checkOut}</span>
                  </p>
                  <p className="text-xs font-semibold text-zinc-850">
                    Total Pasajeros: <span className="font-bold text-zinc-950">{activeRes.pax} Pax</span>
                  </p>
                  {activeRes.flightNo && (
                    <p className="text-xs font-semibold text-zinc-850">
                      Vuelo de Conexión: <span className="font-bold font-mono text-zinc-900">{activeRes.flightNo}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Vuelos Conjuntos Facturados */}
              {(() => {
                const vuelosFacturados = boletos.filter(b => b.expedienteId === activeRes.id && b.facturarConjunto && (b.expedienteAereo?.status === "Facturado" || b.expedienteAereo?.status === "PagadoAerolinea"));
                if (vuelosFacturados.length === 0) return null;
                
                return (
                  <div className="space-y-4 mb-6">
                    <h5 className="text-[9.5px] font-black text-zinc-455 uppercase tracking-widest border-b border-zinc-150 pb-1.5 font-sans">Itinerario de Vuelo Aéreo</h5>
                    <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/30">
                      {vuelosFacturados.map((vuelo) => (
                        <div key={vuelo.id} className="p-4 bg-white space-y-3 break-inside-avoid print:break-inside-avoid">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.5 bg-blue-900 text-white rounded text-[8px] font-black uppercase tracking-wider font-sans">
                              BOLETO AÉREO GDS
                            </span>
                            <span className="text-[9px] font-mono text-zinc-455 font-semibold">PNR: {vuelo.pnr}</span>
                          </div>
                          
                          <div className="space-y-2 mt-2">
                            {(vuelo.segmentos?.map ? vuelo.segmentos : []).map((seg, i) => (
                              <div key={i} className="flex items-center gap-3 text-xs">
                                <span className="font-mono font-bold text-zinc-400 text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                                <span className="font-bold text-zinc-800 font-mono">{seg.aerolinea}{seg.numeroVuelo}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-zinc-950">{seg.origen}</span>
                                  <span className="text-zinc-300">→</span>
                                  <span className="font-bold text-zinc-950">{seg.destino}</span>
                                </div>
                                <span className="ml-auto text-zinc-600 font-medium">
                                  {formatGDSDate(seg.fecha)} · Salida: {seg.horaSalida}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="bg-zinc-50 border border-zinc-150 rounded p-2.5 text-[10.5px] text-zinc-650 font-semibold space-y-1 font-sans mt-3">
                            <span className="text-[8.5px] font-black text-zinc-400 uppercase tracking-wider block">Instrucciones de Embarque</span>
                            <p>Preséntese en el mostrador de la aerolínea 3 horas antes de la salida programada del vuelo para el check-in internacional, o 2 horas antes para vuelos domésticos. El equipaje permitido dependerá de la política de la clase {vuelo.segmentos[0]?.clase || "Y"}.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Services List (Only Billed) */}
              <div className="space-y-4 mb-6">
                <h5 className="text-[9.5px] font-black text-zinc-455 uppercase tracking-widest border-b border-zinc-150 pb-1.5 font-sans">Servicios Confirmados</h5>
                <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/30">
                  {activeRes.servicios?.filter(s => s.statusFacturacion === "Facturado").map((s) => (
                    <div key={s.id} className="p-4 bg-white space-y-2 break-inside-avoid print:break-inside-avoid">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 bg-zinc-900 text-white rounded text-[8px] font-black uppercase tracking-wider font-sans">
                          {s.tipo}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-455 font-semibold">Cód. Servicio: {s.id}</span>
                      </div>
                      
                      <div className="text-xs text-zinc-900">
                        <p className="font-extrabold text-sm text-zinc-955 leading-snug font-sans">{s.descripcion}</p>
                      </div>

                      {/* Pax instructions based on service type */}
                      <div className="bg-zinc-50 border border-zinc-150 rounded p-2.5 text-[10.5px] text-zinc-650 font-semibold space-y-1 font-sans">
                        <span className="text-[8.5px] font-black text-zinc-400 uppercase tracking-wider block">Instrucciones para el Viajero</span>
                        {s.tipo === ServiceType.ALOJAMIENTO && (
                          <p>Presente este voucher impreso o digital al momento del Check-in en la recepción del hotel. El alojamiento incluye desayuno e impuestos locales, salvo tasas municipales de pago directo en destino si las hubiere.</p>
                        )}
                        {s.tipo === ServiceType.TRASLADO && (
                          <p>Al llegar, el conductor le estará esperando en el hall de salidas con un cartel indicando su nombre. El tiempo de espera máximo es de 60 minutos tras el aterrizaje del vuelo registrado.</p>
                        )}
                        {s.tipo === ServiceType.SEGURO && (
                          <p>En caso de requerir asistencia médica o urgencias durante el viaje, comuníquese de inmediato al número de emergencia del proveedor internacional impreso en su póliza adjunta.</p>
                        )}
                        {s.tipo === ServiceType.RENT_A_CAR && (
                          <p>Deberá presentar licencia de conducir vigente, pasaporte e tarjeta de crédito a nombre del conductor principal como garantía para el retiro del vehículo.</p>
                        )}
                        {s.tipo === ServiceType.MANUAL && (
                          <p>Por favor contacte al operador receptivo local o siga las indicaciones adjuntas en sus notas de confirmación de itinerario de viaje.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Requests if present */}
              {activeRes.specialRequests && (
                <div className="bg-zinc-50 border border-zinc-150 rounded-lg p-4 mb-6 space-y-1 font-sans">
                  <h5 className="text-[9px] font-black text-zinc-455 uppercase tracking-wider">Notas de Coordinación / Requerimientos</h5>
                  <p className="text-xs text-zinc-800 leading-relaxed font-semibold italic">{activeRes.specialRequests}</p>
                </div>
              )}

              {/* Legal disclaimer */}
              <div className="mt-10 border-t border-zinc-200 pt-6 text-center text-[10px] text-zinc-400 font-medium space-y-1 font-sans">
                <p>Este voucher sirve como constancia oficial de servicios. {companyConfig.name} actúa como intermediario en la prestación de estos servicios y no se hace responsable por retrasos, cancelaciones fortuitas o modificaciones imputables directamente a los proveedores de servicio final.</p>
                <p>{companyConfig.name} | RIF: {companyConfig.rif} | {companyConfig.address} | Email: {companyConfig.email}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-zinc-50 border-t border-zinc-200 px-5 py-4 flex justify-end gap-2.5 no-print font-sans">
              <button
                onClick={() => setShowVoucherModal(false)}
                className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Voucher (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showVoucherModal && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              visibility: hidden !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-voucher-doc, #printable-voucher-doc * {
              visibility: visible !important;
            }
            #printable-voucher-doc {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 20px !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            aside, header, footer, .no-print, button, .modal-backdrop, .print-modal-container button {
              display: none !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            html, body, #root, .min-h-screen, .fixed:not(.print-modal-container) {
              position: static !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
            }
            .print-modal-container {
              position: static !important;
              display: block !important;
              background: transparent !important;
              backdrop-filter: none !important;
              padding: 0 !important;
              margin: 0 !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
              z-index: 99999 !important;
            }
            .print-modal-content {
              background: none !important;
              border: none !important;
              box-shadow: none !important;
              max-width: 100% !important;
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
              display: block !important;
            }
          }
        `}} />
      )}

      {showSendBillingModal && activeRes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans no-print">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                  <Send className="w-4 h-4 text-zinc-400" /> Solicitud de Facturación
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Expediente ID: {activeRes.id} | Titular: {activeRes.holder}
                </p>
              </div>
              <button 
                onClick={() => setShowSendBillingModal(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {billingModalError && (
                <div className="bg-red-50 border border-red-250 text-red-700 p-2.5 rounded text-[11px] font-semibold flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{billingModalError}</span>
                </div>
              )}

              {(() => {
                const saleClient = resolveSaleClient(activeRes, clients, directClients);
                const isCreditAgency = isCreditEligible(saleClient);
                const clientLabel = saleClient.kind === "Directo"
                  ? saleClient.client.nombre
                  : (activeRes.agenciaName || "Directo / Pasajero");

                return (
                  <div className="space-y-4 text-left">
                    {/* Agency Type Label */}
                    <div className="bg-zinc-50 border border-zinc-200 p-3 rounded text-xs font-semibold text-zinc-750 space-y-1">
                      <div className="flex justify-between">
                        <span>Canal de Venta:</span>
                        <span className="font-bold text-zinc-900">{clientLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Modalidad Comercial:</span>
                        <span className={`px-1.5 py-0.25 rounded text-[9px] font-bold uppercase border ${
                          isCreditAgency
                            ? "bg-purple-50 border-purple-200 text-purple-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                          {isCreditAgency ? "Línea de Crédito" : (saleClient.client ? `${saleClient.client.tipo} (Pago Contado)` : "Venta Directa (Pago Contado)")}
                        </span>
                      </div>
                    </div>

                    {/* Choose Billing Option if Credit Agency */}
                    {isCreditAgency ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-zinc-400">Modalidad de Envío</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setBillingFacturacionTipo("Crédito")}
                            className={`py-2 px-3 border rounded text-xs font-bold transition-all ${
                              billingFacturacionTipo === "Crédito"
                                ? "bg-zinc-950 border-zinc-950 text-white"
                                : "bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            Facturar a Crédito
                          </button>
                          <button
                            type="button"
                            onClick={() => setBillingFacturacionTipo("Pago Contado")}
                            className={`py-2 px-3 border rounded text-xs font-bold transition-all ${
                              billingFacturacionTipo === "Pago Contado"
                                ? "bg-zinc-950 border-zinc-950 text-white"
                                : "bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            Pago Contado (Inmediato)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-[9.5px] uppercase font-black text-amber-750 bg-amber-50/50 border border-amber-200 p-2.5 rounded block text-center leading-normal">
                          ⚠️ Nota: Este cliente opera bajo prepago. Es obligatorio adjuntar el comprobante de cobro recibido para enviar a facturación.
                        </span>
                      </div>
                    )}

                    {/* Receipt Details Fields (Always visible if Pago Contado) */}
                    {billingFacturacionTipo === "Pago Contado" && (
                      <div className="space-y-3 pt-2 border-t border-zinc-150 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Método de Pago</label>
                            <select
                              value={billingMetodo}
                              onChange={(e) => setBillingMetodo(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-zinc-250 rounded text-xs font-semibold bg-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                            >
                              <option value="Transferencia Bancaria">Transferencia</option>
                              <option value="Pago Móvil">Pago Móvil</option>
                              <option value="Zelle">Zelle</option>
                              <option value="Efectivo / Divisas">Efectivo / Divisas</option>
                              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Monto Cobrado ($)</label>
                            <input
                              type="number"
                              value={billingMonto}
                              onChange={(e) => setBillingMonto(e.target.value)}
                              placeholder="Monto"
                              className="w-full px-2.5 py-1.5 border border-zinc-250 rounded text-xs font-semibold bg-white focus:outline-none focus:border-zinc-500 font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Nro. de Referencia / Comprobante</label>
                          <input
                            type="text"
                            value={billingRef}
                            onChange={(e) => setBillingRef(e.target.value)}
                            placeholder="Ej: REF-90214 o Nro Operación"
                            className="w-full px-2.5 py-1.5 border border-zinc-250 rounded text-xs font-semibold bg-white focus:outline-none focus:border-zinc-500 uppercase font-mono"
                          />
                        </div>
                        <div className="mt-3">
                          <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Adjuntar Archivo de Pago (Simulado)</label>
                          <div className="border border-dashed border-zinc-300 bg-zinc-50 rounded p-2.5 flex items-center justify-center cursor-pointer hover:bg-zinc-100 relative">
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setBillingFile(file.name);
                              }}
                            />
                            <span className="text-[10px] font-bold text-zinc-600">
                              {billingFile ? `✓ ${billingFile}` : "Clic para adjuntar archivo"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-zinc-50 border-t border-zinc-200 px-5 py-3.5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSendBillingModal(false)}
                className="px-4 py-1.5 border border-zinc-250 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSendBilling}
                className="px-5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirmar & Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DETALLE DE COMPROBANTE PROVEEDOR --- */}
      {showProvReceiptModal && selectedObligationForReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up border border-zinc-200">
            
            {/* Modal Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">Comprobante de Pago a Proveedor</h4>
                  <p className="text-[10px] text-zinc-400 font-medium">Auditoría y Soporte de Egreso - Tesorería</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProvReceiptModal(false);
                  setSelectedObligationForReceipt(null);
                }}
                className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-left text-xs">
              
              {/* Receipt Preview card */}
              <div className="bg-zinc-900 text-zinc-100 rounded-lg p-5 border border-zinc-800 font-mono shadow-md relative overflow-hidden">
                {/* Decorative background watermark */}
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 rotate-12">
                  <CheckCircle2 className="w-48 h-48" />
                </div>

                <div className="flex justify-between border-b border-zinc-850 pb-2 mb-3 items-center">
                  <span className="text-[9.5px] uppercase font-black text-zinc-500 tracking-wider">Foratour ERP - Comprobante de Egreso</span>
                  <span className="text-[10.5px] font-black text-emerald-400">{selectedObligationForReceipt.id}</span>
                </div>

                <div className="space-y-2 font-semibold">
                  <div className="grid grid-cols-3">
                    <span className="text-zinc-550 text-[10px] uppercase">Beneficiario:</span>
                    <span className="col-span-2 font-bold text-white uppercase text-[11px] truncate">{selectedObligationForReceipt.providerName}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-zinc-550 text-[10px] uppercase">Localizador:</span>
                    <span className="col-span-2 font-bold text-white text-[11px]">{selectedObligationForReceipt.locatorId}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-zinc-550 text-[10px] uppercase">Importe Neto:</span>
                    <span className="col-span-2 font-bold text-zinc-100 text-[11.5px]">${selectedObligationForReceipt.netCost.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-zinc-550 text-[10px] uppercase">Método Pago:</span>
                    <span className="col-span-2 font-bold text-zinc-100 text-[11px]">{selectedObligationForReceipt.paymentMethod || "Transferencia Bancaria"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-zinc-550 text-[10px] uppercase">Nro Operación:</span>
                    <span className="col-span-2 font-bold text-emerald-400 text-[11.5px] tracking-wide select-all">{selectedObligationForReceipt.reference || "N/A"}</span>
                  </div>
                  {selectedObligationForReceipt.date && (
                    <div className="grid grid-cols-3">
                      <span className="text-zinc-555 text-[10px] uppercase">Fecha Emisión:</span>
                      <span className="col-span-2 font-bold text-zinc-200 text-[11px]">{formatDate(selectedObligationForReceipt.date)}</span>
                    </div>
                  )}
                </div>

                {selectedObligationForReceipt.notes && (
                  <div className="border-t border-zinc-850 pt-2.5 mt-3 text-[10px] text-zinc-400 italic">
                    Notas: {selectedObligationForReceipt.notes}
                  </div>
                )}
              </div>

              {/* Support file reference */}
              <div className="space-y-1.5 bg-zinc-50 border border-zinc-200 p-4 rounded">
                <span className="text-[10px] uppercase font-bold text-zinc-455 block">Archivo Adjunto de Tesorería</span>
                <div className="flex items-center justify-between bg-white border border-zinc-200 rounded p-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-zinc-450" />
                    <div>
                      <span className="font-bold text-zinc-800 block text-[11px]">{selectedObligationForReceipt.attachedFile || "soporte_pago.pdf"}</span>
                      <span className="text-[9.5px] text-zinc-450 block">Tamaño: 1.2 MB | Formato: PDF</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold uppercase">
                    Verificado
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-zinc-50 border-t border-zinc-200 px-5 py-4 flex justify-between gap-3 font-semibold">
              <button
                type="button"
                onClick={() => {
                  setShowProvReceiptModal(false);
                  setSelectedObligationForReceipt(null);
                }}
                className="px-4 py-2 border border-zinc-250 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    showAlert({ title: "Descarga de soporte", message: `Simulando descarga de soporte: ${selectedObligationForReceipt.attachedFile || "soporte_pago.pdf"}`, type: "info" });
                  }}
                  className="px-4 py-2 border border-zinc-250 hover:bg-zinc-100 text-zinc-700 bg-white rounded text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showAlert({ title: "Comprobante enviado", message: `El comprobante de pago ha sido enviado exitosamente al correo del proveedor legal: ${selectedObligationForReceipt.providerName}.`, type: "success" });
                    setShowProvReceiptModal(false);
                    setSelectedObligationForReceipt(null);
                  }}
                  className="px-5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" /> Enviar a Proveedor
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL DETALLE DE COMPROBANTE CLIENTE --- */}
      {showClientReceiptModal && selectedVoucherForReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up border border-zinc-200">

            {/* Modal Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">Comprobante de Pago del Cliente</h4>
                  <p className="text-[10px] text-zinc-400 font-medium">Auditoría y Soporte de Cobro - Cobranzas B2B</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowClientReceiptModal(false);
                  setSelectedVoucherForReceipt(null);
                }}
                className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-left text-xs">

              {/* Receipt Preview card */}
              <div className="bg-zinc-900 text-zinc-100 rounded-lg p-5 border border-zinc-800 font-mono shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 rotate-12">
                  <CheckCircle2 className="w-48 h-48" />
                </div>

                <div className="flex justify-between border-b border-zinc-850 pb-2 mb-3 items-center">
                  <span className="text-[9.5px] uppercase font-black text-zinc-500 tracking-wider">Foratour ERP - Comprobante de Ingreso</span>
                  <span className="text-[10.5px] font-black text-emerald-400">{selectedVoucherForReceipt.id}</span>
                </div>

                <div className="space-y-2 font-semibold">
                  <div className="grid grid-cols-3">
                    <span className="text-zinc-550 text-[10px] uppercase">Cliente:</span>
                    <span className="col-span-2 font-bold text-white uppercase text-[11px] truncate">{selectedVoucherForReceipt.clientName}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-zinc-550 text-[10px] uppercase">Localizador:</span>
                    <span className="col-span-2 font-bold text-white text-[11px]">{selectedVoucherForReceipt.locatorId || activeRes.id}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-zinc-550 text-[10px] uppercase">Importe:</span>
                    <span className="col-span-2 font-bold text-zinc-100 text-[11.5px]">${selectedVoucherForReceipt.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-zinc-550 text-[10px] uppercase">Método Pago:</span>
                    <span className="col-span-2 font-bold text-zinc-100 text-[11px]">{selectedVoucherForReceipt.method}{selectedVoucherForReceipt.bankName ? ` (${selectedVoucherForReceipt.bankName})` : ""}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-zinc-550 text-[10px] uppercase">Nro Referencia:</span>
                    <span className="col-span-2 font-bold text-emerald-400 text-[11.5px] tracking-wide select-all">{selectedVoucherForReceipt.reference || "N/A"}</span>
                  </div>
                  {selectedVoucherForReceipt.invoiceId && (
                    <div className="grid grid-cols-3">
                      <span className="text-zinc-550 text-[10px] uppercase">Factura:</span>
                      <span className="col-span-2 font-bold text-zinc-200 text-[11px]">{selectedVoucherForReceipt.invoiceId}</span>
                    </div>
                  )}
                  {selectedVoucherForReceipt.date && (
                    <div className="grid grid-cols-3">
                      <span className="text-zinc-555 text-[10px] uppercase">Fecha:</span>
                      <span className="col-span-2 font-bold text-zinc-200 text-[11px]">{formatDate(selectedVoucherForReceipt.date)}</span>
                    </div>
                  )}
                </div>

                {selectedVoucherForReceipt.notes && (
                  <div className="border-t border-zinc-850 pt-2.5 mt-3 text-[10px] text-zinc-400 italic">
                    Notas: {selectedVoucherForReceipt.notes}
                  </div>
                )}
              </div>

              {/* Support file reference */}
              <div className="space-y-1.5 bg-zinc-50 border border-zinc-200 p-4 rounded">
                <span className="text-[10px] uppercase font-bold text-zinc-455 block">Archivo Adjunto de Cobranzas</span>
                <div className="flex items-center justify-between bg-white border border-zinc-200 rounded p-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-zinc-450" />
                    <div>
                      <span className="font-bold text-zinc-800 block text-[11px]">{selectedVoucherForReceipt.attachedFile || "comprobante_registrado.jpg"}</span>
                      <span className="text-[9.5px] text-zinc-450 block">Tamaño: 1.2 MB | Formato: PDF</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    selectedVoucherForReceipt.status === "Verificado" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    selectedVoucherForReceipt.status === "Rechazado" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {selectedVoucherForReceipt.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-zinc-50 border-t border-zinc-200 px-5 py-4 flex justify-between gap-3 font-semibold">
              <button
                type="button"
                onClick={() => {
                  setShowClientReceiptModal(false);
                  setSelectedVoucherForReceipt(null);
                }}
                className="px-4 py-2 border border-zinc-250 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => {
                  showAlert({ title: "Descarga de soporte", message: `Simulando descarga de soporte: ${selectedVoucherForReceipt.attachedFile || "comprobante_registrado.jpg"}`, type: "info" });
                }}
                className="px-4 py-2 border border-zinc-250 hover:bg-zinc-100 text-zinc-700 bg-white rounded text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-3xs"
              >
                <Download className="w-3.5 h-3.5" /> Descargar PDF
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL PREVISUALIZACION DE IMPACTO FINANCIERO (UX) --- */}
      {financialImpactPreview && pendingSaveReservation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up border border-zinc-200">
            {/* Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">Modificación con Impacto Financiero</h4>
                  <p className="text-[10px] text-zinc-400 font-medium">Reconciliación y Conciliación de Saldos en Tiempo Real</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFinancialImpactPreview(null);
                  setPendingSaveReservation(null);
                }}
                className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-left">
              <p className="text-[11px] text-zinc-650 leading-relaxed font-semibold">
                Hemos recalculado los costos de esta modificación. A continuación se desglosa el impacto contable para el cliente y proveedores:
              </p>

              {/* Auditoria de cambios */}
              <div className="bg-zinc-50 border border-zinc-150 rounded-md p-4 space-y-2">
                <span className="text-[9px] uppercase font-bold text-zinc-450 block">Detalles del Ajuste</span>
                <ul className="space-y-1.5 text-xs text-zinc-700 font-medium">
                  {financialImpactPreview.log.map((logItem: string, i: number) => (
                    <li key={i} className="flex gap-2 items-start leading-normal">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{logItem}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Variaciones y Saldos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 border border-emerald-150 p-3 rounded text-left">
                  <span className="text-[8.5px] uppercase font-bold text-emerald-800 tracking-wider block">Crédito / A Favor</span>
                  <p className="font-bold text-emerald-700 text-sm mt-1 font-mono">
                    {(() => {
                      const client = clients.find(c => c.nombre.toLowerCase() === pendingSaveReservation.agenciaName?.toLowerCase());
                      const isCreditAgent = client?.limiteCredito && client.limiteCredito > 0;
                      
                      const creditTotal = financialImpactPreview.newWalletTransactions
                        .filter((tx: any) => tx.type === "Abono" || tx.type === "Reembolso")
                        .reduce((sum: number, tx: any) => sum + tx.amount, 0);

                      if (isCreditAgent) {
                        return "Se reduce deuda directamente";
                      }
                      return creditTotal > 0 ? `+$${creditTotal.toFixed(2)} USD` : "$0.00 USD";
                    })()}
                  </p>
                  <span className="text-[9px] text-emerald-600 font-medium block leading-normal mt-0.5">
                    {(() => {
                      const client = clients.find(c => c.nombre.toLowerCase() === pendingSaveReservation.agenciaName?.toLowerCase());
                      const isCreditAgent = client?.limiteCredito && client.limiteCredito > 0;
                      return isCreditAgent 
                        ? "Las agencias a crédito ven reflejada la devolución en su saldo deudor acumulado."
                        : "El saldo restante del servicio cancelado se abonará a la Billetera Virtual B2B.";
                    })()}
                  </span>
                </div>

                <div className="bg-red-50/50 border border-red-150 p-3 rounded text-left">
                  <span className="text-[8.5px] uppercase font-bold text-red-800 tracking-wider block">Penalidades</span>
                  <p className="font-bold text-red-700 text-sm mt-1 font-mono">
                    {(() => {
                      const penaltyTotal = financialImpactPreview.newWalletTransactions
                        .filter((tx: any) => tx.type === "Penalidad" || tx.type === "Cargo")
                        .reduce((sum: number, tx: any) => sum + tx.amount, 0);
                      return penaltyTotal > 0 ? `$${penaltyTotal.toFixed(2)} USD` : "$0.00 USD";
                    })()}
                  </p>
                  <span className="text-[9px] text-red-500 font-medium block leading-normal mt-0.5">
                    Las penalidades y multas de cancelación se retendrán como costo administrativo no reembolsable.
                  </span>
                </div>
              </div>

              {/* Proveedores bloqueados */}
              {financialImpactPreview.updatedPayableObligations.some((o: any) => o.isFrozen) && (
                <div className="bg-amber-50 border border-amber-250 rounded p-3 text-left">
                  <span className="text-[9px] uppercase font-bold text-amber-800 block">⚠️ Pagos a Proveedores Bloqueados</span>
                  <p className="text-[10px] text-amber-700 mt-1 leading-relaxed font-semibold">
                    Se han congelado preventivamente las obligaciones de pago de los servicios cancelados a los proveedores:
                  </p>
                  <ul className="list-disc list-inside text-[10px] text-amber-800 font-bold mt-1 space-y-0.5">
                    {financialImpactPreview.updatedPayableObligations
                      .filter((o: any) => o.isFrozen)
                      .map((o: any, idx: number) => (
                        <li key={idx}>{o.providerName} (Ref: {o.locatorId}) - ${o.netCost.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-zinc-50 border-t border-zinc-200 px-5 py-4 flex justify-between gap-3 font-semibold">
              <button
                type="button"
                onClick={() => {
                  setFinancialImpactPreview(null);
                  setPendingSaveReservation(null);
                }}
                className="px-4 py-2 border border-zinc-250 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase cursor-pointer"
              >
                Volver y Editar
              </button>
              <button
                type="button"
                onClick={handleConfirmFinancialImpactSave}
                className="px-5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Confirmar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DRAWER: BUSCADOR DE BOLETOS AÉREOS
          Deslizante desde la derecha, activado desde el formulario de expediente.
      ══════════════════════════════════════════════════════════════════════ */}
      {showBoletoDrawer && (() => {
        // Filtrar boletos libres según la búsqueda del agente
        const query = boletoSearch.trim().toUpperCase();
        const boletosLibres = boletos.filter(b => !b.vinculadoAExpediente && b.expedienteAereo?.status !== "Anulado");
        const resultados = query.length === 0
          ? boletosLibres
          : boletosLibres.filter(b => {
              const pasajeros = b.pasajeros?.map ? b.pasajeros : [];
              const segmentos = b.segmentos?.map ? b.segmentos : [];
              return (b.pnr || "").includes(query) ||
              pasajeros.some(p =>
                (p?.nombre || "").includes(query) ||
                (p?.nombre || "").split("/").some(part => part.includes(query))
              ) ||
              segmentos.some(s =>
                (s?.origen || "").includes(query) || (s?.destino || "").includes(query) ||
                (s?.aerolinea || "").includes(query) || (s?.numeroVuelo || "").includes(query)
              )
            });

        return (
          <>
            {/* Overlay oscuro */}
            <div
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
              onClick={() => setShowBoletoDrawer(false)}
            />

            {/* Panel deslizante */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">

              {/* Header del drawer */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-zinc-950 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Boletos Aéreos</h3>
                    <p className="text-[10px] text-zinc-400 font-medium">
                      {boletosLibres.length} disponible{boletosLibres.length !== 1 ? "s" : ""} para vincular
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBoletoDrawer(false)}
                  className="w-7 h-7 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Barra de búsqueda */}
              <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="drawer-boleto-search"
                    autoFocus
                    type="text"
                    value={boletoSearch}
                    onChange={e => setBoletoSearch(e.target.value)}
                    placeholder="Buscar por nombre, PNR, ruta, aerolínea..."
                    className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:border-zinc-500 font-medium"
                  />
                </div>
                {query.length > 0 && (
                  <p className="text-[10px] text-zinc-400 font-medium mt-1.5">
                    {resultados.length} resultado{resultados.length !== 1 ? "s" : ""} para "{boletoSearch}"
                  </p>
                )}
              </div>

              {/* Lista de boletos */}
              <div className="flex-1 overflow-y-auto">
                {boletosLibres.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                      <Plane className="w-5 h-5 text-zinc-300" />
                    </div>
                    <p className="text-sm font-bold text-zinc-500 mb-1">Sin boletos cargados</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Ve al módulo de <strong>Vuelos</strong> y carga un PNR primero para poder vincularlo aquí.
                    </p>
                  </div>
                ) : resultados.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 text-xs font-medium">
                    Sin resultados para "{boletoSearch}"
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {resultados.map(b => {
                      const segmentos = b.segmentos?.map ? b.segmentos : [];
                      const pasajeros = b.pasajeros?.map ? b.pasajeros : [];
                      const ruta = buildRoute(segmentos);
                      const primerSeg = segmentos[0];
                      const ultimoSeg = segmentos[segmentos.length - 1];
                      const margen = b.precioVenta > 0 && b.costoNeto > 0
                        ? ((b.precioVenta - b.costoNeto) / b.precioVenta * 100).toFixed(1)
                        : null;

                      return (
                        <div key={b.id} className="p-4 hover:bg-zinc-50 transition-colors">

                          {/* Cabecera del boleto */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-zinc-900 tracking-wider">
                                {b.pnr}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-zinc-100 text-zinc-500 border border-zinc-200 rounded">
                                {segmentos.length} tramo{segmentos.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <button
                              id={`btn-vincular-${b.id}`}
                              onClick={() => {
                                if (!cartLinkedFlights.some(f => f.id === b.id)) {
                                  setCartLinkedFlights(prev => [...prev, { id: b.id, facturarConjunto: false }]);
                                }
                                setCartFlightNo(prev => prev ? `${prev}, ${b.pnr}` : b.pnr);
                                setShowBoletoDrawer(false);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold rounded hover:bg-zinc-700 transition-colors cursor-pointer flex-shrink-0"
                            >
                              <Plane className="w-3 h-3" />
                              Vincular
                            </button>
                          </div>

                          {/* Ruta visual */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="text-center">
                              <p className="text-lg font-black text-zinc-900 leading-none">{primerSeg?.origen ?? "—"}</p>
                              <p className="text-[9px] text-zinc-400 font-medium mt-0.5">{primerSeg ? formatGDSDate(primerSeg.fecha) : ""}</p>
                            </div>
                            <div className="flex-1 flex items-center gap-1">
                              <div className="flex-1 h-[1px] bg-zinc-200" />
                              <Plane className="w-3.5 h-3.5 text-zinc-400 rotate-0" />
                              {segmentos.length > 1 && (
                                <span className="text-[8px] font-bold text-zinc-400 bg-zinc-100 px-1 rounded">
                                  {segmentos.length - 1} esc
                                </span>
                              )}
                              <div className="flex-1 h-[1px] bg-zinc-200" />
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-black text-zinc-900 leading-none">{ultimoSeg?.destino ?? "—"}</p>
                              <p className="text-[9px] text-zinc-400 font-medium mt-0.5">{ultimoSeg ? formatGDSDate(ultimoSeg.fecha) : ""}</p>
                            </div>
                          </div>

                          {/* Segmentos detallados */}
                          <div className="space-y-1 mb-3">
                            {segmentos.map((seg, i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px] bg-zinc-50 px-2.5 py-1.5 rounded border border-zinc-100">
                                <span className="font-mono font-bold text-zinc-700 w-12 flex-shrink-0">
                                  {seg.aerolinea}{seg.numeroVuelo}
                                </span>
                                <span className="text-zinc-400 font-bold w-4 flex-shrink-0 text-center">{seg.clase}</span>
                                <span className="font-bold text-zinc-800">{seg.origen}</span>
                                <ArrowRight className="w-2.5 h-2.5 text-zinc-300 flex-shrink-0" />
                                <span className="font-bold text-zinc-800">{seg.destino}</span>
                                <span className="ml-auto text-zinc-400 font-mono">{seg.horaSalida}</span>
                                <span className={`text-[8px] font-black px-1 py-0.5 rounded border ${
                                  seg.status.startsWith("HK")
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>{seg.status}</span>
                              </div>
                            ))}
                          </div>

                          {/* Pasajeros */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {(b.pasajeros?.map ? b.pasajeros : []).map((p, i) => (
                              <span key={i} className="text-[9px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                                {p.nombre} <span className="text-zinc-400">{p.tipo}</span>
                              </span>
                            ))}
                          </div>

                          {/* Datos financieros */}
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex gap-3">
                              <span className="text-zinc-400 font-medium">
                                Neto: <strong className="text-zinc-700">${b.costoNeto.toLocaleString()}</strong>
                              </span>
                              <span className="text-zinc-400 font-medium">
                                PVP: <strong className="text-zinc-900">${b.precioVenta.toLocaleString()}</strong>
                              </span>
                            </div>
                            {margen !== null && (
                              <span className={`font-bold px-1.5 py-0.5 rounded ${
                                parseFloat(margen) >= 10
                                  ? "bg-emerald-50 text-emerald-700"
                                  : parseFloat(margen) >= 5
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              }`}>
                                Margen {margen}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-zinc-100 bg-zinc-50 flex-shrink-0">
                <p className="text-[10px] text-zinc-400 text-center font-medium">
                  Solo se muestran boletos con estado <strong>Libre</strong> · Los vinculados no aparecen
                </p>
              </div>
            </div>
          </>
        );
      })()}

      {/* NUEVO CLIENTE DIRECTO — alta rápida desde el buscador de Reservas */}
      {showNewDirectClientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between">
              <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <User className="w-4.5 h-4.5" /> Nuevo Cliente Directo
              </h4>
              <button
                type="button"
                onClick={() => setShowNewDirectClientModal(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newDirectClientForm.nombre.trim()) return;
                const newClient: DirectClient = {
                  id: nextSequentialId("CDI", directClients.map(c => c.id)),
                  nombre: newDirectClientForm.nombre.trim(),
                  cedula: newDirectClientForm.cedula || undefined,
                  tipo: newDirectClientForm.tipo,
                  status: ClientStatus.ACTIVO,
                  email: newDirectClientForm.email || "N/A",
                  telefono: newDirectClientForm.telefono || "N/A",
                  saldoFavor: 0,
                  saldoDeber: 0,
                  moroso: false
                };
                onAddDirectClient(newClient);
                setSelectedDirectClient(newClient);
                setCartClienteDirectoId(newClient.id);
                setDirectClientSearch(newClient.nombre);
                applyDirectClientContact(newClient);
                setShowNewDirectClientModal(false);
                setNewDirectClientForm({ nombre: "", cedula: "", telefono: "", email: "", tipo: DirectClientTipo.CONTADO });
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Nombre Completo</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                  value={newDirectClientForm.nombre}
                  onChange={(e) => setNewDirectClientForm(f => ({ ...f, nombre: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cédula / ID (Opcional)</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-mono font-semibold text-zinc-800 focus:outline-none"
                    value={newDirectClientForm.cedula}
                    onChange={(e) => setNewDirectClientForm(f => ({ ...f, cedula: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Tipo de Cliente</label>
                  <select
                    className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                    value={newDirectClientForm.tipo}
                    onChange={(e) => setNewDirectClientForm(f => ({ ...f, tipo: e.target.value as DirectClientTipo }))}
                  >
                    <option value={DirectClientTipo.CONTADO}>CONTADO</option>
                    <option value={DirectClientTipo.CREDITO}>A CRÉDITO</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Teléfono</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                    value={newDirectClientForm.telefono}
                    onChange={(e) => setNewDirectClientForm(f => ({ ...f, telefono: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Email</label>
                  <input
                    type="email"
                    className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                    value={newDirectClientForm.email}
                    onChange={(e) => setNewDirectClientForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewDirectClientModal(false)}
                  className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

