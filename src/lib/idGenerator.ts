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
