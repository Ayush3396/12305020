import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import './index.css'

const API_BASE = 'http://localhost:3000/api'
const STUDENT_ID = 'stu_12305020'

const TYPE_ICONS = {
  Placement: '💼',
  Event: '🎉',
  Result: '📊',
}

const TYPE_TABS = ['All', 'Placement', 'Event', 'Result']

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ── Toast ──────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ── Create Notification Modal ──────────────────────────────
function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    studentId: STUDENT_ID,
    type: 'Placement',
    title: '',
    message: '',
    priority: 'medium',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) return
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/notifications`, form)
      onCreated(res.data.data)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">✏️ Create Notification</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" name="type" value={form.type} onChange={handleChange}>
              <option value="Placement">💼 Placement</option>
              <option value="Event">🎉 Event</option>
              <option value="Result">📊 Result</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Notification title..."
              maxLength={200}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              className="form-textarea"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Notification message..."
              maxLength={2000}
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" id="cancel-create-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="submit-create-btn" disabled={loading}>
              {loading ? 'Creating...' : '✨ Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Notification Card ──────────────────────────────────────
function NotificationCard({ notification, onMarkRead, onDelete }) {
  return (
    <div
      className={`notification-card ${notification.isRead ? 'read' : 'unread'} priority-${notification.priority}`}
      data-type={notification.type}
      id={`notification-${notification.id}`}
    >
      <div className="card-top">
        <div className="card-left">
          <div className="card-type-icon">{TYPE_ICONS[notification.type]}</div>
          <div className="card-title-row">
            <div className="card-title">{notification.title}</div>
            <div className="card-meta">
              <span className={`type-badge ${notification.type}`}>{notification.type}</span>
              {notification.priority !== 'low' && (
                <span className={`priority-badge ${notification.priority}`}>
                  {notification.priority === 'high' ? '🔴 High' : '🟡 Medium'}
                </span>
              )}
              {!notification.isRead && <span className="unread-dot" />}
            </div>
          </div>
        </div>
        <div className="card-right">
          <span className="card-time">{timeAgo(notification.createdAt)}</span>
          <div className="card-actions">
            <button
              className="icon-btn"
              id={`mark-read-${notification.id}`}
              title={notification.isRead ? 'Mark unread' : 'Mark read'}
              onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id, !notification.isRead) }}
            >
              {notification.isRead ? '○' : '✓'}
            </button>
            <button
              className="icon-btn delete"
              id={`delete-${notification.id}`}
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      <div className="card-message">{notification.message}</div>
    </div>
  )
}

// ── Priority Inbox ─────────────────────────────────────────
function PriorityInbox({ notifications, onMarkRead, onDelete }) {
  if (notifications.length === 0) return null

  return (
    <div className="priority-inbox">
      <div className="priority-inbox-header">
        <div className="priority-inbox-title">
          <span className="emoji">🔴</span>
          Priority Inbox
          <span className="priority-count-badge">{notifications.length}</span>
        </div>
      </div>
      <div className="notifications-list">
        {notifications.map((n) => (
          <NotificationCard key={n.id} notification={n} onMarkRead={onMarkRead} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

// ── Skeleton Loader ────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="notifications-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
          <div className="skeleton-line" style={{ height: '8px', marginTop: '12px' }} />
          <div className="skeleton-line medium" style={{ height: '8px' }} />
        </div>
      ))}
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const [notifications, setNotifications] = useState([])
  const [priorityInbox, setPriorityInbox] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const [loading, setLoading] = useState(true)
  const [sseConnected, setSseConnected] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toasts, setToasts] = useState([])
  const [tabCounts, setTabCounts] = useState({ All: 0, Placement: 0, Event: 0, Result: 0 })
  const eventSourceRef = useRef(null)

  // ── Toast helper ──
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async () => {
    try {
      const [allRes, priorityRes] = await Promise.all([
        axios.get(`${API_BASE}/notifications`, { params: { studentId: STUDENT_ID, limit: 100 } }),
        axios.get(`${API_BASE}/notifications/priority-inbox`, { params: { studentId: STUDENT_ID } }),
      ])

      const all = allRes.data.data.notifications
      setNotifications(all)
      setPriorityInbox(priorityRes.data.data.notifications)

      // Compute tab counts
      const counts = { All: all.length, Placement: 0, Event: 0, Result: 0 }
      all.forEach((n) => { counts[n.type] = (counts[n.type] || 0) + 1 })
      setTabCounts(counts)
    } catch (err) {
      showToast('Failed to load notifications', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // ── SSE connection ──
  useEffect(() => {
    const url = `${API_BASE}/notifications/stream?studentId=${STUDENT_ID}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener('connected', () => setSseConnected(true))
    es.addEventListener('ping', () => {})
    es.addEventListener('notification', (e) => {
      const newNotif = JSON.parse(e.data)
      setNotifications((prev) => [newNotif, ...prev])
      if (newNotif.priority === 'high' && !newNotif.isRead) {
        setPriorityInbox((prev) => [newNotif, ...prev])
      }
      setTabCounts((prev) => ({
        ...prev,
        All: prev.All + 1,
        [newNotif.type]: (prev[newNotif.type] || 0) + 1,
      }))
      showToast(`New ${newNotif.type}: ${newNotif.title}`, 'info')
    })

    es.onerror = () => setSseConnected(false)

    return () => es.close()
  }, [showToast])

  // ── Mark read ──
  const handleMarkRead = useCallback(async (id, isRead) => {
    try {
      await axios.patch(`${API_BASE}/notifications/${id}/read`, { isRead }, {
        params: { studentId: STUDENT_ID },
      })
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, isRead, updatedAt: new Date().toISOString() } : n)
      )
      setPriorityInbox((prev) =>
        isRead ? prev.filter((n) => n.id !== id) : prev
      )
      showToast(isRead ? 'Marked as read' : 'Marked as unread', 'success')
    } catch {
      showToast('Failed to update notification', 'error')
    }
  }, [showToast])

  // ── Delete ──
  const handleDelete = useCallback(async (id) => {
    try {
      await axios.delete(`${API_BASE}/notifications/${id}`, { params: { studentId: STUDENT_ID } })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setPriorityInbox((prev) => prev.filter((n) => n.id !== id))
      setTabCounts((prev) => {
        const deleted = notifications.find((n) => n.id === id)
        if (!deleted) return prev
        return { ...prev, All: prev.All - 1, [deleted.type]: prev[deleted.type] - 1 }
      })
      showToast('Notification deleted', 'success')
    } catch {
      showToast('Failed to delete notification', 'error')
    }
  }, [notifications, showToast])

  // ── Mark all read ──
  const handleMarkAllRead = useCallback(async () => {
    try {
      await axios.patch(`${API_BASE}/notifications/read-all`, { studentId: STUDENT_ID })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setPriorityInbox([])
      showToast('All notifications marked as read', 'success')
    } catch {
      showToast('Failed to mark all as read', 'error')
    }
  }, [showToast])

  // ── Created callback ──
  const handleCreated = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev])
    if (notification.priority === 'high') {
      setPriorityInbox((prev) => [notification, ...prev])
    }
    setTabCounts((prev) => ({
      ...prev,
      All: prev.All + 1,
      [notification.type]: (prev[notification.type] || 0) + 1,
    }))
    showToast('Notification created!', 'success')
  }, [showToast])

  // ── Filtered list ──
  const filteredNotifications = notifications.filter(
    (n) => activeTab === 'All' || n.type === activeTab
  )

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <>
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="header-icon">🔔</div>
            <div>
              <div className="header-title">Campus Notifications</div>
              <div className="header-subtitle">Roll No: 12305020 · Ayush Kumar</div>
            </div>
          </div>
          <div className="header-right">
            <div className={`sse-indicator ${sseConnected ? '' : 'disconnected'}`}>
              <span className="sse-dot" />
              {sseConnected ? 'Live' : 'Offline'}
            </div>
            {unreadCount > 0 && (
              <div className="unread-badge">{unreadCount} unread</div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="app-container">
        <main className="main-content">

          {/* Priority Inbox */}
          {!loading && (
            <PriorityInbox
              notifications={priorityInbox}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          )}

          {/* All Notifications Section */}
          <div className="section-title">All Notifications</div>

          <div className="tabs-container">
            <div className="tabs" id="notification-tabs">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab}
                  id={`tab-${tab.toLowerCase()}`}
                  className={`tab ${activeTab === tab ? 'active' : ''}`}
                  data-type={tab}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab !== 'All' && TYPE_ICONS[tab]} {tab}
                  <span className="tab-count">{tabCounts[tab] || 0}</span>
                </button>
              ))}
            </div>
            <div className="actions-bar">
              <button className="btn" id="mark-all-read-btn" onClick={handleMarkAllRead}>
                ✓ Mark all read
              </button>
              <button className="btn btn-primary" id="create-notification-btn" onClick={() => setShowCreateModal(true)}>
                + New
              </button>
            </div>
          </div>

          {/* Notification List */}
          {loading ? (
            <SkeletonLoader />
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <span className="emoji">
                {activeTab === 'Placement' ? '💼' : activeTab === 'Event' ? '🎉' : activeTab === 'Result' ? '📊' : '🔔'}
              </span>
              <h3>No {activeTab === 'All' ? '' : activeTab} notifications</h3>
              <p>You're all caught up!</p>
            </div>
          ) : (
            <div className="notifications-list" id="notifications-list">
              {filteredNotifications.map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* ── Toasts ── */}
      <Toast toasts={toasts} />
    </>
  )
}
