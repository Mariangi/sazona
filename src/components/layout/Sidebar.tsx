import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { resolveMediaUrl } from '../../api/client'
import styles from './Sidebar.module.css'
import { BookIcon, CalendarIcon, ChefIcon, DiceIcon, FridgeIcon, GroupIcon, HomeIcon, ListToBuyIcon, Logo, SaveIcon, SearchIcon } from '../ui/Icons'

const desktopNav = [
  { to: '/dashboard', label: 'Inicio', icon: <HomeIcon  fill='var(--c-text-secondary)'/> },
    { to: '/discover', label: 'Descubrí', icon:<SearchIcon fill='var(--c-text-secondary)' /> },
  { to: '/recipes', label: 'Recetas', icon: <BookIcon fill='var(--c-text-secondary)'/> },
  { to: '/fridge', label: 'Heladera', icon: <FridgeIcon fill='var(--c-text-secondary)'/> },
  { to: '/saved', label: 'Guardados', icon: <SaveIcon fill='var(--c-text-secondary)'/>   },
  { to: '/shopping-lists', label: 'Compras', icon: <ListToBuyIcon  fill='var(--c-text-secondary)' /> },
  { to: '/groups', label: 'Grupos', icon: <GroupIcon  fill='var(--c-text-secondary)'/> },
  { to: '/meal-planner', label: 'Menu semanal', icon: <CalendarIcon fill='var(--c-text-secondary)'/> },
  { to: '/random-dinner', label: 'Sorpresa', icon: <DiceIcon  fill='var(--c-text-secondary)'/> },
  { to: '/swipe', label: 'Antojo', icon: <ChefIcon  fill='var(--c-text-secondary)'/> },
]

const mobileNav = [
  { to: '/dashboard', label: 'Inicio',  icon: <HomeIcon/> },
  { to: '/discover', label: 'Descubrí', icon:<SearchIcon/> },
  { to: '/random-dinner', label: 'Sorpresa', icon: <DiceIcon/> , highlight: true },
  { to: '/fridge', label: 'Heladera', icon: <FridgeIcon /> },
  { to: '/swipe', label: 'Antojo', icon: <ChefIcon /> },
 ]

export default function Sidebar() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.logo} onClick={() => navigate('/dashboard')}>
          <Logo width='100%' />
        </div>

        <nav className={styles.nav}>
          {desktopNav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.icon}>{icon}</span>
              <span className={styles.label}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <button className={styles.userBtn} onClick={() => navigate('/profile')}>
            <span className={styles.avatar}>
              {user?.avatarUrl ? (
                <img src={resolveMediaUrl(user.avatarUrl)} alt="" className={styles.avatarImg} />
              ) : (
                user?.username?.[0]?.toUpperCase() || '?'
              )}
            </span>
            <span className={styles.username}>{user?.username}</span>
          </button>
        </div>
      </aside>

      <nav className={styles.mobileNav}>
        {mobileNav.map(({ to, label, icon, highlight }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `${styles.mobileLink} ${isActive ? styles.mobileActive : ''} ${highlight ? styles.mobileHighlight : ''}`
            }
          >
            <span className={styles.mobileIcon}>{icon}</span>
            <span className={styles.mobileLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
