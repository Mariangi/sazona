import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import styles from './AuthLayout.module.css'
import { Header } from './Header'

export default function AuthLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div>
      <Header />
      <main className={styles.content}>
        <Outlet />
      </main>
      </div>
    </div>
  )
}
