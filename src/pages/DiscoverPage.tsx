import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { RecipeListItem } from "@sasona/shared";
import { CATEGORIES } from "@sasona/shared";
import { api, resolveMediaUrl, thumbSrc } from "../api/client";
import MasonryImage from "../components/recipes/MasonryImage";
import { useMasonryColumns } from "../hooks/useMasonryColumns";
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

// Escala de dificultad de las recetas (1 a 5).
const DIFFICULTIES = [
  { value: 1, label: "Muy fácil" },
  { value: 2, label: "Fácil" },
  { value: 3, label: "Media" },
  { value: 4, label: "Difícil" },
  { value: 5, label: "Muy difícil" },
];

// Alto de una tarjeta relativo a su ancho: la imagen más el bloque de texto.
const estimateCardHeight = (r: DiscoverRecipe) => {
  const image = !r.imageUrl ? 0.9 : r.imageWidth && r.imageHeight ? r.imageHeight / r.imageWidth : 1.25;
  return image + 0.9;
};

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
  const [searchParams] = useSearchParams();
  // El buscador del Inicio llega acá con ?q=...
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = recipes.length < total;
  const columns = useMasonryColumns(recipes, estimateCardHeight);

  // Cualquier cambio de filtro vuelve a la primera página.
  const resetResults = () => {
    setRecipes([]);
    setPage(1);
    setTotal(0);
    setLoading(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    resetResults();
  };

  const handleCategoryChange = (category: string) => {
    if (category === selectedCategory) return;
    setSelectedCategory(category);
    resetResults();
  };

  // Tocar la dificultad ya elegida la quita.
  const handleDifficultyChange = (value: number) => {
    setSelectedDifficulty((current) => (current === value ? 0 : value));
    resetResults();
  };

  useEffect(() => {
    // Descarta respuestas de filtros anteriores que lleguen tarde.
    let cancelled = false;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    api
      .getDiscoverRecipes(
        page,
        LIMIT,
        selectedCategory || undefined,
        searchQuery || undefined,
        selectedDifficulty || undefined,
      )
      .then((data) => {
        if (cancelled) return;
        if (page === 1) {
          setRecipes(data.recipes);
        } else {
          setRecipes((prev) => [...prev, ...data.recipes]);
        }
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      });
    return () => {
      cancelled = true;
      setLoadingMore(false);
    };
  }, [page, selectedCategory, searchQuery, selectedDifficulty]);

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
      <div className={styles.titleRow}>
        <h2 className={styles.pageTitle}>Descubrí</h2>
        <button
          className={styles.addBtn}
          onClick={() => navigate("/recipes/new")}
        >
          + Nueva receta
        </button>
      </div>

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
          onClick={() => handleCategoryChange("")}
        >
          Todas
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.catBtn} ${selectedCategory === cat ? styles.catActive : ""}`}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div
        className={styles.difficultyFilter}
        role="group"
        aria-label="Filtrar por dificultad"
      >
        <span className={styles.filterLabel}>Dificultad</span>
        {DIFFICULTIES.map(({ value, label }) => (
          <button
            key={value}
            className={`${styles.diffBtn} ${selectedDifficulty === value ? styles.catActive : ""}`}
            onClick={() => handleDifficultyChange(value)}
            aria-pressed={selectedDifficulty === value}
            aria-label={`${value} de 5: ${label}`}
            title={label}
          >
            {value}
          </button>
        ))}
        {selectedDifficulty > 0 && (
          <span className={styles.diffName}>
            {DIFFICULTIES[selectedDifficulty - 1].label}
          </span>
        )}
      </div>

      {loading ? (
        <div className={styles.masonry}>
          {columns.map((_, col) => (
            <div key={col} className={styles.column}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyVisual}>
            <SearchIcon height="24" width="24" fill="var(--c-surface)" />{" "}
          </div>
          <p>
            No hay recetas{selectedCategory ? ` en "${selectedCategory}"` : ""}
            {selectedDifficulty
              ? ` de dificultad ${DIFFICULTIES[selectedDifficulty - 1].label.toLowerCase()}`
              : ""}
            {searchQuery ? ` que coincidan con "${searchQuery}"` : ""}
          </p>
        </div>
      ) : (
        <div className={styles.masonry}>
          {columns.map((column, col) => (
            <div key={col} className={styles.column}>
              {column.map((recipe) => (
                <div
                  key={recipe.id}
                  className={styles.card}
                  onClick={() => navigate(`/recipes/${recipe.id}`)}
                >
                  {recipe.imageUrl ? (
                    <MasonryImage
                      src={thumbSrc(recipe)}
                      alt={recipe.name}
                      width={recipe.imageWidth}
                      height={recipe.imageHeight}
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
                              src={resolveMediaUrl(recipe.author.avatarUrl)}
                              alt=""
                              loading="lazy"
                              decoding="async"
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
              {loadingMore && <SkeletonCard />}
            </div>
          ))}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className={styles.sentinel} />}

      {!hasMore && recipes.length > 0 && (
        <p className={styles.endMessage}>Ya viste todas las recetas</p>
      )}
    </div>
  );
}
