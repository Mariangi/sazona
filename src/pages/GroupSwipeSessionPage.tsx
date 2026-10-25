import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { RecipeListItem, RecipeResponse, SwipeSessionStatus } from "@sasona/shared";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import RecipeSwipeCard, {
  type RecipeSwipeCardHandle,
} from "../components/recipes/RecipeSwipeCard";
import { ArrowLeftIcon, ArrowRightIcon } from "../components/ui/Icons";
import styles from "./GroupSwipeSessionPage.module.css";

const POLL_INTERVAL_MS = 1750;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function GroupSwipeSessionPage() {
  const { groupId, sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState<SwipeSessionStatus | null>(null);
  const [deck, setDeck] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [detailsCache, setDetailsCache] = useState<Map<number, RecipeResponse>>(new Map());
  const [revealedTopId, setRevealedTopId] = useState<number | null>(null);

  const fetchingRef = useRef<Set<number>>(new Set());
  const topCardHandleRef = useRef<RecipeSwipeCardHandle>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    api
      .joinSwipeSession(Number(sessionId))
      .then((s) => {
        setStatus(s);
        const likedIds = new Set(s.myLikedRecipeIds);
        setDeck(shuffle(s.deck.filter((r) => !likedIds.has(r.id))));
      })
      .catch(() => setLoadError("No se pudo unir a la sesión"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || status?.status !== "active") return;
    pollRef.current = setInterval(() => {
      api.getSwipeSession(Number(sessionId)).then(setStatus).catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId, status?.status]);

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

  async function handleSwipeRight() {
    const top = deck[0];
    setDeck((prev) => prev.slice(1));
    setRevealedTopId(null);
    if (!top || !sessionId) return;
    try {
      const result = await api.likeSwipeRecipe(Number(sessionId), top.id);
      if (result.matched) {
        if (pollRef.current) clearInterval(pollRef.current);
        const fresh = await api.getSwipeSession(Number(sessionId));
        setStatus(fresh);
      }
    } catch {}
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

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (loadError || !status) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Algo salió mal</h2>
          <p className={styles.emptyText}>{loadError || "Sesión no encontrada"}</p>
          <Button onClick={() => navigate(`/groups/${groupId}`)}>Volver al grupo</Button>
        </div>
      </div>
    );
  }

  if (status.status === "completed") {
    return (
      <div className={styles.container}>
        <div className={styles.matchScreen}>
          <span className={styles.matchBadge}>¡Match!</span>
          <h2 className={styles.matchTitle}>{status.matchedRecipeName}</h2>
          <p className={styles.matchText}>
            Todo el grupo quiere cocinar esto. Ya generamos la lista de compras.
          </p>
          <Button onClick={() => navigate(`/shopping-lists/${status.shoppingListId}`)}>
            Ver lista de compras
          </Button>
          <button
            type="button"
            className={styles.backToGroupBtn}
            onClick={() => navigate(`/groups/${groupId}`)}
          >
            Volver al grupo
          </button>
        </div>
      </div>
    );
  }

  const participantsLabel = status.participants
    .map((p) => (p.userId === user?.id ? "Vos" : p.username))
    .join(", ");

  return (
    <div className={styles.container}>
      <div className={styles.participantsStrip}>{participantsLabel}</div>

      {deck.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.waitingSpinner} />
          <h2 className={styles.emptyTitle}>Ya viste todas las recetas</h2>
          <p className={styles.emptyText}>
            Esperando a que el resto del grupo termine de elegir…
          </p>
        </div>
      ) : (
        <>
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
              aria-label="Sí, me gusta"
              onClick={() => topCardHandleRef.current?.triggerSwipe("right")}
            >
              Me gusta
              <ArrowRightIcon width="20" height="20" fill="#fff" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
