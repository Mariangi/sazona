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
  ListToBuyIcon,
  PeopleIcon,
} from "../components/ui/Icons";

const CONFETTI_COLORS = [
  "#FF8240",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

export default function RandomDinnerPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [selected, setSelected] = useState<RecipeResponse | null>(null);
  const [slotText, setSlotText] = useState('...');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    api
      .getRecipes()
      .then(setRecipes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  function spin() {
    if (spinning || recipes.length === 0) return;
    setSpinning(true);
    setSelected(null);
    setShowResult(false);
    setShowConfetti(false);

    const names = recipes.map((r) => r.name);
    let speed = 50;
    let rounds = 0;
    const maxRounds = 15 + Math.floor(Math.random() * 10);

    function tick() {
      const randomIndex = Math.floor(Math.random() * names.length);
      setSlotText(names[randomIndex]);
      rounds++;
      if (rounds >= maxRounds) {
        const winner = recipes[Math.floor(Math.random() * recipes.length)];
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

  if (recipes.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          {/* <div className={styles.emptyVisual}></div> */}
          <h2 className={styles.emptyTitle}>No tenés recetas aún</h2>
          <p className={styles.emptyText}>
            Creá algunas recetas para usar el selector aleatorio
          </p>
          <Button onClick={() => navigate("/recipes/new")}>
            Crear primera receta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
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
