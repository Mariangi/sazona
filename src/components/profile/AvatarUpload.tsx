import { useRef, useState } from 'react'
import styles from './AvatarUpload.module.css'
import { CameraIcon } from '../ui/Icons'

interface AvatarUploadProps {
  currentUrl: string | null
  onUpload: (base64: string) => Promise<void>
}

export default function AvatarUpload({ currentUrl, onUpload }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      setPreview(base64)
      setUploading(true)
      try {
        await onUpload(base64)
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const src = preview || currentUrl

  return (
    <div className={styles.container}>
      <div className={styles.wrapper} onClick={() => inputRef.current?.click()}>
        <div className={styles.avatar}>
          {src ? (
            <img src={src} alt="Avatar" className={styles.img} />
          ) : (
            <span className={styles.initials}>?</span>
          )}
          <div className={styles.overlay}>
            {uploading ? '...' : <CameraIcon width='32'  height='32' fill='#fff'/>}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className={styles.input}
      />
    </div>
  )
}
