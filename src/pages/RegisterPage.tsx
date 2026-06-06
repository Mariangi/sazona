import AuthLayout from '../components/Auth/AuthLayout'
import RegisterForm from '../components/Auth/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthLayout title="Crear cuenta" subtitle="Regístrate para empezar a organizar tus comidas">
      <RegisterForm />
    </AuthLayout>
  )
}
