import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { connectDataConnectEmulator, getDataConnect } from "firebase/data-connect";
import { connectorConfig } from "./dataconnect";

const firebaseConfig = {
  projectId: "foratour-erp-2026",
  appId: "1:982546946974:web:f7436bc4dbd7eeecb3d48f",
  storageBucket: "foratour-erp-2026.firebasestorage.app",
  apiKey: "AIzaSyBymL7A3onyUvUZXFHpIrT4IKe66LAo9Zw",
  authDomain: "foratour-erp-2026.firebaseapp.com",
  messagingSenderId: "982546946974"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Data Connect
export const dataConnect = getDataConnect(connectorConfig);

// Sign in anonymously to bypass @auth(level: USER) requirements if needed
signInAnonymously(auth).catch((error) => {
  console.error("Anonymous auth failed:", error);
});
