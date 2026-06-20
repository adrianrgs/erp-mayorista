import React, { useState, useEffect } from "react";
import { HotelProperty } from "../types";
import {
  RegimenAlimentacion,
  PropertyStatus,
  TipoCobro,
  Property,
  RoomType,
  RatePlan,
  StopSale
} from "../types/producto";
import {
  Building2,
  MapPin,
  Star,
  Search,
  Plus,
  Trash2,
  Edit3,
  ArrowLeft,
  Camera,
  Calendar,
  Ban,
  Info,
  ChevronRight,
  TrendingUp,
  Users,
  Bed,
  Utensils,
  DollarSign,
  CalendarRange,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  FileText
} from "lucide-react";

// Initial list of Venezuelan and International properties mapped for Product Dpto.
const initialDetailedProperties: Property[] = [
  {
    id: "prop-01",
    nombre: "Lidotel Hotel Boutique Margarita",
    pais: "Venezuela",
    estado: "Nueva Esparta",
    ciudad: "Pampatar",
    categoria: 5,
    status: PropertyStatus.ACTIVO,
    politicasGenerales: "Check-in: 15:00 hrs. Check-out: 12:00 hrs. Desayuno buffet incluido. No se aceptan mascotas. Se requiere cédula o pasaporte al ingresar.",
    imagen: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    supplierName: "Lidotel Hoteles de Venezuela C.A."
  },
  {
    id: "prop-02",
    nombre: "Hesperia Isla Margarita Golf & Spa",
    pais: "Venezuela",
    estado: "Nueva Esparta",
    ciudad: "Pedro González",
    categoria: 5,
    status: PropertyStatus.ACTIVO,
    politicasGenerales: "Check-in: 15:00 hrs. Check-out: 12:00 hrs. Piscina, campo de golf y spa habilitados. Cancelación gratuita con 48 hrs de anticipación.",
    imagen: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
    supplierName: "Hesperia World Wholesalers S.A."
  },
  {
    id: "prop-03",
    nombre: "Hotel Dunes Resort & Beach Club",
    pais: "Venezuela",
    estado: "Nueva Esparta",
    ciudad: "El Agua",
    categoria: 4,
    status: PropertyStatus.ACTIVO,
    politicasGenerales: "Plan Todo Incluido Familiar. Check-in indispensable a las 15:00 hrs. Actividades recreativas y deportes acuáticos no motorizados incluidos.",
    imagen: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    supplierName: "Dunes Hoteles Mayorista"
  },
  {
    id: "prop-04",
    nombre: "Eurobuilding Hotel & Suites Caracas",
    pais: "Venezuela",
    estado: "Distrito Capital",
    ciudad: "Caracas",
    categoria: 5,
    status: PropertyStatus.ACTIVO,
    politicasGenerales: "Check-in: 15:00 hrs. Check-out: 13:00 hrs de cortesía corporativa. Business center adaptado y transfer al aeropuerto nacional previa coordinación.",
    imagen: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
    supplierName: "Grupo Eurobuilding de Venezuela"
  },
  {
    id: "prop-05",
    nombre: "La Posada del Pirata Los Roques",
    pais: "Venezuela",
    estado: "Dependencias Federales",
    ciudad: "Gran Roque",
    categoria: 0,
    status: PropertyStatus.ACTIVO,
    politicasGenerales: "Pensión completa con excursiones en lancha a cayos cercanos. Electricidad regulada. Check-out temprano coordinado con vuelos charter de pista.",
    imagen: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=800&q=80",
    supplierName: "Inversiones Pirata Tours"
  }
];

// FASE 1 - Initial Room Types
const initialRoomTypes: RoomType[] = [
  { id: "room-01", property_id: "prop-01", nombre: "Habitación Standard Doble", regimenAlimentacion: RegimenAlimentacion.DESAYUNO, capacidadMax: 2, ocupacionBase: 2 },
  { id: "room-02", property_id: "prop-01", nombre: "Suite Familiar de Lujo", regimenAlimentacion: RegimenAlimentacion.MEDIA_PENSION, capacidadMax: 4, ocupacionBase: 2 },
  { id: "room-03", property_id: "prop-02", nombre: "Superior Deluxe Vista al Campo", regimenAlimentacion: RegimenAlimentacion.DESAYUNO, capacidadMax: 3, ocupacionBase: 2 },
  { id: "room-04", property_id: "prop-03", nombre: "Standard Familiar Todo Incluido", regimenAlimentacion: RegimenAlimentacion.TODO_INCLUIDO, capacidadMax: 5, ocupacionBase: 2 },
  { id: "room-05", property_id: "prop-04", nombre: "Habitación Business Executive", regimenAlimentacion: RegimenAlimentacion.DESAYUNO, capacidadMax: 2, ocupacionBase: 1 },
  { id: "room-06", property_id: "prop-05", nombre: "Cabaña Vista al Mar", regimenAlimentacion: RegimenAlimentacion.TODO_INCLUIDO, capacidadMax: 3, ocupacionBase: 2 }
];

// FASE 1 - Initial Rate Plans
const initialRatePlans: RatePlan[] = [
  {
    id: "rate-01",
    property_id: "prop-01",
    roomType_id: "room-01",
    nombrePromocion: "Temporada de Vacaciones de Verano",
    fechaInicio: "2026-06-01",
    fechaFin: "2026-08-31",
    tipoCobro: TipoCobro.POR_HABITACION,
    tarifaBase: 120,
    tarifaExtraAdulto: 60,
    tarifaExtraNino: 30,
    politicasCancelacion: "Cancelación sin penalización hasta 5 días antes del ingreso de los pasajeros.",
    mercado: "NACIONAL"
  },
  {
    id: "rate-02",
    property_id: "prop-01",
    roomType_id: "room-02",
    nombrePromocion: "Promoción Fin de Año Familiar",
    fechaInicio: "2026-11-15",
    fechaFin: "2026-12-31",
    tipoCobro: TipoCobro.POR_PERSONA,
    tarifaBase: 195,
    tarifaExtraAdulto: 90,
    tarifaExtraNino: 45,
    politicasCancelacion: "Tarifa no reembolsable. Se cargará el 100% al emitir el voucher mayorista.",
    mercado: "INTERNACIONAL"
  },
  {
    id: "rate-03",
    property_id: "prop-03",
    roomType_id: "room-04",
    nombrePromocion: "Promoción Todo Incluido Vacacional",
    fechaInicio: "2026-06-01",
    fechaFin: "2026-09-30",
    tipoCobro: TipoCobro.POR_PERSONA,
    tarifaBase: 85,
    tarifaExtraAdulto: 80,
    tarifaExtraNino: 40,
    politicasCancelacion: "Modificación permitida hasta 72 horas antes.",
    mercado: "NACIONAL"
  }
];

// FASE 1 - Initial Stop Sales
const initialStopSales: StopSale[] = [
  { id: "stop-01", property_id: "prop-01", fechaInicio: "2026-10-01", fechaFin: "2026-10-15", motivo: "Mantenimiento preventivo anual de caldera principal" },
  { id: "stop-02", property_id: "prop-02", fechaInicio: "2026-09-05", fechaFin: "2026-09-20", motivo: "Bloqueo por evento corporativo internacional (Copa de Golf)" }
];

// Predefined room list for Section A listpicker additions
const preDefinedRooms = [
  "Habitación Standard Individual",
  "Habitación Standard Doble",
  "Habitación Triple Familiar",
  "Suite Matrimonial Premium",
  "Suite Familiar de Lujo",
  "Villa Exclusiva frente al mar"
];

// Comprehensive country list (Latin America focused for ERP)
const PAISES_LISTA = [
  "Venezuela",
  "Argentina",
  "Bolivia",
  "Brasil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Ecuador",
  "El Salvador",
  "Guatemala",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "Puerto Rico",
  "República Dominicana",
  "Uruguay",
  "Alemania",
  "Canadá",
  "España",
  "Estados Unidos",
  "Francia",
  "Italia",
  "Portugal",
  "Reino Unido",
  "Otro"
];

// All Venezuelan states (25 + Dependencias Federales)
const ESTADOS_VENEZUELA = [
  "Amazonas",
  "Anzoátegui",
  "Apure",
  "Aragua",
  "Barinas",
  "Bolívar",
  "Carabobo",
  "Cojedes",
  "Delta Amacuro",
  "Dependencias Federales",
  "Distrito Capital",
  "Falcón",
  "Guárico",
  "Lara",
  "Mérida",
  "Miranda",
  "Monagas",
  "Nueva Esparta",
  "Portuguesa",
  "Sucre",
  "Táchira",
  "Trujillo",
  "Vargas",
  "Yaracuy",
  "Zulia",
  "Otro"
];

interface PropiedadesViewProps {
  properties: HotelProperty[]; // Compatibility with top-level ERP states
  onUpdateProperty: (updated: HotelProperty) => void;
  detailedProperties: Property[];
  setDetailedProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  roomTypes: RoomType[];
  setRoomTypes: React.Dispatch<React.SetStateAction<RoomType[]>>;
  ratePlans: RatePlan[];
  setRatePlans: React.Dispatch<React.SetStateAction<RatePlan[]>>;
  stopSales: StopSale[];
  setStopSales: React.Dispatch<React.SetStateAction<StopSale[]>>;
}

