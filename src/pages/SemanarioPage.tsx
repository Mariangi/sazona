import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MealPlan } from '@sasona/shared'
import { api } from '../api/client'
import Button from '../components/ui/Button'
import styles from './SemanarioPage.module.css'
import WeeklyGrid from '../components/semanario/WeeklyGrid'

const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner']
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  snack: 'Merienda',
  dinner: 'Cena',
}

export default function SemanarioPage() {
  const navigate = useNavigate()
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [servingsMultiplier, setServingsMultiplier] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const loadWeeklyPlan = async () => {
      try {
        const plans = await api.getMealPlans()
        const today = new Date()
        const weekStart = getWeekStart(today)
        const weekStartStr = weekStart.toISOString().split('T')[0]

        let plan = plans.find(p => p.weekStart === weekStartStr)
        if (!plan) {
          plan = await api.createMealPlan(weekStartStr)
        }
        setMealPlan(plan)
        setServingsMultiplier(plan.servingsMultiplier || 1)
      } catch (err) {
        setError((err as Error).message || 'Error cargando el plan')
      } finally {
        setLoading(false)
      }
    }

    loadWeeklyPlan()
  }, [])

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const updateMealPlanEntries = async (entries: any[]) => {
    if (!mealPlan) return
    try {
      const updated = await api.updateMealPlanEntries(mealPlan.id, entries)
      setMealPlan(updated)
    } catch (err) {
      setError((err as Error).message || 'Error actualizando el plan')
    }
  }

  const updateServingsMultiplier = async (multiplier: number) => {
    if (!mealPlan) return
    try {
      setServingsMultiplier(multiplier)
      await api.updateMealPlanServings(mealPlan.id, multiplier)
    } catch (err) {
      setError((err as Error).message || 'Error actualizando multiplicador')
    }
  }

  const generateShoppingList = async () => {
    if (!mealPlan || mealPlan.entries.length === 0) {
      setError('Agrega recetas al semanario primero')
      return
    }

    setIsGenerating(true)
    try {
      const result = await api.generateShoppingListFromMealPlan(mealPlan.id, servingsMultiplier)
      navigate(`/shopping-lists/${result.id}`)
    } catch (err) {
      setError((err as Error).message || 'Error generando lista de compras')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton}>Cargando semanario...</div>
      </div>
    )
  }

  if (!mealPlan) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error cargando el semanario</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Semanario</h1>
        <p className={styles.subtitle}>Planifica tus comidas para la semana</p>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.controls}>
        <div className={styles.multiplierControl}>
          <label>Multiplicador de comensales:</label>
          <div className={styles.multiplierInput}>
            <button onClick={() => updateServingsMultiplier(Math.max(1, servingsMultiplier - 1))}>−</button>
            <input
              type="number"
              min="1"
              value={servingsMultiplier.toString()}
              onChange={(e) => updateServingsMultiplier(Math.max(1, Number(e.target.value) || 1))}
            />
            <button onClick={() => updateServingsMultiplier(servingsMultiplier + 1)}>+</button>
          </div>
        </div>
      </div>

      <WeeklyGrid 
        mealPlan={mealPlan} 
        onEntriesChange={updateMealPlanEntries}
      />

      <div className={styles.actions}>
        <Button 
          onClick={generateShoppingList}
          disabled={isGenerating || mealPlan.entries.length === 0}
        >
          {isGenerating ? 'Generando...' : 'Generar Lista de Compras'}
        </Button>
      </div>
    </div>
  )
}
