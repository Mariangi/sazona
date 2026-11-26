import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavCalendar, NavCart, NavChefHat, NavClose, NavLeaf, NavUsers } from '../ui/NavIcons'
import styles from './CreateSheet.module.css'

const options = [
  { to: '/recipes/new', title: 'Nueva receta', desc: 'Compartí un plato tuyo', icon: <NavChefHat />, primary: true },
  { to: '/nutrition', title: 'Anotar lo que comí', desc: 'Con foto o texto, para Nutrición', icon: <NavLeaf /> },
  { to: '/meal-planner', title: 'Planificar una comida', desc: 'Sumala a tu menú semanal', icon: <NavCalendar /> },
  { to: '/shopping-lists', title: 'Lista de compras', desc: 'Armala o generala desde tu menú', icon: <NavCart /> },
  { to: '/groups', title: 'Grupo', desc: 'Decidan juntos qué cocinar', icon: <NavUsers /> },
]

type Props = { open: boolean; onClose: () => void }

/** Menú del botón "+": todo lo que se puede crear, en un solo lugar. */
export default function CreateSheet({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function go(to: string) {
    onClose()
    navigate(to)
  }

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby="create-sheet-title"
      onClose={onClose}
      // Tocar el fondo oscuro (fuera del panel) cierra el menú
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={styles.panel}>
        <span className={styles.handle} aria-hidden="true" />
        <div className={styles.head}>
          <h2 id="create-sheet-title" className={styles.title}>¿Qué querés crear?</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <NavClose />
          </button>
        </div>
        <ul className={styles.list}>
          {options.map((o) => (
            <li key={o.to}>
              <button type="button" className={styles.row} onClick={() => go(o.to)}>
                <span className={`${styles.bubble} ${o.primary ? styles.bubblePrimary : ''}`}>{o.icon}</span>
                <span className={styles.text}>
                  <strong>{o.title}</strong>
                  <span>{o.desc}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  )
}
