import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface B2BClient_Key {
  id: string;
  __typename?: 'B2BClient_Key';
}

export interface DeleteClientData {
  b2BClient_delete?: B2BClient_Key | null;
}

export interface DeleteClientVariables {
  id: string;
}

export interface DeleteDetailedPropertyData {
  detailedProperty_delete?: DetailedProperty_Key | null;
}

export interface DeleteDetailedPropertyVariables {
  id: string;
}

export interface DeleteExtraServiceData {
  extraService_delete?: ExtraService_Key | null;
}

export interface DeleteExtraServiceVariables {
  id: string;
}

export interface DeleteFleetDriverData {
  fleetDriver_delete?: FleetDriver_Key | null;
}

export interface DeleteFleetDriverVariables {
  id: string;
}

export interface DeleteFleetVehicleData {
  fleetVehicle_delete?: FleetVehicle_Key | null;
}

export interface DeleteFleetVehicleVariables {
  id: string;
}

export interface DeleteFlightTicketData {
  flightTicket_delete?: FlightTicket_Key | null;
}

export interface DeleteFlightTicketVariables {
  id: string;
}

export interface DeleteInvoiceData {
  financialInvoice_delete?: FinancialInvoice_Key | null;
}

export interface DeleteInvoiceVariables {
  id: string;
}

export interface DeletePayableObligationData {
  payableObligation_delete?: PayableObligation_Key | null;
}

export interface DeletePayableObligationVariables {
  id: string;
}

export interface DeletePaymentVoucherData {
  paymentVoucher_delete?: PaymentVoucher_Key | null;
}

export interface DeletePaymentVoucherVariables {
  id: string;
}

export interface DeleteProviderStatementData {
  providerStatement_delete?: ProviderStatement_Key | null;
}

export interface DeleteProviderStatementVariables {
  id: string;
}

export interface DeleteRatePlanData {
  ratePlan_delete?: RatePlan_Key | null;
}

export interface DeleteRatePlanVariables {
  id: string;
}

export interface DeleteReservationData {
  reservation_delete?: Reservation_Key | null;
}

export interface DeleteReservationVariables {
  id: string;
}

export interface DeleteRoomTypeData {
  roomType_delete?: RoomType_Key | null;
}

export interface DeleteRoomTypeVariables {
  id: string;
}

export interface DeleteServiceRateData {
  serviceRate_delete?: ServiceRate_Key | null;
}

export interface DeleteServiceRateVariables {
  id: string;
}

export interface DeleteStopSaleData {
  stopSale_delete?: StopSale_Key | null;
}

export interface DeleteStopSaleVariables {
  id: string;
}

export interface DeleteTransferServiceData {
  transferService_delete?: TransferService_Key | null;
}

export interface DeleteTransferServiceVariables {
  id: string;
}

export interface DetailedProperty_Key {
  id: string;
  __typename?: 'DetailedProperty_Key';
}

export interface ExtraService_Key {
  id: string;
  __typename?: 'ExtraService_Key';
}

export interface FinancialInvoice_Key {
  id: string;
  __typename?: 'FinancialInvoice_Key';
}

export interface FleetDriver_Key {
  id: string;
  __typename?: 'FleetDriver_Key';
}

export interface FleetVehicle_Key {
  id: string;
  __typename?: 'FleetVehicle_Key';
}

export interface FlightLeg_Key {
  id: string;
  __typename?: 'FlightLeg_Key';
}

export interface FlightTicket_Key {
  id: string;
  __typename?: 'FlightTicket_Key';
}

export interface HotelProperty_Key {
  id: string;
  __typename?: 'HotelProperty_Key';
}

export interface InsertClientData {
  b2BClient_insert: B2BClient_Key;
}

export interface InsertClientVariables {
  id: string;
  nombre: string;
  rif: string;
  tipo: string;
  status: string;
  contactoNombre: string;
  email: string;
  telefono: string;
  saldoFavor: number;
  saldoDeber: number;
  moroso: boolean;
  limiteCredito?: number | null;
  diasCredito?: number | null;
  observaciones?: string | null;
  updatedAt?: string | null;
}

export interface InsertDetailedPropertyData {
  detailedProperty_insert: DetailedProperty_Key;
}

export interface InsertDetailedPropertyVariables {
  id: string;
  nombre: string;
  pais: string;
  estado: string;
  ciudad: string;
  categoria: number;
  status: string;
  politicasGenerales: string;
  imagen?: string | null;
  supplierName?: string | null;
  updatedAt?: string | null;
}

export interface InsertExtraServiceData {
  extraService_insert: ExtraService_Key;
}

export interface InsertExtraServiceVariables {
  id: string;
  nombre: string;
  providerName: string;
  category: string;
  ubicacion: string;
  descripcion: string;
  politicasCancelacion: string;
  status: string;
  updatedAt?: string | null;
}

export interface InsertFleetDriverData {
  fleetDriver_insert: FleetDriver_Key;
}

export interface InsertFleetDriverVariables {
  id: string;
  nombre: string;
  telefono: string;
  licencia: string;
  vehiculoAsignadoId?: string | null;
  status: string;
  observaciones?: string | null;
  updatedAt?: string | null;
}

export interface InsertFleetVehicleData {
  fleetVehicle_insert: FleetVehicle_Key;
}

export interface InsertFleetVehicleVariables {
  id: string;
  placa: string;
  tipo: string;
  marca: string;
  modelo: string;
  capacidad: number;
  proveedor: string;
  status: string;
  conductorAsignadoId?: string | null;
  observaciones?: string | null;
  updatedAt?: string | null;
}

export interface InsertFlightTicketData {
  flightTicket_insert: FlightTicket_Key;
}

export interface InsertFlightTicketVariables {
  id: string;
  pnr: string;
  pasajeros: unknown;
  segmentos: unknown;
  costoNeto: number;
  precioVenta: number;
  precioPvp?: number | null;
  comisionB2B?: number | null;
  comisionMayorista?: number | null;
  tipoComision?: string | null;
  fee?: number | null;
  vinculadoAExpediente: boolean;
  facturarConjunto?: boolean | null;
  expedienteId?: string | null;
  agenteNombre?: string | null;
  createdAt?: string | null;
  ticketNumero?: string | null;
  aerolineaValidadora?: string | null;
  notas?: string | null;
  expedienteAereo?: unknown | null;
  updatedAt?: string | null;
}

export interface InsertInvoiceData {
  financialInvoice_insert: FinancialInvoice_Key;
}

export interface InsertInvoiceVariables {
  id: string;
  clientName: string;
  date: string;
  dueDate: string;
  amount: number;
  vatAmount: number;
  type: string;
  status: string;
  updatedAt?: string | null;
}

export interface InsertPayableObligationData {
  payableObligation_insert: PayableObligation_Key;
}

export interface InsertPayableObligationVariables {
  id: string;
  dueDate: string;
  providerName: string;
  serviceDetail: string;
  locatorId: string;
  netCost: number;
  paidAmount: number;
  status: string;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
  date?: string | null;
  currency?: string | null;
  attachedFile?: string | null;
  updatedAt?: string | null;
}

export interface InsertPaymentVoucherData {
  paymentVoucher_insert: PaymentVoucher_Key;
}

export interface InsertPaymentVoucherVariables {
  id: string;
  clientId: string;
  clientName: string;
  invoiceId?: string | null;
  locatorId?: string | null;
  method: string;
  reference: string;
  amount: number;
  date: string;
  status: string;
  bankName?: string | null;
  notes?: string | null;
  attachedFile?: string | null;
}

export interface InsertProviderStatementData {
  providerStatement_insert: ProviderStatement_Key;
}

export interface InsertProviderStatementVariables {
  id: string;
  providerName: string;
  date: string;
  type: string;
  amount: number;
  reference: string;
  status: string;
  updatedAt?: string | null;
}

export interface InsertRatePlanData {
  ratePlan_insert: RatePlan_Key;
}

