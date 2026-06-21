import { 
  HotelProperty, 
  Reservation, 
  FlightLeg, 
  TransferService, 
  FinancialInvoice,
  B2BClient,
  ClientType,
  ClientStatus,
  ServiceType,
  ServiceItem,
  FleetVehicle,
  FleetDriver
} from "./types";
import { Property, RoomType, RatePlan, StopSale, PropertyStatus, RegimenAlimentacion, TipoCobro } from "./types/producto";

export const initialProperties: HotelProperty[] = [
  {
    id: "prop-01",
    name: "The Grand Plaza Luxury Resort & Spa",
    destination: "Cancún, México",
    category: "Playa",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    baseRate: 245,
    occupancy: 88,
    roomsCount: 150,
    stars: 5,
    amenities: ["Spa", "Premium Bar", "Golf Course", "Private Beach", "Butler Service"],
    allotment: 14,
    supplierName: "Plaza Hotels Wholesalers S.A."
  },
  {
    id: "prop-02",
    name: "Sunset Marina Yacht & Beach Resort",
    destination: "Punta Cana, Rep. Dominicana",
    category: "Playa",
    image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
    baseRate: 185,
    occupancy: 76,
    roomsCount: 95,
    stars: 4,
    amenities: ["All-Inclusive", "Kids Club", "Scuba Center", "Marina Dock"],
    allotment: 8,
    supplierName: "Occidental Blue Group Limitada"
  },
  {
    id: "prop-03",
    name: "Aconca Alps Alpine Lodge & Spa",
    destination: "Chamonix, Francia",
    category: "Montaña",
    image: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=800&q=80",
    baseRate: 310,
    occupancy: 94,
    roomsCount: 45,
    stars: 5,
    amenities: ["Ski-in/Ski-out", "Thermal Pools", "Michelin Restaurant", "Wine Cellar"],
    allotment: 4,
    supplierName: "Savoie Alpine Hospitality S.A."
  },
  {
    id: "prop-04",
    name: "Metropolis High-Rise Business Hotel",
    destination: "Madrid, España",
    category: "Ciudad",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
    baseRate: 140,
    occupancy: 62,
    roomsCount: 210,
    stars: 4,
    amenities: ["Executive Lounge", "Rooftop Pool", "High-speed WiFi", "Conference Center"],
    allotment: 25,
    supplierName: "Metropolis Euro Group S.L."
  },
  {
    id: "prop-05",
    name: "Family Paradise Aqua Club",
    destination: "Orlando, Florida (USA)",
    category: "Familiar",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    baseRate: 165,
    occupancy: 81,
    roomsCount: 180,
    stars: 4,
    amenities: ["Waterpark", "Character Breakfast", "Shuttle to Parks", "Game Arcade"],
    allotment: 12,
    supplierName: "Disney Area Receptives Inc"
  }
];

