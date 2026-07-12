/**
 * ─── PNR PARSER — Motor de Extracción de Datos GDS ───────────────────────────
 *
 * Analiza texto crudo copiado de sistemas GDS (dialecto Sabre/Amadeus LATAM)
 * y extrae pasajeros, segmentos de vuelo, localizador PNR y, si aparecen en el
 * texto, campos comerciales: nº de e-ticket, time limit de emisión (TAW),
 * desglose de tarifa/impuestos y cabina.
 *
 * FILOSOFÍA: tolerante y transparente. Extrae lo que puede, NO descarta
 * segmentos por un status inesperado, y AVISA por cada línea de vuelo que
 * parezca un segmento pero no haya podido interpretar.
 */

import type { Passenger, FlightSegment, FlightTicket, ParseResult } from "../../types/aereos";

const MONTH_NUM: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};
const MONTH_STR: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
  JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
};

// Cortesías reconocidas como TÍTULO (no como tipo tarifario).
const TITULOS = new Set(["MR", "MRS", "MS", "MSTR", "MISS", "DR", "PROF", "CAPT", "SR", "SRA"]);

// ─── REGEX: LOCALIZADOR PNR ───────────────────────────────────────────────────

/** Estrategia 1: Header Amadeus "RP/MIGDL2101/MIGDL2101  LA/GS 21JUN26/2000Z XKQT7F" */
const PNR_AMADEUS_HEADER_REGEX = /^RP\/\S+\/\S+\s+\S+\s+\S+\s+([A-Z0-9]{6})\s*$/im;
/** Estrategia 2: Prefijos explícitos "RECORD LOCATOR:", "PNR:", "LOC/", "LOCATOR:" */
const PNR_LABELED_REGEX = /(?:RECORD\s+LOCATOR|PNR|LOCATOR?)[:/\s]+([A-Z0-9]{6})\b/i;
/** Estrategia 3: Código suelto al final de línea (6 chars con al menos 1 letra y 1 dígito). */
const PNR_TRAILING_REGEX = /(?::\s*|^)([A-Z][A-Z0-9]{2}[A-Z0-9]{2}[A-Z0-9])\s*$/im;

// ─── REGEX: PASAJEROS ─────────────────────────────────────────────────────────
//
// Reconoce "N.N APELLIDO/NOMBRE [TÍTULO]" con o sin espacios, con TÍTULO OPCIONAL,
// y permite guiones/apóstrofes en apellido y nombre. Captura el índice de pax
// (grupos 1 y 2) para deduplicar por referencia y NO colapsar homónimos.
const PASSENGER_REGEX =
  /(\d+)\.(\d+)\s*([A-Z][A-Z'\-]{1,28})\/([A-Z][A-Z'\- ]{0,28}?)(?:\s+(MR|MRS|MS|MSTR|MISS|DR|PROF|CAPT|SR|SRA|CHD|INF|CNN|INS))?(?=\s+\d+\.\d+|\s*$)/gim;

// ─── REGEX: SEGMENTOS DE VUELO ────────────────────────────────────────────────
//
//   " 1 CM 224 Y 15NOV 3 CCSPTY HK2  0700  0825   *1A/E*"
//     idx airl vlo cl fecha dow  ruta  status horas   sufijo GDS
//
// El STATUS es genérico: cualquier código de 2 letras + cantidad opcional de pax
// ([A-Z]{2}\d{0,3}). Antes estaba limitado a HK|RQ|HL|UN|SA|KL y se perdían tramos.

/** Variante A: IATA origen+destino JUNTOS (CCSPTY). */
const SEGMENT_JOINED_IATA_REGEX =
  /^\s*(\d{1,2})\s+([A-Z0-9]{2})\s+(\d{1,4}[A-Z]?)\s+([A-Z])\s+(\d{1,2}[A-Z]{3})\s+\d?\s*([A-Z]{3})([A-Z]{3})\s+([A-Z]{2}\d{0,3})\s+(\d{4})\s+(\d{4})(\+\d)?/gim;
/** Variante B: IATA origen y destino SEPARADOS por espacio (MIA SCL). */
const SEGMENT_SPLIT_IATA_REGEX =
  /^\s*(\d{1,2})\s+([A-Z0-9]{2})\s+(\d{1,4}[A-Z]?)\s+([A-Z])\s+(\d{1,2}[A-Z]{3})\s+\d?\s*([A-Z]{3})\s+([A-Z]{3})\s+([A-Z]{2}\d{0,3})\s+(\d{4})\s+(\d{4})(\+\d)?/gim;
