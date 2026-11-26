import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { resolveMediaUrl } from '../../api/client'
import { Logo } from '../ui/Icons'
import { NavCalendar, NavChefHat, NavHome, NavPlus, NavSearch } from '../ui/NavIcons'
import { navGroups, sectionFor } from './navigation'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const section = sectionFor(pathname)

  // Barra de abajo en mobile: 4 pestañas + el botón de crear en el medio.
  const mobileTabs = [
    { to: '/dashboard', label: 'Inicio', icon: <NavHome />, active: pathname === '/dashboard' },
    { to: '/discover', label: 'Descubrí', icon: <NavSearch />, active: pathname.startsWith('/discover') },
    { to: '/meal-planner', label: 'Plan', icon: <NavCalendar />, active: section === 'plan' },
    { to: '/recipes', label: 'Mi cocina', icon: <NavChefHat />, active: section === 'mine' || pathname.startsWith('/profile') },
  ]

  const renderTab = (t: (typeof mobileTabs)[number]) => (
    <NavLink
      key={t.to}
      to={t.to}
      aria-current={t.active ? 'page' : undefined}
      className={`${styles.mobileLink} ${t.active ? styles.mobileActive : ''}`}
    >
      {t.icon}
      <span className={styles.mobileLabel}>{t.label}</span>
    </NavLink>
  )

  return (
    <>
      <aside className={styles.sidebar}>
        <button type="button" className={styles.logo} onClick={() => navigate('/dashboard')} aria-label="Ir al inicio">
          <Logo width="100%" />
        </button>

        <NavLink to="/recipes/new" className={styles.createBtn}>
          <NavPlus size={22} />
          Nueva receta
        </NavLink>

        <nav className={styles.nav} aria-label="Navegación principal">
          {navGroups.map((group) => (
            <div key={group.title} className={styles.group}>
              <h2 className={styles.groupTitle}>{group.title}</h2>
              {group.items.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/dashboard' || to === '/recipes'}
                  className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                >
                  <span className={styles.icon}>{icon}</span>
                  <span className={styles.label}>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <NavLink to="/profile" className={({ isActive }) => `${styles.userBtn} ${isActive ? styles.active : ''}`}>
            <span className={styles.avatar}>
              {user?.avatarUrl ? (
                <img src={resolveMediaUrl(user.avatarUrl)} alt="" className={styles.avatarImg} />
              ) : (
                user?.username?.[0]?.toUpperCase() || '?'
              )}
            </span>
            <span className={styles.username}>{user?.username}</span>
            <span className={styles.profileHint}>Perfil</span>
          </NavLink>
        </div>
      </aside>

      <nav className={styles.mobileNav} aria-label="Navegación principal">
        {mobileTabs.slice(0, 2).map(renderTab)}
        <NavLink to="/recipes/new" className={styles.mobileCreate} aria-label="Nueva receta">
          <NavPlus size={28} />
        </NavLink>
        {mobileTabs.slice(2).map(renderTab)}
      </nav>
    </>
  )
}
