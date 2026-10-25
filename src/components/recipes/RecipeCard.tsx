import type { RecipeListItem } from "@sasona/shared";
import { useNavigate } from "react-router-dom";
import { resolveMediaUrl } from "../../api/client";
import styles from "./RecipeCard.module.css";
import { ClockIcon, CutleryIcon, PeopleIcon } from "../ui/Icons";
import DifficultyIndicator from "./DifficultyIndicator";

interface RecipeCardProps {
  recipe: RecipeListItem;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/recipes/${recipe.id}`)}
    >
      <div className={styles.imageWrapper}>
        {recipe.imageUrl ? (
          <img
            src={resolveMediaUrl(recipe.imageUrl)}
            alt={recipe.name}
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder}>
            <span><CutleryIcon/></span>
          </div>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{recipe.name}</h3>
        <div className={styles.meta}>
          <span>
            <PeopleIcon height="18" width="18" fill="var(--c-text-tertiary)" />{" "}
            {recipe.servings}
          </span>
          <span>
            <ClockIcon height="18" width="18" fill="var(--c-text-tertiary)" />{" "}
            {recipe.prepTime}min
          </span>
        </div>
        {!!recipe.difficulty && (
          <div className={styles.difficulty}>
            <DifficultyIndicator value={recipe.difficulty} size="10" />
          </div>
        )}
        <div className={styles.counts}>
          <span>{recipe.ingredientCount} ingredientes</span>
          <span>·</span>
          <span>{recipe.stepCount} pasos</span>
        </div>
      </div>
    </div>
  );
}
