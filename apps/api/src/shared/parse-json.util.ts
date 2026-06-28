/**
 * Data Connect devuelve campos Any ya como objetos JS, no como strings.
 * Esta función maneja ambos casos de forma segura.
 */
export function parseJsonField<T = any>(field: any, fallback: T): T {
  if (field === null || field === undefined) return fallback;
  if (typeof field === 'string') {
    try { return JSON.parse(field); } catch { return fallback; }
  }
  return field as T;
}
