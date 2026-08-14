import { forwardRef, useImperativeHandle } from "react";
import type { RecipeListItem, RecipeResponse } from "@sasona/shared";
import { useSwipeCard, type SwipeDirection } from "../../hooks/useSwipeCard";
import { ChevronUpIcon, ClockIcon, CutleryIcon, PeopleIcon } from "../ui/Icons";
import DifficultyIndicator from "./DifficultyIndicator";
import styles from "./RecipeSwipeCard.module.css";

export interface RecipeSwipeCardHandle {
  triggerSwipe: (direction: SwipeDirection) => void;
}

interface RecipeSwipeCardProps {
  recipe: RecipeListItem;
  fullDetails?: RecipeResponse;
  revealed: boolean;
  interactive: boolean;
  stackIndex: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
}

const RecipeSwipeCard = forwardRef<RecipeSwipeCardHandle, RecipeSwipeCardProps>(
  function RecipeSwipeCard(
    { recipe, fullDetails, revealed, interactive, stackIndex, onSwipeLeft, onSwipeRight, onSwipeUp },
    forwardedRef
  ) {
    const { ref, handlers, triggerSwipe } = useSwipeCard({
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onTap: onSwipeUp,
      disabled: !interactive,
    });

    useImperativeHandle(forwardedRef, () => ({ triggerSwipe }), [triggerSwipe]);

    const stackStyle =
      stackIndex > 0
        ? {
            transform: `scale(${1 - stackIndex * 0.045}) translateY(${stackIndex * 16}px)`,
            opacity: 1 - stackIndex * 0.12,
            zIndex: 10 - stackIndex,
          }
        : { zIndex: 10 };

    return (
      <div
        ref={ref}
        className={styles.card}
        style={stackStyle}
        {...(interactive ? handlers : {})}
      >
        <div className={styles.imageArea}>
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className={styles.image}
              draggable={false}
            />
          ) : (
            <div className={styles.placeholder}>
              <CutleryIcon width="48" height="48" fill="var(--c-primary)" />
            </div>
          )}
          <div className={styles.gradient} />
          <div className={styles.frontInfo}>
            <h3 className={styles.name}>{recipe.name}</h3>
            <div className={styles.meta}>
              <span>
                <PeopleIcon height="16" width="16" fill="#fff" /> {recipe.servings}
              </span>
              <span>
                <ClockIcon height="16" width="16" fill="#fff" /> {recipe.prepTime}min
              </span>
            </div>
            {!!recipe.difficulty && (
              <DifficultyIndicator value={recipe.difficulty} size="12" light />
            )}
          </div>
          {interactive && !revealed && (
            <button
              type="button"
              className={styles.revealHint}
              onClick={onSwipeUp}
              aria-label="Ver ingredientes y dificultad"
            >
              <ChevronUpIcon width="16" height="16" fill="#fff" />
              <span>Ingredientes</span>
            </button>
          )}
        </div>
        <div
          className={`${styles.revealPanel} ${revealed ? styles.revealPanelOpen : ""}`}
        >
          <button
            type="button"
            className={styles.closeReveal}
            onClick={onSwipeUp}
            aria-label="Cerrar detalles"
          >
            <ChevronUpIcon width="18" height="18" fill="var(--c-text-tertiary)" />
          </button>
          {!!recipe.difficulty && (
            <div className={styles.revealDifficulty}>
              <DifficultyIndicator value={recipe.difficulty} size="14" />
            </div>
          )}
          <h4 className={styles.revealTitle}>Ingredientes</h4>
          {fullDetails ? (
            <ul className={styles.ingredientList}>
              {fullDetails.ingredients.map((ing, i) => (
                <li key={i}>
                  {ing.name}
                  {ing.quantity ? ` — ${ing.quantity}${ing.unit ? ` ${ing.unit}` : ""}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <span className={styles.loadingHint}>Cargando ingredientes…</span>
          )}
        </div>
      </div>
    );
  }
);

export default RecipeSwipeCard;
