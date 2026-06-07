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
      setError('Añadí al menos un ingrediente')
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
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>Mi heladera</h2>
        <p className={styles.subtitle}>
          Ingresá los ingredientes que tenés y te sugerimos recetas
        </p>
      </div>

      <div className={styles.card}>
        <FridgeInput ingredients={ingredients} onChange={setIngredients} />

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={allowExtra}
            onChange={(e) => setAllowExtra(e.target.checked)}
            className={styles.checkboxInput}
          />
          <span className={styles.checkboxLabel}>Permitir recetas con ingredientes que no tengo</span>
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

      {loading && <div className={styles.loadingState}>Buscando recetas...</div>}

      {searched && !loading && results && results.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyVisual}>😕</div>
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
