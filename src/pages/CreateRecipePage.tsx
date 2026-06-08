import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { RecipeResponse } from '@sasona/shared'
import { api } from '../api/client'
import RecipeForm from '../components/recipes/RecipeForm'
import styles from './CreateRecipePage.module.css'

export default function CreateRecipePage() {
  const { id } = useParams()
  const isEdit = !!id
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!id) return
    api.getRecipeById(Number(id))
      .then(setRecipe)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.spinner} />
    </div>
  )

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{isEdit ? 'Editar receta' : 'Nueva receta'}</h2>
      <p className={styles.subtitle}>
        {isEdit ? 'Actualizá tu creación' : 'Compartí tu creación con el mundo'}
      </p>
      <div className={styles.card}>
        <RecipeForm recipe={recipe ?? undefined} />
      </div>
    </div>
  )
}
