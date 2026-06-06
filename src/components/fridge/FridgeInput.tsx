import { useState } from 'react'
import styles from './FridgeInput.module.css'

interface FridgeInputProps {
  ingredients: string[]
  onChange: (ingredients: string[]) => void
}

export default function FridgeInput({ ingredients, onChange }: FridgeInputProps) {
  const [value, setValue] = useState('')

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
        <button type="button" className={styles.addBtn} onClick={add}>
          Añadir
        </button>
      </div>
    </div>
  )
}
