import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SavedRecipe } from '@sasona/shared'
import { api } from '../api/client'
import styles from './SavedRecipesPage.module.css'

export default function SavedRecipesPage() {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSavedRecipes()
      .then(setRecipes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleUnsave(recipeId: number) {
    try {
      await api.unsaveRecipe(recipeId)
      setRecipes(prev => prev.filter(r => r.recipeId !== recipeId))
    } catch {}
  }

  if (loading) return <div className={styles.center}>Cargando...</div>

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>🔖 Guardados</h2>
      <p className={styles.subtitle}>
        Recetas que guardaste para ver más tarde
      </p>

      {error && <div className={styles.error}>{error}</div>}

      {recipes.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔖</span>
          <p>Aún no tienes recetas guardadas</p>
          <p className={styles.hint}>Desde el detalle de una receta puedes guardarla</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {recipes.map(r => (
            <div key={r.id} className={styles.card}>
              <div className={styles.cardMain} onClick={() => navigate('/recipes/' + r.recipeId)}>
                <div className={styles.imageWrapper}>
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.name} className={styles.image} />
                  ) : (
                    <div className={styles.placeholder}>🍽️</div>
                  )}
                </div>
                <div className={styles.body}>
                  <h3 className={styles.name}>{r.name}</h3>
                  <div className={styles.meta}>
                    <span>👥 {r.servings} pers.</span>
                    <span>⏱️ {r.prepTime} min</span>
                  </div>
                  <div className={styles.counts}>
                    <span>{r.ingredientCount} ingredientes</span>
                    <span>·</span>
                    <span>{r.stepCount} pasos</span>
                  </div>
                </div>
              </div>
              <button className={styles.unsaveBtn} onClick={() => handleUnsave(r.recipeId)} title="Quitar de guardados">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