export const initialReservas: Reservation[] = [
  {
    id: "RES-8892",
    holder: "Alexander Pierce Group",
    hotelName: "The Grand Plaza Luxury Resort & Spa",
    checkIn: "2026-06-15",
    checkOut: "2026-06-22",
    pax: 4,
    status: "Confirmada",
    totalPrice: 1715,
    netPrice: 1450,
    specialRequests: "Habitaciones conectadas, vistas superiores.",
    flightNo: "AA-942",
    telefono: "+34 91 401 2233",
    email: "ventas@elcorteingles.es",
    agenciaName: "Viajes El Corte Inglés S.A.",
    createdAt: "2026-06-01",
    mercado: "INTERNACIONAL",
    servicios: [
      {
        id: "SRV-01",
        tipo: ServiceType.ALOJAMIENTO,
        descripcion: "The Grand Plaza Luxury Resort & Spa - 7 noches - 4 Pax",
        precioNeto: 1450,
        precioVenta: 1715,
        statusFacturacion: "Facturado"
      }
    ]
  },
  {
    id: "RES-8891",
    holder: "Jenkins Family Retreat",
    hotelName: "Sunset Marina Yacht & Beach Resort",
    checkIn: "2026-07-02",
    checkOut: "2026-07-09",
    pax: 5,
    status: "Confirmada",
    totalPrice: 1295,
    netPrice: 1100,
    specialRequests: "Cuna para bebé de 1 año solicitada.",
    flightNo: "DL-110",
    telefono: "+34 93 220 4455",
    email: "bookings@b2btravelproviders.com",
    agenciaName: "B2B Travel Providers SL",
    createdAt: "2026-06-02",
    mercado: "INTERNACIONAL",
    servicios: [
      {
        id: "SRV-02",
        tipo: ServiceType.ALOJAMIENTO,
        descripcion: "Sunset Marina Yacht & Beach Resort - 7 noches - 5 Pax",
        precioNeto: 1100,
        precioVenta: 1295,
        statusFacturacion: "Facturado"
      }
    ]
  },
  {
    id: "RES-8890",
    holder: "Global Tech Summit - Speaker Allotments",
    hotelName: "Metropolis High-Rise Business Hotel",
    checkIn: "2026-06-25",
    checkOut: "2026-06-28",
    pax: 12,
    status: "Petición Especial",
    totalPrice: 5040,
    netPrice: 4200,
    specialRequests: "Salida tardía de cortesía y acreditaciones VIP.",
    flightNo: "IB-3120",
    telefono: "+34 91 555 7890",
    email: "events@globaltech.com",
    agenciaName: "Viajes El Corte Inglés S.A.",
    createdAt: "2026-06-04",
    mercado: "INTERNACIONAL",
    servicios: [
      {
        id: "SRV-03",
        tipo: ServiceType.ALOJAMIENTO,
        descripcion: "Metropolis High-Rise Business Hotel - 3 noches - 12 Pax",
        precioNeto: 4200,
        precioVenta: 5040,
        statusFacturacion: "Borrador"
      }
    ]
  },
  {
    id: "RES-8889",
    holder: "Marcus Chen & Partner",
    hotelName: "Aconca Alps Alpine Lodge & Spa",
    checkIn: "2026-08-10",
    checkOut: "2026-08-15",
    pax: 2,
    status: "Pendiente de Pago",
    totalPrice: 1550,
    netPrice: 1320,
    specialRequests: "Pack romántico de bienvenida (Champán y frutos rojos).",
    flightNo: "AF-49",
    telefono: "+58 295 262 4411",
    email: "margarita.tours@gmail.com",
    agenciaName: "Margarita Island Tours C.A.",
    createdAt: "2026-06-05",
    mercado: "NACIONAL",
    servicios: [
      {
        id: "SRV-04",
        tipo: ServiceType.ALOJAMIENTO,
        descripcion: "Aconca Alps Alpine Lodge & Spa - 5 noches - 2 Pax",
        precioNeto: 1320,
        precioVenta: 1550,
        statusFacturacion: "Borrador"
      }
    ]
  },
  {
    id: "RES-8888",
    holder: "Kovacs Tour Group",
    hotelName: "Family Paradise Aqua Club",
    checkIn: "2026-06-18",
    checkOut: "2026-06-25",
    pax: 18,
    status: "Confirmada",
    totalPrice: 9940,
    netPrice: 8450,
    specialRequests: "3 habitaciones triples, 3 dobles. Menús sin gluten controlados.",
    flightNo: "LH-430",
    telefono: "+58 412 334 5566",
    email: "silva.freelancer@destinos.com",
    agenciaName: "Destinos Globales Freelance",
    createdAt: "2026-06-05",
    mercado: "INTERNACIONAL",
    servicios: [
      {
        id: "SRV-05",
        tipo: ServiceType.ALOJAMIENTO,
        descripcion: "Family Paradise Aqua Club - 7 noches - 18 Pax",
        precioNeto: 8450,
        precioVenta: 9940,
        statusFacturacion: "Borrador"
      }
    ]
  },
  {
    id: "RES-8887",
    holder: "Mendoza Honeymooners",
    hotelName: "Sunset Marina Yacht & Beach Resort",
    checkIn: "2026-09-12",
    checkOut: "2026-09-19",
    pax: 2,
    status: "Cancelada",
    totalPrice: 1540,
    netPrice: 1300,
    specialRequests: "Pareja de luna de miel. Cancelada a solicitud de la agencia por problemas de visado.",
    telefono: "+58 268 251 8899",
    email: "satelite@falcon.com.ve",
    agenciaName: "Turismo Satelital Falcon",
    createdAt: "2026-06-06",
    mercado: "NACIONAL",
    servicios: [
      {
        id: "SRV-06",
        tipo: ServiceType.ALOJAMIENTO,
        descripcion: "Sunset Marina Yacht & Beach Resort - 7 noches - 2 Pax",
        precioNeto: 1300,
        precioVenta: 1540,
        statusFacturacion: "Borrador"
      }
    ]
  }
];

export const initialFlights: FlightLeg[] = [
  {
    id: "FL-501",
    flightNo: "AA-942",
    airline: "American Airlines",
    departure: "MIA",
    arrival: "CUN",
    depTime: "10:30",
    arrTime: "12:15",
    terminal: "T3",
    status: "En Hora",
    seatsRemaining: 18,
    seatsTotal: 40
  },
  {
    id: "FL-502",
    flightNo: "DL-110",
    airline: "Delta Air Lines",
    departure: "ATL",
    arrival: "PUJ",
    depTime: "08:15",
    arrTime: "11:45",
    terminal: "T1",
    status: "En Hora",
    seatsRemaining: 5,
    seatsTotal: 25
  },
  {
    id: "FL-503",
    flightNo: "IB-3120",
    airline: "Iberia",
    departure: "CDG",
    arrival: "MAD",
    depTime: "14:00",
    arrTime: "16:05",
    terminal: "T4",
    status: "Aterrizado",
    seatsRemaining: 0,
    seatsTotal: 50
  },
  {
    id: "FL-504",
    flightNo: "AF-49",
    airline: "Air France",
    departure: "JFK",
    arrival: "CDG",
    depTime: "18:30",
    arrTime: "07:45 +1",
    terminal: "T2E",
    status: "Retrasado",
    seatsRemaining: 12,
    seatsTotal: 30
  },
  {
    id: "FL-505",
    flightNo: "LH-430",
    airline: "Lufthansa",
    departure: "FRA",
    arrival: "MCO",
    depTime: "13:20",
    arrTime: "17:50",
    terminal: "T1-Z",
    status: "En Hora",
    seatsRemaining: 32,
    seatsTotal: 60
  }
];

