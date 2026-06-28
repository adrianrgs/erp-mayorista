# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { listPaymentVouchers, insertPaymentVoucher, updatePaymentVoucher, insertReservation, updateReservationStatus, updateReservation, insertClient, insertInvoice, insertDetailedProperty, updateDetailedProperty } from '@foratour-erp/dataconnect';


// Operation ListPaymentVouchers: 
const { data } = await ListPaymentVouchers(dataConnect);

// Operation InsertPaymentVoucher:  For variables, look at type InsertPaymentVoucherVars in ../index.d.ts
const { data } = await InsertPaymentVoucher(dataConnect, insertPaymentVoucherVars);

// Operation UpdatePaymentVoucher:  For variables, look at type UpdatePaymentVoucherVars in ../index.d.ts
const { data } = await UpdatePaymentVoucher(dataConnect, updatePaymentVoucherVars);

// Operation InsertReservation:  For variables, look at type InsertReservationVars in ../index.d.ts
const { data } = await InsertReservation(dataConnect, insertReservationVars);

// Operation UpdateReservationStatus:  For variables, look at type UpdateReservationStatusVars in ../index.d.ts
const { data } = await UpdateReservationStatus(dataConnect, updateReservationStatusVars);

// Operation UpdateReservation:  For variables, look at type UpdateReservationVars in ../index.d.ts
const { data } = await UpdateReservation(dataConnect, updateReservationVars);

// Operation InsertClient:  For variables, look at type InsertClientVars in ../index.d.ts
const { data } = await InsertClient(dataConnect, insertClientVars);

// Operation InsertInvoice:  For variables, look at type InsertInvoiceVars in ../index.d.ts
const { data } = await InsertInvoice(dataConnect, insertInvoiceVars);

// Operation InsertDetailedProperty:  For variables, look at type InsertDetailedPropertyVars in ../index.d.ts
const { data } = await InsertDetailedProperty(dataConnect, insertDetailedPropertyVars);

// Operation UpdateDetailedProperty:  For variables, look at type UpdateDetailedPropertyVars in ../index.d.ts
const { data } = await UpdateDetailedProperty(dataConnect, updateDetailedPropertyVars);


```