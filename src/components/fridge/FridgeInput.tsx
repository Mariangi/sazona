import { useState } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { CameraIcon } from '../ui/Icons'
import { api } from '../../api/client'
import styles from './FridgeInput.module.css'

interface FridgeInputProps {
  ingredients: string[]
  onChange: (ingredients: string[]) => void
}

export default function FridgeInput({ ingredients, onChange }: FridgeInputProps) {
  const [value, setValue] = useState('')
  const [recognizing, setRecognizing] = useState(false)
  const [recognizeError, setRecognizeError] = useState('')

  function add() {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) return
    if (ingredients.includes(trimmed)) return
    onChange([...ingredients, trimmed])
    setValue('')
  }

  function remove(index: number) {
    onChange(ingredients.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    }
  }

  async function handlePhoto() {
    let photo
    try {
      photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        quality: 80,
        promptLabelHeader: 'Foto de la heladera',
        promptLabelPhoto: 'Elegir de la galería',
        promptLabelPicture: 'Sacar foto',
        promptLabelCancel: 'Cancelar',
      })
    } catch {
      return
    }

    const base64 = photo.dataUrl
    if (!base64) return

    setRecognizing(true)
    setRecognizeError('')
    try {
      const { ingredients: detected } = await api.recognizeIngredients(base64)
      if (detected.length === 0) {
        setRecognizeError('No se detectaron ingredientes en la foto, probá con otra')
      } else {
        const merged = [...ingredients]
        for (const ing of detected) {
          if (!merged.includes(ing)) merged.push(ing)
        }
        onChange(merged)
      }
    } catch (err) {
      setRecognizeError(err instanceof Error ? err.message : 'No pudimos reconocer los ingredientes, probá de nuevo')
    } finally {
      setRecognizing(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.tagList}>
        {ingredients.map((ing, i) => (
          <span key={i} className={styles.tag}>
            {ing}
            <button type="button" className={styles.tagRemove} onClick={() => remove(i)}>×</button>
          </span>
        ))}
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          placeholder="Ej: pollo, tomate, cebolla..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={styles.cameraBtn}
          onClick={handlePhoto}
          disabled={recognizing}
          title="Sacar foto o elegir de la galería"
        >
          {recognizing ? '...' : <CameraIcon width="18" height="18" fill="white" />}
        </button>
        <button type="button" className={styles.addBtn} onClick={add}>
          Añadir
        </button>
      </div>

      {recognizeError && <div className={styles.recognizeError}>{recognizeError}</div>}
    </div>
  )
}