export interface InsertRatePlanVariables {
  id: string;
  propertyId: string;
  roomTypeId: string;
  nombrePromocion: string;
  fechaInicio: string;
  fechaFin: string;
  tipoCobro: string;
  tarifaBase: number;
  tarifaExtraAdulto: number;
  tarifaExtraNino: number;
  politicasCancelacion: string;
  mercado: string;
  updatedAt?: string | null;
}

export interface InsertReservationData {
  reservation_insert: Reservation_Key;
}

export interface InsertReservationVariables {
  id: string;
  holder: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  pax: number;
  status: string;
  totalPrice: number;
  netPrice: number;
  agenciaName?: string | null;
  tipo?: string | null;
  servicios?: unknown | null;
  telefono?: string | null;
  email?: string | null;
  flightNo?: string | null;
  specialRequests?: string | null;
  mercado?: string | null;
  createdAt?: string | null;
  comprobanteRef?: string | null;
  comprobanteMonto?: number | null;
  comprobanteMetodo?: string | null;
  facturacionTipo?: string | null;
  facturacionRechazoMotivo?: string | null;
  facturacionRechazoArchivos?: string | null;
  variaciones?: unknown | null;
  updatedAt?: string | null;
}

export interface InsertRoomTypeData {
  roomType_insert: RoomType_Key;
}

export interface InsertRoomTypeVariables {
  id: string;
  propertyId: string;
  nombre: string;
  regimenAlimentacion: string;
  capacidadMax: number;
  ocupacionBase?: number | null;
  updatedAt?: string | null;
}

export interface InsertServiceRateData {
  serviceRate_insert: ServiceRate_Key;
}

export interface InsertServiceRateVariables {
  id: string;
  extraServiceId: string;
  temporadaInicio: string;
  temporadaFin: string;
  pricingModel: string;
  netoAdulto?: number | null;
  ventaAdulto?: number | null;
  netoNino?: number | null;
  ventaNino?: number | null;
  capacidadMaxima?: number | null;
  netoTotal?: number | null;
  ventaTotal?: number | null;
  updatedAt?: string | null;
}

export interface InsertStopSaleData {
  stopSale_insert: StopSale_Key;
}

export interface InsertStopSaleVariables {
  id: string;
  propertyId: string;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string | null;
  updatedAt?: string | null;
}

export interface InsertTransferServiceData {
  transferService_insert: TransferService_Key;
}

export interface InsertTransferServiceVariables {
  id: string;
  leadPassenger: string;
  paxCount: number;
  pickupLocation: string;
  dropoffLocation: string;
  date: string;
  time: string;
  provider: string;
  driverName?: string | null;
  driverId?: string | null;
  vehicleId?: string | null;
  reservationId?: string | null;
  flightRef?: string | null;
  notes?: string | null;
  status: string;
  vehicleType: string;
  direction?: string | null;
  legIndex?: number | null;
  tipoTraslado?: string | null;
  telefono?: string | null;
  updatedAt?: string | null;
}

export interface ListClientsData {
  b2BClients: ({
    id: string;
    updatedAt?: string | null;
    nombre: string;
    rif: string;
    tipo: string;
    status: string;
    contactoNombre: string;
    email: string;
    telefono: string;
    saldoFavor: number;
    saldoDeber: number;
    moroso: boolean;
    limiteCredito?: number | null;
    diasCredito?: number | null;
    observaciones?: string | null;
  } & B2BClient_Key)[];
}

export interface ListDetailedPropertiesData {
  detailedProperties: ({
    id: string;
    updatedAt?: string | null;
    nombre: string;
    pais: string;
    estado: string;
    ciudad: string;
    categoria: number;
    status: string;
    politicasGenerales: string;
    imagen?: string | null;
    supplierName?: string | null;
  } & DetailedProperty_Key)[];
}

export interface ListExtraServicesData {
  extraServices: ({
    id: string;
    updatedAt?: string | null;
    nombre: string;
    providerName: string;
    category: string;
    ubicacion: string;
    descripcion: string;
    politicasCancelacion: string;
    status: string;
  } & ExtraService_Key)[];
}

export interface ListFleetDriversData {
  fleetDrivers: ({
    id: string;
    updatedAt?: string | null;
    nombre: string;
    telefono: string;
    licencia: string;
    vehiculoAsignadoId?: string | null;
    status: string;
    observaciones?: string | null;
  } & FleetDriver_Key)[];
}

export interface ListFleetVehiclesData {
  fleetVehicles: ({
    id: string;
    updatedAt?: string | null;
    placa: string;
    tipo: string;
    marca: string;
    modelo: string;
    capacidad: number;
    proveedor: string;
    status: string;
    conductorAsignadoId?: string | null;
    observaciones?: string | null;
  } & FleetVehicle_Key)[];
}

export interface ListFlightTicketsData {
  flightTickets: ({
    id: string;
    updatedAt?: string | null;
    pnr: string;
    pasajeros: unknown;
    segmentos: unknown;
    costoNeto: number;
    precioVenta: number;
    precioPvp?: number | null;
    comisionB2B?: number | null;
    comisionMayorista?: number | null;
    tipoComision?: string | null;
    fee?: number | null;
    vinculadoAExpediente: boolean;
    facturarConjunto?: boolean | null;
    expedienteId?: string | null;
    agenteNombre?: string | null;
    createdAt?: string | null;
    ticketNumero?: string | null;
    aerolineaValidadora?: string | null;
    notas?: string | null;
    expedienteAereo?: unknown | null;
  } & FlightTicket_Key)[];
}

export interface ListInvoicesData {
  financialInvoices: ({
    id: string;
    updatedAt?: string | null;
    clientName: string;
    date: string;
    dueDate: string;
    amount: number;
    vatAmount: number;
    type: string;
    status: string;
  } & FinancialInvoice_Key)[];
}

export interface ListPayableObligationsData {
  payableObligations: ({
    id: string;
    updatedAt?: string | null;
    dueDate: string;
    providerName: string;
    serviceDetail: string;
    locatorId: string;
    netCost: number;
    paidAmount: number;
    status: string;
    paymentMethod?: string | null;
    reference?: string | null;
    notes?: string | null;
    date?: string | null;
    currency?: string | null;
    attachedFile?: string | null;
  } & PayableObligation_Key)[];
}

export interface ListPaymentVouchersData {
  paymentVouchers: ({
    id: string;
    clientId: string;
    clientName: string;
    invoiceId?: string | null;
    locatorId?: string | null;
    method: string;
    reference: string;
    amount: number;
    date: string;
    status: string;
    bankName?: string | null;
    notes?: string | null;
    attachedFile?: string | null;
  } & PaymentVoucher_Key)[];
}

export interface ListPropertiesData {
  hotelProperties: ({
    id: string;
    updatedAt?: string | null;
    name: string;
    destination: string;
    category: string;
    image: string;
    baseRate: number;
    occupancy: number;
    roomsCount: number;
    stars: number;
    allotment: number;
    supplierName: string;
  } & HotelProperty_Key)[];
}

export interface ListProviderStatementsData {
  providerStatements: ({
    id: string;
    updatedAt?: string | null;
    providerName: string;
    date: string;
    type: string;
    amount: number;
    reference: string;
    status: string;
  } & ProviderStatement_Key)[];
}

export interface ListRatePlansData {
  ratePlans: ({
    id: string;
    updatedAt?: string | null;
    propertyId: string;
    roomTypeId: string;
    nombrePromocion: string;
    fechaInicio: string;
    fechaFin: string;
    tipoCobro: string;
    tarifaBase: number;
    tarifaExtraAdulto: number;
    tarifaExtraNino: number;
    politicasCancelacion: string;
    mercado: string;
  } & RatePlan_Key)[];
}

