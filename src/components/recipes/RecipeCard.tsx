import type { RecipeListItem } from '@sasona/shared'
import { useNavigate } from 'react-router-dom'
import styles from './RecipeCard.module.css'

interface RecipeCardProps {
  recipe: RecipeListItem
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const navigate = useNavigate()

  return (
    <div className={styles.card} onClick={() => navigate(`/recipes/${recipe.id}`)}>
      <div className={styles.imageWrapper}>
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            <span>🍽️</span>
          </div>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{recipe.name}</h3>
        <div className={styles.meta}>
          <span>👥 {recipe.servings}</span>
          <span>⏱️ {recipe.prepTime}min</span>
        </div>
        <div className={styles.counts}>
          <span>{recipe.ingredientCount} ingredientes</span>
          <span>·</span>
          <span>{recipe.stepCount} pasos</span>
        </div>
      </div>
    </div>
  )
}
