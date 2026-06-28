import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDataConnect, executeQuery } from "firebase/data-connect";
import { listReservationsRef, listTransferServicesRef, connectorConfig } from "./src/lib/dataconnect/esm/index.esm.js";

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

async function inspect() {
  await signInAnonymously(auth).catch(e => console.warn(e.message));

  console.log("--- RESERVATIONS ---");
  const res = await executeQuery(listReservationsRef(dataConnect));
  console.log(JSON.stringify(res.data.reservations || [], null, 2));

  console.log("--- TRANSFERS ---");
  const tr = await executeQuery(listTransferServicesRef(dataConnect));
  console.log(JSON.stringify(tr.data.transferServices || [], null, 2));

  process.exit(0);
}

inspect().catch(console.error);
