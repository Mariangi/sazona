import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Header.module.css";
import { Logo } from "../ui/Icons";

export const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <NavLink to="/dashboard">
          <Logo height="45" />
        </NavLink>
      </div>
      <button className={styles.avatarBtn} onClick={() => navigate("/profile")}>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" />
        ) : (
          user?.username?.[0]?.toUpperCase() || "?"
        )}
      </button>
    </header>
  );
};