export const initialTransfers: TransferService[] = [
  {
    id: "TR-201",
    leadPassenger: "Alexander Pierce Group",
    paxCount: 4,
    pickupLocation: "Aeropuerto Int. de Cancún (CUN) — Terminal 3",
    dropoffLocation: "The Grand Plaza Luxury Resort & Spa",
    date: "2026-06-15",
    time: "13:00",
    provider: "Cancún Receptours S.A.",
    driverName: "Ramón Espinoza",
    driverId: "DRV-001",
    vehicleId: "VEH-002",
    reservationId: "RES-8892",
    flightRef: "AA-942",
    notes: "Pasajero VIP. Solicita agua mineral y toallas frías en vehículo.",
    status: "Asignado",
    vehicleType: "Minivan Ejecutiva"
  },
  {
    id: "TR-202",
    leadPassenger: "Jenkins Family Retreat",
    paxCount: 5,
    pickupLocation: "Aeropuerto Int. de Punta Cana (PUJ) — Llegadas",
    dropoffLocation: "Sunset Marina Yacht & Beach Resort",
    date: "2026-07-02",
    time: "12:30",
    provider: "Dominican Shuttle Direct",
    driverName: "Juan Carlos Gómez",
    driverId: "DRV-002",
    vehicleId: "VEH-003",
    reservationId: "RES-8891",
    flightRef: "DL-110",
    notes: "Familia con cuna de bebé. Confirmar silla de bebé en el vehículo.",
    status: "Asignado",
    vehicleType: "Chevrolet Suburban"
  },
  {
    id: "TR-203",
    leadPassenger: "Global Tech Summit VIP",
    paxCount: 1,
    pickupLocation: "Aeropuerto de Madrid Barajas (MAD) — T4S",
    dropoffLocation: "Metropolis High-Rise Business Hotel",
    date: "2026-06-25",
    time: "16:45",
    provider: "Madrid Premium Transfers",
    driverName: "Ángel Prado",
    driverId: "DRV-003",
    vehicleId: "VEH-001",
    reservationId: "RES-8890",
    flightRef: "IB-3120",
    notes: "Cartel con nombre en llegadas. Protocolo VIP corporativo.",
    status: "Completado",
    vehicleType: "Mercedes-Benz Clase S"
  },
  {
    id: "TR-204",
    leadPassenger: "Marcus Chen & Guest",
    paxCount: 2,
    pickupLocation: "Aeropuerto de Ginebra (GVA) — T1",
    dropoffLocation: "Aconca Alps Alpine Lodge & Spa",
    date: "2026-08-10",
    time: "09:00",
    provider: "Chamonix AlpyTransfers",
    driverName: undefined,
    driverId: undefined,
    vehicleId: undefined,
    reservationId: "RES-8889",
    flightRef: "AF-49",
    notes: "Ruta de montaña. Requiere vehículo 4x4 certificado. Pack romántico en hotel.",
    status: "No Asignado",
    vehicleType: "Mini Bus 4x4"
  },
  {
    id: "TR-205",
    leadPassenger: "Kovacs Tour Group",
    paxCount: 18,
    pickupLocation: "Aeropuerto Int. de Orlando (MCO) — Terminal B",
    dropoffLocation: "Family Paradise Aqua Club",
    date: "2026-06-18",
    time: "18:45",
    provider: "Orlando Magic Coach Lines",
    driverName: "Michael Thompson",
    driverId: "DRV-004",
    vehicleId: "VEH-005",
    reservationId: "RES-8888",
    flightRef: "LH-430",
    notes: "Grupo de 18 pax. 3 sillas de ruedas a confirmar. Menús sin gluten.",
    status: "En Ruta",
    vehicleType: "Autobús 24 plazas"
  },
  {
    id: "TR-206",
    leadPassenger: "Mendoza Honeymooners",
    paxCount: 2,
    pickupLocation: "Aeropuerto Int. de Punta Cana (PUJ)",
    dropoffLocation: "Sunset Marina Yacht & Beach Resort",
    date: "2026-06-20",
    time: "10:15",
    provider: "Dominican Shuttle Direct",
    driverName: undefined,
    driverId: undefined,
    vehicleId: undefined,
    reservationId: "RES-8887",
    flightRef: undefined,
    notes: "Luna de miel. Decoración de vehículo con flores y champagne.",
    status: "No Asignado",
    vehicleType: "Berlina Ejecutiva"
  }
];

