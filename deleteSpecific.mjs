import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDataConnect, executeMutation } from "firebase/data-connect";
import { deleteInvoiceRef, connectorConfig } from "./src/lib/dataconnect/esm/index.esm.js";

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

async function wipe() {
  await signInAnonymously(auth).catch(e => console.warn(e.message));
  
  const ids = ["FAC-5880", "FAC-5633", "FAC-5541"];
  for (const id of ids) {
    try {
      console.log(`Deleting ${id}...`);
      const res = await executeMutation(deleteInvoiceRef(dataConnect, {id}));
      console.log(`Result:`, JSON.stringify(res));
    } catch (e) {
      console.error(`Error deleting ${id}:`, e.message);
    }
  }
}

wipe().catch(console.error);
