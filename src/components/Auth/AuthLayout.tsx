import { Logo } from '../ui/Icons'
import styles from './AuthLayout.module.css'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
         <Logo width='100%' fill='var(--c-surface)'/>
          <p className={styles.tagline}>Descubrí qué comer hoy.</p>
        </div>
      </div>
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