export const initialInvoices: FinancialInvoice[] = [
  {
    id: "FAC-5032",
    clientName: "Viajes El Corte Inglés - Exp. AA9",
    date: "2026-06-01",
    dueDate: "2026-06-15",
    amount: 1715.00,
    vatAmount: 274.40,
    type: "Cobro",
    status: "Pagado"
  },
  {
    id: "FAC-5033",
    clientName: "B2B Travel Providers SL",
    date: "2026-06-02",
    dueDate: "2026-06-30",
    amount: 1295.00,
    vatAmount: 207.20,
    type: "Cobro",
    status: "Facturado"
  },
  {
    id: "FAC-5034",
    clientName: "Global Tech Summit Corp",
    date: "2026-06-04",
    dueDate: "2026-06-18",
    amount: 5040.00,
    vatAmount: 806.40,
    type: "Cobro",
    status: "Borrador"
  },
  {
    id: "PROV-112",
    clientName: "Plaza Hotels Wholesalers S.A.",
    date: "2026-06-01",
    dueDate: "2026-06-25",
    amount: 1450.00,
    vatAmount: 0.00,
    type: "Pago Proveedor",
    status: "Facturado"
  },
  {
    id: "PROV-113",
    clientName: "Occidental Blue Group Limitada",
    date: "2026-06-02",
    dueDate: "2026-06-20",
    amount: 1100.00,
    vatAmount: 0.00,
    type: "Pago Proveedor",
    status: "Pagado"
  },
  {
    id: "PROV-114",
    clientName: "Madrid Premium Transfers SL",
    date: "2026-06-05",
    dueDate: "2026-06-15",
    amount: 180.00,
    vatAmount: 18.00,
    type: "Pago Proveedor",
    status: "Vencido"
  }
];

export const initialClients: B2BClient[] = [
  {
    id: "CLI-001",
    nombre: "Viajes El Corte Inglés S.A.",
    rif: "ESG-12345678",
    tipo: ClientType.CREDITO,
    status: ClientStatus.ACTIVO,
    contactoNombre: "Carlos Gómez",
    email: "b2b.ventas@elcorteingles.es",
    telefono: "+34 91 401 2233",
    saldoFavor: 2500.00,
    saldoDeber: 15000.00,
    moroso: false,
    limiteCredito: 50000.00,
    diasCredito: 30,
    observaciones: "Cuenta corporativa preferente. Envío mensual de facturación consolidada."
  },
  {
    id: "CLI-002",
    nombre: "B2B Travel Providers SL",
    rif: "ESB-87654321",
    tipo: ClientType.SATELITE,
    status: ClientStatus.ACTIVO,
    contactoNombre: "Maria Schnyder",
    email: "bookings@b2btravelproviders.com",
    telefono: "+34 93 220 4455",
    saldoFavor: 0.00,
    saldoDeber: 8400.00,
    moroso: true,
    limiteCredito: 10000.00,
    diasCredito: 15,
    observaciones: "Alerta de morosidad: Factura FAC-5033 vencida desde hace 15 días."
  },
  {
    id: "CLI-003",
    nombre: "Margarita Island Tours C.A.",
    rif: "J-301234567",
    tipo: ClientType.FREELANCER,
    status: ClientStatus.ACTIVO,
    contactoNombre: "Pedro Rojas",
    email: "margarita.tours@gmail.com",
    telefono: "+58 295 262 4411",
    saldoFavor: 1200.00,
    saldoDeber: 0.00,
    moroso: false,
    limiteCredito: 0.00,
    diasCredito: 0,
    observaciones: "Operador independiente. Trabaja bajo modalidad prepago (tarjeta o transferencia)."
  },
  {
    id: "CLI-004",
    nombre: "Destinos Globales Freelance",
    rif: "J-409876543",
    tipo: ClientType.FREELANCER,
    status: ClientStatus.LISTA_NEGRA,
    contactoNombre: "Alejandro Silva",
    email: "silva.freelancer@destinos.com",
    telefono: "+58 412 334 5566",
    saldoFavor: 0.00,
    saldoDeber: 3400.00,
    moroso: true,
    limiteCredito: 0.00,
    diasCredito: 0,
    observaciones: "En lista negra por reiterados cheques devueltos e impagos en temporadas anteriores."
  },
  {
    id: "CLI-005",
    nombre: "Turismo Satelital Falcon",
    rif: "J-501234890",
    tipo: ClientType.SATELITE,
    status: ClientStatus.INACTIVO,
    contactoNombre: "Elena Ortega",
    email: "satelite@falcon.com.ve",
    telefono: "+58 268 251 8899",
    saldoFavor: 0.00,
    saldoDeber: 0.00,
    moroso: false,
    limiteCredito: 5000.00,
    diasCredito: 15,
    observaciones: "Cuenta temporalmente suspendida a solicitud del cliente por reestructuración interna."
  }
];

