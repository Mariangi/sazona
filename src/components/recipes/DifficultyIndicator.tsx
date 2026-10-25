import styles from "./DifficultyIndicator.module.css";

interface DifficultyIndicatorProps {
  value: number;
  onChange?: (value: number) => void;
  size?: string;
  showLabel?: boolean;
  light?: boolean;
}

export default function DifficultyIndicator({
  value,
  onChange,
  size = "12",
  showLabel = true,
  light = false,
}: DifficultyIndicatorProps) {
  const interactive = !!onChange;

  return (
    <div className={`${styles.wrapper} ${light ? styles.light : ""}`}>
      {showLabel && <span className={styles.label}>Dificultad</span>}
      <div className={styles.dots}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`${styles.dot} ${n <= value ? styles.filled : ""} ${interactive ? styles.interactive : ""}`}
            style={{ width: `${size}px`, height: `${size}px` }}
            onClick={interactive ? () => onChange!(n) : undefined}
            disabled={!interactive}
            aria-label={`Dificultad ${n}`}
          />
        ))}
      </div>
    </div>
  );
}
