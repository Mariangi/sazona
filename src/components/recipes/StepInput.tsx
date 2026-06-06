import styles from './StepInput.module.css'

interface Step {
  description: string
}

interface StepInputProps {
  steps: Step[]
  onChange: (steps: Step[]) => void
}

export default function StepInput({ steps, onChange }: StepInputProps) {
  function update(index: number, value: string) {
    const updated = steps.map((step, i) =>
      i === index ? { ...step, description: value } : step
    )
    onChange(updated)
  }

  function add() {
    onChange([...steps, { description: '' }])
  }

  function remove(index: number) {
    if (steps.length <= 1) return
    onChange(steps.filter((_, i) => i !== index))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <label className={styles.label}>Pasos</label>
        <button type="button" className={styles.addBtn} onClick={add}>
          + Añadir paso
        </button>
      </div>

      {steps.map((step, i) => (
        <div key={i} className={styles.row}>
          <span className={styles.number}>{i + 1}.</span>
          <textarea
            className={styles.textarea}
            placeholder={`Describe el paso ${i + 1}...`}
            value={step.description}
            onChange={(e) => update(i, e.target.value)}
            rows={2}
            required
          />
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => remove(i)}
            disabled={steps.length <= 1}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
