# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `foratour-erp-connector`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListReservations*](#listreservations)
  - [*ListClients*](#listclients)
  - [*ListInvoices*](#listinvoices)
  - [*ListProperties*](#listproperties)
- [**Mutations**](#mutations)

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

## ListReservations
You can execute the `ListReservations` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listReservations(): QueryPromise<ListReservationsData, undefined>;

interface ListReservationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListReservationsData, undefined>;
}
export const listReservationsRef: ListReservationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listReservations(dc: DataConnect): QueryPromise<ListReservationsData, undefined>;

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
listClients(): QueryPromise<ListClientsData, undefined>;

interface ListClientsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListClientsData, undefined>;
}
export const listClientsRef: ListClientsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listClients(dc: DataConnect): QueryPromise<ListClientsData, undefined>;

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
    nombre: string;
    email: string;
    telefono: string;
    type: string;
    tier: string;
    balance: number;
    status: string;
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
listInvoices(): QueryPromise<ListInvoicesData, undefined>;

interface ListInvoicesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListInvoicesData, undefined>;
}
export const listInvoicesRef: ListInvoicesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listInvoices(dc: DataConnect): QueryPromise<ListInvoicesData, undefined>;

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
listProperties(): QueryPromise<ListPropertiesData, undefined>;

interface ListPropertiesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPropertiesData, undefined>;
}
export const listPropertiesRef: ListPropertiesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProperties(dc: DataConnect): QueryPromise<ListPropertiesData, undefined>;

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

# Mutations

No mutations were generated for the `foratour-erp-connector` connector.

If you want to learn more about how to use mutations in Data Connect, you can follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

