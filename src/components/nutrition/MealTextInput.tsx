import { useState, type FormEvent } from 'react'
import type { AnalyzeMealResponse } from '@sasona/shared'
import { api } from '../../api/client'
import Button from '../ui/Button'
import styles from './MealTextInput.module.css'

interface MealTextInputProps {
  onAnalyzed: (result: AnalyzeMealResponse) => void
}

export default function MealTextInput({ onAnalyzed }: MealTextInputProps) {
  const [text, setText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const description = text.trim()
    if (description.length < 3) {
      setError('Contanos qué comiste')
      return
    }

    setAnalyzing(true)
    setError('')
    try {
      onAnalyzed(await api.analyzeMealText(description))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos analizar el texto, probá de nuevo')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="meal-text">O escribí qué comiste</label>
      <textarea
        id="meal-text"
        className={styles.textarea}
        placeholder="Ej: 2 empanadas de carne y un vaso de jugo"
        rows={3}
        maxLength={500}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button type="submit" variant="secondary" isLoading={analyzing} disabled={!text.trim()}>
        Analizar texto
      </Button>

      {error && <div className={styles.error} role="alert">{error}</div>}
    </form>
  )
}
