import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RecipeListItem, RecipeResponse } from "@sasona/shared";
import { api } from "../api/client";
import Button from "../components/ui/Button";
import RecipeSwipeCard, {
  type RecipeSwipeCardHandle,
} from "../components/recipes/RecipeSwipeCard";
import { ArrowLeftIcon, ArrowRightIcon } from "../components/ui/Icons";
import styles from "./SwipeDinnerPage.module.css";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function SwipeDinnerPage() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hadAnyRecipes, setHadAnyRecipes] = useState(true);
  const [detailsCache, setDetailsCache] = useState<Map<number, RecipeResponse>>(new Map());
  const [revealedTopId, setRevealedTopId] = useState<number | null>(null);

  const originalDeckRef = useRef<RecipeListItem[]>([]);
  const fetchingRef = useRef<Set<number>>(new Set());
  const topCardHandleRef = useRef<RecipeSwipeCardHandle>(null);

  useEffect(() => {
    Promise.all([api.getAllRecipes(), api.getSavedRecipes()])
      .then(([all, saved]) => {
        setHadAnyRecipes(all.length > 0);
        const savedIds = new Set(saved.map((s) => s.recipeId));
        const pool = shuffle(all.filter((r) => !savedIds.has(r.id)));
        originalDeckRef.current = pool;
        setDeck(pool);
      })
      .catch(() => setLoadError("No se pudieron cargar las recetas"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    deck.slice(0, 2).forEach(({ id }) => {
      if (detailsCache.has(id) || fetchingRef.current.has(id)) return;
      fetchingRef.current.add(id);
      api
        .getRecipeById(id)
        .then((full) => setDetailsCache((prev) => new Map(prev).set(id, full)))
        .catch(() => {})
        .finally(() => fetchingRef.current.delete(id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

  function handleSwipeRight() {
    const top = deck[0];
    setDeck((prev) => prev.slice(1));
    setRevealedTopId(null);
    if (top) {
      api.saveRecipe(top.id).catch(() => {});
      navigate(`/recipes/${top.id}`);
    }
  }

  function handleSwipeLeft() {
    setDeck((prev) => prev.slice(1));
    setRevealedTopId(null);
  }

  function handleSwipeUp() {
    const top = deck[0];
    if (!top) return;
    setRevealedTopId((id) => (id === top.id ? null : top.id));
  }

  function handleStartOver() {
    setDeck(shuffle(originalDeckRef.current));
    setRevealedTopId(null);
  }

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Algo salió mal</h2>
          <p className={styles.emptyText}>{loadError}</p>
        </div>
      </div>
    );
  }

  if (!hadAnyRecipes) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>No tenés recetas aún</h2>
          <p className={styles.emptyText}>
            Creá algunas recetas para poder elegir qué cenar
          </p>
          <Button onClick={() => navigate("/recipes/new")}>
            Crear primera receta
          </Button>
        </div>
      </div>
    );
  }

  if (originalDeckRef.current.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Ya tenés todas guardadas</h2>
          <p className={styles.emptyText}>
            Guardaste todas tus recetas como candidatas para cenar
          </p>
          <Button onClick={() => navigate("/saved")}>Ver guardadas</Button>
        </div>
      </div>
    );
  }

  if (deck.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Eso es todo por ahora</h2>
          <p className={styles.emptyText}>Ya pasaste por todas las recetas</p>
          <Button onClick={handleStartOver}>Empezar de nuevo</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.deckContainer}>
        {deck.slice(0, 3).map((recipe, i) => (
          <RecipeSwipeCard
            key={recipe.id}
            ref={i === 0 ? topCardHandleRef : undefined}
            recipe={recipe}
            fullDetails={detailsCache.get(recipe.id)}
            revealed={i === 0 && revealedTopId === recipe.id}
            interactive={i === 0}
            stackIndex={i}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeUp={handleSwipeUp}
          />
        ))}
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionNo}`}
          aria-label="No, otra receta"
          onClick={() => topCardHandleRef.current?.triggerSwipe("left")}
        >
          <ArrowLeftIcon width="20" height="20" fill="#fff" />
          No
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionYes}`}
          aria-label="Sí, cocinar esto"
          onClick={() => topCardHandleRef.current?.triggerSwipe("right")}
        >
          Sí, cocinar
          <ArrowRightIcon width="20" height="20" fill="#fff" />
        </button>
      </div>
    </div>
  );
}
