import AuthLayout from '../components/Auth/AuthLayout'
import LoginForm from '../components/Auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthLayout title="Sasona" subtitle="Inicia sesión para continuar">
      <LoginForm />
    </AuthLayout>
  )
}
