import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MealPlan, RecipeListItem } from '@sasona/shared';
import { api } from '../api/client';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon, SearchIcon, CutleryIcon, ClockIcon, PeopleIcon } from '../components/ui/Icons';
import styles from './MealPlannerPage.module.css';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split('T')[0];
}

function addWeek(weekStart: string, weeks: number): string {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split('T')[0];
}

function formatDateRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
  return `${start.toLocaleDateString('es-AR', opts)} al ${end.toLocaleDateString('es-AR', opts)}`;
}

export default function MealPlannerPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [allRecipes, setAllRecipes] = useState<RecipeListItem[]>([]);
  const [showPicker, setShowPicker] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPlan = useCallback(async (ws: string) => {
    setLoading(true);
    try {
      const plans = await api.getMealPlans();
      let plan = plans.find(p => p.weekStart === ws);
      if (!plan) {
        plan = await api.createMealPlan(ws);
      }
      setMealPlan(plan);
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan(weekStart);
  }, [weekStart, fetchPlan]);

  useEffect(() => {
    api.getAllRecipes().then(setAllRecipes).catch(() => {});
  }, []);

  function prevWeek() {
    setWeekStart(prev => addWeek(prev, -1));
  }

  function nextWeek() {
    setWeekStart(prev => addWeek(prev, 1));
  }

  function isCurrentWeek(): boolean {
    return weekStart === getMonday(new Date());
  }

  function goToCurrentWeek() {
    setWeekStart(getMonday(new Date()));
  }

  async function handleSelectRecipe(dayOfWeek: number, recipeId: number) {
    if (!mealPlan) return;
    setSaving(true);
    setShowPicker(null);
    try {
      const existing = mealPlan.entries.filter(e => e.dayOfWeek !== dayOfWeek);
      const newEntry = { dayOfWeek, recipeId, mealType: 'lunch' };
      const updated = await api.updateMealPlanEntries(mealPlan.id, [...existing.map(e => ({ dayOfWeek: e.dayOfWeek, recipeId: e.recipeId, mealType: e.mealType })), newEntry]);
      setMealPlan(updated);
    } catch { } finally {
      setSaving(false);
    }
  }

  async function handleRemoveEntry(dayOfWeek: number) {
    if (!mealPlan) return;
    setSaving(true);
    try {
      const remaining = mealPlan.entries.filter(e => e.dayOfWeek !== dayOfWeek);
      const updated = await api.updateMealPlanEntries(mealPlan.id, remaining.map(e => ({ dayOfWeek: e.dayOfWeek, recipeId: e.recipeId, mealType: e.mealType })));
      setMealPlan(updated);
    } catch { } finally {
      setSaving(false);
    }
  }

  async function handleGenerateList() {
    if (!mealPlan || mealPlan.entries.length === 0) return;
    setGenerating(true);
    try {
      const result = await api.generateShoppingListFromMealPlan(mealPlan.id);
      navigate('/shopping-lists/' + result.id);
    } catch { } finally {
      setGenerating(false);
    }
  }

  const assignedEntries = new Map(mealPlan?.entries.map(e => [e.dayOfWeek, e]) || []);

  const filteredRecipes = allRecipes.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className={styles.center}><div className={styles.spinner} /></div>;
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
          <ArrowLeftIcon height="20" width="20" fill="var(--c-text-secondary)" />
        </button>
        <div className={styles.weekInfo}>
          <CalendarIcon height="18" width="18" fill="var(--c-primary)" />
          <span className={styles.weekLabel}>Semana del {formatDateRange(weekStart)}</span>
        </div>
        <button className={styles.weekBtn} onClick={nextWeek}>
          <ArrowRightIcon height="20" width="20" fill="var(--c-text-secondary)" />
        </button>
      </div>

      {!isCurrentWeek() && (
        <button className={styles.todayBtn} onClick={goToCurrentWeek}>
          Volver a esta semana
        </button>
      )}

      <div className={styles.daysGrid}>
        {DAYS.map((dayName, i) => {
          const entry = assignedEntries.get(i);
          const recipe = entry ? allRecipes.find(r => r.id === entry.recipeId) : null;

          return (
            <div key={i} className={styles.dayCard}>
              <span className={styles.dayName}>{dayName}</span>
              {entry && recipe ? (
                <div className={styles.recipePreview}>
                  <div className={styles.recipeImageWrap}>
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt={recipe.name} className={styles.recipeThumb} />
                    ) : (
                      <div className={styles.recipeThumbPlaceholder}>
                        <CutleryIcon height="20" width="20" fill="var(--c-text-tertiary)" />
                      </div>
                    )}
                  </div>
                  <span className={styles.recipeName}>{recipe.name}</span>
                  <div className={styles.dayActions}>
                    <button
                      className={styles.changeBtn}
                      onClick={(e) => { e.stopPropagation(); setShowPicker(i); }}
                    >
                      Cambiar
                    </button>
                    <button
                      className={styles.removeBtn}
                      onClick={(e) => { e.stopPropagation(); handleRemoveEntry(i); }}
                      title="Quitar receta"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <button className={styles.pickBtn} onClick={() => setShowPicker(i)}>
                  + Elegir receta
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <div className={styles.summary}>
          {mealPlan && mealPlan.entries.length > 0 ? (
            <span>{mealPlan.entries.length} receta{mealPlan.entries.length !== 1 ? 's' : ''} asignada{mealPlan.entries.length !== 1 ? 's' : ''}</span>
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
        <div className={styles.pickerOverlay} onClick={() => setShowPicker(null)}>
          <div className={styles.pickerModal} onClick={e => e.stopPropagation()}>
            <div className={styles.pickerHeader}>
              <h3>Elegir receta — {DAYS[showPicker]}</h3>
              <button className={styles.closeBtn} onClick={() => setShowPicker(null)}>✕</button>
            </div>
            <div className={styles.pickerSearch}>
              <SearchIcon height="18" width="18" fill="var(--c-text-tertiary)" />
              <input
                className={styles.searchInput}
                placeholder="Buscar receta..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.pickerList}>
              {filteredRecipes.length === 0 ? (
                <div className={styles.pickerEmpty}>
                  {search ? 'Sin resultados' : 'No hay recetas disponibles'}
                </div>
              ) : (
                filteredRecipes.map(recipe => {
                  const alreadyUsed = assignedEntries.has(showPicker)
                    ? assignedEntries.get(showPicker)!.recipeId === recipe.id
                    : false;
                  return (
                    <button
                      key={recipe.id}
                      className={`${styles.pickerItem} ${alreadyUsed ? styles.pickerItemActive : ''}`}
                      onClick={() => handleSelectRecipe(showPicker, recipe.id)}
                      disabled={saving}
                    >
                      <div className={styles.pickerItemImage}>
                        {recipe.imageUrl ? (
                          <img src={recipe.imageUrl} alt={recipe.name} />
                        ) : (
                          <CutleryIcon height="20" width="20" fill="var(--c-text-tertiary)" />
                        )}
                      </div>
                      <div className={styles.pickerItemInfo}>
                        <strong>{recipe.name}</strong>
                        <span className={styles.pickerItemMeta}>
                          <PeopleIcon height="14" width="14" fill="var(--c-text-tertiary)" /> {recipe.servings} · <ClockIcon height="14" width="14" fill="var(--c-text-tertiary)" /> {recipe.prepTime}min
                        </span>
                      </div>
                      {alreadyUsed && <span className={styles.pickerCheck}>✓</span>}
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
