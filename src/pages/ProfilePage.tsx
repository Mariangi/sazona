import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import AvatarUpload from "../components/profile/AvatarUpload";
import ProfileForm from "../components/profile/ProfileForm";
import ChangePasswordForm from "../components/profile/ChangePasswordForm";
import styles from "./ProfilePage.module.css";
import { ArrowRightIcon } from "../components/ui/Icons";
import { Popup } from "../components/ui/Popup";
import { useState } from "react";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [showPopupPassword, setShowPopupPassword] = useState(false);
  const [showPopupEdit, setShowPopupEdit] = useState(false);
  const [showPopupClose, setShowPopupClose] = useState(false);


  async function handleAvatarUpload(base64: string) {
    const { avatarUrl } = await api.uploadAvatar(base64);
    if (user) setUser({ ...user, avatarUrl });
  }

  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        <div className={styles.info}>
          <AvatarUpload
            currentUrl={user?.avatarUrl || null}
            onUpload={handleAvatarUpload}
          />
          <h2>Chef {user?.username}</h2>
        </div>

        {/* <div className={styles.card}>
          <ProfileForm />
        </div>

        <div className={styles.card}>
          <ChangePasswordForm />
        </div> */}

        <div className={styles.card} onClick={() => setShowPopupEdit(true)}>
          <span>Editar perfil</span>
          <ArrowRightIcon height="20" fill="var(--c-text)" />
        </div>

        <div className={styles.card} onClick={() => setShowPopupPassword(true)}>
          <span>Cambiar contraseña</span>
          <ArrowRightIcon height="20" fill="var(--c-text)" />
        </div>

         <div className={styles.card} onClick={() => showPopupClose(true)}>
          <span>Cerrar sesión</span>
          <ArrowRightIcon height="20" fill="var(--c-text)" />
        </div>
      </div>
     {showPopupEdit && (
        <Popup
          title="Editar perfil"
          onClose={() => setShowPopupEdit(false)}
        >
          <ProfileForm />
        </Popup>
      )}

      {showPopupPassword && (
        <Popup
          title="Cambiar contraseña"
          onClose={() => setShowPopupPassword(false)}
        >
          <ChangePasswordForm />
        </Popup>
      )}
       {showPopupClose && (
        <Popup
          title="Cerrar sesión"
          onClose={() => setShowPopupClose(false)}
        >
          <LogOut />
        </Popup>
      )}

    </div>
  );
}
