import styles from './AppVersion.module.css';

const APP_VERSION = ' 1.2.0';

export default function AppVersion() {
  return <p className={styles.version}>Versión{APP_VERSION}</p>;
}
