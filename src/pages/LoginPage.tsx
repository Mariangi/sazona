import AuthLayout from '../components/Auth/AuthLayout'
import LoginForm from '../components/Auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthLayout title="Sazoná" subtitle="Descubrí qué comer hoy.">
      <LoginForm />
    </AuthLayout>
  )
}