export interface ListReservationsData {
  reservations: ({
    id: string;
    updatedAt?: string | null;
    holder: string;
    hotelName: string;
    checkIn: string;
    checkOut: string;
    pax: number;
    status: string;
    totalPrice: number;
    netPrice: number;
    agenciaName?: string | null;
    tipo?: string | null;
    servicios?: unknown | null;
    telefono?: string | null;
    email?: string | null;
    flightNo?: string | null;
    specialRequests?: string | null;
    mercado?: string | null;
    createdAt?: string | null;
    comprobanteRef?: string | null;
    comprobanteMonto?: number | null;
    comprobanteMetodo?: string | null;
    facturacionTipo?: string | null;
    facturacionRechazoMotivo?: string | null;
    facturacionRechazoArchivos?: string | null;
    variaciones?: unknown | null;
  } & Reservation_Key)[];
}

export interface ListRoomTypesData {
  roomTypes: ({
    id: string;
    updatedAt?: string | null;
    propertyId: string;
    nombre: string;
    regimenAlimentacion: string;
    capacidadMax: number;
    ocupacionBase?: number | null;
  } & RoomType_Key)[];
}

export interface ListServiceRatesData {
  serviceRates: ({
    id: string;
    updatedAt?: string | null;
    extraServiceId: string;
    temporadaInicio: string;
    temporadaFin: string;
    pricingModel: string;
    netoAdulto?: number | null;
    ventaAdulto?: number | null;
    netoNino?: number | null;
    ventaNino?: number | null;
    capacidadMaxima?: number | null;
    netoTotal?: number | null;
    ventaTotal?: number | null;
  } & ServiceRate_Key)[];
}

export interface ListStopSalesData {
  stopSales: ({
    id: string;
    updatedAt?: string | null;
    propertyId: string;
    fechaInicio: string;
    fechaFin: string;
    motivo?: string | null;
  } & StopSale_Key)[];
}

export interface ListTransferServicesData {
  transferServices: ({
    id: string;
    updatedAt?: string | null;
    leadPassenger: string;
    paxCount: number;
    pickupLocation: string;
    dropoffLocation: string;
    date: string;
    time: string;
    provider: string;
    driverName?: string | null;
    driverId?: string | null;
    vehicleId?: string | null;
    reservationId?: string | null;
    flightRef?: string | null;
    notes?: string | null;
    status: string;
    vehicleType: string;
    direction?: string | null;
    legIndex?: number | null;
    tipoTraslado?: string | null;
    telefono?: string | null;
  } & TransferService_Key)[];
}

export interface PayableObligation_Key {
  id: string;
  __typename?: 'PayableObligation_Key';
}

export interface PaymentVoucher_Key {
  id: string;
  __typename?: 'PaymentVoucher_Key';
}

export interface ProviderStatement_Key {
  id: string;
  __typename?: 'ProviderStatement_Key';
}

export interface RatePlan_Key {
  id: string;
  __typename?: 'RatePlan_Key';
}

export interface Reservation_Key {
  id: string;
  __typename?: 'Reservation_Key';
}

export interface RoomType_Key {
  id: string;
  __typename?: 'RoomType_Key';
}

export interface ServiceRate_Key {
  id: string;
  __typename?: 'ServiceRate_Key';
}

export interface StopSale_Key {
  id: string;
  __typename?: 'StopSale_Key';
}

export interface TransferService_Key {
  id: string;
  __typename?: 'TransferService_Key';
}

export interface UpdateClientData {
  b2BClient_update?: B2BClient_Key | null;
}

export interface UpdateClientVariables {
  id: string;
  saldoFavor?: number | null;
  saldoDeber?: number | null;
  status?: string | null;
  moroso?: boolean | null;
  updatedAt?: string | null;
}

export interface UpdateDetailedPropertyData {
  detailedProperty_update?: DetailedProperty_Key | null;
}

export interface UpdateDetailedPropertyVariables {
  id: string;
  nombre?: string | null;
  pais?: string | null;
  estado?: string | null;
  ciudad?: string | null;
  categoria?: number | null;
  status?: string | null;
  politicasGenerales?: string | null;
  imagen?: string | null;
  supplierName?: string | null;
  updatedAt?: string | null;
}

export interface UpdateExtraServiceData {
  extraService_update?: ExtraService_Key | null;
}

export interface UpdateExtraServiceVariables {
  id: string;
  nombre?: string | null;
  providerName?: string | null;
  category?: string | null;
  ubicacion?: string | null;
  descripcion?: string | null;
  politicasCancelacion?: string | null;
  status?: string | null;
  updatedAt?: string | null;
}

export interface UpdateFleetDriverData {
  fleetDriver_update?: FleetDriver_Key | null;
}

export interface UpdateFleetDriverVariables {
  id: string;
  nombre?: string | null;
  telefono?: string | null;
  licencia?: string | null;
  vehiculoAsignadoId?: string | null;
  status?: string | null;
  observaciones?: string | null;
  updatedAt?: string | null;
}

export interface UpdateFleetVehicleData {
  fleetVehicle_update?: FleetVehicle_Key | null;
}

export interface UpdateFleetVehicleVariables {
  id: string;
  placa?: string | null;
  tipo?: string | null;
  marca?: string | null;
  modelo?: string | null;
  capacidad?: number | null;
  proveedor?: string | null;
  status?: string | null;
  conductorAsignadoId?: string | null;
  observaciones?: string | null;
  updatedAt?: string | null;
}

export interface UpdateFlightTicketData {
  flightTicket_update?: FlightTicket_Key | null;
}

export interface UpdateFlightTicketVariables {
  id: string;
  pnr?: string | null;
  pasajeros?: unknown | null;
  segmentos?: unknown | null;
  costoNeto?: number | null;
  precioVenta?: number | null;
  precioPvp?: number | null;
  comisionB2B?: number | null;
  comisionMayorista?: number | null;
  tipoComision?: string | null;
  fee?: number | null;
  vinculadoAExpediente?: boolean | null;
  facturarConjunto?: boolean | null;
  expedienteId?: string | null;
  agenteNombre?: string | null;
  createdAt?: string | null;
  ticketNumero?: string | null;
  aerolineaValidadora?: string | null;
  notas?: string | null;
  expedienteAereo?: unknown | null;
  updatedAt?: string | null;
}

export interface UpdateInvoiceData {
  financialInvoice_update?: FinancialInvoice_Key | null;
}

export interface UpdateInvoiceVariables {
  id: string;
  amount?: number | null;
  vatAmount?: number | null;
  status?: string | null;
  updatedAt?: string | null;
}

export interface UpdatePayableObligationData {
  payableObligation_update?: PayableObligation_Key | null;
}

export interface UpdatePayableObligationVariables {
  id: string;
  dueDate?: string | null;
  providerName?: string | null;
  serviceDetail?: string | null;
  locatorId?: string | null;
  netCost?: number | null;
  paidAmount?: number | null;
  status?: string | null;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
  date?: string | null;
  currency?: string | null;
  attachedFile?: string | null;
  updatedAt?: string | null;
}

export interface UpdatePaymentVoucherData {
  paymentVoucher_update?: PaymentVoucher_Key | null;
}

export interface UpdatePaymentVoucherVariables {
  id: string;
  status: string;
}

export interface UpdateRatePlanData {
  ratePlan_update?: RatePlan_Key | null;
}

export interface UpdateRatePlanVariables {
  id: string;
  propertyId?: string | null;
  roomTypeId?: string | null;
  nombrePromocion?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  tipoCobro?: string | null;
  tarifaBase?: number | null;
  tarifaExtraAdulto?: number | null;
  tarifaExtraNino?: number | null;
  politicasCancelacion?: string | null;
  mercado?: string | null;
  updatedAt?: string | null;
}

export interface UpdateReservationData {
  reservation_update?: Reservation_Key | null;
}

export interface UpdateReservationStatusData {
  reservation_update?: Reservation_Key | null;
}

export interface UpdateReservationStatusVariables {
  id: string;
  status: string;
  updatedAt?: string | null;
}

