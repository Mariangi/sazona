import styles from './IngredientInput.module.css'

interface Ingredient {
  name: string
  quantity: string
  unit: string
}

interface IngredientInputProps {
  ingredients: Ingredient[]
  onChange: (ingredients: Ingredient[]) => void
}

export default function IngredientInput({ ingredients, onChange }: IngredientInputProps) {
  function update(index: number, field: keyof Ingredient, value: string) {
    const updated = ingredients.map((ing, i) =>
      i === index ? { ...ing, [field]: value } : ing
    )
    onChange(updated)
  }

  function add() {
    onChange([...ingredients, { name: '', quantity: '', unit: '' }])
  }

  function remove(index: number) {
    if (ingredients.length <= 1) return
    onChange(ingredients.filter((_, i) => i !== index))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <label className={styles.label}>Ingredientes</label>
        <button type="button" className={styles.addBtn} onClick={add}>
          + Añadir
        </button>
      </div>

      {ingredients.map((ing, i) => (
        <div key={i} className={styles.row}>
          <input
            className={styles.input}
            placeholder="Nombre"
            value={ing.name}
            onChange={(e) => update(i, 'name', e.target.value)}
            required
          />
          <input
            className={styles.qty}
            placeholder="Cant."
            value={ing.quantity}
            onChange={(e) => update(i, 'quantity', e.target.value)}
          />
          <select
            className={styles.unit}
            value={ing.unit}
            onChange={(e) => update(i, 'unit', e.target.value)}
          >
            <option value="">Unidad</option>
            <option value="ml">ml</option>
            <option value="l">l</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="unid">unid</option>
            <option value="cucharadita">cucharadita</option>
            <option value="cucharada">cucharada</option>
            <option value="pizca">pizca</option>
          </select>
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => remove(i)}
            disabled={ingredients.length <= 1}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
