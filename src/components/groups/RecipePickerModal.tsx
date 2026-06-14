import { useState, useEffect, useRef } from 'react'
import { api } from '../../api/client'
import styles from './RecipePickerModal.module.css'
import { CloseIcon } from '../ui/Icons'

interface RecipePickerModalProps {
  onSelect: (recipeId: number) => void
  onClose: () => void
}

export default function RecipePickerModal({ onSelect, onClose }: RecipePickerModalProps) {
  const [recipes, setRecipes] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.getAllRecipes().then(setRecipes).catch(() => {})
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (!search) {
      setFiltered(recipes)
      return
    }
    const q = search.toLowerCase()
    setFiltered(recipes.filter(r => r.name.toLowerCase().includes(q)))
  }, [search, recipes])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Elegí una receta</h3>
          <button className={styles.closeBtn} onClick={onClose}><CloseIcon fill='var(--c-text-tertiary)' /></button>
        </div>

        <input
          ref={inputRef}
          className={styles.searchInput}
          placeholder="Buscar receta..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className={styles.list}>
          {filtered.map(r => (
            <button key={r.id} className={styles.item} onClick={() => onSelect(r.id)}>
              {r.imageUrl && (
                <img src={r.imageUrl} alt="" className={styles.itemImage} />
              )}
              <span className={styles.itemName}>{r.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className={styles.empty}>No se encontraron recetas</p>
          )}
        </div>
      </div>
    </div>
  )
}
