import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import Button from '../ui/Button'
import Input from '../ui/Input'
import styles from './ChangePasswordForm.module.css'

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.newPassword !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      await api.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setSuccess(true)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>

      {error && <div className={styles.bannerError}>{error}</div>}
      {success && <div className={styles.bannerSuccess}>Contraseña actualizada correctamente</div>}

      <Input
        label="Contraseña actual"
        type="password"
        value={form.currentPassword}
        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
        required
      />
      <Input
        label="Nueva contraseña"
        type="password"
        value={form.newPassword}
        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        required
      />
      <Input
        label="Confirmar nueva contraseña"
        type="password"
        value={form.confirmPassword}
        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        required
      />

      <Button type="submit" isLoading={loading}>
        Cambiar contraseña
      </Button>
    </form>
  )
}
