import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FamilyGroup } from '@sasona/shared'
import { api } from '../api/client'
import Button from '../components/ui/Button'
import styles from './GroupsPage.module.css'

export default function GroupsPage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<FamilyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.getGroups()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!groupName.trim()) return
    setBusy(true)
    setError('')
    try {
      const g = await api.createGroup(groupName)
      setGroups(prev => [...prev, { ...g, memberCount: 1, createdBy: 0 }])
      setShowCreate(false)
      setGroupName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return
    setBusy(true)
    setError('')
    try {
      const g = await api.joinGroup(inviteCode.toUpperCase())
      setGroups(prev => [...prev, { ...g, memberCount: 1, createdBy: 0 }])
      setShowJoin(false)
      setInviteCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className={styles.center}><div className={styles.spinner} /></div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Mis grupos</h2>
          <p className={styles.subtitle}>Cociná y decidí en familia</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => setShowJoin(true)}>
            Unirse
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            +  Crear
          </Button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showCreate && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Crear grupo</h3>
            <input
              className={styles.modalInput}
              placeholder="Nombre del grupo"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={handleCreate} isLoading={busy}>Crear</Button>
            </div>
          </div>
        </div>
      )}

      {showJoin && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Unirse a un grupo</h3>
            <p className={styles.modalHint}>Ingresá el código de invitación</p>
            <input
              className={styles.modalInput}
              placeholder="Ej: ABC12345"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              autoFocus
            />
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setShowJoin(false)}>Cancelar</Button>
              <Button onClick={handleJoin} isLoading={busy}>Unirse</Button>
            </div>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyVisual}>👥</div>
          <p className={styles.emptyText}>Creá un grupo familiar o unite a uno existente</p>
        </div>
      ) : (
        <div className={styles.list}>
          {groups.map(g => (
            <div key={g.id} className={styles.groupCard} onClick={() => navigate('/groups/' + g.id)}>
              <div className={styles.groupInfo}>
                <strong className={styles.groupName}>{g.name}</strong>
                <span className={styles.groupMeta}>{g.memberCount} miembros</span>
              </div>
              <span className={styles.groupCode}>{g.inviteCode}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
