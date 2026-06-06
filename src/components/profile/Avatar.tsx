 export const Avatar = ({ src, alt }: { src: string, alt: string }) => {
  return (
    <div style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      overflow: 'hidden',
      backgroundColor: '#eee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {src ? (
        <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ color: '#888' }}>?</span>
      )}
    </div>
  )
}