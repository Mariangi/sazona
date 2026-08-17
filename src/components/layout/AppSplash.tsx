import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { Logo } from '../ui/Icons'
import styles from './AppSplash.module.css'

interface AppSplashProps {
  loading: boolean
  onFinished: () => void
}

export default function AppSplash({ loading, onFinished }: AppSplashProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide({ fadeOutDuration: 300 })
    }
  }, [])

  useEffect(() => {
    if (loading || exiting) return
    const timer = setTimeout(() => setExiting(true), 300)
    return () => clearTimeout(timer)
  }, [loading, exiting])

  useEffect(() => {
    if (!exiting) return
    const timer = setTimeout(onFinished, 400)
    return () => clearTimeout(timer)
  }, [exiting, onFinished])

  return (
    <div className={`${styles.splash} ${exiting ? styles.exiting : ''}`}>
      <div className={styles.logoWrap}>
        <Logo fill="#ffffff" width="220" height="auto" />
      </div>
    </div>
  )
}
