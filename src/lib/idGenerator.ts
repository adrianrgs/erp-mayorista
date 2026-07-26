/**
 * Generates the next sequential ID for a given prefix (e.g. "FAC-1", "FAC-2", ...),
 * looking at the highest existing number already used by that same prefix.
 * Replaces the previous random/timestamp-based IDs across the app.
 */
export function nextSequentialId(prefix: string, existingIds: (string | undefined | null)[]): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const id of existingIds) {
    if (!id) continue;
    const match = id.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return `${prefix}-${max + 1}`;
}

/**
 * Extrae el número secuencial embebido en un id tipo PREFIX-N (ej. "RES-12" → 12).
 * Devuelve 0 si el id no matchea. Como los ids se asignan de forma estrictamente
 * secuencial, este número ES el orden de creación (mayor = más nuevo).
 */
export function seqNum(id?: string | null): number {
  if (!id) return 0;
  const m = id.match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Comparador para Array.sort: apila los más nuevos primero (mayor número de id arriba).
 * Uso: lista.sort(byNewestFirst)
 */
export function byNewestFirst<T extends { id?: string | null }>(a: T, b: T): number {
  return seqNum(b.id) - seqNum(a.id);
}
