import { useState, useEffect } from "react";

/**
 * Paginación de RENDER en cliente: corta una lista ya filtrada/ordenada en páginas para
 * acotar el DOM (fluidez), sin tocar la traída ni las derivaciones. `resetKey` vuelve a la
 * página 0 cuando cambia el filtro/orden (así no quedás en una página que ya no existe).
 */
export function useClientPagination<T>(items: T[], pageSize = 25, resetKey = "") {
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [resetKey]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    pageItems,
    page: safePage,
    pageCount,
    total: items.length,
    hasMore: safePage < pageCount - 1,
    next: () => setPage(p => Math.min(p + 1, pageCount - 1)),
    prev: () => setPage(p => Math.max(0, p - 1)),
  };
}
