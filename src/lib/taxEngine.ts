// Generic multi-country tax engine — Venezuela is the default preset but any jurisdiction works.
import { round2 } from "./money";

export interface TaxJurisdiction {
  id: string;
  country: string;
  taxName: string;              // "IVA" | "VAT" | "IGV" | "ITBMS" | "GST"
  taxRate: number;              // 0.16 for Venezuela
  reducedTaxRate: number;       // 0.00 for exempt zones / services
  taxIdLabel: string;           // "RIF" | "NIT" | "RUC" | "NIF"
  fiscalDocLabel: string;       // "N° Control" | "CUFE" | "Folio"
  localCurrency: string;        // "VES" | "COP" | "PEN" | "EUR"
  exchangeRateLabel: string;    // "BCV" | "TRM" | "SBS" | "Manual"
  hasSurcharge: boolean;        // true = VE (IGTF), false = most countries
  surchargeName?: string;       // "IGTF" | "ITF"
  surchargeRate?: number;       // 0.03
  surchargePaymentMethods?: string[]; // methods that trigger surcharge
  hasWithholding: boolean;      // true = VE/CO
  withholdingLabel?: string;    // "Contribuyente Especial" | "Gran Contribuyente"
  vatWithholdingOptions?: number[];        // [0, 75, 100]
  incomeTaxWithholdingOptions?: number[];  // [0, 1, 2, 3]
  incomeTaxWithholdingLabel?: string;      // "ISLR" | "Renta" | "Income Tax"
  hasExemptZone: boolean;
  exemptZoneLabel?: string;     // "Puerto Libre" | "Zona Franca"
}

export interface ClientTaxProfile {
  isWithheldClient: boolean;
  vatWithholdingPct: number;        // 0 | 75 | 100 (Venezuela), configurable
  incomeTaxWithholdingPct: number;  // 0 | 1 | 2 | 3
  isInExemptZone: boolean;
}

export interface TaxCalculation {
  taxableBase: number;          // base gravable (sin impuesto)
  exemptBase: number;           // base exenta (zona especial)
  vatAmount: number;            // impuesto calculado
  vatWithheld: number;          // retención de impuesto por agente
  vatNetPayable: number;        // vatAmount - vatWithheld
  surchargeAmount: number;      // recargo por método de pago (IGTF, etc.)
  incomeTaxWithheld: number;    // retención de renta / ISLR
  totalInvoice: number;         // base + vat + surcharge
  totalReceived: number;        // totalInvoice - vatWithheld - incomeTaxWithheld
  exchangeRate: number;         // tipo de cambio congelado al emitir
  localCurrencyAmount: number;  // totalInvoice × exchangeRate
}

