import { useState, useEffect } from 'react'
import type { MealPlan, MealPlanEntry } from '@sasona/shared'
import MealCell from './MealCell'
import RecipeSelector from './RecipeSelector'
import styles from './WeeklyGrid.module.css'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAY_VALUES = [0, 1, 2, 3, 4, 5, 6]
const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner']
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  snack: 'Merienda',
  dinner: 'Cena',
}

interface WeeklyGridProps {
  mealPlan: MealPlan
  onEntriesChange: (entries: any[]) => void
}

export default function WeeklyGrid({ mealPlan, onEntriesChange }: WeeklyGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ day: number; mealType: string } | null>(null)
  const [localEntries, setLocalEntries] = useState<MealPlanEntry[]>(mealPlan.entries)

  useEffect(() => {
    setLocalEntries(mealPlan.entries)
  }, [mealPlan.entries])

  const getEntryForCell = (day: number, mealType: string): MealPlanEntry | undefined => {
    return localEntries.find(e => e.dayOfWeek === day && e.mealType === mealType)
  }

  const handleSelectRecipe = (recipeId: number, recipeName: string, recipeImage: string | null) => {
    if (!selectedCell) return

    const newEntry: MealPlanEntry = {
      dayOfWeek: selectedCell.day,
      mealType: selectedCell.mealType,
      recipeId,
      recipeName,
      recipeImage,
    }

    const filtered = localEntries.filter(
      e => !(e.dayOfWeek === selectedCell.day && e.mealType === selectedCell.mealType)
    )
    const updated = [...filtered, newEntry]

    setLocalEntries(updated)
    onEntriesChange(updated)
    setSelectedCell(null)
  }

  const handleRemoveRecipe = (day: number, mealType: string) => {
    const filtered = localEntries.filter(
      e => !(e.dayOfWeek === day && e.mealType === mealType)
    )
    setLocalEntries(filtered)
    onEntriesChange(filtered)
  }

  return (
    <div className={styles.gridWrapper}>
      <div className={styles.grid}>
        {/* Header */}
        <div className={styles.headerCell} />
        {DAYS.map(day => (
          <div key={day} className={styles.headerCell}>
            {day}
          </div>
        ))}

        {/* Meal rows */}
        {MEAL_TYPES.map(mealType => (
          <>
            <div key={`label-${mealType}`} className={styles.mealTypeCell}>
              {MEAL_LABELS[mealType]}
            </div>
            {DAY_VALUES.map(day => {
              const entry = getEntryForCell(day, mealType)
              return (
                <div key={`${day}-${mealType}`} className={styles.cellWrapper}>
                  <MealCell
                    entry={entry}
                    day={day}
                    mealType={mealType}
                    onSelect={() => setSelectedCell({ day, mealType })}
                    onRemove={() => handleRemoveRecipe(day, mealType)}
                  />
                </div>
              )
            })}
          </>
        ))}
      </div>

      {selectedCell && (
        <RecipeSelector
          day={selectedCell.day}
          mealType={selectedCell.mealType}
          onSelect={handleSelectRecipe}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  )
}
