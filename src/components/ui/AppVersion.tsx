import styles from './AppVersion.module.css';

const APP_VERSION = ' 1.4.1';

export default function AppVersion() {
  return <p className={styles.version}>Versión{APP_VERSION}</p>;
}
