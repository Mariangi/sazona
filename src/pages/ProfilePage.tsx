import { api } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import AvatarUpload from '../components/profile/AvatarUpload'
import ProfileForm from '../components/profile/ProfileForm'
import ChangePasswordForm from '../components/profile/ChangePasswordForm'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { user, setUser } = useAuth()

  async function handleAvatarUpload(base64: string) {
    const { avatarUrl } = await api.uploadAvatar(base64)
    if (user) setUser({ ...user, avatarUrl })
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>Mi perfil</h2>

      <div className={styles.grid}>
        <div className={styles.card}>
          <AvatarUpload currentUrl={user?.avatarUrl || null} onUpload={handleAvatarUpload} />
        </div>

        <div className={styles.card}>
          <ProfileForm />
        </div>

        <div className={styles.card}>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
