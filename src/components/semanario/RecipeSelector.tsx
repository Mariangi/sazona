import { useState, useEffect } from 'react'
import type { RecipeListItem } from '@sasona/shared'
import { api } from '../../api/client'
import { CATEGORIES } from '@sasona/shared'
import styles from './RecipeSelector.module.css'

interface RecipeSelectorProps {
  day: number
  mealType: string
  onSelect: (recipeId: number, recipeName: string, recipeImage: string | null) => void
  onClose: () => void
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  snack: 'Merienda',
  dinner: 'Cena',
}

export default function RecipeSelector({
  mealType,
  onSelect,
  onClose,
}: RecipeSelectorProps) {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const allRecipes = await api.getAllRecipes()
        setRecipes(allRecipes)
      } catch (err) {
        console.error('Error loading recipes:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRecipes()
  }, [])

  useEffect(() => {
    let filtered = recipes

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(r => r.category === selectedCategory)
    }

    setFilteredRecipes(filtered)
  }, [searchTerm, selectedCategory, recipes])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Selecciona receta para {MEAL_LABELS[mealType]}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Buscar receta..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className={styles.categorySelect}
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.recipesList}>
          {loading ? (
            <div className={styles.loading}>Cargando recetas...</div>
          ) : filteredRecipes.length === 0 ? (
            <div className={styles.empty}>No hay recetas disponibles</div>
          ) : (
            filteredRecipes.map(recipe => (
              <div
                key={recipe.id}
                className={styles.recipeItem}
                onClick={() => onSelect(recipe.id, recipe.name, recipe.imageUrl)}
              >
                {recipe.imageUrl && (
                  <img src={recipe.imageUrl} alt={recipe.name} className={styles.recipeImage} />
                )}
                <div className={styles.recipeInfo}>
                  <h4 className={styles.recipeName}>{recipe.name}</h4>
                  <p className={styles.recipeMeta}>
                    {recipe.servings} porciones • {recipe.prepTime} min
                  </p>
                  {recipe.category && (
                    <p className={styles.recipeCategory}>{recipe.category}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
