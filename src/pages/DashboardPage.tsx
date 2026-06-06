import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './DashboardPage.module.css'

const categories = [
  { emoji: '🥗', label: 'Ensaladas', color: '#22c55e' },
  { emoji: '🍝', label: 'Pastas', color: '#f59e0b' },
  { emoji: '🥩', label: 'Carnes', color: '#ef4444' },
  { emoji: '🐟', label: 'Pescados', color: '#3b82f6' },
  { emoji: '🥘', label: 'Guisos', color: '#8b5cf6' },
  { emoji: '🍰', label: 'Postres', color: '#ec4899' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.greeting}>¡Hola, {user?.username?.split(' ')[0]}! 👋</h1>
        <p className={styles.question}>¿Qué tenés ganas de comer hoy?</p>
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Buscá recetas, ingredientes..."
            onFocus={() => navigate('/recipes')}
          />
        </div>
      </section>

      <section className={styles.categories}>
        <h2 className={styles.sectionTitle}>Categorías</h2>
        <div className={styles.categoryScroll}>
          {categories.map((cat) => (
            <button
              key={cat.label}
              className={styles.categoryChip}
              style={{ '--chip-color': cat.color } as React.CSSProperties}
              onClick={() => navigate('/recipes')}
            >
              <span className={styles.categoryEmoji}>{cat.emoji}</span>
              <span className={styles.categoryLabel}>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.actions}>
        <h2 className={styles.sectionTitle}>Empezá acá</h2>
        <div className={styles.actionGrid}>
          <button className={styles.actionCard} onClick={() => navigate('/recipes/new')}>
            <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #FF8240, #e86a2a)' }}>
              <span>+</span>
            </div>
            <div className={styles.actionBody}>
              <strong className={styles.actionTitle}>Nueva receta</strong>
              <p className={styles.actionDesc}>Agregá una receta nueva</p>
            </div>
          </button>

          <button className={styles.actionCard} onClick={() => navigate('/random-dinner')}>
            <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
              🎲
            </div>
            <div className={styles.actionBody}>
              <strong className={styles.actionTitle}>¿Qué cenamos?</strong>
              <p className={styles.actionDesc}>Dejá que la suerte decida</p>
            </div>
          </button>

          <button className={styles.actionCard} onClick={() => navigate('/fridge')}>
            <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
              🧊
            </div>
            <div className={styles.actionBody}>
              <strong className={styles.actionTitle}>Mi heladera</strong>
              <p className={styles.actionDesc}>Cociná con lo que tenés</p>
            </div>
          </button>

          <button className={styles.actionCard} onClick={() => navigate('/saved')}>
            <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              🔖
            </div>
            <div className={styles.actionBody}>
              <strong className={styles.actionTitle}>Guardados</strong>
              <p className={styles.actionDesc}>Tus recetas favoritas</p>
            </div>
          </button>
        </div>
      </section>

      <section className={styles.trending}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Descubrí algo nuevo</h2>
          <button className={styles.seeAll} onClick={() => navigate('/recipes')}>Ver todo</button>
        </div>
        <div className={styles.trendingGrid}>
          <div className={styles.trendingCard} onClick={() => navigate('/random-dinner')}>
            <div className={styles.trendingVisual}>
              <span className={styles.trendingEmoji}>🍕</span>
            </div>
            <p className={styles.trendingLabel}>Sorpresa culinaria</p>
          </div>
          <div className={styles.trendingCard} onClick={() => navigate('/recipes')}>
            <div className={styles.trendingVisual}>
              <span className={styles.trendingEmoji}>🌮</span>
            </div>
            <p className={styles.trendingLabel}>Tendencias</p>
          </div>
          <div className={styles.trendingCard} onClick={() => navigate('/groups')}>
            <div className={styles.trendingVisual}>
              <span className={styles.trendingEmoji}>👨‍👩‍👧‍👧</span>
            </div>
            <p className={styles.trendingLabel}>Cocina en grupo</p>
          </div>
          <div className={styles.trendingCard} onClick={() => navigate('/shopping-lists')}>
            <div className={styles.trendingVisual}>
              <span className={styles.trendingEmoji}>🛒</span>
            </div>
            <p className={styles.trendingLabel}>Listas de compra</p>
          </div>
        </div>
      </section>
    </div>
  )
}
