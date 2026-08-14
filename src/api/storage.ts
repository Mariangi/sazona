import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()
const TOKEN_KEY = 'token'

export async function getToken(): Promise<string | null> {
  if (isNative) return (await Preferences.get({ key: TOKEN_KEY })).value
  return localStorage.getItem(TOKEN_KEY)
}

export async function setToken(value: string): Promise<void> {
  if (isNative) await Preferences.set({ key: TOKEN_KEY, value })
  else localStorage.setItem(TOKEN_KEY, value)
}

export async function clearToken(): Promise<void> {
  if (isNative) await Preferences.remove({ key: TOKEN_KEY })
  else localStorage.removeItem(TOKEN_KEY)
}