export interface UpdateReservationVariables {
  id: string;
  holder?: string | null;
  hotelName?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  pax?: number | null;
  status?: string | null;
  totalPrice?: number | null;
  netPrice?: number | null;
  agenciaName?: string | null;
  tipo?: string | null;
  servicios?: unknown | null;
  telefono?: string | null;
  email?: string | null;
  flightNo?: string | null;
  specialRequests?: string | null;
  mercado?: string | null;
  createdAt?: string | null;
  comprobanteRef?: string | null;
  comprobanteMonto?: number | null;
  comprobanteMetodo?: string | null;
  facturacionTipo?: string | null;
  facturacionRechazoMotivo?: string | null;
  facturacionRechazoArchivos?: string | null;
  variaciones?: unknown | null;
  updatedAt?: string | null;
}

export interface UpdateRoomTypeData {
  roomType_update?: RoomType_Key | null;
}

export interface UpdateRoomTypeVariables {
  id: string;
  propertyId?: string | null;
  nombre?: string | null;
  regimenAlimentacion?: string | null;
  capacidadMax?: number | null;
  ocupacionBase?: number | null;
  updatedAt?: string | null;
}

export interface UpdateServiceRateData {
  serviceRate_update?: ServiceRate_Key | null;
}

export interface UpdateServiceRateVariables {
  id: string;
  temporadaInicio?: string | null;
  temporadaFin?: string | null;
  pricingModel?: string | null;
  netoAdulto?: number | null;
  ventaAdulto?: number | null;
  netoNino?: number | null;
  ventaNino?: number | null;
  capacidadMaxima?: number | null;
  netoTotal?: number | null;
  ventaTotal?: number | null;
  updatedAt?: string | null;
}

export interface UpdateStopSaleData {
  stopSale_update?: StopSale_Key | null;
}

export interface UpdateStopSaleVariables {
  id: string;
  propertyId?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  motivo?: string | null;
  updatedAt?: string | null;
}

export interface UpdateTransferServiceData {
  transferService_update?: TransferService_Key | null;
}

export interface UpdateTransferServiceVariables {
  id: string;
  leadPassenger?: string | null;
  paxCount?: number | null;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  date?: string | null;
  time?: string | null;
  provider?: string | null;
  driverName?: string | null;
  driverId?: string | null;
  vehicleId?: string | null;
  reservationId?: string | null;
  flightRef?: string | null;
  notes?: string | null;
  status?: string | null;
  vehicleType?: string | null;
  direction?: string | null;
  legIndex?: number | null;
  tipoTraslado?: string | null;
  telefono?: string | null;
  updatedAt?: string | null;
}

interface ListPaymentVouchersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPaymentVouchersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPaymentVouchersData, undefined>;
  operationName: string;
}
export const listPaymentVouchersRef: ListPaymentVouchersRef;

export function listPaymentVouchers(options?: ExecuteQueryOptions): QueryPromise<ListPaymentVouchersData, undefined>;
export function listPaymentVouchers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPaymentVouchersData, undefined>;

interface InsertPaymentVoucherRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertPaymentVoucherVariables): MutationRef<InsertPaymentVoucherData, InsertPaymentVoucherVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertPaymentVoucherVariables): MutationRef<InsertPaymentVoucherData, InsertPaymentVoucherVariables>;
  operationName: string;
}
export const insertPaymentVoucherRef: InsertPaymentVoucherRef;

export function insertPaymentVoucher(vars: InsertPaymentVoucherVariables): MutationPromise<InsertPaymentVoucherData, InsertPaymentVoucherVariables>;
export function insertPaymentVoucher(dc: DataConnect, vars: InsertPaymentVoucherVariables): MutationPromise<InsertPaymentVoucherData, InsertPaymentVoucherVariables>;

interface UpdatePaymentVoucherRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePaymentVoucherVariables): MutationRef<UpdatePaymentVoucherData, UpdatePaymentVoucherVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdatePaymentVoucherVariables): MutationRef<UpdatePaymentVoucherData, UpdatePaymentVoucherVariables>;
  operationName: string;
}
export const updatePaymentVoucherRef: UpdatePaymentVoucherRef;

export function updatePaymentVoucher(vars: UpdatePaymentVoucherVariables): MutationPromise<UpdatePaymentVoucherData, UpdatePaymentVoucherVariables>;
export function updatePaymentVoucher(dc: DataConnect, vars: UpdatePaymentVoucherVariables): MutationPromise<UpdatePaymentVoucherData, UpdatePaymentVoucherVariables>;

interface InsertReservationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertReservationVariables): MutationRef<InsertReservationData, InsertReservationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertReservationVariables): MutationRef<InsertReservationData, InsertReservationVariables>;
  operationName: string;
}
export const insertReservationRef: InsertReservationRef;

export function insertReservation(vars: InsertReservationVariables): MutationPromise<InsertReservationData, InsertReservationVariables>;
export function insertReservation(dc: DataConnect, vars: InsertReservationVariables): MutationPromise<InsertReservationData, InsertReservationVariables>;

interface UpdateReservationStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateReservationStatusVariables): MutationRef<UpdateReservationStatusData, UpdateReservationStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateReservationStatusVariables): MutationRef<UpdateReservationStatusData, UpdateReservationStatusVariables>;
  operationName: string;
}
export const updateReservationStatusRef: UpdateReservationStatusRef;

export function updateReservationStatus(vars: UpdateReservationStatusVariables): MutationPromise<UpdateReservationStatusData, UpdateReservationStatusVariables>;
export function updateReservationStatus(dc: DataConnect, vars: UpdateReservationStatusVariables): MutationPromise<UpdateReservationStatusData, UpdateReservationStatusVariables>;

interface UpdateReservationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateReservationVariables): MutationRef<UpdateReservationData, UpdateReservationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateReservationVariables): MutationRef<UpdateReservationData, UpdateReservationVariables>;
  operationName: string;
}
export const updateReservationRef: UpdateReservationRef;

export function updateReservation(vars: UpdateReservationVariables): MutationPromise<UpdateReservationData, UpdateReservationVariables>;
export function updateReservation(dc: DataConnect, vars: UpdateReservationVariables): MutationPromise<UpdateReservationData, UpdateReservationVariables>;

interface InsertClientRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertClientVariables): MutationRef<InsertClientData, InsertClientVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertClientVariables): MutationRef<InsertClientData, InsertClientVariables>;
  operationName: string;
}
export const insertClientRef: InsertClientRef;

export function insertClient(vars: InsertClientVariables): MutationPromise<InsertClientData, InsertClientVariables>;
export function insertClient(dc: DataConnect, vars: InsertClientVariables): MutationPromise<InsertClientData, InsertClientVariables>;

interface InsertInvoiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertInvoiceVariables): MutationRef<InsertInvoiceData, InsertInvoiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertInvoiceVariables): MutationRef<InsertInvoiceData, InsertInvoiceVariables>;
  operationName: string;
}
export const insertInvoiceRef: InsertInvoiceRef;

export function insertInvoice(vars: InsertInvoiceVariables): MutationPromise<InsertInvoiceData, InsertInvoiceVariables>;
export function insertInvoice(dc: DataConnect, vars: InsertInvoiceVariables): MutationPromise<InsertInvoiceData, InsertInvoiceVariables>;

interface InsertDetailedPropertyRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertDetailedPropertyVariables): MutationRef<InsertDetailedPropertyData, InsertDetailedPropertyVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertDetailedPropertyVariables): MutationRef<InsertDetailedPropertyData, InsertDetailedPropertyVariables>;
  operationName: string;
}
export const insertDetailedPropertyRef: InsertDetailedPropertyRef;

export function insertDetailedProperty(vars: InsertDetailedPropertyVariables): MutationPromise<InsertDetailedPropertyData, InsertDetailedPropertyVariables>;
export function insertDetailedProperty(dc: DataConnect, vars: InsertDetailedPropertyVariables): MutationPromise<InsertDetailedPropertyData, InsertDetailedPropertyVariables>;

interface UpdateDetailedPropertyRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDetailedPropertyVariables): MutationRef<UpdateDetailedPropertyData, UpdateDetailedPropertyVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateDetailedPropertyVariables): MutationRef<UpdateDetailedPropertyData, UpdateDetailedPropertyVariables>;
  operationName: string;
}
export const updateDetailedPropertyRef: UpdateDetailedPropertyRef;

export function updateDetailedProperty(vars: UpdateDetailedPropertyVariables): MutationPromise<UpdateDetailedPropertyData, UpdateDetailedPropertyVariables>;
export function updateDetailedProperty(dc: DataConnect, vars: UpdateDetailedPropertyVariables): MutationPromise<UpdateDetailedPropertyData, UpdateDetailedPropertyVariables>;

interface InsertRoomTypeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertRoomTypeVariables): MutationRef<InsertRoomTypeData, InsertRoomTypeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertRoomTypeVariables): MutationRef<InsertRoomTypeData, InsertRoomTypeVariables>;
  operationName: string;
}
export const insertRoomTypeRef: InsertRoomTypeRef;

export function insertRoomType(vars: InsertRoomTypeVariables): MutationPromise<InsertRoomTypeData, InsertRoomTypeVariables>;
export function insertRoomType(dc: DataConnect, vars: InsertRoomTypeVariables): MutationPromise<InsertRoomTypeData, InsertRoomTypeVariables>;

interface UpdateRoomTypeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRoomTypeVariables): MutationRef<UpdateRoomTypeData, UpdateRoomTypeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateRoomTypeVariables): MutationRef<UpdateRoomTypeData, UpdateRoomTypeVariables>;
  operationName: string;
}
export const updateRoomTypeRef: UpdateRoomTypeRef;

export function updateRoomType(vars: UpdateRoomTypeVariables): MutationPromise<UpdateRoomTypeData, UpdateRoomTypeVariables>;
export function updateRoomType(dc: DataConnect, vars: UpdateRoomTypeVariables): MutationPromise<UpdateRoomTypeData, UpdateRoomTypeVariables>;

interface InsertRatePlanRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertRatePlanVariables): MutationRef<InsertRatePlanData, InsertRatePlanVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertRatePlanVariables): MutationRef<InsertRatePlanData, InsertRatePlanVariables>;
  operationName: string;
}
export const insertRatePlanRef: InsertRatePlanRef;

export function insertRatePlan(vars: InsertRatePlanVariables): MutationPromise<InsertRatePlanData, InsertRatePlanVariables>;
export function insertRatePlan(dc: DataConnect, vars: InsertRatePlanVariables): MutationPromise<InsertRatePlanData, InsertRatePlanVariables>;

interface UpdateRatePlanRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRatePlanVariables): MutationRef<UpdateRatePlanData, UpdateRatePlanVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateRatePlanVariables): MutationRef<UpdateRatePlanData, UpdateRatePlanVariables>;
  operationName: string;
}
export const updateRatePlanRef: UpdateRatePlanRef;

export function updateRatePlan(vars: UpdateRatePlanVariables): MutationPromise<UpdateRatePlanData, UpdateRatePlanVariables>;
export function updateRatePlan(dc: DataConnect, vars: UpdateRatePlanVariables): MutationPromise<UpdateRatePlanData, UpdateRatePlanVariables>;

interface InsertStopSaleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertStopSaleVariables): MutationRef<InsertStopSaleData, InsertStopSaleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertStopSaleVariables): MutationRef<InsertStopSaleData, InsertStopSaleVariables>;
  operationName: string;
}
export const insertStopSaleRef: InsertStopSaleRef;

export function insertStopSale(vars: InsertStopSaleVariables): MutationPromise<InsertStopSaleData, InsertStopSaleVariables>;
export function insertStopSale(dc: DataConnect, vars: InsertStopSaleVariables): MutationPromise<InsertStopSaleData, InsertStopSaleVariables>;

interface UpdateStopSaleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateStopSaleVariables): MutationRef<UpdateStopSaleData, UpdateStopSaleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateStopSaleVariables): MutationRef<UpdateStopSaleData, UpdateStopSaleVariables>;
  operationName: string;
}
export const updateStopSaleRef: UpdateStopSaleRef;

export function updateStopSale(vars: UpdateStopSaleVariables): MutationPromise<UpdateStopSaleData, UpdateStopSaleVariables>;
export function updateStopSale(dc: DataConnect, vars: UpdateStopSaleVariables): MutationPromise<UpdateStopSaleData, UpdateStopSaleVariables>;

interface InsertFlightTicketRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertFlightTicketVariables): MutationRef<InsertFlightTicketData, InsertFlightTicketVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertFlightTicketVariables): MutationRef<InsertFlightTicketData, InsertFlightTicketVariables>;
  operationName: string;
}
export const insertFlightTicketRef: InsertFlightTicketRef;

export function insertFlightTicket(vars: InsertFlightTicketVariables): MutationPromise<InsertFlightTicketData, InsertFlightTicketVariables>;
export function insertFlightTicket(dc: DataConnect, vars: InsertFlightTicketVariables): MutationPromise<InsertFlightTicketData, InsertFlightTicketVariables>;

interface UpdateFlightTicketRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateFlightTicketVariables): MutationRef<UpdateFlightTicketData, UpdateFlightTicketVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateFlightTicketVariables): MutationRef<UpdateFlightTicketData, UpdateFlightTicketVariables>;
  operationName: string;
}
export const updateFlightTicketRef: UpdateFlightTicketRef;

export function updateFlightTicket(vars: UpdateFlightTicketVariables): MutationPromise<UpdateFlightTicketData, UpdateFlightTicketVariables>;
export function updateFlightTicket(dc: DataConnect, vars: UpdateFlightTicketVariables): MutationPromise<UpdateFlightTicketData, UpdateFlightTicketVariables>;

interface DeleteFlightTicketRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteFlightTicketVariables): MutationRef<DeleteFlightTicketData, DeleteFlightTicketVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteFlightTicketVariables): MutationRef<DeleteFlightTicketData, DeleteFlightTicketVariables>;
  operationName: string;
}
export const deleteFlightTicketRef: DeleteFlightTicketRef;

export function deleteFlightTicket(vars: DeleteFlightTicketVariables): MutationPromise<DeleteFlightTicketData, DeleteFlightTicketVariables>;
export function deleteFlightTicket(dc: DataConnect, vars: DeleteFlightTicketVariables): MutationPromise<DeleteFlightTicketData, DeleteFlightTicketVariables>;

interface InsertTransferServiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertTransferServiceVariables): MutationRef<InsertTransferServiceData, InsertTransferServiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertTransferServiceVariables): MutationRef<InsertTransferServiceData, InsertTransferServiceVariables>;
  operationName: string;
}
export const insertTransferServiceRef: InsertTransferServiceRef;

export function insertTransferService(vars: InsertTransferServiceVariables): MutationPromise<InsertTransferServiceData, InsertTransferServiceVariables>;
export function insertTransferService(dc: DataConnect, vars: InsertTransferServiceVariables): MutationPromise<InsertTransferServiceData, InsertTransferServiceVariables>;

interface UpdateTransferServiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTransferServiceVariables): MutationRef<UpdateTransferServiceData, UpdateTransferServiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateTransferServiceVariables): MutationRef<UpdateTransferServiceData, UpdateTransferServiceVariables>;
  operationName: string;
}
export const updateTransferServiceRef: UpdateTransferServiceRef;

export function updateTransferService(vars: UpdateTransferServiceVariables): MutationPromise<UpdateTransferServiceData, UpdateTransferServiceVariables>;
export function updateTransferService(dc: DataConnect, vars: UpdateTransferServiceVariables): MutationPromise<UpdateTransferServiceData, UpdateTransferServiceVariables>;

