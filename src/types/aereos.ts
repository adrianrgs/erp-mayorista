// ─── MÓDULO DE AÉREOS / BOLETOS ──────────────────────────────────────────────
// Tipos para el sistema de PNR Parser y gestión de boletos aéreos.

// ─── PASAJERO ────────────────────────────────────────────────────────────────

/**
 * Tipo de pasajero según estándar GDS.
 * MR = Adulto masculino, MRS/MS = Adulto femenino,
 * CHD = Niño (Child), INF = Infante.
 */
export type PassengerType = "MR" | "MRS" | "MS" | "CHD" | "INF" | "MSTR" | "DR" | string;

export interface Passenger {
  /** Apellido en mayúsculas, separado por slash del nombre. Ej: PEREZ/ADRIAN */
  nombre: string;
  /** Tipo/título del pasajero según estándar IATA */
  tipo: PassengerType;
  /** Documento de identidad o Pasaporte del pasajero */
  documento?: string;
}

// ─── SEGMENTO DE VUELO ────────────────────────────────────────────────────────

/**
 * Estado del segmento según código GDS.
 * HK = Confirmed, RQ = Requested, HL = Waitlisted,
 * UN = Unable to confirm, SA = Space Available.
 * El número tras el código indica la cantidad de asientos (ej: HK2).
 */
export type SegmentStatus = "HK" | "RQ" | "HL" | "UN" | "SA" | "KL" | string;

export interface FlightSegment {
  /** Código IATA de la aerolínea (2 letras). Ej: AA, LA, CM, AA */
  aerolinea: string;
  /** Número de vuelo sin prefijo de aerolínea. Ej: "209", "1234" */
  numeroVuelo: string;
  /** Clase de servicio / cabina. Ej: Y, K, W, J, F */
  clase: string;
  /** Fecha del vuelo en formato GDS crudo. Ej: "15OCT", "23DEC" */
  fecha: string;
  /** Código IATA aeropuerto de origen. Ej: CCS, MIA, MAD */
  origen: string;
  /** Código IATA aeropuerto de destino. Ej: PTY, JFK, BCN */
  destino: string;
  /** Hora de salida en formato local HHMM o HH:MM. Ej: "0835", "08:35" */
  horaSalida: string;
  /** Hora de llegada en formato local HHMM o HH:MM. Ej: "1020", "10:20" */
  horaLlegada: string;
  /**
   * Estado del segmento con código + cantidad de pasajeros.
   * Ej: "HK2" (Confirmed 2 pax), "RQ1" (Requested 1 pax).
   */
  status: SegmentStatus;
}

// ─── BOLETO AÉREO ─────────────────────────────────────────────────────────────

/**
 * Documento principal que representa un boleto aéreo emitido.
 * Agrupa el PNR/localizador del GDS con todos sus pasajeros y segmentos,
 * más la información financiera del boleto.
 */
export interface FlightTicket {
  /** ID único generado por Firestore */
  id: string;
  /**
   * Localizador del PNR en el GDS. 6 caracteres alfanuméricos.
   * Ej: "XKQT7F", "ABCDE1"
   */
  pnr: string;
  /** Lista de todos los pasajeros incluidos en el PNR */
  pasajeros: Passenger[];
  /** Lista de todos los segmentos de vuelo del itinerario */
  segmentos: FlightSegment[];
  /**
   * Costo neto del boleto (tarifa + impuestos, lo que paga la agencia).
   * Se almacena en la moneda de operación.
   */
  costoNeto: number;
  /**
   * Precio de venta al cliente final (PVP).
   * Si es B2B, este es el precio base sobre el cual se calcula la comisión.
   */
  precioVenta: number;
  /** Precio PVP explícito (opcional) */
  precioPvp?: number;
  /** Porcentaje de comisión para la agencia B2B (opcional) */
  comisionB2B?: number;
  /** Porcentaje de comisión para la agencia Mayorista (opcional) */
  comisionMayorista?: number;
  /** Tipo de comisión a aplicar (Porcentaje o Fee fijo) */
  tipoComision?: 'Porcentaje' | 'Fee';
  /** Monto fijo de Fee (si aplica) */
  fee?: number;
  /**
   * Indica si este boleto ya fue vinculado a un expediente/reserva.
   * Por defecto false. Una vez vinculado se bloquea para evitar duplicados.
   */
  vinculadoAExpediente: boolean;
  /**
   * Indica si el boleto se debe facturar conjuntamente con la reserva terrestre a la que está vinculado.
   */
  facturarConjunto?: boolean;
  /**
   * ID del expediente al que fue vinculado (si aplica).
   * Referencia a la colección `reservas` en Firestore.
   */
  expedienteId?: string;
  /** Nombre del agente que registró el boleto */
  agenteNombre?: string;
  /** Timestamp de creación en Firestore (ISO string) */
  createdAt?: string;
  /** Número de ticket electrónico (si fue ticketeado). Ej: "045-2345678901" */
  ticketNumero?: string;
  /** Nombre de la aerolínea validadora del ticket */
  aerolineaValidadora?: string;
  /** Observaciones adicionales del agente */
  notas?: string;
  /** Expediente de facturación aérea asociado a este boleto */
  expedienteAereo?: AereoExpediente;
}

