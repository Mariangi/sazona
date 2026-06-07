import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SavedRecipe } from '@sasona/shared'
import { api } from '../api/client'
import styles from './SavedRecipesPage.module.css'
import { ClockIcon, CutleryIcon, PeopleIcon, SavedIcon, SaveIcon } from '../components/ui/Icons'

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

  if (loading) return <div className={styles.center}><div className={styles.spinner} /></div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}><SavedIcon/> Guardados</h2>
        <p className={styles.subtitle}>Recetas que guardaste para ver más tarde</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {recipes.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyVisual}><SaveIcon /></div>
          <p className={styles.emptyText}>Aún no tenés recetas guardadas</p>
          <p className={styles.emptyHint}>Desde el detalle de una receta podés guardarla</p>
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
                    <div className={styles.placeholder}><CutleryIcon height='12' width='12'/></div>
                  )}
                </div>
                <div className={styles.body}>
                  <h3 className={styles.name}>{r.name}</h3>
                  <div className={styles.meta}>
                    <span><PeopleIcon height='12' width='12'/> {r.servings}</span>
                    <span><ClockIcon height='12' width='12'/> {r.prepTime}min</span>
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
