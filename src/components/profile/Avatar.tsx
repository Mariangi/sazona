export const Avatar = ({ src, alt }: { src?: string; alt?: string }) => {
  return (
    <div style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      overflow: 'hidden',
      backgroundColor: 'var(--c-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid var(--c-border)',
    }}>
      {src ? (
        <img src={src} alt={alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ color: 'var(--c-primary)', fontWeight: 700, fontSize: '0.9rem' }}>?</span>
      )}
    </div>
  )
}
