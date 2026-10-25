import { useState } from 'react'
import styles from './MultiplierModal.module.css'

interface MultiplierModalProps {
  isOpen: boolean
  onConfirm: (multiplier: number) => void
  onCancel: () => void
}

export default function MultiplierModal({ isOpen, onConfirm, onCancel }: MultiplierModalProps) {
  const [multiplier, setMultiplier] = useState(1)

  const handleConfirm = () => {
    if (multiplier >= 1) {
      onConfirm(multiplier)
      setMultiplier(1)
    }
  }

  const handleCancel = () => {
    setMultiplier(1)
    onCancel()
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Multiplicador de porciones</h3>
        <p className={styles.subtitle}>¿Para cuántas personas es esta lista de compras?</p>

        <div className={styles.inputGroup}>
          <button
            className={styles.decreaseBtn}
            onClick={() => setMultiplier(Math.max(1, multiplier - 1))}
          >
            −
          </button>
          <input
            type="number"
            min="1"
            value={multiplier}
            onChange={(e) => setMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
            className={styles.input}
          />
          <button
            className={styles.increaseBtn}
            onClick={() => setMultiplier(multiplier + 1)}
          >
            +
          </button>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={handleCancel}>
            Cancelar
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            Generar lista
          </button>
        </div>
      </div>
    </div>
  )
}
