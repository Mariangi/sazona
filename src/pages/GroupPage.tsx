import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { GroupMessage } from '@sasona/shared'
import { api } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import styles from './GroupPage.module.css'
import { ArrowLeftIcon, CutleryIcon, ThumbDownIcon, ThumbsUpDownIcon, ThumbUpIcon } from '../components/ui/Icons'

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
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    const gid = Number(id)
    api.getGroup(gid).then(setGroup).catch(() => navigate('/groups'))
    api.getMessages(gid).then(setMessages).catch(() => {})
    api.getRecipes().then(setRecipes).catch(() => {})
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
    try {
      const res = await api.closeVote(msgId)
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, status: res.accepted ? 'accepted' : 'active' } : m
      ))
      if (res.accepted) {
        alert(' Propuesta aceptada! Se generó una lista de compras.')
      }
    } catch {}
  }

  const isOwn = (uid: number) => uid === user?.id

  if (loading) return <div className={styles.center}><div className={styles.spinner} /></div>
  if (!group) return <div className={styles.center}>Grupo no encontrado</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/groups')}><ArrowLeftIcon height='12' width='12' fill='var(--c-primary)'/> Grupos</button>
        <div>
          <h2 className={styles.groupName}>{group.name}</h2>
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
          <div className={styles.recipePicker}>
            <span className={styles.pickerTitle}>Elegí una receta:</span>
            <div className={styles.pickerScroll}>
              {recipes.map(r => (
                <button key={r.id} className={styles.pickerItem} onClick={() => handleSend(r.id)}>
                  {r.name}
                </button>
              ))}
            </div>
            <button className={styles.pickerCancel} onClick={() => setShowRecipePicker(false)}>
              Cancelar
            </button>
          </div>
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
