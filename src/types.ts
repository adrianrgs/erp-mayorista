export enum ProjectView {
  PROPIEDADES = "propiedades",
  RESERVAS = "reservas",
  VUELOS = "vuelos",
  OPERACIONES = "operaciones",
  ADMINISTRACION = "administracion",
  CLIENTES = "clientes",
  FACTURACION = "facturacion",
  COBRANZAS = "cobranzas",
  CUENTAS_PAGAR = "cuentaspagar"
}

export interface HotelProperty {
  id: string;
  name: string;
  destination: string;
  category: "Playa" | "Montaña" | "Ciudad" | "Familiar";
  image: string;
  baseRate: number;
  occupancy: number;
  roomsCount: number;
  stars: number;
  amenities: string[];
  allotment: number;
  supplierName: string;
}

export interface Reservation {
  id: string;
  holder: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  pax: number;
  status: "Confirmada" | "Pendiente de Pago" | "Modificada" | "Cancelada" | "Petición Especial";
  totalPrice: number;
  netPrice: number;
  specialRequests?: string;
  flightNo?: string;
  telefono?: string;
  email?: string;
  agenciaName?: string;
  createdAt?: string; // YYYY-MM-DD
  mercado?: "NACIONAL" | "INTERNACIONAL";
  servicios?: ServiceItem[];
  tipo?: "Cotización" | "Reserva Real";
  comprobanteRef?: string;
  comprobanteMonto?: number;
  comprobanteMetodo?: string;
  facturacionTipo?: "Crédito" | "Pago Contado";
}

export interface FlightLeg {
  id: string;
  flightNo: string;
  airline: string;
  departure: string;
  arrival: string;
  depTime: string;
  arrTime: string;
  terminal: string;
  status: "En Hora" | "Retrasado" | "Aterrizado" | "Cancelado";
  seatsRemaining: number;
  seatsTotal: number;
}

export interface TransferService {
  id: string;
  leadPassenger: string;
  paxCount: number;
  pickupLocation: string;
  dropoffLocation: string;
  date: string;
  time: string;
  provider: string;
  driverName?: string;
  driverId?: string;
  vehicleId?: string;
  reservationId?: string;
  flightRef?: string;
  notes?: string;
  status: "No Asignado" | "Asignado" | "En Ruta" | "Completado" | "Cancelado";
  vehicleType: string;
}

export interface FinancialInvoice {
  id: string;
  clientName: string;
  date: string;
  dueDate: string;
  amount: number;
  vatAmount: number;
  type: "Cobro" | "Pago Proveedor";
  status: "Facturado" | "Pagado" | "Vencido" | "Borrador";
}

export enum ClientType {
  CREDITO = "A Crédito",
  SATELITE = "Satélite",
  FREELANCER = "Freelancer"
}

export enum ClientStatus {
  ACTIVO = "Activo",
  INACTIVO = "Inactivo",
  LISTA_NEGRA = "Lista Negra"
}

export interface B2BClient {
  id: string;
  nombre: string;
  rif: string; // ID Fiscal
  tipo: ClientType;
  status: ClientStatus;
  contactoNombre: string;
  email: string;
  telefono: string;
  saldoFavor: number;
  saldoDeber: number;
  moroso: boolean;
  limiteCredito?: number;
  diasCredito?: number;
  observaciones?: string;
}

export enum ServiceType {
  ALOJAMIENTO = "Alojamiento",
  TRASLADO = "Traslado",
  RENT_A_CAR = "Rent a Car",
  SEGURO = "Seguro de Viaje",
  MANUAL = "Entrada Manual"
}

export interface ServiceItem {
  id: string;
  tipo: ServiceType;
  descripcion: string;
  precioNeto: number;
  precioVenta: number;
  precioPvp?: number;
  comisionB2B?: number;
  detalles?: any;
  statusFacturacion?: "Borrador" | "Solicitado" | "Facturado" | "Rechazado";
}

export interface PaymentVoucher {
  id: string;
  clientId: string;
  clientName: string;
  invoiceId?: string;
  locatorId?: string;
  method: string;
  reference: string;
  amount: number;
  date: string;
  status: "Pendiente" | "Verificado" | "Rechazado";
  bankName?: string;
  notes?: string;
  attachedFile?: string;
}

// ─── MÓDULO OPS. RECEPTIVO: GESTIÓN DE FLOTA ─────────────────────────────────

export type FleetVehicleStatus = "Disponible" | "En Servicio" | "Mantenimiento" | "Reservado";
export type FleetDriverStatus = "Disponible" | "En Servicio" | "Fuera de Turno";

export interface FleetVehicle {
  id: string;
  placa: string;
  tipo: string;           // "Berlina Ejecutiva", "Minivan", "Autobús", etc.
  marca: string;
  modelo: string;
  capacidad: number;      // plazas máximas
  proveedor: string;      // empresa propietaria / DMC contratada
  status: FleetVehicleStatus;
  conductorAsignadoId?: string;
  observaciones?: string;
}

export interface FleetDriver {
  id: string;
  nombre: string;
  telefono: string;
  licencia: string;       // número de licencia
  vehiculoAsignadoId?: string;
  status: FleetDriverStatus;
  observaciones?: string;
}

// ─── MÓDULO CUENTAS POR PAGAR (TESORERÍA) ────────────────────────────────────

export interface PayableObligation {
  id: string;
  dueDate: string;
  providerName: string;
  serviceDetail: string;
  locatorId: string;
  netCost: number;
  paidAmount: number;
  status: "Pendiente" | "Vencido" | "Pagado Parcial" | "Pagado Total";
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  date?: string;
  currency?: string;
}

export interface ProviderStatement {
  id: string;
  providerName: string;
  date: string;
  type: "Factura Recibida" | "Pago Emitido";
  amount: number;
  reference: string;
  status: string;
}

