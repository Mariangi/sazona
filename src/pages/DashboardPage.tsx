import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      <div className={styles.welcome}>
        <h2>Bienvenido, {user?.username} 👋</h2>
        <p>Tu viaje culinario comienza aquí.</p>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          onClick={() => navigate('/recipes/new')}
        >
          <span className={styles.actionIcon}>➕</span>
          <div>
            <strong>Nueva receta</strong>
            <p>Añade ingredientes, pasos y foto</p>
          </div>
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => navigate('/recipes')}
        >
          <span className={styles.actionIcon}>📋</span>
          <div>
            <strong>Mis recetas</strong>
            <p>Ver y gestionar tus recetas guardadas</p>
          </div>
        </button>
      </div>
    </div>
  )
}