interface DeleteTransferServiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTransferServiceVariables): MutationRef<DeleteTransferServiceData, DeleteTransferServiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteTransferServiceVariables): MutationRef<DeleteTransferServiceData, DeleteTransferServiceVariables>;
  operationName: string;
}
export const deleteTransferServiceRef: DeleteTransferServiceRef;

export function deleteTransferService(vars: DeleteTransferServiceVariables): MutationPromise<DeleteTransferServiceData, DeleteTransferServiceVariables>;
export function deleteTransferService(dc: DataConnect, vars: DeleteTransferServiceVariables): MutationPromise<DeleteTransferServiceData, DeleteTransferServiceVariables>;

interface InsertFleetVehicleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertFleetVehicleVariables): MutationRef<InsertFleetVehicleData, InsertFleetVehicleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertFleetVehicleVariables): MutationRef<InsertFleetVehicleData, InsertFleetVehicleVariables>;
  operationName: string;
}
export const insertFleetVehicleRef: InsertFleetVehicleRef;

export function insertFleetVehicle(vars: InsertFleetVehicleVariables): MutationPromise<InsertFleetVehicleData, InsertFleetVehicleVariables>;
export function insertFleetVehicle(dc: DataConnect, vars: InsertFleetVehicleVariables): MutationPromise<InsertFleetVehicleData, InsertFleetVehicleVariables>;

interface UpdateFleetVehicleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateFleetVehicleVariables): MutationRef<UpdateFleetVehicleData, UpdateFleetVehicleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateFleetVehicleVariables): MutationRef<UpdateFleetVehicleData, UpdateFleetVehicleVariables>;
  operationName: string;
}
export const updateFleetVehicleRef: UpdateFleetVehicleRef;

export function updateFleetVehicle(vars: UpdateFleetVehicleVariables): MutationPromise<UpdateFleetVehicleData, UpdateFleetVehicleVariables>;
export function updateFleetVehicle(dc: DataConnect, vars: UpdateFleetVehicleVariables): MutationPromise<UpdateFleetVehicleData, UpdateFleetVehicleVariables>;

interface DeleteFleetVehicleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteFleetVehicleVariables): MutationRef<DeleteFleetVehicleData, DeleteFleetVehicleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteFleetVehicleVariables): MutationRef<DeleteFleetVehicleData, DeleteFleetVehicleVariables>;
  operationName: string;
}
export const deleteFleetVehicleRef: DeleteFleetVehicleRef;

export function deleteFleetVehicle(vars: DeleteFleetVehicleVariables): MutationPromise<DeleteFleetVehicleData, DeleteFleetVehicleVariables>;
export function deleteFleetVehicle(dc: DataConnect, vars: DeleteFleetVehicleVariables): MutationPromise<DeleteFleetVehicleData, DeleteFleetVehicleVariables>;

interface InsertFleetDriverRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertFleetDriverVariables): MutationRef<InsertFleetDriverData, InsertFleetDriverVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertFleetDriverVariables): MutationRef<InsertFleetDriverData, InsertFleetDriverVariables>;
  operationName: string;
}
export const insertFleetDriverRef: InsertFleetDriverRef;

export function insertFleetDriver(vars: InsertFleetDriverVariables): MutationPromise<InsertFleetDriverData, InsertFleetDriverVariables>;
export function insertFleetDriver(dc: DataConnect, vars: InsertFleetDriverVariables): MutationPromise<InsertFleetDriverData, InsertFleetDriverVariables>;

interface UpdateFleetDriverRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateFleetDriverVariables): MutationRef<UpdateFleetDriverData, UpdateFleetDriverVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateFleetDriverVariables): MutationRef<UpdateFleetDriverData, UpdateFleetDriverVariables>;
  operationName: string;
}
export const updateFleetDriverRef: UpdateFleetDriverRef;

export function updateFleetDriver(vars: UpdateFleetDriverVariables): MutationPromise<UpdateFleetDriverData, UpdateFleetDriverVariables>;
export function updateFleetDriver(dc: DataConnect, vars: UpdateFleetDriverVariables): MutationPromise<UpdateFleetDriverData, UpdateFleetDriverVariables>;

interface DeleteFleetDriverRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteFleetDriverVariables): MutationRef<DeleteFleetDriverData, DeleteFleetDriverVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteFleetDriverVariables): MutationRef<DeleteFleetDriverData, DeleteFleetDriverVariables>;
  operationName: string;
}
export const deleteFleetDriverRef: DeleteFleetDriverRef;

export function deleteFleetDriver(vars: DeleteFleetDriverVariables): MutationPromise<DeleteFleetDriverData, DeleteFleetDriverVariables>;
export function deleteFleetDriver(dc: DataConnect, vars: DeleteFleetDriverVariables): MutationPromise<DeleteFleetDriverData, DeleteFleetDriverVariables>;

interface UpdateInvoiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInvoiceVariables): MutationRef<UpdateInvoiceData, UpdateInvoiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateInvoiceVariables): MutationRef<UpdateInvoiceData, UpdateInvoiceVariables>;
  operationName: string;
}
export const updateInvoiceRef: UpdateInvoiceRef;

export function updateInvoice(vars: UpdateInvoiceVariables): MutationPromise<UpdateInvoiceData, UpdateInvoiceVariables>;
export function updateInvoice(dc: DataConnect, vars: UpdateInvoiceVariables): MutationPromise<UpdateInvoiceData, UpdateInvoiceVariables>;

interface UpdateClientRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateClientVariables): MutationRef<UpdateClientData, UpdateClientVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateClientVariables): MutationRef<UpdateClientData, UpdateClientVariables>;
  operationName: string;
}
export const updateClientRef: UpdateClientRef;

export function updateClient(vars: UpdateClientVariables): MutationPromise<UpdateClientData, UpdateClientVariables>;
export function updateClient(dc: DataConnect, vars: UpdateClientVariables): MutationPromise<UpdateClientData, UpdateClientVariables>;

interface DeleteInvoiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteInvoiceVariables): MutationRef<DeleteInvoiceData, DeleteInvoiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteInvoiceVariables): MutationRef<DeleteInvoiceData, DeleteInvoiceVariables>;
  operationName: string;
}
export const deleteInvoiceRef: DeleteInvoiceRef;

export function deleteInvoice(vars: DeleteInvoiceVariables): MutationPromise<DeleteInvoiceData, DeleteInvoiceVariables>;
export function deleteInvoice(dc: DataConnect, vars: DeleteInvoiceVariables): MutationPromise<DeleteInvoiceData, DeleteInvoiceVariables>;

interface DeleteClientRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteClientVariables): MutationRef<DeleteClientData, DeleteClientVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteClientVariables): MutationRef<DeleteClientData, DeleteClientVariables>;
  operationName: string;
}
export const deleteClientRef: DeleteClientRef;

export function deleteClient(vars: DeleteClientVariables): MutationPromise<DeleteClientData, DeleteClientVariables>;
export function deleteClient(dc: DataConnect, vars: DeleteClientVariables): MutationPromise<DeleteClientData, DeleteClientVariables>;

interface DeletePaymentVoucherRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePaymentVoucherVariables): MutationRef<DeletePaymentVoucherData, DeletePaymentVoucherVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeletePaymentVoucherVariables): MutationRef<DeletePaymentVoucherData, DeletePaymentVoucherVariables>;
  operationName: string;
}
export const deletePaymentVoucherRef: DeletePaymentVoucherRef;

export function deletePaymentVoucher(vars: DeletePaymentVoucherVariables): MutationPromise<DeletePaymentVoucherData, DeletePaymentVoucherVariables>;
export function deletePaymentVoucher(dc: DataConnect, vars: DeletePaymentVoucherVariables): MutationPromise<DeletePaymentVoucherData, DeletePaymentVoucherVariables>;

