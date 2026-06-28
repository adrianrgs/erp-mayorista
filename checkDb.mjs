import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDataConnect, executeQuery } from "firebase/data-connect";
import { listClientsRef, listInvoicesRef, listPaymentVouchersRef, connectorConfig } from "./src/lib/dataconnect/esm/index.esm.js";

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

async function check() {
  await signInAnonymously(auth).catch(e => console.warn(e.message));
  
  const clients = await executeQuery(listClientsRef(dataConnect));
  console.log("Clients count:", clients.data.b2BClients.length);
  
  const invoices = await executeQuery(listInvoicesRef(dataConnect));
  console.log("Invoices count:", invoices.data.financialInvoices.length);
  
  const vouchers = await executeQuery(listPaymentVouchersRef(dataConnect));
  console.log("Vouchers count:", vouchers.data.paymentVouchers.length);
  
  process.exit(0);
}

check().catch(console.error);
