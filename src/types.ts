export enum ProjectView {
  PROPIEDADES = "propiedades",
  RESERVAS = "reservas",
  VUELOS = "vuelos",
  OPERACIONES = "operaciones",
  ADMINISTRACION = "administracion",
  CLIENTES = "clientes",
  FACTURACION = "facturacion",
  COBRANZAS = "cobranzas",
  CUENTAS_PAGAR = "cuentaspagar",
  SERVICIOS_VARIOS = "servicios_varios",
  BUSCADOR = "buscador",
  CONFIGURACION = "configuracion"
}

export interface CompanyConfig {
  name: string;
  subtitle: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  logoLetter: string;
}

export interface HotelProperty {
  updatedAt?: string;
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
  updatedAt?: string;
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
  comprobanteArchivo?: string;
  facturacionTipo?: "Crédito" | "Pago Contado";
  facturacionRechazoMotivo?: string;
  facturacionRechazoArchivos?: string; // JSON string array of URLs
  variaciones?: FinancialVariation[];
}

export interface FlightLeg {
  updatedAt?: string;
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

export type TransferDirection = 'IN' | 'OUT' | 'INTERHOTEL' | 'DISPO';

export interface TransferService {
  updatedAt?: string;
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
  direction?: TransferDirection;
  legIndex?: number; // 1 = primer leg (IN), 2 = segundo leg de un RT (OUT)
  tipoTraslado?: 'Privado' | 'Compartido';
  telefono?: string;
}

export interface OperationalTransfer {
  updatedAt?: string;
  id: string;
  reservationId: string;
  direction: TransferDirection;
  fechaHora: Date;
  origen: string;
  destino: string;
  paxCount: number;
  pasajeroPrincipal: string;
  datosVuelo?: string;
  conductorId?: string | null;
  vehiculoId?: string | null;
  status: 'Sin Asignar' | 'Asignado' | 'En Ruta' | 'Completado' | 'Cancelado';
  
