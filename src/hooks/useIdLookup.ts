import { useState, useCallback } from "react";

export type IdLookupStatus = "idle" | "loading" | "found" | "notfound" | "error";

/**
 * Buscador por id directo: dado un id, trae ESE registro de la base (point-read), en vez
 * de filtrar el array en memoria. Base del "buscador (no filtro)" en cada módulo y en el
 * buscador global. El fetcher devuelve el registro o null si no existe.
 */
export function useIdLookup<T>(fetcher: (id: string) => Promise<T | null>) {
  const [status, setStatus] = useState<IdLookupStatus>("idle");
  const [result, setResult] = useState<T | null>(null);

  const search = useCallback(async (rawId: string): Promise<T | null> => {
    const id = rawId.trim();
    if (!id) { setStatus("idle"); setResult(null); return null; }
    setStatus("loading");
    try {
      const found = await fetcher(id);
      setResult(found);
      setStatus(found ? "found" : "notfound");
      return found;
    } catch {
      setResult(null);
      setStatus("error");
      return null;
    }
  }, [fetcher]);

  const reset = useCallback(() => { setStatus("idle"); setResult(null); }, []);

  return { status, result, search, reset };
}
