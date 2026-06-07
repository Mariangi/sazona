import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RecipeListItem } from "@sasona/shared";
import { api } from "../api/client";
import styles from "./DiscoverPage.module.css";
import { ClockIcon, CutleryIcon, PeopleIcon } from "../components/ui/Icons";

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getRecipes()
      .then(setRecipes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className={styles.container}>
        <h2 className={styles.pageTitle}>Descubrí nuevas recetas</h2>
        <div className={styles.masonry}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={styles.skeletonCard}
              style={{ height: `${180 + Math.random() * 120}px` }}
            />
          ))}
        </div>
      </div>
    );

  if (recipes.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.pageTitle}>Descubrí nuevas recetas</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>Descubrí nuevas recetas</h2>
      <div className={styles.masonry}>
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className={styles.card}
            onClick={() => navigate(`/recipes/${recipe.id}`)}
          >
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt={recipe.name}
                className={styles.cardImage}
              />
            ) : (
              <div className={styles.cardPlaceholder}><CutleryIcon height="12" width="12" /></div>
            )}
            <div className={styles.cardBody}>
              <h3 className={styles.cardName}>{recipe.name}</h3>
              <div className={styles.cardMeta}>
                <span>
                  <PeopleIcon
                    height="14"
                    width="14"
                    fill="var(--c-text-secondary)"
                  />{" "}
                  {recipe.servings}
                </span>
                <span>
                  <ClockIcon
                    height="14"
                    width="14"
                    fill="var(--c-text-secondary)"
                  />{" "}
                  {recipe.prepTime}min
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
