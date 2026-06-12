import { useState, useRef, useEffect } from 'react'
import type { RecipeMatch } from '@sasona/shared'
import { api } from '../api/client'
import Button from '../components/ui/Button'
import FridgeInput from '../components/fridge/FridgeInput'
import RecipeMatchCard from '../components/fridge/RecipeMatchCard'
import styles from './FridgePage.module.css'

const ITEMS_PER_PAGE = 12

export default function FridgePage() {
  const [ingredients, setIngredients] = useState<string[]>([])
  const [allowExtra, setAllowExtra] = useState(false)
  const [allResults, setAllResults] = useState<RecipeMatch[] | null>(null)
  const [displayedResults, setDisplayedResults] = useState<RecipeMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [page, setPage] = useState(1)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Setup infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || page === 1 || !allResults) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedResults.length < allResults.length) {
          setLoadingMore(true)
          const newResults = allResults.slice(0, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE)
          setDisplayedResults(newResults)
          setLoadingMore(false)
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [page, displayedResults.length, allResults])

  // Trigger pagination
  useEffect(() => {
    if (allResults && displayedResults.length < allResults.length) {
      setPage(p => p + 1)
    }
  }, [displayedResults, allResults])

  async function handleSearch() {
    if (ingredients.length === 0) {
      setError('Añadí al menos un ingrediente')
      return
    }
    setError('')
    setLoading(true)
    setSearched(true)
    setPage(1)
    try {
      const data = await api.findRecipesByIngredients({ ingredients, allowExtra })
      setAllResults(data)
      setDisplayedResults(data.slice(0, ITEMS_PER_PAGE))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar')
      setAllResults(null)
      setDisplayedResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setIngredients([])
    setAllResults(null)
    setDisplayedResults([])
    setError('')
    setSearched(false)
  }

  const hasMore = allResults && displayedResults.length < allResults.length

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
            Buscar recetas
          </Button>
          {searched && (
            <Button variant="secondary" onClick={handleClear}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {loading && <div className={styles.loadingState}>Buscando recetas...</div>}

      {searched && !loading && allResults && allResults.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyVisual}>😕</div>
          <p>No se encontraron recetas con esos ingredientes</p>
        </div>
      )}

      {allResults && allResults.length > 0 && (
        <div className={styles.results}>
          <h3 className={styles.resultsTitle}>
            {allResults.length} receta{allResults.length === 1 ? '' : 's'} encontrada{allResults.length === 1 ? '' : 's'}
          </h3>
          <div className={styles.grid}>
            {displayedResults.map((match) => (
              <RecipeMatchCard key={match.id} match={match} />
            ))}
            {loadingMore && (
              <>
                <div className={styles.skeletonCard} />
                <div className={styles.skeletonCard} />
                <div className={styles.skeletonCard} />
              </>
            )}
          </div>
          {hasMore && <div ref={sentinelRef} style={{ height: '100px' }} />}
          {!hasMore && displayedResults.length > 0 && (
            <p className={styles.endMessage}>Ya viste todos los resultados</p>
          )}
        </div>
      )}
    </div>
  )
}
