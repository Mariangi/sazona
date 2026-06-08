import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RecipeResponse } from '@sasona/shared'
import { api } from '../../api/client'
import Button from '../ui/Button'
import Input from '../ui/Input'
import ImageUpload from './ImageUpload'
import IngredientInput from './IngredientInput'
import StepInput from './StepInput'
import styles from './RecipeForm.module.css'

interface Ingredient {
  name: string
  quantity: string
  unit: string
}

interface Step {
  description: string
}

interface RecipeFormProps {
  recipe?: RecipeResponse
}

export default function RecipeForm({ recipe }: RecipeFormProps) {
  const navigate = useNavigate()
  const isEdit = !!recipe

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [name, setName] = useState(recipe?.name ?? '')
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [servings, setServings] = useState(recipe?.servings.toString() ?? '')
  const [prepTime, setPrepTime] = useState(recipe?.prepTime.toString() ?? '')
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit })) ?? [
      { name: '', quantity: '', unit: '' },
    ],
  )
  const [steps, setSteps] = useState<Step[]>(
    recipe?.steps.map(s => ({ description: s.description })) ?? [{ description: '' }],
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const hasEmptyIngredient = ingredients.some((i) => !i.name.trim())
    const hasEmptyStep = steps.some((s) => !s.description.trim())

    if (hasEmptyIngredient) {
      setError('Completa todos los nombres de los ingredientes')
      return
    }
    if (hasEmptyStep) {
      setError('Completa todos los pasos')
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        name,
        imageBase64: imageBase64 === null && isEdit && recipe?.imageUrl ? '' : (imageBase64 || undefined),
        servings: Number(servings),
        prepTime: Number(prepTime),
        ingredients: ingredients.filter((i) => i.name.trim()),
        steps: steps.filter((s) => s.description.trim()),
      }

      if (isEdit && recipe) {
        await api.updateRecipe(recipe.id, payload)
      } else {
        await api.createRecipe(payload)
      }
      navigate('/recipes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la receta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.errorBanner}>{error}</div>}

      <Input
        label="Nombre de la receta"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Paella valenciana"
        required
      />

      <ImageUpload value={imageBase64} onChange={setImageBase64} existingImage={recipe?.imageUrl ?? undefined} />

      <div className={styles.row}>
        <Input
          label="Comensales"
          type="number"
          min="1"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          required
        />
        <Input
          label="Tiempo (minutos)"
          type="number"
          min="1"
          value={prepTime}
          onChange={(e) => setPrepTime(e.target.value)}
          required
        />
      </div>

      <IngredientInput ingredients={ingredients} onChange={setIngredients} />
      <StepInput steps={steps} onChange={setSteps} />

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/recipes')}
        >
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Guardar cambios' : 'Guardar receta'}
        </Button>
      </div>
    </form>
  )
}
