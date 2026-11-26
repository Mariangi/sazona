import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Header } from './Header'
import SectionTabs from './SectionTabs'
import styles from './AuthLayout.module.css'

export default function AuthLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <main className={styles.content}>
          <SectionTabs />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
