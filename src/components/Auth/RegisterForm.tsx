import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'
import styles from './RegisterForm.module.css'

export default function RegisterForm() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '' })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setIsLoading(true)

    try {
      const res = await api.register({
        email: form.email,
        username: form.username,
        password: form.password,
      })
      localStorage.setItem('token', res.token)
      setUser(res.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.errorBanner}>{error}</div>}


      <Input
        label="Usuario"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        required
        autoComplete="username"
      />

      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
        autoComplete="email"
      />

      <Input
        label="Contraseña"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        autoComplete="new-password"
      />

      <Input
        label="Confirmar contraseña"
        type="password"
        value={form.confirmPassword}
        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        required
        autoComplete="new-password"
      />

      <Button type="submit" isLoading={isLoading}>
        Crear cuenta
      </Button>

      <p className={styles.footer}>
        ¿Ya tienes cuenta? <Link to="/login" className={styles.link}>Inicia sesión</Link>
      </p>
    </form>
  )
}
