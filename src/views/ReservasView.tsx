import React, { useState } from "react";
import { Reservation, HotelProperty, ServiceItem, ServiceType, B2BClient } from "../types";
import { Property, RoomType, RatePlan, TipoCobro } from "../types/producto";
import { 
  Calendar, 
  User, 
  MapPin, 
  Plane,
  Plus, 
  Search,
  Filter,
  AlertCircle,
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
  Clock
} from "lucide-react";
import { FinancialInvoice, PayableObligation } from "../types";

interface ReservasViewProps {
  reservations: Reservation[];
  properties: HotelProperty[];
  clients: B2BClient[];
  onAddReservation: (newRes: Reservation) => void;
  onUpdateReservation?: (updatedRes: Reservation) => void;
  onAddInvoice?: (newInv: FinancialInvoice) => void;
  detailedProperties: Property[];
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  invoices: FinancialInvoice[];
  payableObligations: PayableObligation[];
}

// Helper to calculate pricing for an individual room
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

export default function ReservasView({ 
  reservations, 
  properties, 
  clients, 
  onAddReservation,
  onUpdateReservation,
  onAddInvoice,
  detailedProperties,
  roomTypes,
  ratePlans,
  invoices,
  payableObligations
}: ReservasViewProps) {
  // Navigation inside the module:
  // 1: List (dashboard), 2: Expediente (details), 3: Crear Expediente (Cart), 4: Configurar Servicio
  const [viewLevel, setViewLevel] = useState<1 | 2 | 3 | 4>(1);
  const [selectedResId, setSelectedResId] = useState<string | null>(reservations[0]?.id || null);
  
  // Search & Filters (Level 1)
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Todas");
  const [sortBy, setSortBy] = useState<"ultimas" | "checkin">("ultimas");

  // --- VISOR DE COMPROBANTE MODAL STATES ---
  const [showProvReceiptModal, setShowProvReceiptModal] = useState(false);
  const [selectedObligationForReceipt, setSelectedObligationForReceipt] = useState<PayableObligation | null>(null);

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
  const [billingRef, setBillingRef] = useState("");
  const [billingMetodo, setBillingMetodo] = useState("Transferencia Bancaria");
  const [billingMonto, setBillingMonto] = useState("");
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
  const [cartTipo, setCartTipo] = useState<"Cotización" | "Reserva Real">("Reserva Real");

  const handleConvertToRealBooking = () => {
    if (!activeRes) return;
    
    const updatedServices = (activeRes.servicios || []).map(s => ({
      ...s,
      statusFacturacion: "Borrador" as const
    }));

    const updatedRes: Reservation = {
      ...activeRes,
      tipo: "Reserva Real",
      status: "Confirmada",
      servicios: updatedServices
    };
    
    if (onUpdateReservation) {
      onUpdateReservation(updatedRes);
    }
    
    setSubmitSuccess("✓ Expediente convertido en Reserva Real. Servicios en Borrador listos para enviar a facturar.");
    setTimeout(() => setSubmitSuccess(""), 4000);
  };

  // --- B2B Agency Combobox States ---
  const [agencySearch, setAgencySearch] = useState("");
  const [showAgencyDropdown, setShowAgencyDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState<B2BClient | null>(null);

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
    guests: { name: string; type: "Adulto" | "Niño" }[];
  }[]>([]);
  const [comisionB2B, setComisionB2B] = useState(10);
  const [comisionPropia, setComisionPropia] = useState(5);
  const [hotelSearchQuery, setHotelSearchQuery] = useState("");
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);
  const [selectedPromoName, setSelectedPromoName] = useState("");

  // Transfer states
  const [transPickup, setTransPickup] = useState("");
  const [transDropoff, setTransDropoff] = useState("");
  const [transDate, setTransDate] = useState("2026-06-20");
  const [transVehicle, setTransVehicle] = useState("Berlina Ejecutiva");
  const [transTripType, setTransTripType] = useState<"one-way" | "round-trip">("one-way");
  const [transReturnDropoff, setTransReturnDropoff] = useState("");
  const [transReturnDate, setTransReturnDate] = useState("2026-06-27");
  const [transServiceType, setTransServiceType] = useState<"privado" | "compartido">("privado");
  const [transPax, setTransPax] = useState(2);

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

  // Manual Entry states
  const [manualDescription, setManualDescription] = useState("");
  const [manualSupplier, setManualSupplier] = useState("");

  // Common Pricing states for Level 4
  const [netPrice, setNetPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");

  const [submitSuccess, setSubmitSuccess] = useState("");

  const activeRes = reservations.find(r => r.id === selectedResId);

  const handleOpenSendBillingModal = () => {
    if (!activeRes) return;
    const agency = clients.find(c => c.nombre === activeRes.agenciaName);
    
    if (agency) {
      if (agency.tipo === "A Crédito") {
        setBillingFacturacionTipo("Crédito");
      } else {
        setBillingFacturacionTipo("Pago Contado");
      }
    } else {
      setBillingFacturacionTipo("Pago Contado");
    }
    
    setBillingRef("");
    setBillingMetodo("Transferencia Bancaria");
    
    const services = activeRes.servicios || [];
    const unsentServices = services.filter(s => s.statusFacturacion === "Borrador" || s.statusFacturacion === "Rechazado" || s.statusFacturacion === undefined);
    const pendingTotal = unsentServices.reduce((sum, s) => sum + s.precioVenta, 0);
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

    const updatedRes: Reservation = {
      ...activeRes,
      servicios: updatedServices,
      facturacionTipo: billingFacturacionTipo,
      comprobanteRef: billingFacturacionTipo === "Pago Contado" ? billingRef.trim() : undefined,
      comprobanteMetodo: billingFacturacionTipo === "Pago Contado" ? billingMetodo : undefined,
      comprobanteMonto: billingFacturacionTipo === "Pago Contado" ? parseFloat(billingMonto) || 0 : undefined
    };

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
  const totalPendientes = reservations.filter(r => r.status === "Pendiente de Pago" || r.status === "Petición Especial" || r.status === "Modificada").length;
  const totalCanceladas = reservations.filter(r => r.status === "Cancelada").length;

  // Filter and Sort (Level 1)
  const filteredAndSorted = reservations
    .filter((r) => {
      const matchesSearch = 
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.holder.toLowerCase().includes(search.toLowerCase()) ||
        r.hotelName.toLowerCase().includes(search.toLowerCase()) ||
        (r.telefono || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.agenciaName || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.flightNo || "").toLowerCase().includes(search.toLowerCase());
      
      let matchesStatus = false;
      if (filterStatus === "Todas") {
        matchesStatus = true;
      } else if (filterStatus === "Pendientes") {
        matchesStatus = r.status === "Pendiente de Pago" || r.status === "Petición Especial" || r.status === "Modificada";
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
    setCartId(`RES-${Math.floor(1000 + Math.random() * 9000)}`);
    setCartHolder("");
    setCartCheckIn("");
    setCartCheckOut("");
    setCartMercado("NACIONAL");
    
    setCartAgencia("");
    setAgencySearch("");
    setSelectedClient(null);
    setCartTelefono("");
    setCartEmail("");
    setCartTipo("Reserva Real");
    
    setCartSpecialRequests("");
    setCartFlightNo("");
    setCartServices([]);
    setComisionB2B(10);
    setComisionPropia(5);
    setViewLevel(3);
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
      setComisionB2B(10);
      setComisionPropia(5);
    } else if (type === ServiceType.TRASLADO) {
      setTransDate(cartCheckIn || "2026-06-20");
      setTransTripType("one-way");
      setTransReturnDropoff("");
      setTransReturnDate(cartCheckOut || "2026-06-27");
      setTransServiceType("privado");
      setTransPax(paxCount || 2);
      setComisionB2B(10);
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
      setComisionB2B(10);
      setComisionPropia(5);
    }
    
    setViewLevel(4);
  };

  const getStayNights = () => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateTotalPvpLodgingPrice = () => {
    const nights = getStayNights();
    let totalPvp = 0;

    lodgingRooms.forEach(room => {
      const roomRatePlan = ratePlans.find(rp => 
        rp.property_id === hotelId && 
        rp.mercado === cartMercado && 
        rp.nombrePromocion === selectedPromoName && 
        rp.roomType_id === room.roomTypeId
      );
      
      const rate = roomRatePlan || ratePlans.find(rp => rp.roomType_id === room.roomTypeId);
      if (!rate) return;
      
      let roomRatePerNight = 0;
      if (rate.tipoCobro === TipoCobro.POR_HABITACION) {
        roomRatePerNight = rate.tarifaBase;
      } else {
        const adults = room.guests.filter(g => g.type === "Adulto").length;
        const children = room.guests.filter(g => g.type === "Niño").length;
        
        // Base occupancy is usually 2, extra adults pay tarifaExtraAdulto
        const rt = roomTypes.find(type => type.id === room.roomTypeId);
        const baseOcc = rt?.ocupacionBase || 2;
        const baseOccupants = Math.min(baseOcc, adults);
        const extraAdults = Math.max(0, adults - baseOccupants);
        
        roomRatePerNight = (rate.tarifaBase * baseOccupants) + 
                          (rate.tarifaExtraAdulto * extraAdults) + 
                          (rate.tarifaExtraNino * children);
      }
      totalPvp += roomRatePerNight * nights;
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
      alert("Debe incluir al menos 1 habitación para el alojamiento.");
      return;
    }
    setLodgingRooms(prev => prev.filter(r => r.id !== roomId));
  };

  // Add configured service item to cart and return to Level 3
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeServiceType) return;

    if (activeServiceType === ServiceType.ALOJAMIENTO) {
      if (!hotelId) {
        alert("Por favor seleccione un hotel.");
        return;
      }
      if (!selectedRatePlanId) {
        alert("Por favor seleccione un plan de tarifa.");
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
        const promoName = ratePlan ? ratePlan.nombrePromocion : "Tarifa Directa";
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

        desc = `Traslado (${tripTypeLabel} - ${serviceTypeLabel}): ${routeDesc} - ${transPax} Pax - Fecha: ${formatDate(transDate)} (${transVehicle})`;
        break;
      }
      case ServiceType.RENT_A_CAR:
        desc = `Rent a Car: ${carCategory} con ${carSupplier} - Alquiler por ${carDays} días`;
        sPrice = (parseFloat(salePrice) || 0) * (1 - comisionB2B / 100);
        break;
      case ServiceType.SEGURO: {
        const pvpVal = (parseFloat(salePrice) || 0) * insPax;
        const b2bComVal = comisionB2B;
        const ownComVal = comisionPropia;
        sPrice = Math.round(pvpVal * (1 - b2bComVal / 100) * 100) / 100;
        nPrice = Math.round(pvpVal * (1 - (b2bComVal + ownComVal) / 100) * 100) / 100;
        desc = `Seguro: ${insPlan || "Plan Estándar"} - Cobertura por ${insDays} días (Vigencia: ${formatDate(insStartDate)} ➔ ${formatDate(insEndDate)}) - ${insPax} Pax`;
        break;
      }
      case ServiceType.MANUAL:
        desc = `Entrada Manual: ${manualDescription} (Proveedor: ${manualSupplier || "Directo"})`;
        sPrice = (parseFloat(salePrice) || 0) * (1 - comisionB2B / 100);
        break;
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
        transVehicle,
        transTripType,
        transReturnDropoff,
        transReturnDate,
        transServiceType,
        transPax,
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
    }

    const calculatedPvp = activeServiceType === ServiceType.ALOJAMIENTO 
      ? calculateTotalPvpLodgingPrice() 
      : activeServiceType === ServiceType.SEGURO
        ? (parseFloat(salePrice) || 0) * insPax
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
            detalles: det
          };
        }
        return s;
      }));
      setSubmitSuccess(`✓ Servicio "${activeServiceType}" actualizado en el carrito.`);
      setEditingServiceId(null);
    } else {
      const newService: ServiceItem = {
        id: `SRV-${Math.floor(100 + Math.random() * 900)}`,
        tipo: activeServiceType,
        descripcion: desc,
        precioNeto: nPrice,
        precioVenta: sPrice,
        precioPvp: calculatedPvp,
        comisionB2B: comisionB2B,
        detalles: det,
        statusFacturacion: "Borrador"
      };
      setCartServices(prev => [...prev, newService]);
      setSubmitSuccess(`✓ Servicio "${activeServiceType}" agregado al carrito.`);
    }

    setViewLevel(3);
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

  // Backing out from cart
  const handleCancelCart = () => {
    if (isEditingReservationId) {
      setViewLevel(2);
      setIsEditingReservationId(null);
    } else {
      setViewLevel(1);
    }
  };

  // Backing out from Service Configuration form
  const handleBackToCart = () => {
    setEditingServiceId(null);
    setViewLevel(3);
  };

  // Prepare reservation fields to edit
  const handleEditReservation = () => {
    if (!activeRes) return;
    setIsEditingReservationId(activeRes.id);
    setCartId(activeRes.id);
    setCartHolder(activeRes.holder);
    setCartCheckIn(activeRes.checkIn);
    setCartCheckOut(activeRes.checkOut);
    setCartMercado(activeRes.mercado || "INTERNACIONAL");
    setCartAgencia(activeRes.agenciaName || "");
    setAgencySearch(activeRes.agenciaName || "");
    
    const matchedClient = clients.find(c => c.nombre.toLowerCase() === (activeRes.agenciaName || "").toLowerCase());
    setSelectedClient(matchedClient || null);
    
    setCartTelefono(activeRes.telefono || "");
    setCartEmail(activeRes.email || "");
    setCartTipo(activeRes.tipo || "Reserva Real");
    setCartSpecialRequests(activeRes.specialRequests || "");
    setCartFlightNo(activeRes.flightNo || "");
    
    if (activeRes.servicios && activeRes.servicios.length > 0) {
      setCartServices(activeRes.servicios ? [...activeRes.servicios] : []);
    } else {
      // Legacy reservation service mapping
      const legacyService: ServiceItem = {
        id: `SRV-${Math.floor(100 + Math.random() * 900)}`,
        tipo: ServiceType.ALOJAMIENTO,
        descripcion: `Hotel: ${activeRes.hotelName} - 7 noches - ${activeRes.pax} Pax - IN: ${formatDate(activeRes.checkIn)} / OUT: ${formatDate(activeRes.checkOut)}`,
        precioNeto: activeRes.netPrice,
        precioVenta: activeRes.totalPrice,
        detalles: {
          hotelSearchQuery: activeRes.hotelName,
          checkInDate: activeRes.checkIn,
          checkOutDate: activeRes.checkOut,
          comisionB2B: 10,
          comisionPropia: 5,
          lodgingRooms: [{
            id: `rm-${Date.now()}-1`,
            roomTypeId: roomTypes.filter(rt => rt.property_id === (detailedProperties.find(p => p.nombre.toLowerCase() === activeRes.hotelName.toLowerCase())?.id || ""))[0]?.id || "",
            adultsCount: activeRes.pax,
            guests: [{ name: activeRes.holder, type: "Adulto" }]
          }]
        }
      };
      setCartServices([legacyService]);
    }
    setViewLevel(3);
  };

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
        setComisionB2B(det.comisionB2B !== undefined ? det.comisionB2B : 10);
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
        setNetPrice(det.netPrice || "");
        setSalePrice(det.salePrice || "");
        setComisionB2B(det.comisionB2B !== undefined ? det.comisionB2B : 10);
        setComisionPropia(det.comisionPropia !== undefined ? det.comisionPropia : 5);
      } else if (service.tipo === ServiceType.RENT_A_CAR) {
        setCarCategory(det.carCategory || "Compacto Automático");
        setCarSupplier(det.carSupplier || "");
        setCarStartDate(det.carStartDate || "");
        setCarEndDate(det.carEndDate || "");
        setCarDays(det.carDays || 7);
        setNetPrice(det.netPrice || "");
        setSalePrice(det.salePrice || "");
        setComisionB2B(det.comisionB2B !== undefined ? det.comisionB2B : 10);
      } else if (service.tipo === ServiceType.SEGURO) {
        setInsPlan(det.insPlan || "");
        setInsStartDate(det.insStartDate || "");
        setInsEndDate(det.insEndDate || "");
        setInsDays(det.insDays || 7);
        setInsPax(det.insPax !== undefined ? det.insPax : 1);
        setNetPrice(det.netPrice || "");
        setSalePrice(det.salePrice || "");
        setComisionB2B(det.comisionB2B !== undefined ? det.comisionB2B : 10);
        setComisionPropia(det.comisionPropia !== undefined ? det.comisionPropia : 5);
      } else if (service.tipo === ServiceType.MANUAL) {
        setManualDescription(det.manualDescription || "");
        setManualSupplier(det.manualSupplier || "");
        setNetPrice(det.netPrice || "");
        setSalePrice(det.salePrice || "");
        setComisionB2B(det.comisionB2B !== undefined ? det.comisionB2B : 10);
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
        setComisionB2B(10);
        setComisionPropia(5);
      } else if (service.tipo === ServiceType.TRASLADO) {
        setTransPickup("");
        setTransDropoff("");
        setTransDate(cartCheckIn || "2026-06-20");
        setTransVehicle("Berlina Ejecutiva");
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
    setViewLevel(4);
  };

  // Save the entire booking file (Level 3 to Level 2)
  const handleConfirmExpediente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartHolder.trim()) {
      alert("Por favor ingrese el titular del viaje.");
      return;
    }
    if (cartServices.length === 0) {
      alert("Debe agregar al menos un servicio al carrito para generar el expediente.");
      return;
    }

    const totalNeto = cartServices.reduce((sum, s) => sum + s.precioNeto, 0);
    const totalVenta = cartServices.reduce((sum, s) => sum + s.precioVenta, 0);

    const hotelSrv = cartServices.find(s => s.tipo === ServiceType.ALOJAMIENTO);
    const hotelName = hotelSrv ? hotelSrv.descripcion.split(" - ")[0].replace("Hotel: ", "") : "Multi-servicio Terrestre";

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
        agenciaName: cartAgencia,
        createdAt: activeRes?.createdAt || new Date().toISOString().split("T")[0],
        mercado: cartMercado,
        servicios: cartServices,
        tipo: cartTipo
      };

      if (onUpdateReservation) {
        onUpdateReservation(updatedRes);
      }
      setSelectedResId(isEditingReservationId);
      setIsEditingReservationId(null);
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
        status: "Confirmada",
        totalPrice: totalVenta,
        netPrice: totalNeto,
        specialRequests: cartSpecialRequests,
        flightNo: cartFlightNo || undefined,
        telefono: cartTelefono || "Sin registrar",
        email: cartEmail || "Sin registrar",
        agenciaName: cartAgencia,
        createdAt: new Date().toISOString().split("T")[0],
        mercado: cartMercado,
        servicios: cartServices.map(s => ({ ...s, statusFacturacion: s.statusFacturacion || "Borrador" as const })),
        tipo: cartTipo
      };

      onAddReservation(newRes);
      setSelectedResId(cartId);
      setViewLevel(2);
      setSubmitSuccess(`✓ Expediente "${cartId}" creado exitosamente.`);
    }

    setTimeout(() => setSubmitSuccess(""), 4000);
  };

  const getStatusBadge = (status: Reservation["status"]) => {
    switch (status) {
      case "Confirmada":
        return "bg-emerald-50 border-emerald-200 text-emerald-700 font-extrabold";
      case "Pendiente de Pago":
        return "bg-amber-50 border-amber-250 text-amber-700 font-bold";
      case "Petición Especial":
        return "bg-blue-50 border-blue-200 text-blue-700 font-bold";
      case "Modificada":
        return "bg-purple-50 border-purple-200 text-purple-700 font-bold";
      case "Cancelada":
        return "bg-red-50 border-red-200 text-red-650 font-bold";
      default:
        return "bg-zinc-50 border-zinc-200 text-zinc-655 font-medium";
    }
  };

  // Helper: format date from yyyy-mm-dd to dd/mm/yyyy
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

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

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[9px] font-extrabold tracking-wider">
                    <th className="p-4 w-28">Localizador</th>
                    <th className="p-4">Pasajero Titular</th>
                    <th className="p-4">Mercado</th>
                    <th className="p-4">Establecimiento / Detalle</th>
                    <th className="p-4">Servicios</th>
                    <th className="p-4 text-right">Total PVP</th>
                    <th className="p-4">Agencia B2B</th>
                    <th className="p-4">Estatus Reserva</th>
                    <th className="p-4 text-center">Cobro B2B</th>
                    <th className="p-4 text-center">Pago Proveedor</th>
                    <th className="p-4 text-center">Acciones</th>
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
                      <tr 
                        key={r.id} 
                        onClick={() => { setSelectedResId(r.id); setViewLevel(2); }}
                        className="hover:bg-zinc-50/60 transition-colors cursor-pointer group"
                      >
                        <td className="p-4 font-mono font-bold text-zinc-900">{r.id}</td>
                        <td className="p-4 font-bold text-zinc-900 group-hover:underline">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-zinc-400" />
                            {r.holder}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                            r.mercado === "INTERNACIONAL" ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-blue-50 border-blue-200 text-blue-700"
                          }`}>
                            {r.mercado || "INTERNACIONAL"}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-750 font-semibold truncate max-w-xs">
                          {r.hotelName}
                        </td>
                        <td className="p-4 text-zinc-500 font-bold">
                          {r.servicios?.length || 1} servicio(s)
                        </td>
                        <td className="p-4 text-right font-bold text-zinc-950">${r.totalPrice.toLocaleString("es-ES")} USD</td>
                        <td className="p-4 text-zinc-650 font-semibold">{r.agenciaName || "Directo"}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border inline-flex items-center gap-1 ${getStatusBadge(r.status)}`}>
                            ● {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {(() => {
                            const cPay = getClientPaymentStatus(r.id);
                            return (
                              <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wider border font-bold ${cPay.color}`}>
                                {cPay.status}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const pPay = getProviderPaymentStatus(r.id);
                            return (
                              <div className="flex items-center justify-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wider border font-bold ${pPay.color}`}>
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
                                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { setSelectedResId(r.id); setViewLevel(2); }}
                            className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 hover:bg-zinc-900 hover:text-white rounded text-[9px] font-extrabold uppercase tracking-wide cursor-pointer transition-all inline-flex items-center gap-0.5"
                          >
                            Expediente <ChevronRight className="w-3 h-3" />
                          </button>
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

      {/* VIEW LEVEL 2: DETALLE DEL EXPEDIENTE (B2B BOOKING FILE) */}
      {viewLevel === 2 && activeRes && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
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
                  <span>Expedientes de Reserva</span>
                  <span>/</span>
                  <span className="font-mono">{activeRes.id}</span>
                </div>
                <h3 className="font-black text-lg text-zinc-950 uppercase">{activeRes.holder}</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-zinc-200 shadow-3xs">
                <span className="text-[9px] uppercase font-black text-zinc-400 pl-2">Estatus:</span>
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
                  className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider focus:outline-none cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all ${getStatusBadge(activeRes.status)}`}
                >
                  <option value="Confirmada">Confirmada</option>
                  <option value="Pendiente de Pago">Pendiente de Pago</option>
                  <option value="Modificada">Modificada</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="Petición Especial">Petición Especial</option>
                </select>
              </div>
              
              <button
                onClick={handleEditReservation}
                className="px-3 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-zinc-700 hover:text-zinc-950 font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1"
                title="Editar Expediente"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              <button
                onClick={() => setShowB2BModal(true)}
                className="px-3 py-1.5 border border-zinc-900 bg-zinc-900 hover:bg-zinc-800 rounded text-white font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1"
                title="Compartir Formato B2B"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Formato B2B</span>
              </button>

              {activeRes.servicios?.some(s => s.statusFacturacion === "Facturado") && (
                <button
                  onClick={() => setShowVoucherModal(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold uppercase cursor-pointer transition-all flex items-center gap-1 animate-fade-in"
                  title="Generar Voucher de Viaje Oficial para Pasajero"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Voucher Pasajero</span>
                </button>
              )}

              <button
                onClick={() => setShowB2BModal(true)}
                className="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded text-zinc-750 cursor-pointer transition-all flex items-center justify-center"
                title="Imprimir Formato B2B"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

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
                              </div>
                              <p className="text-xs font-bold text-zinc-900 leading-tight">
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
                const totalPvp = activeRes.servicios && activeRes.servicios.length > 0
                  ? activeRes.servicios.reduce((sum, s) => {
                      const comisionPct = s.comisionB2B !== undefined ? s.comisionB2B : 10;
                      const itemPvp = s.precioPvp !== undefined ? s.precioPvp : (s.precioVenta / (1 - comisionPct / 100));
                      return sum + itemPvp;
                    }, 0)
                  : (activeRes.totalPrice / 0.9);
                const totalVenta = activeRes.totalPrice;
                const totalNeto = activeRes.netPrice;
                const totalComisionesB2B = totalPvp - totalVenta;
                const nuestraGanancia = totalVenta - totalNeto;
                
                return (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-zinc-850">
                      <span className="font-semibold text-zinc-400 uppercase text-[9.5px] tracking-wider">Total Venta Final (PVP)</span>
                      <span className="font-black text-lg text-white">${totalPvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                    </div>

                      <div className="flex items-center justify-between py-2 border-b border-zinc-850 text-amber-400 font-semibold">
                        <span>Comisión Retenida B2B</span>
                        <span>-${totalComisionesB2B.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-zinc-850">
                        <span className="text-zinc-450">Total a Cobrar B2B (Monto Facturado)</span>
                        <span className="font-black text-base text-zinc-100">${totalVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-zinc-850">
                        <span className="text-zinc-400">Costo Neto Mayorista (a Pagar)</span>
                        <span className="font-bold text-zinc-250">${totalNeto.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-zinc-850">
                        <span className="text-zinc-400">Margen de Utilidad Propio</span>
                        <span className="font-extrabold text-emerald-400">+${nuestraGanancia.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                      </div>

                      <div className="flex items-center justify-between py-1 text-[9.5px] text-zinc-500 font-mono">
                        <span>Rentabilidad Mayorista:</span>
                        <span>{totalNeto > 0 ? Math.round((nuestraGanancia / totalNeto) * 100) : 0}% de margen</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Tipo de Expediente y Facturación */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest block text-zinc-650">Estado del Expediente</h4>
                {activeRes.tipo === "Cotización" ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs rounded font-semibold leading-relaxed flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <span>Este expediente es una <strong>Cotización (Presupuesto)</strong>.</span>
                    </div>
                    <button
                      onClick={handleConvertToRealBooking}
                      className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-4.5 h-4.5" />
                      Confirmar como Reserva Real
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs rounded font-semibold leading-relaxed flex items-center gap-2">
                      <FileCheck className="w-4.5 h-4.5 text-emerald-600" />
                      <span>Este expediente es una <strong>Reserva Real Confirmada</strong>.</span>
                    </div>
                    
                    {/* Billed breakdown */}
                    {(() => {
                      const services = activeRes.servicios || [];
                      const billedCount = services.filter(s => s.statusFacturacion === "Facturado").length;
                      const totalCount = services.length;
                      const hasPending = services.some(s => s.statusFacturacion !== "Facturado");
                      const pendingTotal = services.filter(s => s.statusFacturacion !== "Facturado").reduce((sum, s) => sum + s.precioVenta, 0);

                      return (
                        <div className="space-y-3 text-xs font-semibold">
                          <div className="flex justify-between text-[11px] text-zinc-655">
                            <span>Estado Facturación:</span>
                            <span className={hasPending ? "text-amber-700 font-bold" : "text-emerald-700 font-extrabold"}>
                              {hasPending ? `Pendiente por Facturar ($${pendingTotal} USD)` : "Totalmente Facturado"}
                            </span>
                          </div>

                          {(() => {
                            const hasBorradorOrRechazado = services.some(s => s.statusFacturacion === "Borrador" || s.statusFacturacion === "Rechazado" || s.statusFacturacion === undefined);
                            const hasSolicitado = services.some(s => s.statusFacturacion === "Solicitado");
                            
                            const billedServices = services.filter(s => s.statusFacturacion === "Facturado");
                            const pendingServices = services.filter(s => s.statusFacturacion === "Solicitado");
                            const unsentServices = services.filter(s => s.statusFacturacion === "Borrador" || s.statusFacturacion === "Rechazado" || s.statusFacturacion === undefined);
                            const pendingTotal = unsentServices.reduce((sum, s) => sum + s.precioVenta, 0);

                            return (
                              <div className="space-y-3 text-xs font-semibold">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] text-zinc-655">
                                    <span>Servicios Facturados:</span>
                                    <span className="text-emerald-700 font-extrabold">{billedServices.length} / {services.length}</span>
                                  </div>
                                  {hasSolicitado && (
                                    <div className="flex justify-between text-[11px] text-zinc-655">
                                      <span>En Revisión Facturación:</span>
                                      <span className="text-blue-700 font-extrabold">{pendingServices.length}</span>
                                    </div>
                                  )}
                                  {hasBorradorOrRechazado && (
                                    <div className="flex justify-between text-[11px] text-zinc-655">
                                      <span>Pendientes de Enviar:</span>
                                      <span className="text-amber-700 font-extrabold">{unsentServices.length} (${pendingTotal} USD)</span>
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
                )}
              </div>

              {/* Status de Pago */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3 shadow-xs">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest block text-zinc-650">Condición de Cobro B2B</h4>
                {activeRes.status === "Cancelada" ? (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-750 text-xs rounded font-semibold leading-relaxed">
                    Expediente anulado. No se procesarán transacciones de cobro.
                  </div>
                ) : activeRes.status === "Pendiente de Pago" ? (
                  <div className="p-3 bg-amber-50 border border-amber-250 text-amber-800 text-xs rounded font-semibold leading-relaxed">
                    Factura pendiente de cobro. Límite de crédito sujeto a revisión de la cartera de cobros.
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-semibold leading-relaxed">
                    Acreditado. Los importes han sido cobrados y conciliados en contabilidad mayorista.
                  </div>
                )}
              </div>

              {/* Liquidación a Proveedores */}
              {(() => {
                const pPay = getProviderPaymentStatus(activeRes.id);
                return (
                  <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3 shadow-xs text-left">
                    <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest block text-zinc-650">Liquidación a Proveedores</h4>
                    {pPay.obligation ? (
                      <div className="space-y-2.5 text-xs font-semibold">
                        <div className="flex justify-between text-zinc-550">
                          <span>Proveedor Legal:</span>
                          <span className="text-zinc-900 font-extrabold">{pPay.obligation.providerName}</span>
                        </div>
                        <div className="flex justify-between text-zinc-550 font-mono">
                          <span>Costo Neto:</span>
                          <span className="text-zinc-900">${pPay.obligation.netCost.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                        </div>
                        <div className="flex justify-between text-zinc-550 font-mono">
                          <span>Importe Abonado:</span>
                          <span className="text-emerald-700">${pPay.obligation.paidAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD</span>
                        </div>
                        <div className="flex justify-between border-t border-zinc-100 pt-2 text-zinc-555 font-mono">
                          <span>Saldo Pendiente:</span>
                          <span className={`font-black text-xs ${(pPay.obligation.netCost - pPay.obligation.paidAmount) > 0 ? "text-red-650" : "text-zinc-400"}`}>
                            ${(pPay.obligation.netCost - pPay.obligation.paidAmount).toLocaleString("es-ES", { minimumFractionDigits: 2 })} USD
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-zinc-100 pt-2.5">
                          <span>Estatus Pago:</span>
                          <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wider border font-bold ${pPay.color}`}>
                            {pPay.status}
                          </span>
                        </div>
                        {pPay.obligation.attachedFile && (
                          <div className="border-t border-zinc-100 pt-2.5 space-y-2">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Soporte de Tesorería</span>
                            <div className="p-2 bg-zinc-50 border border-zinc-200 rounded flex items-center justify-between">
                              <span className="font-mono text-[10.5px] text-zinc-700 truncate max-w-[180px] font-bold" title={pPay.obligation.attachedFile}>
                                {pPay.obligation.attachedFile}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedObligationForReceipt(pPay.obligation);
                                  setShowProvReceiptModal(true);
                                }}
                                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[9.5px] font-bold uppercase tracking-wider cursor-pointer shadow-3xs flex items-center gap-1"
                              >
                                <Download className="w-3.5 h-3.5" /> Ver Soporte
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-550 text-[11px] rounded font-semibold leading-relaxed">
                        No hay obligaciones de costo neto emitidas en Cuentas por Pagar para este expediente. Asegúrese de enviar a facturar y aprobar la reserva.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* VIEW LEVEL 3: CREAR EXPEDIENTE (CARRITO DE COMPRA B2B) */}
      {viewLevel === 3 && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelCart}
                className="p-1.5 hover:bg-zinc-200 rounded-md transition-colors cursor-pointer border border-zinc-200 bg-white"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-700" />
              </button>
              <div>
                <span className="text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider block">
                  {isEditingReservationId ? "Editar Expediente" : "Nuevo Registro"}
                </span>
                <h3 className="font-black text-lg text-zinc-900 uppercase font-sans">
                  {isEditingReservationId ? `Modificar Expediente: ${isEditingReservationId}` : `Generar Expediente: ${cartId}`}
                </h3>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleCancelCart}
              className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded text-xs font-bold uppercase tracking-wider cursor-pointer bg-white"
            >
              {isEditingReservationId ? "Cancelar Edición" : "Cancelar Registro"}
            </button>
          </div>

          <form onSubmit={handleConfirmExpediente} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Cabecera del expediente y Carrito */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Datos Generales / Cabecera */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest border-b border-zinc-150 pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" /> Cabecera y Pasajero Principal
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Nombre Pasajero Titular</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Alexander Pierce Group / Familia Mendoza"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                      value={cartHolder}
                      onChange={(e) => setCartHolder(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Mercado Objetivo</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCartMercado("NACIONAL")}
                        className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all cursor-pointer text-center ${
                          cartMercado === "NACIONAL"
                            ? "bg-zinc-950 border-zinc-950 text-white shadow-xs"
                            : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                        }`}
                      >
                        Nacional
                      </button>
                      <button
                        type="button"
                        onClick={() => setCartMercado("INTERNACIONAL")}
                        className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all cursor-pointer text-center ${
                          cartMercado === "INTERNACIONAL"
                            ? "bg-zinc-950 border-zinc-950 text-white shadow-xs"
                            : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                        }`}
                      >
                        Internacional
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Tipo de Expediente</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCartTipo("Cotización")}
                        className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all cursor-pointer text-center ${
                          cartTipo === "Cotización"
                            ? "bg-zinc-950 border-zinc-950 text-white shadow-xs"
                            : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                        }`}
                      >
                        Cotización
                      </button>
                      <button
                        type="button"
                        onClick={() => setCartTipo("Reserva Real")}
                        className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all cursor-pointer text-center ${
                          cartTipo === "Reserva Real"
                            ? "bg-zinc-950 border-zinc-950 text-white shadow-xs"
                            : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                        }`}
                      >
                        Reserva Real
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fechas de estadía en la cabecera */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha Check-In General</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={cartCheckIn}
                      onChange={(e) => setCartCheckIn(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha Check-Out General</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-900 focus:outline-none"
                      value={cartCheckOut}
                      onChange={(e) => setCartCheckOut(e.target.value)}
                    />
                  </div>
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5 md:col-span-2 relative">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Agencia de Origen B2B</label>
                    
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
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Vuelo Asociado (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: AA-942"
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs uppercase font-bold text-zinc-900 focus:outline-none"
                      value={cartFlightNo}
                      onChange={(e) => setCartFlightNo(e.target.value)}
                    />
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
              </div>

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
                                  IN: {item.detalles.checkInDate} / OUT: {item.detalles.checkOutDate} ({item.detalles.selectedPromoName || "Tarifa Directa"})
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
                </div>
              </div>

              {/* Botonera de Agregar Servicios */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-xs">
                <h4 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest border-b border-zinc-150 pb-2">
                  Añadir Servicio a esta Reserva
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                    className="p-4 border border-zinc-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 hover:border-zinc-400 transition-all cursor-pointer text-center text-zinc-700 hover:text-zinc-950 col-span-2 sm:col-span-1"
                  >
                    <FileText className="w-6 h-6 text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Entrada Manual</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Columna Derecha de Confirmación */}
            <div className="lg:col-span-4 space-y-6">
              {/* Totalizadores de Carrito */}
              <div className="bg-zinc-900 text-white rounded-lg p-5 space-y-4 shadow-md">
                <h4 className="font-extrabold text-white text-xs uppercase tracking-widest border-b border-zinc-800 pb-2">
                  Cotización Mayorista (Carrito)
                </h4>

                {(() => {
                  const totalNeto = cartServices.reduce((sum, s) => sum + s.precioNeto, 0);
                  const totalVenta = cartServices.reduce((sum, s) => sum + s.precioVenta, 0);
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

              {/* Botón de Confirmar */}
              <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-zinc-950 hover:bg-zinc-850 text-white font-black text-xs uppercase tracking-wider rounded transition-all cursor-pointer text-center block shadow-sm disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
                  disabled={cartServices.length === 0 || !cartHolder.trim()}
                >
                  {isEditingReservationId ? "Guardar Cambios del Expediente" : "Confirmar y Generar Expediente"}
                </button>
                <p className="text-[10px] text-zinc-400 text-center font-medium leading-relaxed">
                  Al confirmar, se consolidará el expediente de reservas en el release de Foratour ERP y se asignará el localizador final.
                </p>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* VIEW LEVEL 4: CONFIGURAR SERVICIO INDIVIDUAL (NUEVO NIVEL) */}
      {viewLevel === 4 && activeServiceType && (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha Check-In</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2.5 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha Check-Out</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2.5 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                    />
                  </div>
                </div>

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
                                    <input
                                      type="text"
                                      required
                                      placeholder={guestIndex === 0 && index === 0 ? "Huésped 1 (Titular de la Reserva)" : `Nombre Huésped ${guestIndex + 1}`}
                                      className="w-full p-2.5 pr-16 border border-zinc-200 bg-white rounded text-xs font-semibold text-zinc-850 focus:outline-none"
                                      value={guest.name}
                                      onChange={(e) => handleRoomGuestNameChange(room.id, guestIndex, e.target.value)}
                                    />
                                    {cartHolder && guest.name !== cartHolder && (
                                      <button
                                        type="button"
                                        onClick={() => handleRoomGuestNameChange(room.id, guestIndex, cartHolder)}
                                        className="absolute right-2 px-1.5 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-[9px] font-bold uppercase transition-all border-none cursor-pointer"
                                        title="Asignar titular"
                                      >
                                        Titular
                                      </button>
                                    )}
                                    {cartHolder && guest.name === cartHolder && (
                                      <span className="absolute right-2 px-1.5 py-0.5 bg-zinc-950 text-white rounded text-[8px] font-black uppercase tracking-wider">
                                        Titular
                                      </span>
                                    )}
                                  </div>
                                  
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      onChange={(e) => setTransPax(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
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
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha Servicio (Ida)</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none"
                      value={transDate}
                      onChange={(e) => setTransDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Categoría de Vehículo</label>
                    <select
                      className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                      value={transVehicle}
                      onChange={(e) => setTransVehicle(e.target.value)}
                    >
                      <option value="Berlina Ejecutiva">Berlina Ejecutiva (Sedán 1-3 Pax)</option>
                      <option value="Minivan Ejecutiva">Minivan Ejecutiva (SUV 1-6 Pax)</option>
                      <option value="Mini Bus Charter">Mini Bus Charter (Coaster 7-19 Pax)</option>
                      <option value="Autobús de Línea">Autobús de Línea (Coach 20+ Pax)</option>
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
                      <option value="Económico Mecánico">Económico Mecánico (Ford Ka o similar)</option>
                      <option value="Compacto Automático">Compacto Automático (Toyota Yaris o similar)</option>
                      <option value="SUV Familiar 4x2">SUV Familiar 4x2 (Hyundai Tucson o similar)</option>
                      <option value="Camioneta Todo Terreno 4x4">Camioneta Todo Terreno 4x4 (Toyota Hilux o similar)</option>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="w-full p-2.5 pr-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                        value={comisionB2B}
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
                      Agencia B2B retiene su {comisionB2B}% de comisión.
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
            ) : (activeServiceType === ServiceType.TRASLADO || activeServiceType === ServiceType.SEGURO) ? (
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
                        className="w-full p-2.5 pr-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                        value={comisionB2B}
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
                          Reteniendo {comisionB2B + comisionPropia}% de descuento sobre el PVP {activeServiceType === ServiceType.SEGURO ? "Total" : ""}.
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
                          Agencia B2B retiene su {comisionB2B}% de comisión.
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
                        className="w-full p-2.5 pr-8 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900 focus:outline-none"
                        value={comisionB2B}
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
                      <span>Importe Neto B2B (a Pagar por Agencia):</span>
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
      {showB2BModal && activeRes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans print-modal-container">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh] print-modal-content">
            
            {/* Modal Header */}
            <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between no-print">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 font-sans">
                  <Share2 className="w-4.5 h-4.5 text-zinc-400" /> Formato para Compartir con Agencia B2B
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 font-sans">
                  Versión limpia optimizada para cliente. Costos netos y márgenes mayoristas ocultos.
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
                      F
                    </div>
                    <div>
                      <h2 className="font-black text-base tracking-tight leading-none text-zinc-955 font-sans">FORATOUR ERP</h2>
                      <span className="text-[8px] uppercase tracking-widest font-extrabold text-zinc-400 block font-sans">Wholesale Logistics</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium font-sans">
                    Consolidador Mayorista de Servicios Terrestres
                  </p>
                </div>
                
                <div className="text-left sm:text-right">
                  <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 rounded text-[9px] font-black uppercase tracking-wider text-zinc-800 font-sans">
                    Ficha de Reserva B2B
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
                  <h4 className="font-bold text-[10px] uppercase text-zinc-455 tracking-wider">Agencia Minorista (Emisora)</h4>
                  <div className="grid grid-cols-3 gap-y-1 text-zinc-700">
                    <span className="font-bold text-zinc-450">Agencia B2B:</span>
                    <span className="col-span-2 font-extrabold text-zinc-950">{activeRes.agenciaName || "Directo"}</span>

                    <span className="font-bold text-zinc-450">Teléfono:</span>
                    <span className="col-span-2 font-semibold text-zinc-900">{activeRes.telefono || "Sin registrar"}</span>

                    <span className="font-bold text-zinc-450">Email:</span>
                    <span className="col-span-2 font-semibold text-zinc-900">{activeRes.email || "Sin registrar"}</span>

                    <span className="font-bold text-zinc-455">Mercado Tarifario:</span>
                    <span className="col-span-2 font-bold text-zinc-900 uppercase">{activeRes.mercado || "INTERNACIONAL"}</span>
                  </div>
                </div>
              </div>

              {/* Service Line Items Table */}
              <div className="space-y-3 font-sans">
                <h4 className="font-bold text-[10px] uppercase text-zinc-450 tracking-wider">Detalle de Servicios Incluidos</h4>
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[9px] font-extrabold tracking-wider">
                        <th className="p-3 w-16">Cod</th>
                        <th className="p-3 w-24">Tipo</th>
                        <th className="p-3">Descripción / Itinerario del Servicio</th>
                        <th className="p-3 text-right w-24">PVP Tarifa</th>
                        <th className="p-3 text-center w-36">Comisión B2B</th>
                        <th className="p-3 text-right w-28">Neto a Pagar B2B</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-zinc-800">
                      {activeRes.servicios && activeRes.servicios.length > 0 ? (
                        activeRes.servicios.map((s) => {
                          const comisionPct = s.comisionB2B !== undefined ? s.comisionB2B : 10;
                          const pvp = s.precioPvp !== undefined ? s.precioPvp : (s.precioVenta / (1 - comisionPct / 100));
                          const comisionAmt = pvp - s.precioVenta;
                          
                          if (s.tipo === ServiceType.ALOJAMIENTO && s.detalles?.lodgingRooms) {
                            const hotelName = detailedProperties.find(p => p.id === s.detalles.hotelId)?.nombre || s.descripcion.split(" (")[0]?.replace("Hotel: ", "") || "Hotel";
                            return (
                              <React.Fragment key={s.id}>
                                {/* Header Hotel Row */}
                                <tr className="bg-zinc-50/40 font-semibold border-t border-zinc-200">
                                  <td className="p-3 font-mono text-[10.5px] text-zinc-400">{s.id}</td>
                                  <td className="p-3 font-bold text-zinc-900">{s.tipo}</td>
                                  <td className="p-3 text-left leading-normal">
                                    <span className="text-zinc-900 font-extrabold">{hotelName}</span>
                                    <span className="block text-[9.5px] text-zinc-455 font-medium mt-0.5">
                                      IN: {formatDate(s.detalles.checkInDate)} / OUT: {formatDate(s.detalles.checkOutDate)} ({s.detalles.selectedPromoName || "Tarifa Directa"})
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-bold text-zinc-900">${pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                  <td className="p-3 text-center font-bold text-zinc-650">
                                    {comisionPct}%
                                    <span className="text-[10.5px] text-zinc-400 block font-normal">
                                      (${Math.max(0, comisionAmt).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-bold text-zinc-955">${s.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
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
                                      <td className="p-2.5 text-right text-zinc-700 text-xs font-semibold">${rates.pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                      <td className="p-2.5 text-center text-zinc-500 text-[10.5px]">
                                        {comisionPct}%
                                        <span className="text-[9.5px] text-zinc-400 block font-normal">
                                          (${rates.comisionB2BVal.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-right text-zinc-850 font-bold text-xs">${rates.sale.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          }
                          
                          return (
                            <tr key={s.id} className="hover:bg-zinc-50/50">
                              <td className="p-3 font-mono text-[10.5px] text-zinc-400">{s.id}</td>
                              <td className="p-3 font-bold text-zinc-900">{s.tipo}</td>
                              <td className="p-3 font-medium text-zinc-700 leading-normal">{s.descripcion}</td>
                              <td className="p-3 text-right font-bold text-zinc-900">${pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                              <td className="p-3 text-center font-bold text-zinc-650">
                                {comisionPct}%
                                <span className="text-[10.5px] text-zinc-400 block font-normal">
                                  (${Math.max(0, comisionAmt).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold text-zinc-955">${s.precioVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
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
                              <td className="p-3 text-right font-bold text-zinc-900">${pvp.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                              <td className="p-3 text-center font-bold text-zinc-600">
                                10%
                                <span className="text-[10.5px] text-zinc-400 block font-normal">
                                  (${Math.max(0, comisionAmt).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold text-zinc-950">${activeRes.totalPrice.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
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
              {(() => {
                const totalPvp = activeRes.servicios && activeRes.servicios.length > 0
                  ? activeRes.servicios.reduce((sum, s) => {
                      const comisionPct = s.comisionB2B !== undefined ? s.comisionB2B : 10;
                      const itemPvp = s.precioPvp !== undefined ? s.precioPvp : (s.precioVenta / (1 - comisionPct / 100));
                      return sum + itemPvp;
                    }, 0)
                  : (activeRes.totalPrice / 0.9);
                const totalVenta = activeRes.totalPrice;
                const totalComisionesB2B = totalPvp - totalVenta;

                return (
                  <div className="mt-8 flex justify-end font-sans">
                    <div className="w-full sm:w-80 bg-zinc-50 border border-zinc-200 p-4.5 rounded-lg space-y-2.5">
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
                    </div>
                  </div>
                );
              })()}

              {/* Legal Disclaimer */}
              <div className="mt-10 border-t border-zinc-200 pt-6 text-center text-[10px] text-zinc-400 font-medium space-y-1 font-sans">
                <p>Este documento es un comprobante de reserva comercial para uso exclusivo entre Foratour y la agencia emisora.</p>
                <p>Foratour S.A. | RIF: J-30495810-9 | Caracas, Venezuela | Email: soporte@foratour-erp.com</p>
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
                  <span>Imprimir / PDF B2B</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

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
                      F
                    </div>
                    <div>
                      <h2 className="font-black text-base tracking-tight leading-none text-zinc-955 font-sans">FORATOUR ERP</h2>
                      <span className="text-[8px] uppercase tracking-widest font-extrabold text-zinc-400 block font-sans">Wholesale Logistics</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium font-sans">
                    Consolidador Mayorista de Servicios Terrestres
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
                    Este documento acredita que los servicios listados a continuación están totalmente pagados al proveedor y garantizados por Foratour ERP. Presente este voucher al proveedor del servicio al iniciar su viaje.
                  </p>
                </div>
                <div className="flex-shrink-0 w-24 h-24 border-4 border-emerald-600/40 rounded-full flex flex-col items-center justify-center text-center rotate-12 font-sans select-none">
                  <span className="text-[9px] font-black uppercase text-emerald-600/60 leading-none">FORATOUR</span>
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

              {/* Services List (Only Billed) */}
              <div className="space-y-4 mb-6">
                <h5 className="text-[9.5px] font-black text-zinc-455 uppercase tracking-widest border-b border-zinc-150 pb-1.5 font-sans">Servicios Confirmados</h5>
                <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/30">
                  {activeRes.servicios?.filter(s => s.statusFacturacion === "Facturado").map((s) => (
                    <div key={s.id} className="p-4 bg-white space-y-2">
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
                <p>Este voucher sirve como constancia oficial de servicios. Foratour opera como consolidador mayorista y no se hace responsable por retrasos, cancelaciones fortuitas o modificaciones imputables directamente a los proveedores de servicio final.</p>
                <p>Foratour S.A. | RIF: J-30495810-9 | Caracas, Venezuela | Email: operaciones@foratour-erp.com</p>
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
                const agency = clients.find(c => c.nombre === activeRes.agenciaName);
                const isCreditAgency = agency?.tipo === "A Crédito";

                return (
                  <div className="space-y-4 text-left">
                    {/* Agency Type Label */}
                    <div className="bg-zinc-50 border border-zinc-200 p-3 rounded text-xs font-semibold text-zinc-750 space-y-1">
                      <div className="flex justify-between">
                        <span>Canal de Venta B2B:</span>
                        <span className="font-bold text-zinc-900">{activeRes.agenciaName || "Directo / Pasajero"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Modalidad Comercial:</span>
                        <span className={`px-1.5 py-0.25 rounded text-[9px] font-bold uppercase border ${
                          isCreditAgency 
                            ? "bg-purple-50 border-purple-200 text-purple-700" 
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                          {isCreditAgency ? "Línea de Crédito" : (agency ? `${agency.tipo} (Pago Contado)` : "Venta Directa (Pago Contado)")}
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
                          ⚠️ Nota: Esta agencia opera bajo prepago. Es obligatorio adjuntar el comprobante de cobro recibido para enviar a facturación.
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
                    alert(`Simulando descarga de soporte: ${selectedObligationForReceipt.attachedFile || "soporte_pago.pdf"}`);
                  }}
                  className="px-4 py-2 border border-zinc-250 hover:bg-zinc-100 text-zinc-700 bg-white rounded text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`El comprobante de pago ha sido enviado exitosamente al correo del proveedor legal: ${selectedObligationForReceipt.providerName}.`);
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

    </div>
  );
}
