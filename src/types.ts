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
  CONFIGURACION = "configuracion",
  PROVEEDORES = "proveedores",
  CONTABILIDAD = "contabilidad"
}

export interface CompanyConfig {
  name: string;
  subtitle: string;
  tagline?: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  logoLetter: string;
  /** Moneda de operación mayorista (por defecto "USD"). Lo fiscal local se deriva por tipo de cambio. */
  currency?: string;
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

export type PassengerType = "Adulto" | "Niño" | "Infante";

export interface ReservationPassenger {
  id: string;
  nombre: string;
  tipo: PassengerType;
  esTitular?: boolean; // exactamente uno debería tener esto en true
}

export interface Reservation {
  updatedAt?: string;
  id: string;
  holder: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  pax: number;
  status: "Confirmada" | "Pendiente" | "Pendiente de Pago" | "Modificada" | "Cancelada" | "Petición Especial";
  totalPrice: number;
  netPrice: number;
  specialRequests?: string;
  flightNo?: string;
  telefono?: string;
  email?: string;
  agenciaName?: string;
  // Undefined is treated as "B2B" (all historical reservations). "Directo" means no B2B
  // agency involved: Comisión B2B is forced to 0% when adding services, and the shareable
  // document ("Formato B2B") renders a client-facing variant with no agency or commission wording.
  canalVenta?: "B2B" | "Directo";
  // FK a DirectClient.id, poblado solo cuando canalVenta === "Directo" (seleccionado o creado
  // desde el buscador de cliente directo en Reservas).
  clienteDirectoId?: string;
  // Localizador/ID propio de otro mayorista cuando este expediente fue comprado a través de él.
  localizadorProveedor?: string;
  createdAt?: string; // YYYY-MM-DD
  mercado?: "NACIONAL" | "INTERNACIONAL";
  servicios?: ServiceItem[];
  pasajeros?: ReservationPassenger[];
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
  // true = lo opera la propia agencia (mayorista), false = subcontratado a un proveedor
  // tercero. undefined = registro histórico previo a este campo, tratado como propio ya que
  // antes de esto el proveedor siempre se guardaba fijo como el nombre de la propia agencia.
  esOperacionPropia?: boolean;
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
  esOperacionPropia?: boolean;
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
    telefonoPax: ts.telefono,
    esOperacionPropia: ts.esOperacionPropia
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
    telefono: ot.telefonoPax,
    esOperacionPropia: ot.esOperacionPropia
  };
}

export interface FinancialInvoice {
  updatedAt?: string;
  id: string;
  clientName: string;
  clientId?: string;
  reservationId?: string;
  date: string;
  dueDate: string;
  amount: number;
  vatAmount: number;
  type: "Cobro" | "Pago Proveedor";
  status: "Facturado" | "Pagado" | "Vencido" | "Borrador";
  // Fiscal fields (multi-country)
  taxableBase?: number;
  surchargeAmount?: number;
  vatWithheld?: number;
  incomeTaxWithheld?: number;
  exchangeRate?: number;
  localCurrencyAmount?: number;
  fiscalDocNumber?: string;
  isExempt?: boolean;
  paymentMethod?: string;
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
  rif: string; // Tax ID (RIF, NIT, RUC, etc. — label from jurisdiction)
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
  // Fiscal profile (multi-country)
  isWithheldClient?: boolean;
  vatWithholdingPct?: number;
  incomeTaxWithholdingPct?: number;
  isInExemptZone?: boolean;
}

export enum DirectClientTipo {
  // Mismo literal que ClientType.CREDITO a propósito: permite un único check
  // `client.tipo === "A Crédito"` que funciona para B2BClient y DirectClient sin
  // un tipo base compartido ni guards por sitio (ver src/lib/clientResolver.ts).
  CREDITO = "A Crédito",
  CONTADO = "Contado"
}

// Cliente directo (venta al consumidor final, sin agencia B2B intermediaria).
// Deliberadamente no comparte forma con B2BClient: es una persona natural, no una
// empresa — sin rif obligatorio, sin contactoNombre, sin campos de retención fiscal.
export interface DirectClient {
  updatedAt?: string;
  id: string;
  nombre: string;
  cedula?: string; // opcional, a diferencia del rif obligatorio de B2B
  tipo: DirectClientTipo;
  status: ClientStatus;
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
  // Link opcional al catálogo de Proveedores cuando el texto de `proveedor` matchea uno
  // existente — puramente informativo/trazabilidad, Cuentas por Pagar sigue resolviendo por
  // el nombre en `proveedor`, no por este id.
  proveedorId?: string;
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

export interface PayableObligation {
  updatedAt?: string;
  id: string;
  dueDate: string;
  providerName: string;
  serviceDetail: string;
  locatorId: string;
  netCost: number;
  paidAmount: number;
  status: "Pendiente" | "Vencido" | "Pagado Parcial" | "Pagado Total" | "Congelado" | "Anulado";
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  date?: string;
  currency?: string;
  attachedFile?: string;
  isFrozen?: boolean;
  // Campos fiscales de proveedor
  isExempt?: boolean;       // proveedor exento de IVA → no genera retención
  vatAmount?: number;       // IVA en la factura del proveedor
  vatWithheldPct?: number;  // % de retención aplicado
  vatWithheld?: number;     // monto retenido (a pagar a autoridad fiscal)
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
  // Gates visibility in Facturación behind an explicit "Enviar a Facturación" action from Reservas,
  // mirroring the Borrador→Solicitado flow for ServiceItem. Applies to "Suplemento" and to "Credito"
  // variations sourced from a price modification (not from a cancellation/annulment, which apply
  // their balance effect immediately and never get a status).
  status?: "Borrador" | "Solicitado";
  // Only meaningful for "Credito": when the client overpaid relative to the reduced total AND the
  // provider for that service was already paid, the excess is NOT credited to saldoFavor right away
  // — it's parked here until someone confirms (in Facturación) whether the provider will actually
  // refund it. Cleared once resolved (accepted or discarded).
  excessPendingVerification?: number;
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

// ─── MÓDULO CONTABILIDAD Y FISCAL (MULTI-PAÍS) ───────────────────────────────

export interface ExchangeRate {
  updatedAt?: string;
  id: string;
  date: string;           // YYYY-MM-DD
  fromCurrency: string;   // "USD"
  toCurrency: string;     // "VES" | "COP" | "PEN" | ...
  rate: number;
  source: string;         // "BCV" | "TRM" | "SBS" | "Manual"
}

export interface WithholdingCertificate {
  updatedAt?: string;
  id: string;
  number: string;         // certificate number from client
  clientId: string;
  clientTaxId: string;    // RIF / NIT / RUC per jurisdiction
  clientName: string;
  type: "VAT" | "INCOME_TAX";
  percentage: number;
  taxableBase: number;
  amountWithheld: number;
  date: string;           // YYYY-MM-DD
  period: string;         // MM-YYYY
  invoiceId?: string;
}

export interface JournalEntryLine {
  account: string;   // "1101"
  name: string;      // "Bank / Cash"
  debit: number;
  credit: number;
}

export interface JournalEntry {
  updatedAt?: string;
  id: string;
  date: string;
  description: string;
  type: "DEPOSIT" | "INCOME_RECOGNITION" | "SUPPLIER_PAYMENT" | "WITHHOLDING";
  reference: string;  // invoice or reservation ID
  exchangeRate: number;
  lines: JournalEntryLine[];
}