// ─── EXPEDIENTE AÉREO ────────────────────────────────────────────────────────

/**
 * Registro de pago realizado a la aerolínea o GDS.
 * Documenta la transacción de compra del boleto al proveedor.
 */
export interface PagoAerolinea {
  monto: number;
  /** Método de pago: Transferencia, Tarjeta de Crédito, BSP, etc. */
  metodo: string;
  /** Número de referencia bancaria o BSP */
  referencia: string;
  fecha: string;
  notas?: string;
  comprobanteArchivo?: string;
}

/**
 * Estado de facturación del expediente aéreo.
 * - Borrador: creado pero no enviado
 * - Solicitado: enviado al dpto. de facturación
 * - Facturado: el cliente fue cobrado
 * - PagadoAerolinea: se completó el pago al proveedor/aerolínea
 */
export type StatusExpedienteAereo =
  | "Borrador"
  | "Solicitado"
  | "Facturado"
  | "PagadoAerolinea"
  | "Anulado";

/**
 * Expediente de facturación propio del módulo de Vuelos.
 * Gestiona el ciclo completo: cobro al cliente + pago a la aerolínea.
 * Es independiente del sistema de Reservas terrestres.
 */
export interface AereoExpediente {
  /** ID único del expediente. Ej: "AER-4521" */
  id: string;
  /** Estado actual en el ciclo de facturación */
  status: StatusExpedienteAereo;
  /** Nombre del titular/pasajero principal */
  titular: string;
  /** Nombre de la agencia B2B asociada (si aplica) */
  clienteB2BNombre?: string;
  /** ID de la agencia B2B asociada */
  clienteB2BId?: string;
  /** ID del cliente directo asociado (si aplica; excluyente con clienteB2BId) */
  clienteDirectoId?: string;
  /** Nombre del cliente directo asociado */
  clienteDirectoNombre?: string;
  /** Tipo de facturación del cliente */
  facturacionTipo?: "Crédito" | "Pago Contado";
  /** Referencia del comprobante de pago del cliente */
  comprobanteRef?: string;
  /** Monto del comprobante de pago del cliente */
  comprobanteMonto?: number;
  /** Método del comprobante de pago del cliente */
  comprobanteMetodo?: string;
  /** Archivo adjunto del comprobante de pago del cliente */
  comprobanteArchivo?: string;
  /** Información del pago realizado a la aerolínea/GDS */
  pagoAerolinea?: PagoAerolinea;
  /** Observaciones internas del expediente */
  notas?: string;
  /** Timestamp de creación (ISO string) */
  createdAt: string;
}

// ─── ESTADO DE UI DEL PARSER ──────────────────────────────────────────────────

/** Estado del proceso de parseo para feedback visual al agente */
export type ParseStatus = "idle" | "parsing" | "success" | "error";

/** Resultado del parseo con metadata de diagnóstico */
export interface ParseResult {
  data: Partial<FlightTicket>;
  status: ParseStatus;
  warnings: string[];
  rawText: string;
}
