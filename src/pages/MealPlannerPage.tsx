import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { MealPlan, RecipeListItem } from "@sasona/shared";
import { CATEGORIES } from "@sasona/shared";
import { api } from "../api/client";
import Button from "../components/ui/Button";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  SearchIcon,
  CutleryIcon,
  ClockIcon,
  PeopleIcon,
  CloseIcon,
} from "../components/ui/Icons";
import styles from "./MealPlannerPage.module.css";

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const MEAL_TYPES = [
  { key: "breakfast", label: "Desayuno" },
  { key: "lunch", label: "Almuerzo" },
  { key: "snack", label: "Merienda" },
  { key: "dinner", label: "Cena" },
];

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split("T")[0];
}

function addWeek(weekStart: string, weeks: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split("T")[0];
}

function formatDateRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit" };
  return `${start.toLocaleDateString("es-AR", opts)} al ${end.toLocaleDateString("es-AR", opts)}`;
}

export default function MealPlannerPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [allRecipes, setAllRecipes] = useState<RecipeListItem[]>([]);
  const [showPicker, setShowPicker] = useState<{
    day: number;
    mealType: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPlan = useCallback(async (ws: string) => {
    setLoading(true);
    try {
      const plans = await api.getMealPlans();
      let plan = plans.find((p) => p.weekStart === ws);
      if (!plan) {
        plan = await api.createMealPlan(ws);
      }
      setMealPlan(plan);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan(weekStart);
  }, [weekStart, fetchPlan]);

  useEffect(() => {
    api
      .getAllRecipes()
      .then(setAllRecipes)
      .catch(() => {});
  }, []);

  function prevWeek() {
    setWeekStart((prev) => addWeek(prev, -1));
  }

  function nextWeek() {
    setWeekStart((prev) => addWeek(prev, 1));
  }

  function isCurrentWeek(): boolean {
    return weekStart === getMonday(new Date());
  }

  function goToCurrentWeek() {
    setWeekStart(getMonday(new Date()));
  }

  async function handleSelectRecipe(
    dayOfWeek: number,
    mealType: string,
    recipeId: number,
  ) {
    if (!mealPlan) return;
    setSaving(true);
    setShowPicker(null);
    setSearch("");
    setSelectedCategory("");
    try {
      const existing = mealPlan.entries.filter(
        (e) => !(e.dayOfWeek === dayOfWeek && e.mealType === mealType),
      );
      const newEntry = { dayOfWeek, recipeId, mealType };
      const updated = await api.updateMealPlanEntries(mealPlan.id, [
        ...existing.map((e) => ({
          dayOfWeek: e.dayOfWeek,
          recipeId: e.recipeId,
          mealType: e.mealType,
        })),
        newEntry,
      ]);
      setMealPlan(updated);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveEntry(dayOfWeek: number, mealType: string) {
    if (!mealPlan) return;
    setSaving(true);
    try {
      const remaining = mealPlan.entries.filter(
        (e) => !(e.dayOfWeek === dayOfWeek && e.mealType === mealType),
      );
      const updated = await api.updateMealPlanEntries(
        mealPlan.id,
        remaining.map((e) => ({
          dayOfWeek: e.dayOfWeek,
          recipeId: e.recipeId,
          mealType: e.mealType,
        })),
      );
      setMealPlan(updated);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateList() {
    if (!mealPlan || mealPlan.entries.length === 0) return;
    setGenerating(true);
    try {
      const result = await api.generateShoppingListFromMealPlan(mealPlan.id);
      navigate("/shopping-lists/" + result.id);
    } catch {
    } finally {
      setGenerating(false);
    }
  }

  const assignedEntries = new Map(
    mealPlan?.entries.map((e) => [`${e.dayOfWeek}-${e.mealType}`, e]) || [],
  );

  const filteredRecipes = allRecipes.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (selectedCategory && r.category !== selectedCategory) return false;
    return true;
  });

  const totalAssigned = mealPlan?.entries.length ?? 0;

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Menu semanal</h2>
          <p className={styles.subtitle}>Planificá tus comidas de la semana</p>
        </div>
      </div>

      <div className={styles.weekNav}>
        <button className={styles.weekBtn} onClick={prevWeek}>
          <ArrowLeftIcon
            height="20"
            width="20"
            fill="var(--c-text-secondary)"
          />
        </button>
        <div className={styles.weekInfo}>
          <CalendarIcon height="18" width="18" fill="var(--c-primary)" />
          <span className={styles.weekLabel}>
            Semana del {formatDateRange(weekStart)}
          </span>
        </div>
        <button className={styles.weekBtn} onClick={nextWeek}>
          <ArrowRightIcon
            height="20"
            width="20"
            fill="var(--c-text-secondary)"
          />
        </button>
      </div>

      {!isCurrentWeek() && (
        <button className={styles.todayBtn} onClick={goToCurrentWeek}>
          Volver a esta semana
        </button>
      )}

      <div className={styles.daysGrid}>
        {DAYS.map((dayName, i) => (
          <div key={i} className={styles.dayCard}>
            <span className={styles.dayName}>{dayName}</span>
            <div className={styles.mealSlots}>
              {MEAL_TYPES.map((mt) => {
                const entry = assignedEntries.get(`${i}-${mt.key}`);
                const recipe = entry
                  ? allRecipes.find((r) => r.id === entry.recipeId)
                  : null;
                return (
                  <div key={mt.key} className={styles.mealSlot}>
                    <span className={styles.mealTypeLabel}>{mt.label}</span>
                    {entry && recipe ? (
                      <div className={styles.mealSlotContent}>
                        <span className={styles.mealSlotRecipe}>
                          {recipe.name}
                        </span>
                        <div className={styles.mealSlotActions}>
                          <button
                            className={styles.slotChangeBtn}
                            onClick={() =>
                              setShowPicker({ day: i, mealType: mt.key })
                            }
                          >
                            Cambiar
                          </button>
                          <button
                            className={styles.slotRemoveBtn}
                            onClick={() => handleRemoveEntry(i, mt.key)}
                            title="Quitar receta"
                          >
                            <CloseIcon fill="var(--c-text-tertiary)" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className={styles.slotPickBtn}
                        onClick={() =>
                          setShowPicker({ day: i, mealType: mt.key })
                        }
                      >
                        + Elegir
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.summary}>
          {totalAssigned > 0 ? (
            <span>
              {totalAssigned} receta{totalAssigned !== 1 ? "s" : ""} asignada
              {totalAssigned !== 1 ? "s" : ""}
            </span>
          ) : (
            <span>Sin recetas asignadas</span>
          )}
        </div>
        <Button
          onClick={handleGenerateList}
          disabled={!mealPlan || mealPlan.entries.length === 0}
          isLoading={generating}
        >
          Generar lista de compras
        </Button>
      </div>

      {showPicker !== null && (
        <div
          className={styles.pickerOverlay}
          onClick={() => {
            setShowPicker(null);
            setSearch("");
            setSelectedCategory("");
          }}
        >
          <div
            className={styles.pickerModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.pickerHeader}>
              <h3>
                Elegir receta — {DAYS[showPicker.day]} (
                {MEAL_TYPES.find((mt) => mt.key === showPicker.mealType)?.label}
                )
              </h3>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  setShowPicker(null);
                  setSearch("");
                  setSelectedCategory("");
                }}
              >
                <CloseIcon fill="var(--c-text-tertiary)" />
              </button>
            </div>
            <div className={styles.pickerSearch}>
              <SearchIcon
                height="18"
                width="18"
                fill="var(--c-text-tertiary)"
              />
              <input
                className={styles.searchInput}
                placeholder="Buscar receta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.pickerCategories}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.categorySelect}
              >
                <option value="">Todas las categorías</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.pickerList}>
              {filteredRecipes.length === 0 ? (
                <div className={styles.pickerEmpty}>
                  {search ? "Sin resultados" : "No hay recetas disponibles"}
                </div>
              ) : (
                filteredRecipes.map((recipe) => {
                  const key = `${showPicker.day}-${showPicker.mealType}`;
                  const alreadyUsed = assignedEntries.has(key)
                    ? assignedEntries.get(key)!.recipeId === recipe.id
                    : false;
                  return (
                    <button
                      key={recipe.id}
                      className={`${styles.pickerItem} ${alreadyUsed ? styles.pickerItemActive : ""}`}
                      onClick={() =>
                        handleSelectRecipe(
                          showPicker.day,
                          showPicker.mealType,
                          recipe.id,
                        )
                      }
                      disabled={saving}
                    >
                      <div className={styles.pickerItemImage}>
                        {recipe.imageUrl ? (
                          <img src={recipe.imageUrl} alt={recipe.name} />
                        ) : (
                          <CutleryIcon
                            height="20"
                            width="20"
                            fill="var(--c-text-tertiary)"
                          />
                        )}
                      </div>
                      <div className={styles.pickerItemInfo}>
                        <strong>{recipe.name}</strong>
                        <span className={styles.pickerItemMeta}>
                          <PeopleIcon
                            height="14"
                            width="14"
                            fill="var(--c-text-tertiary)"
                          />{" "}
                          {recipe.servings} ·{" "}
                          <ClockIcon
                            height="14"
                            width="14"
                            fill="var(--c-text-tertiary)"
                          />{" "}
                          {recipe.prepTime}min
                        </span>
                      </div>
                      {alreadyUsed && (
                        <span className={styles.pickerCheck}>✓</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
