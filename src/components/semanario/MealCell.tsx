import type { MealPlanEntry } from '@sasona/shared'
import styles from './MealCell.module.css'

interface MealCellProps {
  entry?: MealPlanEntry
  day: number
  mealType: string
  onSelect: () => void
  onRemove: () => void
}

export default function MealCell({
  entry,
  onSelect,
  onRemove,
}: MealCellProps) {
  if (!entry) {
    return (
      <div className={styles.emptyCell}>
        <button className={styles.addButton} onClick={onSelect}>
          + Agregar
        </button>
      </div>
    )
  }

  return (
    <div className={styles.filledCell}>
      <div className={styles.content}>
        {entry.recipeImage && (
          <img src={entry.recipeImage} alt={entry.recipeName} className={styles.image} />
        )}
        <div className={styles.info}>
          <h4 className={styles.recipeName}>{entry.recipeName}</h4>
        </div>
        <button className={styles.removeButton} onClick={onRemove} title="Eliminar">
          ✕
        </button>
      </div>
      <div className={styles.actions}>
        <button className={styles.changeButton} onClick={onSelect}>
          Cambiar
        </button>
      </div>
    </div>
  )
}
