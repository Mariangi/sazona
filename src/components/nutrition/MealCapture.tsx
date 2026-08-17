import { useRef, useState } from 'react'
import type { AnalyzeMealResponse } from '@sasona/shared'
import { CameraIcon } from '../ui/Icons'
import { api } from '../../api/client'
import styles from './MealCapture.module.css'

interface MealCaptureProps {
  onAnalyzed: (result: AnalyzeMealResponse, imageBase64: string) => void
}

export default function MealCapture({ onAnalyzed }: MealCaptureProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      setAnalyzing(true)
      setError('')
      try {
        const result = await api.analyzeMeal(base64)
        onAnalyzed(result, base64)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No pudimos analizar la foto, probá de nuevo')
      } finally {
        setAnalyzing(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.captureBtn}
        onClick={() => fileInputRef.current?.click()}
        disabled={analyzing}
      >
        <CameraIcon width="20" height="20" fill="white" />
        {analyzing ? 'Analizando...' : 'Sacar foto de tu comida'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhoto}
        className={styles.hiddenInput}
      />

      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}
