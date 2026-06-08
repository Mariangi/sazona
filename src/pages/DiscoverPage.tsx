import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RecipeListItem } from '@sasona/shared'
import { api } from '../api/client'
import styles from './DiscoverPage.module.css'
import { ClockIcon, PeopleIcon } from '../components/ui/Icons'

type DiscoverRecipe = RecipeListItem & {
  author: { id: number; username: string; avatarUrl: string | null } | null
}

export default function DiscoverPage() {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<DiscoverRecipe[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const limit = 12

  useEffect(() => {
    setLoading(true)
    api.getDiscoverRecipes(page, limit)
      .then(data => {
        setRecipes(data.recipes)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const totalPages = Math.ceil(total / limit)

  if (loading) return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>Descubrí</h2>
      <div className={styles.masonry}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={styles.skeletonCard} style={{ height: `${180 + Math.random() * 120}px` }} />
        ))}
      </div>
    </div>
  )

  if (recipes.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.pageTitle}>Descubrí</h2>
        <div className={styles.empty}>
          <div className={styles.emptyVisual}>🔍</div>
          <p>Todavía no hay recetas de otros chefs</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>Descubrí</h2>
      <p className={styles.subtitle}>Recetas de otros chefs</p>

      <div className={styles.masonry}>
        {recipes.map(recipe => (
          <div
            key={recipe.id}
            className={styles.card}
            onClick={() => navigate(`/recipes/${recipe.id}`)}
          >
            {recipe.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.name} className={styles.cardImage} />
            ) : (
              <div className={styles.cardPlaceholder}>🍽️</div>
            )}
            <div className={styles.cardBody}>
              <h3 className={styles.cardName}>{recipe.name}</h3>
              <div className={styles.cardMeta}>
                <span>
                  <PeopleIcon height="16" width="16" fill="var(--c-text-secondary)" /> 
                  {" "}
                  {recipe.servings}</span>
                <span>
                  <ClockIcon height="16" width="16" fill="var(--c-text-secondary)" />
                  {" "}
                  {recipe.prepTime}min</span>
              </div>
              {recipe.author && (
                <div className={styles.author}>
                  <span className={styles.authorAvatar}>
                    {recipe.author.avatarUrl ? (
                      <img src={recipe.author.avatarUrl} alt="" className={styles.authorAvatarImg} />
                    ) : (
                      recipe.author.username[0].toUpperCase()
                    )}
                  </span>
                  <span className={styles.authorName}>{recipe.author.username}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Anterior
          </button>
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
