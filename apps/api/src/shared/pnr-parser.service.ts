import { Injectable } from '@nestjs/common';

export interface Passenger {
  nombre: string;
  tipo: string;
  documento?: string;
}

export interface FlightSegment {
  aerolinea: string;
  numeroVuelo: string;
  clase: string;
  fecha: string;
  origen: string;
  destino: string;
  horaSalida: string;
  horaLlegada: string;
  status: string;
}

export interface ParseResult {
  data: {
    pnr?: string;
    pasajeros?: Passenger[];
    segmentos?: FlightSegment[];
    vinculadoAExpediente?: boolean;
  };
  status: 'success' | 'error';
  warnings: string[];
  rawText: string;
}

// Regex extraídas del pnrParser.ts del frontend (sin modificación)
const PNR_AMADEUS_HEADER_REGEX = /^RP\/\S+\/\S+\s+\S+\s+\S+\s+([A-Z0-9]{6})\s*$/im;
const PNR_LABELED_REGEX = /(?:RECORD\s+LOCATOR|PNR|LOCATOR?)[:/\s]+([A-Z0-9]{6})\b/i;
const PNR_TRAILING_REGEX = /(?::\s*|^)([A-Z][A-Z0-9]{2}[A-Z0-9]{2}[A-Z0-9])\s*$/im;
const PASSENGER_UNIFIED_REGEX =
  /\d+\.\d+\s*([A-Z][A-Z\-]{1,28})\/([A-Z][A-Z\s]{1,24}?)\s*(MR|MRS|MS|CHD|INF|MSTR|MISS|DR)\b/gi;
const SEGMENT_JOINED_IATA_REGEX =
  /^\s*(\d{1,2})\s+([A-Z0-9]{2})\s+(\d{1,4}[A-Z]?)\s+([A-Z])\s+(\d{1,2}[A-Z]{3})\s+\d?\s*([A-Z]{3})([A-Z]{3})\s+((?:HK|RQ|HL|UN|SA|KL)\d{1,2})\s+(\d{4})\s+(\d{4})(\+\d)?/gim;
const SEGMENT_SPLIT_IATA_REGEX =
  /^\s*(\d{1,2})\s+([A-Z0-9]{2})\s+(\d{1,4}[A-Z]?)\s+([A-Z])\s+(\d{1,2}[A-Z]{3})\s+\d?\s*([A-Z]{3})\s+([A-Z]{3})\s+((?:HK|RQ|HL|UN|SA|KL)\d{1,2})\s+(\d{4})\s+(\d{4})(\+\d)?/gim;
const SEGMENT_COLON_TIME_REGEX =
  /^\s*(\d{1,2})\s+([A-Z0-9]{2})\s+(\d{1,4}[A-Z]?)\s+([A-Z])\s+(\d{1,2}[A-Z]{3})\s+\d?\s*([A-Z]{3})\s*([A-Z]{3})\s+((?:HK|RQ|HL|UN|SA|KL)\d{1,2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})(\+\d)?/gim;

const MONTH_NUM: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

function normalizeTime(raw: string): string {
  if (!raw) return '';
  const clean = raw.replace(':', '').slice(0, 4);
  if (clean.length === 4 && /^\d{4}$/.test(clean)) {
    return `${clean.slice(0, 2)}:${clean.slice(2)}`;
  }
  return raw;
}

@Injectable()
export class PnrParserService {
  parse(rawText: string): ParseResult {
    const warnings: string[] = [];

    if (!rawText || rawText.trim().length < 10) {
      return {
        data: {},
        status: 'error',
        warnings: ['❌ El texto ingresado está vacío o es demasiado corto.'],
        rawText,
      };
    }

    const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\t/g, ' ').trim();
    const pnr = this.extractPNR(text);
    const pasajeros = this.extractPassengers(text, warnings);
    const segmentos = this.extractSegments(text, warnings);

