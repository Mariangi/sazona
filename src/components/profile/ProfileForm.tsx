import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'
import styles from './ProfileForm.module.css'

export default function ProfileForm() {
  const { user, setUser } = useAuth()
  const [email, setEmail] = useState(user?.email || '')
  const [username, setUsername] = useState(user?.username || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const updated = await api.updateProfile({ email, username })
      setUser(updated)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3 className={styles.title}>Datos personales</h3>

      {error && <div className={styles.bannerError}>{error}</div>}
      {success && <div className={styles.bannerSuccess}>Datos actualizados correctamente</div>}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <Button type="submit" isLoading={loading}>
        Guardar cambios
      </Button>
    </form>
  )
}
