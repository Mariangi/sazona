import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SavedRecipe } from '@sasona/shared'
import { api, assetUrl } from '../api/client'
import styles from './SavedRecipesPage.module.css'
import { ClockIcon, CloseIcon, CutleryIcon, PeopleIcon, SavedIcon, SaveIcon } from '../components/ui/Icons'

const ITEMS_PER_PAGE = 12

export default function SavedRecipesPage() {
  const navigate = useNavigate()
  const [allRecipes, setAllRecipes] = useState<SavedRecipe[]>([])
  const [displayedRecipes, setDisplayedRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getSavedRecipes()
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

  async function handleUnsave(recipeId: number) {
    try {
      await api.unsaveRecipe(recipeId)
      setAllRecipes(prev => prev.filter(r => r.recipeId !== recipeId))
      setDisplayedRecipes(prev => prev.filter(r => r.recipeId !== recipeId))
    } catch {}
  }

  if (loading) return <div className={styles.center}><div className={styles.spinner} /></div>

  const hasMore = displayedRecipes.length < allRecipes.length

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}><SavedIcon/> Guardados</h2>
        <p className={styles.subtitle}>Recetas que guardaste para ver más tarde</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {allRecipes.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyVisual}><SaveIcon /></div>
          <p className={styles.emptyText}>Aún no tenés recetas guardadas</p>
          <p className={styles.emptyHint}>Desde el detalle de una receta podés guardarla</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {displayedRecipes.map(r => (
              <div key={r.id} className={styles.card}>
                <div className={styles.cardMain} onClick={() => navigate('/recipes/' + r.recipeId)}>
                  <div className={styles.imageWrapper}>
                    {r.imageUrl ? (
                      <img src={assetUrl(r.imageUrl) ?? undefined} alt={r.name} className={styles.image} />
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
                  <CloseIcon fill='var(--c-text-tertiary)' />
                </button>
              </div>
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
            <p className={styles.endMessage}>Ya viste todos tus guardados</p>
          )}
        </>
      )}
    </div>
  )
}