interface DeleteReservationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteReservationVariables): MutationRef<DeleteReservationData, DeleteReservationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteReservationVariables): MutationRef<DeleteReservationData, DeleteReservationVariables>;
  operationName: string;
}
export const deleteReservationRef: DeleteReservationRef;

export function deleteReservation(vars: DeleteReservationVariables): MutationPromise<DeleteReservationData, DeleteReservationVariables>;
export function deleteReservation(dc: DataConnect, vars: DeleteReservationVariables): MutationPromise<DeleteReservationData, DeleteReservationVariables>;

interface DeleteDetailedPropertyRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteDetailedPropertyVariables): MutationRef<DeleteDetailedPropertyData, DeleteDetailedPropertyVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteDetailedPropertyVariables): MutationRef<DeleteDetailedPropertyData, DeleteDetailedPropertyVariables>;
  operationName: string;
}
export const deleteDetailedPropertyRef: DeleteDetailedPropertyRef;

export function deleteDetailedProperty(vars: DeleteDetailedPropertyVariables): MutationPromise<DeleteDetailedPropertyData, DeleteDetailedPropertyVariables>;
export function deleteDetailedProperty(dc: DataConnect, vars: DeleteDetailedPropertyVariables): MutationPromise<DeleteDetailedPropertyData, DeleteDetailedPropertyVariables>;

interface DeleteRoomTypeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRoomTypeVariables): MutationRef<DeleteRoomTypeData, DeleteRoomTypeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteRoomTypeVariables): MutationRef<DeleteRoomTypeData, DeleteRoomTypeVariables>;
  operationName: string;
}
export const deleteRoomTypeRef: DeleteRoomTypeRef;

export function deleteRoomType(vars: DeleteRoomTypeVariables): MutationPromise<DeleteRoomTypeData, DeleteRoomTypeVariables>;
export function deleteRoomType(dc: DataConnect, vars: DeleteRoomTypeVariables): MutationPromise<DeleteRoomTypeData, DeleteRoomTypeVariables>;

interface DeleteRatePlanRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRatePlanVariables): MutationRef<DeleteRatePlanData, DeleteRatePlanVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteRatePlanVariables): MutationRef<DeleteRatePlanData, DeleteRatePlanVariables>;
  operationName: string;
}
export const deleteRatePlanRef: DeleteRatePlanRef;

export function deleteRatePlan(vars: DeleteRatePlanVariables): MutationPromise<DeleteRatePlanData, DeleteRatePlanVariables>;
export function deleteRatePlan(dc: DataConnect, vars: DeleteRatePlanVariables): MutationPromise<DeleteRatePlanData, DeleteRatePlanVariables>;

interface DeleteStopSaleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteStopSaleVariables): MutationRef<DeleteStopSaleData, DeleteStopSaleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteStopSaleVariables): MutationRef<DeleteStopSaleData, DeleteStopSaleVariables>;
  operationName: string;
}
export const deleteStopSaleRef: DeleteStopSaleRef;

export function deleteStopSale(vars: DeleteStopSaleVariables): MutationPromise<DeleteStopSaleData, DeleteStopSaleVariables>;
export function deleteStopSale(dc: DataConnect, vars: DeleteStopSaleVariables): MutationPromise<DeleteStopSaleData, DeleteStopSaleVariables>;

interface InsertPayableObligationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertPayableObligationVariables): MutationRef<InsertPayableObligationData, InsertPayableObligationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertPayableObligationVariables): MutationRef<InsertPayableObligationData, InsertPayableObligationVariables>;
  operationName: string;
}
export const insertPayableObligationRef: InsertPayableObligationRef;

export function insertPayableObligation(vars: InsertPayableObligationVariables): MutationPromise<InsertPayableObligationData, InsertPayableObligationVariables>;
export function insertPayableObligation(dc: DataConnect, vars: InsertPayableObligationVariables): MutationPromise<InsertPayableObligationData, InsertPayableObligationVariables>;

interface UpdatePayableObligationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePayableObligationVariables): MutationRef<UpdatePayableObligationData, UpdatePayableObligationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdatePayableObligationVariables): MutationRef<UpdatePayableObligationData, UpdatePayableObligationVariables>;
  operationName: string;
}
export const updatePayableObligationRef: UpdatePayableObligationRef;

export function updatePayableObligation(vars: UpdatePayableObligationVariables): MutationPromise<UpdatePayableObligationData, UpdatePayableObligationVariables>;
export function updatePayableObligation(dc: DataConnect, vars: UpdatePayableObligationVariables): MutationPromise<UpdatePayableObligationData, UpdatePayableObligationVariables>;

interface DeletePayableObligationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePayableObligationVariables): MutationRef<DeletePayableObligationData, DeletePayableObligationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeletePayableObligationVariables): MutationRef<DeletePayableObligationData, DeletePayableObligationVariables>;
  operationName: string;
}
export const deletePayableObligationRef: DeletePayableObligationRef;

export function deletePayableObligation(vars: DeletePayableObligationVariables): MutationPromise<DeletePayableObligationData, DeletePayableObligationVariables>;
export function deletePayableObligation(dc: DataConnect, vars: DeletePayableObligationVariables): MutationPromise<DeletePayableObligationData, DeletePayableObligationVariables>;

interface InsertProviderStatementRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertProviderStatementVariables): MutationRef<InsertProviderStatementData, InsertProviderStatementVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertProviderStatementVariables): MutationRef<InsertProviderStatementData, InsertProviderStatementVariables>;
  operationName: string;
}
export const insertProviderStatementRef: InsertProviderStatementRef;

export function insertProviderStatement(vars: InsertProviderStatementVariables): MutationPromise<InsertProviderStatementData, InsertProviderStatementVariables>;
export function insertProviderStatement(dc: DataConnect, vars: InsertProviderStatementVariables): MutationPromise<InsertProviderStatementData, InsertProviderStatementVariables>;

interface DeleteProviderStatementRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteProviderStatementVariables): MutationRef<DeleteProviderStatementData, DeleteProviderStatementVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteProviderStatementVariables): MutationRef<DeleteProviderStatementData, DeleteProviderStatementVariables>;
  operationName: string;
}
export const deleteProviderStatementRef: DeleteProviderStatementRef;

export function deleteProviderStatement(vars: DeleteProviderStatementVariables): MutationPromise<DeleteProviderStatementData, DeleteProviderStatementVariables>;
export function deleteProviderStatement(dc: DataConnect, vars: DeleteProviderStatementVariables): MutationPromise<DeleteProviderStatementData, DeleteProviderStatementVariables>;

interface InsertExtraServiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertExtraServiceVariables): MutationRef<InsertExtraServiceData, InsertExtraServiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertExtraServiceVariables): MutationRef<InsertExtraServiceData, InsertExtraServiceVariables>;
  operationName: string;
}
export const insertExtraServiceRef: InsertExtraServiceRef;

export function insertExtraService(vars: InsertExtraServiceVariables): MutationPromise<InsertExtraServiceData, InsertExtraServiceVariables>;
export function insertExtraService(dc: DataConnect, vars: InsertExtraServiceVariables): MutationPromise<InsertExtraServiceData, InsertExtraServiceVariables>;

interface UpdateExtraServiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateExtraServiceVariables): MutationRef<UpdateExtraServiceData, UpdateExtraServiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateExtraServiceVariables): MutationRef<UpdateExtraServiceData, UpdateExtraServiceVariables>;
  operationName: string;
}
export const updateExtraServiceRef: UpdateExtraServiceRef;

export function updateExtraService(vars: UpdateExtraServiceVariables): MutationPromise<UpdateExtraServiceData, UpdateExtraServiceVariables>;
export function updateExtraService(dc: DataConnect, vars: UpdateExtraServiceVariables): MutationPromise<UpdateExtraServiceData, UpdateExtraServiceVariables>;

interface DeleteExtraServiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteExtraServiceVariables): MutationRef<DeleteExtraServiceData, DeleteExtraServiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteExtraServiceVariables): MutationRef<DeleteExtraServiceData, DeleteExtraServiceVariables>;
  operationName: string;
}
export const deleteExtraServiceRef: DeleteExtraServiceRef;