// Country presets — Venezuela is the default
export const JURISDICTION_PRESETS: Record<string, Omit<TaxJurisdiction, 'id'>> = {
  VE: {
    country: 'VE',
    taxName: 'IVA',
    taxRate: 0.16,
    reducedTaxRate: 0.00,
    taxIdLabel: 'RIF',
    fiscalDocLabel: 'N° Control',
    localCurrency: 'VES',
    exchangeRateLabel: 'BCV',
    hasSurcharge: true,
    surchargeName: 'IGTF',
    surchargeRate: 0.03,
    surchargePaymentMethods: ['Efectivo USD', 'Efectivo / Divisas', 'Tarjeta de Crédito'],
    hasWithholding: true,
    withholdingLabel: 'Contribuyente Especial',
    vatWithholdingOptions: [0, 75, 100],
    incomeTaxWithholdingOptions: [0, 1, 2, 3],
    incomeTaxWithholdingLabel: 'ISLR',
    hasExemptZone: true,
    exemptZoneLabel: 'Puerto Libre',
  },
  CO: {
    country: 'CO',
    taxName: 'IVA',
    taxRate: 0.19,
    reducedTaxRate: 0.05,
    taxIdLabel: 'NIT',
    fiscalDocLabel: 'CUFE',
    localCurrency: 'COP',
    exchangeRateLabel: 'TRM',
    hasSurcharge: false,
    hasWithholding: true,
    withholdingLabel: 'Gran Contribuyente',
    vatWithholdingOptions: [0, 50, 100],
    incomeTaxWithholdingOptions: [0, 1, 2, 3.5],
    incomeTaxWithholdingLabel: 'Retefuente',
    hasExemptZone: true,
    exemptZoneLabel: 'Zona Franca',
  },
  PE: {
    country: 'PE',
    taxName: 'IGV',
    taxRate: 0.18,
    reducedTaxRate: 0.00,
    taxIdLabel: 'RUC',
    fiscalDocLabel: 'CAE',
    localCurrency: 'PEN',
    exchangeRateLabel: 'SBS',
    hasSurcharge: false,
    hasWithholding: false,
    hasExemptZone: false,
  },
  PA: {
    country: 'PA',
    taxName: 'ITBMS',
    taxRate: 0.07,
    reducedTaxRate: 0.00,
    taxIdLabel: 'RUC',
    fiscalDocLabel: 'Folio',
    localCurrency: 'PAB',
    exchangeRateLabel: 'Manual',
    hasSurcharge: false,
    hasWithholding: false,
    hasExemptZone: false,
  },
  MX: {
    country: 'MX',
    taxName: 'IVA',
    taxRate: 0.16,
    reducedTaxRate: 0.00,
    taxIdLabel: 'RFC',
    fiscalDocLabel: 'UUID CFDI',
    localCurrency: 'MXN',
    exchangeRateLabel: 'Banxico',
    hasSurcharge: false,
    hasWithholding: false,
    hasExemptZone: false,
  },
  ES: {
    country: 'ES',
    taxName: 'IVA',
    taxRate: 0.21,
    reducedTaxRate: 0.10,
    taxIdLabel: 'NIF',
    fiscalDocLabel: 'Folio',
    localCurrency: 'EUR',
    exchangeRateLabel: 'ECB',
    hasSurcharge: false,
    hasWithholding: false,
    hasExemptZone: false,
  },
  CL: {
    country: 'CL',
    taxName: 'IVA',
    taxRate: 0.19,
    reducedTaxRate: 0.00,
    taxIdLabel: 'RUT',
    fiscalDocLabel: 'Folio',
    localCurrency: 'CLP',
    exchangeRateLabel: 'Banco Central',
    hasSurcharge: false,
    hasWithholding: true,
    withholdingLabel: 'Agente de Retención',
    vatWithholdingOptions: [0, 100],
    incomeTaxWithholdingOptions: [0, 10.75],
    incomeTaxWithholdingLabel: 'Ret. Honorarios',
    hasExemptZone: false,
  },
  US: {
    country: 'US',
    taxName: 'Tax',
    taxRate: 0.00,
    reducedTaxRate: 0.00,
    taxIdLabel: 'EIN',
    fiscalDocLabel: 'Invoice #',
    localCurrency: 'USD',
    exchangeRateLabel: 'Manual',
    hasSurcharge: false,
    hasWithholding: false,
    hasExemptZone: false,
  },
};

