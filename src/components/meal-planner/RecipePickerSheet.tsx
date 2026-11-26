import { useEffect, useMemo, useRef, useState } from "react";
import { resolveMediaUrl } from "../../api/client";
import { NavClose, NavCutlery, NavDice, NavPlus, NavSearch } from "../ui/NavIcons";
import styles from "./RecipePickerSheet.module.css";

export interface PickRecipe {
  id: number;
  name: string;
  imageUrl: string | null;
  prepTime: number;
  servings: number;
  category: string | null;
}

export type PickSources = {
  saved: PickRecipe[] | null;
  mine: PickRecipe[] | null;
  all: PickRecipe[] | null;
};

type Filter = "saved" | "mine" | "quick" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "saved", label: "Guardadas" },
  { key: "mine", label: "Mis recetas" },
  { key: "quick", label: "Rápidas" },
  { key: "all", label: "Todas" },
];

interface Props {
  title: string;
  subtitle: string;
  mealLabel: string;
  sources: PickSources;
  weekRecipes: { id: number; name: string }[];
  currentRecipeId: number | null;
  saving: boolean;
  onPick: (recipeId: number) => void;
  onClose: () => void;
}

export default function RecipePickerSheet({
  title, subtitle, mealLabel, sources, weekRecipes, currentRecipeId, saving, onPick, onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(() =>
    sources.saved && sources.saved.length > 0 ? "saved" : sources.mine && sources.mine.length > 0 ? "mine" : "all",
  );
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const base = filter === "quick" ? sources.all : sources[filter];
  const loading = base === null;

  const list = useMemo(() => {
    let items = base ?? [];
    if (filter === "quick") items = items.filter((r) => r.prepTime > 0 && r.prepTime <= 30);
    const q = query.trim().toLowerCase();
    if (q) items = items.filter((r) => r.name.toLowerCase().includes(q));
    return items;
  }, [base, filter, query]);

  function pickRandom() {
    const pool = list.filter((r) => r.id !== currentRecipeId);
    const from = pool.length > 0 ? pool : list;
    if (from.length === 0) return;
    onPick(from[Math.floor(Math.random() * from.length)].id);
  }

  const filterLabel = FILTERS.find((f) => f.key === filter)!.label.toLowerCase();
  const repeat = weekRecipes.filter((r) => r.id !== currentRecipeId).slice(0, 6);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.handle} aria-hidden="true" />
        <div className={styles.head}>
          <div className={styles.headText}>
            <h2 id="picker-title" className={styles.title}>{title}</h2>
            <span className={styles.subtitle}>{subtitle}</span>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <NavClose size={20} />
          </button>
        </div>

        <label className={styles.search}>
          <NavSearch size={20} />
          <span className={styles.srOnly}>Buscar receta</span>
          <input
            type="search"
            placeholder="Buscá una receta"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            enterKeyHint="search"
          />
        </label>

        <div className={styles.filters} role="group" aria-label="Filtrar recetas">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              className={`${styles.chip} ${filter === f.key ? styles.chipActive : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className={styles.scroll}>
          <button type="button" className={styles.luck} onClick={pickRandom} disabled={saving || list.length === 0}>
            <NavDice size={30} />
            <span className={styles.luckText}>
              <strong>Que elija la suerte</strong>
              <span>Una receta al azar de {filter === "quick" ? "las rápidas" : filter === "all" ? "todas" : `tus ${filterLabel}`}</span>
            </span>
          </button>

          {repeat.length > 0 && !query && (
            <section className={styles.block}>
              <h3 className={styles.blockTitle}>Ya en tu semana</h3>
              <div className={styles.repeat}>
                {repeat.map((r) => (
                  <button key={r.id} type="button" className={styles.chip} onClick={() => onPick(r.id)} disabled={saving}>
                    {r.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className={styles.block}>
            <h3 className={styles.blockTitle}>{FILTERS.find((f) => f.key === filter)!.label}</h3>
            {loading ? (
              <p className={styles.empty}>Cargando recetas…</p>
            ) : list.length === 0 ? (
              <p className={styles.empty}>
                {query ? "No encontramos recetas con ese nombre." : `No tenés recetas en ${filterLabel}.`}
              </p>
            ) : (
              <ul className={styles.list}>
                {list.map((r) => {
                  const current = r.id === currentRecipeId;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        className={`${styles.item} ${current ? styles.itemCurrent : ""}`}
                        onClick={() => onPick(r.id)}
                        disabled={saving}
                        aria-label={current ? `${r.name}, ya elegida` : `Elegir ${r.name} para ${mealLabel}`}
                      >
                        <span className={styles.thumb} aria-hidden="true">
                          {r.imageUrl ? <img src={resolveMediaUrl(r.imageUrl)} alt="" /> : <NavCutlery size={22} />}
                        </span>
                        <span className={styles.itemText}>
                          <strong>{r.name}</strong>
                          <span>
                            {r.prepTime > 0 ? `${r.prepTime} min` : "Sin tiempo"} · {r.servings}{" "}
                            {r.servings === 1 ? "porción" : "porciones"}
                          </span>
                        </span>
                        <span className={styles.add} aria-hidden="true">
                          {current ? "✓" : <NavPlus size={22} />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
