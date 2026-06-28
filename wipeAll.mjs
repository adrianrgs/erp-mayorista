import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDataConnect, executeQuery, executeMutation } from "firebase/data-connect";
import { 
  connectorConfig,
  listClientsRef, deleteClientRef,
  listInvoicesRef, deleteInvoiceRef,
  listPaymentVouchersRef, deletePaymentVoucherRef,
  listReservationsRef, deleteReservationRef,
  listDetailedPropertiesRef, deleteDetailedPropertyRef,
  listRoomTypesRef, deleteRoomTypeRef,
  listRatePlansRef, deleteRatePlanRef,
  listStopSalesRef, deleteStopSaleRef,
  listFlightTicketsRef, deleteFlightTicketRef,
  listTransferServicesRef, deleteTransferServiceRef,
  listFleetVehiclesRef, deleteFleetVehicleRef,
  listFleetDriversRef, deleteFleetDriverRef,
  listPayableObligationsRef, deletePayableObligationRef,
  listProviderStatementsRef, deleteProviderStatementRef,
  listExtraServicesRef, deleteExtraServiceRef,
  listServiceRatesRef, deleteServiceRateRef
} from "./src/lib/dataconnect/esm/index.esm.js";

const firebaseConfig = {
  projectId: "foratour-erp-2026",
  appId: "1:982546946974:web:f7436bc4dbd7eeecb3d48f",
  storageBucket: "foratour-erp-2026.firebasestorage.app",
  apiKey: "AIzaSyBymL7A3onyUvUZXFHpIrT4IKe66LAo9Zw",
  authDomain: "foratour-erp-2026.firebaseapp.com",
  messagingSenderId: "982546946974"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const dataConnect = getDataConnect(connectorConfig);

async function wipeAll() {
  await signInAnonymously(auth).catch(e => console.warn(e.message));

  const wipeGeneric = async (listRef, arrName, deleteRefFn) => {
    try {
      const res = await executeQuery(listRef);
      const items = res.data[arrName];
      console.log(`Found ${items.length} in ${arrName}`);
      for (const item of items) {
        try {
          await executeMutation(deleteRefFn(dataConnect, {id: item.id}));
        } catch (e) {
          // ignore circular JSON from executeMutation success
        }
      }
    } catch (e) {
      console.error(`Error processing ${arrName}:`, e.message);
    }
  };

  await wipeGeneric(listClientsRef(dataConnect), "b2BClients", deleteClientRef);
  await wipeGeneric(listInvoicesRef(dataConnect), "financialInvoices", deleteInvoiceRef);
  await wipeGeneric(listPaymentVouchersRef(dataConnect), "paymentVouchers", deletePaymentVoucherRef);
  
  await wipeGeneric(listReservationsRef(dataConnect), "reservations", deleteReservationRef);
  await wipeGeneric(listDetailedPropertiesRef(dataConnect), "detailedProperties", deleteDetailedPropertyRef);
  await wipeGeneric(listRoomTypesRef(dataConnect), "roomTypes", deleteRoomTypeRef);
  await wipeGeneric(listRatePlansRef(dataConnect), "ratePlans", deleteRatePlanRef);
  await wipeGeneric(listStopSalesRef(dataConnect), "stopSales", deleteStopSaleRef);
  
  await wipeGeneric(listFlightTicketsRef(dataConnect), "flightTickets", deleteFlightTicketRef);
  await wipeGeneric(listTransferServicesRef(dataConnect), "transferServices", deleteTransferServiceRef);
  await wipeGeneric(listFleetVehiclesRef(dataConnect), "fleetVehicles", deleteFleetVehicleRef);
  await wipeGeneric(listFleetDriversRef(dataConnect), "fleetDrivers", deleteFleetDriverRef);
  await wipeGeneric(listPayableObligationsRef(dataConnect), "payableObligations", deletePayableObligationRef);
  await wipeGeneric(listProviderStatementsRef(dataConnect), "providerStatements", deleteProviderStatementRef);
  await wipeGeneric(listExtraServicesRef(dataConnect), "extraServices", deleteExtraServiceRef);
  await wipeGeneric(listServiceRatesRef(dataConnect), "serviceRates", deleteServiceRateRef);

  console.log("WIPE ALL COMPLETED.");
  process.exit(0);
}

wipeAll().catch(console.error);
