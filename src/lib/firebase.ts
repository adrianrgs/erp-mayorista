import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Este módulo hoy solo se usa para Firebase Storage (subida de comprobantes de pago en
// FacturacionView). El resto de la app pasa por la API REST propia (NestJS + axios), no
// por el SDK de Data Connect ni por Firebase Auth — se quitó el login anónimo y la
// inicialización de Data Connect/Auth, que ya no tenían ningún consumidor y solo
// producían un error de consola en cada carga (Anonymous Auth no está habilitado en el
// proyecto de Firebase).
// Config vía variables de entorno (VITE_FIREBASE_*), con fallback a los valores actuales para
// no romper dev. Los valores web de Firebase no son secretos, pero deben poder cambiarse por
// entorno para apuntar a otro proyecto (staging/prod) sin editar código.
const env = (import.meta as any).env ?? {};
const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || "foratour-erp-2026",
  appId: env.VITE_FIREBASE_APP_ID || "1:982546946974:web:f7436bc4dbd7eeecb3d48f",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "foratour-erp-2026.firebasestorage.app",
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBymL7A3onyUvUZXFHpIrT4IKe66LAo9Zw",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "foratour-erp-2026.firebaseapp.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "982546946974",
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
