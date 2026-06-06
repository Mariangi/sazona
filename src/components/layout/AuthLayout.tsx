import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Header } from './Header'
import styles from './AuthLayout.module.css'

export default function AuthLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
