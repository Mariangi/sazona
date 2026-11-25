import { useState } from "react";
import styles from "./MasonryImage.module.css";

interface MasonryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Reserva el espacio de la imagen (según sus dimensiones) antes de descargarla, para que la
 * grilla no se mueva, y la muestra con un fundido cuando termina de cargar.
 */
export default function MasonryImage({ src, alt, width, height, className }: MasonryImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={styles.frame}
      style={{ aspectRatio: width && height ? `${width} / ${height}` : "4 / 5" }}
    >
      <img
        // Si ya estaba en caché puede cargar antes de que React escuche onLoad.
        ref={(img) => {
          if (img?.complete) setLoaded(true);
        }}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`${styles.image} ${loaded ? styles.loaded : ""} ${className ?? ""}`}
      />
    </div>
  );
}