/** Variante C: Horas en formato HH:MM. */
const SEGMENT_COLON_TIME_REGEX =
  /^\s*(\d{1,2})\s+([A-Z0-9]{2})\s+(\d{1,4}[A-Z]?)\s+([A-Z])\s+(\d{1,2}[A-Z]{3})\s+\d?\s*([A-Z]{3})\s*([A-Z]{3})\s+([A-Z]{2}\d{0,3})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})(\+\d)?/gim;

/** Detecta una línea que "parece" segmento (para avisar si no se pudo parsear). */
const SEGMENT_LIKE_LINE = /^\s*\d{1,2}\s+[A-Z0-9]{2}\s+\d{1,4}[A-Z]?\s+[A-Z]\s+\d{1,2}[A-Z]{3}\b/i;

// ─── REGEX: CAMPOS COMERCIALES ────────────────────────────────────────────────

/** Time limit de emisión: "TAW12NOV/1800/CCS" o "TAW 12NOV 1800". */
const TAW_REGEX = /TAW\s*(\d{1,2}[A-Z]{3})\s*[\/\s]?\s*(\d{3,4})?/i;
/** Nº de e-ticket: hiphenado "045-2345678901" o etiquetado. */
const ETICKET_REGEX = /\b(\d{3})-(\d{10})\b/;
const ETICKET_LABELED_REGEX = /(?:E-?TKT|ETKT|TICKET|FA\s*PAX)[^0-9]{0,12}(\d{3})[- ]?(\d{10})\b/i;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** "0835" → "08:35"; "08:35" → "08:35". */
function normalizeTime(raw: string): string {
  if (!raw) return "";
  const clean = raw.replace(":", "").slice(0, 4);
  if (clean.length === 4 && /^\d{4}$/.test(clean)) return `${clean.slice(0, 2)}:${clean.slice(2)}`;
  return raw;
}

/** Descompone "15NOV" en { day, month }. month = 0 si no reconoce. */
function parseGDSDayMonth(gdsFecha: string): { day: number; month: number } {
  if (!gdsFecha || gdsFecha.length < 5) return { day: 0, month: 0 };
  const day = parseInt(gdsFecha.slice(0, -3), 10) || 0;
  const month = MONTH_NUM[gdsFecha.slice(-3).toUpperCase()] || 0;
  return { day, month };
}

/**
 * Infiere el año de un vuelo con lógica de rollover: si el mes del vuelo es
 * anterior al mes de referencia, se asume el año siguiente (viaje próximo).
 */
function inferFlightYear(month: number, referenceDate: Date): number {
  if (!month) return referenceDate.getFullYear();
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1;
  return month < refMonth ? refYear + 1 : refYear;
}

/** Mapea la clase RBD a nombre de cabina legible. */
function mapCabin(rbd: string): string {
  const c = (rbd || "").toUpperCase();
  if ("FA".includes(c)) return "First";
  if ("JCDIZ".includes(c)) return "Business";
  if ("WPT".includes(c)) return "Premium Economy";
  return "Economy";
}

/** Extrae el localizador PNR con estrategias en cascada. */
function extractPNR(text: string): string {
  const amadeus = PNR_AMADEUS_HEADER_REGEX.exec(text);
  if (amadeus?.[1]) return amadeus[1];
  const labeled = PNR_LABELED_REGEX.exec(text);
  if (labeled?.[1]) return labeled[1];
  const trailing = PNR_TRAILING_REGEX.exec(text);
  if (trailing?.[1]) {
    const c = trailing[1];
    if (/[A-Z]/.test(c) && /[0-9]/.test(c)) return c;
  }
  return "";
}

/** Extrae todos los pasajeros. Título opcional; deduplica por índice N.N. */
function extractPassengers(text: string, warnings: string[]): Passenger[] {
  const passengers: Passenger[] = [];
  const seenRef = new Set<string>();

  PASSENGER_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PASSENGER_REGEX.exec(text)) !== null) {
    const ref = `${match[1]}.${match[2]}`;
    if (seenRef.has(ref)) continue;
    const ap = match[3].trim().toUpperCase();
    const nm = match[4].trim().toUpperCase();
    if (!ap || !nm) continue;
    seenRef.add(ref);

    const rawTitle = (match[5] || "").toUpperCase();
    const esInfante = rawTitle === "INF" || rawTitle === "INS";
    const esNino = rawTitle === "CHD" || rawTitle === "CNN";
    const paxType: "ADT" | "CHD" | "INF" = esInfante ? "INF" : esNino ? "CHD" : "ADT";
    const titulo = TITULOS.has(rawTitle) ? rawTitle : undefined;

    passengers.push({
      nombre: `${ap}/${nm}`,
      // Retrocompat: `tipo` conserva el título/tipo tal como aparece (o "ADT").
      tipo: rawTitle || "ADT",
      paxType,
      titulo,
    });
  }

  if (passengers.length === 0) {
    warnings.push(
      "⚠️ No se encontraron pasajeros. Formato esperado: '1.1APELLIDO/NOMBRE MR' o '1.1 APELLIDO/NOMBRE'."
    );
  }
  return passengers;
}

