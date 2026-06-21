/**
 * ─── PNR PARSER — Motor de Extracción de Datos GDS ───────────────────────────
 *
 * Analiza texto crudo copiado de sistemas GDS (Sabre, Amadeus, KIU, Galileo)
 * y extrae pasajeros, segmentos de vuelo y el localizador PNR.
 *
 * FORMATOS REALES VALIDADOS:
 *
 * Sabre América Latina (K3W9L2):
 *   " 1.1GARCIA/CARLOS MR 2.1LOPEZ/MARIA MRS"   ← múltiples pax en una línea
 *   " 1 CM 224 Y 15NOV 3 CCSPTY HK2  0700  0825   *1A/E*"  ← día-semana + *1A/E*
 *
 * Amadeus / AA con +1 (X7P4ZQ):
 *   " 1.1SMITH/JOHN MR 2.1SMITH/JANE MRS 3.1SMITH/TOMMY CHD"
 *   " 1 AA 902 Q 10DEC 5 MIA SCL HK3  2230  0840+1 *1A/E*"  ← IATA separados, +1
 *
 * ESTRATEGIA: RegEx con múltiples variantes en orden de especificidad.
 * El parser es tolerante: extrae lo que puede y reporta advertencias.
 */

import type { Passenger, FlightSegment, FlightTicket, ParseResult } from "../../types/aereos";

// ─── REGEX: LOCALIZADOR PNR ───────────────────────────────────────────────────

/**
 * Estrategia 1: Header Amadeus RP/
 * "RP/MIGDL2101/MIGDL2101  LA/GS 21JUN26/2000Z XKQT7F"
 */
const PNR_AMADEUS_HEADER_REGEX = /^RP\/\S+\/\S+\s+\S+\s+\S+\s+([A-Z0-9]{6})\s*$/im;

/**
 * Estrategia 2: Prefijos explícitos "RECORD LOCATOR:", "PNR:", "LOC/", "LOC:"
 * Cubre los formatos más semánticos de cada GDS.
 */
const PNR_LABELED_REGEX = /(?:RECORD\s+LOCATOR|PNR|LOCATOR?)[:/\s]+([A-Z0-9]{6})\b/i;

/**
 * Estrategia 3: Código suelto al final de línea, precedido de ": " o espacio.
 * Cubre "reserva estandar: K3W9L2" y "reserva con casos especiales: X7P4ZQ".
 * También captura un código solo en su propia línea.
 *
 * Condición: 6 chars alfanuméricos, al menos una letra y un dígito (descarta
 * palabras puras como "GARCIA" o números puros como "123456").
 */
const PNR_TRAILING_REGEX = /(?::\s*|^)([A-Z][A-Z0-9]{2}[A-Z0-9]{2}[A-Z0-9])\s*$/im;

// ─── REGEX: PASAJEROS ─────────────────────────────────────────────────────────

/**
 * REGEX UNIFICADO de pasajeros — captura TODOS los pasajeros en una línea,
 * incluyendo el formato real de Sabre donde no hay espacio entre el índice
 * y el apellido: "1.1GARCIA/CARLOS MR".
 *
 * Formato reconocido:
 *   N.NAPELLIDO/NOMBRE TITULO    (sin espacio: "1.1GARCIA/CARLOS MR")
 *   N.N APELLIDO/NOMBRE TITULO   (con espacio: "1.1 GARCIA/CARLOS MR")
 *   N.N APELLIDO/NOMBRETITULO    (compacto:    "1.1 GARCIA/CARLOSTMR")
 *
 * Grupos capturados:
 *   [1] Apellido  → "GARCIA"
 *   [2] Nombre    → "CARLOS"
 *   [3] Título    → "MR"
 *
 * Se aplica con .exec() en bucle (flag g) para capturar múltiples
 * pasajeros en la misma línea.
 */
const PASSENGER_UNIFIED_REGEX =
  /\d+\.\d+\s*([A-Z][A-Z\-]{1,28})\/([A-Z][A-Z\s]{1,24}?)\s*(MR|MRS|MS|CHD|INF|MSTR|MISS|DR)\b/gi;

