import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function RecipeForm() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [name, setName] = useState('')
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [servings, setServings] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: '', unit: '' },
  ])
  const [steps, setSteps] = useState<Step[]>([{ description: '' }])

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
      await api.createRecipe({
        name,
        imageBase64: imageBase64 || undefined,
        servings: Number(servings),
        prepTime: Number(prepTime),
        ingredients: ingredients.filter((i) => i.name.trim()),
        steps: steps.filter((s) => s.description.trim()),
      })
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

      <ImageUpload value={imageBase64} onChange={setImageBase64} />

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
          Guardar receta
        </Button>
      </div>
    </form>
  )
}
