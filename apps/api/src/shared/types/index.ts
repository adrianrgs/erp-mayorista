// Tipos del dominio — espejo de src/types.ts del frontend
// Fuente de verdad compartida entre frontend y backend

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
  category: 'Playa' | 'Montaña' | 'Ciudad' | 'Familiar';
  image: string;
  baseRate: number;
  occupancy: number;
  roomsCount: number;
  stars: number;
  amenities: string[];
  allotment: number;
  supplierName: string;
}

export type ReservationStatus =
  | 'Confirmada'
  | 'Pendiente de Pago'
  | 'Modificada'
  | 'Cancelada'
  | 'Petición Especial';

export interface Reservation {
  updatedAt?: string;
  id: string;
  holder: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  pax: number;
  status: ReservationStatus;
  totalPrice: number;
  netPrice: number;
  specialRequests?: string;
  flightNo?: string;
  telefono?: string;
  email?: string;
  agenciaName?: string;
  createdAt?: string;
  mercado?: 'NACIONAL' | 'INTERNACIONAL';
  servicios?: ServiceItem[];
  tipo?: 'Cotización' | 'Reserva Real';
  comprobanteRef?: string;
  comprobanteMonto?: number;
  comprobanteMetodo?: string;
  comprobanteArchivo?: string;
  facturacionTipo?: 'Crédito' | 'Pago Contado';
  facturacionRechazoMotivo?: string;
  facturacionRechazoArchivos?: string;
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
  status: 'En Hora' | 'Retrasado' | 'Aterrizado' | 'Cancelado';
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
  status: 'No Asignado' | 'Asignado' | 'En Ruta' | 'Completado' | 'Cancelado';
  vehicleType: string;
  direction?: TransferDirection;
  legIndex?: number;
  tipoTraslado?: 'Privado' | 'Compartido';
  telefono?: string;
}

export interface FinancialInvoice {
  updatedAt?: string;
  id: string;
  clientName: string;
  date: string;
  dueDate: string;
  amount: number;
  vatAmount: number;
  type: 'Cobro' | 'Pago Proveedor';
  status: 'Facturado' | 'Pagado' | 'Vencido' | 'Borrador';
}

export type ClientType = 'A Crédito' | 'Satélite' | 'Freelancer';
export type ClientStatus = 'Activo' | 'Inactivo' | 'Lista Negra';

export interface B2BClient {
  updatedAt?: string;
  id: string;
  nombre: string;
  rif: string;
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

export type ServiceType =
  | 'Alojamiento'
  | 'Boleto Aéreo'
  | 'Traslado'
  | 'Rent a Car'
  | 'Seguro de Viaje'
  | 'Entrada Manual'
  | 'Servicio Vario';

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
  statusFacturacion?: 'Borrador' | 'Solicitado' | 'Facturado' | 'Rechazado';
  status?: 'Confirmado' | 'Modificado' | 'Cancelado';
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
  status: 'Pendiente' | 'Verificado' | 'Rechazado';
  bankName?: string;
  notes?: string;
  attachedFile?: string;
}

export type FleetVehicleStatus = 'Disponible' | 'En Servicio' | 'Mantenimiento' | 'Reservado';
export type FleetDriverStatus = 'Disponible' | 'En Servicio' | 'Fuera de Turno';

export interface FleetVehicle {
  updatedAt?: string;
  id: string;
  placa: string;
  tipo: string;
  marca: string;
  modelo: string;
  capacidad: number;
  proveedor: string;
  status: FleetVehicleStatus;
  conductorAsignadoId?: string;
  observaciones?: string;
}

export interface FleetDriver {
  updatedAt?: string;
  id: string;
  nombre: string;
  telefono: string;
  licencia: string;
  vehiculoAsignadoId?: string;
  status: FleetDriverStatus;
  observaciones?: string;
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
  status: 'Pendiente' | 'Vencido' | 'Pagado Parcial' | 'Pagado Total' | 'Congelado';
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  date?: string;
  currency?: string;
  attachedFile?: string;
  isFrozen?: boolean;
}

export interface ProviderStatement {
  updatedAt?: string;
  id: string;
  providerName: string;
  date: string;
  type: 'Factura Recibida' | 'Pago Emitido';
  amount: number;
  reference: string;
  status: string;
}

export interface FinancialVariation {
  id: string;
  reservationId: string;
  serviceItemId?: string;
  type: 'Suplemento' | 'Credito' | 'Penalidad';
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
  type: 'Abono_Cancelacion' | 'Abono_Sobrepago' | 'Cargo_Pago' | 'Reembolso_Caja';
  amount: number;
  status: 'Disponible' | 'Reembolsado' | 'Reservado' | 'Auditoria_Pendiente';
  notes: string;
  createdAt: string;
  bankReference?: string;
}
