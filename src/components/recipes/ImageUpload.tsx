import { useRef, useState } from 'react'
import styles from './ImageUpload.module.css'
import { resolveMediaUrl } from '../../api/client'

interface ImageUploadProps {
  value: string | null
  onChange: (base64: string | null) => void
  existingImage?: string
}

export default function ImageUpload({ value, onChange, existingImage }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value)

  const showExisting = !preview && existingImage

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPreview(result)
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  function handleRemove() {
    setPreview(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>Imagen de la receta</label>
      <div
        className={styles.dropzone}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <div className={styles.preview}>
            <img src={preview} alt="Vista previa" />
            <button
              type="button"
              className={styles.removeBtn}
              onClick={(e) => { e.stopPropagation(); handleRemove() }}
            >
              ×
            </button>
          </div>
        ) : showExisting ? (
          <div className={styles.preview}>
            <img src={resolveMediaUrl(existingImage)} alt="Vista previa" />
            <button
              type="button"
              className={styles.removeBtn}
              onClick={(e) => { e.stopPropagation(); handleRemove() }}
            >
              ×
            </button>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <span>+</span>
            <p>Haz clic para añadir una imagen</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className={styles.hiddenInput}
      />
    </div>
  )
}