/** Extrae segmentos con status genérico + avisos por línea no reconocida. */
function extractSegments(text: string, warnings: string[]): FlightSegment[] {
  const segments: FlightSegment[] = [];
  const seen = new Set<string>();

  const buildSegment = (m: RegExpExecArray): FlightSegment => {
    const diaLlegada = m[11] ? parseInt(m[11].replace("+", ""), 10) || 0 : 0;
    const horaLlegada = normalizeTime(m[10]) + (diaLlegada > 0 ? ` (+${diaLlegada})` : "");
    const clase = m[4].toUpperCase();
    return {
      aerolinea: m[2].toUpperCase(),
      numeroVuelo: m[3].toUpperCase(),
      clase,
      cabina: mapCabin(clase),
      fecha: m[5].toUpperCase(),
      origen: m[6].toUpperCase(),
      destino: m[7].toUpperCase(),
      status: m[8].toUpperCase(),
      horaSalida: normalizeTime(m[9]),
      horaLlegada,
      diaLlegada,
    };
  };

  const addSegment = (seg: FlightSegment) => {
    const key = `${seg.aerolinea}${seg.numeroVuelo}${seg.fecha}${seg.origen}${seg.destino}`;
    if (seen.has(key)) return;
    seen.add(key);
    segments.push(seg);
  };

  for (const rx of [SEGMENT_JOINED_IATA_REGEX, SEGMENT_SPLIT_IATA_REGEX, SEGMENT_COLON_TIME_REGEX]) {
    rx.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(text)) !== null) addSegment(buildSegment(m));
  }

  // Aviso por línea que parece segmento pero no se pudo interpretar.
  for (const line of text.split("\n")) {
    if (!SEGMENT_LIKE_LINE.test(line)) continue;
    const m = line.match(/^\s*\d{1,2}\s+([A-Z0-9]{2})\s+(\d{1,4}[A-Z]?)/);
    if (m) {
      const found = segments.some(s => s.aerolinea === m[1].toUpperCase() && s.numeroVuelo === m[2].toUpperCase());
      if (!found) warnings.push(`⚠️ Línea de vuelo no reconocida (revisar manualmente): "${line.trim()}"`);
    }
  }

  // Ordenar por fecha real (con año inferido) para no invertir itinerarios DEC→JAN.
  const ref = new Date();
  const sortKey = (d: string): number => {
    const { day, month } = parseGDSDayMonth(d);
    if (!month) return 0;
    return inferFlightYear(month, ref) * 10000 + month * 100 + day;
  };
  segments.sort((a, b) => {
    const diff = sortKey(a.fecha) - sortKey(b.fecha);
    return diff !== 0 ? diff : a.horaSalida.localeCompare(b.horaSalida);
  });

  if (segments.length === 0) {
    warnings.push(
      "⚠️ No se encontraron segmentos de vuelo. Formato esperado: '1 CM 224 Y 15NOV 3 CCSPTY HK2  0700  0825'."
    );
  }
  return segments;
}

/** Extrae el time limit de emisión (TAW) como texto legible. */
function extractTimeLimit(text: string): string | undefined {
  const m = TAW_REGEX.exec(text);
  if (!m) return undefined;
  const fecha = formatGDSDate(m[1]);
  const hhmm = m[2] ? `${m[2].padStart(4, "0").slice(0, 2)}:${m[2].padStart(4, "0").slice(2)}` : "";
  return hhmm ? `${fecha} ${hhmm}` : fecha;
}

/** Extrae nº de e-ticket (hiphenado o etiquetado). */
function extractTicketNumber(text: string): string | undefined {
  const labeled = ETICKET_LABELED_REGEX.exec(text);
  if (labeled) return `${labeled[1]}-${labeled[2]}`;
  const plain = ETICKET_REGEX.exec(text);
  if (plain) return `${plain[1]}-${plain[2]}`;
  return undefined;
}

