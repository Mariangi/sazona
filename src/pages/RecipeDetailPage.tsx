import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { RecipeResponse } from '@sasona/shared'
import { api } from '../api/client'
import Button from '../components/ui/Button'
import styles from './RecipeDetailPage.module.css'

export default function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [saved, setSaved] = useState(false)
  const [togglingSave, setTogglingSave] = useState(false)

  useEffect(() => {
    if (!id) return
    const recipeId = Number(id)
    api.getRecipeById(recipeId)
      .then(setRecipe)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    api.isRecipeSaved(recipeId)
      .then(res => setSaved(res.saved))
      .catch(() => {})
  }, [id])

  async function handleToggleSave() {
    if (!id) return
    setTogglingSave(true)
    try {
      if (saved) {
        await api.unsaveRecipe(Number(id))
        setSaved(false)
      } else {
        await api.saveRecipe(Number(id))
        setSaved(true)
      }
    } catch {} finally {
      setTogglingSave(false)
    }
  }

  async function handleGenerateList() {
    if (!recipe) return
    setGenerating(true)
    try {
      await api.createShoppingList({
        name: recipe.name,
        items: recipe.ingredients.map(i => ({
          name: i.name, quantity: i.quantity, unit: i.unit,
        })),
      })
      setGenerated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div className={styles.center}>Cargando...</div>
  if (error) return <div className={styles.center}>{error}</div>
  if (!recipe) return <div className={styles.center}>Receta no encontrada</div>

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>← Volver</button>

      <div className={styles.card}>
        {recipe.imageUrl && (
          <div className={styles.imageWrapper}>
            <img src={recipe.imageUrl} alt={recipe.name} className={styles.image} />
          </div>
        )}
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{recipe.name}</h1>
          <button
            className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
            onClick={handleToggleSave}
            disabled={togglingSave}
            title={saved ? 'Quitar de guardados' : 'Guardar para después'}
          >
            {saved ? '🔖' : '🔖'}
          </button>
        </div>
        <div className={styles.meta}>
          <span>👥 {recipe.servings} comensales</span>
          <span>⏱️ {recipe.prepTime} minutos</span>
        </div>

        <div className={styles.section}>
          <h3>Ingredientes</h3>
          <ul className={styles.list}>
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                {ing.name}
                {ing.quantity && ` — ${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''}`}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Pasos</h3>
          <ol className={styles.list}>
            {recipe.steps.map((step, i) => (
              <li key={i}>{step.description}</li>
            ))}
          </ol>
        </div>

        {generated ? (
          <Button onClick={() => navigate('/shopping-lists')}>
            🛒 Ver lista de compras
          </Button>
        ) : (
          <Button onClick={handleGenerateList} isLoading={generating}>
            🛒 Generar lista de compras
          </Button>
        )}
      </div>
    </div>
  )
}