// ─── REGEX: SEGMENTOS DE VUELO ────────────────────────────────────────────────
//
// Anatomía de una línea de segmento real (Sabre):
//
//   " 1 CM 224 Y 15NOV 3 CCSPTY HK2  0700  0825   *1A/E*"
//    ─┬─ ─┬─ ─┬─ ┬ ──┬── ┬ ──┬──┬─ ──┬─── ──┬──   ──────
//     │   │   │  │   │   │   │  │    │      │      Sufijo GDS (ignorar)
//     │   │   │  │   │   │   │  │    Hora   Hora llegada
//     │   │   │  │   │   │   │  Status+pax (HK2)
//     │   │   │  │   │   │   Destino (PTY) — puede ser separado o junto a origen
//     │   │   │  │   │   Origen (CCS)
//     │   │   │  │   │  ↑ Dígito día-de-semana OPCIONAL (1=Lun … 7=Dom) ← CLAVE
//     │   │   │  │   Fecha GDS (15NOV)
//     │   │   │  Clase RBD (Y, Q, K, C…)
//     │   │   Número de vuelo (224)
//     │   Aerolínea IATA (CM)
//     Índice de segmento (1)
//
// El indicador de día siguiente "+1" puede aparecer PEGADO a la hora de
// llegada: "0840+1" o separado "0840 +1".
// El sufijo "*1A/E*" o "*1A*" al final de la línea debe ser ignorado.

/**
 * Variante A: IATA origen+destino JUNTOS (6 chars).
 * Ej: "CCSPTY", "MIAORD", "MEXCCS"
 * Captura el dígito día-semana (0-7) entre fecha e IATA como grupo no capturado.
 * Grupo 10 opcional: indicador "+1" o "+2" (siguiente día).
 */
const SEGMENT_JOINED_IATA_REGEX =
  /^\s*(\d{1,2})\s+([A-Z]{2})\s+(\d{1,4}[A-Z]?)\s+([A-Z])\s+(\d{1,2}[A-Z]{3})\s+\d?\s*([A-Z]{3})([A-Z]{3})\s+((?:HK|RQ|HL|UN|SA|KL)\d{1,2})\s+(\d{4})\s+(\d{4})(\+\d)?/gim;

/**
 * Variante B: IATA origen y destino SEPARADOS por espacio.
 * Ej: "MIA SCL", "SCL CJC"
 * Idéntica a la variante A pero con \s+ entre los dos códigos IATA.
 */
const SEGMENT_SPLIT_IATA_REGEX =
  /^\s*(\d{1,2})\s+([A-Z]{2})\s+(\d{1,4}[A-Z]?)\s+([A-Z])\s+(\d{1,2}[A-Z]{3})\s+\d?\s*([A-Z]{3})\s+([A-Z]{3})\s+((?:HK|RQ|HL|UN|SA|KL)\d{1,2})\s+(\d{4})\s+(\d{4})(\+\d)?/gim;

/**
 * Variante C: Horas en formato HH:MM (menos común, pero existe).
 * Ej: "08:35 10:20" en lugar de "0835 1020"
 */
const SEGMENT_COLON_TIME_REGEX =
  /^\s*(\d{1,2})\s+([A-Z]{2})\s+(\d{1,4}[A-Z]?)\s+([A-Z])\s+(\d{1,2}[A-Z]{3})\s+\d?\s*([A-Z]{3})\s*([A-Z]{3})\s+((?:HK|RQ|HL|UN|SA|KL)\d{1,2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})(\+\d)?/gim;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Normaliza hora de formato HHMM a HH:MM.
 * "0835" → "08:35" | "08:35" → "08:35"
 */
function normalizeTime(raw: string): string {
  if (!raw) return "";
  const clean = raw.replace(":", "").slice(0, 4); // ignora sufijos como +1
  if (clean.length === 4 && /^\d{4}$/.test(clean)) {
    return `${clean.slice(0, 2)}:${clean.slice(2)}`;
  }
  return raw;
}

/**
 * Extrae el localizador PNR usando múltiples estrategias en orden de
 * confiabilidad. Devuelve string vacío si no se detecta ninguno.
 */