    if (!pnr) {
      warnings.push('⚠️ No se pudo detectar el PNR/Localizador automáticamente.');
    }

    const hasErrors = pasajeros.length === 0 && segmentos.length === 0;
    return {
      data: { pnr: pnr || '', pasajeros, segmentos, vinculadoAExpediente: false },
      status: hasErrors ? 'error' : 'success',
      warnings,
      rawText: text,
    };
  }

  buildRoute(segmentos: FlightSegment[]): string {
    if (segmentos.length === 0) return '—';
    if (segmentos.length === 1) return `${segmentos[0].origen} → ${segmentos[0].destino}`;
    return `${segmentos[0].origen} → ${segmentos[segmentos.length - 1].destino}`;
  }

  private extractPNR(text: string): string {
    const amadeus = PNR_AMADEUS_HEADER_REGEX.exec(text);
    if (amadeus?.[1]) return amadeus[1];
    const labeled = PNR_LABELED_REGEX.exec(text);
    if (labeled?.[1]) return labeled[1];
    const trailing = PNR_TRAILING_REGEX.exec(text);
    if (trailing?.[1]) {
      const c = trailing[1];
      if (/[A-Z]/.test(c) && /[0-9]/.test(c)) return c;
    }
    return '';
  }

  private extractPassengers(text: string, warnings: string[]): Passenger[] {
    const passengers: Passenger[] = [];
    const seen = new Set<string>();
    PASSENGER_UNIFIED_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PASSENGER_UNIFIED_REGEX.exec(text)) !== null) {
      const ap = match[1].trim().toUpperCase();
      const nm = match[2].trim().toUpperCase();
      if (!ap || !nm) continue;
      const key = `${ap}/${nm}`;
      if (seen.has(key)) continue;
      seen.add(key);
      passengers.push({ nombre: key, tipo: match[3].toUpperCase() });
    }
    if (passengers.length === 0) {
      warnings.push("⚠️ No se encontraron pasajeros. Formato esperado: '1.1APELLIDO/NOMBRE MR'");
    }
    return passengers;
  }

  private extractSegments(text: string, warnings: string[]): FlightSegment[] {
    const segments: FlightSegment[] = [];
    const seen = new Map<string, number>();
    let idx = 0;

    const buildSeg = (m: RegExpExecArray): FlightSegment => ({
      aerolinea: m[2].toUpperCase(),
      numeroVuelo: m[3].toUpperCase(),
      clase: m[4].toUpperCase(),
      fecha: m[5].toUpperCase(),
      origen: m[6].toUpperCase(),
      destino: m[7].toUpperCase(),
      status: m[8].toUpperCase(),
      horaSalida: normalizeTime(m[9]),
      horaLlegada: normalizeTime(m[10]) + (m[11] ? ` (${m[11]})` : ''),
    });

    const add = (seg: FlightSegment) => {
      const key = `${seg.aerolinea}${seg.numeroVuelo}${seg.fecha}${seg.origen}${seg.destino}`;
      if (seen.has(key)) return;
      seen.set(key, idx++);
      segments.push(seg);
    };

    let match: RegExpExecArray | null;
    SEGMENT_JOINED_IATA_REGEX.lastIndex = 0;
    while ((match = SEGMENT_JOINED_IATA_REGEX.exec(text)) !== null) add(buildSeg(match));
    SEGMENT_SPLIT_IATA_REGEX.lastIndex = 0;
    while ((match = SEGMENT_SPLIT_IATA_REGEX.exec(text)) !== null) add(buildSeg(match));
    SEGMENT_COLON_TIME_REGEX.lastIndex = 0;
    while ((match = SEGMENT_COLON_TIME_REGEX.exec(text)) !== null) add(buildSeg(match));

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
      warnings.push("⚠️ No se encontraron segmentos de vuelo. Formato esperado: '1 CM 224 Y 15NOV 3 CCSPTY HK2  0700  0825'");
    }
    return segments;
  }
}