export default function PropiedadesView({ 
  properties, 
  onUpdateProperty,
  detailedProperties,
  setDetailedProperties,
  roomTypes,
  setRoomTypes,
  ratePlans,
  setRatePlans,
  stopSales,
  setStopSales
}: PropiedadesViewProps) {

  // --- STATE MANAGERS ---
  const [viewLevel, setViewLevel] = useState<1 | 2 | 3>(1); // Level 1 (Listing), Level 2 (Property Detail & Stats), Level 3 (Rate/Room Matrix)
  const [activePropertyId, setActivePropertyId] = useState<string>("prop-01");

  // Localized state bound directly to parent states
  const localProperties = detailedProperties;
  const setLocalProperties = setDetailedProperties;

  // Level 1: Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("Todos");
  const [selectedState, setSelectedState] = useState("Todos");
  const [selectedStatus, setSelectedStatus] = useState("Todos");

  // Level 2: Tabs Organizing Info
  const [activeTab, setActiveTab] = useState<"resumen" | "galeria" | "stopsales" | "politicas">("resumen");

  // Notifications
  const [notification, setNotification] = useState("");

  // Create Property Modal State
  const [isNewPropertyOpen, setIsNewPropertyOpen] = useState(false);
  const [newPropForm, setNewPropForm] = useState({
    nombre: "",
    pais: "Venezuela",
    estado: "Nueva Esparta",
    ciudad: "",
    categoria: "5",
    supplierName: "",
    politicasGenerales: "Check-in: 15:05 hrs. Check-out: 12:00 hrs. Todo voucher de reventa debe ser abonado con 72h hábiles de anticipación. Cancelaciones aplican según vigencia de contrato de release."
  });
  // Manual entry fallback for country / state when "Otro" is selected
  const [customPais, setCustomPais] = useState("");
  const [customEstado, setCustomEstado] = useState("");
  const [paisMode, setPaisMode] = useState<"list" | "custom">("list");
  const [estadoMode, setEstadoMode] = useState<"list" | "custom">("list");

  // Level 2 Forms & Actions
  const [tempImages, setTempImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
  ]);
  const [newStopSaleForm, setNewStopSaleForm] = useState({
    fechaInicio: "",
    fechaFin: "",
    motivo: ""
  });

  // Level 3 Forms & Actions
  const [isPredefinedPick, setIsPredefinedPick] = useState(true);
  const [newRoomForm, setNewRoomForm] = useState({
    nombrePredefinido: "Habitación Standard Doble",
    nombreManual: "",
    regimenAlimentacion: RegimenAlimentacion.DESAYUNO,
    capacidadMax: "2",
    ocupacionBase: "2"
  });

  const [newRateForm, setNewRateForm] = useState({
    nombrePromocion: "",
    mercado: "NACIONAL" as "NACIONAL" | "INTERNACIONAL",
    fechaInicio: "",
    fechaFin: "",
    tipoCobro: TipoCobro.POR_HABITACION,
    politicasCancelacion: "Cancelación sin cargos hasta 5 días hábiles antes de la llegada."
  });

  const [activeMercadoTab, setActiveMercadoTab] = useState<"NACIONAL" | "INTERNACIONAL">("NACIONAL");

  // Opción A: Multi-room selection with individual pricing per room
  const [selectedRooms, setSelectedRooms] = useState<{ [roomId: string]: { tarifaBase: string, tarifaExtraAdulto: string, tarifaExtraNino: string } }>({});

  // Expanded state for grouped rate plan accordion
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Selected Active Property helper details
  const activeProperty = localProperties.find(p => p.id === activePropertyId) || localProperties[0];

  // Helper trigger notification
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4500);
  };

  // Helper: format date from yyyy-mm-dd to dd/mm/yyyy
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Synchronize initial component mounting - ensure first property is preselected if list updates
  useEffect(() => {
    if (localProperties.length > 0 && !activePropertyId) {
      setActivePropertyId(localProperties[0].id);
    }
  }, [localProperties, activePropertyId]);

  // Reset multi-room selection when hotel or view changes
  useEffect(() => {
    setSelectedRooms({});
  }, [activePropertyId, viewLevel]);

  // --- FILTERS LOGIC (Level 1) ---
  const filteredProperties = localProperties.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ciudad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCountry = selectedCountry === "Todos" || p.pais.toLowerCase() === selectedCountry.toLowerCase();
    const matchesState = selectedState === "Todos" || p.estado.toLowerCase() === selectedState.toLowerCase();
    const matchesStatus = selectedStatus === "Todos" || p.status === selectedStatus;

    return matchesSearch && matchesCountry && matchesState && matchesStatus;
  });

  // Extract unique countries and states for filter selectors
  const uniqueCountries = ["Todos", ...Array.from(new Set(localProperties.map(p => p.pais)))];
  const uniqueStates = ["Todos", ...Array.from(new Set(localProperties.map(p => p.estado)))];

  // --- FACTION HANDLERS ---

  // Level 1: Add New Property
  const handleCreatePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropForm.nombre || !newPropForm.ciudad) {
      triggerNotification("✕ Por favor, ingresa el Nombre y la Ciudad de la propiedad.");
      return;
    }

    const generatorId = `prop-0${localProperties.length + 1}`;
    const newProperty: Property = {
      id: generatorId,
      nombre: newPropForm.nombre,
      pais: newPropForm.pais,
      estado: newPropForm.estado,
      ciudad: newPropForm.ciudad,
      categoria: isNaN(parseInt(newPropForm.categoria)) ? 5 : parseInt(newPropForm.categoria),
      status: PropertyStatus.ACTIVO,
      politicasGenerales: newPropForm.politicasGenerales,
      supplierName: newPropForm.supplierName || "Registro Directo",
      imagen: [
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
      ][Math.floor(Math.random() * 3)]
    };

    // Propagate up to top ERP state compatibility
    const erpCompatibleItem: HotelProperty = {
      id: generatorId,
      name: newProperty.nombre,
      destination: `${newProperty.ciudad}, ${newProperty.pais}`,
      category: "Playa",
      image: newProperty.imagen!,
      baseRate: 150,
      occupancy: 0,
      roomsCount: 50,
      stars: newProperty.categoria,
      amenities: ["All-Inclusive", "Wi-Fi", "Piscina"],
      allotment: 10,
      supplierName: newProperty.supplierName!
    };
    onUpdateProperty(erpCompatibleItem);

    setLocalProperties(prev => [...prev, newProperty]);
    setActivePropertyId(generatorId);
    setIsNewPropertyOpen(false);
    // Reset modal form and custom modes
    setPaisMode("list");
    setEstadoMode("list");
    setCustomPais("");
    setCustomEstado("");

    // Auto-create standard room type for convenience
    const defaultRoom: RoomType = {
      id: `room-${Math.floor(100 + Math.random() * 900)}`,
      property_id: generatorId,
      nombre: "Habitación Doble Estándar",
      regimenAlimentacion: RegimenAlimentacion.DESAYUNO,
      capacidadMax: 2,
      ocupacionBase: 2
    };
    setRoomTypes(prev => [...prev, defaultRoom]);

    setNewPropForm({
      nombre: "",
      pais: "Venezuela",
      estado: "Nueva Esparta",
      ciudad: "",
      categoria: "5",
      supplierName: "",
      politicasGenerales: "Check-in: 15:05 hrs. Check-out: 12:00 hrs. Todo voucher de reventa debe ser abonado con 72h hábiles de anticipación. Cancelaciones aplican según vigencia de contrato de release."
    });

    triggerNotification("✓ ¡Propiedad registrada con éxito en el Módulo de Producto! Hemos creado una habitación Doble por defecto.");
  };

  // Level 1: Toggle Property Status
  const handleTogglePropertyStatus = (propId: string, current: PropertyStatus) => {
    const nextStatus = current === PropertyStatus.ACTIVO ? PropertyStatus.INACTIVO : PropertyStatus.ACTIVO;
    setLocalProperties(prev => prev.map(p => p.id === propId ? { ...p, status: nextStatus } : p));
    triggerNotification(`✓ Propiedad marcada como ${nextStatus === PropertyStatus.ACTIVO ? "Activa" : "Inactiva"} exitosamente.`);
  };

  // Level 2: Tab Stop Sales - Add Stop Sale
  const handleAddStopSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopSaleForm.fechaInicio || !newStopSaleForm.fechaFin) {
      triggerNotification("✕ Por favor, ingresa fechas válidas de inicio y fin.");
      return;
    }

    const newStop: StopSale = {
      id: `stop-${Math.floor(100 + Math.random() * 900)}`,
      property_id: activePropertyId,
      fechaInicio: newStopSaleForm.fechaInicio,
      fechaFin: newStopSaleForm.fechaFin,
      motivo: newStopSaleForm.motivo || "Corte de ventas contractual"
    };

    setStopSales(prev => [...prev, newStop]);
    setNewStopSaleForm({ fechaInicio: "", fechaFin: "", motivo: "" });
    triggerNotification("✓ Stop Sale (Corte de Venta) aplicado a los calendarios del hotel.");
  };

  // Level 2: Delete Stop Sale
  const handleDeleteStopSale = (id: string) => {
    setStopSales(prev => prev.filter(s => s.id !== id));
    triggerNotification("✓ Stop Sale removido exitosamente.");
  };

  // Level 2: Tab Políticas - Save General Policies
  const [policyText, setPolicyText] = useState("");
  useEffect(() => {
    if (activeProperty) {
      setPolicyText(activeProperty.politicasGenerales);
    }
  }, [activePropertyId, viewLevel]);

  const handleSavePolicies = () => {
    setLocalProperties(prev => prev.map(p => p.id === activePropertyId ? { ...p, politicasGenerales: policyText } : p));
    triggerNotification("✓ Políticas y condiciones comerciales de alojamiento actualizadas.");
  };

  // Level 2: Tab Galería - Upload/Simulation of local image
  const handleAddImageToGallery = () => {
    const demoUrls = [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80"
    ];
    const picked = demoUrls[Math.floor(Math.random() * demoUrls.length)];
    setTempImages(prev => [...prev, picked]);
    triggerNotification("✓ Imagen subida con éxito (Simulado vía Firebase Storage).");
  };

  // Level 3: Sección A (Gestión de Habitaciones) - Submit Add Room Type
  const handleAddRoomTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = isPredefinedPick ? newRoomForm.nombrePredefinido : newRoomForm.nombreManual.trim();
    if (!finalName) {
      triggerNotification("✕ Debes seleccionar o ingresar un tipo de habitación válido.");
      return;
    }

    const newRoom: RoomType = {
      id: `room-${Math.floor(100 + Math.random() * 900)}`,
      property_id: activePropertyId,
      nombre: finalName,
      regimenAlimentacion: newRoomForm.regimenAlimentacion,
      capacidadMax: parseInt(newRoomForm.capacidadMax) || 2,
      ocupacionBase: parseInt(newRoomForm.ocupacionBase) || 2
    };

    setRoomTypes(prev => [...prev, newRoom]);
    setNewRoomForm({
      nombrePredefinido: "Habitación Standard Doble",
      nombreManual: "",
      regimenAlimentacion: RegimenAlimentacion.DESAYUNO,
      capacidadMax: "2",
      ocupacionBase: "2"
    });
    triggerNotification(`✓ Tipo de habitación "${finalName}" agregado al inventario del hotel.`);
  };

  // Level 3: Section A - Delete Room Type
  const handleDeleteRoomType = (id: string) => {
    setRoomTypes(prev => prev.filter(r => r.id !== id));
    // Also cascade delete corresponding rate plans
    setRatePlans(prev => prev.filter(p => p.roomType_id !== id));
    triggerNotification("✓ Tipo de habitación e inventarios de tarifa cascados eliminados.");
  };

  // Level 3: Sección B (Gestión de Tarifas) - Submit Rate Plan (Opción A: multi-room)
  const handleAddRatePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRateForm.nombrePromocion || !newRateForm.fechaInicio || !newRateForm.fechaFin) {
      triggerNotification("✕ Completa el nombre del plan y proporciona el rango de fechas.");
      return;
    }
    const roomEntries = Object.entries(selectedRooms);
    if (roomEntries.length === 0) {
      triggerNotification("✕ Selecciona al menos una habitación y asigna su precio.");
      return;
    }

    const planName = newRateForm.nombrePromocion;
    const newRates: RatePlan[] = roomEntries.map(([roomId, pricing]) => ({
      id: `rate-${Math.floor(100 + Math.random() * 9000)}`,
      property_id: activePropertyId,
      roomType_id: roomId,
      nombrePromocion: planName,
      fechaInicio: newRateForm.fechaInicio,
      fechaFin: newRateForm.fechaFin,
      tipoCobro: newRateForm.tipoCobro,
      tarifaBase: parseFloat(pricing.tarifaBase) || 0,
      tarifaExtraAdulto: parseFloat(pricing.tarifaExtraAdulto) || 0,
      tarifaExtraNino: parseFloat(pricing.tarifaExtraNino) || 0,
      politicasCancelacion: newRateForm.politicasCancelacion,
      mercado: newRateForm.mercado
    }));

    setRatePlans(prev => [...prev, ...newRates]);
    setSelectedRooms({});
    setNewRateForm(prev => ({ ...prev, nombrePromocion: "", fechaInicio: "", fechaFin: "" }));
    // Auto-expand the newly created group
    setExpandedGroups(prev => new Set([...prev, planName]));
    triggerNotification(`✓ Plan "${planName}" guardado con ${newRates.length} habitación(es).`);
  };

  // Level 3: Section B - Delete a single rate plan row
  const handleDeleteRatePlan = (id: string) => {
    setRatePlans(prev => prev.filter(r => r.id !== id));
    triggerNotification("✓ Tarifa individual eliminada.");
  };

  // Level 3: Section B - Delete all rate plans belonging to a group/plan name
  const handleDeleteRatePlanGroup = (planName: string) => {
    setRatePlans(prev => prev.filter(rp => !(rp.property_id === activePropertyId && rp.nombrePromocion === planName)));
    setExpandedGroups(prev => { const s = new Set(prev); s.delete(planName); return s; });
    triggerNotification(`✓ Plan "${planName}" y todas sus tarifas eliminados.`);
  };

  // Level 3: Section B - Toggle accordion expansion for a group
  const toggleGroupExpansion = (planName: string) => {
    setExpandedGroups(prev => {
      const s = new Set(prev);
      if (s.has(planName)) s.delete(planName); else s.add(planName);
      return s;
    });
  };

  // Level 3: Section B - Toggle room selection in multi-room form
  const handleRoomToggle = (roomId: string, checked: boolean) => {
    setSelectedRooms(prev => {
      if (!checked) { const n = { ...prev }; delete n[roomId]; return n; }
      return { ...prev, [roomId]: { tarifaBase: "", tarifaExtraAdulto: "", tarifaExtraNino: "" } };
    });
  };

  const handleRoomPriceChange = (roomId: string, field: "tarifaBase" | "tarifaExtraAdulto" | "tarifaExtraNino", value: string) => {
    setSelectedRooms(prev => ({ ...prev, [roomId]: { ...prev[roomId], [field]: value } }));
  };

  return (
    <div className="w-full flex flex-col space-y-6 font-sans">

      {/* Toast Notification HUD */}
      {notification && (
        <div className="fixed top-5 right-5 bg-zinc-900 border border-zinc-800 text-white px-5 py-4.5 rounded shadow-xl flex items-center gap-3 z-50 animate-bounce max-w-sm">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold leading-snug">{notification}</span>
        </div>
      )}

      {/* --- LEVEL 1: LISTADO DE PROPIEDADES (Directory) --- */}
      {viewLevel === 1 && (
        <div className="space-y-6">

          {/* Header Actions Panel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded border border-zinc-200">
            <div>
              <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase font-black">Directorio de Cuentas</span>
              <h2 className="text-xl font-extrabold text-zinc-900 mt-1 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-zinc-800" />
                Dpto. Producto: Gestión de Propiedades y Contratos
              </h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Direccione el inventario mayorista, cargue hoteles base, configure fechas exclusivas de release y controle de forma relacional el stock.
              </p>
            </div>

            <button
              id="add-new-hotel-btn"
              onClick={() => setIsNewPropertyOpen(true)}
              className="px-4.5 py-2.5 bg-zinc-900 hover:bg-zinc-805 text-white rounded text-xs font-bold tracking-wider uppercase flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Registrar Hotel Directo
            </button>
          </div>

          {/* Filtros Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded border border-zinc-200">

            {/* Buscador */}
            <div className="space-y-1 md:col-span-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Búsqueda Rápida</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  id="hotel-search-bar"
                  type="text"
                  placeholder="Hotel, ciudad, proveedor..."
                  className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded text-xs bg-white text-zinc-850 font-medium focus:outline-none focus:border-zinc-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filtrar por País */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">País</label>
              <select
                id="country-filter-select"
                className="w-full p-2 border border-zinc-200 rounded text-xs font-medium bg-white focus:outline-none focus:border-zinc-550"
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedState("Todos"); // Reset state since it's child filter
                }}
              >
                {uniqueCountries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Filtrar por Estado (Venezuela local support focus) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Estado (Región)</label>
              <select
                id="state-filter-select"
                className="w-full p-2 border border-zinc-200 rounded text-xs font-medium bg-white focus:outline-none focus:border-zinc-550"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                {uniqueStates.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Estado Comercial */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Estado Operativo</label>
              <select
                id="status-filter-select"
                className="w-full p-2 border border-zinc-200 rounded text-xs font-medium bg-white focus:outline-none"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value={PropertyStatus.ACTIVO}>Habilitados (Activos)</option>
                <option value={PropertyStatus.INACTIVO}>Bloqueados (Inactivos)</option>
              </select>
            </div>
          </div>

          {/* DATATABLE DE PROPIEDADES (ShadCN style) */}
          <div className="bg-white border border-zinc-200 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-zinc-200">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-4 w-12"></th>
                    <th className="p-4">Establecimiento</th>
                    <th className="p-4">Geolocalización</th>
                    <th className="p-4">Proveedor Mayorista</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Contrato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-450 italic">
                        Ningún establecimiento o hotel coincide con los criterios de búsqueda de producto.
                      </td>
                    </tr>
                  ) : (
                    filteredProperties.map(p => {
                      const associatedRoomsCount = roomTypes.filter(rt => rt.property_id === p.id).length;
                      return (
                        <tr
                          key={p.id}
                          id={`hotel-row-${p.id}`}
                          className="hover:bg-zinc-50/60 transition-colors group cursor-pointer"
                          onClick={() => {
                            setActivePropertyId(p.id);
                            setViewLevel(2);
                            setActiveTab("resumen");
                          }}
                        >
                          <td className="p-4" onClick={e => e.stopPropagation()}>
                            <img
                              src={p.imagen}
                              alt={p.nombre}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded border border-zinc-200"
                            />
                          </td>
                          <td className="p-4">
                            <h4 className="font-bold text-zinc-900 text-sm group-hover:underline">{p.nombre}</h4>
                            <span className="text-[10px] text-zinc-450 font-mono">Código de Producto: {p.id}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{p.ciudad}, {p.estado} ({p.pais})</span>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-zinc-800">
                            {p.supplierName}
                          </td>
                          <td className="p-4">
                            {p.categoria > 0 ? (
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < p.categoria ? "fill-zinc-900 stroke-zinc-900" : "stroke-zinc-200 fill-zinc-50"}`}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-semibold px-2 py-0.5 bg-zinc-100 rounded border border-zinc-200">
                                Sin estrellas / Posada / Apto
                              </span>
                            )}
                          </td>
                          <td className="p-4" onClick={e => e.stopPropagation()}>
                            <button
                              id={`toggle-status-btn-${p.id}`}
                              onClick={() => handleTogglePropertyStatus(p.id, p.status)}
                              className={`px-2 py-0.5.5 text-[9px] font-bold tracking-wider rounded uppercase border cursor-pointer transition-colors ${p.status === PropertyStatus.ACTIVO
                                ? "bg-zinc-50 border-zinc-200 text-zinc-900 hover:text-zinc-500"
                                : "bg-red-50 border-red-200 text-red-650 hover:bg-white"
                                }`}
                            >
                              ● {p.status}
                            </button>
                          </td>
                          <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                id={`edit-hotel-btn-${p.id}`}
                                onClick={() => {
                                  setActivePropertyId(p.id);
                                  setViewLevel(2);
                                }}
                                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                Ficha de Detalle <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* List footer info */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-500 font-medium flex justify-between items-center">
              <span>Mostrando {filteredProperties.length} de {localProperties.length} propiedades cargadas</span>
              <span>Ubicación de contingencia local: Foratour Memory-DB</span>
            </div>
          </div>
        </div>
      )}

      {/* --- LEVEL 2: DETALLE / DASHBOARD DE LA PROPIEDAD --- */}
      {viewLevel === 2 && activeProperty && (
        <div className="space-y-6">

          {/* Breadcrumb Navigation & Top Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-100/50 p-4 border border-zinc-200 rounded-lg">
            <button
              id="back-to-list-link"
              onClick={() => setViewLevel(1)}
              className="flex items-center gap-2 text-xs font-bold text-zinc-900 uppercase tracking-wider hover:text-zinc-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al listado de propiedades
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Detalle de:</span>
              <span className="text-xs bg-white border border-zinc-200 text-zinc-800 px-3 py-1 font-bold rounded">
                {activeProperty.nombre}
              </span>
            </div>
          </div>

          {/* Hero Header Presentation */}
          <div className="relative h-44 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-250 shadow-sm flex items-end">
            <img
              src={activeProperty.imagen}
              alt={activeProperty.nombre}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent"></div>

            {/* Hero Main Data Overlay */}
            <div className="relative p-6 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 border rounded-full ${activeProperty.status === PropertyStatus.ACTIVO ? "bg-emerald-900 border-emerald-700 text-emerald-100" : "bg-red-950 border-red-800 text-red-200"
                    }`}>
                    ● {activeProperty.status}
                  </span>
                  {activeProperty.categoria > 0 ? (
                    <div className="flex text-amber-400">
                      {Array.from({ length: activeProperty.categoria }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full inline-flex items-center gap-1">
                      Sin estrellas / Posada / Apartamento
                    </span>
                  )}
                </div>
                <h3 className="font-black text-2xl text-white tracking-tight">{activeProperty.nombre}</h3>
                <p className="text-zinc-300 text-sm flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  {activeProperty.ciudad}, {activeProperty.estado} ({activeProperty.pais}) - Proveedor: {activeProperty.supplierName}
                </p>
              </div>

              {/* ACTION: REDIRECT TO TARIFFS EDITOR */}
              <button
                id="manage-room-rates-trigger"
                onClick={() => setViewLevel(3)}
                className="px-5 py-3 bg-white hover:bg-zinc-100 text-zinc-900 rounded font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-md border border-white"
              >
                <Edit3 className="w-4 h-4 text-zinc-900" /> Gestionar Tarifas y Habitaciones
              </button>
            </div>
          </div>

          {/* Sub-Tabs Organizer Panel */}
          <div className="flex border-b border-zinc-200 bg-white px-2 rounded-t-lg">
            <button
              id="subtab-resumen"
              onClick={() => setActiveTab("resumen")}
              className={`py-3.5 px-5 font-bold text-xs tracking-wider uppercase border-b-2 transition-all cursor-pointer ${activeTab === "resumen"
                ? "border-zinc-900 text-zinc-900 font-extrabold"
                : "border-transparent text-zinc-400 hover:text-zinc-800"
                }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Resumen (Rendimiento)
            </button>
            <button
              id="subtab-galeria"
              onClick={() => setActiveTab("galeria")}
              className={`py-3.5 px-5 font-bold text-xs tracking-wider uppercase border-b-2 transition-all cursor-pointer ${activeTab === "galeria"
                ? "border-zinc-900 text-zinc-900 font-extrabold"
                : "border-transparent text-zinc-400 hover:text-zinc-800"
                }`}
            >
              <Camera className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Galería
            </button>
            <button
              id="subtab-stopsales"
              onClick={() => setActiveTab("stopsales")}
              className={`py-3.5 px-5 font-bold text-xs tracking-wider uppercase border-b-2 transition-all cursor-pointer ${activeTab === "stopsales"
                ? "border-zinc-900 text-zinc-900 font-extrabold"
                : "border-transparent text-zinc-400 hover:text-zinc-800"
                }`}
            >
              <Ban className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Stop Sales (Fechas Cerradas)
            </button>
            <button
              id="subtab-politicas"
              onClick={() => setActiveTab("politicas")}
              className={`py-3.5 px-5 font-bold text-xs tracking-wider uppercase border-b-2 transition-all cursor-pointer ${activeTab === "politicas"
                ? "border-zinc-900 text-zinc-900 font-extrabold"
                : "border-transparent text-zinc-400 hover:text-zinc-800"
                }`}
            >
              <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Políticas de Alojamiento
            </button>
          </div>

          {/* DYNAMIC CONTENT PER ACTIVE TAB */}
          <div className="bg-white border-x border-b border-zinc-200 rounded-b-lg p-6 min-h-[25rem]">

            {/* 1. Tab Resumen */}
            {activeTab === "resumen" && (
              <div className="space-y-6">

                {/* 3 Metrics Cards (Bento) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-zinc-200 rounded bg-zinc-50/50">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Ocupación Promedio MTD</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h4 className="font-extrabold text-2xl text-zinc-900">82.4%</h4>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-55 inline-block px-1.5 py-0.2 rounded">+3.2% vs mayo</span>
                    </div>
                  </div>
                  <div className="p-4 border border-zinc-200 rounded bg-zinc-50/50">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Tarifa de Venta Promedio (ADR)</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h4 className="font-extrabold text-2xl text-zinc-900">$142.50</h4>
                      <span className="text-[10px] text-zinc-400 font-semibold font-mono">FIT Wholesale NET</span>
                    </div>
                  </div>
                  <div className="p-4 border border-zinc-200 rounded bg-zinc-50/50">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Ingresos Emitidos Estimados (MTD)</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h4 className="font-extrabold text-2xl text-zinc-900">$18,450.00</h4>
                      <span className="text-[10px] text-zinc-400 font-semibold font-mono">13 Cuentas Emitidas</span>
                    </div>
                  </div>
                </div>

                {/* Relational Stock Status */}
                <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50/20 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                    <h4 className="font-bold text-xs text-zinc-900 uppercase">Habitaciones Relacionadas en Contrato</h4>
                    <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-650 font-bold">
                      {roomTypes.filter(rt => rt.property_id === activeProperty.id).length} tipos cargados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {roomTypes.filter(rt => rt.property_id === activeProperty.id).map(rt => (
                      <div key={rt.id} className="p-3 bg-white border border-zinc-100 rounded flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-full bg-zinc-50 border border-zinc-250 text-zinc-700">
                            <Bed className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h5 className="font-bold text-zinc-800 text-xs">{rt.nombre}</h5>
                            <span className="text-[10px] text-zinc-450 uppercase flex items-center gap-1 font-semibold">
                              <Utensils className="w-3 h-3" /> {rt.regimenAlimentacion}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-400">Capacidad: <strong className="text-zinc-850 font-extrabold">{rt.capacidadMax} pax</strong></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Próximos Check-Ins (Mock list for product stats validation) */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    Pasajeros Registrados en Tránsito Próximo (Check-ins)
                  </h4>

                  <div className="border border-zinc-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xs divide-y divide-zinc-200">
                      <thead>
                        <tr className="bg-zinc-50 font-bold text-zinc-500 uppercase tracking-wider text-[9px]">
                          <th className="p-3">Huésped Titular</th>
                          <th className="p-3">Tipo de Habitación</th>
                          <th className="p-3">Check-In</th>
                          <th className="p-3">Check-Out</th>
                          <th className="p-3">Pasajeros</th>
                          <th className="p-3">Estado ERP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium">
                        <tr id="checkin-row-1">
                          <td className="p-3 font-bold text-zinc-900">Eduardo Mendoza & Gp.</td>
                          <td className="p-3">Habitación Standard Doble</td>
                          <td className="p-3 font-semibold text-zinc-700">12/06/2026</td>
                          <td className="p-3 text-zinc-500">19/06/2026</td>
                          <td className="p-3 font-mono font-bold">2 Pax</td>
                          <td className="p-3">
                            <span className="text-[8.5px] uppercase bg-green-50 text-green-700 border border-green-200 py-0.5 px-2 rounded-full font-bold">Confirmada</span>
                          </td>
                        </tr>
                        <tr id="checkin-row-2">
                          <td className="p-3 font-bold text-zinc-900">Valentina Rossi</td>
                          <td className="p-3">Suite Familiar de Lujo</td>
                          <td className="p-3 font-semibold text-zinc-700">18/06/2026</td>
                          <td className="p-3 text-zinc-500">25/06/2026</td>
                          <td className="p-3 font-mono font-bold">3 Pax</td>
                          <td className="p-3">
                            <span className="text-[8.5px] uppercase bg-green-50 text-green-700 border border-green-200 py-0.5 px-2 rounded-full font-bold">Confirmada</span>
                          </td>
                        </tr>
                        <tr id="checkin-row-3">
                          <td className="p-3 font-bold text-zinc-900">Corporativo Ron Santa Teresa</td>
                          <td className="p-3">Superior Deluxe Vista al Campo</td>
                          <td className="p-3 font-semibold text-zinc-700">01/07/2026</td>
                          <td className="p-3 text-zinc-500">05/07/2026</td>
                          <td className="p-3 font-mono font-bold">4 Pax</td>
                          <td className="p-3">
                            <span className="text-[8.5px] uppercase bg-amber-50 text-amber-700 border border-amber-200 py-0.5 px-2 rounded-full font-bold">Lista Espera</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* 2. Tab Galería */}
            {activeTab === "galeria" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-zinc-900 text-sm">Biblioteca Fotográfica</h5>
                    <p className="text-xs text-zinc-450">Imágenes sincronizadas con material publicitario para minoristas.</p>
                  </div>
                  <button
                    id="trigger-photo-upload"
                    onClick={handleAddImageToGallery}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Simular Firebase Upload
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {tempImages.map((img, idx) => (
                    <div key={idx} className="group relative h-28 bg-zinc-100 rounded border border-zinc-200 overflow-hidden shadow-xs cursor-pointer">
                      <img
                        src={img}
                        alt="Alojamiento"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 right-2 bg-zinc-900/80 text-white p-1 rounded hover:bg-zinc-950 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" onClick={() => {
                          setTempImages(prev => prev.filter((_, i) => i !== idx));
                          triggerNotification("✓ Foto descartada de la galería.");
                        }} />
                      </div>
                      <div className="absolute bottom-1 left-2">
                        <span className="text-[8.5px] bg-zinc-950/80 text-white px-1.5 py-0.2 rounded font-semibold whitespace-nowrap">IMAGEN_{idx + 1}.JPG</span>
                      </div>
                    </div>
                  ))}

                  {/* Empty Slate Adder Trigger */}
                  <div
                    onClick={handleAddImageToGallery}
                    className="h-28 border border-dashed border-zinc-300 hover:border-zinc-500 rounded flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-700 bg-zinc-50/50 cursor-pointer transition-colors"
                  >
                    <Camera className="w-6 h-6 stroke-1 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Añadir Imagen</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Tab Stop Sales */}
            {activeTab === "stopsales" && (
              <div className="space-y-6">

                {/* Formulario rápido para Bloquear Ventas */}
                <form onSubmit={handleAddStopSale} className="bg-zinc-50 p-4 border border-zinc-200 rounded-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-5 text-zinc-800" />
                    <h5 className="font-bold text-zinc-900 text-xs uppercase tracking-wider">Declarar Cierre Temporal de Ventas (Stop Sale)</h5>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha de Inicio</label>
                      <input
                        id="stopsale-start-date"
                        type="date"
                        required
                        className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white focus:outline-none"
                        value={newStopSaleForm.fechaInicio}
                        onChange={(e) => setNewStopSaleForm(prev => ({ ...prev, fechaInicio: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha de Cierre (Fin)</label>
                      <input
                        id="stopsale-end-date"
                        type="date"
                        required
                        className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white focus:outline-none"
                        value={newStopSaleForm.fechaFin}
                        onChange={(e) => setNewStopSaleForm(prev => ({ ...prev, fechaFin: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Motivo o Justificación contractual</label>
                      <input
                        id="stopsale-reason-input"
                        type="text"
                        placeholder="Ej: Mantenimiento, Reservas Bloqueadas"
                        className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white focus:outline-none"
                        value={newStopSaleForm.motivo}
                        onChange={(e) => setNewStopSaleForm(prev => ({ ...prev, motivo: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      id="submit-stopsale-btn"
                      type="submit"
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Bloquear Reservas en Fechas
                    </button>
                  </div>
                </form>

                {/* List of active Stop Sales for active property */}
                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Cierres del Hotel Vigentes</h5>

                  <div className="border border-zinc-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xs divide-y divide-zinc-200">
                      <thead>
                        <tr className="bg-zinc-50 font-bold text-zinc-500 uppercase tracking-wider text-[9px]">
                          <th className="p-3">Código Cierre</th>
                          <th className="p-3">Desde (Inicio)</th>
                          <th className="p-3">Hasta (Fin)</th>
                          <th className="p-3">Descripción / Motivo</th>
                          <th className="p-3 text-right">Liberar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium">
                        {stopSales.filter(s => s.property_id === activePropertyId).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-5 text-center text-zinc-450 italic bg-white">
                              No hay Stop Sales o cierres configurados para este hotel. Todo el periodo se mantiene con ventas abiertas.
                            </td>
                          </tr>
                        ) : (
                          stopSales.filter(s => s.property_id === activePropertyId).map(s => (
                            <tr key={s.id}>
                              <td className="p-3 font-mono font-bold text-zinc-650">{s.id}</td>
                              <td className="p-3 text-zinc-900">{formatDate(s.fechaInicio)}</td>
                              <td className="p-3 text-zinc-900">{formatDate(s.fechaFin)}</td>
                              <td className="p-3 text-zinc-650">{s.motivo || "Cierre de contingencia"}</td>
                              <td className="p-3 text-right">
                                <button
                                  id={`delete-stopsale-btn-${s.id}`}
                                  onClick={() => handleDeleteStopSale(s.id)}
                                  className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 rounded font-bold uppercase text-[9px]"
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* 4. Tab Políticas */}
            {activeTab === "politicas" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div>
                    <h5 className="font-bold text-zinc-900 text-sm">Condiciones Generales & Reglas del Voucher</h5>
                    <p className="text-xs text-zinc-450">Términos impresos en los vouchers emitidos por Foratour ERP para este hotel.</p>
                  </div>
                  <button
                    id="save-policies-btn"
                    onClick={handleSavePolicies}
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Condiciones Generales de Estadía y Release</label>
                  <textarea
                    id="property-policies-textarea"
                    rows={8}
                    className="w-full p-4 border border-zinc-200 rounded-lg text-xs font-semibold bg-white text-zinc-700 focus:outline-none focus:border-zinc-500 leading-relaxed"
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                  />
                </div>

                <div className="p-4 bg-zinc-50 rounded border border-zinc-205 text-zinc-650 text-xs leading-relaxed font-semibold">
                  <span className="font-bold text-zinc-900 block uppercase mb-1 text-[10px] tracking-wider">Nota Importante:</span>
                  Toda enmienda salvada en este panel modificará al instante el XML y plantillas PDF de Voucher Receptivo. Por favor, mantenga la claridad de horarios locales de entrega de habitaciones.
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* --- LEVEL 3: EDITOR DE TARIFAS Y HABITACIONES (Matrix financial layout) --- */}
      {viewLevel === 3 && activeProperty && (
        <div className="space-y-6">

          {/* Section Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 text-white p-5 rounded-lg border border-zinc-800 shadow">
            <div>
              <div className="flex items-center gap-1.5">
                <button
                  id="level3-back-btn"
                  onClick={() => setViewLevel(2)}
                  className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer mr-2 border border-zinc-800 rounded bg-zinc-950"
                  title="Atrás al Detalle"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                </button>
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase block font-black">Matriz Financiera de tarifas</span>
                  <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                    {activeProperty.nombre} - Editor de Tarifas
                  </h3>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="back-to-dashboard-btn"
                onClick={() => setViewLevel(2)}
                className="px-4.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Volver a la Ficha de Hotel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* --- SECCIÓN A: GESTIÓN DE HABITACIONES (Room types) --- */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">

              {/* Formulario Agregar Tipo Habitación */}
              <div className="bg-white p-5 border border-zinc-200 rounded-lg space-y-4 shadow-xs">
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <Bed className="w-4.5 h-4.5 text-zinc-750" />
                    Carga de Tipos de Habitación
                  </h4>
                  <p className="text-xs text-zinc-450 mt-1">Crea o añade categorías de alojamiento relacionales (Fase 1).</p>
                </div>

                <form onSubmit={handleAddRoomTypeSubmit} className="space-y-4">

                  {/* Selector Predefinida vs Manual */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-1 rounded-md border border-zinc-200">
                    <button
                      id="pick-predefined-toggle"
                      type="button"
                      onClick={() => setIsPredefinedPick(true)}
                      className={`py-1.5 px-3 rounded font-bold text-[10px] uppercase tracking-wider transition-colors ${isPredefinedPick ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-700"
                        }`}
                    >
                      Predefinidas Listado
                    </button>
                    <button
                      id="pick-manual-toggle"
                      type="button"
                      onClick={() => setIsPredefinedPick(false)}
                      className={`py-1.5 px-3 rounded font-bold text-[10px] uppercase tracking-wider transition-colors ${!isPredefinedPick ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-700"
                        }`}
                    >
                      Carga Manual (Nuevo)
                    </button>
                  </div>

                  {/* Nombre Input Dependiendo de Opción */}
                  {isPredefinedPick ? (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Seleccionar Habitación</label>
                      <select
                        id="predefined-room-select"
                        className="w-full p-2.5 border border-zinc-200 rounded text-xs bg-white text-zinc-800 font-semibold focus:outline-none"
                        value={newRoomForm.nombrePredefinido}
                        onChange={(e) => setNewRoomForm(prev => ({ ...prev, nombrePredefinido: e.target.value }))}
                      >
                        {preDefinedRooms.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block font-medium">Nombre de Categoría Manual</label>
                      <input
                        id="manual-room-input"
                        type="text"
                        required
                        placeholder="Ej: Suite Frente al Golf Presidencial"
                        className="w-full p-2.5 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-800 focus:outline-none focus:border-zinc-500"
                        value={newRoomForm.nombreManual}
                        onChange={(e) => setNewRoomForm(prev => ({ ...prev, nombreManual: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Régimen Alimentico Relacional (La alimentación vive dentro del RoomType como enum) */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Régimen de Alimentación (Relacional)</label>
                    <select
                      id="room-alimentation-plan"
                      className="w-full p-2.5 border border-zinc-200 rounded text-xs bg-white text-zinc-800 font-bold focus:outline-none"
                      value={newRoomForm.regimenAlimentacion}
                      onChange={(e) => setNewRoomForm(prev => ({ ...prev, regimenAlimentacion: e.target.value as RegimenAlimentacion }))}
                    >
                      <option value={RegimenAlimentacion.SOLO_HABITACION}>SOLO HABITACIÓN (EP)</option>
                      <option value={RegimenAlimentacion.DESAYUNO}>DESAYUNO INCLUIDO (CP)</option>
                      <option value={RegimenAlimentacion.MEDIA_PENSION}>MEDIA PENSIÓN (MAP / AP)</option>
                      <option value={RegimenAlimentacion.TODO_INCLUIDO}>TODO INCLUIDO (All-Inclusive / AI)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Capacidad Máxima (Pax)</label>
                      <input
                        id="room-max-capacity"
                        type="number"
                        min="1"
                        max="8"
                        required
                        className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-805"
                        value={newRoomForm.capacidadMax}
                        onChange={(e) => setNewRoomForm(prev => ({ ...prev, capacidadMax: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Ocupación Base Contractual</label>
                      <input
                        id="room-base-occupancy"
                        type="number"
                        min="1"
                        max="8"
                        required
                        className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-805"
                        value={newRoomForm.ocupacionBase}
                        onChange={(e) => setNewRoomForm(prev => ({ ...prev, ocupacionBase: e.target.value }))}
                      />
                    </div>
                  </div>

                  <button
                    id="submit-room-type"
                    type="submit"
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Guardar Tipo de Habitación
                  </button>
                </form>
              </div>

              {/* Listado de Habitaciones Actuales */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3 shadow-xs">
                <h5 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Inventario de Tipos Relacionados</h5>

                <div className="divide-y divide-zinc-200">
                  {roomTypes.filter(rt => rt.property_id === activePropertyId).length === 0 ? (
                    <div className="p-4 text-center text-zinc-450 text-xs italic">
                      No hay tipos de habitación cargados para esta propiedad. Debes agregar al menos una.
                    </div>
                  ) : (
                    roomTypes.filter(rt => rt.property_id === activePropertyId).map(rt => (
                      <div key={rt.id} className="py-3 flex justify-between items-center group">
                        <div>
                          <h6 className="font-bold text-zinc-900 text-xs">{rt.nombre}</h6>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                            <span className="text-[9px] tracking-wide uppercase font-bold text-zinc-650 bg-zinc-50 border border-zinc-200 px-1.5 rounded inline-flex items-center gap-1">
                              <Utensils className="w-2.5 h-2.5" />
                              {rt.regimenAlimentacion}
                            </span>
                            <span className="text-zinc-400">|</span>
                            <span className="text-zinc-500 font-semibold">Max Pax: <strong className="text-zinc-800">{rt.capacidadMax}</strong></span>
                            <span className="text-zinc-400">|</span>
                            <span className="text-zinc-500 font-mono text-[9px] uppercase">ID: {rt.id}</span>
                          </div>
                        </div>

                        <button
                          id={`del-room-btn-${rt.id}`}
                          onClick={() => {
                            if (confirm(`El borrado de "${rt.nombre}" eliminará cascada y planes de tarifación adjuntos. ¿Continuar?`)) {
                              handleDeleteRoomType(rt.id);
                            }
                          }}
                          className="p-1 px-2.5 bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-600 border border-zinc-200 hover:border-red-200 rounded font-bold uppercase text-[9px]"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* --- SECCIÓN B: GESTIÓN DE TARIFAS / RATE PLANS --- */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-6">

              {/* Market Tabs: Nacional / Internacional */}
              <div className="flex border-b border-zinc-200 bg-zinc-50/50 p-1 rounded-lg gap-1">
                <button
                  type="button"
                  id="tab-market-nacional"
                  onClick={() => {
                    setActiveMercadoTab("NACIONAL");
                    setNewRateForm(prev => ({ ...prev, mercado: "NACIONAL" }));
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer text-center ${
                    activeMercadoTab === "NACIONAL"
                      ? "bg-white text-zinc-900 shadow-xs border border-zinc-200"
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100/50"
                  }`}
                >
                  Mercado Nacional
                </button>
                <button
                  type="button"
                  id="tab-market-internacional"
                  onClick={() => {
                    setActiveMercadoTab("INTERNACIONAL");
                    setNewRateForm(prev => ({ ...prev, mercado: "INTERNACIONAL" }));
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer text-center ${
                    activeMercadoTab === "INTERNACIONAL"
                      ? "bg-white text-zinc-900 shadow-xs border border-zinc-200"
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100/50"
                  }`}
                >
                  Mercado Internacional
                </button>
              </div>

              <div className="text-[11px] text-zinc-500 bg-zinc-50 border border-zinc-200 p-2.5 rounded-lg">
                <strong>💡 Nota sobre mercados:</strong> Las agencias nacionales operan bajo tarifas en moneda local o tasa oficial, mientras que el mercado internacional requiere tarifas netas y facturación en divisa.
              </div>

              {/* Formulario Cargar Tarifa / Rate Plan — Opción A: Multi-Habitación */}
              <div className="bg-white p-5 border border-zinc-200 rounded-lg space-y-4 shadow-xs">
                <div>
                  <h4 className="font-bold text-zinc-905 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4.5 h-4.5 text-zinc-700" />
                    Cargar Plan de Tarifas — Multi-Habitación
                  </h4>
                  <p className="text-xs text-zinc-450 mt-1">Nombre el plan, configure fechas y asigne precios individuales a cada habitación seleccionada.</p>
                </div>

                <form onSubmit={handleAddRatePlanSubmit} className="space-y-4">

                  {/* Nombre del plan + Metodología cobro */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Nombre del Plan / Promoción</label>
                      <input
                        id="rateplan-promo-name"
                        type="text"
                        required
                        placeholder="Ej: Temporada Baja, Fin de Año, Promo Carnaval"
                        className="w-full p-2.5 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                        value={newRateForm.nombrePromocion}
                        onChange={(e) => setNewRateForm(prev => ({ ...prev, nombrePromocion: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-405 uppercase tracking-widest block">Metodología de Cobro</label>
                      <select
                        id="rateplan-charge-type-select"
                        className="w-full p-2.5 border border-zinc-200 bg-white rounded text-xs font-bold text-zinc-900"
                        value={newRateForm.tipoCobro}
                        onChange={(e) => setNewRateForm(prev => ({ ...prev, tipoCobro: e.target.value as TipoCobro }))}
                      >
                        <option value={TipoCobro.POR_HABITACION}>POR HABITACIÓN / NOCHE</option>
                        <option value={TipoCobro.POR_PERSONA}>POR PERSONA / INDIVIDUAL</option>
                      </select>
                    </div>
                  </div>

                  {/* Mercado objetivo de la tarifa */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Mercado Objetivo</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        id="form-market-nacional-btn"
                        onClick={() => setNewRateForm(prev => ({ ...prev, mercado: "NACIONAL" }))}
                        className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all cursor-pointer text-center ${
                          newRateForm.mercado === "NACIONAL"
                            ? "bg-zinc-900 border-zinc-900 text-white shadow-xs"
                            : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                        }`}
                      >
                        Nacional
                      </button>
                      <button
                        type="button"
                        id="form-market-internacional-btn"
                        onClick={() => setNewRateForm(prev => ({ ...prev, mercado: "INTERNACIONAL" }))}
                        className={`flex-1 py-2 px-3 border rounded text-xs font-bold transition-all cursor-pointer text-center ${
                          newRateForm.mercado === "INTERNACIONAL"
                            ? "bg-zinc-900 border-zinc-900 text-white shadow-xs"
                            : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                        }`}
                      >
                        Internacional
                      </button>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha de Inicio</label>
                      <input
                        id="rateplan-start-date"
                        type="date"
                        required
                        className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-850"
                        value={newRateForm.fechaInicio}
                        onChange={(e) => setNewRateForm(prev => ({ ...prev, fechaInicio: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Fecha de Fin</label>
                      <input
                        id="rateplan-end-date"
                        type="date"
                        required
                        className="w-full p-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-850"
                        value={newRateForm.fechaFin}
                        onChange={(e) => setNewRateForm(prev => ({ ...prev, fechaFin: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Multi-room selection with per-room pricing */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
                      Habitaciones del Plan — Selecciona y asigna tarifas individuales
                    </label>
                    {roomTypes.filter(rt => rt.property_id === activePropertyId).length === 0 ? (
                      <p className="text-xs text-zinc-400 italic p-3 bg-zinc-50 rounded border border-zinc-200">
                        Este hotel no tiene tipos de habitación. Agrega habitaciones en la Sección A primero.
                      </p>
                    ) : (
                      <div className="border border-zinc-200 rounded-lg overflow-hidden">
                        {/* Header row */}
                        <div className="grid bg-zinc-50 border-b border-zinc-200 px-3 py-2" style={{ gridTemplateColumns: '1.5rem 1fr 5rem 5rem 5rem' }}>
                          <div></div>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Habitación</span>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-center">Base (USD)</span>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-center">+Adulto</span>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-center">+Niño</span>
                        </div>
                        {/* Room rows */}
                        {roomTypes.filter(rt => rt.property_id === activePropertyId).map((rt, idx) => {
                          const isChecked = !!selectedRooms[rt.id];
                          return (
                            <div
                              key={rt.id}
                              className={`grid items-center px-3 py-2.5 gap-2 transition-colors ${idx > 0 ? 'border-t border-zinc-100' : ''
                                } ${isChecked ? 'bg-zinc-50' : 'bg-white'
                                }`}
                              style={{ gridTemplateColumns: '1.5rem 1fr 5rem 5rem 5rem' }}
                            >
                              {/* Checkbox */}
                              <input
                                id={`room-check-${rt.id}`}
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleRoomToggle(rt.id, e.target.checked)}
                                className="w-3.5 h-3.5 accent-zinc-900 cursor-pointer"
                              />
                              {/* Room name */}
                              <label htmlFor={`room-check-${rt.id}`} className="cursor-pointer">
                                <span className="font-semibold text-zinc-800 text-xs block leading-tight">{rt.nombre}</span>
                                <span className="text-[9px] text-zinc-400 uppercase font-bold">{rt.regimenAlimentacion} · Cap. {rt.capacidadMax} pax</span>
                              </label>
                              {/* Price inputs — only enabled when checked */}
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                                <input
                                  id={`room-price-base-${rt.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  disabled={!isChecked}
                                  value={isChecked ? selectedRooms[rt.id].tarifaBase : ""}
                                  onChange={(e) => handleRoomPriceChange(rt.id, "tarifaBase", e.target.value)}
                                  className="w-full pl-5 pr-1 py-1.5 border border-zinc-200 rounded text-[11px] font-bold text-zinc-900 bg-white focus:outline-none focus:border-zinc-500 disabled:bg-zinc-50 disabled:text-zinc-300 disabled:cursor-not-allowed text-right"
                                />
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                                <input
                                  id={`room-price-adult-${rt.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  disabled={!isChecked}
                                  value={isChecked ? selectedRooms[rt.id].tarifaExtraAdulto : ""}
                                  onChange={(e) => handleRoomPriceChange(rt.id, "tarifaExtraAdulto", e.target.value)}
                                  className="w-full pl-5 pr-1 py-1.5 border border-zinc-200 rounded text-[11px] font-bold text-zinc-900 bg-white focus:outline-none focus:border-zinc-500 disabled:bg-zinc-50 disabled:text-zinc-300 disabled:cursor-not-allowed text-right"
                                />
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px]">$</span>
                                <input
                                  id={`room-price-child-${rt.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  disabled={!isChecked}
                                  value={isChecked ? selectedRooms[rt.id].tarifaExtraNino : ""}
                                  onChange={(e) => handleRoomPriceChange(rt.id, "tarifaExtraNino", e.target.value)}
                                  className="w-full pl-5 pr-1 py-1.5 border border-zinc-200 rounded text-[11px] font-bold text-zinc-900 bg-white focus:outline-none focus:border-zinc-500 disabled:bg-zinc-50 disabled:text-zinc-300 disabled:cursor-not-allowed text-right"
                                />
                              </div>
                            </div>
                          );
                        })}
                        {/* Selection summary */}
                        <div className="px-3 py-2 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
                          <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">
                            {Object.keys(selectedRooms).length} habitación(es) seleccionada(s)
                          </span>
                          {Object.keys(selectedRooms).length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedRooms({})}
                              className="text-[9px] text-zinc-400 hover:text-red-500 font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Limpiar selección
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Política de cancelación compartida del plan */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Condición de Cancelación (aplica a todo el plan)</label>
                    <input
                      id="rateplan-cancel-policy-input"
                      type="text"
                      className="w-full p-2.5 border border-zinc-200 rounded text-xs bg-white text-zinc-700 font-semibold focus:outline-none"
                      value={newRateForm.politicasCancelacion}
                      onChange={(e) => setNewRateForm(prev => ({ ...prev, politicasCancelacion: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] text-zinc-400 italic">
                      Se creará 1 tarifa por cada habitación seleccionada.
                    </span>
                    <button
                      id="submit-rate-plan"
                      type="submit"
                      className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Guardar Plan de Tarifas
                    </button>
                  </div>
                </form>
              </div>

              {/* Registro de Tarifas Agrupadas por Plan/Promoción (Acordeón) */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3 shadow-xs">
                <h5 className="font-bold text-xs text-zinc-450 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarRange className="w-3.5 h-3.5" />
                  Planes de Tarifa Registrados (Agrupados por Temporada)
                </h5>

                {(() => {
                  const propertyRates = ratePlans.filter(rp =>
                    rp.property_id === activePropertyId &&
                    rp.mercado === activeMercadoTab
                  );
                  if (propertyRates.length === 0) {
                    return (
                      <div className="p-8 text-center border border-dashed border-zinc-200 rounded-lg">
                        <DollarSign className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                        <p className="text-xs text-zinc-400 italic">No hay planes de tarifa registrados para el mercado {activeMercadoTab === "NACIONAL" ? "Nacional" : "Internacional"}.</p>
                        <p className="text-[10px] text-zinc-300 mt-1">Usa el formulario de arriba para crear el primer plan para este mercado.</p>
                      </div>
                    );
                  }

                  // Group by nombrePromocion
                  const groups = propertyRates.reduce((acc, rp) => {
                    if (!acc[rp.nombrePromocion]) acc[rp.nombrePromocion] = [];
                    acc[rp.nombrePromocion].push(rp);
                    return acc;
                  }, {} as { [plan: string]: RatePlan[] });

                  return (
                    <div className="space-y-3">
                      {Object.entries(groups).map(([planName, planRates]) => {
                        const isExpanded = expandedGroups.has(planName);
                        const firstRate = planRates[0];
                        const minDate = planRates.reduce((min, r) => r.fechaInicio < min ? r.fechaInicio : min, firstRate.fechaInicio);
                        const maxDate = planRates.reduce((max, r) => r.fechaFin > max ? r.fechaFin : max, firstRate.fechaFin);
                        return (
                          <div key={planName} className="border border-zinc-200 rounded-lg overflow-hidden">
                            {/* Group Header */}
                            <div className="flex items-center justify-between bg-zinc-50 px-4 py-3 border-b border-zinc-200">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-zinc-900 rounded">
                                  <CalendarRange className="w-3 h-3 text-white" />
                                </div>
                                <div>
                                  <h6 className="font-extrabold text-zinc-900 text-xs">{planName}</h6>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] text-zinc-400 font-semibold">
                                      {formatDate(minDate)} → {formatDate(maxDate)}
                                    </span>
                                    <span className="text-[9px] bg-zinc-200 text-zinc-700 px-1.5 py-0.2 rounded font-bold">
                                      {planRates.length} hab.
                                    </span>
                                    <span className="text-[9px] bg-zinc-100 text-zinc-500 px-1.5 py-0.2 rounded font-bold uppercase">
                                      {firstRate.tipoCobro === TipoCobro.POR_HABITACION ? 'Por Hab.' : 'Por Persona'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  id={`delete-group-btn-${planName.replace(/\s+/g, '-')}`}
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`¿Eliminar el plan "${planName}" con todas sus ${planRates.length} tarifa(s)?`)) {
                                      handleDeleteRatePlanGroup(planName);
                                    }
                                  }}
                                  className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 cursor-pointer transition-colors"
                                >
                                  Eliminar Plan
                                </button>
                                <button
                                  id={`toggle-group-btn-${planName.replace(/\s+/g, '-')}`}
                                  type="button"
                                  onClick={() => toggleGroupExpansion(planName)}
                                  className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-white text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-100 cursor-pointer transition-colors flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <><ChevronRight className="w-3 h-3 rotate-90" /> Colapsar</>
                                  ) : (
                                    <><ChevronRight className="w-3 h-3" /> Expandir</>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Group Rows (expandable) */}
                            {isExpanded && (
                              <div className="divide-y divide-zinc-100">
                                {/* Sub-header */}
                                <div className="grid bg-zinc-50/70 px-4 py-1.5" style={{ gridTemplateColumns: '1fr 5rem 5rem 5rem 2rem' }}>
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Habitación / Régimen</span>
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-right">Base</span>
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-right">+Adt</span>
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-right">+Niño</span>
                                  <span></span>
                                </div>
                                {planRates.map(rp => {
                                  const roomObj = roomTypes.find(rt => rt.id === rp.roomType_id);
                                  return (
                                    <div
                                      key={rp.id}
                                      className="grid items-center px-4 py-2.5 hover:bg-zinc-50/50 transition-colors"
                                      style={{ gridTemplateColumns: '1fr 5rem 5rem 5rem 2rem' }}
                                    >
                                      <div>
                                        <span className="font-semibold text-zinc-800 text-xs block">
                                          {roomObj ? roomObj.nombre : "Sin habitación"}
                                        </span>
                                        <span className="text-[9px] text-zinc-400 font-semibold uppercase">
                                          {roomObj ? roomObj.regimenAlimentacion : ""}
                                        </span>
                                      </div>
                                      <span className="text-xs font-extrabold text-zinc-900 text-right">${rp.tarifaBase.toFixed(2)}</span>
                                      <span className="text-xs font-semibold text-zinc-600 text-right">${rp.tarifaExtraAdulto.toFixed(2)}</span>
                                      <span className="text-xs font-semibold text-zinc-500 text-right">${rp.tarifaExtraNino.toFixed(2)}</span>
                                      <div className="flex justify-end">
                                        <button
                                          id={`delete-rateplan-btn-${rp.id}`}
                                          type="button"
                                          onClick={() => handleDeleteRatePlan(rp.id)}
                                          className="p-1 text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
                                          title="Eliminar esta tarifa"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                                {/* Group footer: policy */}
                                <div className="px-4 py-2 bg-zinc-50 flex items-center gap-2">
                                  <Info className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                                  <span className="text-[9px] text-zinc-400 font-semibold">{firstRate.politicasCancelacion}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* --- LEVEL 1 MODAL DIALOG: AGREGAR NUEVA PROPIEDAD OR HOTEL --- */}
      {isNewPropertyOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-250 rounded-lg max-w-xl w-full shadow-2xl overflow-hidden animate-zoom-in font-sans">

            {/* Modal Header */}
            <div className="bg-zinc-50 p-5 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-zinc-900" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900">Registrar Propiedad u Hotel Directo</h3>
              </div>
              <button
                id="close-hotel-modal-btn"
                onClick={() => setIsNewPropertyOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePropertySubmit}>
              <div className="p-6 space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto">

                {/* Nombre Propiedad */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Nombre del Hotel / Establecimiento comercial</label>
                  <input
                    id="new-hotel-name"
                    type="text"
                    required
                    placeholder="Ej: Lidotel Hotel Boutique Margarita, Hesperia"
                    className="w-full px-3 py-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                    value={newPropForm.nombre}
                    onChange={(e) => setNewPropForm(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                </div>

                {/* Proveedor Mayorista */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Distribuidor / Proveedor Mayorista de Enlace</label>
                  <input
                    id="new-hotel-supplier"
                    type="text"
                    required
                    placeholder="Ej: Lidotel Hoteles de Venezuela C.A., Bedsonline"
                    className="w-full px-3 py-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none"
                    value={newPropForm.supplierName}
                    onChange={(e) => setNewPropForm(prev => ({ ...prev, supplierName: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* País */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">País</label>
                    {paisMode === "list" ? (
                      <select
                        id="new-hotel-country"
                        className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-medium text-zinc-900 focus:outline-none"
                        value={newPropForm.pais}
                        onChange={(e) => {
                          if (e.target.value === "Otro") {
                            setPaisMode("custom");
                            setNewPropForm(prev => ({ ...prev, pais: "", estado: "" }));
                            setEstadoMode("custom");
                          } else {
                            setNewPropForm(prev => ({
                              ...prev,
                              pais: e.target.value,
                              estado: e.target.value === "Venezuela" ? "Nueva Esparta" : ""
                            }));
                            setEstadoMode(e.target.value === "Venezuela" ? "list" : "custom");
                          }
                        }}
                      >
                        {PAISES_LISTA.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex gap-1.5">
                        <input
                          id="new-hotel-country-manual"
                          type="text"
                          required
                          placeholder="Ej: Trinidad y Tobago, Curazao..."
                          className="flex-1 px-3 py-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                          value={customPais}
                          onChange={(e) => {
                            setCustomPais(e.target.value);
                            setNewPropForm(prev => ({ ...prev, pais: e.target.value }));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => { setPaisMode("list"); setCustomPais(""); setNewPropForm(prev => ({ ...prev, pais: "Venezuela" })); }}
                          className="px-2 py-1 text-[9px] bg-zinc-100 hover:bg-zinc-200 rounded border border-zinc-200 text-zinc-600 font-bold cursor-pointer whitespace-nowrap"
                        >
                          Lista
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Estado / Región */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Estado / Región</label>
                    {estadoMode === "list" && newPropForm.pais === "Venezuela" ? (
                      <div className="flex gap-1.5">
                        <select
                          id="new-hotel-state-selection"
                          className="flex-1 p-2 border border-zinc-200 bg-white rounded text-xs font-medium text-zinc-900 focus:outline-none"
                          value={newPropForm.estado}
                          onChange={(e) => {
                            if (e.target.value === "Otro") {
                              setEstadoMode("custom");
                              setNewPropForm(prev => ({ ...prev, estado: "" }));
                            } else {
                              setNewPropForm(prev => ({ ...prev, estado: e.target.value }));
                            }
                          }}
                        >
                          {ESTADOS_VENEZUELA.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <input
                          id="new-hotel-state-input"
                          type="text"
                          required
                          placeholder="Ej: Quintana Roo, La Altagracia, Tenerife..."
                          className="flex-1 px-3 py-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none focus:border-zinc-500"
                          value={customEstado || newPropForm.estado}
                          onChange={(e) => {
                            setCustomEstado(e.target.value);
                            setNewPropForm(prev => ({ ...prev, estado: e.target.value }));
                          }}
                        />
                        {newPropForm.pais === "Venezuela" && (
                          <button
                            type="button"
                            onClick={() => { setEstadoMode("list"); setCustomEstado(""); setNewPropForm(prev => ({ ...prev, estado: "Nueva Esparta" })); }}
                            className="px-2 py-1 text-[9px] bg-zinc-100 hover:bg-zinc-200 rounded border border-zinc-200 text-zinc-600 font-bold cursor-pointer whitespace-nowrap"
                          >
                            Lista
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ciudad */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Ciudad</label>
                    <input
                      id="new-hotel-city"
                      type="text"
                      required
                      placeholder="Ej: Pampatar, Juangriego, Caracas, Madrid"
                      className="w-full px-3 py-2 border border-zinc-200 rounded text-xs font-semibold bg-white text-zinc-900 focus:outline-none"
                      value={newPropForm.ciudad}
                      onChange={(e) => setNewPropForm(prev => ({ ...prev, ciudad: e.target.value }))}
                    />
                  </div>

                  {/* Estrellas Category */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Categoría / Estrellas</label>
                    <select
                      id="new-hotel-stars"
                      className="w-full p-2 border border-zinc-200 bg-white rounded text-xs font-medium text-zinc-900 focus:outline-none focus:border-zinc-500"
                      value={newPropForm.categoria}
                      onChange={(e) => setNewPropForm(prev => ({ ...prev, categoria: e.target.value }))}
                    >
                      <option value="5">5 Estrellas ★★★★★</option>
                      <option value="4">4 Estrellas ★★★★</option>
                      <option value="3">3 Estrellas ★★★</option>
                      <option value="2">2 Estrellas ★★</option>
                      <option value="1">1 Estrella ★</option>
                      <option value="0">Sin estrellas (Posada / Apartamento / Otro)</option>
                    </select>
                  </div>
                </div>

                {/* Políticas Generales de Contrato Inicial */}
                <div className="space-y-11.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-medium">Condiciones Comerciales y Políticas iniciales</label>
                  <textarea
                    id="new-hotel-policies"
                    rows={4}
                    className="w-full p-3 border border-zinc-200 rounded text-xs bg-white text-zinc-700 focus:outline-none focus:border-zinc-500 font-semibold"
                    value={newPropForm.politicasGenerales}
                    onChange={(e) => setNewPropForm(prev => ({ ...prev, politicasGenerales: e.target.value }))}
                  />
                </div>

              </div>

              {/* Modal Actions Footer */}
              <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  id="cancel-hotel-modal-btn"
                  type="button"
                  onClick={() => setIsNewPropertyOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded text-xs text-zinc-700 font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="save-new-hotel-btn"
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-805 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer font-sans"
                >
                  Registrar en Extranet
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
