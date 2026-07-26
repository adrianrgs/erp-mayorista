import { useState, useEffect, useCallback, useRef } from "react";

/** Fetcher paginado: recibe (limit, offset) y devuelve la página + si hay más. */
export type PagedFetcher<T> = (limit: number, offset: number) => Promise<{ items: T[]; hasMore: boolean }>;

/**
 * Fase 0 — patrón reutilizable de paginación server-side (Prev/Siguiente por offset).
 * No requiere un count total: el backend pide limit+1 y devuelve `hasMore`.
 * `deps` recarga a la página 0 cuando cambian (ej. al cambiar de entidad/filtro).
 */
export function usePaginatedList<T>(fetcher: PagedFetcher<T>, pageSize = 25, deps: any[] = []) {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // La última fetcher sin retriggear la carga por su identidad (suele ser una closure nueva).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current(pageSize, p * pageSize);
      setItems(res.items);
      setHasMore(res.hasMore);
      setPage(p);
    } catch (e: any) {
      setError(e?.message || "Error al cargar la lista");
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Recarga a la página 0 al montar y cuando cambian las deps (filtro/entidad).
  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    items,
    page,
    hasMore,
    loading,
    error,
    next: () => { if (hasMore && !loading) load(page + 1); },
    prev: () => { if (page > 0 && !loading) load(page - 1); },
    refresh: () => load(page),
    reload: () => load(0),
  };
}
