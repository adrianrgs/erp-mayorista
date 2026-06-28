# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `foratour-erp-connector`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListPaymentVouchers*](#listpaymentvouchers)
  - [*ListReservations*](#listreservations)
  - [*ListClients*](#listclients)
  - [*ListInvoices*](#listinvoices)
  - [*ListProperties*](#listproperties)
  - [*ListDetailedProperties*](#listdetailedproperties)
  - [*ListRoomTypes*](#listroomtypes)
  - [*ListRatePlans*](#listrateplans)
  - [*ListStopSales*](#liststopsales)
  - [*ListFlightTickets*](#listflighttickets)
  - [*ListTransferServices*](#listtransferservices)
  - [*ListFleetVehicles*](#listfleetvehicles)
  - [*ListFleetDrivers*](#listfleetdrivers)
  - [*ListPayableObligations*](#listpayableobligations)
  - [*ListProviderStatements*](#listproviderstatements)
  - [*ListExtraServices*](#listextraservices)
  - [*ListServiceRates*](#listservicerates)
- [**Mutations**](#mutations)
  - [*InsertPaymentVoucher*](#insertpaymentvoucher)
  - [*UpdatePaymentVoucher*](#updatepaymentvoucher)
  - [*InsertReservation*](#insertreservation)
  - [*UpdateReservationStatus*](#updatereservationstatus)
  - [*UpdateReservation*](#updatereservation)
  - [*InsertClient*](#insertclient)
  - [*InsertInvoice*](#insertinvoice)
  - [*InsertDetailedProperty*](#insertdetailedproperty)
  - [*UpdateDetailedProperty*](#updatedetailedproperty)
  - [*InsertRoomType*](#insertroomtype)
  - [*UpdateRoomType*](#updateroomtype)
  - [*InsertRatePlan*](#insertrateplan)
  - [*UpdateRatePlan*](#updaterateplan)
  - [*InsertStopSale*](#insertstopsale)
  - [*UpdateStopSale*](#updatestopsale)
  - [*InsertFlightTicket*](#insertflightticket)
  - [*UpdateFlightTicket*](#updateflightticket)
  - [*DeleteFlightTicket*](#deleteflightticket)
  - [*InsertTransferService*](#inserttransferservice)
  - [*UpdateTransferService*](#updatetransferservice)
  - [*DeleteTransferService*](#deletetransferservice)
  - [*InsertFleetVehicle*](#insertfleetvehicle)
  - [*UpdateFleetVehicle*](#updatefleetvehicle)
  - [*DeleteFleetVehicle*](#deletefleetvehicle)
  - [*InsertFleetDriver*](#insertfleetdriver)
  - [*UpdateFleetDriver*](#updatefleetdriver)
  - [*DeleteFleetDriver*](#deletefleetdriver)
  - [*UpdateInvoice*](#updateinvoice)
  - [*UpdateClient*](#updateclient)
  - [*DeleteInvoice*](#deleteinvoice)
  - [*DeleteClient*](#deleteclient)
  - [*DeletePaymentVoucher*](#deletepaymentvoucher)
  - [*DeleteReservation*](#deletereservation)
  - [*DeleteDetailedProperty*](#deletedetailedproperty)
  - [*DeleteRoomType*](#deleteroomtype)
  - [*DeleteRatePlan*](#deleterateplan)
  - [*DeleteStopSale*](#deletestopsale)
  - [*InsertPayableObligation*](#insertpayableobligation)
  - [*UpdatePayableObligation*](#updatepayableobligation)
  - [*DeletePayableObligation*](#deletepayableobligation)
  - [*InsertProviderStatement*](#insertproviderstatement)
  - [*DeleteProviderStatement*](#deleteproviderstatement)
  - [*InsertExtraService*](#insertextraservice)
  - [*UpdateExtraService*](#updateextraservice)
  - [*DeleteExtraService*](#deleteextraservice)
  - [*InsertServiceRate*](#insertservicerate)
  - [*UpdateServiceRate*](#updateservicerate)
  - [*DeleteServiceRate*](#deleteservicerate)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `foratour-erp-connector`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@foratour-erp/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@foratour-erp/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@foratour-erp/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `foratour-erp-connector` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListPaymentVouchers
You can execute the `ListPaymentVouchers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listPaymentVouchers(options?: ExecuteQueryOptions): QueryPromise<ListPaymentVouchersData, undefined>;

interface ListPaymentVouchersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPaymentVouchersData, undefined>;
}
export const listPaymentVouchersRef: ListPaymentVouchersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPaymentVouchers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPaymentVouchersData, undefined>;

interface ListPaymentVouchersRef {
  ...
  (dc: DataConnect): QueryRef<ListPaymentVouchersData, undefined>;
}
export const listPaymentVouchersRef: ListPaymentVouchersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPaymentVouchersRef:
```typescript
const name = listPaymentVouchersRef.operationName;
console.log(name);
```

### Variables
The `ListPaymentVouchers` query has no variables.
### Return Type
Recall that executing the `ListPaymentVouchers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPaymentVouchersData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListPaymentVouchers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPaymentVouchers } from '@foratour-erp/dataconnect';


// Call the `listPaymentVouchers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPaymentVouchers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPaymentVouchers(dataConnect);

console.log(data.paymentVouchers);

// Or, you can use the `Promise` API.
listPaymentVouchers().then((response) => {
  const data = response.data;
  console.log(data.paymentVouchers);
});
```

### Using `ListPaymentVouchers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPaymentVouchersRef } from '@foratour-erp/dataconnect';


// Call the `listPaymentVouchersRef()` function to get a reference to the query.
const ref = listPaymentVouchersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPaymentVouchersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.paymentVouchers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.paymentVouchers);
});
```

## ListReservations
You can execute the `ListReservations` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listReservations(options?: ExecuteQueryOptions): QueryPromise<ListReservationsData, undefined>;

interface ListReservationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListReservationsData, undefined>;
}
export const listReservationsRef: ListReservationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listReservations(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListReservationsData, undefined>;

interface ListReservationsRef {
  ...
  (dc: DataConnect): QueryRef<ListReservationsData, undefined>;
}
export const listReservationsRef: ListReservationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listReservationsRef:
```typescript
const name = listReservationsRef.operationName;
console.log(name);
```

### Variables
The `ListReservations` query has no variables.
### Return Type
Recall that executing the `ListReservations` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListReservationsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListReservations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listReservations } from '@foratour-erp/dataconnect';


// Call the `listReservations()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listReservations();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listReservations(dataConnect);

console.log(data.reservations);

// Or, you can use the `Promise` API.
listReservations().then((response) => {
  const data = response.data;
  console.log(data.reservations);
});
```

### Using `ListReservations`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listReservationsRef } from '@foratour-erp/dataconnect';


// Call the `listReservationsRef()` function to get a reference to the query.
const ref = listReservationsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listReservationsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.reservations);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.reservations);
});
```

## ListClients
You can execute the `ListClients` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listClients(options?: ExecuteQueryOptions): QueryPromise<ListClientsData, undefined>;

interface ListClientsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListClientsData, undefined>;
}
export const listClientsRef: ListClientsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listClients(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListClientsData, undefined>;

interface ListClientsRef {
  ...
  (dc: DataConnect): QueryRef<ListClientsData, undefined>;
}
export const listClientsRef: ListClientsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listClientsRef:
```typescript
const name = listClientsRef.operationName;
console.log(name);
```

### Variables
The `ListClients` query has no variables.
### Return Type
Recall that executing the `ListClients` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListClientsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListClients`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listClients } from '@foratour-erp/dataconnect';


// Call the `listClients()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listClients();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listClients(dataConnect);

console.log(data.b2BClients);

// Or, you can use the `Promise` API.
listClients().then((response) => {
  const data = response.data;
  console.log(data.b2BClients);
});
```

### Using `ListClients`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listClientsRef } from '@foratour-erp/dataconnect';


// Call the `listClientsRef()` function to get a reference to the query.
const ref = listClientsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listClientsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.b2BClients);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.b2BClients);
});
```

## ListInvoices
You can execute the `ListInvoices` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listInvoices(options?: ExecuteQueryOptions): QueryPromise<ListInvoicesData, undefined>;

interface ListInvoicesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListInvoicesData, undefined>;
}
export const listInvoicesRef: ListInvoicesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listInvoices(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListInvoicesData, undefined>;

interface ListInvoicesRef {
  ...
  (dc: DataConnect): QueryRef<ListInvoicesData, undefined>;
}
export const listInvoicesRef: ListInvoicesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listInvoicesRef:
```typescript
const name = listInvoicesRef.operationName;
console.log(name);
```

### Variables
The `ListInvoices` query has no variables.
### Return Type
Recall that executing the `ListInvoices` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListInvoicesData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListInvoices`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listInvoices } from '@foratour-erp/dataconnect';


// Call the `listInvoices()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listInvoices();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listInvoices(dataConnect);

console.log(data.financialInvoices);

// Or, you can use the `Promise` API.
listInvoices().then((response) => {
  const data = response.data;
  console.log(data.financialInvoices);
});
```

### Using `ListInvoices`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listInvoicesRef } from '@foratour-erp/dataconnect';


// Call the `listInvoicesRef()` function to get a reference to the query.
const ref = listInvoicesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listInvoicesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.financialInvoices);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.financialInvoices);
});
```

## ListProperties
You can execute the `ListProperties` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listProperties(options?: ExecuteQueryOptions): QueryPromise<ListPropertiesData, undefined>;

interface ListPropertiesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPropertiesData, undefined>;
}
export const listPropertiesRef: ListPropertiesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProperties(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPropertiesData, undefined>;

interface ListPropertiesRef {
  ...
  (dc: DataConnect): QueryRef<ListPropertiesData, undefined>;
}
export const listPropertiesRef: ListPropertiesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPropertiesRef:
```typescript
const name = listPropertiesRef.operationName;
console.log(name);
```

### Variables
The `ListProperties` query has no variables.
### Return Type
Recall that executing the `ListProperties` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPropertiesData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListProperties`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProperties } from '@foratour-erp/dataconnect';


// Call the `listProperties()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProperties();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProperties(dataConnect);

console.log(data.hotelProperties);

// Or, you can use the `Promise` API.
listProperties().then((response) => {
  const data = response.data;
  console.log(data.hotelProperties);
});
```

### Using `ListProperties`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPropertiesRef } from '@foratour-erp/dataconnect';


// Call the `listPropertiesRef()` function to get a reference to the query.
const ref = listPropertiesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPropertiesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.hotelProperties);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.hotelProperties);
});
```

## ListDetailedProperties
You can execute the `ListDetailedProperties` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listDetailedProperties(options?: ExecuteQueryOptions): QueryPromise<ListDetailedPropertiesData, undefined>;

interface ListDetailedPropertiesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDetailedPropertiesData, undefined>;
}
export const listDetailedPropertiesRef: ListDetailedPropertiesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDetailedProperties(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDetailedPropertiesData, undefined>;

interface ListDetailedPropertiesRef {
  ...
  (dc: DataConnect): QueryRef<ListDetailedPropertiesData, undefined>;
}
export const listDetailedPropertiesRef: ListDetailedPropertiesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDetailedPropertiesRef:
```typescript
const name = listDetailedPropertiesRef.operationName;
console.log(name);
```

### Variables
The `ListDetailedProperties` query has no variables.
### Return Type
Recall that executing the `ListDetailedProperties` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDetailedPropertiesData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListDetailedProperties`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDetailedProperties } from '@foratour-erp/dataconnect';


// Call the `listDetailedProperties()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDetailedProperties();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDetailedProperties(dataConnect);

console.log(data.detailedProperties);

// Or, you can use the `Promise` API.
listDetailedProperties().then((response) => {
  const data = response.data;
  console.log(data.detailedProperties);
});
```

### Using `ListDetailedProperties`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDetailedPropertiesRef } from '@foratour-erp/dataconnect';


// Call the `listDetailedPropertiesRef()` function to get a reference to the query.
const ref = listDetailedPropertiesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDetailedPropertiesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.detailedProperties);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.detailedProperties);
});
```

## ListRoomTypes
You can execute the `ListRoomTypes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listRoomTypes(options?: ExecuteQueryOptions): QueryPromise<ListRoomTypesData, undefined>;

interface ListRoomTypesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRoomTypesData, undefined>;
}
export const listRoomTypesRef: ListRoomTypesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listRoomTypes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRoomTypesData, undefined>;

interface ListRoomTypesRef {
  ...
  (dc: DataConnect): QueryRef<ListRoomTypesData, undefined>;
}
export const listRoomTypesRef: ListRoomTypesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listRoomTypesRef:
```typescript
const name = listRoomTypesRef.operationName;
console.log(name);
```

### Variables
The `ListRoomTypes` query has no variables.
### Return Type
Recall that executing the `ListRoomTypes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListRoomTypesData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListRoomTypes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listRoomTypes } from '@foratour-erp/dataconnect';


// Call the `listRoomTypes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listRoomTypes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listRoomTypes(dataConnect);

console.log(data.roomTypes);

// Or, you can use the `Promise` API.
listRoomTypes().then((response) => {
  const data = response.data;
  console.log(data.roomTypes);
});
```

### Using `ListRoomTypes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listRoomTypesRef } from '@foratour-erp/dataconnect';


// Call the `listRoomTypesRef()` function to get a reference to the query.
const ref = listRoomTypesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listRoomTypesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.roomTypes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.roomTypes);
});
```

## ListRatePlans
You can execute the `ListRatePlans` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listRatePlans(options?: ExecuteQueryOptions): QueryPromise<ListRatePlansData, undefined>;

interface ListRatePlansRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRatePlansData, undefined>;
}
export const listRatePlansRef: ListRatePlansRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listRatePlans(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRatePlansData, undefined>;

interface ListRatePlansRef {
  ...
  (dc: DataConnect): QueryRef<ListRatePlansData, undefined>;
}
export const listRatePlansRef: ListRatePlansRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listRatePlansRef:
```typescript
const name = listRatePlansRef.operationName;
console.log(name);
```

### Variables
The `ListRatePlans` query has no variables.
### Return Type
Recall that executing the `ListRatePlans` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListRatePlansData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListRatePlans`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listRatePlans } from '@foratour-erp/dataconnect';


// Call the `listRatePlans()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listRatePlans();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listRatePlans(dataConnect);

console.log(data.ratePlans);

// Or, you can use the `Promise` API.
listRatePlans().then((response) => {
  const data = response.data;
  console.log(data.ratePlans);
});
```

### Using `ListRatePlans`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listRatePlansRef } from '@foratour-erp/dataconnect';


// Call the `listRatePlansRef()` function to get a reference to the query.
const ref = listRatePlansRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listRatePlansRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.ratePlans);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.ratePlans);
});
```

## ListStopSales
You can execute the `ListStopSales` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listStopSales(options?: ExecuteQueryOptions): QueryPromise<ListStopSalesData, undefined>;

interface ListStopSalesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListStopSalesData, undefined>;
}
export const listStopSalesRef: ListStopSalesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listStopSales(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListStopSalesData, undefined>;

interface ListStopSalesRef {
  ...
  (dc: DataConnect): QueryRef<ListStopSalesData, undefined>;
}
export const listStopSalesRef: ListStopSalesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listStopSalesRef:
```typescript
const name = listStopSalesRef.operationName;
console.log(name);
```

### Variables
The `ListStopSales` query has no variables.
### Return Type
Recall that executing the `ListStopSales` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListStopSalesData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListStopSales`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listStopSales } from '@foratour-erp/dataconnect';


// Call the `listStopSales()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listStopSales();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listStopSales(dataConnect);

console.log(data.stopSales);

// Or, you can use the `Promise` API.
listStopSales().then((response) => {
  const data = response.data;
  console.log(data.stopSales);
});
```

### Using `ListStopSales`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listStopSalesRef } from '@foratour-erp/dataconnect';


// Call the `listStopSalesRef()` function to get a reference to the query.
const ref = listStopSalesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listStopSalesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.stopSales);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.stopSales);
});
```

## ListFlightTickets
You can execute the `ListFlightTickets` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listFlightTickets(options?: ExecuteQueryOptions): QueryPromise<ListFlightTicketsData, undefined>;

interface ListFlightTicketsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListFlightTicketsData, undefined>;
}
export const listFlightTicketsRef: ListFlightTicketsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listFlightTickets(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListFlightTicketsData, undefined>;

interface ListFlightTicketsRef {
  ...
  (dc: DataConnect): QueryRef<ListFlightTicketsData, undefined>;
}
export const listFlightTicketsRef: ListFlightTicketsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listFlightTicketsRef:
```typescript
const name = listFlightTicketsRef.operationName;
console.log(name);
```

### Variables
The `ListFlightTickets` query has no variables.
### Return Type
Recall that executing the `ListFlightTickets` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListFlightTicketsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListFlightTickets`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listFlightTickets } from '@foratour-erp/dataconnect';


// Call the `listFlightTickets()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listFlightTickets();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listFlightTickets(dataConnect);

console.log(data.flightTickets);

// Or, you can use the `Promise` API.
listFlightTickets().then((response) => {
  const data = response.data;
  console.log(data.flightTickets);
});
```

### Using `ListFlightTickets`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listFlightTicketsRef } from '@foratour-erp/dataconnect';


// Call the `listFlightTicketsRef()` function to get a reference to the query.
const ref = listFlightTicketsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listFlightTicketsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.flightTickets);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.flightTickets);
});
```

## ListTransferServices
You can execute the `ListTransferServices` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listTransferServices(options?: ExecuteQueryOptions): QueryPromise<ListTransferServicesData, undefined>;

interface ListTransferServicesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTransferServicesData, undefined>;
}
export const listTransferServicesRef: ListTransferServicesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listTransferServices(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListTransferServicesData, undefined>;

interface ListTransferServicesRef {
  ...
  (dc: DataConnect): QueryRef<ListTransferServicesData, undefined>;
}
export const listTransferServicesRef: ListTransferServicesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listTransferServicesRef:
```typescript
const name = listTransferServicesRef.operationName;
console.log(name);
```

### Variables
The `ListTransferServices` query has no variables.
### Return Type
Recall that executing the `ListTransferServices` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListTransferServicesData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListTransferServices`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listTransferServices } from '@foratour-erp/dataconnect';


// Call the `listTransferServices()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listTransferServices();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listTransferServices(dataConnect);

console.log(data.transferServices);

// Or, you can use the `Promise` API.
listTransferServices().then((response) => {
  const data = response.data;
  console.log(data.transferServices);
});
```

### Using `ListTransferServices`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listTransferServicesRef } from '@foratour-erp/dataconnect';


// Call the `listTransferServicesRef()` function to get a reference to the query.
const ref = listTransferServicesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listTransferServicesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.transferServices);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.transferServices);
});
```

## ListFleetVehicles
You can execute the `ListFleetVehicles` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listFleetVehicles(options?: ExecuteQueryOptions): QueryPromise<ListFleetVehiclesData, undefined>;

interface ListFleetVehiclesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListFleetVehiclesData, undefined>;
}
export const listFleetVehiclesRef: ListFleetVehiclesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listFleetVehicles(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListFleetVehiclesData, undefined>;

interface ListFleetVehiclesRef {
  ...
  (dc: DataConnect): QueryRef<ListFleetVehiclesData, undefined>;
}
export const listFleetVehiclesRef: ListFleetVehiclesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listFleetVehiclesRef:
```typescript
const name = listFleetVehiclesRef.operationName;
console.log(name);
```

### Variables
The `ListFleetVehicles` query has no variables.
### Return Type
Recall that executing the `ListFleetVehicles` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListFleetVehiclesData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListFleetVehicles`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listFleetVehicles } from '@foratour-erp/dataconnect';


// Call the `listFleetVehicles()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listFleetVehicles();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listFleetVehicles(dataConnect);

console.log(data.fleetVehicles);

// Or, you can use the `Promise` API.
listFleetVehicles().then((response) => {
  const data = response.data;
  console.log(data.fleetVehicles);
});
```

### Using `ListFleetVehicles`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listFleetVehiclesRef } from '@foratour-erp/dataconnect';


// Call the `listFleetVehiclesRef()` function to get a reference to the query.
const ref = listFleetVehiclesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listFleetVehiclesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.fleetVehicles);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.fleetVehicles);
});
```

## ListFleetDrivers
You can execute the `ListFleetDrivers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listFleetDrivers(options?: ExecuteQueryOptions): QueryPromise<ListFleetDriversData, undefined>;

interface ListFleetDriversRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListFleetDriversData, undefined>;
}
export const listFleetDriversRef: ListFleetDriversRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listFleetDrivers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListFleetDriversData, undefined>;

interface ListFleetDriversRef {
  ...
  (dc: DataConnect): QueryRef<ListFleetDriversData, undefined>;
}
export const listFleetDriversRef: ListFleetDriversRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listFleetDriversRef:
```typescript
const name = listFleetDriversRef.operationName;
console.log(name);
```

### Variables
The `ListFleetDrivers` query has no variables.
### Return Type
Recall that executing the `ListFleetDrivers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListFleetDriversData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListFleetDrivers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listFleetDrivers } from '@foratour-erp/dataconnect';


// Call the `listFleetDrivers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listFleetDrivers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listFleetDrivers(dataConnect);

console.log(data.fleetDrivers);

// Or, you can use the `Promise` API.
listFleetDrivers().then((response) => {
  const data = response.data;
  console.log(data.fleetDrivers);
});
```

### Using `ListFleetDrivers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listFleetDriversRef } from '@foratour-erp/dataconnect';


// Call the `listFleetDriversRef()` function to get a reference to the query.
const ref = listFleetDriversRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listFleetDriversRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.fleetDrivers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.fleetDrivers);
});
```

## ListPayableObligations
You can execute the `ListPayableObligations` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listPayableObligations(options?: ExecuteQueryOptions): QueryPromise<ListPayableObligationsData, undefined>;

interface ListPayableObligationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPayableObligationsData, undefined>;
}
export const listPayableObligationsRef: ListPayableObligationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPayableObligations(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPayableObligationsData, undefined>;

interface ListPayableObligationsRef {
  ...
  (dc: DataConnect): QueryRef<ListPayableObligationsData, undefined>;
}
export const listPayableObligationsRef: ListPayableObligationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPayableObligationsRef:
```typescript
const name = listPayableObligationsRef.operationName;
console.log(name);
```

### Variables
The `ListPayableObligations` query has no variables.
### Return Type
Recall that executing the `ListPayableObligations` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPayableObligationsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListPayableObligations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPayableObligations } from '@foratour-erp/dataconnect';


// Call the `listPayableObligations()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPayableObligations();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPayableObligations(dataConnect);

console.log(data.payableObligations);

// Or, you can use the `Promise` API.
listPayableObligations().then((response) => {
  const data = response.data;
  console.log(data.payableObligations);
});
```

### Using `ListPayableObligations`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPayableObligationsRef } from '@foratour-erp/dataconnect';


// Call the `listPayableObligationsRef()` function to get a reference to the query.
const ref = listPayableObligationsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPayableObligationsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.payableObligations);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.payableObligations);
});
```

## ListProviderStatements
You can execute the `ListProviderStatements` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listProviderStatements(options?: ExecuteQueryOptions): QueryPromise<ListProviderStatementsData, undefined>;

interface ListProviderStatementsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProviderStatementsData, undefined>;
}
export const listProviderStatementsRef: ListProviderStatementsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProviderStatements(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProviderStatementsData, undefined>;

interface ListProviderStatementsRef {
  ...
  (dc: DataConnect): QueryRef<ListProviderStatementsData, undefined>;
}
export const listProviderStatementsRef: ListProviderStatementsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProviderStatementsRef:
```typescript
const name = listProviderStatementsRef.operationName;
console.log(name);
```

### Variables
The `ListProviderStatements` query has no variables.
### Return Type
Recall that executing the `ListProviderStatements` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListProviderStatementsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListProviderStatements`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProviderStatements } from '@foratour-erp/dataconnect';


// Call the `listProviderStatements()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProviderStatements();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProviderStatements(dataConnect);

console.log(data.providerStatements);

// Or, you can use the `Promise` API.
listProviderStatements().then((response) => {
  const data = response.data;
  console.log(data.providerStatements);
});
```

### Using `ListProviderStatements`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProviderStatementsRef } from '@foratour-erp/dataconnect';


// Call the `listProviderStatementsRef()` function to get a reference to the query.
const ref = listProviderStatementsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProviderStatementsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.providerStatements);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.providerStatements);
});
```

## ListExtraServices
You can execute the `ListExtraServices` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listExtraServices(options?: ExecuteQueryOptions): QueryPromise<ListExtraServicesData, undefined>;

interface ListExtraServicesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListExtraServicesData, undefined>;
}
export const listExtraServicesRef: ListExtraServicesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listExtraServices(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListExtraServicesData, undefined>;

interface ListExtraServicesRef {
  ...
  (dc: DataConnect): QueryRef<ListExtraServicesData, undefined>;
}
export const listExtraServicesRef: ListExtraServicesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listExtraServicesRef:
```typescript
const name = listExtraServicesRef.operationName;
console.log(name);
```

### Variables
The `ListExtraServices` query has no variables.
### Return Type
Recall that executing the `ListExtraServices` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListExtraServicesData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListExtraServices`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listExtraServices } from '@foratour-erp/dataconnect';


// Call the `listExtraServices()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listExtraServices();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listExtraServices(dataConnect);

console.log(data.extraServices);

// Or, you can use the `Promise` API.
listExtraServices().then((response) => {
  const data = response.data;
  console.log(data.extraServices);
});
```

### Using `ListExtraServices`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listExtraServicesRef } from '@foratour-erp/dataconnect';


// Call the `listExtraServicesRef()` function to get a reference to the query.
const ref = listExtraServicesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listExtraServicesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.extraServices);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.extraServices);
});
```

## ListServiceRates
You can execute the `ListServiceRates` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listServiceRates(options?: ExecuteQueryOptions): QueryPromise<ListServiceRatesData, undefined>;

interface ListServiceRatesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListServiceRatesData, undefined>;
}
export const listServiceRatesRef: ListServiceRatesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listServiceRates(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListServiceRatesData, undefined>;

interface ListServiceRatesRef {
  ...
  (dc: DataConnect): QueryRef<ListServiceRatesData, undefined>;
}
export const listServiceRatesRef: ListServiceRatesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listServiceRatesRef:
```typescript
const name = listServiceRatesRef.operationName;
console.log(name);
```

### Variables
The `ListServiceRates` query has no variables.
### Return Type
Recall that executing the `ListServiceRates` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListServiceRatesData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListServiceRates`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listServiceRates } from '@foratour-erp/dataconnect';


// Call the `listServiceRates()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listServiceRates();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listServiceRates(dataConnect);

console.log(data.serviceRates);

// Or, you can use the `Promise` API.
listServiceRates().then((response) => {
  const data = response.data;
  console.log(data.serviceRates);
});
```

### Using `ListServiceRates`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listServiceRatesRef } from '@foratour-erp/dataconnect';


// Call the `listServiceRatesRef()` function to get a reference to the query.
const ref = listServiceRatesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listServiceRatesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.serviceRates);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.serviceRates);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `foratour-erp-connector` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## InsertPaymentVoucher
You can execute the `InsertPaymentVoucher` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertPaymentVoucher(vars: InsertPaymentVoucherVariables): MutationPromise<InsertPaymentVoucherData, InsertPaymentVoucherVariables>;

interface InsertPaymentVoucherRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertPaymentVoucherVariables): MutationRef<InsertPaymentVoucherData, InsertPaymentVoucherVariables>;
}
export const insertPaymentVoucherRef: InsertPaymentVoucherRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertPaymentVoucher(dc: DataConnect, vars: InsertPaymentVoucherVariables): MutationPromise<InsertPaymentVoucherData, InsertPaymentVoucherVariables>;

interface InsertPaymentVoucherRef {
  ...
  (dc: DataConnect, vars: InsertPaymentVoucherVariables): MutationRef<InsertPaymentVoucherData, InsertPaymentVoucherVariables>;
}
export const insertPaymentVoucherRef: InsertPaymentVoucherRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertPaymentVoucherRef:
```typescript
const name = insertPaymentVoucherRef.operationName;
console.log(name);
```

### Variables
The `InsertPaymentVoucher` mutation requires an argument of type `InsertPaymentVoucherVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertPaymentVoucher` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertPaymentVoucherData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertPaymentVoucherData {
  paymentVoucher_insert: PaymentVoucher_Key;
}
```
### Using `InsertPaymentVoucher`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertPaymentVoucher, InsertPaymentVoucherVariables } from '@foratour-erp/dataconnect';

// The `InsertPaymentVoucher` mutation requires an argument of type `InsertPaymentVoucherVariables`:
const insertPaymentVoucherVars: InsertPaymentVoucherVariables = {
  id: ..., 
  clientId: ..., 
  clientName: ..., 
  invoiceId: ..., // optional
  locatorId: ..., // optional
  method: ..., 
  reference: ..., 
  amount: ..., 
  date: ..., 
  status: ..., 
  bankName: ..., // optional
  notes: ..., // optional
  attachedFile: ..., // optional
};

// Call the `insertPaymentVoucher()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertPaymentVoucher(insertPaymentVoucherVars);
// Variables can be defined inline as well.
const { data } = await insertPaymentVoucher({ id: ..., clientId: ..., clientName: ..., invoiceId: ..., locatorId: ..., method: ..., reference: ..., amount: ..., date: ..., status: ..., bankName: ..., notes: ..., attachedFile: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertPaymentVoucher(dataConnect, insertPaymentVoucherVars);

console.log(data.paymentVoucher_insert);

// Or, you can use the `Promise` API.
insertPaymentVoucher(insertPaymentVoucherVars).then((response) => {
  const data = response.data;
  console.log(data.paymentVoucher_insert);
});
```

### Using `InsertPaymentVoucher`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertPaymentVoucherRef, InsertPaymentVoucherVariables } from '@foratour-erp/dataconnect';

// The `InsertPaymentVoucher` mutation requires an argument of type `InsertPaymentVoucherVariables`:
const insertPaymentVoucherVars: InsertPaymentVoucherVariables = {
  id: ..., 
  clientId: ..., 
  clientName: ..., 
  invoiceId: ..., // optional
  locatorId: ..., // optional
  method: ..., 
  reference: ..., 
  amount: ..., 
  date: ..., 
  status: ..., 
  bankName: ..., // optional
  notes: ..., // optional
  attachedFile: ..., // optional
};

// Call the `insertPaymentVoucherRef()` function to get a reference to the mutation.
const ref = insertPaymentVoucherRef(insertPaymentVoucherVars);
// Variables can be defined inline as well.
const ref = insertPaymentVoucherRef({ id: ..., clientId: ..., clientName: ..., invoiceId: ..., locatorId: ..., method: ..., reference: ..., amount: ..., date: ..., status: ..., bankName: ..., notes: ..., attachedFile: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertPaymentVoucherRef(dataConnect, insertPaymentVoucherVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.paymentVoucher_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.paymentVoucher_insert);
});
```

## UpdatePaymentVoucher
You can execute the `UpdatePaymentVoucher` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updatePaymentVoucher(vars: UpdatePaymentVoucherVariables): MutationPromise<UpdatePaymentVoucherData, UpdatePaymentVoucherVariables>;

interface UpdatePaymentVoucherRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePaymentVoucherVariables): MutationRef<UpdatePaymentVoucherData, UpdatePaymentVoucherVariables>;
}
export const updatePaymentVoucherRef: UpdatePaymentVoucherRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updatePaymentVoucher(dc: DataConnect, vars: UpdatePaymentVoucherVariables): MutationPromise<UpdatePaymentVoucherData, UpdatePaymentVoucherVariables>;

interface UpdatePaymentVoucherRef {
  ...
  (dc: DataConnect, vars: UpdatePaymentVoucherVariables): MutationRef<UpdatePaymentVoucherData, UpdatePaymentVoucherVariables>;
}
export const updatePaymentVoucherRef: UpdatePaymentVoucherRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updatePaymentVoucherRef:
```typescript
const name = updatePaymentVoucherRef.operationName;
console.log(name);
```

### Variables
The `UpdatePaymentVoucher` mutation requires an argument of type `UpdatePaymentVoucherVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdatePaymentVoucherVariables {
  id: string;
  status: string;
}
```
### Return Type
Recall that executing the `UpdatePaymentVoucher` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdatePaymentVoucherData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdatePaymentVoucherData {
  paymentVoucher_update?: PaymentVoucher_Key | null;
}
```
### Using `UpdatePaymentVoucher`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updatePaymentVoucher, UpdatePaymentVoucherVariables } from '@foratour-erp/dataconnect';

// The `UpdatePaymentVoucher` mutation requires an argument of type `UpdatePaymentVoucherVariables`:
const updatePaymentVoucherVars: UpdatePaymentVoucherVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updatePaymentVoucher()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updatePaymentVoucher(updatePaymentVoucherVars);
// Variables can be defined inline as well.
const { data } = await updatePaymentVoucher({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updatePaymentVoucher(dataConnect, updatePaymentVoucherVars);

console.log(data.paymentVoucher_update);

// Or, you can use the `Promise` API.
updatePaymentVoucher(updatePaymentVoucherVars).then((response) => {
  const data = response.data;
  console.log(data.paymentVoucher_update);
});
```

### Using `UpdatePaymentVoucher`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updatePaymentVoucherRef, UpdatePaymentVoucherVariables } from '@foratour-erp/dataconnect';

// The `UpdatePaymentVoucher` mutation requires an argument of type `UpdatePaymentVoucherVariables`:
const updatePaymentVoucherVars: UpdatePaymentVoucherVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updatePaymentVoucherRef()` function to get a reference to the mutation.
const ref = updatePaymentVoucherRef(updatePaymentVoucherVars);
// Variables can be defined inline as well.
const ref = updatePaymentVoucherRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updatePaymentVoucherRef(dataConnect, updatePaymentVoucherVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.paymentVoucher_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.paymentVoucher_update);
});
```

## InsertReservation
You can execute the `InsertReservation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertReservation(vars: InsertReservationVariables): MutationPromise<InsertReservationData, InsertReservationVariables>;

interface InsertReservationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertReservationVariables): MutationRef<InsertReservationData, InsertReservationVariables>;
}
export const insertReservationRef: InsertReservationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertReservation(dc: DataConnect, vars: InsertReservationVariables): MutationPromise<InsertReservationData, InsertReservationVariables>;

interface InsertReservationRef {
  ...
  (dc: DataConnect, vars: InsertReservationVariables): MutationRef<InsertReservationData, InsertReservationVariables>;
}
export const insertReservationRef: InsertReservationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertReservationRef:
```typescript
const name = insertReservationRef.operationName;
console.log(name);
```

### Variables
The `InsertReservation` mutation requires an argument of type `InsertReservationVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertReservation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertReservationData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertReservationData {
  reservation_insert: Reservation_Key;
}
```
### Using `InsertReservation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertReservation, InsertReservationVariables } from '@foratour-erp/dataconnect';

// The `InsertReservation` mutation requires an argument of type `InsertReservationVariables`:
const insertReservationVars: InsertReservationVariables = {
  id: ..., 
  holder: ..., 
  hotelName: ..., 
  checkIn: ..., 
  checkOut: ..., 
  pax: ..., 
  status: ..., 
  totalPrice: ..., 
  netPrice: ..., 
  agenciaName: ..., // optional
  tipo: ..., // optional
  servicios: ..., // optional
  telefono: ..., // optional
  email: ..., // optional
  flightNo: ..., // optional
  specialRequests: ..., // optional
  mercado: ..., // optional
  createdAt: ..., // optional
  comprobanteRef: ..., // optional
  comprobanteMonto: ..., // optional
  comprobanteMetodo: ..., // optional
  facturacionTipo: ..., // optional
  facturacionRechazoMotivo: ..., // optional
  facturacionRechazoArchivos: ..., // optional
  variaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertReservation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertReservation(insertReservationVars);
// Variables can be defined inline as well.
const { data } = await insertReservation({ id: ..., holder: ..., hotelName: ..., checkIn: ..., checkOut: ..., pax: ..., status: ..., totalPrice: ..., netPrice: ..., agenciaName: ..., tipo: ..., servicios: ..., telefono: ..., email: ..., flightNo: ..., specialRequests: ..., mercado: ..., createdAt: ..., comprobanteRef: ..., comprobanteMonto: ..., comprobanteMetodo: ..., facturacionTipo: ..., facturacionRechazoMotivo: ..., facturacionRechazoArchivos: ..., variaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertReservation(dataConnect, insertReservationVars);

console.log(data.reservation_insert);

// Or, you can use the `Promise` API.
insertReservation(insertReservationVars).then((response) => {
  const data = response.data;
  console.log(data.reservation_insert);
});
```

### Using `InsertReservation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertReservationRef, InsertReservationVariables } from '@foratour-erp/dataconnect';

// The `InsertReservation` mutation requires an argument of type `InsertReservationVariables`:
const insertReservationVars: InsertReservationVariables = {
  id: ..., 
  holder: ..., 
  hotelName: ..., 
  checkIn: ..., 
  checkOut: ..., 
  pax: ..., 
  status: ..., 
  totalPrice: ..., 
  netPrice: ..., 
  agenciaName: ..., // optional
  tipo: ..., // optional
  servicios: ..., // optional
  telefono: ..., // optional
  email: ..., // optional
  flightNo: ..., // optional
  specialRequests: ..., // optional
  mercado: ..., // optional
  createdAt: ..., // optional
  comprobanteRef: ..., // optional
  comprobanteMonto: ..., // optional
  comprobanteMetodo: ..., // optional
  facturacionTipo: ..., // optional
  facturacionRechazoMotivo: ..., // optional
  facturacionRechazoArchivos: ..., // optional
  variaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertReservationRef()` function to get a reference to the mutation.
const ref = insertReservationRef(insertReservationVars);
// Variables can be defined inline as well.
const ref = insertReservationRef({ id: ..., holder: ..., hotelName: ..., checkIn: ..., checkOut: ..., pax: ..., status: ..., totalPrice: ..., netPrice: ..., agenciaName: ..., tipo: ..., servicios: ..., telefono: ..., email: ..., flightNo: ..., specialRequests: ..., mercado: ..., createdAt: ..., comprobanteRef: ..., comprobanteMonto: ..., comprobanteMetodo: ..., facturacionTipo: ..., facturacionRechazoMotivo: ..., facturacionRechazoArchivos: ..., variaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertReservationRef(dataConnect, insertReservationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.reservation_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.reservation_insert);
});
```

## UpdateReservationStatus
You can execute the `UpdateReservationStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateReservationStatus(vars: UpdateReservationStatusVariables): MutationPromise<UpdateReservationStatusData, UpdateReservationStatusVariables>;

interface UpdateReservationStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateReservationStatusVariables): MutationRef<UpdateReservationStatusData, UpdateReservationStatusVariables>;
}
export const updateReservationStatusRef: UpdateReservationStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateReservationStatus(dc: DataConnect, vars: UpdateReservationStatusVariables): MutationPromise<UpdateReservationStatusData, UpdateReservationStatusVariables>;

interface UpdateReservationStatusRef {
  ...
  (dc: DataConnect, vars: UpdateReservationStatusVariables): MutationRef<UpdateReservationStatusData, UpdateReservationStatusVariables>;
}
export const updateReservationStatusRef: UpdateReservationStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateReservationStatusRef:
```typescript
const name = updateReservationStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateReservationStatus` mutation requires an argument of type `UpdateReservationStatusVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateReservationStatusVariables {
  id: string;
  status: string;
  updatedAt?: string | null;
}
```
### Return Type
Recall that executing the `UpdateReservationStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateReservationStatusData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateReservationStatusData {
  reservation_update?: Reservation_Key | null;
}
```
### Using `UpdateReservationStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateReservationStatus, UpdateReservationStatusVariables } from '@foratour-erp/dataconnect';

// The `UpdateReservationStatus` mutation requires an argument of type `UpdateReservationStatusVariables`:
const updateReservationStatusVars: UpdateReservationStatusVariables = {
  id: ..., 
  status: ..., 
  updatedAt: ..., // optional
};

// Call the `updateReservationStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateReservationStatus(updateReservationStatusVars);
// Variables can be defined inline as well.
const { data } = await updateReservationStatus({ id: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateReservationStatus(dataConnect, updateReservationStatusVars);

console.log(data.reservation_update);

// Or, you can use the `Promise` API.
updateReservationStatus(updateReservationStatusVars).then((response) => {
  const data = response.data;
  console.log(data.reservation_update);
});
```

### Using `UpdateReservationStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateReservationStatusRef, UpdateReservationStatusVariables } from '@foratour-erp/dataconnect';

// The `UpdateReservationStatus` mutation requires an argument of type `UpdateReservationStatusVariables`:
const updateReservationStatusVars: UpdateReservationStatusVariables = {
  id: ..., 
  status: ..., 
  updatedAt: ..., // optional
};

// Call the `updateReservationStatusRef()` function to get a reference to the mutation.
const ref = updateReservationStatusRef(updateReservationStatusVars);
// Variables can be defined inline as well.
const ref = updateReservationStatusRef({ id: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateReservationStatusRef(dataConnect, updateReservationStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.reservation_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.reservation_update);
});
```

## UpdateReservation
You can execute the `UpdateReservation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateReservation(vars: UpdateReservationVariables): MutationPromise<UpdateReservationData, UpdateReservationVariables>;

interface UpdateReservationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateReservationVariables): MutationRef<UpdateReservationData, UpdateReservationVariables>;
}
export const updateReservationRef: UpdateReservationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateReservation(dc: DataConnect, vars: UpdateReservationVariables): MutationPromise<UpdateReservationData, UpdateReservationVariables>;

interface UpdateReservationRef {
  ...
  (dc: DataConnect, vars: UpdateReservationVariables): MutationRef<UpdateReservationData, UpdateReservationVariables>;
}
export const updateReservationRef: UpdateReservationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateReservationRef:
```typescript
const name = updateReservationRef.operationName;
console.log(name);
```

### Variables
The `UpdateReservation` mutation requires an argument of type `UpdateReservationVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateReservation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateReservationData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateReservationData {
  reservation_update?: Reservation_Key | null;
}
```
### Using `UpdateReservation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateReservation, UpdateReservationVariables } from '@foratour-erp/dataconnect';

// The `UpdateReservation` mutation requires an argument of type `UpdateReservationVariables`:
const updateReservationVars: UpdateReservationVariables = {
  id: ..., 
  holder: ..., // optional
  hotelName: ..., // optional
  checkIn: ..., // optional
  checkOut: ..., // optional
  pax: ..., // optional
  status: ..., // optional
  totalPrice: ..., // optional
  netPrice: ..., // optional
  agenciaName: ..., // optional
  tipo: ..., // optional
  servicios: ..., // optional
  telefono: ..., // optional
  email: ..., // optional
  flightNo: ..., // optional
  specialRequests: ..., // optional
  mercado: ..., // optional
  createdAt: ..., // optional
  comprobanteRef: ..., // optional
  comprobanteMonto: ..., // optional
  comprobanteMetodo: ..., // optional
  facturacionTipo: ..., // optional
  facturacionRechazoMotivo: ..., // optional
  facturacionRechazoArchivos: ..., // optional
  variaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateReservation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateReservation(updateReservationVars);
// Variables can be defined inline as well.
const { data } = await updateReservation({ id: ..., holder: ..., hotelName: ..., checkIn: ..., checkOut: ..., pax: ..., status: ..., totalPrice: ..., netPrice: ..., agenciaName: ..., tipo: ..., servicios: ..., telefono: ..., email: ..., flightNo: ..., specialRequests: ..., mercado: ..., createdAt: ..., comprobanteRef: ..., comprobanteMonto: ..., comprobanteMetodo: ..., facturacionTipo: ..., facturacionRechazoMotivo: ..., facturacionRechazoArchivos: ..., variaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateReservation(dataConnect, updateReservationVars);

console.log(data.reservation_update);

// Or, you can use the `Promise` API.
updateReservation(updateReservationVars).then((response) => {
  const data = response.data;
  console.log(data.reservation_update);
});
```

### Using `UpdateReservation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateReservationRef, UpdateReservationVariables } from '@foratour-erp/dataconnect';

// The `UpdateReservation` mutation requires an argument of type `UpdateReservationVariables`:
const updateReservationVars: UpdateReservationVariables = {
  id: ..., 
  holder: ..., // optional
  hotelName: ..., // optional
  checkIn: ..., // optional
  checkOut: ..., // optional
  pax: ..., // optional
  status: ..., // optional
  totalPrice: ..., // optional
  netPrice: ..., // optional
  agenciaName: ..., // optional
  tipo: ..., // optional
  servicios: ..., // optional
  telefono: ..., // optional
  email: ..., // optional
  flightNo: ..., // optional
  specialRequests: ..., // optional
  mercado: ..., // optional
  createdAt: ..., // optional
  comprobanteRef: ..., // optional
  comprobanteMonto: ..., // optional
  comprobanteMetodo: ..., // optional
  facturacionTipo: ..., // optional
  facturacionRechazoMotivo: ..., // optional
  facturacionRechazoArchivos: ..., // optional
  variaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateReservationRef()` function to get a reference to the mutation.
const ref = updateReservationRef(updateReservationVars);
// Variables can be defined inline as well.
const ref = updateReservationRef({ id: ..., holder: ..., hotelName: ..., checkIn: ..., checkOut: ..., pax: ..., status: ..., totalPrice: ..., netPrice: ..., agenciaName: ..., tipo: ..., servicios: ..., telefono: ..., email: ..., flightNo: ..., specialRequests: ..., mercado: ..., createdAt: ..., comprobanteRef: ..., comprobanteMonto: ..., comprobanteMetodo: ..., facturacionTipo: ..., facturacionRechazoMotivo: ..., facturacionRechazoArchivos: ..., variaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateReservationRef(dataConnect, updateReservationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.reservation_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.reservation_update);
});
```

## InsertClient
You can execute the `InsertClient` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertClient(vars: InsertClientVariables): MutationPromise<InsertClientData, InsertClientVariables>;

interface InsertClientRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertClientVariables): MutationRef<InsertClientData, InsertClientVariables>;
}
export const insertClientRef: InsertClientRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertClient(dc: DataConnect, vars: InsertClientVariables): MutationPromise<InsertClientData, InsertClientVariables>;

interface InsertClientRef {
  ...
  (dc: DataConnect, vars: InsertClientVariables): MutationRef<InsertClientData, InsertClientVariables>;
}
export const insertClientRef: InsertClientRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertClientRef:
```typescript
const name = insertClientRef.operationName;
console.log(name);
```

### Variables
The `InsertClient` mutation requires an argument of type `InsertClientVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertClient` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertClientData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertClientData {
  b2BClient_insert: B2BClient_Key;
}
```
### Using `InsertClient`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertClient, InsertClientVariables } from '@foratour-erp/dataconnect';

// The `InsertClient` mutation requires an argument of type `InsertClientVariables`:
const insertClientVars: InsertClientVariables = {
  id: ..., 
  nombre: ..., 
  rif: ..., 
  tipo: ..., 
  status: ..., 
  contactoNombre: ..., 
  email: ..., 
  telefono: ..., 
  saldoFavor: ..., 
  saldoDeber: ..., 
  moroso: ..., 
  limiteCredito: ..., // optional
  diasCredito: ..., // optional
  observaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertClient()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertClient(insertClientVars);
// Variables can be defined inline as well.
const { data } = await insertClient({ id: ..., nombre: ..., rif: ..., tipo: ..., status: ..., contactoNombre: ..., email: ..., telefono: ..., saldoFavor: ..., saldoDeber: ..., moroso: ..., limiteCredito: ..., diasCredito: ..., observaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertClient(dataConnect, insertClientVars);

console.log(data.b2BClient_insert);

// Or, you can use the `Promise` API.
insertClient(insertClientVars).then((response) => {
  const data = response.data;
  console.log(data.b2BClient_insert);
});
```

### Using `InsertClient`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertClientRef, InsertClientVariables } from '@foratour-erp/dataconnect';

// The `InsertClient` mutation requires an argument of type `InsertClientVariables`:
const insertClientVars: InsertClientVariables = {
  id: ..., 
  nombre: ..., 
  rif: ..., 
  tipo: ..., 
  status: ..., 
  contactoNombre: ..., 
  email: ..., 
  telefono: ..., 
  saldoFavor: ..., 
  saldoDeber: ..., 
  moroso: ..., 
  limiteCredito: ..., // optional
  diasCredito: ..., // optional
  observaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertClientRef()` function to get a reference to the mutation.
const ref = insertClientRef(insertClientVars);
// Variables can be defined inline as well.
const ref = insertClientRef({ id: ..., nombre: ..., rif: ..., tipo: ..., status: ..., contactoNombre: ..., email: ..., telefono: ..., saldoFavor: ..., saldoDeber: ..., moroso: ..., limiteCredito: ..., diasCredito: ..., observaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertClientRef(dataConnect, insertClientVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.b2BClient_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.b2BClient_insert);
});
```

## InsertInvoice
You can execute the `InsertInvoice` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertInvoice(vars: InsertInvoiceVariables): MutationPromise<InsertInvoiceData, InsertInvoiceVariables>;

interface InsertInvoiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertInvoiceVariables): MutationRef<InsertInvoiceData, InsertInvoiceVariables>;
}
export const insertInvoiceRef: InsertInvoiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertInvoice(dc: DataConnect, vars: InsertInvoiceVariables): MutationPromise<InsertInvoiceData, InsertInvoiceVariables>;

interface InsertInvoiceRef {
  ...
  (dc: DataConnect, vars: InsertInvoiceVariables): MutationRef<InsertInvoiceData, InsertInvoiceVariables>;
}
export const insertInvoiceRef: InsertInvoiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertInvoiceRef:
```typescript
const name = insertInvoiceRef.operationName;
console.log(name);
```

### Variables
The `InsertInvoice` mutation requires an argument of type `InsertInvoiceVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertInvoice` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertInvoiceData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertInvoiceData {
  financialInvoice_insert: FinancialInvoice_Key;
}
```
### Using `InsertInvoice`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertInvoice, InsertInvoiceVariables } from '@foratour-erp/dataconnect';

// The `InsertInvoice` mutation requires an argument of type `InsertInvoiceVariables`:
const insertInvoiceVars: InsertInvoiceVariables = {
  id: ..., 
  clientName: ..., 
  date: ..., 
  dueDate: ..., 
  amount: ..., 
  vatAmount: ..., 
  type: ..., 
  status: ..., 
  updatedAt: ..., // optional
};

// Call the `insertInvoice()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertInvoice(insertInvoiceVars);
// Variables can be defined inline as well.
const { data } = await insertInvoice({ id: ..., clientName: ..., date: ..., dueDate: ..., amount: ..., vatAmount: ..., type: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertInvoice(dataConnect, insertInvoiceVars);

console.log(data.financialInvoice_insert);

// Or, you can use the `Promise` API.
insertInvoice(insertInvoiceVars).then((response) => {
  const data = response.data;
  console.log(data.financialInvoice_insert);
});
```

### Using `InsertInvoice`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertInvoiceRef, InsertInvoiceVariables } from '@foratour-erp/dataconnect';

// The `InsertInvoice` mutation requires an argument of type `InsertInvoiceVariables`:
const insertInvoiceVars: InsertInvoiceVariables = {
  id: ..., 
  clientName: ..., 
  date: ..., 
  dueDate: ..., 
  amount: ..., 
  vatAmount: ..., 
  type: ..., 
  status: ..., 
  updatedAt: ..., // optional
};

// Call the `insertInvoiceRef()` function to get a reference to the mutation.
const ref = insertInvoiceRef(insertInvoiceVars);
// Variables can be defined inline as well.
const ref = insertInvoiceRef({ id: ..., clientName: ..., date: ..., dueDate: ..., amount: ..., vatAmount: ..., type: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertInvoiceRef(dataConnect, insertInvoiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.financialInvoice_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.financialInvoice_insert);
});
```

## InsertDetailedProperty
You can execute the `InsertDetailedProperty` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertDetailedProperty(vars: InsertDetailedPropertyVariables): MutationPromise<InsertDetailedPropertyData, InsertDetailedPropertyVariables>;

interface InsertDetailedPropertyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertDetailedPropertyVariables): MutationRef<InsertDetailedPropertyData, InsertDetailedPropertyVariables>;
}
export const insertDetailedPropertyRef: InsertDetailedPropertyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertDetailedProperty(dc: DataConnect, vars: InsertDetailedPropertyVariables): MutationPromise<InsertDetailedPropertyData, InsertDetailedPropertyVariables>;

interface InsertDetailedPropertyRef {
  ...
  (dc: DataConnect, vars: InsertDetailedPropertyVariables): MutationRef<InsertDetailedPropertyData, InsertDetailedPropertyVariables>;
}
export const insertDetailedPropertyRef: InsertDetailedPropertyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertDetailedPropertyRef:
```typescript
const name = insertDetailedPropertyRef.operationName;
console.log(name);
```

### Variables
The `InsertDetailedProperty` mutation requires an argument of type `InsertDetailedPropertyVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertDetailedProperty` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertDetailedPropertyData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertDetailedPropertyData {
  detailedProperty_insert: DetailedProperty_Key;
}
```
### Using `InsertDetailedProperty`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertDetailedProperty, InsertDetailedPropertyVariables } from '@foratour-erp/dataconnect';

// The `InsertDetailedProperty` mutation requires an argument of type `InsertDetailedPropertyVariables`:
const insertDetailedPropertyVars: InsertDetailedPropertyVariables = {
  id: ..., 
  nombre: ..., 
  pais: ..., 
  estado: ..., 
  ciudad: ..., 
  categoria: ..., 
  status: ..., 
  politicasGenerales: ..., 
  imagen: ..., // optional
  supplierName: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertDetailedProperty()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertDetailedProperty(insertDetailedPropertyVars);
// Variables can be defined inline as well.
const { data } = await insertDetailedProperty({ id: ..., nombre: ..., pais: ..., estado: ..., ciudad: ..., categoria: ..., status: ..., politicasGenerales: ..., imagen: ..., supplierName: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertDetailedProperty(dataConnect, insertDetailedPropertyVars);

console.log(data.detailedProperty_insert);

// Or, you can use the `Promise` API.
insertDetailedProperty(insertDetailedPropertyVars).then((response) => {
  const data = response.data;
  console.log(data.detailedProperty_insert);
});
```

### Using `InsertDetailedProperty`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertDetailedPropertyRef, InsertDetailedPropertyVariables } from '@foratour-erp/dataconnect';

// The `InsertDetailedProperty` mutation requires an argument of type `InsertDetailedPropertyVariables`:
const insertDetailedPropertyVars: InsertDetailedPropertyVariables = {
  id: ..., 
  nombre: ..., 
  pais: ..., 
  estado: ..., 
  ciudad: ..., 
  categoria: ..., 
  status: ..., 
  politicasGenerales: ..., 
  imagen: ..., // optional
  supplierName: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertDetailedPropertyRef()` function to get a reference to the mutation.
const ref = insertDetailedPropertyRef(insertDetailedPropertyVars);
// Variables can be defined inline as well.
const ref = insertDetailedPropertyRef({ id: ..., nombre: ..., pais: ..., estado: ..., ciudad: ..., categoria: ..., status: ..., politicasGenerales: ..., imagen: ..., supplierName: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertDetailedPropertyRef(dataConnect, insertDetailedPropertyVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.detailedProperty_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.detailedProperty_insert);
});
```

## UpdateDetailedProperty
You can execute the `UpdateDetailedProperty` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateDetailedProperty(vars: UpdateDetailedPropertyVariables): MutationPromise<UpdateDetailedPropertyData, UpdateDetailedPropertyVariables>;

interface UpdateDetailedPropertyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDetailedPropertyVariables): MutationRef<UpdateDetailedPropertyData, UpdateDetailedPropertyVariables>;
}
export const updateDetailedPropertyRef: UpdateDetailedPropertyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateDetailedProperty(dc: DataConnect, vars: UpdateDetailedPropertyVariables): MutationPromise<UpdateDetailedPropertyData, UpdateDetailedPropertyVariables>;

interface UpdateDetailedPropertyRef {
  ...
  (dc: DataConnect, vars: UpdateDetailedPropertyVariables): MutationRef<UpdateDetailedPropertyData, UpdateDetailedPropertyVariables>;
}
export const updateDetailedPropertyRef: UpdateDetailedPropertyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateDetailedPropertyRef:
```typescript
const name = updateDetailedPropertyRef.operationName;
console.log(name);
```

### Variables
The `UpdateDetailedProperty` mutation requires an argument of type `UpdateDetailedPropertyVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateDetailedProperty` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateDetailedPropertyData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateDetailedPropertyData {
  detailedProperty_update?: DetailedProperty_Key | null;
}
```
### Using `UpdateDetailedProperty`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateDetailedProperty, UpdateDetailedPropertyVariables } from '@foratour-erp/dataconnect';

// The `UpdateDetailedProperty` mutation requires an argument of type `UpdateDetailedPropertyVariables`:
const updateDetailedPropertyVars: UpdateDetailedPropertyVariables = {
  id: ..., 
  nombre: ..., // optional
  pais: ..., // optional
  estado: ..., // optional
  ciudad: ..., // optional
  categoria: ..., // optional
  status: ..., // optional
  politicasGenerales: ..., // optional
  imagen: ..., // optional
  supplierName: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateDetailedProperty()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateDetailedProperty(updateDetailedPropertyVars);
// Variables can be defined inline as well.
const { data } = await updateDetailedProperty({ id: ..., nombre: ..., pais: ..., estado: ..., ciudad: ..., categoria: ..., status: ..., politicasGenerales: ..., imagen: ..., supplierName: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateDetailedProperty(dataConnect, updateDetailedPropertyVars);

console.log(data.detailedProperty_update);

// Or, you can use the `Promise` API.
updateDetailedProperty(updateDetailedPropertyVars).then((response) => {
  const data = response.data;
  console.log(data.detailedProperty_update);
});
```

### Using `UpdateDetailedProperty`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateDetailedPropertyRef, UpdateDetailedPropertyVariables } from '@foratour-erp/dataconnect';

// The `UpdateDetailedProperty` mutation requires an argument of type `UpdateDetailedPropertyVariables`:
const updateDetailedPropertyVars: UpdateDetailedPropertyVariables = {
  id: ..., 
  nombre: ..., // optional
  pais: ..., // optional
  estado: ..., // optional
  ciudad: ..., // optional
  categoria: ..., // optional
  status: ..., // optional
  politicasGenerales: ..., // optional
  imagen: ..., // optional
  supplierName: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateDetailedPropertyRef()` function to get a reference to the mutation.
const ref = updateDetailedPropertyRef(updateDetailedPropertyVars);
// Variables can be defined inline as well.
const ref = updateDetailedPropertyRef({ id: ..., nombre: ..., pais: ..., estado: ..., ciudad: ..., categoria: ..., status: ..., politicasGenerales: ..., imagen: ..., supplierName: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateDetailedPropertyRef(dataConnect, updateDetailedPropertyVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.detailedProperty_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.detailedProperty_update);
});
```

## InsertRoomType
You can execute the `InsertRoomType` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertRoomType(vars: InsertRoomTypeVariables): MutationPromise<InsertRoomTypeData, InsertRoomTypeVariables>;

interface InsertRoomTypeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertRoomTypeVariables): MutationRef<InsertRoomTypeData, InsertRoomTypeVariables>;
}
export const insertRoomTypeRef: InsertRoomTypeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertRoomType(dc: DataConnect, vars: InsertRoomTypeVariables): MutationPromise<InsertRoomTypeData, InsertRoomTypeVariables>;

interface InsertRoomTypeRef {
  ...
  (dc: DataConnect, vars: InsertRoomTypeVariables): MutationRef<InsertRoomTypeData, InsertRoomTypeVariables>;
}
export const insertRoomTypeRef: InsertRoomTypeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertRoomTypeRef:
```typescript
const name = insertRoomTypeRef.operationName;
console.log(name);
```

### Variables
The `InsertRoomType` mutation requires an argument of type `InsertRoomTypeVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertRoomTypeVariables {
  id: string;
  propertyId: string;
  nombre: string;
  regimenAlimentacion: string;
  capacidadMax: number;
  ocupacionBase?: number | null;
  updatedAt?: string | null;
}
```
### Return Type
Recall that executing the `InsertRoomType` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertRoomTypeData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertRoomTypeData {
  roomType_insert: RoomType_Key;
}
```
### Using `InsertRoomType`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertRoomType, InsertRoomTypeVariables } from '@foratour-erp/dataconnect';

// The `InsertRoomType` mutation requires an argument of type `InsertRoomTypeVariables`:
const insertRoomTypeVars: InsertRoomTypeVariables = {
  id: ..., 
  propertyId: ..., 
  nombre: ..., 
  regimenAlimentacion: ..., 
  capacidadMax: ..., 
  ocupacionBase: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertRoomType()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertRoomType(insertRoomTypeVars);
// Variables can be defined inline as well.
const { data } = await insertRoomType({ id: ..., propertyId: ..., nombre: ..., regimenAlimentacion: ..., capacidadMax: ..., ocupacionBase: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertRoomType(dataConnect, insertRoomTypeVars);

console.log(data.roomType_insert);

// Or, you can use the `Promise` API.
insertRoomType(insertRoomTypeVars).then((response) => {
  const data = response.data;
  console.log(data.roomType_insert);
});
```

### Using `InsertRoomType`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertRoomTypeRef, InsertRoomTypeVariables } from '@foratour-erp/dataconnect';

// The `InsertRoomType` mutation requires an argument of type `InsertRoomTypeVariables`:
const insertRoomTypeVars: InsertRoomTypeVariables = {
  id: ..., 
  propertyId: ..., 
  nombre: ..., 
  regimenAlimentacion: ..., 
  capacidadMax: ..., 
  ocupacionBase: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertRoomTypeRef()` function to get a reference to the mutation.
const ref = insertRoomTypeRef(insertRoomTypeVars);
// Variables can be defined inline as well.
const ref = insertRoomTypeRef({ id: ..., propertyId: ..., nombre: ..., regimenAlimentacion: ..., capacidadMax: ..., ocupacionBase: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertRoomTypeRef(dataConnect, insertRoomTypeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.roomType_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.roomType_insert);
});
```

## UpdateRoomType
You can execute the `UpdateRoomType` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateRoomType(vars: UpdateRoomTypeVariables): MutationPromise<UpdateRoomTypeData, UpdateRoomTypeVariables>;

interface UpdateRoomTypeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRoomTypeVariables): MutationRef<UpdateRoomTypeData, UpdateRoomTypeVariables>;
}
export const updateRoomTypeRef: UpdateRoomTypeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateRoomType(dc: DataConnect, vars: UpdateRoomTypeVariables): MutationPromise<UpdateRoomTypeData, UpdateRoomTypeVariables>;

interface UpdateRoomTypeRef {
  ...
  (dc: DataConnect, vars: UpdateRoomTypeVariables): MutationRef<UpdateRoomTypeData, UpdateRoomTypeVariables>;
}
export const updateRoomTypeRef: UpdateRoomTypeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateRoomTypeRef:
```typescript
const name = updateRoomTypeRef.operationName;
console.log(name);
```

### Variables
The `UpdateRoomType` mutation requires an argument of type `UpdateRoomTypeVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateRoomTypeVariables {
  id: string;
  propertyId?: string | null;
  nombre?: string | null;
  regimenAlimentacion?: string | null;
  capacidadMax?: number | null;
  ocupacionBase?: number | null;
  updatedAt?: string | null;
}
```
### Return Type
Recall that executing the `UpdateRoomType` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateRoomTypeData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateRoomTypeData {
  roomType_update?: RoomType_Key | null;
}
```
### Using `UpdateRoomType`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateRoomType, UpdateRoomTypeVariables } from '@foratour-erp/dataconnect';

// The `UpdateRoomType` mutation requires an argument of type `UpdateRoomTypeVariables`:
const updateRoomTypeVars: UpdateRoomTypeVariables = {
  id: ..., 
  propertyId: ..., // optional
  nombre: ..., // optional
  regimenAlimentacion: ..., // optional
  capacidadMax: ..., // optional
  ocupacionBase: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateRoomType()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateRoomType(updateRoomTypeVars);
// Variables can be defined inline as well.
const { data } = await updateRoomType({ id: ..., propertyId: ..., nombre: ..., regimenAlimentacion: ..., capacidadMax: ..., ocupacionBase: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateRoomType(dataConnect, updateRoomTypeVars);

console.log(data.roomType_update);

// Or, you can use the `Promise` API.
updateRoomType(updateRoomTypeVars).then((response) => {
  const data = response.data;
  console.log(data.roomType_update);
});
```

### Using `UpdateRoomType`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateRoomTypeRef, UpdateRoomTypeVariables } from '@foratour-erp/dataconnect';

// The `UpdateRoomType` mutation requires an argument of type `UpdateRoomTypeVariables`:
const updateRoomTypeVars: UpdateRoomTypeVariables = {
  id: ..., 
  propertyId: ..., // optional
  nombre: ..., // optional
  regimenAlimentacion: ..., // optional
  capacidadMax: ..., // optional
  ocupacionBase: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateRoomTypeRef()` function to get a reference to the mutation.
const ref = updateRoomTypeRef(updateRoomTypeVars);
// Variables can be defined inline as well.
const ref = updateRoomTypeRef({ id: ..., propertyId: ..., nombre: ..., regimenAlimentacion: ..., capacidadMax: ..., ocupacionBase: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateRoomTypeRef(dataConnect, updateRoomTypeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.roomType_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.roomType_update);
});
```

## InsertRatePlan
You can execute the `InsertRatePlan` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertRatePlan(vars: InsertRatePlanVariables): MutationPromise<InsertRatePlanData, InsertRatePlanVariables>;

interface InsertRatePlanRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertRatePlanVariables): MutationRef<InsertRatePlanData, InsertRatePlanVariables>;
}
export const insertRatePlanRef: InsertRatePlanRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertRatePlan(dc: DataConnect, vars: InsertRatePlanVariables): MutationPromise<InsertRatePlanData, InsertRatePlanVariables>;

interface InsertRatePlanRef {
  ...
  (dc: DataConnect, vars: InsertRatePlanVariables): MutationRef<InsertRatePlanData, InsertRatePlanVariables>;
}
export const insertRatePlanRef: InsertRatePlanRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertRatePlanRef:
```typescript
const name = insertRatePlanRef.operationName;
console.log(name);
```

### Variables
The `InsertRatePlan` mutation requires an argument of type `InsertRatePlanVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertRatePlan` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertRatePlanData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertRatePlanData {
  ratePlan_insert: RatePlan_Key;
}
```
### Using `InsertRatePlan`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertRatePlan, InsertRatePlanVariables } from '@foratour-erp/dataconnect';

// The `InsertRatePlan` mutation requires an argument of type `InsertRatePlanVariables`:
const insertRatePlanVars: InsertRatePlanVariables = {
  id: ..., 
  propertyId: ..., 
  roomTypeId: ..., 
  nombrePromocion: ..., 
  fechaInicio: ..., 
  fechaFin: ..., 
  tipoCobro: ..., 
  tarifaBase: ..., 
  tarifaExtraAdulto: ..., 
  tarifaExtraNino: ..., 
  politicasCancelacion: ..., 
  mercado: ..., 
  updatedAt: ..., // optional
};

// Call the `insertRatePlan()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertRatePlan(insertRatePlanVars);
// Variables can be defined inline as well.
const { data } = await insertRatePlan({ id: ..., propertyId: ..., roomTypeId: ..., nombrePromocion: ..., fechaInicio: ..., fechaFin: ..., tipoCobro: ..., tarifaBase: ..., tarifaExtraAdulto: ..., tarifaExtraNino: ..., politicasCancelacion: ..., mercado: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertRatePlan(dataConnect, insertRatePlanVars);

console.log(data.ratePlan_insert);

// Or, you can use the `Promise` API.
insertRatePlan(insertRatePlanVars).then((response) => {
  const data = response.data;
  console.log(data.ratePlan_insert);
});
```

### Using `InsertRatePlan`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertRatePlanRef, InsertRatePlanVariables } from '@foratour-erp/dataconnect';

// The `InsertRatePlan` mutation requires an argument of type `InsertRatePlanVariables`:
const insertRatePlanVars: InsertRatePlanVariables = {
  id: ..., 
  propertyId: ..., 
  roomTypeId: ..., 
  nombrePromocion: ..., 
  fechaInicio: ..., 
  fechaFin: ..., 
  tipoCobro: ..., 
  tarifaBase: ..., 
  tarifaExtraAdulto: ..., 
  tarifaExtraNino: ..., 
  politicasCancelacion: ..., 
  mercado: ..., 
  updatedAt: ..., // optional
};

// Call the `insertRatePlanRef()` function to get a reference to the mutation.
const ref = insertRatePlanRef(insertRatePlanVars);
// Variables can be defined inline as well.
const ref = insertRatePlanRef({ id: ..., propertyId: ..., roomTypeId: ..., nombrePromocion: ..., fechaInicio: ..., fechaFin: ..., tipoCobro: ..., tarifaBase: ..., tarifaExtraAdulto: ..., tarifaExtraNino: ..., politicasCancelacion: ..., mercado: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertRatePlanRef(dataConnect, insertRatePlanVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.ratePlan_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.ratePlan_insert);
});
```

## UpdateRatePlan
You can execute the `UpdateRatePlan` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateRatePlan(vars: UpdateRatePlanVariables): MutationPromise<UpdateRatePlanData, UpdateRatePlanVariables>;

interface UpdateRatePlanRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRatePlanVariables): MutationRef<UpdateRatePlanData, UpdateRatePlanVariables>;
}
export const updateRatePlanRef: UpdateRatePlanRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateRatePlan(dc: DataConnect, vars: UpdateRatePlanVariables): MutationPromise<UpdateRatePlanData, UpdateRatePlanVariables>;

interface UpdateRatePlanRef {
  ...
  (dc: DataConnect, vars: UpdateRatePlanVariables): MutationRef<UpdateRatePlanData, UpdateRatePlanVariables>;
}
export const updateRatePlanRef: UpdateRatePlanRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateRatePlanRef:
```typescript
const name = updateRatePlanRef.operationName;
console.log(name);
```

### Variables
The `UpdateRatePlan` mutation requires an argument of type `UpdateRatePlanVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateRatePlan` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateRatePlanData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateRatePlanData {
  ratePlan_update?: RatePlan_Key | null;
}
```
### Using `UpdateRatePlan`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateRatePlan, UpdateRatePlanVariables } from '@foratour-erp/dataconnect';

// The `UpdateRatePlan` mutation requires an argument of type `UpdateRatePlanVariables`:
const updateRatePlanVars: UpdateRatePlanVariables = {
  id: ..., 
  propertyId: ..., // optional
  roomTypeId: ..., // optional
  nombrePromocion: ..., // optional
  fechaInicio: ..., // optional
  fechaFin: ..., // optional
  tipoCobro: ..., // optional
  tarifaBase: ..., // optional
  tarifaExtraAdulto: ..., // optional
  tarifaExtraNino: ..., // optional
  politicasCancelacion: ..., // optional
  mercado: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateRatePlan()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateRatePlan(updateRatePlanVars);
// Variables can be defined inline as well.
const { data } = await updateRatePlan({ id: ..., propertyId: ..., roomTypeId: ..., nombrePromocion: ..., fechaInicio: ..., fechaFin: ..., tipoCobro: ..., tarifaBase: ..., tarifaExtraAdulto: ..., tarifaExtraNino: ..., politicasCancelacion: ..., mercado: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateRatePlan(dataConnect, updateRatePlanVars);

console.log(data.ratePlan_update);

// Or, you can use the `Promise` API.
updateRatePlan(updateRatePlanVars).then((response) => {
  const data = response.data;
  console.log(data.ratePlan_update);
});
```

### Using `UpdateRatePlan`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateRatePlanRef, UpdateRatePlanVariables } from '@foratour-erp/dataconnect';

// The `UpdateRatePlan` mutation requires an argument of type `UpdateRatePlanVariables`:
const updateRatePlanVars: UpdateRatePlanVariables = {
  id: ..., 
  propertyId: ..., // optional
  roomTypeId: ..., // optional
  nombrePromocion: ..., // optional
  fechaInicio: ..., // optional
  fechaFin: ..., // optional
  tipoCobro: ..., // optional
  tarifaBase: ..., // optional
  tarifaExtraAdulto: ..., // optional
  tarifaExtraNino: ..., // optional
  politicasCancelacion: ..., // optional
  mercado: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateRatePlanRef()` function to get a reference to the mutation.
const ref = updateRatePlanRef(updateRatePlanVars);
// Variables can be defined inline as well.
const ref = updateRatePlanRef({ id: ..., propertyId: ..., roomTypeId: ..., nombrePromocion: ..., fechaInicio: ..., fechaFin: ..., tipoCobro: ..., tarifaBase: ..., tarifaExtraAdulto: ..., tarifaExtraNino: ..., politicasCancelacion: ..., mercado: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateRatePlanRef(dataConnect, updateRatePlanVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.ratePlan_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.ratePlan_update);
});
```

## InsertStopSale
You can execute the `InsertStopSale` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertStopSale(vars: InsertStopSaleVariables): MutationPromise<InsertStopSaleData, InsertStopSaleVariables>;

interface InsertStopSaleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertStopSaleVariables): MutationRef<InsertStopSaleData, InsertStopSaleVariables>;
}
export const insertStopSaleRef: InsertStopSaleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertStopSale(dc: DataConnect, vars: InsertStopSaleVariables): MutationPromise<InsertStopSaleData, InsertStopSaleVariables>;

interface InsertStopSaleRef {
  ...
  (dc: DataConnect, vars: InsertStopSaleVariables): MutationRef<InsertStopSaleData, InsertStopSaleVariables>;
}
export const insertStopSaleRef: InsertStopSaleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertStopSaleRef:
```typescript
const name = insertStopSaleRef.operationName;
console.log(name);
```

### Variables
The `InsertStopSale` mutation requires an argument of type `InsertStopSaleVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertStopSaleVariables {
  id: string;
  propertyId: string;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string | null;
  updatedAt?: string | null;
}
```
### Return Type
Recall that executing the `InsertStopSale` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertStopSaleData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertStopSaleData {
  stopSale_insert: StopSale_Key;
}
```
### Using `InsertStopSale`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertStopSale, InsertStopSaleVariables } from '@foratour-erp/dataconnect';

// The `InsertStopSale` mutation requires an argument of type `InsertStopSaleVariables`:
const insertStopSaleVars: InsertStopSaleVariables = {
  id: ..., 
  propertyId: ..., 
  fechaInicio: ..., 
  fechaFin: ..., 
  motivo: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertStopSale()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertStopSale(insertStopSaleVars);
// Variables can be defined inline as well.
const { data } = await insertStopSale({ id: ..., propertyId: ..., fechaInicio: ..., fechaFin: ..., motivo: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertStopSale(dataConnect, insertStopSaleVars);

console.log(data.stopSale_insert);

// Or, you can use the `Promise` API.
insertStopSale(insertStopSaleVars).then((response) => {
  const data = response.data;
  console.log(data.stopSale_insert);
});
```

### Using `InsertStopSale`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertStopSaleRef, InsertStopSaleVariables } from '@foratour-erp/dataconnect';

// The `InsertStopSale` mutation requires an argument of type `InsertStopSaleVariables`:
const insertStopSaleVars: InsertStopSaleVariables = {
  id: ..., 
  propertyId: ..., 
  fechaInicio: ..., 
  fechaFin: ..., 
  motivo: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertStopSaleRef()` function to get a reference to the mutation.
const ref = insertStopSaleRef(insertStopSaleVars);
// Variables can be defined inline as well.
const ref = insertStopSaleRef({ id: ..., propertyId: ..., fechaInicio: ..., fechaFin: ..., motivo: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertStopSaleRef(dataConnect, insertStopSaleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.stopSale_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.stopSale_insert);
});
```

## UpdateStopSale
You can execute the `UpdateStopSale` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateStopSale(vars: UpdateStopSaleVariables): MutationPromise<UpdateStopSaleData, UpdateStopSaleVariables>;

interface UpdateStopSaleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateStopSaleVariables): MutationRef<UpdateStopSaleData, UpdateStopSaleVariables>;
}
export const updateStopSaleRef: UpdateStopSaleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateStopSale(dc: DataConnect, vars: UpdateStopSaleVariables): MutationPromise<UpdateStopSaleData, UpdateStopSaleVariables>;

interface UpdateStopSaleRef {
  ...
  (dc: DataConnect, vars: UpdateStopSaleVariables): MutationRef<UpdateStopSaleData, UpdateStopSaleVariables>;
}
export const updateStopSaleRef: UpdateStopSaleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateStopSaleRef:
```typescript
const name = updateStopSaleRef.operationName;
console.log(name);
```

### Variables
The `UpdateStopSale` mutation requires an argument of type `UpdateStopSaleVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateStopSaleVariables {
  id: string;
  propertyId?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  motivo?: string | null;
  updatedAt?: string | null;
}
```
### Return Type
Recall that executing the `UpdateStopSale` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateStopSaleData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateStopSaleData {
  stopSale_update?: StopSale_Key | null;
}
```
### Using `UpdateStopSale`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateStopSale, UpdateStopSaleVariables } from '@foratour-erp/dataconnect';

// The `UpdateStopSale` mutation requires an argument of type `UpdateStopSaleVariables`:
const updateStopSaleVars: UpdateStopSaleVariables = {
  id: ..., 
  propertyId: ..., // optional
  fechaInicio: ..., // optional
  fechaFin: ..., // optional
  motivo: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateStopSale()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateStopSale(updateStopSaleVars);
// Variables can be defined inline as well.
const { data } = await updateStopSale({ id: ..., propertyId: ..., fechaInicio: ..., fechaFin: ..., motivo: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateStopSale(dataConnect, updateStopSaleVars);

console.log(data.stopSale_update);

// Or, you can use the `Promise` API.
updateStopSale(updateStopSaleVars).then((response) => {
  const data = response.data;
  console.log(data.stopSale_update);
});
```

### Using `UpdateStopSale`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateStopSaleRef, UpdateStopSaleVariables } from '@foratour-erp/dataconnect';

// The `UpdateStopSale` mutation requires an argument of type `UpdateStopSaleVariables`:
const updateStopSaleVars: UpdateStopSaleVariables = {
  id: ..., 
  propertyId: ..., // optional
  fechaInicio: ..., // optional
  fechaFin: ..., // optional
  motivo: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateStopSaleRef()` function to get a reference to the mutation.
const ref = updateStopSaleRef(updateStopSaleVars);
// Variables can be defined inline as well.
const ref = updateStopSaleRef({ id: ..., propertyId: ..., fechaInicio: ..., fechaFin: ..., motivo: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateStopSaleRef(dataConnect, updateStopSaleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.stopSale_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.stopSale_update);
});
```

## InsertFlightTicket
You can execute the `InsertFlightTicket` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertFlightTicket(vars: InsertFlightTicketVariables): MutationPromise<InsertFlightTicketData, InsertFlightTicketVariables>;

interface InsertFlightTicketRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertFlightTicketVariables): MutationRef<InsertFlightTicketData, InsertFlightTicketVariables>;
}
export const insertFlightTicketRef: InsertFlightTicketRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertFlightTicket(dc: DataConnect, vars: InsertFlightTicketVariables): MutationPromise<InsertFlightTicketData, InsertFlightTicketVariables>;

interface InsertFlightTicketRef {
  ...
  (dc: DataConnect, vars: InsertFlightTicketVariables): MutationRef<InsertFlightTicketData, InsertFlightTicketVariables>;
}
export const insertFlightTicketRef: InsertFlightTicketRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertFlightTicketRef:
```typescript
const name = insertFlightTicketRef.operationName;
console.log(name);
```

### Variables
The `InsertFlightTicket` mutation requires an argument of type `InsertFlightTicketVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertFlightTicket` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertFlightTicketData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertFlightTicketData {
  flightTicket_insert: FlightTicket_Key;
}
```
### Using `InsertFlightTicket`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertFlightTicket, InsertFlightTicketVariables } from '@foratour-erp/dataconnect';

// The `InsertFlightTicket` mutation requires an argument of type `InsertFlightTicketVariables`:
const insertFlightTicketVars: InsertFlightTicketVariables = {
  id: ..., 
  pnr: ..., 
  pasajeros: ..., 
  segmentos: ..., 
  costoNeto: ..., 
  precioVenta: ..., 
  precioPvp: ..., // optional
  comisionB2B: ..., // optional
  comisionMayorista: ..., // optional
  tipoComision: ..., // optional
  fee: ..., // optional
  vinculadoAExpediente: ..., 
  facturarConjunto: ..., // optional
  expedienteId: ..., // optional
  agenteNombre: ..., // optional
  createdAt: ..., // optional
  ticketNumero: ..., // optional
  aerolineaValidadora: ..., // optional
  notas: ..., // optional
  expedienteAereo: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertFlightTicket()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertFlightTicket(insertFlightTicketVars);
// Variables can be defined inline as well.
const { data } = await insertFlightTicket({ id: ..., pnr: ..., pasajeros: ..., segmentos: ..., costoNeto: ..., precioVenta: ..., precioPvp: ..., comisionB2B: ..., comisionMayorista: ..., tipoComision: ..., fee: ..., vinculadoAExpediente: ..., facturarConjunto: ..., expedienteId: ..., agenteNombre: ..., createdAt: ..., ticketNumero: ..., aerolineaValidadora: ..., notas: ..., expedienteAereo: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertFlightTicket(dataConnect, insertFlightTicketVars);

console.log(data.flightTicket_insert);

// Or, you can use the `Promise` API.
insertFlightTicket(insertFlightTicketVars).then((response) => {
  const data = response.data;
  console.log(data.flightTicket_insert);
});
```

### Using `InsertFlightTicket`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertFlightTicketRef, InsertFlightTicketVariables } from '@foratour-erp/dataconnect';

// The `InsertFlightTicket` mutation requires an argument of type `InsertFlightTicketVariables`:
const insertFlightTicketVars: InsertFlightTicketVariables = {
  id: ..., 
  pnr: ..., 
  pasajeros: ..., 
  segmentos: ..., 
  costoNeto: ..., 
  precioVenta: ..., 
  precioPvp: ..., // optional
  comisionB2B: ..., // optional
  comisionMayorista: ..., // optional
  tipoComision: ..., // optional
  fee: ..., // optional
  vinculadoAExpediente: ..., 
  facturarConjunto: ..., // optional
  expedienteId: ..., // optional
  agenteNombre: ..., // optional
  createdAt: ..., // optional
  ticketNumero: ..., // optional
  aerolineaValidadora: ..., // optional
  notas: ..., // optional
  expedienteAereo: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertFlightTicketRef()` function to get a reference to the mutation.
const ref = insertFlightTicketRef(insertFlightTicketVars);
// Variables can be defined inline as well.
const ref = insertFlightTicketRef({ id: ..., pnr: ..., pasajeros: ..., segmentos: ..., costoNeto: ..., precioVenta: ..., precioPvp: ..., comisionB2B: ..., comisionMayorista: ..., tipoComision: ..., fee: ..., vinculadoAExpediente: ..., facturarConjunto: ..., expedienteId: ..., agenteNombre: ..., createdAt: ..., ticketNumero: ..., aerolineaValidadora: ..., notas: ..., expedienteAereo: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertFlightTicketRef(dataConnect, insertFlightTicketVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.flightTicket_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.flightTicket_insert);
});
```

## UpdateFlightTicket
You can execute the `UpdateFlightTicket` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateFlightTicket(vars: UpdateFlightTicketVariables): MutationPromise<UpdateFlightTicketData, UpdateFlightTicketVariables>;

interface UpdateFlightTicketRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateFlightTicketVariables): MutationRef<UpdateFlightTicketData, UpdateFlightTicketVariables>;
}
export const updateFlightTicketRef: UpdateFlightTicketRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateFlightTicket(dc: DataConnect, vars: UpdateFlightTicketVariables): MutationPromise<UpdateFlightTicketData, UpdateFlightTicketVariables>;

interface UpdateFlightTicketRef {
  ...
  (dc: DataConnect, vars: UpdateFlightTicketVariables): MutationRef<UpdateFlightTicketData, UpdateFlightTicketVariables>;
}
export const updateFlightTicketRef: UpdateFlightTicketRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateFlightTicketRef:
```typescript
const name = updateFlightTicketRef.operationName;
console.log(name);
```

### Variables
The `UpdateFlightTicket` mutation requires an argument of type `UpdateFlightTicketVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateFlightTicket` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateFlightTicketData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateFlightTicketData {
  flightTicket_update?: FlightTicket_Key | null;
}
```
### Using `UpdateFlightTicket`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateFlightTicket, UpdateFlightTicketVariables } from '@foratour-erp/dataconnect';

// The `UpdateFlightTicket` mutation requires an argument of type `UpdateFlightTicketVariables`:
const updateFlightTicketVars: UpdateFlightTicketVariables = {
  id: ..., 
  pnr: ..., // optional
  pasajeros: ..., // optional
  segmentos: ..., // optional
  costoNeto: ..., // optional
  precioVenta: ..., // optional
  precioPvp: ..., // optional
  comisionB2B: ..., // optional
  comisionMayorista: ..., // optional
  tipoComision: ..., // optional
  fee: ..., // optional
  vinculadoAExpediente: ..., // optional
  facturarConjunto: ..., // optional
  expedienteId: ..., // optional
  agenteNombre: ..., // optional
  createdAt: ..., // optional
  ticketNumero: ..., // optional
  aerolineaValidadora: ..., // optional
  notas: ..., // optional
  expedienteAereo: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateFlightTicket()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateFlightTicket(updateFlightTicketVars);
// Variables can be defined inline as well.
const { data } = await updateFlightTicket({ id: ..., pnr: ..., pasajeros: ..., segmentos: ..., costoNeto: ..., precioVenta: ..., precioPvp: ..., comisionB2B: ..., comisionMayorista: ..., tipoComision: ..., fee: ..., vinculadoAExpediente: ..., facturarConjunto: ..., expedienteId: ..., agenteNombre: ..., createdAt: ..., ticketNumero: ..., aerolineaValidadora: ..., notas: ..., expedienteAereo: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateFlightTicket(dataConnect, updateFlightTicketVars);

console.log(data.flightTicket_update);

// Or, you can use the `Promise` API.
updateFlightTicket(updateFlightTicketVars).then((response) => {
  const data = response.data;
  console.log(data.flightTicket_update);
});
```

### Using `UpdateFlightTicket`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateFlightTicketRef, UpdateFlightTicketVariables } from '@foratour-erp/dataconnect';

// The `UpdateFlightTicket` mutation requires an argument of type `UpdateFlightTicketVariables`:
const updateFlightTicketVars: UpdateFlightTicketVariables = {
  id: ..., 
  pnr: ..., // optional
  pasajeros: ..., // optional
  segmentos: ..., // optional
  costoNeto: ..., // optional
  precioVenta: ..., // optional
  precioPvp: ..., // optional
  comisionB2B: ..., // optional
  comisionMayorista: ..., // optional
  tipoComision: ..., // optional
  fee: ..., // optional
  vinculadoAExpediente: ..., // optional
  facturarConjunto: ..., // optional
  expedienteId: ..., // optional
  agenteNombre: ..., // optional
  createdAt: ..., // optional
  ticketNumero: ..., // optional
  aerolineaValidadora: ..., // optional
  notas: ..., // optional
  expedienteAereo: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateFlightTicketRef()` function to get a reference to the mutation.
const ref = updateFlightTicketRef(updateFlightTicketVars);
// Variables can be defined inline as well.
const ref = updateFlightTicketRef({ id: ..., pnr: ..., pasajeros: ..., segmentos: ..., costoNeto: ..., precioVenta: ..., precioPvp: ..., comisionB2B: ..., comisionMayorista: ..., tipoComision: ..., fee: ..., vinculadoAExpediente: ..., facturarConjunto: ..., expedienteId: ..., agenteNombre: ..., createdAt: ..., ticketNumero: ..., aerolineaValidadora: ..., notas: ..., expedienteAereo: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateFlightTicketRef(dataConnect, updateFlightTicketVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.flightTicket_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.flightTicket_update);
});
```

## DeleteFlightTicket
You can execute the `DeleteFlightTicket` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteFlightTicket(vars: DeleteFlightTicketVariables): MutationPromise<DeleteFlightTicketData, DeleteFlightTicketVariables>;

interface DeleteFlightTicketRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteFlightTicketVariables): MutationRef<DeleteFlightTicketData, DeleteFlightTicketVariables>;
}
export const deleteFlightTicketRef: DeleteFlightTicketRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteFlightTicket(dc: DataConnect, vars: DeleteFlightTicketVariables): MutationPromise<DeleteFlightTicketData, DeleteFlightTicketVariables>;

interface DeleteFlightTicketRef {
  ...
  (dc: DataConnect, vars: DeleteFlightTicketVariables): MutationRef<DeleteFlightTicketData, DeleteFlightTicketVariables>;
}
export const deleteFlightTicketRef: DeleteFlightTicketRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteFlightTicketRef:
```typescript
const name = deleteFlightTicketRef.operationName;
console.log(name);
```

### Variables
The `DeleteFlightTicket` mutation requires an argument of type `DeleteFlightTicketVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteFlightTicketVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteFlightTicket` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteFlightTicketData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteFlightTicketData {
  flightTicket_delete?: FlightTicket_Key | null;
}
```
### Using `DeleteFlightTicket`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteFlightTicket, DeleteFlightTicketVariables } from '@foratour-erp/dataconnect';

// The `DeleteFlightTicket` mutation requires an argument of type `DeleteFlightTicketVariables`:
const deleteFlightTicketVars: DeleteFlightTicketVariables = {
  id: ..., 
};

// Call the `deleteFlightTicket()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteFlightTicket(deleteFlightTicketVars);
// Variables can be defined inline as well.
const { data } = await deleteFlightTicket({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteFlightTicket(dataConnect, deleteFlightTicketVars);

console.log(data.flightTicket_delete);

// Or, you can use the `Promise` API.
deleteFlightTicket(deleteFlightTicketVars).then((response) => {
  const data = response.data;
  console.log(data.flightTicket_delete);
});
```

### Using `DeleteFlightTicket`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteFlightTicketRef, DeleteFlightTicketVariables } from '@foratour-erp/dataconnect';

// The `DeleteFlightTicket` mutation requires an argument of type `DeleteFlightTicketVariables`:
const deleteFlightTicketVars: DeleteFlightTicketVariables = {
  id: ..., 
};

// Call the `deleteFlightTicketRef()` function to get a reference to the mutation.
const ref = deleteFlightTicketRef(deleteFlightTicketVars);
// Variables can be defined inline as well.
const ref = deleteFlightTicketRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteFlightTicketRef(dataConnect, deleteFlightTicketVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.flightTicket_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.flightTicket_delete);
});
```

## InsertTransferService
You can execute the `InsertTransferService` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertTransferService(vars: InsertTransferServiceVariables): MutationPromise<InsertTransferServiceData, InsertTransferServiceVariables>;

interface InsertTransferServiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertTransferServiceVariables): MutationRef<InsertTransferServiceData, InsertTransferServiceVariables>;
}
export const insertTransferServiceRef: InsertTransferServiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertTransferService(dc: DataConnect, vars: InsertTransferServiceVariables): MutationPromise<InsertTransferServiceData, InsertTransferServiceVariables>;

interface InsertTransferServiceRef {
  ...
  (dc: DataConnect, vars: InsertTransferServiceVariables): MutationRef<InsertTransferServiceData, InsertTransferServiceVariables>;
}
export const insertTransferServiceRef: InsertTransferServiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertTransferServiceRef:
```typescript
const name = insertTransferServiceRef.operationName;
console.log(name);
```

### Variables
The `InsertTransferService` mutation requires an argument of type `InsertTransferServiceVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertTransferService` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertTransferServiceData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertTransferServiceData {
  transferService_insert: TransferService_Key;
}
```
### Using `InsertTransferService`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertTransferService, InsertTransferServiceVariables } from '@foratour-erp/dataconnect';

// The `InsertTransferService` mutation requires an argument of type `InsertTransferServiceVariables`:
const insertTransferServiceVars: InsertTransferServiceVariables = {
  id: ..., 
  leadPassenger: ..., 
  paxCount: ..., 
  pickupLocation: ..., 
  dropoffLocation: ..., 
  date: ..., 
  time: ..., 
  provider: ..., 
  driverName: ..., // optional
  driverId: ..., // optional
  vehicleId: ..., // optional
  reservationId: ..., // optional
  flightRef: ..., // optional
  notes: ..., // optional
  status: ..., 
  vehicleType: ..., 
  direction: ..., // optional
  legIndex: ..., // optional
  tipoTraslado: ..., // optional
  telefono: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertTransferService()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertTransferService(insertTransferServiceVars);
// Variables can be defined inline as well.
const { data } = await insertTransferService({ id: ..., leadPassenger: ..., paxCount: ..., pickupLocation: ..., dropoffLocation: ..., date: ..., time: ..., provider: ..., driverName: ..., driverId: ..., vehicleId: ..., reservationId: ..., flightRef: ..., notes: ..., status: ..., vehicleType: ..., direction: ..., legIndex: ..., tipoTraslado: ..., telefono: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertTransferService(dataConnect, insertTransferServiceVars);

console.log(data.transferService_insert);

// Or, you can use the `Promise` API.
insertTransferService(insertTransferServiceVars).then((response) => {
  const data = response.data;
  console.log(data.transferService_insert);
});
```

### Using `InsertTransferService`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertTransferServiceRef, InsertTransferServiceVariables } from '@foratour-erp/dataconnect';

// The `InsertTransferService` mutation requires an argument of type `InsertTransferServiceVariables`:
const insertTransferServiceVars: InsertTransferServiceVariables = {
  id: ..., 
  leadPassenger: ..., 
  paxCount: ..., 
  pickupLocation: ..., 
  dropoffLocation: ..., 
  date: ..., 
  time: ..., 
  provider: ..., 
  driverName: ..., // optional
  driverId: ..., // optional
  vehicleId: ..., // optional
  reservationId: ..., // optional
  flightRef: ..., // optional
  notes: ..., // optional
  status: ..., 
  vehicleType: ..., 
  direction: ..., // optional
  legIndex: ..., // optional
  tipoTraslado: ..., // optional
  telefono: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertTransferServiceRef()` function to get a reference to the mutation.
const ref = insertTransferServiceRef(insertTransferServiceVars);
// Variables can be defined inline as well.
const ref = insertTransferServiceRef({ id: ..., leadPassenger: ..., paxCount: ..., pickupLocation: ..., dropoffLocation: ..., date: ..., time: ..., provider: ..., driverName: ..., driverId: ..., vehicleId: ..., reservationId: ..., flightRef: ..., notes: ..., status: ..., vehicleType: ..., direction: ..., legIndex: ..., tipoTraslado: ..., telefono: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertTransferServiceRef(dataConnect, insertTransferServiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transferService_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transferService_insert);
});
```

## UpdateTransferService
You can execute the `UpdateTransferService` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateTransferService(vars: UpdateTransferServiceVariables): MutationPromise<UpdateTransferServiceData, UpdateTransferServiceVariables>;

interface UpdateTransferServiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTransferServiceVariables): MutationRef<UpdateTransferServiceData, UpdateTransferServiceVariables>;
}
export const updateTransferServiceRef: UpdateTransferServiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateTransferService(dc: DataConnect, vars: UpdateTransferServiceVariables): MutationPromise<UpdateTransferServiceData, UpdateTransferServiceVariables>;

interface UpdateTransferServiceRef {
  ...
  (dc: DataConnect, vars: UpdateTransferServiceVariables): MutationRef<UpdateTransferServiceData, UpdateTransferServiceVariables>;
}
export const updateTransferServiceRef: UpdateTransferServiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateTransferServiceRef:
```typescript
const name = updateTransferServiceRef.operationName;
console.log(name);
```

### Variables
The `UpdateTransferService` mutation requires an argument of type `UpdateTransferServiceVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateTransferService` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateTransferServiceData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateTransferServiceData {
  transferService_update?: TransferService_Key | null;
}
```
### Using `UpdateTransferService`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateTransferService, UpdateTransferServiceVariables } from '@foratour-erp/dataconnect';

// The `UpdateTransferService` mutation requires an argument of type `UpdateTransferServiceVariables`:
const updateTransferServiceVars: UpdateTransferServiceVariables = {
  id: ..., 
  leadPassenger: ..., // optional
  paxCount: ..., // optional
  pickupLocation: ..., // optional
  dropoffLocation: ..., // optional
  date: ..., // optional
  time: ..., // optional
  provider: ..., // optional
  driverName: ..., // optional
  driverId: ..., // optional
  vehicleId: ..., // optional
  reservationId: ..., // optional
  flightRef: ..., // optional
  notes: ..., // optional
  status: ..., // optional
  vehicleType: ..., // optional
  direction: ..., // optional
  legIndex: ..., // optional
  tipoTraslado: ..., // optional
  telefono: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateTransferService()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateTransferService(updateTransferServiceVars);
// Variables can be defined inline as well.
const { data } = await updateTransferService({ id: ..., leadPassenger: ..., paxCount: ..., pickupLocation: ..., dropoffLocation: ..., date: ..., time: ..., provider: ..., driverName: ..., driverId: ..., vehicleId: ..., reservationId: ..., flightRef: ..., notes: ..., status: ..., vehicleType: ..., direction: ..., legIndex: ..., tipoTraslado: ..., telefono: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateTransferService(dataConnect, updateTransferServiceVars);

console.log(data.transferService_update);

// Or, you can use the `Promise` API.
updateTransferService(updateTransferServiceVars).then((response) => {
  const data = response.data;
  console.log(data.transferService_update);
});
```

### Using `UpdateTransferService`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateTransferServiceRef, UpdateTransferServiceVariables } from '@foratour-erp/dataconnect';

// The `UpdateTransferService` mutation requires an argument of type `UpdateTransferServiceVariables`:
const updateTransferServiceVars: UpdateTransferServiceVariables = {
  id: ..., 
  leadPassenger: ..., // optional
  paxCount: ..., // optional
  pickupLocation: ..., // optional
  dropoffLocation: ..., // optional
  date: ..., // optional
  time: ..., // optional
  provider: ..., // optional
  driverName: ..., // optional
  driverId: ..., // optional
  vehicleId: ..., // optional
  reservationId: ..., // optional
  flightRef: ..., // optional
  notes: ..., // optional
  status: ..., // optional
  vehicleType: ..., // optional
  direction: ..., // optional
  legIndex: ..., // optional
  tipoTraslado: ..., // optional
  telefono: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateTransferServiceRef()` function to get a reference to the mutation.
const ref = updateTransferServiceRef(updateTransferServiceVars);
// Variables can be defined inline as well.
const ref = updateTransferServiceRef({ id: ..., leadPassenger: ..., paxCount: ..., pickupLocation: ..., dropoffLocation: ..., date: ..., time: ..., provider: ..., driverName: ..., driverId: ..., vehicleId: ..., reservationId: ..., flightRef: ..., notes: ..., status: ..., vehicleType: ..., direction: ..., legIndex: ..., tipoTraslado: ..., telefono: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateTransferServiceRef(dataConnect, updateTransferServiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transferService_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transferService_update);
});
```

## DeleteTransferService
You can execute the `DeleteTransferService` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteTransferService(vars: DeleteTransferServiceVariables): MutationPromise<DeleteTransferServiceData, DeleteTransferServiceVariables>;

interface DeleteTransferServiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTransferServiceVariables): MutationRef<DeleteTransferServiceData, DeleteTransferServiceVariables>;
}
export const deleteTransferServiceRef: DeleteTransferServiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteTransferService(dc: DataConnect, vars: DeleteTransferServiceVariables): MutationPromise<DeleteTransferServiceData, DeleteTransferServiceVariables>;

interface DeleteTransferServiceRef {
  ...
  (dc: DataConnect, vars: DeleteTransferServiceVariables): MutationRef<DeleteTransferServiceData, DeleteTransferServiceVariables>;
}
export const deleteTransferServiceRef: DeleteTransferServiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteTransferServiceRef:
```typescript
const name = deleteTransferServiceRef.operationName;
console.log(name);
```

### Variables
The `DeleteTransferService` mutation requires an argument of type `DeleteTransferServiceVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteTransferServiceVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteTransferService` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteTransferServiceData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteTransferServiceData {
  transferService_delete?: TransferService_Key | null;
}
```
### Using `DeleteTransferService`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteTransferService, DeleteTransferServiceVariables } from '@foratour-erp/dataconnect';

// The `DeleteTransferService` mutation requires an argument of type `DeleteTransferServiceVariables`:
const deleteTransferServiceVars: DeleteTransferServiceVariables = {
  id: ..., 
};

// Call the `deleteTransferService()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteTransferService(deleteTransferServiceVars);
// Variables can be defined inline as well.
const { data } = await deleteTransferService({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteTransferService(dataConnect, deleteTransferServiceVars);

console.log(data.transferService_delete);

// Or, you can use the `Promise` API.
deleteTransferService(deleteTransferServiceVars).then((response) => {
  const data = response.data;
  console.log(data.transferService_delete);
});
```

### Using `DeleteTransferService`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteTransferServiceRef, DeleteTransferServiceVariables } from '@foratour-erp/dataconnect';

// The `DeleteTransferService` mutation requires an argument of type `DeleteTransferServiceVariables`:
const deleteTransferServiceVars: DeleteTransferServiceVariables = {
  id: ..., 
};

// Call the `deleteTransferServiceRef()` function to get a reference to the mutation.
const ref = deleteTransferServiceRef(deleteTransferServiceVars);
// Variables can be defined inline as well.
const ref = deleteTransferServiceRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteTransferServiceRef(dataConnect, deleteTransferServiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transferService_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transferService_delete);
});
```

## InsertFleetVehicle
You can execute the `InsertFleetVehicle` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertFleetVehicle(vars: InsertFleetVehicleVariables): MutationPromise<InsertFleetVehicleData, InsertFleetVehicleVariables>;

interface InsertFleetVehicleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertFleetVehicleVariables): MutationRef<InsertFleetVehicleData, InsertFleetVehicleVariables>;
}
export const insertFleetVehicleRef: InsertFleetVehicleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertFleetVehicle(dc: DataConnect, vars: InsertFleetVehicleVariables): MutationPromise<InsertFleetVehicleData, InsertFleetVehicleVariables>;

interface InsertFleetVehicleRef {
  ...
  (dc: DataConnect, vars: InsertFleetVehicleVariables): MutationRef<InsertFleetVehicleData, InsertFleetVehicleVariables>;
}
export const insertFleetVehicleRef: InsertFleetVehicleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertFleetVehicleRef:
```typescript
const name = insertFleetVehicleRef.operationName;
console.log(name);
```

### Variables
The `InsertFleetVehicle` mutation requires an argument of type `InsertFleetVehicleVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertFleetVehicle` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertFleetVehicleData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertFleetVehicleData {
  fleetVehicle_insert: FleetVehicle_Key;
}
```
### Using `InsertFleetVehicle`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertFleetVehicle, InsertFleetVehicleVariables } from '@foratour-erp/dataconnect';

// The `InsertFleetVehicle` mutation requires an argument of type `InsertFleetVehicleVariables`:
const insertFleetVehicleVars: InsertFleetVehicleVariables = {
  id: ..., 
  placa: ..., 
  tipo: ..., 
  marca: ..., 
  modelo: ..., 
  capacidad: ..., 
  proveedor: ..., 
  status: ..., 
  conductorAsignadoId: ..., // optional
  observaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertFleetVehicle()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertFleetVehicle(insertFleetVehicleVars);
// Variables can be defined inline as well.
const { data } = await insertFleetVehicle({ id: ..., placa: ..., tipo: ..., marca: ..., modelo: ..., capacidad: ..., proveedor: ..., status: ..., conductorAsignadoId: ..., observaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertFleetVehicle(dataConnect, insertFleetVehicleVars);

console.log(data.fleetVehicle_insert);

// Or, you can use the `Promise` API.
insertFleetVehicle(insertFleetVehicleVars).then((response) => {
  const data = response.data;
  console.log(data.fleetVehicle_insert);
});
```

### Using `InsertFleetVehicle`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertFleetVehicleRef, InsertFleetVehicleVariables } from '@foratour-erp/dataconnect';

// The `InsertFleetVehicle` mutation requires an argument of type `InsertFleetVehicleVariables`:
const insertFleetVehicleVars: InsertFleetVehicleVariables = {
  id: ..., 
  placa: ..., 
  tipo: ..., 
  marca: ..., 
  modelo: ..., 
  capacidad: ..., 
  proveedor: ..., 
  status: ..., 
  conductorAsignadoId: ..., // optional
  observaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertFleetVehicleRef()` function to get a reference to the mutation.
const ref = insertFleetVehicleRef(insertFleetVehicleVars);
// Variables can be defined inline as well.
const ref = insertFleetVehicleRef({ id: ..., placa: ..., tipo: ..., marca: ..., modelo: ..., capacidad: ..., proveedor: ..., status: ..., conductorAsignadoId: ..., observaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertFleetVehicleRef(dataConnect, insertFleetVehicleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.fleetVehicle_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.fleetVehicle_insert);
});
```

## UpdateFleetVehicle
You can execute the `UpdateFleetVehicle` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateFleetVehicle(vars: UpdateFleetVehicleVariables): MutationPromise<UpdateFleetVehicleData, UpdateFleetVehicleVariables>;

interface UpdateFleetVehicleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateFleetVehicleVariables): MutationRef<UpdateFleetVehicleData, UpdateFleetVehicleVariables>;
}
export const updateFleetVehicleRef: UpdateFleetVehicleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateFleetVehicle(dc: DataConnect, vars: UpdateFleetVehicleVariables): MutationPromise<UpdateFleetVehicleData, UpdateFleetVehicleVariables>;

interface UpdateFleetVehicleRef {
  ...
  (dc: DataConnect, vars: UpdateFleetVehicleVariables): MutationRef<UpdateFleetVehicleData, UpdateFleetVehicleVariables>;
}
export const updateFleetVehicleRef: UpdateFleetVehicleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateFleetVehicleRef:
```typescript
const name = updateFleetVehicleRef.operationName;
console.log(name);
```

### Variables
The `UpdateFleetVehicle` mutation requires an argument of type `UpdateFleetVehicleVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateFleetVehicle` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateFleetVehicleData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateFleetVehicleData {
  fleetVehicle_update?: FleetVehicle_Key | null;
}
```
### Using `UpdateFleetVehicle`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateFleetVehicle, UpdateFleetVehicleVariables } from '@foratour-erp/dataconnect';

// The `UpdateFleetVehicle` mutation requires an argument of type `UpdateFleetVehicleVariables`:
const updateFleetVehicleVars: UpdateFleetVehicleVariables = {
  id: ..., 
  placa: ..., // optional
  tipo: ..., // optional
  marca: ..., // optional
  modelo: ..., // optional
  capacidad: ..., // optional
  proveedor: ..., // optional
  status: ..., // optional
  conductorAsignadoId: ..., // optional
  observaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateFleetVehicle()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateFleetVehicle(updateFleetVehicleVars);
// Variables can be defined inline as well.
const { data } = await updateFleetVehicle({ id: ..., placa: ..., tipo: ..., marca: ..., modelo: ..., capacidad: ..., proveedor: ..., status: ..., conductorAsignadoId: ..., observaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateFleetVehicle(dataConnect, updateFleetVehicleVars);

console.log(data.fleetVehicle_update);

// Or, you can use the `Promise` API.
updateFleetVehicle(updateFleetVehicleVars).then((response) => {
  const data = response.data;
  console.log(data.fleetVehicle_update);
});
```

### Using `UpdateFleetVehicle`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateFleetVehicleRef, UpdateFleetVehicleVariables } from '@foratour-erp/dataconnect';

// The `UpdateFleetVehicle` mutation requires an argument of type `UpdateFleetVehicleVariables`:
const updateFleetVehicleVars: UpdateFleetVehicleVariables = {
  id: ..., 
  placa: ..., // optional
  tipo: ..., // optional
  marca: ..., // optional
  modelo: ..., // optional
  capacidad: ..., // optional
  proveedor: ..., // optional
  status: ..., // optional
  conductorAsignadoId: ..., // optional
  observaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateFleetVehicleRef()` function to get a reference to the mutation.
const ref = updateFleetVehicleRef(updateFleetVehicleVars);
// Variables can be defined inline as well.
const ref = updateFleetVehicleRef({ id: ..., placa: ..., tipo: ..., marca: ..., modelo: ..., capacidad: ..., proveedor: ..., status: ..., conductorAsignadoId: ..., observaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateFleetVehicleRef(dataConnect, updateFleetVehicleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.fleetVehicle_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.fleetVehicle_update);
});
```

## DeleteFleetVehicle
You can execute the `DeleteFleetVehicle` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteFleetVehicle(vars: DeleteFleetVehicleVariables): MutationPromise<DeleteFleetVehicleData, DeleteFleetVehicleVariables>;

interface DeleteFleetVehicleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteFleetVehicleVariables): MutationRef<DeleteFleetVehicleData, DeleteFleetVehicleVariables>;
}
export const deleteFleetVehicleRef: DeleteFleetVehicleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteFleetVehicle(dc: DataConnect, vars: DeleteFleetVehicleVariables): MutationPromise<DeleteFleetVehicleData, DeleteFleetVehicleVariables>;

interface DeleteFleetVehicleRef {
  ...
  (dc: DataConnect, vars: DeleteFleetVehicleVariables): MutationRef<DeleteFleetVehicleData, DeleteFleetVehicleVariables>;
}
export const deleteFleetVehicleRef: DeleteFleetVehicleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteFleetVehicleRef:
```typescript
const name = deleteFleetVehicleRef.operationName;
console.log(name);
```

### Variables
The `DeleteFleetVehicle` mutation requires an argument of type `DeleteFleetVehicleVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteFleetVehicleVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteFleetVehicle` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteFleetVehicleData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteFleetVehicleData {
  fleetVehicle_delete?: FleetVehicle_Key | null;
}
```
### Using `DeleteFleetVehicle`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteFleetVehicle, DeleteFleetVehicleVariables } from '@foratour-erp/dataconnect';

// The `DeleteFleetVehicle` mutation requires an argument of type `DeleteFleetVehicleVariables`:
const deleteFleetVehicleVars: DeleteFleetVehicleVariables = {
  id: ..., 
};

// Call the `deleteFleetVehicle()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteFleetVehicle(deleteFleetVehicleVars);
// Variables can be defined inline as well.
const { data } = await deleteFleetVehicle({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteFleetVehicle(dataConnect, deleteFleetVehicleVars);

console.log(data.fleetVehicle_delete);

// Or, you can use the `Promise` API.
deleteFleetVehicle(deleteFleetVehicleVars).then((response) => {
  const data = response.data;
  console.log(data.fleetVehicle_delete);
});
```

### Using `DeleteFleetVehicle`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteFleetVehicleRef, DeleteFleetVehicleVariables } from '@foratour-erp/dataconnect';

// The `DeleteFleetVehicle` mutation requires an argument of type `DeleteFleetVehicleVariables`:
const deleteFleetVehicleVars: DeleteFleetVehicleVariables = {
  id: ..., 
};

// Call the `deleteFleetVehicleRef()` function to get a reference to the mutation.
const ref = deleteFleetVehicleRef(deleteFleetVehicleVars);
// Variables can be defined inline as well.
const ref = deleteFleetVehicleRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteFleetVehicleRef(dataConnect, deleteFleetVehicleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.fleetVehicle_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.fleetVehicle_delete);
});
```

## InsertFleetDriver
You can execute the `InsertFleetDriver` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertFleetDriver(vars: InsertFleetDriverVariables): MutationPromise<InsertFleetDriverData, InsertFleetDriverVariables>;

interface InsertFleetDriverRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertFleetDriverVariables): MutationRef<InsertFleetDriverData, InsertFleetDriverVariables>;
}
export const insertFleetDriverRef: InsertFleetDriverRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertFleetDriver(dc: DataConnect, vars: InsertFleetDriverVariables): MutationPromise<InsertFleetDriverData, InsertFleetDriverVariables>;

interface InsertFleetDriverRef {
  ...
  (dc: DataConnect, vars: InsertFleetDriverVariables): MutationRef<InsertFleetDriverData, InsertFleetDriverVariables>;
}
export const insertFleetDriverRef: InsertFleetDriverRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertFleetDriverRef:
```typescript
const name = insertFleetDriverRef.operationName;
console.log(name);
```

### Variables
The `InsertFleetDriver` mutation requires an argument of type `InsertFleetDriverVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertFleetDriver` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertFleetDriverData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertFleetDriverData {
  fleetDriver_insert: FleetDriver_Key;
}
```
### Using `InsertFleetDriver`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertFleetDriver, InsertFleetDriverVariables } from '@foratour-erp/dataconnect';

// The `InsertFleetDriver` mutation requires an argument of type `InsertFleetDriverVariables`:
const insertFleetDriverVars: InsertFleetDriverVariables = {
  id: ..., 
  nombre: ..., 
  telefono: ..., 
  licencia: ..., 
  vehiculoAsignadoId: ..., // optional
  status: ..., 
  observaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertFleetDriver()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertFleetDriver(insertFleetDriverVars);
// Variables can be defined inline as well.
const { data } = await insertFleetDriver({ id: ..., nombre: ..., telefono: ..., licencia: ..., vehiculoAsignadoId: ..., status: ..., observaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertFleetDriver(dataConnect, insertFleetDriverVars);

console.log(data.fleetDriver_insert);

// Or, you can use the `Promise` API.
insertFleetDriver(insertFleetDriverVars).then((response) => {
  const data = response.data;
  console.log(data.fleetDriver_insert);
});
```

### Using `InsertFleetDriver`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertFleetDriverRef, InsertFleetDriverVariables } from '@foratour-erp/dataconnect';

// The `InsertFleetDriver` mutation requires an argument of type `InsertFleetDriverVariables`:
const insertFleetDriverVars: InsertFleetDriverVariables = {
  id: ..., 
  nombre: ..., 
  telefono: ..., 
  licencia: ..., 
  vehiculoAsignadoId: ..., // optional
  status: ..., 
  observaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertFleetDriverRef()` function to get a reference to the mutation.
const ref = insertFleetDriverRef(insertFleetDriverVars);
// Variables can be defined inline as well.
const ref = insertFleetDriverRef({ id: ..., nombre: ..., telefono: ..., licencia: ..., vehiculoAsignadoId: ..., status: ..., observaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertFleetDriverRef(dataConnect, insertFleetDriverVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.fleetDriver_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.fleetDriver_insert);
});
```

## UpdateFleetDriver
You can execute the `UpdateFleetDriver` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateFleetDriver(vars: UpdateFleetDriverVariables): MutationPromise<UpdateFleetDriverData, UpdateFleetDriverVariables>;

interface UpdateFleetDriverRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateFleetDriverVariables): MutationRef<UpdateFleetDriverData, UpdateFleetDriverVariables>;
}
export const updateFleetDriverRef: UpdateFleetDriverRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateFleetDriver(dc: DataConnect, vars: UpdateFleetDriverVariables): MutationPromise<UpdateFleetDriverData, UpdateFleetDriverVariables>;

interface UpdateFleetDriverRef {
  ...
  (dc: DataConnect, vars: UpdateFleetDriverVariables): MutationRef<UpdateFleetDriverData, UpdateFleetDriverVariables>;
}
export const updateFleetDriverRef: UpdateFleetDriverRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateFleetDriverRef:
```typescript
const name = updateFleetDriverRef.operationName;
console.log(name);
```

### Variables
The `UpdateFleetDriver` mutation requires an argument of type `UpdateFleetDriverVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateFleetDriver` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateFleetDriverData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateFleetDriverData {
  fleetDriver_update?: FleetDriver_Key | null;
}
```
### Using `UpdateFleetDriver`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateFleetDriver, UpdateFleetDriverVariables } from '@foratour-erp/dataconnect';

// The `UpdateFleetDriver` mutation requires an argument of type `UpdateFleetDriverVariables`:
const updateFleetDriverVars: UpdateFleetDriverVariables = {
  id: ..., 
  nombre: ..., // optional
  telefono: ..., // optional
  licencia: ..., // optional
  vehiculoAsignadoId: ..., // optional
  status: ..., // optional
  observaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateFleetDriver()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateFleetDriver(updateFleetDriverVars);
// Variables can be defined inline as well.
const { data } = await updateFleetDriver({ id: ..., nombre: ..., telefono: ..., licencia: ..., vehiculoAsignadoId: ..., status: ..., observaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateFleetDriver(dataConnect, updateFleetDriverVars);

console.log(data.fleetDriver_update);

// Or, you can use the `Promise` API.
updateFleetDriver(updateFleetDriverVars).then((response) => {
  const data = response.data;
  console.log(data.fleetDriver_update);
});
```

### Using `UpdateFleetDriver`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateFleetDriverRef, UpdateFleetDriverVariables } from '@foratour-erp/dataconnect';

// The `UpdateFleetDriver` mutation requires an argument of type `UpdateFleetDriverVariables`:
const updateFleetDriverVars: UpdateFleetDriverVariables = {
  id: ..., 
  nombre: ..., // optional
  telefono: ..., // optional
  licencia: ..., // optional
  vehiculoAsignadoId: ..., // optional
  status: ..., // optional
  observaciones: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateFleetDriverRef()` function to get a reference to the mutation.
const ref = updateFleetDriverRef(updateFleetDriverVars);
// Variables can be defined inline as well.
const ref = updateFleetDriverRef({ id: ..., nombre: ..., telefono: ..., licencia: ..., vehiculoAsignadoId: ..., status: ..., observaciones: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateFleetDriverRef(dataConnect, updateFleetDriverVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.fleetDriver_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.fleetDriver_update);
});
```

## DeleteFleetDriver
You can execute the `DeleteFleetDriver` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteFleetDriver(vars: DeleteFleetDriverVariables): MutationPromise<DeleteFleetDriverData, DeleteFleetDriverVariables>;

interface DeleteFleetDriverRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteFleetDriverVariables): MutationRef<DeleteFleetDriverData, DeleteFleetDriverVariables>;
}
export const deleteFleetDriverRef: DeleteFleetDriverRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteFleetDriver(dc: DataConnect, vars: DeleteFleetDriverVariables): MutationPromise<DeleteFleetDriverData, DeleteFleetDriverVariables>;

interface DeleteFleetDriverRef {
  ...
  (dc: DataConnect, vars: DeleteFleetDriverVariables): MutationRef<DeleteFleetDriverData, DeleteFleetDriverVariables>;
}
export const deleteFleetDriverRef: DeleteFleetDriverRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteFleetDriverRef:
```typescript
const name = deleteFleetDriverRef.operationName;
console.log(name);
```

### Variables
The `DeleteFleetDriver` mutation requires an argument of type `DeleteFleetDriverVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteFleetDriverVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteFleetDriver` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteFleetDriverData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteFleetDriverData {
  fleetDriver_delete?: FleetDriver_Key | null;
}
```
### Using `DeleteFleetDriver`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteFleetDriver, DeleteFleetDriverVariables } from '@foratour-erp/dataconnect';

// The `DeleteFleetDriver` mutation requires an argument of type `DeleteFleetDriverVariables`:
const deleteFleetDriverVars: DeleteFleetDriverVariables = {
  id: ..., 
};

// Call the `deleteFleetDriver()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteFleetDriver(deleteFleetDriverVars);
// Variables can be defined inline as well.
const { data } = await deleteFleetDriver({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteFleetDriver(dataConnect, deleteFleetDriverVars);

console.log(data.fleetDriver_delete);

// Or, you can use the `Promise` API.
deleteFleetDriver(deleteFleetDriverVars).then((response) => {
  const data = response.data;
  console.log(data.fleetDriver_delete);
});
```

### Using `DeleteFleetDriver`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteFleetDriverRef, DeleteFleetDriverVariables } from '@foratour-erp/dataconnect';

// The `DeleteFleetDriver` mutation requires an argument of type `DeleteFleetDriverVariables`:
const deleteFleetDriverVars: DeleteFleetDriverVariables = {
  id: ..., 
};

// Call the `deleteFleetDriverRef()` function to get a reference to the mutation.
const ref = deleteFleetDriverRef(deleteFleetDriverVars);
// Variables can be defined inline as well.
const ref = deleteFleetDriverRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteFleetDriverRef(dataConnect, deleteFleetDriverVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.fleetDriver_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.fleetDriver_delete);
});
```

## UpdateInvoice
You can execute the `UpdateInvoice` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateInvoice(vars: UpdateInvoiceVariables): MutationPromise<UpdateInvoiceData, UpdateInvoiceVariables>;

interface UpdateInvoiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInvoiceVariables): MutationRef<UpdateInvoiceData, UpdateInvoiceVariables>;
}
export const updateInvoiceRef: UpdateInvoiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateInvoice(dc: DataConnect, vars: UpdateInvoiceVariables): MutationPromise<UpdateInvoiceData, UpdateInvoiceVariables>;

interface UpdateInvoiceRef {
  ...
  (dc: DataConnect, vars: UpdateInvoiceVariables): MutationRef<UpdateInvoiceData, UpdateInvoiceVariables>;
}
export const updateInvoiceRef: UpdateInvoiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateInvoiceRef:
```typescript
const name = updateInvoiceRef.operationName;
console.log(name);
```

### Variables
The `UpdateInvoice` mutation requires an argument of type `UpdateInvoiceVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateInvoiceVariables {
  id: string;
  amount?: number | null;
  vatAmount?: number | null;
  status?: string | null;
  updatedAt?: string | null;
}
```
### Return Type
Recall that executing the `UpdateInvoice` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateInvoiceData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateInvoiceData {
  financialInvoice_update?: FinancialInvoice_Key | null;
}
```
### Using `UpdateInvoice`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateInvoice, UpdateInvoiceVariables } from '@foratour-erp/dataconnect';

// The `UpdateInvoice` mutation requires an argument of type `UpdateInvoiceVariables`:
const updateInvoiceVars: UpdateInvoiceVariables = {
  id: ..., 
  amount: ..., // optional
  vatAmount: ..., // optional
  status: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateInvoice()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateInvoice(updateInvoiceVars);
// Variables can be defined inline as well.
const { data } = await updateInvoice({ id: ..., amount: ..., vatAmount: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateInvoice(dataConnect, updateInvoiceVars);

console.log(data.financialInvoice_update);

// Or, you can use the `Promise` API.
updateInvoice(updateInvoiceVars).then((response) => {
  const data = response.data;
  console.log(data.financialInvoice_update);
});
```

### Using `UpdateInvoice`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateInvoiceRef, UpdateInvoiceVariables } from '@foratour-erp/dataconnect';

// The `UpdateInvoice` mutation requires an argument of type `UpdateInvoiceVariables`:
const updateInvoiceVars: UpdateInvoiceVariables = {
  id: ..., 
  amount: ..., // optional
  vatAmount: ..., // optional
  status: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateInvoiceRef()` function to get a reference to the mutation.
const ref = updateInvoiceRef(updateInvoiceVars);
// Variables can be defined inline as well.
const ref = updateInvoiceRef({ id: ..., amount: ..., vatAmount: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateInvoiceRef(dataConnect, updateInvoiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.financialInvoice_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.financialInvoice_update);
});
```

## UpdateClient
You can execute the `UpdateClient` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateClient(vars: UpdateClientVariables): MutationPromise<UpdateClientData, UpdateClientVariables>;

interface UpdateClientRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateClientVariables): MutationRef<UpdateClientData, UpdateClientVariables>;
}
export const updateClientRef: UpdateClientRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateClient(dc: DataConnect, vars: UpdateClientVariables): MutationPromise<UpdateClientData, UpdateClientVariables>;

interface UpdateClientRef {
  ...
  (dc: DataConnect, vars: UpdateClientVariables): MutationRef<UpdateClientData, UpdateClientVariables>;
}
export const updateClientRef: UpdateClientRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateClientRef:
```typescript
const name = updateClientRef.operationName;
console.log(name);
```

### Variables
The `UpdateClient` mutation requires an argument of type `UpdateClientVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateClientVariables {
  id: string;
  saldoFavor?: number | null;
  saldoDeber?: number | null;
  status?: string | null;
  moroso?: boolean | null;
  updatedAt?: string | null;
}
```
### Return Type
Recall that executing the `UpdateClient` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateClientData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateClientData {
  b2BClient_update?: B2BClient_Key | null;
}
```
### Using `UpdateClient`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateClient, UpdateClientVariables } from '@foratour-erp/dataconnect';

// The `UpdateClient` mutation requires an argument of type `UpdateClientVariables`:
const updateClientVars: UpdateClientVariables = {
  id: ..., 
  saldoFavor: ..., // optional
  saldoDeber: ..., // optional
  status: ..., // optional
  moroso: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateClient()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateClient(updateClientVars);
// Variables can be defined inline as well.
const { data } = await updateClient({ id: ..., saldoFavor: ..., saldoDeber: ..., status: ..., moroso: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateClient(dataConnect, updateClientVars);

console.log(data.b2BClient_update);

// Or, you can use the `Promise` API.
updateClient(updateClientVars).then((response) => {
  const data = response.data;
  console.log(data.b2BClient_update);
});
```

### Using `UpdateClient`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateClientRef, UpdateClientVariables } from '@foratour-erp/dataconnect';

// The `UpdateClient` mutation requires an argument of type `UpdateClientVariables`:
const updateClientVars: UpdateClientVariables = {
  id: ..., 
  saldoFavor: ..., // optional
  saldoDeber: ..., // optional
  status: ..., // optional
  moroso: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateClientRef()` function to get a reference to the mutation.
const ref = updateClientRef(updateClientVars);
// Variables can be defined inline as well.
const ref = updateClientRef({ id: ..., saldoFavor: ..., saldoDeber: ..., status: ..., moroso: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateClientRef(dataConnect, updateClientVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.b2BClient_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.b2BClient_update);
});
```

## DeleteInvoice
You can execute the `DeleteInvoice` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteInvoice(vars: DeleteInvoiceVariables): MutationPromise<DeleteInvoiceData, DeleteInvoiceVariables>;

interface DeleteInvoiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteInvoiceVariables): MutationRef<DeleteInvoiceData, DeleteInvoiceVariables>;
}
export const deleteInvoiceRef: DeleteInvoiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteInvoice(dc: DataConnect, vars: DeleteInvoiceVariables): MutationPromise<DeleteInvoiceData, DeleteInvoiceVariables>;

interface DeleteInvoiceRef {
  ...
  (dc: DataConnect, vars: DeleteInvoiceVariables): MutationRef<DeleteInvoiceData, DeleteInvoiceVariables>;
}
export const deleteInvoiceRef: DeleteInvoiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteInvoiceRef:
```typescript
const name = deleteInvoiceRef.operationName;
console.log(name);
```

### Variables
The `DeleteInvoice` mutation requires an argument of type `DeleteInvoiceVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteInvoiceVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteInvoice` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteInvoiceData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteInvoiceData {
  financialInvoice_delete?: FinancialInvoice_Key | null;
}
```
### Using `DeleteInvoice`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteInvoice, DeleteInvoiceVariables } from '@foratour-erp/dataconnect';

// The `DeleteInvoice` mutation requires an argument of type `DeleteInvoiceVariables`:
const deleteInvoiceVars: DeleteInvoiceVariables = {
  id: ..., 
};

// Call the `deleteInvoice()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteInvoice(deleteInvoiceVars);
// Variables can be defined inline as well.
const { data } = await deleteInvoice({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteInvoice(dataConnect, deleteInvoiceVars);

console.log(data.financialInvoice_delete);

// Or, you can use the `Promise` API.
deleteInvoice(deleteInvoiceVars).then((response) => {
  const data = response.data;
  console.log(data.financialInvoice_delete);
});
```

### Using `DeleteInvoice`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteInvoiceRef, DeleteInvoiceVariables } from '@foratour-erp/dataconnect';

// The `DeleteInvoice` mutation requires an argument of type `DeleteInvoiceVariables`:
const deleteInvoiceVars: DeleteInvoiceVariables = {
  id: ..., 
};

// Call the `deleteInvoiceRef()` function to get a reference to the mutation.
const ref = deleteInvoiceRef(deleteInvoiceVars);
// Variables can be defined inline as well.
const ref = deleteInvoiceRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteInvoiceRef(dataConnect, deleteInvoiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.financialInvoice_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.financialInvoice_delete);
});
```

## DeleteClient
You can execute the `DeleteClient` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteClient(vars: DeleteClientVariables): MutationPromise<DeleteClientData, DeleteClientVariables>;

interface DeleteClientRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteClientVariables): MutationRef<DeleteClientData, DeleteClientVariables>;
}
export const deleteClientRef: DeleteClientRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteClient(dc: DataConnect, vars: DeleteClientVariables): MutationPromise<DeleteClientData, DeleteClientVariables>;

interface DeleteClientRef {
  ...
  (dc: DataConnect, vars: DeleteClientVariables): MutationRef<DeleteClientData, DeleteClientVariables>;
}
export const deleteClientRef: DeleteClientRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteClientRef:
```typescript
const name = deleteClientRef.operationName;
console.log(name);
```

### Variables
The `DeleteClient` mutation requires an argument of type `DeleteClientVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteClientVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteClient` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteClientData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteClientData {
  b2BClient_delete?: B2BClient_Key | null;
}
```
### Using `DeleteClient`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteClient, DeleteClientVariables } from '@foratour-erp/dataconnect';

// The `DeleteClient` mutation requires an argument of type `DeleteClientVariables`:
const deleteClientVars: DeleteClientVariables = {
  id: ..., 
};

// Call the `deleteClient()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteClient(deleteClientVars);
// Variables can be defined inline as well.
const { data } = await deleteClient({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteClient(dataConnect, deleteClientVars);

console.log(data.b2BClient_delete);

// Or, you can use the `Promise` API.
deleteClient(deleteClientVars).then((response) => {
  const data = response.data;
  console.log(data.b2BClient_delete);
});
```

### Using `DeleteClient`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteClientRef, DeleteClientVariables } from '@foratour-erp/dataconnect';

// The `DeleteClient` mutation requires an argument of type `DeleteClientVariables`:
const deleteClientVars: DeleteClientVariables = {
  id: ..., 
};

// Call the `deleteClientRef()` function to get a reference to the mutation.
const ref = deleteClientRef(deleteClientVars);
// Variables can be defined inline as well.
const ref = deleteClientRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteClientRef(dataConnect, deleteClientVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.b2BClient_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.b2BClient_delete);
});
```

## DeletePaymentVoucher
You can execute the `DeletePaymentVoucher` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deletePaymentVoucher(vars: DeletePaymentVoucherVariables): MutationPromise<DeletePaymentVoucherData, DeletePaymentVoucherVariables>;

interface DeletePaymentVoucherRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePaymentVoucherVariables): MutationRef<DeletePaymentVoucherData, DeletePaymentVoucherVariables>;
}
export const deletePaymentVoucherRef: DeletePaymentVoucherRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deletePaymentVoucher(dc: DataConnect, vars: DeletePaymentVoucherVariables): MutationPromise<DeletePaymentVoucherData, DeletePaymentVoucherVariables>;

interface DeletePaymentVoucherRef {
  ...
  (dc: DataConnect, vars: DeletePaymentVoucherVariables): MutationRef<DeletePaymentVoucherData, DeletePaymentVoucherVariables>;
}
export const deletePaymentVoucherRef: DeletePaymentVoucherRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deletePaymentVoucherRef:
```typescript
const name = deletePaymentVoucherRef.operationName;
console.log(name);
```

### Variables
The `DeletePaymentVoucher` mutation requires an argument of type `DeletePaymentVoucherVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeletePaymentVoucherVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeletePaymentVoucher` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeletePaymentVoucherData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeletePaymentVoucherData {
  paymentVoucher_delete?: PaymentVoucher_Key | null;
}
```
### Using `DeletePaymentVoucher`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deletePaymentVoucher, DeletePaymentVoucherVariables } from '@foratour-erp/dataconnect';

// The `DeletePaymentVoucher` mutation requires an argument of type `DeletePaymentVoucherVariables`:
const deletePaymentVoucherVars: DeletePaymentVoucherVariables = {
  id: ..., 
};

// Call the `deletePaymentVoucher()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deletePaymentVoucher(deletePaymentVoucherVars);
// Variables can be defined inline as well.
const { data } = await deletePaymentVoucher({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deletePaymentVoucher(dataConnect, deletePaymentVoucherVars);

console.log(data.paymentVoucher_delete);

// Or, you can use the `Promise` API.
deletePaymentVoucher(deletePaymentVoucherVars).then((response) => {
  const data = response.data;
  console.log(data.paymentVoucher_delete);
});
```

### Using `DeletePaymentVoucher`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deletePaymentVoucherRef, DeletePaymentVoucherVariables } from '@foratour-erp/dataconnect';

// The `DeletePaymentVoucher` mutation requires an argument of type `DeletePaymentVoucherVariables`:
const deletePaymentVoucherVars: DeletePaymentVoucherVariables = {
  id: ..., 
};

// Call the `deletePaymentVoucherRef()` function to get a reference to the mutation.
const ref = deletePaymentVoucherRef(deletePaymentVoucherVars);
// Variables can be defined inline as well.
const ref = deletePaymentVoucherRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deletePaymentVoucherRef(dataConnect, deletePaymentVoucherVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.paymentVoucher_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.paymentVoucher_delete);
});
```

## DeleteReservation
You can execute the `DeleteReservation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteReservation(vars: DeleteReservationVariables): MutationPromise<DeleteReservationData, DeleteReservationVariables>;

interface DeleteReservationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteReservationVariables): MutationRef<DeleteReservationData, DeleteReservationVariables>;
}
export const deleteReservationRef: DeleteReservationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteReservation(dc: DataConnect, vars: DeleteReservationVariables): MutationPromise<DeleteReservationData, DeleteReservationVariables>;

interface DeleteReservationRef {
  ...
  (dc: DataConnect, vars: DeleteReservationVariables): MutationRef<DeleteReservationData, DeleteReservationVariables>;
}
export const deleteReservationRef: DeleteReservationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteReservationRef:
```typescript
const name = deleteReservationRef.operationName;
console.log(name);
```

### Variables
The `DeleteReservation` mutation requires an argument of type `DeleteReservationVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteReservationVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteReservation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteReservationData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteReservationData {
  reservation_delete?: Reservation_Key | null;
}
```
### Using `DeleteReservation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteReservation, DeleteReservationVariables } from '@foratour-erp/dataconnect';

// The `DeleteReservation` mutation requires an argument of type `DeleteReservationVariables`:
const deleteReservationVars: DeleteReservationVariables = {
  id: ..., 
};

// Call the `deleteReservation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteReservation(deleteReservationVars);
// Variables can be defined inline as well.
const { data } = await deleteReservation({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteReservation(dataConnect, deleteReservationVars);

console.log(data.reservation_delete);

// Or, you can use the `Promise` API.
deleteReservation(deleteReservationVars).then((response) => {
  const data = response.data;
  console.log(data.reservation_delete);
});
```

### Using `DeleteReservation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteReservationRef, DeleteReservationVariables } from '@foratour-erp/dataconnect';

// The `DeleteReservation` mutation requires an argument of type `DeleteReservationVariables`:
const deleteReservationVars: DeleteReservationVariables = {
  id: ..., 
};

// Call the `deleteReservationRef()` function to get a reference to the mutation.
const ref = deleteReservationRef(deleteReservationVars);
// Variables can be defined inline as well.
const ref = deleteReservationRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteReservationRef(dataConnect, deleteReservationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.reservation_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.reservation_delete);
});
```

## DeleteDetailedProperty
You can execute the `DeleteDetailedProperty` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteDetailedProperty(vars: DeleteDetailedPropertyVariables): MutationPromise<DeleteDetailedPropertyData, DeleteDetailedPropertyVariables>;

interface DeleteDetailedPropertyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteDetailedPropertyVariables): MutationRef<DeleteDetailedPropertyData, DeleteDetailedPropertyVariables>;
}
export const deleteDetailedPropertyRef: DeleteDetailedPropertyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteDetailedProperty(dc: DataConnect, vars: DeleteDetailedPropertyVariables): MutationPromise<DeleteDetailedPropertyData, DeleteDetailedPropertyVariables>;

interface DeleteDetailedPropertyRef {
  ...
  (dc: DataConnect, vars: DeleteDetailedPropertyVariables): MutationRef<DeleteDetailedPropertyData, DeleteDetailedPropertyVariables>;
}
export const deleteDetailedPropertyRef: DeleteDetailedPropertyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteDetailedPropertyRef:
```typescript
const name = deleteDetailedPropertyRef.operationName;
console.log(name);
```

### Variables
The `DeleteDetailedProperty` mutation requires an argument of type `DeleteDetailedPropertyVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteDetailedPropertyVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteDetailedProperty` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteDetailedPropertyData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteDetailedPropertyData {
  detailedProperty_delete?: DetailedProperty_Key | null;
}
```
### Using `DeleteDetailedProperty`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteDetailedProperty, DeleteDetailedPropertyVariables } from '@foratour-erp/dataconnect';

// The `DeleteDetailedProperty` mutation requires an argument of type `DeleteDetailedPropertyVariables`:
const deleteDetailedPropertyVars: DeleteDetailedPropertyVariables = {
  id: ..., 
};

// Call the `deleteDetailedProperty()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteDetailedProperty(deleteDetailedPropertyVars);
// Variables can be defined inline as well.
const { data } = await deleteDetailedProperty({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteDetailedProperty(dataConnect, deleteDetailedPropertyVars);

console.log(data.detailedProperty_delete);

// Or, you can use the `Promise` API.
deleteDetailedProperty(deleteDetailedPropertyVars).then((response) => {
  const data = response.data;
  console.log(data.detailedProperty_delete);
});
```

### Using `DeleteDetailedProperty`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteDetailedPropertyRef, DeleteDetailedPropertyVariables } from '@foratour-erp/dataconnect';

// The `DeleteDetailedProperty` mutation requires an argument of type `DeleteDetailedPropertyVariables`:
const deleteDetailedPropertyVars: DeleteDetailedPropertyVariables = {
  id: ..., 
};

// Call the `deleteDetailedPropertyRef()` function to get a reference to the mutation.
const ref = deleteDetailedPropertyRef(deleteDetailedPropertyVars);
// Variables can be defined inline as well.
const ref = deleteDetailedPropertyRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteDetailedPropertyRef(dataConnect, deleteDetailedPropertyVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.detailedProperty_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.detailedProperty_delete);
});
```

## DeleteRoomType
You can execute the `DeleteRoomType` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteRoomType(vars: DeleteRoomTypeVariables): MutationPromise<DeleteRoomTypeData, DeleteRoomTypeVariables>;

interface DeleteRoomTypeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRoomTypeVariables): MutationRef<DeleteRoomTypeData, DeleteRoomTypeVariables>;
}
export const deleteRoomTypeRef: DeleteRoomTypeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteRoomType(dc: DataConnect, vars: DeleteRoomTypeVariables): MutationPromise<DeleteRoomTypeData, DeleteRoomTypeVariables>;

interface DeleteRoomTypeRef {
  ...
  (dc: DataConnect, vars: DeleteRoomTypeVariables): MutationRef<DeleteRoomTypeData, DeleteRoomTypeVariables>;
}
export const deleteRoomTypeRef: DeleteRoomTypeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteRoomTypeRef:
```typescript
const name = deleteRoomTypeRef.operationName;
console.log(name);
```

### Variables
The `DeleteRoomType` mutation requires an argument of type `DeleteRoomTypeVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteRoomTypeVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteRoomType` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteRoomTypeData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteRoomTypeData {
  roomType_delete?: RoomType_Key | null;
}
```
### Using `DeleteRoomType`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteRoomType, DeleteRoomTypeVariables } from '@foratour-erp/dataconnect';

// The `DeleteRoomType` mutation requires an argument of type `DeleteRoomTypeVariables`:
const deleteRoomTypeVars: DeleteRoomTypeVariables = {
  id: ..., 
};

// Call the `deleteRoomType()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteRoomType(deleteRoomTypeVars);
// Variables can be defined inline as well.
const { data } = await deleteRoomType({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteRoomType(dataConnect, deleteRoomTypeVars);

console.log(data.roomType_delete);

// Or, you can use the `Promise` API.
deleteRoomType(deleteRoomTypeVars).then((response) => {
  const data = response.data;
  console.log(data.roomType_delete);
});
```

### Using `DeleteRoomType`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteRoomTypeRef, DeleteRoomTypeVariables } from '@foratour-erp/dataconnect';

// The `DeleteRoomType` mutation requires an argument of type `DeleteRoomTypeVariables`:
const deleteRoomTypeVars: DeleteRoomTypeVariables = {
  id: ..., 
};

// Call the `deleteRoomTypeRef()` function to get a reference to the mutation.
const ref = deleteRoomTypeRef(deleteRoomTypeVars);
// Variables can be defined inline as well.
const ref = deleteRoomTypeRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteRoomTypeRef(dataConnect, deleteRoomTypeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.roomType_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.roomType_delete);
});
```

## DeleteRatePlan
You can execute the `DeleteRatePlan` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteRatePlan(vars: DeleteRatePlanVariables): MutationPromise<DeleteRatePlanData, DeleteRatePlanVariables>;

interface DeleteRatePlanRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRatePlanVariables): MutationRef<DeleteRatePlanData, DeleteRatePlanVariables>;
}
export const deleteRatePlanRef: DeleteRatePlanRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteRatePlan(dc: DataConnect, vars: DeleteRatePlanVariables): MutationPromise<DeleteRatePlanData, DeleteRatePlanVariables>;

interface DeleteRatePlanRef {
  ...
  (dc: DataConnect, vars: DeleteRatePlanVariables): MutationRef<DeleteRatePlanData, DeleteRatePlanVariables>;
}
export const deleteRatePlanRef: DeleteRatePlanRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteRatePlanRef:
```typescript
const name = deleteRatePlanRef.operationName;
console.log(name);
```

### Variables
The `DeleteRatePlan` mutation requires an argument of type `DeleteRatePlanVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteRatePlanVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteRatePlan` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteRatePlanData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteRatePlanData {
  ratePlan_delete?: RatePlan_Key | null;
}
```
### Using `DeleteRatePlan`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteRatePlan, DeleteRatePlanVariables } from '@foratour-erp/dataconnect';

// The `DeleteRatePlan` mutation requires an argument of type `DeleteRatePlanVariables`:
const deleteRatePlanVars: DeleteRatePlanVariables = {
  id: ..., 
};

// Call the `deleteRatePlan()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteRatePlan(deleteRatePlanVars);
// Variables can be defined inline as well.
const { data } = await deleteRatePlan({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteRatePlan(dataConnect, deleteRatePlanVars);

console.log(data.ratePlan_delete);

// Or, you can use the `Promise` API.
deleteRatePlan(deleteRatePlanVars).then((response) => {
  const data = response.data;
  console.log(data.ratePlan_delete);
});
```

### Using `DeleteRatePlan`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteRatePlanRef, DeleteRatePlanVariables } from '@foratour-erp/dataconnect';

// The `DeleteRatePlan` mutation requires an argument of type `DeleteRatePlanVariables`:
const deleteRatePlanVars: DeleteRatePlanVariables = {
  id: ..., 
};

// Call the `deleteRatePlanRef()` function to get a reference to the mutation.
const ref = deleteRatePlanRef(deleteRatePlanVars);
// Variables can be defined inline as well.
const ref = deleteRatePlanRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteRatePlanRef(dataConnect, deleteRatePlanVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.ratePlan_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.ratePlan_delete);
});
```

## DeleteStopSale
You can execute the `DeleteStopSale` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteStopSale(vars: DeleteStopSaleVariables): MutationPromise<DeleteStopSaleData, DeleteStopSaleVariables>;

interface DeleteStopSaleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteStopSaleVariables): MutationRef<DeleteStopSaleData, DeleteStopSaleVariables>;
}
export const deleteStopSaleRef: DeleteStopSaleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteStopSale(dc: DataConnect, vars: DeleteStopSaleVariables): MutationPromise<DeleteStopSaleData, DeleteStopSaleVariables>;

interface DeleteStopSaleRef {
  ...
  (dc: DataConnect, vars: DeleteStopSaleVariables): MutationRef<DeleteStopSaleData, DeleteStopSaleVariables>;
}
export const deleteStopSaleRef: DeleteStopSaleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteStopSaleRef:
```typescript
const name = deleteStopSaleRef.operationName;
console.log(name);
```

### Variables
The `DeleteStopSale` mutation requires an argument of type `DeleteStopSaleVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteStopSaleVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteStopSale` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteStopSaleData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteStopSaleData {
  stopSale_delete?: StopSale_Key | null;
}
```
### Using `DeleteStopSale`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteStopSale, DeleteStopSaleVariables } from '@foratour-erp/dataconnect';

// The `DeleteStopSale` mutation requires an argument of type `DeleteStopSaleVariables`:
const deleteStopSaleVars: DeleteStopSaleVariables = {
  id: ..., 
};

// Call the `deleteStopSale()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteStopSale(deleteStopSaleVars);
// Variables can be defined inline as well.
const { data } = await deleteStopSale({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteStopSale(dataConnect, deleteStopSaleVars);

console.log(data.stopSale_delete);

// Or, you can use the `Promise` API.
deleteStopSale(deleteStopSaleVars).then((response) => {
  const data = response.data;
  console.log(data.stopSale_delete);
});
```

### Using `DeleteStopSale`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteStopSaleRef, DeleteStopSaleVariables } from '@foratour-erp/dataconnect';

// The `DeleteStopSale` mutation requires an argument of type `DeleteStopSaleVariables`:
const deleteStopSaleVars: DeleteStopSaleVariables = {
  id: ..., 
};

// Call the `deleteStopSaleRef()` function to get a reference to the mutation.
const ref = deleteStopSaleRef(deleteStopSaleVars);
// Variables can be defined inline as well.
const ref = deleteStopSaleRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteStopSaleRef(dataConnect, deleteStopSaleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.stopSale_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.stopSale_delete);
});
```

## InsertPayableObligation
You can execute the `InsertPayableObligation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertPayableObligation(vars: InsertPayableObligationVariables): MutationPromise<InsertPayableObligationData, InsertPayableObligationVariables>;

interface InsertPayableObligationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertPayableObligationVariables): MutationRef<InsertPayableObligationData, InsertPayableObligationVariables>;
}
export const insertPayableObligationRef: InsertPayableObligationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertPayableObligation(dc: DataConnect, vars: InsertPayableObligationVariables): MutationPromise<InsertPayableObligationData, InsertPayableObligationVariables>;

interface InsertPayableObligationRef {
  ...
  (dc: DataConnect, vars: InsertPayableObligationVariables): MutationRef<InsertPayableObligationData, InsertPayableObligationVariables>;
}
export const insertPayableObligationRef: InsertPayableObligationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertPayableObligationRef:
```typescript
const name = insertPayableObligationRef.operationName;
console.log(name);
```

### Variables
The `InsertPayableObligation` mutation requires an argument of type `InsertPayableObligationVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertPayableObligation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertPayableObligationData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertPayableObligationData {
  payableObligation_insert: PayableObligation_Key;
}
```
### Using `InsertPayableObligation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertPayableObligation, InsertPayableObligationVariables } from '@foratour-erp/dataconnect';

// The `InsertPayableObligation` mutation requires an argument of type `InsertPayableObligationVariables`:
const insertPayableObligationVars: InsertPayableObligationVariables = {
  id: ..., 
  dueDate: ..., 
  providerName: ..., 
  serviceDetail: ..., 
  locatorId: ..., 
  netCost: ..., 
  paidAmount: ..., 
  status: ..., 
  paymentMethod: ..., // optional
  reference: ..., // optional
  notes: ..., // optional
  date: ..., // optional
  currency: ..., // optional
  attachedFile: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertPayableObligation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertPayableObligation(insertPayableObligationVars);
// Variables can be defined inline as well.
const { data } = await insertPayableObligation({ id: ..., dueDate: ..., providerName: ..., serviceDetail: ..., locatorId: ..., netCost: ..., paidAmount: ..., status: ..., paymentMethod: ..., reference: ..., notes: ..., date: ..., currency: ..., attachedFile: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertPayableObligation(dataConnect, insertPayableObligationVars);

console.log(data.payableObligation_insert);

// Or, you can use the `Promise` API.
insertPayableObligation(insertPayableObligationVars).then((response) => {
  const data = response.data;
  console.log(data.payableObligation_insert);
});
```

### Using `InsertPayableObligation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertPayableObligationRef, InsertPayableObligationVariables } from '@foratour-erp/dataconnect';

// The `InsertPayableObligation` mutation requires an argument of type `InsertPayableObligationVariables`:
const insertPayableObligationVars: InsertPayableObligationVariables = {
  id: ..., 
  dueDate: ..., 
  providerName: ..., 
  serviceDetail: ..., 
  locatorId: ..., 
  netCost: ..., 
  paidAmount: ..., 
  status: ..., 
  paymentMethod: ..., // optional
  reference: ..., // optional
  notes: ..., // optional
  date: ..., // optional
  currency: ..., // optional
  attachedFile: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertPayableObligationRef()` function to get a reference to the mutation.
const ref = insertPayableObligationRef(insertPayableObligationVars);
// Variables can be defined inline as well.
const ref = insertPayableObligationRef({ id: ..., dueDate: ..., providerName: ..., serviceDetail: ..., locatorId: ..., netCost: ..., paidAmount: ..., status: ..., paymentMethod: ..., reference: ..., notes: ..., date: ..., currency: ..., attachedFile: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertPayableObligationRef(dataConnect, insertPayableObligationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.payableObligation_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.payableObligation_insert);
});
```

## UpdatePayableObligation
You can execute the `UpdatePayableObligation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updatePayableObligation(vars: UpdatePayableObligationVariables): MutationPromise<UpdatePayableObligationData, UpdatePayableObligationVariables>;

interface UpdatePayableObligationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePayableObligationVariables): MutationRef<UpdatePayableObligationData, UpdatePayableObligationVariables>;
}
export const updatePayableObligationRef: UpdatePayableObligationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updatePayableObligation(dc: DataConnect, vars: UpdatePayableObligationVariables): MutationPromise<UpdatePayableObligationData, UpdatePayableObligationVariables>;

interface UpdatePayableObligationRef {
  ...
  (dc: DataConnect, vars: UpdatePayableObligationVariables): MutationRef<UpdatePayableObligationData, UpdatePayableObligationVariables>;
}
export const updatePayableObligationRef: UpdatePayableObligationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updatePayableObligationRef:
```typescript
const name = updatePayableObligationRef.operationName;
console.log(name);
```

### Variables
The `UpdatePayableObligation` mutation requires an argument of type `UpdatePayableObligationVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdatePayableObligation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdatePayableObligationData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdatePayableObligationData {
  payableObligation_update?: PayableObligation_Key | null;
}
```
### Using `UpdatePayableObligation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updatePayableObligation, UpdatePayableObligationVariables } from '@foratour-erp/dataconnect';

// The `UpdatePayableObligation` mutation requires an argument of type `UpdatePayableObligationVariables`:
const updatePayableObligationVars: UpdatePayableObligationVariables = {
  id: ..., 
  dueDate: ..., // optional
  providerName: ..., // optional
  serviceDetail: ..., // optional
  locatorId: ..., // optional
  netCost: ..., // optional
  paidAmount: ..., // optional
  status: ..., // optional
  paymentMethod: ..., // optional
  reference: ..., // optional
  notes: ..., // optional
  date: ..., // optional
  currency: ..., // optional
  attachedFile: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updatePayableObligation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updatePayableObligation(updatePayableObligationVars);
// Variables can be defined inline as well.
const { data } = await updatePayableObligation({ id: ..., dueDate: ..., providerName: ..., serviceDetail: ..., locatorId: ..., netCost: ..., paidAmount: ..., status: ..., paymentMethod: ..., reference: ..., notes: ..., date: ..., currency: ..., attachedFile: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updatePayableObligation(dataConnect, updatePayableObligationVars);

console.log(data.payableObligation_update);

// Or, you can use the `Promise` API.
updatePayableObligation(updatePayableObligationVars).then((response) => {
  const data = response.data;
  console.log(data.payableObligation_update);
});
```

### Using `UpdatePayableObligation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updatePayableObligationRef, UpdatePayableObligationVariables } from '@foratour-erp/dataconnect';

// The `UpdatePayableObligation` mutation requires an argument of type `UpdatePayableObligationVariables`:
const updatePayableObligationVars: UpdatePayableObligationVariables = {
  id: ..., 
  dueDate: ..., // optional
  providerName: ..., // optional
  serviceDetail: ..., // optional
  locatorId: ..., // optional
  netCost: ..., // optional
  paidAmount: ..., // optional
  status: ..., // optional
  paymentMethod: ..., // optional
  reference: ..., // optional
  notes: ..., // optional
  date: ..., // optional
  currency: ..., // optional
  attachedFile: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updatePayableObligationRef()` function to get a reference to the mutation.
const ref = updatePayableObligationRef(updatePayableObligationVars);
// Variables can be defined inline as well.
const ref = updatePayableObligationRef({ id: ..., dueDate: ..., providerName: ..., serviceDetail: ..., locatorId: ..., netCost: ..., paidAmount: ..., status: ..., paymentMethod: ..., reference: ..., notes: ..., date: ..., currency: ..., attachedFile: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updatePayableObligationRef(dataConnect, updatePayableObligationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.payableObligation_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.payableObligation_update);
});
```

## DeletePayableObligation
You can execute the `DeletePayableObligation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deletePayableObligation(vars: DeletePayableObligationVariables): MutationPromise<DeletePayableObligationData, DeletePayableObligationVariables>;

interface DeletePayableObligationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePayableObligationVariables): MutationRef<DeletePayableObligationData, DeletePayableObligationVariables>;
}
export const deletePayableObligationRef: DeletePayableObligationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deletePayableObligation(dc: DataConnect, vars: DeletePayableObligationVariables): MutationPromise<DeletePayableObligationData, DeletePayableObligationVariables>;

interface DeletePayableObligationRef {
  ...
  (dc: DataConnect, vars: DeletePayableObligationVariables): MutationRef<DeletePayableObligationData, DeletePayableObligationVariables>;
}
export const deletePayableObligationRef: DeletePayableObligationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deletePayableObligationRef:
```typescript
const name = deletePayableObligationRef.operationName;
console.log(name);
```

### Variables
The `DeletePayableObligation` mutation requires an argument of type `DeletePayableObligationVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeletePayableObligationVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeletePayableObligation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeletePayableObligationData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeletePayableObligationData {
  payableObligation_delete?: PayableObligation_Key | null;
}
```
### Using `DeletePayableObligation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deletePayableObligation, DeletePayableObligationVariables } from '@foratour-erp/dataconnect';

// The `DeletePayableObligation` mutation requires an argument of type `DeletePayableObligationVariables`:
const deletePayableObligationVars: DeletePayableObligationVariables = {
  id: ..., 
};

// Call the `deletePayableObligation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deletePayableObligation(deletePayableObligationVars);
// Variables can be defined inline as well.
const { data } = await deletePayableObligation({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deletePayableObligation(dataConnect, deletePayableObligationVars);

console.log(data.payableObligation_delete);

// Or, you can use the `Promise` API.
deletePayableObligation(deletePayableObligationVars).then((response) => {
  const data = response.data;
  console.log(data.payableObligation_delete);
});
```

### Using `DeletePayableObligation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deletePayableObligationRef, DeletePayableObligationVariables } from '@foratour-erp/dataconnect';

// The `DeletePayableObligation` mutation requires an argument of type `DeletePayableObligationVariables`:
const deletePayableObligationVars: DeletePayableObligationVariables = {
  id: ..., 
};

// Call the `deletePayableObligationRef()` function to get a reference to the mutation.
const ref = deletePayableObligationRef(deletePayableObligationVars);
// Variables can be defined inline as well.
const ref = deletePayableObligationRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deletePayableObligationRef(dataConnect, deletePayableObligationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.payableObligation_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.payableObligation_delete);
});
```

## InsertProviderStatement
You can execute the `InsertProviderStatement` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertProviderStatement(vars: InsertProviderStatementVariables): MutationPromise<InsertProviderStatementData, InsertProviderStatementVariables>;

interface InsertProviderStatementRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertProviderStatementVariables): MutationRef<InsertProviderStatementData, InsertProviderStatementVariables>;
}
export const insertProviderStatementRef: InsertProviderStatementRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertProviderStatement(dc: DataConnect, vars: InsertProviderStatementVariables): MutationPromise<InsertProviderStatementData, InsertProviderStatementVariables>;

interface InsertProviderStatementRef {
  ...
  (dc: DataConnect, vars: InsertProviderStatementVariables): MutationRef<InsertProviderStatementData, InsertProviderStatementVariables>;
}
export const insertProviderStatementRef: InsertProviderStatementRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertProviderStatementRef:
```typescript
const name = insertProviderStatementRef.operationName;
console.log(name);
```

### Variables
The `InsertProviderStatement` mutation requires an argument of type `InsertProviderStatementVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertProviderStatement` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertProviderStatementData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertProviderStatementData {
  providerStatement_insert: ProviderStatement_Key;
}
```
### Using `InsertProviderStatement`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertProviderStatement, InsertProviderStatementVariables } from '@foratour-erp/dataconnect';

// The `InsertProviderStatement` mutation requires an argument of type `InsertProviderStatementVariables`:
const insertProviderStatementVars: InsertProviderStatementVariables = {
  id: ..., 
  providerName: ..., 
  date: ..., 
  type: ..., 
  amount: ..., 
  reference: ..., 
  status: ..., 
  updatedAt: ..., // optional
};

// Call the `insertProviderStatement()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertProviderStatement(insertProviderStatementVars);
// Variables can be defined inline as well.
const { data } = await insertProviderStatement({ id: ..., providerName: ..., date: ..., type: ..., amount: ..., reference: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertProviderStatement(dataConnect, insertProviderStatementVars);

console.log(data.providerStatement_insert);

// Or, you can use the `Promise` API.
insertProviderStatement(insertProviderStatementVars).then((response) => {
  const data = response.data;
  console.log(data.providerStatement_insert);
});
```

### Using `InsertProviderStatement`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertProviderStatementRef, InsertProviderStatementVariables } from '@foratour-erp/dataconnect';

// The `InsertProviderStatement` mutation requires an argument of type `InsertProviderStatementVariables`:
const insertProviderStatementVars: InsertProviderStatementVariables = {
  id: ..., 
  providerName: ..., 
  date: ..., 
  type: ..., 
  amount: ..., 
  reference: ..., 
  status: ..., 
  updatedAt: ..., // optional
};

// Call the `insertProviderStatementRef()` function to get a reference to the mutation.
const ref = insertProviderStatementRef(insertProviderStatementVars);
// Variables can be defined inline as well.
const ref = insertProviderStatementRef({ id: ..., providerName: ..., date: ..., type: ..., amount: ..., reference: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertProviderStatementRef(dataConnect, insertProviderStatementVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.providerStatement_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.providerStatement_insert);
});
```

## DeleteProviderStatement
You can execute the `DeleteProviderStatement` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteProviderStatement(vars: DeleteProviderStatementVariables): MutationPromise<DeleteProviderStatementData, DeleteProviderStatementVariables>;

interface DeleteProviderStatementRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteProviderStatementVariables): MutationRef<DeleteProviderStatementData, DeleteProviderStatementVariables>;
}
export const deleteProviderStatementRef: DeleteProviderStatementRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteProviderStatement(dc: DataConnect, vars: DeleteProviderStatementVariables): MutationPromise<DeleteProviderStatementData, DeleteProviderStatementVariables>;

interface DeleteProviderStatementRef {
  ...
  (dc: DataConnect, vars: DeleteProviderStatementVariables): MutationRef<DeleteProviderStatementData, DeleteProviderStatementVariables>;
}
export const deleteProviderStatementRef: DeleteProviderStatementRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteProviderStatementRef:
```typescript
const name = deleteProviderStatementRef.operationName;
console.log(name);
```

### Variables
The `DeleteProviderStatement` mutation requires an argument of type `DeleteProviderStatementVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteProviderStatementVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteProviderStatement` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteProviderStatementData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteProviderStatementData {
  providerStatement_delete?: ProviderStatement_Key | null;
}
```
### Using `DeleteProviderStatement`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteProviderStatement, DeleteProviderStatementVariables } from '@foratour-erp/dataconnect';

// The `DeleteProviderStatement` mutation requires an argument of type `DeleteProviderStatementVariables`:
const deleteProviderStatementVars: DeleteProviderStatementVariables = {
  id: ..., 
};

// Call the `deleteProviderStatement()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteProviderStatement(deleteProviderStatementVars);
// Variables can be defined inline as well.
const { data } = await deleteProviderStatement({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteProviderStatement(dataConnect, deleteProviderStatementVars);

console.log(data.providerStatement_delete);

// Or, you can use the `Promise` API.
deleteProviderStatement(deleteProviderStatementVars).then((response) => {
  const data = response.data;
  console.log(data.providerStatement_delete);
});
```

### Using `DeleteProviderStatement`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteProviderStatementRef, DeleteProviderStatementVariables } from '@foratour-erp/dataconnect';

// The `DeleteProviderStatement` mutation requires an argument of type `DeleteProviderStatementVariables`:
const deleteProviderStatementVars: DeleteProviderStatementVariables = {
  id: ..., 
};

// Call the `deleteProviderStatementRef()` function to get a reference to the mutation.
const ref = deleteProviderStatementRef(deleteProviderStatementVars);
// Variables can be defined inline as well.
const ref = deleteProviderStatementRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteProviderStatementRef(dataConnect, deleteProviderStatementVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.providerStatement_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.providerStatement_delete);
});
```

## InsertExtraService
You can execute the `InsertExtraService` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertExtraService(vars: InsertExtraServiceVariables): MutationPromise<InsertExtraServiceData, InsertExtraServiceVariables>;

interface InsertExtraServiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertExtraServiceVariables): MutationRef<InsertExtraServiceData, InsertExtraServiceVariables>;
}
export const insertExtraServiceRef: InsertExtraServiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertExtraService(dc: DataConnect, vars: InsertExtraServiceVariables): MutationPromise<InsertExtraServiceData, InsertExtraServiceVariables>;

interface InsertExtraServiceRef {
  ...
  (dc: DataConnect, vars: InsertExtraServiceVariables): MutationRef<InsertExtraServiceData, InsertExtraServiceVariables>;
}
export const insertExtraServiceRef: InsertExtraServiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertExtraServiceRef:
```typescript
const name = insertExtraServiceRef.operationName;
console.log(name);
```

### Variables
The `InsertExtraService` mutation requires an argument of type `InsertExtraServiceVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertExtraService` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertExtraServiceData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertExtraServiceData {
  extraService_insert: ExtraService_Key;
}
```
### Using `InsertExtraService`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertExtraService, InsertExtraServiceVariables } from '@foratour-erp/dataconnect';

// The `InsertExtraService` mutation requires an argument of type `InsertExtraServiceVariables`:
const insertExtraServiceVars: InsertExtraServiceVariables = {
  id: ..., 
  nombre: ..., 
  providerName: ..., 
  category: ..., 
  ubicacion: ..., 
  descripcion: ..., 
  politicasCancelacion: ..., 
  status: ..., 
  updatedAt: ..., // optional
};

// Call the `insertExtraService()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertExtraService(insertExtraServiceVars);
// Variables can be defined inline as well.
const { data } = await insertExtraService({ id: ..., nombre: ..., providerName: ..., category: ..., ubicacion: ..., descripcion: ..., politicasCancelacion: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertExtraService(dataConnect, insertExtraServiceVars);

console.log(data.extraService_insert);

// Or, you can use the `Promise` API.
insertExtraService(insertExtraServiceVars).then((response) => {
  const data = response.data;
  console.log(data.extraService_insert);
});
```

### Using `InsertExtraService`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertExtraServiceRef, InsertExtraServiceVariables } from '@foratour-erp/dataconnect';

// The `InsertExtraService` mutation requires an argument of type `InsertExtraServiceVariables`:
const insertExtraServiceVars: InsertExtraServiceVariables = {
  id: ..., 
  nombre: ..., 
  providerName: ..., 
  category: ..., 
  ubicacion: ..., 
  descripcion: ..., 
  politicasCancelacion: ..., 
  status: ..., 
  updatedAt: ..., // optional
};

// Call the `insertExtraServiceRef()` function to get a reference to the mutation.
const ref = insertExtraServiceRef(insertExtraServiceVars);
// Variables can be defined inline as well.
const ref = insertExtraServiceRef({ id: ..., nombre: ..., providerName: ..., category: ..., ubicacion: ..., descripcion: ..., politicasCancelacion: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertExtraServiceRef(dataConnect, insertExtraServiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.extraService_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.extraService_insert);
});
```

## UpdateExtraService
You can execute the `UpdateExtraService` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateExtraService(vars: UpdateExtraServiceVariables): MutationPromise<UpdateExtraServiceData, UpdateExtraServiceVariables>;

interface UpdateExtraServiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateExtraServiceVariables): MutationRef<UpdateExtraServiceData, UpdateExtraServiceVariables>;
}
export const updateExtraServiceRef: UpdateExtraServiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateExtraService(dc: DataConnect, vars: UpdateExtraServiceVariables): MutationPromise<UpdateExtraServiceData, UpdateExtraServiceVariables>;

interface UpdateExtraServiceRef {
  ...
  (dc: DataConnect, vars: UpdateExtraServiceVariables): MutationRef<UpdateExtraServiceData, UpdateExtraServiceVariables>;
}
export const updateExtraServiceRef: UpdateExtraServiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateExtraServiceRef:
```typescript
const name = updateExtraServiceRef.operationName;
console.log(name);
```

### Variables
The `UpdateExtraService` mutation requires an argument of type `UpdateExtraServiceVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateExtraService` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateExtraServiceData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateExtraServiceData {
  extraService_update?: ExtraService_Key | null;
}
```
### Using `UpdateExtraService`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateExtraService, UpdateExtraServiceVariables } from '@foratour-erp/dataconnect';

// The `UpdateExtraService` mutation requires an argument of type `UpdateExtraServiceVariables`:
const updateExtraServiceVars: UpdateExtraServiceVariables = {
  id: ..., 
  nombre: ..., // optional
  providerName: ..., // optional
  category: ..., // optional
  ubicacion: ..., // optional
  descripcion: ..., // optional
  politicasCancelacion: ..., // optional
  status: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateExtraService()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateExtraService(updateExtraServiceVars);
// Variables can be defined inline as well.
const { data } = await updateExtraService({ id: ..., nombre: ..., providerName: ..., category: ..., ubicacion: ..., descripcion: ..., politicasCancelacion: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateExtraService(dataConnect, updateExtraServiceVars);

console.log(data.extraService_update);

// Or, you can use the `Promise` API.
updateExtraService(updateExtraServiceVars).then((response) => {
  const data = response.data;
  console.log(data.extraService_update);
});
```

### Using `UpdateExtraService`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateExtraServiceRef, UpdateExtraServiceVariables } from '@foratour-erp/dataconnect';

// The `UpdateExtraService` mutation requires an argument of type `UpdateExtraServiceVariables`:
const updateExtraServiceVars: UpdateExtraServiceVariables = {
  id: ..., 
  nombre: ..., // optional
  providerName: ..., // optional
  category: ..., // optional
  ubicacion: ..., // optional
  descripcion: ..., // optional
  politicasCancelacion: ..., // optional
  status: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateExtraServiceRef()` function to get a reference to the mutation.
const ref = updateExtraServiceRef(updateExtraServiceVars);
// Variables can be defined inline as well.
const ref = updateExtraServiceRef({ id: ..., nombre: ..., providerName: ..., category: ..., ubicacion: ..., descripcion: ..., politicasCancelacion: ..., status: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateExtraServiceRef(dataConnect, updateExtraServiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.extraService_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.extraService_update);
});
```

## DeleteExtraService
You can execute the `DeleteExtraService` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteExtraService(vars: DeleteExtraServiceVariables): MutationPromise<DeleteExtraServiceData, DeleteExtraServiceVariables>;

interface DeleteExtraServiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteExtraServiceVariables): MutationRef<DeleteExtraServiceData, DeleteExtraServiceVariables>;
}
export const deleteExtraServiceRef: DeleteExtraServiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteExtraService(dc: DataConnect, vars: DeleteExtraServiceVariables): MutationPromise<DeleteExtraServiceData, DeleteExtraServiceVariables>;

interface DeleteExtraServiceRef {
  ...
  (dc: DataConnect, vars: DeleteExtraServiceVariables): MutationRef<DeleteExtraServiceData, DeleteExtraServiceVariables>;
}
export const deleteExtraServiceRef: DeleteExtraServiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteExtraServiceRef:
```typescript
const name = deleteExtraServiceRef.operationName;
console.log(name);
```

### Variables
The `DeleteExtraService` mutation requires an argument of type `DeleteExtraServiceVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteExtraServiceVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteExtraService` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteExtraServiceData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteExtraServiceData {
  extraService_delete?: ExtraService_Key | null;
}
```
### Using `DeleteExtraService`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteExtraService, DeleteExtraServiceVariables } from '@foratour-erp/dataconnect';

// The `DeleteExtraService` mutation requires an argument of type `DeleteExtraServiceVariables`:
const deleteExtraServiceVars: DeleteExtraServiceVariables = {
  id: ..., 
};

// Call the `deleteExtraService()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteExtraService(deleteExtraServiceVars);
// Variables can be defined inline as well.
const { data } = await deleteExtraService({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteExtraService(dataConnect, deleteExtraServiceVars);

console.log(data.extraService_delete);

// Or, you can use the `Promise` API.
deleteExtraService(deleteExtraServiceVars).then((response) => {
  const data = response.data;
  console.log(data.extraService_delete);
});
```

### Using `DeleteExtraService`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteExtraServiceRef, DeleteExtraServiceVariables } from '@foratour-erp/dataconnect';

// The `DeleteExtraService` mutation requires an argument of type `DeleteExtraServiceVariables`:
const deleteExtraServiceVars: DeleteExtraServiceVariables = {
  id: ..., 
};

// Call the `deleteExtraServiceRef()` function to get a reference to the mutation.
const ref = deleteExtraServiceRef(deleteExtraServiceVars);
// Variables can be defined inline as well.
const ref = deleteExtraServiceRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteExtraServiceRef(dataConnect, deleteExtraServiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.extraService_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.extraService_delete);
});
```

## InsertServiceRate
You can execute the `InsertServiceRate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertServiceRate(vars: InsertServiceRateVariables): MutationPromise<InsertServiceRateData, InsertServiceRateVariables>;

interface InsertServiceRateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertServiceRateVariables): MutationRef<InsertServiceRateData, InsertServiceRateVariables>;
}
export const insertServiceRateRef: InsertServiceRateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertServiceRate(dc: DataConnect, vars: InsertServiceRateVariables): MutationPromise<InsertServiceRateData, InsertServiceRateVariables>;

interface InsertServiceRateRef {
  ...
  (dc: DataConnect, vars: InsertServiceRateVariables): MutationRef<InsertServiceRateData, InsertServiceRateVariables>;
}
export const insertServiceRateRef: InsertServiceRateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertServiceRateRef:
```typescript
const name = insertServiceRateRef.operationName;
console.log(name);
```

### Variables
The `InsertServiceRate` mutation requires an argument of type `InsertServiceRateVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `InsertServiceRate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertServiceRateData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertServiceRateData {
  serviceRate_insert: ServiceRate_Key;
}
```
### Using `InsertServiceRate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertServiceRate, InsertServiceRateVariables } from '@foratour-erp/dataconnect';

// The `InsertServiceRate` mutation requires an argument of type `InsertServiceRateVariables`:
const insertServiceRateVars: InsertServiceRateVariables = {
  id: ..., 
  extraServiceId: ..., 
  temporadaInicio: ..., 
  temporadaFin: ..., 
  pricingModel: ..., 
  netoAdulto: ..., // optional
  ventaAdulto: ..., // optional
  netoNino: ..., // optional
  ventaNino: ..., // optional
  capacidadMaxima: ..., // optional
  netoTotal: ..., // optional
  ventaTotal: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertServiceRate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertServiceRate(insertServiceRateVars);
// Variables can be defined inline as well.
const { data } = await insertServiceRate({ id: ..., extraServiceId: ..., temporadaInicio: ..., temporadaFin: ..., pricingModel: ..., netoAdulto: ..., ventaAdulto: ..., netoNino: ..., ventaNino: ..., capacidadMaxima: ..., netoTotal: ..., ventaTotal: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertServiceRate(dataConnect, insertServiceRateVars);

console.log(data.serviceRate_insert);

// Or, you can use the `Promise` API.
insertServiceRate(insertServiceRateVars).then((response) => {
  const data = response.data;
  console.log(data.serviceRate_insert);
});
```

### Using `InsertServiceRate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertServiceRateRef, InsertServiceRateVariables } from '@foratour-erp/dataconnect';

// The `InsertServiceRate` mutation requires an argument of type `InsertServiceRateVariables`:
const insertServiceRateVars: InsertServiceRateVariables = {
  id: ..., 
  extraServiceId: ..., 
  temporadaInicio: ..., 
  temporadaFin: ..., 
  pricingModel: ..., 
  netoAdulto: ..., // optional
  ventaAdulto: ..., // optional
  netoNino: ..., // optional
  ventaNino: ..., // optional
  capacidadMaxima: ..., // optional
  netoTotal: ..., // optional
  ventaTotal: ..., // optional
  updatedAt: ..., // optional
};

// Call the `insertServiceRateRef()` function to get a reference to the mutation.
const ref = insertServiceRateRef(insertServiceRateVars);
// Variables can be defined inline as well.
const ref = insertServiceRateRef({ id: ..., extraServiceId: ..., temporadaInicio: ..., temporadaFin: ..., pricingModel: ..., netoAdulto: ..., ventaAdulto: ..., netoNino: ..., ventaNino: ..., capacidadMaxima: ..., netoTotal: ..., ventaTotal: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertServiceRateRef(dataConnect, insertServiceRateVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.serviceRate_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.serviceRate_insert);
});
```

## UpdateServiceRate
You can execute the `UpdateServiceRate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateServiceRate(vars: UpdateServiceRateVariables): MutationPromise<UpdateServiceRateData, UpdateServiceRateVariables>;

interface UpdateServiceRateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateServiceRateVariables): MutationRef<UpdateServiceRateData, UpdateServiceRateVariables>;
}
export const updateServiceRateRef: UpdateServiceRateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateServiceRate(dc: DataConnect, vars: UpdateServiceRateVariables): MutationPromise<UpdateServiceRateData, UpdateServiceRateVariables>;

interface UpdateServiceRateRef {
  ...
  (dc: DataConnect, vars: UpdateServiceRateVariables): MutationRef<UpdateServiceRateData, UpdateServiceRateVariables>;
}
export const updateServiceRateRef: UpdateServiceRateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateServiceRateRef:
```typescript
const name = updateServiceRateRef.operationName;
console.log(name);
```

### Variables
The `UpdateServiceRate` mutation requires an argument of type `UpdateServiceRateVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateServiceRate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateServiceRateData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateServiceRateData {
  serviceRate_update?: ServiceRate_Key | null;
}
```
### Using `UpdateServiceRate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateServiceRate, UpdateServiceRateVariables } from '@foratour-erp/dataconnect';

// The `UpdateServiceRate` mutation requires an argument of type `UpdateServiceRateVariables`:
const updateServiceRateVars: UpdateServiceRateVariables = {
  id: ..., 
  temporadaInicio: ..., // optional
  temporadaFin: ..., // optional
  pricingModel: ..., // optional
  netoAdulto: ..., // optional
  ventaAdulto: ..., // optional
  netoNino: ..., // optional
  ventaNino: ..., // optional
  capacidadMaxima: ..., // optional
  netoTotal: ..., // optional
  ventaTotal: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateServiceRate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateServiceRate(updateServiceRateVars);
// Variables can be defined inline as well.
const { data } = await updateServiceRate({ id: ..., temporadaInicio: ..., temporadaFin: ..., pricingModel: ..., netoAdulto: ..., ventaAdulto: ..., netoNino: ..., ventaNino: ..., capacidadMaxima: ..., netoTotal: ..., ventaTotal: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateServiceRate(dataConnect, updateServiceRateVars);

console.log(data.serviceRate_update);

// Or, you can use the `Promise` API.
updateServiceRate(updateServiceRateVars).then((response) => {
  const data = response.data;
  console.log(data.serviceRate_update);
});
```

### Using `UpdateServiceRate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateServiceRateRef, UpdateServiceRateVariables } from '@foratour-erp/dataconnect';

// The `UpdateServiceRate` mutation requires an argument of type `UpdateServiceRateVariables`:
const updateServiceRateVars: UpdateServiceRateVariables = {
  id: ..., 
  temporadaInicio: ..., // optional
  temporadaFin: ..., // optional
  pricingModel: ..., // optional
  netoAdulto: ..., // optional
  ventaAdulto: ..., // optional
  netoNino: ..., // optional
  ventaNino: ..., // optional
  capacidadMaxima: ..., // optional
  netoTotal: ..., // optional
  ventaTotal: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateServiceRateRef()` function to get a reference to the mutation.
const ref = updateServiceRateRef(updateServiceRateVars);
// Variables can be defined inline as well.
const ref = updateServiceRateRef({ id: ..., temporadaInicio: ..., temporadaFin: ..., pricingModel: ..., netoAdulto: ..., ventaAdulto: ..., netoNino: ..., ventaNino: ..., capacidadMaxima: ..., netoTotal: ..., ventaTotal: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateServiceRateRef(dataConnect, updateServiceRateVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.serviceRate_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.serviceRate_update);
});
```

## DeleteServiceRate
You can execute the `DeleteServiceRate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteServiceRate(vars: DeleteServiceRateVariables): MutationPromise<DeleteServiceRateData, DeleteServiceRateVariables>;

interface DeleteServiceRateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteServiceRateVariables): MutationRef<DeleteServiceRateData, DeleteServiceRateVariables>;
}
export const deleteServiceRateRef: DeleteServiceRateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteServiceRate(dc: DataConnect, vars: DeleteServiceRateVariables): MutationPromise<DeleteServiceRateData, DeleteServiceRateVariables>;

interface DeleteServiceRateRef {
  ...
  (dc: DataConnect, vars: DeleteServiceRateVariables): MutationRef<DeleteServiceRateData, DeleteServiceRateVariables>;
}
export const deleteServiceRateRef: DeleteServiceRateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteServiceRateRef:
```typescript
const name = deleteServiceRateRef.operationName;
console.log(name);
```

### Variables
The `DeleteServiceRate` mutation requires an argument of type `DeleteServiceRateVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteServiceRateVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteServiceRate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteServiceRateData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteServiceRateData {
  serviceRate_delete?: ServiceRate_Key | null;
}
```
### Using `DeleteServiceRate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteServiceRate, DeleteServiceRateVariables } from '@foratour-erp/dataconnect';

// The `DeleteServiceRate` mutation requires an argument of type `DeleteServiceRateVariables`:
const deleteServiceRateVars: DeleteServiceRateVariables = {
  id: ..., 
};

// Call the `deleteServiceRate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteServiceRate(deleteServiceRateVars);
// Variables can be defined inline as well.
const { data } = await deleteServiceRate({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteServiceRate(dataConnect, deleteServiceRateVars);

console.log(data.serviceRate_delete);

// Or, you can use the `Promise` API.
deleteServiceRate(deleteServiceRateVars).then((response) => {
  const data = response.data;
  console.log(data.serviceRate_delete);
});
```

### Using `DeleteServiceRate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteServiceRateRef, DeleteServiceRateVariables } from '@foratour-erp/dataconnect';

// The `DeleteServiceRate` mutation requires an argument of type `DeleteServiceRateVariables`:
const deleteServiceRateVars: DeleteServiceRateVariables = {
  id: ..., 
};

// Call the `deleteServiceRateRef()` function to get a reference to the mutation.
const ref = deleteServiceRateRef(deleteServiceRateVars);
// Variables can be defined inline as well.
const ref = deleteServiceRateRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteServiceRateRef(dataConnect, deleteServiceRateVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.serviceRate_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.serviceRate_delete);
});
```

