import { round2 } from "./money";

// Ítem mínimo para el desglose de IVA: su precio de venta y su tratamiento (heredado del producto).
export interface VatItem {
  precioVenta: number;
  tratamientoIVA?: "incluido" | "aparte" | "exento";
}

export interface VatBreakdown {
  base: number;    // base gravable (sin IVA)
  iva: number;     // IVA de la parte gravada
  exento: number;  // base exenta
  total: number;   // total con IVA (base + iva + exento)
  neto: number;    // total SIN IVA (base + exento) — usar para comisiones/márgenes
}

/**
 * Desglose de IVA de un conjunto de ítems, cada uno con su tratamiento:
 *  - "incluido": el precioVenta YA trae IVA → se extrae (base = precio/(1+tasa)).
 *  - "aparte": el precioVenta es neto → el IVA se suma encima.
 *  - "exento": no genera IVA.
 * Los ítems sin tratamiento usan `defaultMode` (por defecto "incluido", igual que la facturación).
 *
 * `neto` = base gravable + base exenta (el valor SIN IVA). El IVA nunca debe considerarse para el
 * cálculo de comisiones/márgenes: esos se calculan sobre `neto`.
 */
export function computeVatBreakdown(
  items: VatItem[],
  rate: number,
  defaultMode: "incluido" | "aparte" | "exento" = "incluido",
): VatBreakdown {
  let base = 0, iva = 0, exento = 0;
  for (const it of items) {
    const amount = it.precioVenta || 0;
    const mode = it.tratamientoIVA || defaultMode;
    if (mode === "exento") {
      exento += amount;
    } else if (mode === "aparte") {
      base += amount;
      iva += amount * rate;
    } else { // incluido
      const b = amount / (1 + rate);
      base += b;
      iva += amount - b;
    }
  }
  base = round2(base);
  iva = round2(iva);
  exento = round2(exento);
  return { base, iva, exento, total: round2(base + iva + exento), neto: round2(base + exento) };
}

/** Neto (sin IVA) de un solo monto según su tratamiento — para comisiones/márgenes. */
export function netoSinIVA(amount: number, mode: "incluido" | "aparte" | "exento" | undefined, rate: number): number {
  const m = mode || "incluido";
  if (m === "incluido") return round2(amount / (1 + rate));
  return round2(amount); // "aparte" (ya es neto) y "exento" (sin IVA)
}
