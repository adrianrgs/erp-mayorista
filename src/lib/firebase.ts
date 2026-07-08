import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Este módulo hoy solo se usa para Firebase Storage (subida de comprobantes de pago en
// FacturacionView). El resto de la app pasa por la API REST propia (NestJS + axios), no
// por el SDK de Data Connect ni por Firebase Auth — se quitó el login anónimo y la
// inicialización de Data Connect/Auth, que ya no tenían ningún consumidor y solo
// producían un error de consola en cada carga (Anonymous Auth no está habilitado en el
// proyecto de Firebase).
const firebaseConfig = {
  projectId: "foratour-erp-2026",
  appId: "1:982546946974:web:f7436bc4dbd7eeecb3d48f",
  storageBucket: "foratour-erp-2026.firebasestorage.app",
  apiKey: "AIzaSyBymL7A3onyUvUZXFHpIrT4IKe66LAo9Zw",
  authDomain: "foratour-erp-2026.firebaseapp.com",
  messagingSenderId: "982546946974"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