  // Metadatos para preservación sin pérdida
  vehicleType?: string;
  provider?: string;
  notes?: string;
  legIndex?: number;
  driverName?: string;
  tipoTraslado?: 'Privado' | 'Compartido';
  telefonoPax?: string;
}

export function mapToOperationalTransfer(ts: TransferService): OperationalTransfer {
  const dateStr = ts.date || new Date().toISOString().split('T')[0];
  const timeStr = ts.time || '00:00';
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const fechaHora = new Date(
    isNaN(year) ? new Date().getFullYear() : year,
    isNaN(month) ? new Date().getMonth() : month - 1,
    isNaN(day) ? new Date().getDate() : day,
    isNaN(hours) ? 0 : hours,
    isNaN(minutes) ? 0 : minutes
  );

  return {
    id: ts.id,
    reservationId: ts.reservationId || "",
    direction: (ts.direction as TransferDirection) || 'IN',
    fechaHora,
    origen: ts.pickupLocation,
    destino: ts.dropoffLocation,
    paxCount: ts.paxCount,
    pasajeroPrincipal: ts.leadPassenger,
    datosVuelo: ts.flightRef || undefined,
    conductorId: ts.driverId || null,
    vehiculoId: ts.vehicleId || null,
    status: ts.status === 'No Asignado' ? 'Sin Asignar' : (ts.status as any),
    vehicleType: ts.vehicleType,
    provider: ts.provider,
    notes: ts.notes || undefined,
    legIndex: ts.legIndex || undefined,
    driverName: ts.driverName || undefined,
    tipoTraslado: (ts.tipoTraslado as 'Privado' | 'Compartido') || undefined,
    telefonoPax: ts.telefono
  };
}

export function mapToTransferService(ot: OperationalTransfer): TransferService {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const date = `${ot.fechaHora.getFullYear()}-${pad(ot.fechaHora.getMonth() + 1)}-${pad(ot.fechaHora.getDate())}`;
  const time = `${pad(ot.fechaHora.getHours())}:${pad(ot.fechaHora.getMinutes())}`;

  return {
    id: ot.id,
    leadPassenger: ot.pasajeroPrincipal,
    paxCount: ot.paxCount,
    pickupLocation: ot.origen,
    dropoffLocation: ot.destino,
    date,
    time,
    provider: ot.provider || "Foratour Receptivo S.A.",
    driverName: ot.driverName || undefined,
    driverId: ot.conductorId || undefined,
    vehicleId: ot.vehiculoId || undefined,
    reservationId: ot.reservationId || undefined,
    flightRef: ot.datosVuelo || undefined,
    notes: ot.notes || undefined,
    status: ot.status === 'Sin Asignar' ? 'No Asignado' : (ot.status as any),
    vehicleType: ot.vehicleType || "Berlina Ejecutiva",
    direction: ot.direction,
    legIndex: ot.legIndex,
    tipoTraslado: ot.tipoTraslado || undefined,
    telefono: ot.telefonoPax
  };
}

export interface FinancialInvoice {
  updatedAt?: string;
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
  updatedAt?: string;
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
  AEREO = "Boleto Aéreo",
  TRASLADO = "Traslado",
  RENT_A_CAR = "Rent a Car",
  SEGURO = "Seguro de Viaje",
  MANUAL = "Entrada Manual",
  SERVICIO_VARIO = "Servicio Vario"
}


export interface ServiceItem {
  updatedAt?: string;
  id: string;
  tipo: ServiceType;
  descripcion: string;
  precioNeto: number;
  precioVenta: number;
  precioPvp?: number;
  comisionB2B?: number;
  proveedor?: string;
  detalles?: any;
  statusFacturacion?: "Borrador" | "Solicitado" | "Facturado" | "Rechazado";
  status?: "Confirmado" | "Modificado" | "Cancelado";
  originalPriceNet?: number;
  originalPriceSale?: number;
}

export interface PaymentVoucher {
  updatedAt?: string;
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
  updatedAt?: string;
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
  updatedAt?: string;
  id: string;
  nombre: string;
  telefono: string;
  licencia: string;       // número de licencia
  vehiculoAsignadoId?: string;
  status: FleetDriverStatus;
  observaciones?: string;
}

// ─── MÓDULO CUENTAS POR PAGAR (TESORERÍA) ────────────────────────────────────

export interface SupplierPaymentRecord {
  paymentId: string;
  amount: number;
  date: string;
  bankReference: string;
}

export interface PayableObligation {
  updatedAt?: string;
  id: string;
  dueDate: string;
  providerName: string;
  serviceDetail: string;
  locatorId: string;
  netCost: number;
  paidAmount: number;
  status: "Pendiente" | "Vencido" | "Pagado Parcial" | "Pagado Total" | "Congelado";
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  date?: string;
  currency?: string;
  attachedFile?: string;
  isFrozen?: boolean;
  payments?: SupplierPaymentRecord[];
}

export interface ProviderStatement {
  updatedAt?: string;
  id: string;
  providerName: string;
  date: string;
  type: "Factura Recibida" | "Pago Emitido";
  amount: number;
  reference: string;
  status: string;
}

export interface FinancialVariation {
  id: string;
  reservationId: string;
  serviceItemId?: string;
  type: "Suplemento" | "Credito" | "Penalidad";
  amountNet: number;
  amountSale: number;
  reason: string;
  date: string;
  invoiceId?: string;
}

export interface B2BWalletTransaction {
  id: string;
  clientId: string;
  reservationId: string;
  type: "Abono_Cancelacion" | "Abono_Sobrepago" | "Cargo_Pago" | "Reembolso_Caja";
  amount: number;
  status: "Disponible" | "Reembolsado" | "Reservado" | "Auditoria_Pendiente";
  notes: string;
  createdAt: string;
  bankReference?: string;
}

