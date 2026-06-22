import { ConnectorConfig, DataConnect, QueryRef, QueryPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface B2BClient_Key {
  id: string;
  __typename?: 'B2BClient_Key';
}

export interface FinancialInvoice_Key {
  id: string;
  __typename?: 'FinancialInvoice_Key';
}

export interface FlightLeg_Key {
  id: string;
  __typename?: 'FlightLeg_Key';
}

export interface HotelProperty_Key {
  id: string;
  __typename?: 'HotelProperty_Key';
}

export interface ListClientsData {
  b2BClients: ({
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    type: string;
    tier: string;
    balance: number;
    status: string;
  } & B2BClient_Key)[];
}

export interface ListInvoicesData {
  financialInvoices: ({
    id: string;
    clientName: string;
    date: string;
    dueDate: string;
    amount: number;
    vatAmount: number;
    type: string;
    status: string;
  } & FinancialInvoice_Key)[];
}

export interface ListPropertiesData {
  hotelProperties: ({
    id: string;
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

export interface ListReservationsData {
  reservations: ({
    id: string;
    holder: string;
    hotelName: string;
    checkIn: string;
    checkOut: string;
    pax: number;
    status: string;
    totalPrice: number;
    netPrice: number;
  } & Reservation_Key)[];
}

export interface Reservation_Key {
  id: string;
  __typename?: 'Reservation_Key';
}

export interface TransferService_Key {
  id: string;
  __typename?: 'TransferService_Key';
}

interface ListReservationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListReservationsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListReservationsData, undefined>;
  operationName: string;
}
export const listReservationsRef: ListReservationsRef;

export function listReservations(): QueryPromise<ListReservationsData, undefined>;
export function listReservations(dc: DataConnect): QueryPromise<ListReservationsData, undefined>;

interface ListClientsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListClientsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListClientsData, undefined>;
  operationName: string;
}
export const listClientsRef: ListClientsRef;

export function listClients(): QueryPromise<ListClientsData, undefined>;
export function listClients(dc: DataConnect): QueryPromise<ListClientsData, undefined>;

interface ListInvoicesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListInvoicesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListInvoicesData, undefined>;
  operationName: string;
}
export const listInvoicesRef: ListInvoicesRef;

export function listInvoices(): QueryPromise<ListInvoicesData, undefined>;
export function listInvoices(dc: DataConnect): QueryPromise<ListInvoicesData, undefined>;

interface ListPropertiesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPropertiesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPropertiesData, undefined>;
  operationName: string;
}
export const listPropertiesRef: ListPropertiesRef;

export function listProperties(): QueryPromise<ListPropertiesData, undefined>;
export function listProperties(dc: DataConnect): QueryPromise<ListPropertiesData, undefined>;

