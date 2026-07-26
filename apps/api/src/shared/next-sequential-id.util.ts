/**
 * Siguiente id secuencial (p.ej. "RES-1", "AER-1", …) a partir del número más alto
 * ya usado por ese mismo prefijo. Espejo backend de src/lib/idGenerator.ts, usado en
 * la asignación server-side a prueba de concurrencia.
 */
export function nextSequentialId(prefix: string, usedIds: Iterable<string>): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const id of usedIds) {
    const m = id?.match(pattern);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return `${prefix}-${max + 1}`;
}
