import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RecipeListItem } from '@sasona/shared'
import { api } from '../api/client'
import RecipeCard from '../components/recipes/RecipeCard'
import styles from './MyRecipesPage.module.css'

const ITEMS_PER_PAGE = 12

export default function MyRecipesPage() {
  const navigate = useNavigate()
  const [allRecipes, setAllRecipes] = useState<RecipeListItem[]>([])
  const [displayedRecipes, setDisplayedRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getRecipes()
      .then(recipes => {
        setAllRecipes(recipes)
        setDisplayedRecipes(recipes.slice(0, ITEMS_PER_PAGE))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!sentinelRef.current || page === 1) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedRecipes.length < allRecipes.length) {
          setLoadingMore(true)
          const newRecipes = allRecipes.slice(0, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE)
          setDisplayedRecipes(newRecipes)
          setLoadingMore(false)
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [page, displayedRecipes.length, allRecipes])

  useEffect(() => {
    if (displayedRecipes.length < allRecipes.length) {
      setPage(p => p + 1)
    }
  }, [displayedRecipes])

  const hasMore = displayedRecipes.length < allRecipes.length

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.skeletonHeader} />
      <div className={styles.grid}>
        {[1,2,3,4].map(i => <div key={i} className={styles.skeletonCard} />)}
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Mis recetas</h2>
          <p className={styles.subtitle}>
            {allRecipes.length === 0
              ? 'Todavía no tenés recetas'
              : `Tenés ${allRecipes.length} receta${allRecipes.length === 1 ? '' : 's'}`
            }
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => navigate('/recipes/new')}>
          + Nueva
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {allRecipes.length === 0 && !loading && !error && (
        <div className={styles.empty}>
          {/* <div className={styles.emptyVisual}>🍳</div> */}
          <p className={styles.emptyText}>Crea tu primera receta para empezar</p>
          <button className={styles.emptyBtn} onClick={() => navigate('/recipes/new')}>
            Crear receta
          </button>
        </div>
      )}

      <div className={styles.grid}>
        {displayedRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
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
      {!hasMore && displayedRecipes.length > 0 && (
        <p className={styles.endMessage}>Ya viste todas tus recetas</p>
      )}
    </div>
  )
}
