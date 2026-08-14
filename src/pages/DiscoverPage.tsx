import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { RecipeListItem } from "@sasona/shared";
import { CATEGORIES } from "@sasona/shared";
import { api } from "../api/client";
import styles from "./DiscoverPage.module.css";
import {
  ClockIcon,
  CloseIcon,
  CutleryIcon,
  PeopleIcon,
  SearchIcon,
} from "../components/ui/Icons";
import DifficultyIndicator from "../components/recipes/DifficultyIndicator";

type DiscoverRecipe = RecipeListItem & {
  author: { id: number; username: string; avatarUrl: string | null } | null;
};

const LIMIT = 12;

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skelImage} />
      <div className={styles.skelBody}>
        <div className={styles.skelLine} style={{ width: "70%" }} />
        <div className={styles.skelLine} style={{ width: "40%" }} />
        <div className={styles.skelMeta}>
          <div className={styles.skelLine} style={{ width: "30%" }} />
          <div className={styles.skelLine} style={{ width: "30%" }} />
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<DiscoverRecipe[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = recipes.length < total;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setRecipes([]);
    setPage(1);
    setTotal(0);
  };

  useEffect(() => {
    setRecipes([]);
    setPage(1);
    setTotal(0);
  }, [selectedCategory]);

  useEffect(() => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    api
      .getDiscoverRecipes(
        page,
        LIMIT,
        selectedCategory || undefined,
        searchQuery || undefined,
      )
      .then((data) => {
        if (page === 1) {
          setRecipes(data.recipes);
        } else {
          setRecipes((prev) => [...prev, ...data.recipes]);
        }
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [page, selectedCategory, searchQuery]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>Descubrí</h2>
      <p className={styles.subtitle}>Recetas de otros chefs</p>

      <div className={styles.searchBox}>
        <SearchIcon height="16" width="16" fill="var(--c-text-secondary)" />
        <input
          type="text"
          placeholder="Buscar recetas..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button
            className={styles.clearButton}
            onClick={() => handleSearchChange("")}
          >
            <CloseIcon fill="var(--c-text-tertiary)" />
          </button>
        )}
      </div>

      <div className={styles.categoryFilter}>
        <button
          className={`${styles.catBtn} ${selectedCategory === "" ? styles.catActive : ""}`}
          onClick={() => setSelectedCategory("")}
        >
          Todas
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.catBtn} ${selectedCategory === cat ? styles.catActive : ""}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.masonry}>
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyVisual}>
            <SearchIcon height="24" width="24" fill="var(--c-surface)" />{" "}
          </div>
          <p>
            No hay recetas{selectedCategory ? ` en "${selectedCategory}"` : ""}
            {searchQuery ? ` que coincidan con "${searchQuery}"` : ""} de otros
            chefs
          </p>
        </div>
      ) : (
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
                <div className={styles.cardPlaceholder}>
                  <CutleryIcon height="16" width="16" />
                </div>
              )}
              <div className={styles.cardBody}>
                <h3 className={styles.cardName}>{recipe.name}</h3>
                {recipe.category && (
                  <span className={styles.categoryBadge}>
                    {recipe.category}
                  </span>
                )}
                <div className={styles.cardMeta}>
                  <span>
                    <PeopleIcon
                      height="16"
                      width="16"
                      fill="var(--c-text-secondary)"
                    />{" "}
                    {recipe.servings}
                  </span>
                  <span>
                    <ClockIcon
                      height="16"
                      width="16"
                      fill="var(--c-text-secondary)"
                    />{" "}
                    {recipe.prepTime}min
                  </span>
                </div>
                {!!recipe.difficulty && (
                  <div className={styles.cardDifficulty}>
                    <DifficultyIndicator value={recipe.difficulty} size="10" />
                  </div>
                )}
                {recipe.author && (
                  <div className={styles.author}>
                    <span className={styles.authorAvatar}>
                      {recipe.author.avatarUrl ? (
                        <img
                          src={recipe.author.avatarUrl}
                          alt=""
                          className={styles.authorAvatarImg}
                        />
                      ) : (
                        recipe.author.username[0].toUpperCase()
                      )}
                    </span>
                    <span className={styles.authorName}>
                      {recipe.author.username}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loadingMore && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className={styles.sentinel} />}

      {!hasMore && recipes.length > 0 && (
        <p className={styles.endMessage}>Ya viste todas las recetas</p>
      )}
    </div>
  );
}
