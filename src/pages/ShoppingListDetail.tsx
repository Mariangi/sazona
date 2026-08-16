import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { ShoppingListDetail as ShoppingListDetailType } from '@sasona/shared'
import { api } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import styles from './ShoppingListDetail.module.css'
import { ArrowLeftIcon } from '../components/ui/Icons'

const GROUP_POLL_INTERVAL_MS = 3000

export default function ShoppingListDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [list, setList] = useState<ShoppingListDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) return
    api.getShoppingList(Number(id))
      .then(setList)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !list?.groupId) return
    pollRef.current = setInterval(() => {
      api.getShoppingList(Number(id)).then(setList).catch(() => {})
    }, GROUP_POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [id, list?.groupId])

  async function handleToggle(itemId: number, checked: boolean) {
    try {
      const res = await api.toggleShoppingItem(itemId, checked)
      setList(prev => prev ? {
        ...prev,
        items: prev.items.map(i =>
          i.id === itemId ? {
            ...i, checked,
            checkedBy: res.checkedBy,
            checkedAt: res.checkedAt,
            checkedByUsername: res.checkedBy ? user?.username ?? null : null,
            checkedByAvatarUrl: res.checkedBy ? user?.avatarUrl ?? null : null,
          } : i
        ),
      } : prev)
    } catch {}
  }

  if (loading) return <div className={styles.center}><div className={styles.spinner} /></div>
  if (error) return <div className={styles.center}>{error}</div>
  if (!list) return <div className={styles.center}>Lista no encontrada</div>

  const checkedCount = list.items.filter(i => i.checked).length
  const totalCount = list.items.length

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/shopping-lists')}>
          <ArrowLeftIcon height='12' width='12' fill='var(--c-primary)'/> Listas
        </button>
        <h2 className={styles.pageTitle}>{list.name}</h2>
        <span className={styles.meta}>
          {list.groupName && `${list.groupName} · `}
          {checkedCount}/{totalCount} completados
        </span>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
        />
      </div>

      {list.items.length === 0 ? (
        <div className={styles.empty}>
          {/* <div className={styles.emptyVisual}>🛒</div> */}
          <p>No hay items en esta lista</p>
        </div>
      ) : (
        <div className={styles.list}>
          {list.items.map(item => (
            <label key={item.id} className={`${styles.item} ${item.checked ? styles.done : ''}`}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={item.checked}
                onChange={(e) => handleToggle(item.id, e.target.checked)}
              />
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                {(item.quantity || item.unit) && (
                  <span className={styles.itemDetail}>
                    {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                  </span>
                )}
                {item.checked && item.checkedByUsername && (
                  <span className={styles.checkedByLabel}>
                    Comprado por {item.checkedByUsername}
                  </span>
                )}
              </div>
              <span className={styles.checkmark}>✓</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