export const initialDetailedProperties: Property[] = [
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

export const initialRoomTypes: RoomType[] = [
  { id: "room-01", property_id: "prop-01", nombre: "Habitación Standard Doble", regimenAlimentacion: RegimenAlimentacion.DESAYUNO, capacidadMax: 2, ocupacionBase: 2 },
  { id: "room-02", property_id: "prop-01", nombre: "Suite Familiar de Lujo", regimenAlimentacion: RegimenAlimentacion.MEDIA_PENSION, capacidadMax: 4, ocupacionBase: 2 },
  { id: "room-01-b", property_id: "prop-01", nombre: "Habitación Triple Superior", regimenAlimentacion: RegimenAlimentacion.DESAYUNO, capacidadMax: 3, ocupacionBase: 3 },
  { id: "room-01-c", property_id: "prop-01", nombre: "Suite Junior Ejecutiva", regimenAlimentacion: RegimenAlimentacion.MEDIA_PENSION, capacidadMax: 2, ocupacionBase: 2 },
  { id: "room-01-d", property_id: "prop-01", nombre: "Habitación Cuádruple Standard", regimenAlimentacion: RegimenAlimentacion.DESAYUNO, capacidadMax: 4, ocupacionBase: 4 },
  
  { id: "room-03", property_id: "prop-02", nombre: "Superior Deluxe Vista al Campo", regimenAlimentacion: RegimenAlimentacion.DESAYUNO, capacidadMax: 3, ocupacionBase: 2 },
  { id: "room-03-b", property_id: "prop-02", nombre: "Suite Deluxe de Golf", regimenAlimentacion: RegimenAlimentacion.DESAYUNO, capacidadMax: 2, ocupacionBase: 2 },
  { id: "room-03-c", property_id: "prop-02", nombre: "Habitación Familiar Hesperia", regimenAlimentacion: RegimenAlimentacion.DESAYUNO, capacidadMax: 5, ocupacionBase: 4 },

  { id: "room-04", property_id: "prop-03", nombre: "Standard Familiar Todo Incluido", regimenAlimentacion: RegimenAlimentacion.TODO_INCLUIDO, capacidadMax: 5, ocupacionBase: 2 },
  { id: "room-04-b", property_id: "prop-03", nombre: "Premium Familiar Vista Piscina", regimenAlimentacion: RegimenAlimentacion.TODO_INCLUIDO, capacidadMax: 4, ocupacionBase: 2 },

  { id: "room-05", property_id: "prop-04", nombre: "Habitación Business Executive", regimenAlimentacion: RegimenAlimentacion.DESAYUNO, capacidadMax: 2, ocupacionBase: 1 },
  { id: "room-05-b", property_id: "prop-04", nombre: "Master Suite Corporativa", regimenAlimentacion: RegimenAlimentacion.DESAYUNO, capacidadMax: 3, ocupacionBase: 2 },

  { id: "room-06", property_id: "prop-05", nombre: "Cabaña Vista al Mar", regimenAlimentacion: RegimenAlimentacion.TODO_INCLUIDO, capacidadMax: 3, ocupacionBase: 2 },
  { id: "room-06-b", property_id: "prop-05", nombre: "Palafito Superior Sobre el Agua", regimenAlimentacion: RegimenAlimentacion.TODO_INCLUIDO, capacidadMax: 2, ocupacionBase: 2 }
];

export const initialRatePlans: RatePlan[] = [
  // Lidotel - Vacaciones de Verano (Nacional)
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
    id: "rate-01-b",
    property_id: "prop-01",
    roomType_id: "room-01-b",
    nombrePromocion: "Temporada de Vacaciones de Verano",
    fechaInicio: "2026-06-01",
    fechaFin: "2026-08-31",
    tipoCobro: TipoCobro.POR_HABITACION,
    tarifaBase: 160,
    tarifaExtraAdulto: 80,
    tarifaExtraNino: 40,
    politicasCancelacion: "Cancelación sin penalización hasta 5 días antes del ingreso.",
    mercado: "NACIONAL"
  },
  {
    id: "rate-01-c",
    property_id: "prop-01",
    roomType_id: "room-01-c",
    nombrePromocion: "Temporada de Vacaciones de Verano",
    fechaInicio: "2026-06-01",
    fechaFin: "2026-08-31",
    tipoCobro: TipoCobro.POR_HABITACION,
    tarifaBase: 200,
    tarifaExtraAdulto: 100,
    tarifaExtraNino: 50,
    politicasCancelacion: "Cancelación sin penalización hasta 5 días antes del ingreso.",
    mercado: "NACIONAL"
  },
  {
    id: "rate-01-d",
    property_id: "prop-01",
    roomType_id: "room-01-d",
    nombrePromocion: "Temporada de Vacaciones de Verano",
    fechaInicio: "2026-06-01",
    fechaFin: "2026-08-31",
    tipoCobro: TipoCobro.POR_HABITACION,
    tarifaBase: 180,
    tarifaExtraAdulto: 90,
    tarifaExtraNino: 45,
    politicasCancelacion: "Cancelación sin penalización hasta 5 días antes del ingreso.",
    mercado: "NACIONAL"
  },

  // Lidotel - Fin de Año (Internacional)
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
    id: "rate-02-b",
    property_id: "prop-01",
    roomType_id: "room-01-b",
    nombrePromocion: "Promoción Fin de Año Familiar",
    fechaInicio: "2026-11-15",
    fechaFin: "2026-12-31",
    tipoCobro: TipoCobro.POR_PERSONA,
    tarifaBase: 220,
    tarifaExtraAdulto: 100,
    tarifaExtraNino: 50,
    politicasCancelacion: "Tarifa no reembolsable.",
    mercado: "INTERNACIONAL"
  },

  // Hesperia - Tarifa Especial Golf (Nacional/Internacional)
  {
    id: "rate-03-hesperia-nac",
    property_id: "prop-02",
    roomType_id: "room-03",
    nombrePromocion: "Tarifa Especial B2B Golf",
    fechaInicio: "2026-06-01",
    fechaFin: "2026-12-31",
    tipoCobro: TipoCobro.POR_HABITACION,
    tarifaBase: 140,
    tarifaExtraAdulto: 70,
    tarifaExtraNino: 35,
    politicasCancelacion: "Modificación libre de cargos.",
    mercado: "NACIONAL"
  },
  {
    id: "rate-03-hesperia-nac-b",
    property_id: "prop-02",
    roomType_id: "room-03-b",
    nombrePromocion: "Tarifa Especial B2B Golf",
    fechaInicio: "2026-06-01",
    fechaFin: "2026-12-31",
    tipoCobro: TipoCobro.POR_HABITACION,
    tarifaBase: 180,
    tarifaExtraAdulto: 90,
    tarifaExtraNino: 45,
    politicasCancelacion: "Modificación libre de cargos.",
    mercado: "NACIONAL"
  },
  {
    id: "rate-03-hesperia-int",
    property_id: "prop-02",
    roomType_id: "room-03",
    nombrePromocion: "Tarifa Especial B2B Golf",
    fechaInicio: "2026-06-01",
    fechaFin: "2026-12-31",
    tipoCobro: TipoCobro.POR_HABITACION,
    tarifaBase: 160,
    tarifaExtraAdulto: 80,
    tarifaExtraNino: 40,
    politicasCancelacion: "Modificación libre de cargos.",
    mercado: "INTERNACIONAL"
  },

  // Dunes - Todo Incluido (Nacional)
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
  },
  {
    id: "rate-03-dunes-b",
    property_id: "prop-03",
    roomType_id: "room-04-b",
    nombrePromocion: "Promoción Todo Incluido Vacacional",
    fechaInicio: "2026-06-01",
    fechaFin: "2026-09-30",
    tipoCobro: TipoCobro.POR_PERSONA,
    tarifaBase: 110,
    tarifaExtraAdulto: 100,
    tarifaExtraNino: 50,
    politicasCancelacion: "Modificación permitida hasta 72 horas antes.",
    mercado: "NACIONAL"
  },

  // Eurobuilding - Corporativa Ejecutiva (Nacional)
  {
    id: "rate-eb-corp",
    property_id: "prop-04",
    roomType_id: "room-05",
    nombrePromocion: "Tarifa Corporativa Ejecutiva",
    fechaInicio: "2026-01-01",
    fechaFin: "2026-12-31",
    tipoCobro: TipoCobro.POR_HABITACION,
    tarifaBase: 130,
    tarifaExtraAdulto: 65,
    tarifaExtraNino: 0,
    politicasCancelacion: "Sin cargos hasta el mismo día a las 12:00.",
    mercado: "NACIONAL"
  },
  {
    id: "rate-eb-corp-b",
    property_id: "prop-04",
    roomType_id: "room-05-b",
    nombrePromocion: "Tarifa Corporativa Ejecutiva",
    fechaInicio: "2026-01-01",
    fechaFin: "2026-12-31",
    tipoCobro: TipoCobro.POR_HABITACION,
    tarifaBase: 190,
    tarifaExtraAdulto: 95,
    tarifaExtraNino: 0,
    politicasCancelacion: "Sin cargos hasta el mismo día a las 12:00.",
    mercado: "NACIONAL"
  },

  // Posada del Pirata - Aventura Los Roques (Nacional)
  {
    id: "rate-pirata-nac",
    property_id: "prop-05",
    roomType_id: "room-06",
    nombrePromocion: "Tarifa Aventura Los Roques",
    fechaInicio: "2026-05-01",
    fechaFin: "2026-11-30",
    tipoCobro: TipoCobro.POR_PERSONA,
    tarifaBase: 150,
    tarifaExtraAdulto: 120,
    tarifaExtraNino: 60,
    politicasCancelacion: "Pensión completa no reembolsable.",
    mercado: "NACIONAL"
  },
  {
    id: "rate-pirata-nac-b",
    property_id: "prop-05",
    roomType_id: "room-06-b",
    nombrePromocion: "Tarifa Aventura Los Roques",
    fechaInicio: "2026-05-01",
    fechaFin: "2026-11-30",
    tipoCobro: TipoCobro.POR_PERSONA,
    tarifaBase: 220,
    tarifaExtraAdulto: 180,
    tarifaExtraNino: 90,
    politicasCancelacion: "Pensión completa no reembolsable.",
    mercado: "NACIONAL"
  }
];

