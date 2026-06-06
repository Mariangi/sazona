import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './Sidebar.module.css'
import { HomeIcon } from '../ui/Icons'

export default function Sidebar() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Sasona</div>

      <nav className={styles.nav}>
        <NavLink to="/dashboard" className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }>
          <span className={styles.icon}><HomeIcon /></span>
          home
        </NavLink>
{/* 
        <NavLink to="/recipes" className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }>
          <span className={styles.icon}>📋</span>
          Mis recetas
        </NavLink> */}

        {/* <NavLink to="/recipes/new" className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }>
          <span className={styles.icon}>➕</span>
          Nueva receta
        </NavLink> */}

        {/* <NavLink to="/saved" className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }>
          <span className={styles.icon}>🔖</span>
          Guardados
        </NavLink> */}

        <NavLink to="/fridge" className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }>
          <span className={styles.icon}>🧊</span>
          Mi heladera
        </NavLink>

        <NavLink to="/shopping-lists" className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }>
          <span className={styles.icon}>🛒</span>
          Listas de compra
        </NavLink>

        <NavLink to="/groups" className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }>
          <span className={styles.icon}>👨‍👩‍👧‍👧</span>
          Mis grupos
        </NavLink>

        {/* <NavLink to="/random-dinner" className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }>
          <span className={styles.icon}>🎲</span>
          ¿Qué cenamos hoy?
        </NavLink> */}
      </nav>

      <div className={styles.footer}>
        <button className={styles.userBtn} onClick={() => navigate('/profile')}>
          <span className={styles.avatar}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
            ) : (
              user?.username[0].toUpperCase()
            )}
          </span>
          <span className={styles.username}>{user?.username}</span>
        </button>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