export function calculateTaxes(
  amount: number,
  paymentMethod: string,
  jurisdiction: TaxJurisdiction,
  clientProfile: ClientTaxProfile,
  exchangeRate: number,
  // vatInclusive: si `amount` YA incluye el IVA (precio final), la base se EXTRAE (base = amount/(1+tasa))
  // y el total = amount. Si es false (default), `amount` es la base neta y el IVA se SUMA por encima.
  vatInclusive: boolean = false,
  // forceExempt: exención EXPLÍCITA (casilla "Facturar sin IVA" o servicio marcado "Exento"). Exenta
  // SIEMPRE, sin depender de `hasExemptZone` (que es solo para la exención geográfica del cliente).
  forceExempt: boolean = false,
): TaxCalculation {
  const isExempt = forceExempt || (clientProfile.isInExemptZone && jurisdiction.hasExemptZone);
  const appliedRate = isExempt ? jurisdiction.reducedTaxRate : jurisdiction.taxRate;

  // Base gravable: exento → 0; precio con IVA incluido → se extrae; neto → es el propio amount.
  const taxableBase = isExempt ? 0 : (vatInclusive ? amount / (1 + appliedRate) : amount);
  const exemptBase  = isExempt ? amount : 0;

  // vatAmount = base * tasa (equivale a amount - base cuando es inclusive).
  const vatAmount = taxableBase * appliedRate;

  const vatWithheld =
    jurisdiction.hasWithholding && clientProfile.isWithheldClient
      ? vatAmount * (clientProfile.vatWithholdingPct / 100)
      : 0;

  const appliesSurcharge =
    jurisdiction.hasSurcharge &&
    (jurisdiction.surchargePaymentMethods ?? []).includes(paymentMethod);
  const surchargeAmount = appliesSurcharge ? amount * (jurisdiction.surchargeRate ?? 0) : 0;

  const incomeTaxWithheld =
    jurisdiction.hasWithholding && clientProfile.isWithheldClient
      ? taxableBase * (clientProfile.incomeTaxWithholdingPct / 100)
      : 0;

  // Total = base gravable + IVA + base exenta + recargo. Unificado para inclusive/aditivo/exento:
  // - aditivo no exento: amount + IVA + recargo (como antes).
  // - inclusive no exento: base + IVA = amount, + recargo.
  // - exento: exemptBase (= amount) + recargo.
  const totalInvoice  = taxableBase + vatAmount + exemptBase + surchargeAmount;
  const totalReceived = totalInvoice - vatWithheld - incomeTaxWithheld;

  // Redondeo a 2 decimales de todo valor monetario para evitar drift de float en documentos fiscales.
  return {
    taxableBase: round2(taxableBase),
    exemptBase: round2(exemptBase),
    vatAmount: round2(vatAmount),
    vatWithheld: round2(vatWithheld),
    vatNetPayable: round2(vatAmount - vatWithheld),
    surchargeAmount: round2(surchargeAmount),
    incomeTaxWithheld: round2(incomeTaxWithheld),
    totalInvoice: round2(totalInvoice),
    totalReceived: round2(totalReceived),
    exchangeRate,
    localCurrencyAmount: round2(totalInvoice * exchangeRate),
  };
}

// Default jurisdiction (Venezuela) for bootstrapping before DB load
export const DEFAULT_JURISDICTION: TaxJurisdiction = {
  id: 'default',
  ...JURISDICTION_PRESETS.VE,
};

const CURRENCY_LOCALES: Record<string, string> = {
  VES: "es-VE", COP: "es-CO", PEN: "es-PE", PAB: "es-PA",
  MXN: "es-MX", CLP: "es-CL", EUR: "es-ES", USD: "en-US",
};

// Moneda de operación configurable (default "USD"). App la fija desde companyConfig.currency al
// cargar. `getOperatingCurrency()` reemplaza los literales "USD" de las vistas (la moneda LOCAL
// fiscal sigue derivándose de jurisdiction.localCurrency, no de esto).
let _operatingCurrency = "USD";
export function setOperatingCurrency(c?: string) { _operatingCurrency = c || "USD"; }
export function getOperatingCurrency(): string { return _operatingCurrency; }

// Símbolo de la moneda de operación (USD→"$", VES→"Bs.S", EUR→"€"). Para adornos de inputs y
// labels donde se muestra solo el símbolo, no un monto formateado.
export function getCurrencySymbol(currency: string = _operatingCurrency): string {
  const locale = CURRENCY_LOCALES[currency] ?? "es-ES";
  try {
    const parts = new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0);
    return parts.find(p => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

export function formatCurrency(amount: number, currency: string): string {
  const locale = CURRENCY_LOCALES[currency] ?? "es-ES";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale, { minimumFractionDigits: 2 })} ${currency}`;
  }
}

export function formatDualCurrency(
  usdAmount: number,
  jurisdiction: TaxJurisdiction,
  exchangeRate?: number,
): string {
  // La moneda primaria es la de OPERACIÓN configurada (antes fijo "USD"), para que el monto
  // principal respete ConfiguracionView. La secundaria sigue siendo la LOCAL fiscal (× tasa).
  const operating = getOperatingCurrency();
  const primary = formatCurrency(usdAmount, operating);
  // Si la moneda de operación ya es la local fiscal, el par es redundante: mostrar solo una.
  if (!exchangeRate || jurisdiction.localCurrency === operating) return primary;
  const local = formatCurrency(usdAmount * exchangeRate, jurisdiction.localCurrency);
  return `${primary} (${local})`;
}