export const initialStopSales: StopSale[] = [
  { id: "stop-01", property_id: "prop-01", fechaInicio: "2026-10-01", fechaFin: "2026-10-15", motivo: "Mantenimiento preventivo anual de caldera principal" },
  { id: "stop-02", property_id: "prop-02", fechaInicio: "2026-09-05", fechaFin: "2026-09-20", motivo: "Bloqueo por evento corporativo internacional (Copa de Golf)" }
];

// ─── FLOTA DE VEHÍCULOS ────────────────────────────────────────────────────────
export const initialFleetVehicles: FleetVehicle[] = [
  {
    id: "VEH-001",
    placa: "MAD-9923-BZ",
    tipo: "Berlina Ejecutiva",
    marca: "Mercedes-Benz",
    modelo: "Clase S 450",
    capacidad: 3,
    proveedor: "Madrid Premium Transfers",
    status: "Disponible",
    observaciones: "Vehículo VIP blindado clase S. Solo servicios premium."
  },
  {
    id: "VEH-002",
    placa: "CUN-4412-MX",
    tipo: "Minivan Ejecutiva",
    marca: "Toyota",
    modelo: "HiAce LX",
    capacidad: 8,
    proveedor: "Cancún Receptours S.A.",
    status: "En Servicio",
    conductorAsignadoId: "DRV-001",
    observaciones: "Equipada con WiFi y climatización dual."
  },
  {
    id: "VEH-003",
    placa: "PUJ-7745-RD",
    tipo: "SUV Ejecutiva",
    marca: "Chevrolet",
    modelo: "Suburban Premier",
    capacidad: 7,
    proveedor: "Dominican Shuttle Direct",
    status: "En Servicio",
    conductorAsignadoId: "DRV-002",
    observaciones: "Silla de bebé disponible. Portaequipajes XL."
  },
  {
    id: "VEH-004",
    placa: "GVA-3310-CH",
    tipo: "Mini Bus 4x4",
    marca: "Mercedes-Benz",
    modelo: "Sprinter 4x4 HDX",
    capacidad: 12,
    proveedor: "Chamonix AlpyTransfers",
    status: "Disponible",
    observaciones: "Certificado para rutas de montaña y nieve. Cadenas incluidas."
  },
  {
    id: "VEH-005",
    placa: "MCO-8821-FL",
    tipo: "Autobús de Línea",
    marca: "Volvo",
    modelo: "B8R Coach 9900",
    capacidad: 52,
    proveedor: "Orlando Magic Coach Lines",
    status: "En Servicio",
    conductorAsignadoId: "DRV-004",
    observaciones: "Acceso para sillas de ruedas (rampa). WiFi a bordo. TV."
  },
  {
    id: "VEH-006",
    placa: "CCS-0091-VE",
    tipo: "Berlina Ejecutiva",
    marca: "Toyota",
    modelo: "Land Cruiser 200",
    capacidad: 5,
    proveedor: "Foratour Receptivo S.A.",
    status: "Disponible",
    observaciones: "Flota propia. Disponible para asignación inmediata."
  },
  {
    id: "VEH-007",
    placa: "BOG-5534-CO",
    tipo: "Van de Pasajeros",
    marca: "Ford",
    modelo: "Transit 350 XLT",
    capacidad: 15,
    proveedor: "Foratour Receptivo S.A.",
    status: "Mantenimiento",
    observaciones: "En taller por revisión de frenos. ETA retorno: 2026-06-12."
  }
];

