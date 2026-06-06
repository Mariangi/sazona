import AuthLayout from '../components/Auth/AuthLayout'
import RegisterForm from '../components/Auth/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthLayout title="Crear cuenta" subtitle="Unite y descubrí recetas increíbles.">
      <RegisterForm />
    </AuthLayout>
  )
}
