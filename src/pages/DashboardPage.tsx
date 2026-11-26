import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { MealPlanEntry, NutritionLogEntry, ShoppingList } from "@sasona/shared";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";
import {
  NavCalendar,
  NavCart,
  NavChevron,
  NavDice,
  NavFridge,
  NavHeart,
  NavLeaf,
  NavSearch,
  NavUsers,
} from "../components/ui/NavIcons";
import styles from "./DashboardPage.module.css";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  snack: "Merienda",
  dinner: "Cena",
};
const MEAL_ORDER = ["breakfast", "lunch", "snack", "dinner"];

function mondayOf(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split("T")[0];
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

const modes: { to: string; title: string; desc: string; icon: ReactNode; featured?: boolean }[] = [
  { to: "/random-dinner", title: "Sorpresa", desc: "Que elija la suerte", icon: <NavDice size={28} />, featured: true },
  { to: "/swipe", title: "Antojo", desc: "Deslizá y elegí", icon: <NavHeart size={28} /> },
  { to: "/fridge", title: "Mi heladera", desc: "Con lo que tenés", icon: <NavFridge size={28} /> },
  { to: "/groups", title: "En grupo", desc: "Votan entre todos", icon: <NavUsers size={28} /> },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [todayMeals, setTodayMeals] = useState<MealPlanEntry[] | null>(null);
  const [shopping, setShopping] = useState<ShoppingList | null | undefined>(undefined);
  const [nutritionToday, setNutritionToday] = useState<number | null>(null);

  useEffect(() => {
    // Cada resumen se carga por separado: si uno falla, el resto del inicio sigue funcionando.
    const todayIndex = (new Date().getDay() + 6) % 7; // 0 = lunes, como en el menú semanal
    const week = mondayOf(new Date());

    api.getMealPlans()
      .then((plans) => {
        const plan = plans.find((p) => p.weekStart === week);
        const entries = (plan?.entries ?? [])
          .filter((e) => e.dayOfWeek === todayIndex)
          .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
        setTodayMeals(entries);
      })
      .catch(() => setTodayMeals([]));

    api.getShoppingLists()
      .then((lists) => {
        const pending = lists
          .filter((l) => l.itemCount > 0 && l.checkedCount < l.itemCount)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setShopping(pending[0] ?? null);
      })
      .catch(() => setShopping(null));

    api.getNutritionLogs()
      .then((logs: NutritionLogEntry[]) => setNutritionToday(logs.filter((l) => isToday(l.createdAt)).length))
      .catch(() => setNutritionToday(0));
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/discover?q=${encodeURIComponent(q)}` : "/discover");
  }

  const firstName = user?.username?.split(" ")[0];
  const hasDinner = todayMeals?.some((m) => m.mealType === "dinner");

  return (
    <div className={styles.container}>
      <section className={styles.top}>
        <div className={styles.heading}>
          <p className={styles.hello}>¡Hola{firstName ? `, ${firstName}` : ""}!</p>
          <h1 className={styles.title}>¿Qué comemos hoy?</h1>
        </div>
        <form className={styles.search} role="search" onSubmit={onSearch}>
          <label htmlFor="home-search" className={styles.srOnly}>Buscar recetas</label>
          <NavSearch />
          <input
            id="home-search"
            type="search"
            placeholder="Buscá un plato o ingrediente"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            enterKeyHint="search"
          />
        </form>
      </section>

      <Link to="/meal-planner" className={styles.today}>
        <span className={styles.todayIcon}><NavCalendar /></span>
        <span className={styles.todayBody}>
          <span className={styles.todayKicker}>Hoy en tu menú</span>
          {todayMeals === null ? (
            <span className={styles.todayLine}>Cargando…</span>
          ) : todayMeals.length === 0 ? (
            <>
              <span className={styles.todayMain}>Todavía no planificaste nada</span>
              <span className={styles.todayLine}>Tocá para armar tu semana</span>
            </>
          ) : (
            <>
              {todayMeals.slice(0, 3).map((m) => (
                <span key={m.mealType} className={styles.todayMain}>
                  {MEAL_LABELS[m.mealType] ?? m.mealType}: {m.recipeName}
                </span>
              ))}
              {!hasDinner && <span className={styles.todayLine}>Cena: sin elegir todavía</span>}
            </>
          )}
        </span>
        <NavChevron className={styles.todayChevron} />
      </Link>

      <section className={styles.section} aria-labelledby="decide-title">
        <h2 id="decide-title" className={styles.sectionTitle}>Elegí cómo decidir</h2>
        <div className={styles.modes}>
          {modes.map((m) => (
            <Link key={m.to} to={m.to} className={`${styles.mode} ${m.featured ? styles.modeFeatured : ""}`}>
              <span className={styles.modeIcon}>{m.icon}</span>
              <span className={styles.modeText}>
                <strong>{m.title}</strong>
                <span>{m.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="week-title">
        <h2 id="week-title" className={styles.sectionTitle}>Tu semana</h2>
        <div className={styles.week}>
          <Link to={shopping ? `/shopping-lists/${shopping.id}` : "/shopping-lists"} className={styles.weekCard}>
            <span className={styles.weekHead}><NavCart size={20} />Compras</span>
            {shopping ? (
              <>
                <span
                  className={styles.progress}
                  role="progressbar"
                  aria-label={`Progreso de ${shopping.name}`}
                  aria-valuemin={0}
                  aria-valuemax={shopping.itemCount}
                  aria-valuenow={shopping.checkedCount}
                >
                  <span style={{ width: `${Math.round((shopping.checkedCount / shopping.itemCount) * 100)}%` }} />
                </span>
                <span className={styles.weekText}>
                  {shopping.checkedCount} de {shopping.itemCount} listos · {shopping.name}
                </span>
              </>
            ) : (
              <span className={styles.weekText}>{shopping === undefined ? "Cargando…" : "No tenés listas pendientes"}</span>
            )}
          </Link>
          <Link to="/nutrition" className={styles.weekCard}>
            <span className={styles.weekHead}><NavLeaf size={20} />Nutrición</span>
            <span className={styles.weekText}>
              {nutritionToday === null
                ? "Cargando…"
                : nutritionToday === 0
                  ? "Anotá tu primera comida de hoy"
                  : `${nutritionToday} ${nutritionToday === 1 ? "comida anotada" : "comidas anotadas"} hoy`}
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
