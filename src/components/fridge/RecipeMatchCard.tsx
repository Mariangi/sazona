import { useNavigate } from 'react-router-dom'
import type { RecipeMatch } from '@sasona/shared'
import styles from './RecipeMatchCard.module.css'

interface RecipeMatchCardProps {
  match: RecipeMatch
}

export default function RecipeMatchCard({ match }: RecipeMatchCardProps) {
  const navigate = useNavigate()
  const allMatch = match.missingIngredients.length === 0
  const icon = allMatch ? '🟢' : match.matchPercentage >= 50 ? '🟡' : '🔴'

  return (
    <div className={styles.card} onClick={() => navigate('/recipes/' + match.id)}>
      <div className={styles.imageWrapper}>
        {match.imageUrl ? (
          <img src={match.imageUrl} alt={match.name} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>🍽️</div>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.header}>
          <h3 className={styles.name}>{match.name}</h3>
          <span className={styles.percentage}>{icon} {match.matchPercentage}%</span>
        </div>
        <div className={styles.meta}>
          <span>👥 {match.servings} pers.</span>
          <span>⏱️ {match.prepTime} min</span>
        </div>
        <div className={styles.matchInfo}>
          <span className={styles.count}>{match.matchCount}/{match.totalCount} ingredientes</span>
        </div>
        {!allMatch && (
          <div className={styles.missing}>
            ⚠️ Falta: {match.missingIngredients.join(', ')}
          </div>
        )}
        {allMatch && (
          <div className={styles.allSet}>✅ Tienes todos los ingredientes</div>
        )}
      </div>
    </div>
  )
}
