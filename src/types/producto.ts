// FASE 1: Definición de Tipos (TypeScript)
// ERP Módulo de Producto (Extranet Hotelera)

export enum RegimenAlimentacion {
  SOLO_HABITACION = "Solo Habitación",
  DESAYUNO = "Desayuno",
  MEDIA_PENSION = "Media Pensión",
  TODO_INCLUIDO = "Todo Incluido"
}

export enum PropertyStatus {
  ACTIVO = "Activo",
  INACTIVO = "Inactivo"
}

export enum TipoCobro {
  POR_HABITACION = "Por Habitación",
  POR_PERSONA = "Por Persona"
}

export interface Property {
  id: string;
  nombre: string;
  pais: string;
  estado: string; // Estado de ubicación (ej. Nueva Esparta, Falcón, etc. en Venezuela)
  ciudad: string;
  categoria: number; // Estrellas (ej. 1-5)
  status: PropertyStatus;
  politicasGenerales: string;
  imagen?: string; // Para visualización elegante de la galería
  supplierName?: string; // Nombre de proveedor mayorista
}

export interface RoomType {
  id: string;
  property_id: string;
  nombre: string; // ej. Habitación Standard Doble, Familiar, Suite Executive
  regimenAlimentacion: RegimenAlimentacion; // Régimen alimenticio asociado a la habitación
  capacidadMax: number;
  ocupacionBase?: number;
}

export interface RatePlan {
  id: string;
  property_id: string;
  roomType_id: string; // Tipo de habitación ligada
  nombrePromocion: string; // ej. "Temporada Alta", "Temporada Baja", "Promo Escapada"
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  tipoCobro: TipoCobro; // "Por Habitación" o "Por Persona"
  tarifaBase: number;
  tarifaExtraAdulto: number;
  tarifaExtraNino: number;
  politicasCancelacion: string;
  mercado: 'NACIONAL' | 'INTERNACIONAL';
}

export interface StopSale {
  id: string;
  property_id: string;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  motivo?: string;
}

// Fecha mínima permisiva para editar RatePlan/ServiceRate: estos formularios editan
// temporadas que a menudo ya están en el pasado, así que NO deben usar el minDate por
// defecto de DateRangePicker (hoy), que bloquearía re-seleccionar esas fechas históricas.
export const HISTORICAL_MIN_DATE = "2000-01-01";

// ─── SERVICIOS VARIOS (TRASLADOS, EXCURSIONES, ETC.) ─────────────────────────

export enum ServiceCategory {
  TRASLADO = "Traslado",
  EXCURSION = "Excursión",
  TICKET = "Ticket/Entrada",
  ASISTENCIA = "Asistencia al Viajero"
}

export enum PricingModel {
  POR_PERSONA = "Por Persona",
  POR_VEHICULO_GRUPO = "Por Vehículo/Grupo"
}

export interface ExtraService {
  id: string;
  nombre: string;
  providerName: string;
  providerId?: string;
  category: ServiceCategory;
  ubicacion: string;
  descripcion: string;
  politicasCancelacion: string;
  status: "Activo" | "Inactivo";
}

// ─── PROVEEDORES DE SERVICIOS (NO HOTELEROS) ──────────────────────────────────

export enum TipoProveedor {
  EXCURSION = "Excursión",
  TRASLADO = "Traslado",
  BUCEO = "Buceo",
  FULL_DAY = "Full Day",
  TICKET = "Ticket / Entrada",
  ASISTENCIA = "Asistencia",
  GUIA = "Guía Turístico",
  OTRO = "Otro"
}

export interface Proveedor {
  id: string;
  nombre: string;
  tipo: TipoProveedor;
  contactoPrincipal: string;
  telefono: string;
  email: string;
  rif: string;
  ubicacion: string;
  pais: string;
  comision: number;
  condicionesPago: string;
  datosBancarios: string;
  status: "Activo" | "Inactivo";
  notas?: string;
}

export interface ServiceRate {
  id: string;
  extraServiceId: string;
  temporadaInicio: string; // YYYY-MM-DD
  temporadaFin: string; // YYYY-MM-DD

  pricingModel: PricingModel;
  // Campos requeridos si pricingModel === 'Por Persona'
  netoAdulto?: number;
  ventaAdulto?: number;
  netoNino?: number;
  ventaNino?: number;
  // Campos requeridos si pricingModel === 'Por Vehículo/Grupo'
  capacidadMaxima?: number;
  netoTotal?: number;
  ventaTotal?: number;

  // Estructura de comisión de esta tarifa: se propaga automáticamente a Reservas al
  // seleccionar el servicio, en vez de que el vendedor la tipee a mano cada vez.
  comisionBruta?: number; // % total de margen sobre el PVP
  comisionCedidaB2B?: number; // % de esa comisión bruta que se cede a la agencia B2B revendedora (el resto queda para la propia agencia)
}
