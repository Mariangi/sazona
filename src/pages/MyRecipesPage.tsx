import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RecipeListItem } from '@sasona/shared'
import { api } from '../api/client'
import RecipeCard from '../components/recipes/RecipeCard'
import styles from './MyRecipesPage.module.css'

export default function MyRecipesPage() {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getRecipes()
      .then(setRecipes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.skeletonHeader} />
      <div className={styles.grid}>
        {[1,2,3,4].map(i => <div key={i} className={styles.skeletonCard} />)}
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Mis recetas</h2>
          <p className={styles.subtitle}>
            {recipes.length === 0
              ? 'Todavía no tenés recetas'
              : `Tenés ${recipes.length} receta${recipes.length === 1 ? '' : 's'}`
            }
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => navigate('/recipes/new')}>
          + Nueva
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {recipes.length === 0 && !loading && !error && (
        <div className={styles.empty}>
          {/* <div className={styles.emptyVisual}>🍳</div> */}
          <p className={styles.emptyText}>Crea tu primera receta para empezar</p>
          <button className={styles.emptyBtn} onClick={() => navigate('/recipes/new')}>
            Crear receta
          </button>
        </div>
      )}

      <div className={styles.grid}>
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  )
}