/** Extrae tarifa base + impuestos si el texto los incluye (best-effort). */
function extractFare(text: string): { tarifaBase?: number; impuestos?: { codigo: string; monto: number }[] } {
  const num = (s: string) => parseFloat(s.replace(/,/g, ""));
  const fareM = text.match(/\bFARE\b\s*:?\s*(?:[A-Z]{3})?\s*([\d,]+\.\d{2})/i);
  const tarifaBase = fareM ? num(fareM[1]) : undefined;
  const impuestos: { codigo: string; monto: number }[] = [];
  for (const code of ["YQ", "YR", "XT"]) {
    const m = text.match(new RegExp(`\\b${code}\\b\\s*([\\d,]+\\.\\d{2})`, "i"));
    if (m) impuestos.push({ codigo: code, monto: num(m[1]) });
  }
  if (impuestos.length === 0) {
    const taxM = text.match(/\bTAX(?:ES)?\b\s*:?\s*(?:[A-Z]{3})?\s*([\d,]+\.\d{2})/i);
    if (taxM) impuestos.push({ codigo: "TAX", monto: num(taxM[1]) });
  }
  return { tarifaBase, impuestos: impuestos.length ? impuestos : undefined };
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

/** parseGDS — Punto de entrada del motor de parsing. */
export function parseGDS(rawText: string): ParseResult {
  const warnings: string[] = [];

  if (!rawText || rawText.trim().length < 8) {
    return {
      data: {},
      status: "error",
      warnings: ["❌ El texto ingresado está vacío o es demasiado corto para ser un PNR válido."],
      rawText,
    };
  }

  const normalizedText = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .trim();

  const pnr = extractPNR(normalizedText);
  const pasajeros = extractPassengers(normalizedText, warnings);
  const segmentos = extractSegments(normalizedText, warnings);
  const timeLimit = extractTimeLimit(normalizedText);
  const ticketNumero = extractTicketNumber(normalizedText);
  const { tarifaBase, impuestos } = extractFare(normalizedText);

  if (!pnr) {
    warnings.push(
      "⚠️ No se pudo detectar el PNR/Localizador automáticamente. Ingrésalo manualmente en el campo 'PNR'."
    );
  }

  const data: Partial<FlightTicket> = {
    pnr: pnr || "",
    pasajeros,
    segmentos,
    vinculadoAExpediente: false,
  };
  if (timeLimit) data.timeLimit = timeLimit;
  if (ticketNumero) data.ticketNumero = ticketNumero;
  if (tarifaBase != null) data.tarifaBase = tarifaBase;
  if (impuestos) data.impuestos = impuestos;

  const hasErrors = pasajeros.length === 0 && segmentos.length === 0;

  return {
    data,
    status: hasErrors ? "error" : "success",
    warnings,
    rawText: normalizedText,
  };
}

// ─── HELPERS EXPORTADOS ───────────────────────────────────────────────────────

/**
 * Construye la ruta del itinerario mostrando las escalas y detectando ida-vuelta.
 * - 1 tramo: "CCS → PTY"
 * - ida-vuelta directa: "CCS ⇄ MIA"
 * - con escalas: "CCS → PTY → MIA"
 */
export function buildRoute(segmentos: FlightSegment[]): string {
  if (!segmentos || segmentos.length === 0) return "—";
  if (segmentos.length === 1) return `${segmentos[0].origen} → ${segmentos[0].destino}`;
  const first = segmentos[0];
  const last = segmentos[segmentos.length - 1];
  if (segmentos.length === 2 && first.origen === last.destino && first.destino === last.origen) {
    return `${first.origen} ⇄ ${first.destino}`;
  }
  // Cadena de aeropuertos: origen del primero + destino de cada tramo.
  const chain = [first.origen, ...segmentos.map(s => s.destino)];
  return chain.join(" → ");
}

/**
 * Formatea la fecha GDS cruda a "dd/mm/yyyy", infiriendo el año con rollover.
 * @param gdsFecha "15NOV"
 * @param referenceDate fecha de referencia para inferir el año (default: hoy)
 */
export function formatGDSDate(gdsFecha: string, referenceDate: Date = new Date()): string {
  if (!gdsFecha || gdsFecha.length < 5) return gdsFecha || "—";
  const { day, month } = parseGDSDayMonth(gdsFecha);
  const mon = gdsFecha.slice(-3).toUpperCase();
  if (!month) return `${gdsFecha.slice(0, -3).padStart(2, "0")}/${mon}`;
  const year = inferFlightYear(month, referenceDate);
  return `${String(day).padStart(2, "0")}/${MONTH_STR[mon]}/${year}`;
}

/** Texto de muestra con los formatos reales validados (botón "Cargar Ejemplo"). */
export const SAMPLE_GDS_TEXT =
`K3W9L2
 1.1GARCIA/CARLOS MR 2.1LOPEZ/MARIA MRS
 1 CM 224 Y 15NOV 3 CCSPTY HK2  0700  0825   *1A/E*
 2 CM 472 Y 15NOV 3 PTYMIA HK2  0930  1330   *1A/E*
 3 CM 473 Y 28NOV 2 MIAPTY HK2  1500  1710   *1A/E*
 4 CM 223 Y 28NOV 2 PTYCCS HK2  1830  2145   *1A/E*
TKT/TIME LIMIT
  1.TAW12NOV/1800/CCS
`;
