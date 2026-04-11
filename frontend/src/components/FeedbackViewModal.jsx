// Read-only modal for students to view their submitted feedback + admin reply

const MOODS = [
  { value:1, icon:'bi-emoji-angry-fill',   label:'Terrible', color:'#e67e80' },
  { value:2, icon:'bi-emoji-frown-fill',   label:'Poor',     color:'#e69875' },
  { value:3, icon:'bi-emoji-neutral-fill', label:'Okay',     color:'#dbbc7f' },
  { value:4, icon:'bi-emoji-smile-fill',   label:'Good',     color:'#7fbbb3' },
  { value:5, icon:'bi-emoji-laughing-fill',label:'Excellent',color:'#a7c080' },
]

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function FeedbackViewModal({ entry, onClose }) {
  const mood = MOODS.find(m => m.value === entry.rating)
  const hasReply = !!entry.admin_reply

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9050, padding:'1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg1)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
        animation: 'fbViewIn 0.2s cubic-bezier(.34,1.56,.64,1)',
        overflow: 'hidden',
      }}>

        {/* Header bar */}
        <div style={{
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(127,187,179,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="bi bi-chat-quote-fill" style={{ color:'var(--blue)', fontSize:'0.85rem' }} />
            </div>
            <div>
              <div style={{ fontFamily:'Playfair Display, serif', fontSize:'0.9rem', color:'var(--fg)', fontWeight:600 }}>Your Feedback</div>
              <div style={{ fontSize:'0.68rem', color:'var(--fg-dim)', marginTop:'1px' }}>
                {entry.purpose} · Lab {entry.lab} · {formatDate(entry.created_at)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--fg-dim)', fontSize:'1rem', lineHeight:1, padding:'4px' }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div style={{ padding:'1.25rem' }}>

          {/* Mood display */}
          {mood && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: `rgba(${hexToRgb(mood.color)}, 0.08)`,
              border: `1px solid rgba(${hexToRgb(mood.color)}, 0.25)`,
              borderRadius: '10px',
              marginBottom: '1rem',
            }}>
              <i className={`bi ${mood.icon}`} style={{ fontSize:'2rem', color: mood.color, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--fg-dim)', marginBottom:'0.1rem' }}>Your Rating</div>
                <div style={{ fontSize:'1rem', fontWeight:700, color: mood.color }}>{mood.label}</div>
              </div>
            </div>
          )}

          {/* Written feedback */}
          <div style={{ marginBottom:'1.1rem' }}>
            <div style={{ fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--fg-dim)', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <i className="bi bi-person-fill" /> Your Feedback
            </div>
            <div style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.85rem',
              fontSize: '0.84rem',
              color: 'var(--fg)',
              lineHeight: 1.65,
              fontStyle: 'italic',
            }}>
              "{entry.content}"
            </div>
          </div>

          {/* Admin remark */}
          {hasReply ? (
            <div>
              <div style={{ fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--accent)', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <i className="bi bi-shield-check" /> Admin Remark
                <span style={{ marginLeft:'auto', color:'var(--fg-dim)', textTransform:'none', letterSpacing:'normal', fontSize:'0.65rem' }}>
                  {formatDate(entry.replied_at)}
                </span>
              </div>
              <div style={{
                background: 'rgba(219,188,127,0.06)',
                border: '1px solid rgba(219,188,127,0.25)',
                borderRadius: '8px',
                padding: '0.85rem',
                fontSize: '0.84rem',
                color: 'var(--fg)',
                lineHeight: 1.65,
                position: 'relative',
              }}>
                {/* Admin badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'rgba(219,188,127,0.15)',
                  border: '1px solid rgba(219,188,127,0.3)',
                  borderRadius: '20px',
                  padding: '0.15rem 0.55rem',
                  fontSize: '0.65rem',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  marginBottom: '0.55rem',
                }}>
                  <i className="bi bi-patch-check-fill" style={{ fontSize:'0.7rem' }} />
                  CCS Administrator
                </div>
                <div>{entry.admin_reply}</div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '1.25rem',
              background: 'var(--bg2)',
              border: '1px dashed var(--border)',
              borderRadius: '10px',
              textAlign: 'center',
            }}>
              <i className="bi bi-hourglass-split" style={{ fontSize:'1.4rem', color:'var(--fg-dim)', opacity:0.5 }} />
              <div style={{ fontSize:'0.8rem', color:'var(--fg-dim)', fontWeight:500 }}>No remark yet</div>
              <div style={{ fontSize:'0.72rem', color:'var(--fg-dim)', opacity:0.7 }}>
                The admin hasn't left a response. You'll be notified if they do.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop:'1px solid var(--border)', padding:'0.75rem 1.25rem', display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fbViewIn { from { opacity:0; transform:scale(0.96) translateY(6px) } to { opacity:1; transform:scale(1) translateY(0) } }
      `}</style>
    </div>
  )
}

// Helper: convert hex to rgb triplet string for rgba()
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}
