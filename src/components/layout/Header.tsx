import { Avatar } from "../profile/Avatar";
import { Logo } from "../ui/Icons";
import styles from "./Header.module.css";

export const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Logo height="70"/>
      </div>
      <Avatar />
    </header>
  );
};
