import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { RecipeListItem, RecipeResponse } from "@sasona/shared";
import { api } from "../api/client";
import Button from "../components/ui/Button";
import styles from "./RandomDinnerPage.module.css";
import {
  ClockIcon,
  CutleryIcon,
  DiceIcon,
  PeopleIcon,
} from "../components/ui/Icons";

const CONFETTI_COLORS = [
  "#FF8240",
  "#f59e0b",
  "#FCA838",
  "#F36A46",
  "#FF8240",
];

export default function RandomDinnerPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'all' | 'favorites'>('all');
  const [spinning, setSpinning] = useState(false);
  const [selected, setSelected] = useState<RecipeResponse | null>(null);
  const [slotText, setSlotText] = useState('...');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const activeRecipes = mode === 'favorites' ? savedRecipes : recipes;

  useEffect(() => {
    Promise.all([
      api.getRecipes(),
      api.getSavedRecipes(),
    ])
      .then(([allRecipes, saved]) => {
        setRecipes(allRecipes);
        setSavedRecipes(
          saved.map((r) => ({
            id: r.recipeId,
            name: r.name,
            imageUrl: r.imageUrl,
            servings: r.servings,
            prepTime: r.prepTime,
            ingredientCount: r.ingredientCount,
            stepCount: r.stepCount,
            createdAt: r.savedAt,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  function spin() {
    if (spinning || activeRecipes.length === 0) return;
    setSpinning(true);
    setSelected(null);
    setShowResult(false);
    setShowConfetti(false);

    const names = activeRecipes.map((r) => r.name);
    let speed = 50;
    let rounds = 0;
    const maxRounds = 15 + Math.floor(Math.random() * 10);

    function tick() {
      const randomIndex = Math.floor(Math.random() * names.length);
      setSlotText(names[randomIndex]);
      rounds++;
      if (rounds >= maxRounds) {
        const winner = activeRecipes[Math.floor(Math.random() * activeRecipes.length)];
        setSlotText(winner.name);
        setSpinning(false);
        setFetchingDetails(true);
        api
          .getRecipeById(winner.id)
          .then((full) => {
            setSelected(full);
            setFetchingDetails(false);
            setTimeout(() => {
              generateConfetti();
              setShowResult(true);
            }, 200);
          })
          .catch(() => setFetchingDetails(false));
        return;
      }
      if (rounds > maxRounds - 5) speed += 40;
      else if (rounds > maxRounds - 10) speed += 20;
      setTimeout(tick, speed);
    }
    tick();
  }

  function reset() {
    setSelected(null);
    setShowResult(false);
    setShowConfetti(false);
    setSlotText('...');
  }

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const showEmpty = mode === 'favorites'
    ? savedRecipes.length === 0
    : recipes.length === 0;

  if (showEmpty) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>
            {mode === 'favorites'
              ? 'No tenés recetas favoritas'
              : 'No tenés recetas aún'}
          </h2>
          <p className={styles.emptyText}>
            {mode === 'favorites'
              ? 'Guardá algunas recetas como favoritas para usar el selector'
              : 'Creá algunas recetas para usar el selector aleatorio'}
          </p>
          <Button
            onClick={() =>
              navigate(mode === 'favorites' ? '/recipes' : '/recipes/new')
            }
          >
            {mode === 'favorites' ? 'Ver recetas' : 'Crear primera receta'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${mode === 'all' ? styles.modeActive : ''}`}
          onClick={() => { setMode('all'); reset(); }}
        >
          Todas las recetas
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'favorites' ? styles.modeActive : ''}`}
          onClick={() => { setMode('favorites'); reset(); }}
        >
          Favoritas
        </button>
      </div>
      <div className={styles.machine}>
        <div className={styles.slotWindow}>
          <span
            className={`${styles.slotText} ${spinning ? styles.spinning : ""}`}
          >
            {fetchingDetails ? "Obteniendo receta..." : slotText}
          </span>
        </div>
        {!selected && (
          <button
            className={`${styles.spinBtn} ${spinning ? styles.disabled : ""}`}
            onClick={spin}
            disabled={spinning}
          >
            <DiceIcon fill="var(--c-surface)" /> Sorprendeme
          </button>
        )}
      </div>

      {showResult && selected && (
        <div className={`${styles.result} ${showResult ? styles.visible : ""}`}>
          <div className={styles.resultCard}>
            <div className={styles.resultImage}>
              {selected.imageUrl ? (
                <img src={selected.imageUrl} alt={selected.name} />
              ) : (
                <div className={styles.resultPlaceholder}>
                  <CutleryIcon />
                </div>
              )}
            </div>
            <div className={styles.resultBody}>
              <h2 className={styles.resultName}>{selected.name}</h2>
              <div className={styles.resultMeta}>
                <span>
                  <PeopleIcon
                    height="18"
                    width="18"
                    fill="var(--c-text-tertiary)"
                  />{" "}
                  {selected.servings} comensales
                </span>
                <span>
                  <ClockIcon
                    height="18"
                    width="18"
                    fill="var(--c-text-tertiary)"
                  />{" "}
                  {selected.prepTime} min
                </span>
              </div>
              <div className={styles.resultSection}>
                <h3>Ingredientes</h3>
                <ul className={styles.resultList}>
                  {selected.ingredients.map((ing, i) => (
                    <li key={i}>
                      {ing.name}
                      {ing.quantity
                        ? ` — ${ing.quantity}${ing.unit ? ` ${ing.unit}` : ""}`
                        : ""}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.resultSection}>
                <h3>Pasos</h3>
                <ol className={styles.resultList}>
                  {selected.steps.map((step, i) => (
                    <li key={i}>{step.description}</li>
                  ))}
                </ol>
              </div>
            </div>
            <div className={styles.resultActions}>
              <Button onClick={reset}>
                <DiceIcon fill="var(--c-surface)" /> Otra vez
              </Button>
              <Button variant="secondary" onClick={() => navigate("/recipes")}>
                Ver todas
              </Button>
            </div>
          </div>
        </div>
      )}

      {showConfetti && (
        <div className={styles.confettiContainer}>
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className={styles.confetti}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.8}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                backgroundColor:
                  CONFETTI_COLORS[
                    Math.floor(Math.random() * CONFETTI_COLORS.length)
                  ],
                width: `${6 + Math.random() * 6}px`,
                height: `${6 + Math.random() * 6}px`,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
