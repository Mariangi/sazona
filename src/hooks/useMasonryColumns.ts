import { useEffect, useMemo, useState } from "react";

// Mismos cortes que usaba la grilla en CSS.
function columnsForWidth(width: number) {
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
}

/**
 * Reparte los elementos en columnas, cada uno en la más corta. El reparto sigue el orden de la
 * lista, así que al agregar elementos al final (scroll infinito) los ya mostrados no se mueven.
 * `estimateHeight` devuelve el alto de la tarjeta relativo al ancho de la columna.
 */
export function useMasonryColumns<T>(items: T[], estimateHeight: (item: T) => number): T[][] {
  const [count, setCount] = useState(() => columnsForWidth(window.innerWidth));

  useEffect(() => {
    const onResize = () => setCount(columnsForWidth(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return useMemo(() => {
    const columns: T[][] = Array.from({ length: count }, () => []);
    const heights = new Array<number>(count).fill(0);
    for (const item of items) {
      const shortest = heights.indexOf(Math.min(...heights));
      columns[shortest].push(item);
      heights[shortest] += estimateHeight(item);
    }
    return columns;
  }, [items, count, estimateHeight]);
}
