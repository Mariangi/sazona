import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './Sidebar.module.css'

const navItems = [
  { to: '/dashboard', label: 'Inicio', icon: '🏠' },
  { to: '/recipes', label: 'Recetas', icon: '📖' },
  { to: '/fridge', label: 'Heladera', icon: '🧊' },
  { to: '/saved', label: 'Guardados', icon: '🔖' },
  { to: '/shopping-lists', label: 'Compras', icon: '🛒' },
  { to: '/groups', label: 'Grupos', icon: '👥' },
  { to: '/random-dinner', label: 'Sorpresa', icon: '🎲' },
]

export default function Sidebar() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.logo} onClick={() => navigate('/dashboard')}>
          <svg width="100" height="36" viewBox="0 0 1006 343" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M872.509 326.5C872.509 326.5 872.509 283.532 872.509 256M872.509 256C875.647 292.885 846.074 326.477 810.442 326.5C774.534 326.524 744.261 293.07 748.376 256C752.054 222.862 778.343 200 810.442 200C842.542 200 868.003 222.973 872.509 256ZM706 326.5V254.86C706 247.336 704.97 239.788 702.088 232.838C694.569 214.705 683.615 202.694 654.5 201C625.244 199.298 608.532 217.251 595.5 243.5M595.5 243.5V327.5M595.5 243.5V202M397 325.5L301.053 325.01C300.219 325.006 299.756 324.043 300.274 323.39L394.725 204.11C395.242 203.457 394.78 202.494 393.946 202.49L297.999 202M259.503 326.5C259.503 326.5 259.503 283.532 259.503 256M259.503 256C262.718 292.885 232.433 326.477 195.944 326.5C159.172 326.524 128.171 293.07 132.385 256C136.151 222.862 163.073 200 195.944 200C228.815 200 254.889 222.972 259.503 256ZM85.8484 213.71C85.8484 213.71 78.6301 206.464 69.6857 203.709C62.8394 201.6 53.2913 199.593 46.1343 200.071C30.2845 201.132 16.9194 211.758 14.7325 225.531C12.5896 239.028 19.332 249.631 31.357 256.447C46.5961 265.085 70.282 265.633 84.9248 276.451C94.2205 283.318 95.546 293.273 95.546 293.273C98.0787 304.797 91.6673 315.207 82.154 322.37C66.4531 334.19 47.5197 330.553 47.5197 330.553C30.3113 329.24 11.5 310.549 11.5 310.549M490.96 201.029C454.103 199.895 422.824 232.325 425.681 268.898C428.332 302.825 456.769 328.053 490.96 327.001C524.025 325.984 549.748 301.707 552.312 268.898C555.089 233.36 526.774 202.131 490.96 201.029Z" stroke="#FF8240" stroke-width="23" stroke-linecap="round"/>
          </svg>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ to, label, icon }) => (
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
                <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
              ) : (
                user?.username?.[0]?.toUpperCase() || '?'
              )}
            </span>
            <span className={styles.username}>{user?.username}</span>
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <nav className={styles.mobileNav}>
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `${styles.mobileLink} ${isActive ? styles.mobileActive : ''}`
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