function extractPNR(text: string): string {
  // Estrategia 1: Header Amadeus RP/XXXXX ... LOCALIZADOR
  const amadeus = PNR_AMADEUS_HEADER_REGEX.exec(text);
  if (amadeus?.[1]) return amadeus[1];

  // Estrategia 2: "PNR:", "RECORD LOCATOR:", "LOC/", "LOCATOR:"
  const labeled = PNR_LABELED_REGEX.exec(text);
  if (labeled?.[1]) return labeled[1];

  // Estrategia 3: Código al final de línea precedido por ": " (casos reales)
  const trailing = PNR_TRAILING_REGEX.exec(text);
  if (trailing?.[1]) {
    const candidate = trailing[1];
    // Validar que no sea un código de aerolínea (solo 2 chars) ni una palabra común
    if (/[A-Z]/.test(candidate) && /[0-9]/.test(candidate)) return candidate;
  }

  return "";
}

/**
 * Extrae TODOS los pasajeros del texto GDS.
 * Un solo regex unificado recorre el texto completo con exec() en bucle,
 * lo que permite capturar múltiples pasajeros en la misma línea.
 */
function extractPassengers(text: string, warnings: string[]): Passenger[] {
  const passengers: Passenger[] = [];
  const seen = new Set<string>();

  const addPassenger = (apellido: string, nombre: string, tipo: string) => {
    // Limpiar espacios sobrantes del nombre (puede capturar trailing space)
    const ap = apellido.trim().toUpperCase();
    const nm = nombre.trim().toUpperCase();
    if (!ap || !nm) return;

    const key = `${ap}/${nm}`;
    if (seen.has(key)) return;
    seen.add(key);

    passengers.push({
      nombre: `${ap}/${nm}`,
      tipo: tipo.toUpperCase(),
    });
  };

  // Un único regex con flag /g recorre todo el texto buscando patrones
  // de pasajero dondequiera que aparezcan (misma línea o líneas distintas)
  PASSENGER_UNIFIED_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PASSENGER_UNIFIED_REGEX.exec(text)) !== null) {
    addPassenger(match[1], match[2], match[3]);
  }

  if (passengers.length === 0) {
    warnings.push(
      "⚠️ No se encontraron pasajeros. " +
        "Formato esperado: '1.1APELLIDO/NOMBRE MR' o '1.1 APELLIDO/NOMBRE MRS'"
    );
  }

  return passengers;
}

/**
 * Extrae todos los segmentos de vuelo del texto GDS.
 * Aplica tres variantes de regex en orden de especificidad y deduplica
 * usando una clave compuesta aerolínea+vuelo+fecha+ruta.
 */
function extractSegments(text: string, warnings: string[]): FlightSegment[] {
  const segments: FlightSegment[] = [];
  // Mapa para deduplicar y preservar orden de aparición
  const seen = new Map<string, number>();

  const addSegment = (seg: FlightSegment, segIndex: number) => {
    const key = `${seg.aerolinea}${seg.numeroVuelo}${seg.fecha}${seg.origen}${seg.destino}`;
    if (seen.has(key)) return;
    seen.set(key, segIndex);
    segments.push(seg);
  };

  const buildSegment = (match: RegExpExecArray): FlightSegment => ({
    aerolinea:    match[2].toUpperCase(),
    numeroVuelo:  match[3].toUpperCase(),
    clase:        match[4].toUpperCase(),
    fecha:        match[5].toUpperCase(),
    origen:       match[6].toUpperCase(),
    destino:      match[7].toUpperCase(),
    status:       match[8].toUpperCase(),
    horaSalida:   normalizeTime(match[9]),
    // Preservar el indicador +1/+2 en la hora de llegada para información
    horaLlegada:  normalizeTime(match[10]) + (match[11] ? ` (${match[11]})` : ""),
  });

  let match: RegExpExecArray | null;
  let idx = 0;

  // Variante A: IATA juntos (más común en Sabre CCS)
  SEGMENT_JOINED_IATA_REGEX.lastIndex = 0;
  while ((match = SEGMENT_JOINED_IATA_REGEX.exec(text)) !== null) {
    addSegment(buildSegment(match), idx++);
  }

  // Variante B: IATA separados por espacio (Amadeus, AA, LA...)
  SEGMENT_SPLIT_IATA_REGEX.lastIndex = 0;
  while ((match = SEGMENT_SPLIT_IATA_REGEX.exec(text)) !== null) {
    addSegment(buildSegment(match), idx++);
  }

  // Variante C: Horas HH:MM
  SEGMENT_COLON_TIME_REGEX.lastIndex = 0;
  while ((match = SEGMENT_COLON_TIME_REGEX.exec(text)) !== null) {
    addSegment(buildSegment(match), idx++);
  }

  // Ordenar por fecha de vuelo (respeta el orden del itinerario)
  const MONTH_NUM: Record<string, number> = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
    JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  };
  segments.sort((a, b) => {
    const toNum = (d: string) => {
      const day = parseInt(d.slice(0, -3), 10) || 0;
      const mon = MONTH_NUM[d.slice(-3).toUpperCase()] || 0;
      return mon * 100 + day;
    };
    const diff = toNum(a.fecha) - toNum(b.fecha);
    return diff !== 0 ? diff : a.horaSalida.localeCompare(b.horaSalida);
  });

  if (segments.length === 0) {
    warnings.push(
      "⚠️ No se encontraron segmentos de vuelo. " +
        "Formato esperado: '1 CM 224 Y 15NOV 3 CCSPTY HK2  0700  0825'"
    );
  }

  return segments;
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

