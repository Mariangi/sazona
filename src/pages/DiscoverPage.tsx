import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RecipeListItem } from '@sasona/shared'
import { api } from '../api/client'
import styles from './DiscoverPage.module.css'

export default function DiscoverPage() {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getRecipes()
      .then(setRecipes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>Descubrí</h2>
      <div className={styles.masonry}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className={styles.skeletonCard} style={{ height: `${180 + Math.random() * 120}px` }} />
        ))}
      </div>
    </div>
  )

  if (recipes.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.pageTitle}>Descubrí</h2>
        <div className={styles.empty}>
          <div className={styles.emptyVisual}>🔍</div>
          <p>Todavía no tenés recetas. ¡Creá la primera!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>Descubrí</h2>
      <p className={styles.subtitle}>Tus recetas, las más nuevas primero</p>
      <div className={styles.masonry}>
        {recipes.map(recipe => (
          <div
            key={recipe.id}
            className={styles.card}
            onClick={() => navigate(`/recipes/${recipe.id}`)}
          >
            {recipe.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.name} className={styles.cardImage} />
            ) : (
              <div className={styles.cardPlaceholder}>🍽️</div>
            )}
            <div className={styles.cardBody}>
              <h3 className={styles.cardName}>{recipe.name}</h3>
              <div className={styles.cardMeta}>
                <span>👥 {recipe.servings}</span>
                <span>⏱️ {recipe.prepTime}min</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
