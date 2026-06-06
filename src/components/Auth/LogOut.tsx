import { useAuth } from "../../hooks/useAuth";
import styles from "./LogOut.module.css";
export default function LogOut() {
  const { logout } = useAuth();
  function handleLogout() {
    logout();
  }
  return (
    <div className={styles.logoutContainer}>
      <p className={styles.logoutMessage}>
        ¿Estás seguro de que querés cerrar sesión?
      </p>

      <div className={styles.buttonsContainer}>
        <button
          className={styles.cancelbtn}
          onClick={() => window.history.back()}
        >
          Cancelar
        </button>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
