import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ShoppingList } from '@sasona/shared'
import { api } from '../api/client'
import Button from '../components/ui/Button'
import styles from './ShoppingListsPage.module.css'

export default function ShoppingListsPage() {
  const navigate = useNavigate()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    api.getShoppingLists()
      .then(setLists)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!name.trim()) return
    setBusy(true)
    setError('')
    try {
      await api.createShoppingList({ name, items: [] })
      const updated = await api.getShoppingLists()
      setLists(updated)
      setShowCreate(false)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar lista permanentemente?')) return
    setDeleting(id)
    try {
      await api.deleteShoppingList(id)
      setLists(prev => prev.filter(l => l.id !== id))
    } catch {} finally {
      setDeleting(null)
    }
  }

  if (loading) return <div className={styles.center}><div className={styles.spinner} /></div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Listas de compra</h2>
          <p className={styles.subtitle}>Organizá tus compras del super</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ Nueva lista</Button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showCreate && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Nueva lista</h3>
            <input
              className={styles.modalInput}
              placeholder="Nombre de la lista"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={handleCreate} isLoading={busy}>Crear</Button>
            </div>
          </div>
        </div>
      )}

      {lists.length === 0 ? (
        <div className={styles.empty}>
          {/* <div className={styles.emptyVisual}>🛒</div> */}
          <p className={styles.emptyText}>Creá listas para tus compras o genera una desde una receta</p>
        </div>
      ) : (
        <div className={styles.list}>
          {lists.map(l => (
            <div
              key={l.id}
              className={styles.listCard}
              onClick={() => navigate('/shopping-lists/' + l.id)}
            >
              <div className={styles.listInfo}>
                <strong className={styles.listName}>{l.name}</strong>
                <span className={styles.listMeta}>
                  {l.checkedCount}/{l.itemCount} items
                  {l.groupName && ` · ${l.groupName}`}
                </span>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => { e.stopPropagation(); handleDelete(l.id) }}
                disabled={deleting === l.id}
                title="Eliminar"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
