import { StarIcon } from "../ui/Icons";
import styles from "./DifficultyStars.module.css";

interface DifficultyStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: string;
}

export default function DifficultyStars({ value, onChange, size = "20" }: DifficultyStarsProps) {
  const interactive = !!onChange;

  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`${styles.star} ${interactive ? styles.interactive : ""}`}
          onClick={interactive ? () => onChange!(n) : undefined}
          disabled={!interactive}
          aria-label={`Dificultad ${n}`}
        >
          <StarIcon
            width={size}
            height={size}
            fill={n <= value ? "var(--c-primary)" : "var(--c-border)"}
          />
        </button>
      ))}
    </div>
  );
}
