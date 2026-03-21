/**
 * UserAvatar — shows profile picture if set, otherwise initials fallback.
 * Props:
 *   user        – PublicUser object (needs first_name, last_name, profile_picture)
 *   size        – pixel size of the circle (default 36)
 *   fontSize    – font size for initials (default auto)
 *   className   – extra class names
 *   style       – extra inline styles
 */
export default function UserAvatar({ user, size = 36, fontSize, className = '', style = {} }) {
  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase()
  const fs = fontSize ?? Math.round(size * 0.35) + 'px'

  const base = {
    width:        size,
    height:       size,
    borderRadius: '50%',
    flexShrink:   0,
    objectFit:    'cover',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
    ...style,
  }

  if (user?.profile_picture) {
    return (
      <img
        src={user.profile_picture}
        alt={`${user.first_name} ${user.last_name}`}
        className={className}
        style={{ ...base, display: 'block' }}
        onError={e => {
          // If image fails to load fall back gracefully
          e.target.style.display = 'none'
          e.target.nextSibling && (e.target.nextSibling.style.display = 'flex')
        }}
      />
    )
  }

  return (
    <div
      className={className}
      style={{
        ...base,
        background:  'var(--accent)',
        color:       'var(--bg)',
        fontWeight:  700,
        fontSize:    fs,
        fontFamily:  "'Outfit', sans-serif",
      }}
    >
      {initials || '?'}
    </div>
  )
}
