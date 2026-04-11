import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './NotificationBell.css'

const POLL_INTERVAL = 30_000 // 30 seconds

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function iconClass(type) {
  if (type === 'feedback') return 'notif-icon-feedback bi bi-chat-quote'
  if (type === 'remark')   return 'notif-icon-remark bi bi-shield-exclamation'
  return 'notif-icon-info bi bi-info-circle'
}

export default function NotificationBell({ dir = 'down' }) {
  const [open,    setOpen]    = useState(false)
  const [notifs,  setNotifs]  = useState([])
  const [unread,  setUnread]  = useState(0)
  const panelRef = useRef(null)
  const btnRef   = useRef(null)
  const navigate = useNavigate()

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/count')
      setUnread(data.unread)
    } catch { /* silently fail on polling errors */ }
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/')
      setNotifs(data)
      setUnread(data.filter(n => !n.is_read).length)
    } catch { /* ignore */ }
  }, [])

  // Initial load + poll
  useEffect(() => {
    fetchCount()
    const id = setInterval(fetchCount, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchCount])

  // Open panel → fetch full list
  useEffect(() => {
    if (open) fetchAll()
  }, [open, fetchAll])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current   && !btnRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkRead = async (n) => {
    console.log("Notification clicked:", n);
    
    // Navigate immediately if there's a link
    if (n.link) {
      console.log("Navigating to link:", n.link);
      setOpen(false)
      navigate(n.link)
    } else {
      console.warn("This notification has no link attached.");
    }

    // Then mark as read in the background
    if (!n.is_read) {
      try {
        await api.post(`/notifications/${n.id}/read`)
        setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
        setUnread(prev => Math.max(0, prev - 1))
      } catch (err) {
        console.error("Failed to mark notification as read:", err)
      }
    }
  }

  const handleMarkAll = async () => {
    await api.post('/notifications/read-all').catch(() => {})
    setNotifs(prev => prev.map(x => ({ ...x, is_read: true })))
    setUnread(0)
  }

  return (
    <div className={`notif-bell-wrap dir-${dir}`}>
      <button
        ref={btnRef}
        className={`notif-bell-btn${unread > 0 ? ' has-unread' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        aria-label={`${unread} unread notifications`}
      >
        <i className={`bi ${unread > 0 ? 'bi-bell-fill' : 'bi-bell'}`} />
        {unread > 0 && (
          <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel" ref={panelRef}>
          <div className="notif-panel-header">
            <div className="notif-panel-title">
              <i className="bi bi-bell" />
              Notifications
              {unread > 0 && (
                <span className="notif-badge" style={{ position:'static', border:'none' }}>
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAll}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifs.length === 0 ? (
              <div className="notif-empty">
                <i className="bi bi-bell-slash" />
                <span>You're all caught up!</span>
              </div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                className={`notif-item${!n.is_read ? ' unread' : ''}`}
                onClick={() => handleMarkRead(n)}
              >
                <div className={`notif-icon-wrap ${iconClass(n.notif_type).split(' ')[0]}`}>
                  <i className={iconClass(n.notif_type).split(' ').slice(1).join(' ')} />
                </div>
                <div className="notif-body">
                  <div className="notif-msg">{n.message}</div>
                  <div className="notif-time">{timeAgo(n.created_at)}</div>
                </div>
                {!n.is_read && <div className="notif-unread-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
