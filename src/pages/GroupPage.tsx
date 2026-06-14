import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { GroupMessage } from '@sasona/shared'
import { api } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import MultiplierModal from '../components/groups/MultiplierModal'
import RecipePickerModal from '../components/groups/RecipePickerModal'
import styles from './GroupPage.module.css'
import { ArrowLeftIcon, CutleryIcon, EditIcon, ThumbDownIcon, ThumbsUpDownIcon, ThumbUpIcon } from '../components/ui/Icons'

export default function GroupPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [group, setGroup] = useState<any>(null)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [showRecipePicker, setShowRecipePicker] = useState(false)
  const [recipes, setRecipes] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')
  const [showMultiplierModal, setShowMultiplierModal] = useState(false)
  const [pendingCloseVoteMsgId, setPendingCloseVoteMsgId] = useState<number | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  function startEdit() {
    setEditNameValue(group?.name ?? '')
    setEditingName(true)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  async function handleSaveName() {
    if (!editNameValue.trim() || !id) return
    try {
      const updated = await api.updateGroup(Number(id), editNameValue.trim())
      setGroup((prev: any) => ({ ...prev, name: updated.name }))
      setEditingName(false)
    } catch {}
  }

  useEffect(() => {
    if (!id) return
    const gid = Number(id)
    api.getGroup(gid).then(setGroup).catch(() => navigate('/groups'))
    api.getMessages(gid).then(setMessages).catch(() => {})
    api.getAllRecipes().then(setRecipes).catch(() => {})
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(recipeId?: number) {
    if (!text.trim() && !recipeId) return
    if (!id) return
    setSending(true)
    try {
      const msg = await api.sendMessage(Number(id), {
        message: text.trim() || undefined,
        recipeId,
      })
      setMessages(prev => [msg, ...prev])
      setText('')
      setShowRecipePicker(false)
    } catch {} finally {
      setSending(false)
    }
  }

  async function handleVote(msgId: number, vote: string) {
    try {
      const res = await api.castVote(msgId, vote)
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, votes: res, userVote: res.userVote } : m
      ))
    } catch {}
  }

  async function handleCloseVote(msgId: number) {
    setPendingCloseVoteMsgId(msgId)
    setShowMultiplierModal(true)
  }

  async function handleConfirmCloseVote(multiplier: number) {
    if (!pendingCloseVoteMsgId) return
    try {
      const res = await api.closeVote(pendingCloseVoteMsgId, multiplier)
      setMessages(prev => prev.map(m =>
        m.id === pendingCloseVoteMsgId ? { ...m, status: res.accepted ? 'accepted' : 'active' } : m
      ))
      if (res.accepted && res.shoppingListId) {
        const msg = messages.find(m => m.id === pendingCloseVoteMsgId)
        const recipeName = msg?.recipeName || 'la receta'
        const listMsg = await api.sendMessage(Number(id), {
          message: `📋 "${recipeName}" fue aceptada! Se generó una lista de compras.`,
        })
        setMessages(prev => [listMsg, ...prev])
        navigate('/shopping-lists/' + res.shoppingListId)
      }
    } catch {} finally {
      setShowMultiplierModal(false)
      setPendingCloseVoteMsgId(null)
    }
  }

  function handleCancelCloseVote() {
    setShowMultiplierModal(false)
    setPendingCloseVoteMsgId(null)
  }

  const isOwn = (uid: number) => uid === user?.id

  if (loading) return <div className={styles.center}><div className={styles.spinner} /></div>
  if (!group) return <div className={styles.center}>Grupo no encontrado</div>

  return (
    <div className={styles.container}>
      <MultiplierModal
        isOpen={showMultiplierModal}
        onConfirm={handleConfirmCloseVote}
        onCancel={handleCancelCloseVote}
      />

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/groups')}><ArrowLeftIcon height='12' width='12' fill='var(--c-primary)'/> Grupos</button>
        <div className={styles.nameRow}>
          {editingName ? (
            <div className={styles.editNameRow}>
              <input
                ref={editInputRef}
                className={styles.nameInput}
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' ? handleSaveName() : e.key === 'Escape' ? setEditingName(false) : undefined}
              />
              <button className={styles.saveNameBtn} onClick={handleSaveName}>Guardar</button>
              <button className={styles.cancelNameBtn} onClick={() => setEditingName(false)}>Cancelar</button>
            </div>
          ) : (
            <div className={styles.nameDisplay}>
              <h2 className={styles.groupName}>{group.name}</h2>
              <button className={styles.editNameBtn} onClick={startEdit} title="Editar nombre">
                <EditIcon height="16" width="16" fill="var(--c-text-tertiary)" />
              </button>
            </div>
          )}
          <span className={styles.groupCode}>Código: {group.inviteCode} · {group.memberCount} miembros</span>
        </div>
      </div>

      <div className={styles.chat}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            {/* <div className={styles.emptyVisual}></div> */}
            <p>No hay mensajes aún. ¡Proponé una cena!</p>
          </div>
        )}

        {[...messages].reverse().map(msg => (
          <div key={msg.id} className={`${styles.bubbleWrapper} ${isOwn(msg.userId) ? styles.own : ''}`}>
            <div className={`${styles.bubble} ${msg.recipeId ? styles.proposal : ''}`}>
              <div className={styles.bubbleHeader}>
                <span className={styles.bubbleUser}>{msg.username}</span>
                <span className={styles.bubbleTime}>{new Date(msg.createdAt).toLocaleString()}</span>
              </div>

              {msg.message && <p className={styles.bubbleText}>{msg.message}</p>}

              {msg.recipeId && (
                <div className={styles.proposalCard}>
                  <span className={styles.proposalRecipe}>{msg.recipeName}</span>

                  {msg.status === 'voting' && (
                    <div className={styles.votes}>
                      <div className={styles.voteButtons}>
                        <button
                          className={`${styles.voteBtn} ${msg.userVote === 'si' ? styles.votedSi : ''}`}
                          onClick={() => handleVote(msg.id, 'si')}
                        ><ThumbUpIcon height='18' width='18' /> {msg.votes.si}</button>
                        <button
                          className={`${styles.voteBtn} ${msg.userVote === 'no' ? styles.votedNo : ''}`}
                          onClick={() => handleVote(msg.id, 'no')}
                        ><ThumbDownIcon height='18' width='18'/> {msg.votes.no}</button>
                        <button
                          className={`${styles.voteBtn} ${msg.userVote === 'tal_vez' ? styles.votedMaybe : ''}`}
                          onClick={() => handleVote(msg.id, 'tal_vez')}
                        ><ThumbsUpDownIcon height='18' width='18'/> {msg.votes.tal_vez}</button>
                      </div>
                      <button className={styles.closeVoteBtn} onClick={() => handleCloseVote(msg.id)}>
                        Cerrar votación
                      </button>
                    </div>
                  )}

                  {msg.status === 'accepted' && (
                    <div className={styles.acceptedBadge}> Aceptada</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className={styles.inputArea}>
        {showRecipePicker && (
          <RecipePickerModal
            onSelect={(recipeId) => handleSend(recipeId)}
            onClose={() => setShowRecipePicker(false)}
          />
        )}

        <div className={styles.inputRow}>
          <button className={styles.attachBtn} onClick={() => setShowRecipePicker(true)} title="Proponer receta">
            <CutleryIcon height='32' width='32' fill='var(--c-primary)'/>
          </button>
          <input
            className={styles.chatInput}
            placeholder="Escribí un mensaje..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className={styles.sendBtn} onClick={() => handleSend()} disabled={sending || !text.trim()}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