/**
 * parseGDS — Punto de entrada del motor de parsing.
 *
 * Analiza texto crudo de un GDS (Sabre, Amadeus, KIU, Galileo) y extrae
 * un objeto estructurado con los datos del PNR.
 *
 * @param rawText  Texto copiado directamente del terminal GDS.
 * @returns        ParseResult con los datos extraídos y advertencias.
 *
 * @example
 * ```ts
 * const result = parseGDS(`K3W9L2
 *  1.1GARCIA/CARLOS MR 2.1LOPEZ/MARIA MRS
 *  1 CM 224 Y 15NOV 3 CCSPTY HK2  0700  0825   *1A/E*
 * `);
 * // result.data.pnr          → "K3W9L2"
 * // result.data.pasajeros[0] → { nombre: "GARCIA/CARLOS", tipo: "MR" }
 * // result.data.segmentos[0] → { aerolinea: "CM", numeroVuelo: "224", ... }
 * ```
 */
export function parseGDS(rawText: string): ParseResult {
  const warnings: string[] = [];

  if (!rawText || rawText.trim().length < 10) {
    return {
      data: {},
      status: "error",
      warnings: ["❌ El texto ingresado está vacío o es demasiado corto para ser un PNR válido."],
      rawText,
    };
  }

  // Normalización: unificar saltos de línea y tabulaciones
  const normalizedText = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .trim();

  const pnr      = extractPNR(normalizedText);
  const pasajeros = extractPassengers(normalizedText, warnings);
  const segmentos = extractSegments(normalizedText, warnings);

  if (!pnr) {
    warnings.push(
      "⚠️ No se pudo detectar el PNR/Localizador automáticamente. " +
        "Por favor ingrésalo manualmente en el campo 'PNR'."
    );
  }

  const data: Partial<FlightTicket> = {
    pnr: pnr || "",
    pasajeros,
    segmentos,
    vinculadoAExpediente: false,
  };

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
 * Construye la ruta del itinerario para mostrar en listados.
 * Multi-segmento: muestra primer origen → último destino.
 *
 * @example buildRoute([{origen:"CCS",destino:"PTY"},{origen:"PTY",destino:"MIA"}])
 * // → "CCS → MIA"
 */
export function buildRoute(segmentos: FlightSegment[]): string {
  if (segmentos.length === 0) return "—";
  if (segmentos.length === 1) return `${segmentos[0].origen} → ${segmentos[0].destino}`;
  return `${segmentos[0].origen} → ${segmentos[segmentos.length - 1].destino}`;
}

/**
 * Formatea la fecha GDS cruda a formato legible dd/mm/yyyy.
 * "15NOV" → "15/11/2024"
 */
export function formatGDSDate(gdsFecha: string): string {
  if (!gdsFecha || gdsFecha.length < 5) return gdsFecha || "—";
  const MONTH_NUM: Record<string, string> = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04",
    MAY: "05", JUN: "06", JUL: "07", AUG: "08",
    SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  };
  let day = gdsFecha.slice(0, -3).padStart(2, "0");
  const mon = gdsFecha.slice(-3).toUpperCase();
  const currentYear = new Date().getFullYear();
  return `${day}/${MONTH_NUM[mon] || mon}/${currentYear}`;
}

/**
 * Texto de muestra con los dos formatos reales validados.
 * Para el botón "Cargar Ejemplo" en la UI.
 */
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
