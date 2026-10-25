import { useState } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
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

  async function handlePhoto() {
    let photo
    try {
      photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        quality: 80,
        promptLabelHeader: 'Foto de tu comida',
        promptLabelPhoto: 'Elegir de la galería',
        promptLabelPicture: 'Sacar foto',
        promptLabelCancel: 'Cancelar',
      })
    } catch {
      return
    }

    const base64 = photo.dataUrl
    if (!base64) return

    setAnalyzing(true)
    setError('')
    try {
      const result = await api.analyzeMeal(base64)
      onAnalyzed(result, base64)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos analizar la foto, probá de nuevo')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.captureBtn}
        onClick={handlePhoto}
        disabled={analyzing}
      >
        <CameraIcon width="20" height="20" fill="white" />
        {analyzing ? 'Analizando...' : 'Sacar foto de tu comida'}
      </button>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}
