import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'

const ROOT_PATHS = ['/', '/login', '/dashboard']

export function useAndroidBackButton() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return

    const subPromise = CapApp.addListener('backButton', () => {
      if (ROOT_PATHS.includes(location.pathname)) {
        CapApp.exitApp()
      } else {
        navigate(-1)
      }
    })

    return () => {
      subPromise.then((sub) => sub.remove())
    }
  }, [navigate, location])
}
