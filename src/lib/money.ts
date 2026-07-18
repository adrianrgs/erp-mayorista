// Redondeo monetario a 2 decimales. Se aplica a TODO valor financiero que se calcula o
// persiste (IVA, saldos, moneda local, costos, ventas) para evitar el drift de punto flotante
// (p.ej. 0.1 + 0.2 = 0.30000000000000004, o 333.33 * 0.16 = 53.3328). Antes solo se redondeaba
// al mostrar con .toFixed(2), dejando valores sucios en la base de datos.
export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Redondea a 2 decimales cada campo numérico indicado de un objeto (mutación inmutable). */
export function round2Fields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
  const out = { ...obj };
  for (const f of fields) {
    const v = out[f];
    if (typeof v === "number") (out as any)[f] = round2(v);
  }
  return out;
}