// ─── CONDUCTORES / OPERADORES ─────────────────────────────────────────────────
export const initialFleetDrivers: FleetDriver[] = [
  {
    id: "DRV-001",
    nombre: "Ramón Espinoza Herrera",
    telefono: "+52 998 312 4455",
    licencia: "MX-E4-9923881",
    vehiculoAsignadoId: "VEH-002",
    status: "En Servicio",
    observaciones: "Conductor senior. Certificado en manejo defensivo y protocolo VIP."
  },
  {
    id: "DRV-002",
    nombre: "Juan Carlos Gómez Díaz",
    telefono: "+1 809 542 7766",
    licencia: "DO-B2-442112",
    vehiculoAsignadoId: "VEH-003",
    status: "En Servicio",
    observaciones: "Bilingüe español/inglés. Experiencia en grupos familiares."
  },
  {
    id: "DRV-003",
    nombre: "Ángel Prado Villanueva",
    telefono: "+34 91 660 1122",
    licencia: "ES-BTP-2019-4432",
    vehiculoAsignadoId: "VEH-001",
    status: "Disponible",
    observaciones: "Chofer de protocolo VIP. Acreditación aeropuerto T4-MAD."
  },
  {
    id: "DRV-004",
    nombre: "Michael Thompson",
    telefono: "+1 407 881 9933",
    licencia: "FL-CDL-A-339812",
    vehiculoAsignadoId: "VEH-005",
    status: "En Servicio",
    observaciones: "Licencia CDL Clase A. Certificado para autobuses de 52+ pax."
  },
  {
    id: "DRV-005",
    nombre: "Carlos Alberto Mendoza",
    telefono: "+58 414 201 9988",
    licencia: "VE-LIC-2021-5590",
    vehiculoAsignadoId: undefined,
    status: "Disponible",
    observaciones: "Conductor local. Conoce rutas Caracas-Maiquetía y Margarita."
  },
  {
    id: "DRV-006",
    nombre: "Sophie Beaumont",
    telefono: "+41 79 332 1144",
    licencia: "CH-CAT-B-881234",
    vehiculoAsignadoId: undefined,
    status: "Fuera de Turno",
    observaciones: "Conductora trilingüe (FR/EN/DE). Ruta Ginebra-Chamonix."
  }
];

