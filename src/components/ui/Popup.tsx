import { ReactNode } from "react";
import styles from "./Popup.module.css";

type PopupProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export const Popup = ({ title, onClose, children }: PopupProps) => {
  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        {children}
      </div>
    </div>
  );
};
