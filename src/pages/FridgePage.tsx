import { useState } from 'react'
import type { RecipeMatch } from '@sasona/shared'
import { api } from '../api/client'
import Button from '../components/ui/Button'
import FridgeInput from '../components/fridge/FridgeInput'
import RecipeMatchCard from '../components/fridge/RecipeMatchCard'
import styles from './FridgePage.module.css'

export default function FridgePage() {
  const [ingredients, setIngredients] = useState<string[]>([])
  const [allowExtra, setAllowExtra] = useState(false)
  const [results, setResults] = useState<RecipeMatch[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (ingredients.length === 0) {
      setError('Añade al menos un ingrediente')
      return
    }
    setError('')
    setLoading(true)
    setSearched(true)

    try {
      const data = await api.findRecipesByIngredients({ ingredients, allowExtra })
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setIngredients([])
    setResults(null)
    setError('')
    setSearched(false)
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>🧊 ¿Qué cocino hoy?</h2>
      <p className={styles.subtitle}>
        Ingresa los ingredientes que tienes en la heladera y te sugerimos recetas
      </p>

      <div className={styles.card}>
        <label className={styles.sectionLabel}>Ingredientes que tengo:</label>
        <FridgeInput ingredients={ingredients} onChange={setIngredients} />

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={allowExtra}
            onChange={(e) => setAllowExtra(e.target.checked)}
          />
          <span>Permitir recetas con ingredientes que no tengo</span>
        </label>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <Button onClick={handleSearch} isLoading={loading}>
            🔍 Buscar recetas
          </Button>
          {searched && (
            <Button variant="secondary" onClick={handleClear}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {loading && <div className={styles.center}>Buscando recetas...</div>}

      {searched && !loading && results && results.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>😕</span>
          <p>No se encontraron recetas con esos ingredientes</p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className={styles.results}>
          <h3 className={styles.resultsTitle}>
            {results.length} receta{results.length === 1 ? '' : 's'} encontrada{results.length === 1 ? '' : 's'}
          </h3>
          <div className={styles.grid}>
            {results.map((match) => (
              <RecipeMatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
