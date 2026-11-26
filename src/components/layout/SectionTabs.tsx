import { NavLink, useLocation } from 'react-router-dom'
import { isSectionIndex, sectionFor, sections } from './navigation'
import styles from './SectionTabs.module.css'

/**
 * En mobile, "Plan" y "Mi cocina" agrupan varias pantallas: estas sub-pestañas
 * permiten saltar entre ellas. En desktop no se muestran (la barra lateral ya las lista).
 */
export default function SectionTabs() {
  const { pathname } = useLocation()
  const key = sectionFor(pathname)
  if (!key || !isSectionIndex(pathname)) return null
  const section = sections[key]

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>{section.title}</p>
      <nav className={styles.tabs} aria-label={section.title}>
        {section.tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end
            replace
            className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
