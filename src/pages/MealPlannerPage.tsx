import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { MealPlan, MealPlanEntry } from "@sasona/shared";
import { api, resolveMediaUrl } from "../api/client";
import { NavCart, NavChevron, NavCutlery, NavDice, NavMore, NavPlus } from "../components/ui/NavIcons";
import RecipePickerSheet, { type PickRecipe, type PickSources } from "../components/meal-planner/RecipePickerSheet";
import styles from "./MealPlannerPage.module.css";

type View = "day" | "week" | "month";

const VIEWS: { key: View; label: string }[] = [
  { key: "day", label: "Día" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
];

const MEALS = [
  { key: "breakfast", label: "Desayuno" },
  { key: "lunch", label: "Almuerzo" },
  { key: "snack", label: "Merienda" },
  { key: "dinner", label: "Cena" },
] as const;

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Categorías que encajan con cada comida, para "Completar al azar".
const MEAL_CATEGORIES: Record<string, string[]> = {
  breakfast: ["Desayuno", "Bebida"],
  snack: ["Snack", "Postre", "Bebida", "Desayuno"],
  lunch: ["Plato principal", "Ensalada", "Sopa", "Entrada", "Vegano", "Sin TACC"],
  dinner: ["Plato principal", "Ensalada", "Sopa", "Entrada", "Vegano", "Sin TACC"],
};

// --- Fechas (siempre en hora local) ---
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function dayIndex(d: Date): number {
  return (d.getDay() + 6) % 7; // 0 = lunes
}
function mondayOf(d: Date): Date {
  return addDays(startOfDay(d), -dayIndex(d));
}
function isoKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function longDate(d: Date): string {
  return `${DAY_NAMES[dayIndex(d)]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}
function weekRange(monday: Date): string {
  const end = addDays(monday, 6);
  if (monday.getMonth() === end.getMonth()) return `${monday.getDate()} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`;
  return `${monday.getDate()} ${MONTHS_SHORT[monday.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`;
}

type EntryInput = { dayOfWeek: number; mealType: string; recipeId: number };
const toInput = (e: MealPlanEntry): EntryInput => ({ dayOfWeek: e.dayOfWeek, mealType: e.mealType, recipeId: e.recipeId });

function readView(): View {
  const v = localStorage.getItem("planView");
  return v === "day" || v === "week" || v === "month" ? v : "week";
}

export default function MealPlannerPage() {
  const navigate = useNavigate();
  const today = startOfDay(new Date());
  const [view, setViewState] = useState<View>(readView);
  const [date, setDate] = useState<Date>(today);
  const [plans, setPlans] = useState<MealPlan[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState<{ date: Date; mealType: string } | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ weekStart: string; entries: EntryInput[]; count: number } | null>(null);
  const [sources, setSources] = useState<PickSources>({ saved: null, mine: null, all: null });

  function setView(v: View) {
    setViewState(v);
    localStorage.setItem("planView", v);
    setMenu(null);
  }

  useEffect(() => {
    api.getMealPlans().then(setPlans).catch(() => {
      setPlans([]);
      setError("No se pudo cargar tu menú");
    });
    const toPick = (r: { id: number; name: string; imageUrl: string | null; prepTime: number; servings: number; category: string | null }): PickRecipe =>
      ({ id: r.id, name: r.name, imageUrl: r.imageUrl, prepTime: r.prepTime, servings: r.servings, category: r.category });
    api.getSavedRecipes()
      .then((list) => setSources((s) => ({ ...s, saved: list.map((r) => toPick({ ...r, id: r.recipeId })) })))
      .catch(() => setSources((s) => ({ ...s, saved: [] })));
    api.getRecipes()
      .then((list) => setSources((s) => ({ ...s, mine: list.map(toPick) })))
      .catch(() => setSources((s) => ({ ...s, mine: [] })));
    api.getAllRecipes()
      .then((list) => setSources((s) => ({ ...s, all: list.map(toPick) })))
      .catch(() => setSources((s) => ({ ...s, all: [] })));
  }, []);

  // Cerrar el menú de opciones al tocar afuera.
  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest("[data-meal-menu]")) setMenu(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);

  // El aviso de "Deshacer" desaparece solo.
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(t);
  }, [undo]);

  const plansByWeek = useMemo(() => {
    const map = new Map<string, MealPlan>();
    for (const p of plans ?? []) if (!map.has(p.weekStart)) map.set(p.weekStart, p);
    return map;
  }, [plans]);

  const entriesOn = useCallback(
    (d: Date): MealPlanEntry[] => {
      const plan = plansByWeek.get(isoKey(mondayOf(d)));
      return plan ? plan.entries.filter((e) => e.dayOfWeek === dayIndex(d)) : [];
    },
    [plansByWeek],
  );

  const monday = mondayOf(date);
  const weekKey = isoKey(monday);
  const weekPlan = plansByWeek.get(weekKey);
  const weekEntries = weekPlan?.entries ?? [];
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  async function saveWeek(weekStart: string, entries: EntryInput[]): Promise<boolean> {
    setSaving(true);
    setError("");
    try {
      let plan = plansByWeek.get(weekStart);
      if (!plan) plan = await api.createMealPlan(weekStart);
      const updated = await api.updateMealPlanEntries(plan.id, entries);
      setPlans((prev) => [...(prev ?? []).filter((p) => p.id !== updated.id), updated]);
      return true;
    } catch {
      setError("No se pudo guardar el cambio. Probá de nuevo.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function othersInWeek(d: Date, mealType: string): EntryInput[] {
    const plan = plansByWeek.get(isoKey(mondayOf(d)));
    return (plan?.entries ?? [])
      .filter((e) => !(e.dayOfWeek === dayIndex(d) && e.mealType === mealType))
      .map(toInput);
  }

  async function assign(d: Date, mealType: string, recipeId: number) {
    setUndo(null); // un cambio a mano invalida el "Deshacer" del completado al azar
    const ok = await saveWeek(isoKey(mondayOf(d)), [...othersInWeek(d, mealType), { dayOfWeek: dayIndex(d), mealType, recipeId }]);
    if (ok) setPicker(null);
  }

  async function remove(d: Date, mealType: string) {
    setMenu(null);
    setUndo(null);
    await saveWeek(isoKey(mondayOf(d)), othersInWeek(d, mealType));
  }

  async function fillWeekRandom() {
    const pool = sources.saved && sources.saved.length > 0 ? sources.saved : sources.all ?? [];
    if (pool.length === 0) {
      setError("Guardá o creá algunas recetas para completar al azar.");
      return;
    }
    const used = new Set(weekEntries.map((e) => e.recipeId));
    const filled = new Set(weekEntries.map((e) => `${e.dayOfWeek}-${e.mealType}`));
    const added: EntryInput[] = [];
    for (let day = 0; day < 7; day++) {
      for (const m of MEALS) {
        if (filled.has(`${day}-${m.key}`)) continue;
        const fits = pool.filter((r) => r.category && MEAL_CATEGORIES[m.key].includes(r.category));
        const base = fits.length > 0 ? fits : pool;
        const fresh = base.filter((r) => !used.has(r.id));
        const from = fresh.length > 0 ? fresh : base;
        const pick = from[Math.floor(Math.random() * from.length)];
        used.add(pick.id);
        added.push({ dayOfWeek: day, mealType: m.key, recipeId: pick.id });
      }
    }
    if (added.length === 0) return;
    const before = weekEntries.map(toInput);
    const ok = await saveWeek(weekKey, [...before, ...added]);
    if (ok) setUndo({ weekStart: weekKey, entries: before, count: added.length });
  }

  async function undoFill() {
    if (!undo) return;
    const { weekStart, entries } = undo;
    setUndo(null);
    await saveWeek(weekStart, entries);
  }

  async function generateList() {
    if (!weekPlan || weekPlan.entries.length === 0) return;
    setGenerating(true);
    try {
      const result = await api.generateShoppingListFromMealPlan(weekPlan.id);
      navigate("/shopping-lists/" + result.id);
    } catch {
      setError("No se pudo generar la lista de compras.");
    } finally {
      setGenerating(false);
    }
  }

  function move(dir: -1 | 1) {
    setMenu(null);
    if (view === "month") {
      const target = new Date(date.getFullYear(), date.getMonth() + dir, 1);
      setDate(target.getMonth() === today.getMonth() && target.getFullYear() === today.getFullYear() ? today : target);
    } else {
      setDate(addDays(date, dir * 7));
    }
  }

  function openPicker(d: Date, mealType: string) {
    setMenu(null);
    setPicker({ date: d, mealType });
  }

  const navLabel =
    view === "month" ? `${MONTHS[date.getMonth()][0].toUpperCase()}${MONTHS[date.getMonth()].slice(1)} ${date.getFullYear()}` : weekRange(monday);
  const unit = view === "month" ? "Mes" : "Semana";
  const isOnToday = view === "month" ? date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear() : sameDay(date, today) || (view === "week" && isoKey(monday) === isoKey(mondayOf(today)));

  // Recetas que ya están en la semana del selector (para repetirlas rápido).
  const pickerWeekRecipes = useMemo(() => {
    if (!picker) return [];
    const plan = plansByWeek.get(isoKey(mondayOf(picker.date)));
    const seen = new Map<number, string>();
    for (const e of plan?.entries ?? []) if (!seen.has(e.recipeId)) seen.set(e.recipeId, e.recipeName);
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [picker, plansByWeek]);

  if (plans === null) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const pickerMeal = picker ? MEALS.find((m) => m.key === picker.mealType)! : null;
  const pickerCurrent = picker ? entriesOn(picker.date).find((e) => e.mealType === picker.mealType) : undefined;

  return (
    <div className={styles.container}>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Menú</h1>
        <p className={styles.pageSub}>Planificá tus comidas por día, semana o mes</p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.views} role="group" aria-label="Vista">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              aria-pressed={view === v.key}
              className={`${styles.viewBtn} ${view === v.key ? styles.viewActive : ""}`}
              onClick={() => setView(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className={styles.dateNav}>
          <button type="button" className={styles.arrow} onClick={() => move(-1)} aria-label={`${unit} anterior`}>
            <NavChevron size={22} className={styles.flip} />
          </button>
          <span className={styles.dateLabel} aria-live="polite">{navLabel}</span>
          <button type="button" className={styles.arrow} onClick={() => move(1)} aria-label={`${unit} siguiente`}>
            <NavChevron size={22} />
          </button>
        </div>
        <button type="button" className={styles.todayBtn} onClick={() => { setDate(today); setMenu(null); }} disabled={isOnToday}>
          Hoy
        </button>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {view === "day" && (
        <>
          <div className={styles.strip}>
            {weekDays.map((d, i) => {
              const n = entriesOn(d).length;
              const selected = sameDay(d, date);
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.stripDay} ${selected ? styles.stripSelected : ""} ${sameDay(d, today) ? styles.stripToday : ""}`}
                  aria-pressed={selected}
                  aria-label={`${longDate(d)}, ${n} de 4 comidas`}
                  onClick={() => setDate(d)}
                >
                  <span className={styles.stripName}>{DAY_SHORT[i]}</span>
                  <span className={styles.stripNum}>{d.getDate()}</span>
                  <Dots n={n} />
                </button>
              );
            })}
          </div>

          <div className={styles.dayHead}>
            <h2 className={styles.dayTitle}>
              {longDate(date)}
              {sameDay(date, today) && <span className={styles.todayBadge}>Hoy</span>}
            </h2>
            <span className={styles.muted}>{entriesOn(date).length} de 4</span>
          </div>

          <div className={styles.meals}>
            {MEALS.map((m) => {
              const entry = entriesOn(date).find((e) => e.mealType === m.key);
              const menuKey = `${isoKey(date)}-${m.key}`;
              if (!entry) {
                return (
                  <button key={m.key} type="button" className={styles.mealEmpty} onClick={() => openPicker(date, m.key)}>
                    <span className={styles.mealPlus} aria-hidden="true"><NavPlus size={26} /></span>
                    <span className={styles.mealText}>
                      <span className={styles.mealKicker}>{m.label}</span>
                      <strong>Elegir {m.label.toLowerCase()}</strong>
                      <span className={styles.muted}>Buscá o dejá que la suerte elija</span>
                    </span>
                  </button>
                );
              }
              return (
                <article key={m.key} className={styles.meal}>
                  <Link to={`/recipes/${entry.recipeId}`} className={styles.mealLink}>
                    <span className={styles.mealThumb} aria-hidden="true">
                      {entry.recipeImage ? <img src={resolveMediaUrl(entry.recipeImage)} alt="" /> : <NavCutlery size={26} />}
                    </span>
                    <span className={styles.mealText}>
                      <span className={styles.mealKicker}>{m.label}</span>
                      <strong className={styles.mealName}>{entry.recipeName}</strong>
                      <span className={styles.muted}>Ver receta</span>
                    </span>
                  </Link>
                  <MealMenu
                    open={menu === menuKey}
                    label={`Opciones de ${m.label.toLowerCase()}`}
                    onToggle={() => setMenu(menu === menuKey ? null : menuKey)}
                    onChange={() => openPicker(date, m.key)}
                    onRemove={() => remove(date, m.key)}
                    disabled={saving}
                  />
                </article>
              );
            })}
          </div>

          <ShoppingButton disabled={weekEntries.length === 0} loading={generating} onClick={generateList} />
        </>
      )}

      {view === "week" && (
        <>
          <section className={styles.summary} aria-label="Resumen de la semana">
            <div className={styles.summaryTop}>
              <strong className={styles.summaryCount}>{weekEntries.length} de 28 comidas</strong>
              <span className={styles.summaryHint}>{missingDays(weekDays, entriesOn)}</span>
            </div>
            <span
              className={styles.bar}
              role="progressbar"
              aria-label="Comidas planificadas"
              aria-valuemin={0}
              aria-valuemax={28}
              aria-valuenow={weekEntries.length}
            >
              <span style={{ width: `${Math.round((weekEntries.length / 28) * 100)}%` }} />
            </span>
            <div className={styles.summaryActions}>
              <button type="button" className={styles.summaryPrimary} onClick={generateList} disabled={weekEntries.length === 0 || generating}>
                <NavCart size={18} />
                {generating ? "Generando…" : "Lista de compras"}
              </button>
              <button type="button" className={styles.summaryGhost} onClick={fillWeekRandom} disabled={saving || weekEntries.length >= 28}>
                <NavDice size={18} />
                Completar al azar
              </button>
            </div>
          </section>

          <div className={styles.weekGrid}>
            {weekDays.map((d, i) => {
              const entries = entriesOn(d);
              const isToday = sameDay(d, today);
              return (
                <article key={i} className={`${styles.dayCard} ${isToday ? styles.dayCardToday : ""}`}>
                  <button type="button" className={styles.dayCardHead} onClick={() => { setDate(d); setView("day"); }}>
                    <strong className={styles.dayCardName}>{DAY_NAMES[i]}</strong>
                    <span className={styles.muted}>{d.getDate()}</span>
                    {isToday && <span className={styles.todayBadge}>Hoy</span>}
                    <span className={styles.dayCardCount}>{entries.length}/4</span>
                    <NavChevron size={18} className={styles.mutedIcon} />
                  </button>
                  {MEALS.filter((m) => entries.some((e) => e.mealType === m.key)).map((m) => {
                    const e = entries.find((x) => x.mealType === m.key)!;
                    return (
                      <button key={m.key} type="button" className={styles.line} onClick={() => openPicker(d, m.key)} aria-label={`${m.label}: ${e.recipeName}. Cambiar`}>
                        <span className={styles.lineLabel}>{m.label}</span>
                        <span className={styles.lineName}>{e.recipeName}</span>
                      </button>
                    );
                  })}
                  {entries.length < 4 && (
                    <div className={styles.addRow}>
                      {MEALS.filter((m) => !entries.some((e) => e.mealType === m.key)).map((m) => (
                        <button key={m.key} type="button" className={styles.addChip} onClick={() => openPicker(d, m.key)} aria-label={`Agregar ${m.label.toLowerCase()} el ${DAY_NAMES[i].toLowerCase()} ${d.getDate()}`}>
                          + {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {view === "month" && (
        <MonthView
          date={date}
          today={today}
          entriesOn={entriesOn}
          onSelect={(d) => setDate(d)}
          onOpenDay={() => setView("day")}
        />
      )}

      {undo && (
        <div className={styles.toast} role="status">
          <span>Se completaron {undo.count} comidas</span>
          <button type="button" onClick={undoFill} disabled={saving}>Deshacer</button>
        </div>
      )}

      {picker && pickerMeal && (
        <RecipePickerSheet
          title={`Elegí ${pickerMeal.key === "breakfast" || pickerMeal.key === "lunch" ? "el" : "la"} ${pickerMeal.label.toLowerCase()}`}
          subtitle={longDate(picker.date)}
          mealLabel={pickerMeal.label.toLowerCase()}
          sources={sources}
          weekRecipes={pickerWeekRecipes}
          currentRecipeId={pickerCurrent?.recipeId ?? null}
          saving={saving}
          onPick={(id) => assign(picker.date, picker.mealType, id)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

function missingDays(days: Date[], entriesOn: (d: Date) => MealPlanEntry[]): string {
  const empty = days.map((d, i) => (entriesOn(d).length === 0 ? DAY_SHORT[i].toLowerCase() : null)).filter(Boolean) as string[];
  if (empty.length === 0) return "Todos los días tienen algo";
  if (empty.length === 7) return "Semana sin planificar";
  if (empty.length <= 3) return `Sin nada: ${empty.join(", ")}`;
  return `${empty.length} días sin nada`;
}

function Dots({ n }: { n: number }) {
  return (
    <span className={styles.dots} aria-hidden="true">
      {[0, 1, 2, 3].map((k) => (
        <span key={k} className={k < n ? styles.dotOn : styles.dotOff} />
      ))}
    </span>
  );
}

function ShoppingButton({ disabled, loading, onClick }: { disabled: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button type="button" className={styles.shopping} onClick={onClick} disabled={disabled || loading}>
      <NavCart size={20} />
      {loading ? "Generando lista…" : "Lista de compras de la semana"}
    </button>
  );
}

function MealMenu({
  open, label, onToggle, onChange, onRemove, disabled,
}: { open: boolean; label: string; onToggle: () => void; onChange: () => void; onRemove: () => void; disabled: boolean }) {
  return (
    <div className={styles.menuWrap} data-meal-menu>
      <button type="button" className={styles.moreBtn} aria-label={label} aria-expanded={open} onClick={onToggle}>
        <NavMore size={20} />
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <button type="button" role="menuitem" onClick={onChange}>Cambiar receta</button>
          <button type="button" role="menuitem" className={styles.menuDanger} onClick={onRemove} disabled={disabled}>Quitar</button>
        </div>
      )}
    </div>
  );
}

function MonthView({
  date, today, entriesOn, onSelect, onOpenDay,
}: {
  date: Date;
  today: Date;
  entriesOn: (d: Date) => MealPlanEntry[];
  onSelect: (d: Date) => void;
  onOpenDay: () => void;
}) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const gridStart = mondayOf(first);
  const weeks = Math.ceil((dayIndex(first) + daysInMonth) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));

  let planned = 0;
  const counts = new Map<string, number>();
  for (let i = 1; i <= daysInMonth; i++) {
    for (const e of entriesOn(new Date(date.getFullYear(), date.getMonth(), i))) {
      planned++;
      counts.set(e.recipeName, (counts.get(e.recipeName) ?? 0) + 1);
    }
  }
  const top = [...counts].sort((a, b) => b[1] - a[1])[0];
  const pct = Math.round((planned / (daysInMonth * 4)) * 100);
  const selected = entriesOn(date);

  return (
    <div className={styles.monthLayout}>
      <div className={styles.calendar}>
        <div className={styles.calHead} aria-hidden="true">
          {["L", "M", "M", "J", "V", "S", "D"].map((h, i) => (
            <span key={i}>{h}</span>
          ))}
        </div>
        <div className={styles.calGrid}>
          {cells.map((d) => {
            const inMonth = d.getMonth() === date.getMonth();
            const entries = entriesOn(d);
            const n = entries.length;
            const sel = sameDay(d, date);
            const cls = [
              styles.cell,
              !inMonth && styles.cellOut,
              n === 4 && styles.cellFull,
              sel && styles.cellSelected,
              sameDay(d, today) && styles.cellToday,
            ].filter(Boolean).join(" ");
            return (
              <button
                key={isoKey(d)}
                type="button"
                className={cls}
                aria-pressed={sel}
                aria-label={`${longDate(d)}, ${n} de 4 comidas`}
                onClick={() => onSelect(d)}
              >
                <span className={styles.cellNum}>{d.getDate()}</span>
                <Dots n={n} />
                <span className={styles.cellNames} aria-hidden="true">
                  {MEALS.map((m) => entries.find((e) => e.mealType === m.key))
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((e) => (
                      <span key={e!.mealType}>{e!.recipeName}</span>
                    ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className={styles.legend}>
          <span className={styles.legendDots}><span className={styles.dotOn} />Comida planificada</span>
          <span><span className={styles.legendFull} />Día completo</span>
        </div>
      </div>

      <div className={styles.monthSide}>
        <section className={styles.selDay} aria-labelledby="sel-day-title">
          <div className={styles.selHead}>
            <h2 id="sel-day-title" className={styles.selTitle}>
              {DAY_NAMES[dayIndex(date)]} {date.getDate()}
              {sameDay(date, today) && " · Hoy"}
            </h2>
            <button type="button" className={styles.selLink} onClick={onOpenDay}>Ver día</button>
          </div>
          {MEALS.map((m) => {
            const e = selected.find((x) => x.mealType === m.key);
            return (
              <div key={m.key} className={styles.selLine}>
                <span className={styles.lineLabel}>{m.label}</span>
                <span className={e ? styles.lineName : styles.lineEmpty}>{e ? e.recipeName : "Sin planificar"}</span>
              </div>
            );
          })}
        </section>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <strong>{pct}%</strong>
            <span>del mes planificado</span>
          </div>
          <div className={styles.stat}>
            {top && top[1] > 1 ? (
              <>
                <strong className={styles.statName}>{top[0]}</strong>
                <span>la más repetida ({top[1]} veces)</span>
              </>
            ) : (
              <>
                <strong>{planned}</strong>
                <span>{planned === 1 ? "comida en el mes" : "comidas en el mes"}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