export const initialPayableObligations: PayableObligation[] = [
  {
    id: "PAY-001",
    dueDate: "2026-06-25",
    providerName: "Lidotel Hoteles de Venezuela C.A.",
    serviceDetail: "Habitación Standard Doble - 7 Noches - Lidotel Margarita",
    locatorId: "RES-8892",
    netCost: 840.00,
    paidAmount: 840.00,
    status: "Pagado Total",
    date: "2026-06-01",
    paymentMethod: "Transferencia Bancaria",
    reference: "TR-PROV-882910",
    notes: "Factura completamente saldada al cierre de release.",
    currency: "USD"
  },
  {
    id: "PAY-002",
    dueDate: "2026-06-20",
    providerName: "Hesperia World Wholesalers S.A.",
    serviceDetail: "Superior Deluxe Vista al Campo - 7 Noches - Hesperia Margarita",
    locatorId: "RES-8891",
    netCost: 1100.00,
    paidAmount: 0.00,
    status: "Vencido",
    date: "2026-06-02",
    notes: "Pendiente liquidar neto. Proveedor solicita conciliación bancaria.",
    currency: "USD"
  },
  {
    id: "PAY-003",
    dueDate: "2026-06-15",
    providerName: "Madrid Premium Transfers SL",
    serviceDetail: "Traslados Privados Ejecutivos - Madrid Barajas ➔ Metropolis Hotel",
    locatorId: "RES-8890",
    netCost: 180.00,
    paidAmount: 180.00,
    status: "Pagado Total",
    date: "2026-06-05",
    paymentMethod: "Transferencia Bancaria",
    reference: "TR-PROV-882711",
    notes: "Saldado. Voucher de traslado emitido y despachado.",
    currency: "EUR"
  },
  {
    id: "PAY-004",
    dueDate: "2026-06-26",
    providerName: "Savoie Alpine Hospitality S.A.",
    serviceDetail: "Alpine Lodge Suite - 5 Noches - Aconca Alps Alpine Lodge & Spa",
    locatorId: "RES-8889",
    netCost: 1320.00,
    paidAmount: 500.00,
    status: "Pagado Parcial",
    date: "2026-06-05",
    paymentMethod: "Transferencia Bancaria",
    reference: "TR-PROV-998273",
    notes: "Abono inicial del 38% del costo neto.",
    currency: "USD"
  },
  {
    id: "PAY-005",
    dueDate: "2026-06-24",
    providerName: "Foratour Receptivo S.A.",
    serviceDetail: "Servicio Traslado Privado Grupal - 18 Pax Orlando MCO ➔ Family Paradise Club",
    locatorId: "RES-8888",
    netCost: 350.00,
    paidAmount: 0.00,
    status: "Pendiente",
    date: "2026-06-05",
    notes: "Liquidación a contra-factura de chofer local.",
    currency: "USD"
  },
  {
    id: "PAY-006",
    dueDate: "2026-06-28",
    providerName: "Disney Area Receptives Inc",
    serviceDetail: "Entradas Parques Disney + Traslados Internos - 7 Días - 18 Pax",
    locatorId: "RES-8888",
    netCost: 8100.00,
    paidAmount: 0.00,
    status: "Pendiente",
    date: "2026-06-05",
    notes: "Costo neto de bloqueos Disney Mayoristas.",
    currency: "USD"
  },
  {
    id: "PAY-007",
    dueDate: "2026-06-12",
    providerName: "American Airlines Inc.",
    serviceDetail: "Boletos Aéreos Emisión GDS - Tramo MIA-CUN - 4 Pax",
    locatorId: "RES-8892",
    netCost: 1450.00,
    paidAmount: 1450.00,
    status: "Pagado Total",
    date: "2026-06-01",
    paymentMethod: "Tarjeta de Crédito",
    reference: "CC-PROV-9901",
    notes: "Liquidación automática vía BSP IATA.",
    currency: "USD"
  }
];

export const initialProviderStatements: ProviderStatement[] = [
  {
    id: "DOC-901",
    providerName: "Hesperia World Wholesalers S.A.",
    date: "2026-06-02",
    type: "Factura Recibida",
    amount: 1100.00,
    reference: "FAC-HESP-9982",
    status: "Pendiente"
  },
  {
    id: "DOC-902",
    providerName: "Hesperia World Wholesalers S.A.",
    date: "2026-05-15",
    type: "Factura Recibida",
    amount: 2450.00,
    reference: "FAC-HESP-9011",
    status: "Saldado"
  },
  {
    id: "DOC-903",
    providerName: "Hesperia World Wholesalers S.A.",
    date: "2026-05-18",
    type: "Pago Emitido",
    amount: 2450.00,
    reference: "TR-PROV-872910",
    status: "Aplicado"
  },
  {
    id: "DOC-904",
    providerName: "Savoie Alpine Hospitality S.A.",
    date: "2026-06-05",
    type: "Factura Recibida",
    amount: 1320.00,
    reference: "FAC-SAV-1029",
    status: "Parcial"
  },
  {
    id: "DOC-905",
    providerName: "Savoie Alpine Hospitality S.A.",
    date: "2026-06-10",
    type: "Pago Emitido",
    amount: 500.00,
    reference: "TR-PROV-998273",
    status: "Aplicado"
  },
  {
    id: "DOC-906",
    providerName: "Foratour Receptivo S.A.",
    date: "2026-06-05",
    type: "Factura Recibida",
    amount: 350.00,
    reference: "FAC-FORA-2291",
    status: "Pendiente"
  },
  {
    id: "DOC-907",
    providerName: "Foratour Receptivo S.A.",
    date: "2026-05-20",
    type: "Factura Recibida",
    amount: 480.00,
    reference: "FAC-FORA-2104",
    status: "Saldado"
  },
  {
    id: "DOC-908",
    providerName: "Foratour Receptivo S.A.",
    date: "2026-05-22",
    type: "Pago Emitido",
    amount: 480.00,
    reference: "TR-PROV-882739",
    status: "Aplicado"
  }
];

