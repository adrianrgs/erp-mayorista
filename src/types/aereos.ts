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
  /** Tipo/título del pasajero según estándar IATA (retrocompat: puede traer MR/MRS/CHD/INF) */
  tipo: PassengerType;
  /** Tipo de pasajero tarifario: ADT (adulto), CHD (niño), INF (infante). */
  paxType?: "ADT" | "CHD" | "INF";
  /** Título de cortesía (MR, MRS, MS, DR…) separado del tipo tarifario. */
  titulo?: string;
  /** Número de viajero frecuente, si aparece en el PNR. */
  frequentFlyer?: string;
  /** Documento de identidad o Pasaporte del pasajero */
  documento?: string;
  /** Número de e-ticket asignado a este pasajero (si aplica). */
  ticketNumero?: string;
  // ── Precios por pasajero (opcional; permite tarifas distintas ADT/CHD/INF) ──
  /** Tarifa base de este pasajero. */
  tarifaBase?: number;
  /** Costo neto de este pasajero (tarifa + impuestos). */
  costoNeto?: number;
  /** Precio de venta de este pasajero. */
  precioVenta?: number;
  /** El pasajero fue reembolsado/anulado por completo (todos sus tramos). */
  reembolsado?: boolean;
  /** boletoIds de los tramos reembolsados SOLO para este pasajero (reembolso parcial pax×tramo). */
  tramosReembolsados?: string[];
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
   * Se acepta cualquier código de 2 letras (GK/TK/SS/PN/NN/DK/HN/WK/US/HX…).
   */
  status: SegmentStatus;
  /** Nombre legible de la cabina, mapeado desde la clase RBD. Ej: "Economy", "Business". */
  cabina?: string;
  /** Terminal de salida, si aparece. */
  terminal?: string;
  /** Días de diferencia de la llegada respecto a la salida (+1 = llega al día siguiente). */
  diaLlegada?: number;
  /** Id del "boleto" de este tramo dentro del expediente. Ej: "BOL-5-1" (AER-5, tramo 1). */
  boletoId?: string;
  /** Precio de venta de este tramo (opcional; permite reembolso por tramo con su valor). */
  precio?: number;
  /** El tramo fue reembolsado/anulado (queda como historial, tachado). */
  reembolsado?: boolean;
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
  /** Username del asesor (usuario del sistema) que creó el boleto — control y comisiones. */
  asesor?: string;
  /** Timestamp de creación en Firestore (ISO string) */
  createdAt?: string;
  /** Número de ticket electrónico (si fue ticketeado). Ej: "045-2345678901" */
  ticketNumero?: string;
  /** Nombre de la aerolínea validadora del ticket */
  aerolineaValidadora?: string;
  /** Fecha/hora límite de emisión (TAW/time limit del PNR). Ej: "2026-11-12T18:00" o "12NOV/1800". */
  timeLimit?: string;
  /** Tarifa base del boleto (sin impuestos). */
  tarifaBase?: number;
  /** Desglose de impuestos/tasas del boleto (YQ, YR, XT, tasas locales…). */
  impuestos?: { codigo: string; monto: number }[];
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
  | "Reembolsado"
  | "Anulado";

/** Registro de un reembolso / anulación con penalidad de un boleto. */
export interface ReembolsoAereo {
  fecha: string;
  /** Penalidad retenida (no reembolsable). */
  penalidad: number;
  /** Monto de la nota de crédito (venta − penalidad). */
  montoReembolsado: number;
  /** Id de la nota de crédito emitida al cliente (si aplica). */
  notaCreditoId?: string;
  motivo?: string;
  /**
   * Reembolso SOLICITADO pero aún NO aprobado por el operador de Facturación.
   * Mientras esté `true`, no se ha emitido la NC ni se aplicaron los efectos
   * (saldo del cliente / obligación al proveedor). El operador lo aprueba en
   * Facturación (mismo flujo que la NC de reservas) y recién ahí se ejecuta.
   */
  pendiente?: boolean;
  // Plan pre-calculado en la solicitud, para que el operador solo lo aplique:
  /** Saldo a favor a generar al cliente (max(0, montoNC − oldOutstanding)). */
  saldoFavorGenerado?: number;
  /** Deuda pendiente del expediente al momento de la solicitud (venta − pagado). */
  outstanding?: number;
  /** Neto cliente (pagado − penalidad); si < 0 el cliente aún debe la diferencia. */
  netCliente?: number;
  // ── Alcance del reembolso (parcial por tramo/pasajero/celda o total) ──
  /** "todo" = expediente completo · "tramos" · "pasajeros" · "pax-tramos" = celdas pasajero×tramo. */
  alcance?: "todo" | "tramos" | "pasajeros" | "pax-tramos";
  /** boletoIds (BOL-[aer]-[k]) de los tramos reembolsados (alcance "tramos"). */
  itemsTramos?: string[];
  /** Índices de los pasajeros reembolsados (alcance "pasajeros"). */
  itemsPasajeros?: number[];
  /** Celdas pasajero×tramo reembolsadas (alcance "pax-tramos"). */
  itemsCeldas?: { pax: number; boletoId: string }[];
}

/**
 * EMD (Electronic Miscellaneous Document): cargo por servicios/ancillaries asociados a un
 * boleto (equipaje adicional, selección de asiento, cargo por cambio, etc.).
 */
export interface EmdAereo {
  fecha: string;
  /** Concepto del EMD. Ej: "Equipaje adicional", "Selección de asiento", "Cargo por cambio". */
  concepto: string;
  /** Monto de venta cobrado al cliente. */
  montoVenta: number;
  /** Costo neto que se debe a la aerolínea por el servicio. */
  costoNeto: number;
  /** Id de la factura emitida al cliente por el EMD. */
  facturaId?: string;
  notas?: string;
}

/** Registro de una reemisión (reissue) de un boleto: cambio con diferencia de tarifa. */
export interface ReemisionAereo {
  fecha: string;
  /** Diferencia de tarifa (ADC — Additional Collection). */
  diferenciaTarifa: number;
  /** Penalidad de cambio de la aerolínea. */
  penalidad: number;
  /** Total cobrado al cliente (ADC + penalidad). */
  totalCobrado: number;
  /** Nuevo nº de e-ticket tras la reemisión (si aplica). */
  nuevoTicket?: string;
  /** Id de la factura emitida al cliente por la reemisión. */
  facturaId?: string;
  motivo?: string;
}

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
  /** Motivo del rechazo de facturación (si Facturación rechazó la solicitud). */
  facturacionRechazoMotivo?: string;
  /** Archivos de soporte del rechazo (JSON string de URLs de Firebase Storage). */
  facturacionRechazoArchivos?: string;
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
  /** Registro del reembolso/anulación con penalidad, si se realizó. */
  reembolso?: ReembolsoAereo;
  /** Historial de reemisiones (reissue) del boleto. */
  reemisiones?: ReemisionAereo[];
  /** EMDs (servicios/ancillaries) emitidos sobre el boleto. */
  emds?: EmdAereo[];
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