export function deleteExtraService(vars: DeleteExtraServiceVariables): MutationPromise<DeleteExtraServiceData, DeleteExtraServiceVariables>;
export function deleteExtraService(dc: DataConnect, vars: DeleteExtraServiceVariables): MutationPromise<DeleteExtraServiceData, DeleteExtraServiceVariables>;

interface InsertServiceRateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertServiceRateVariables): MutationRef<InsertServiceRateData, InsertServiceRateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertServiceRateVariables): MutationRef<InsertServiceRateData, InsertServiceRateVariables>;
  operationName: string;
}
export const insertServiceRateRef: InsertServiceRateRef;

export function insertServiceRate(vars: InsertServiceRateVariables): MutationPromise<InsertServiceRateData, InsertServiceRateVariables>;
export function insertServiceRate(dc: DataConnect, vars: InsertServiceRateVariables): MutationPromise<InsertServiceRateData, InsertServiceRateVariables>;

interface UpdateServiceRateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateServiceRateVariables): MutationRef<UpdateServiceRateData, UpdateServiceRateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateServiceRateVariables): MutationRef<UpdateServiceRateData, UpdateServiceRateVariables>;
  operationName: string;
}
export const updateServiceRateRef: UpdateServiceRateRef;

export function updateServiceRate(vars: UpdateServiceRateVariables): MutationPromise<UpdateServiceRateData, UpdateServiceRateVariables>;
export function updateServiceRate(dc: DataConnect, vars: UpdateServiceRateVariables): MutationPromise<UpdateServiceRateData, UpdateServiceRateVariables>;

interface DeleteServiceRateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteServiceRateVariables): MutationRef<DeleteServiceRateData, DeleteServiceRateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteServiceRateVariables): MutationRef<DeleteServiceRateData, DeleteServiceRateVariables>;
  operationName: string;
}
export const deleteServiceRateRef: DeleteServiceRateRef;

export function deleteServiceRate(vars: DeleteServiceRateVariables): MutationPromise<DeleteServiceRateData, DeleteServiceRateVariables>;
export function deleteServiceRate(dc: DataConnect, vars: DeleteServiceRateVariables): MutationPromise<DeleteServiceRateData, DeleteServiceRateVariables>;

interface ListReservationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListReservationsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListReservationsData, undefined>;
  operationName: string;
}
export const listReservationsRef: ListReservationsRef;

export function listReservations(options?: ExecuteQueryOptions): QueryPromise<ListReservationsData, undefined>;
export function listReservations(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListReservationsData, undefined>;

interface ListClientsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListClientsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListClientsData, undefined>;
  operationName: string;
}
export const listClientsRef: ListClientsRef;

export function listClients(options?: ExecuteQueryOptions): QueryPromise<ListClientsData, undefined>;
export function listClients(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListClientsData, undefined>;

interface ListInvoicesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListInvoicesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListInvoicesData, undefined>;
  operationName: string;
}
export const listInvoicesRef: ListInvoicesRef;

export function listInvoices(options?: ExecuteQueryOptions): QueryPromise<ListInvoicesData, undefined>;
export function listInvoices(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListInvoicesData, undefined>;

interface ListPropertiesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPropertiesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPropertiesData, undefined>;
  operationName: string;
}
export const listPropertiesRef: ListPropertiesRef;

export function listProperties(options?: ExecuteQueryOptions): QueryPromise<ListPropertiesData, undefined>;
export function listProperties(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPropertiesData, undefined>;

interface ListDetailedPropertiesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDetailedPropertiesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListDetailedPropertiesData, undefined>;
  operationName: string;
}
export const listDetailedPropertiesRef: ListDetailedPropertiesRef;

export function listDetailedProperties(options?: ExecuteQueryOptions): QueryPromise<ListDetailedPropertiesData, undefined>;
export function listDetailedProperties(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDetailedPropertiesData, undefined>;

interface ListRoomTypesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRoomTypesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListRoomTypesData, undefined>;
  operationName: string;
}
export const listRoomTypesRef: ListRoomTypesRef;

export function listRoomTypes(options?: ExecuteQueryOptions): QueryPromise<ListRoomTypesData, undefined>;
export function listRoomTypes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRoomTypesData, undefined>;

interface ListRatePlansRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRatePlansData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListRatePlansData, undefined>;
  operationName: string;
}
export const listRatePlansRef: ListRatePlansRef;

export function listRatePlans(options?: ExecuteQueryOptions): QueryPromise<ListRatePlansData, undefined>;
export function listRatePlans(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRatePlansData, undefined>;

interface ListStopSalesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListStopSalesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListStopSalesData, undefined>;
  operationName: string;
}
export const listStopSalesRef: ListStopSalesRef;

export function listStopSales(options?: ExecuteQueryOptions): QueryPromise<ListStopSalesData, undefined>;
export function listStopSales(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListStopSalesData, undefined>;

interface ListFlightTicketsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListFlightTicketsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListFlightTicketsData, undefined>;
  operationName: string;
}
export const listFlightTicketsRef: ListFlightTicketsRef;

export function listFlightTickets(options?: ExecuteQueryOptions): QueryPromise<ListFlightTicketsData, undefined>;
export function listFlightTickets(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListFlightTicketsData, undefined>;

interface ListTransferServicesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTransferServicesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListTransferServicesData, undefined>;
  operationName: string;
}
export const listTransferServicesRef: ListTransferServicesRef;

export function listTransferServices(options?: ExecuteQueryOptions): QueryPromise<ListTransferServicesData, undefined>;
export function listTransferServices(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListTransferServicesData, undefined>;

interface ListFleetVehiclesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListFleetVehiclesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListFleetVehiclesData, undefined>;
  operationName: string;
}
export const listFleetVehiclesRef: ListFleetVehiclesRef;

export function listFleetVehicles(options?: ExecuteQueryOptions): QueryPromise<ListFleetVehiclesData, undefined>;
export function listFleetVehicles(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListFleetVehiclesData, undefined>;

interface ListFleetDriversRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListFleetDriversData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListFleetDriversData, undefined>;
  operationName: string;
}
export const listFleetDriversRef: ListFleetDriversRef;

export function listFleetDrivers(options?: ExecuteQueryOptions): QueryPromise<ListFleetDriversData, undefined>;
export function listFleetDrivers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListFleetDriversData, undefined>;

interface ListPayableObligationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPayableObligationsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPayableObligationsData, undefined>;
  operationName: string;
}
export const listPayableObligationsRef: ListPayableObligationsRef;

export function listPayableObligations(options?: ExecuteQueryOptions): QueryPromise<ListPayableObligationsData, undefined>;
export function listPayableObligations(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPayableObligationsData, undefined>;

interface ListProviderStatementsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProviderStatementsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProviderStatementsData, undefined>;
  operationName: string;
}
export const listProviderStatementsRef: ListProviderStatementsRef;

export function listProviderStatements(options?: ExecuteQueryOptions): QueryPromise<ListProviderStatementsData, undefined>;
export function listProviderStatements(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProviderStatementsData, undefined>;

interface ListExtraServicesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListExtraServicesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListExtraServicesData, undefined>;
  operationName: string;
}
export const listExtraServicesRef: ListExtraServicesRef;

export function listExtraServices(options?: ExecuteQueryOptions): QueryPromise<ListExtraServicesData, undefined>;
export function listExtraServices(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListExtraServicesData, undefined>;

interface ListServiceRatesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListServiceRatesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListServiceRatesData, undefined>;
  operationName: string;
}
export const listServiceRatesRef: ListServiceRatesRef;

export function listServiceRates(options?: ExecuteQueryOptions): QueryPromise<ListServiceRatesData, undefined>;
export function listServiceRates(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListServiceRatesData, undefined>;

