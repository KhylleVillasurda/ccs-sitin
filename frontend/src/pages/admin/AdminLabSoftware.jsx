import { useState, useEffect, useCallback } from 'react'
import api from '../../api'

const LABS = ['524', '526', '528', '530', '542']

const CATEGORIES = [
  'IDE',
  'Language',
  'Compiler',
  'Networking',
  'Virtualization',
  'Version Control',
  'Database Tools',
  'Utilities',
  'Other',
]

const ICON_SUGGESTIONS = [
  { icon: 'bi-code-slash',       label: 'Code Editor'       },
  { icon: 'bi-window',           label: 'Desktop App'       },
  { icon: 'bi-filetype-py',      label: 'Python'            },
  { icon: 'bi-cup-hot-fill',     label: 'Java'              },
  { icon: 'bi-terminal',         label: 'Terminal/Compiler' },
  { icon: 'bi-git',              label: 'Git'               },
  { icon: 'bi-folder-symlink',   label: 'File Transfer'     },
  { icon: 'bi-router',           label: 'Networking'        },
  { icon: 'bi-hdd-rack',         label: 'Virtualization'    },
  { icon: 'bi-database',         label: 'Database'          },
  { icon: 'bi-globe',            label: 'Web / Browser'     },
  { icon: 'bi-tools',            label: 'Utility'           },
  { icon: 'bi-shield-check',     label: 'Security'          },
  { icon: 'bi-diagram-3',        label: 'Diagram/UML'       },
  { icon: 'bi-filetype-php',     label: 'PHP'               },
  { icon: 'bi-filetype-java',    label: 'Java File'         },
  { icon: 'bi-filetype-cs',      label: 'C#'                },
]

const EMPTY_FORM = {
  lab: '524',
  name: '',
  icon: 'bi-code-slash',
  description: '',
  version: '',
  category: 'IDE',
}

/* ── Add / Edit Modal ── */
function SoftwareFormModal({ initial, editingId, onClose, onSaved }) {
  const [form,    setForm]    = useState(initial ?? EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { setError('Software name is required.'); return }
    setLoading(true); setError('')
    try {
      if (editingId) {
        await api.put(`/lab-software/${editingId}`, form)
      } else {
        await api.post('/lab-software/', form)
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <span className="modal-title">
            <i className={`bi ${editingId ? 'bi-pencil' : 'bi-plus-circle'}`} />
            {' '}{editingId ? 'Edit Software' : 'Add Software'}
          </span>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="bi bi-exclamation-triangle-fill" /> {error}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="label">Lab Room *</label>
            <select className="select" value={form.lab} onChange={e => set('lab', e.target.value)}>
              {LABS.map(l => <option key={l} value={l}>Lab {l}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Category</label>
            <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="label">Software Name *</label>
          <input className="input" placeholder="e.g. Visual Studio Code" value={form.name}
            onChange={e => set('name', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="label">Version (optional)</label>
            <input className="input" placeholder="e.g. 1.89.0" value={form.version}
              onChange={e => set('version', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Icon Preview</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
              <span style={{
                width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'var(--bg3)', fontSize: '1.2rem', color: 'var(--accent)',
              }}>
                <i className={`bi ${form.icon || 'bi-app'}`} />
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--fg-dim)' }}>{form.icon || '—'}</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="label">Icon Class (Bootstrap Icons)</label>
          <input className="input" placeholder="bi-code-slash" value={form.icon}
            onChange={e => set('icon', e.target.value)} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
            {ICON_SUGGESTIONS.map(({ icon, label }) => (
              <button
                key={icon}
                type="button"
                title={label}
                onClick={() => set('icon', icon)}
                style={{
                  padding: '0.3rem 0.55rem', border: '1px solid var(--border)', borderRadius: 6,
                  background: form.icon === icon ? 'var(--accent)' : 'var(--bg2)',
                  color: form.icon === icon ? 'var(--bg)' : 'var(--fg)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem',
                  transition: 'all 0.15s',
                }}
              >
                <i className={`bi ${icon}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="label">Description (optional)</label>
          <input className="input" placeholder="Brief description shown to students"
            value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading
              ? <><i className="bi bi-hourglass-split" /> Saving…</>
              : <><i className={`bi ${editingId ? 'bi-check-lg' : 'bi-plus-lg'}`} /> {editingId ? 'Save Changes' : 'Add Software'}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Delete Confirm ── */
function DeleteConfirm({ item, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const confirm = async () => {
    setLoading(true)
    try {
      await api.delete(`/lab-software/${item.id}`)
      onDeleted()
    } catch { }
    finally { setLoading(false) }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <span className="modal-title"><i className="bi bi-trash3 text-red" /> Remove Software</span>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        <p style={{ color: 'var(--fg-dim)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Remove <strong style={{ color: 'var(--fg)' }}>{item.name}</strong> from Lab {item.lab}?
          Students will no longer see it listed.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={confirm} disabled={loading}>
            {loading ? 'Removing…' : <><i className="bi bi-trash3" /> Remove</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Software Card ── */
function SoftwareCard({ item, onEdit, onDelete }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
      padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-muted, rgba(219,188,127,.15))' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg3)', flexShrink: 0,
        fontSize: '1.25rem', color: 'var(--accent)',
      }}>
        <i className={`bi ${item.icon || 'bi-app'}`} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: 'var(--fg)', fontSize: '0.9rem' }}>{item.name}</span>
          {item.version && (
            <span style={{
              fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: 4,
              background: 'var(--bg3)', color: 'var(--fg-dim)', fontFamily: 'monospace',
            }}>v{item.version}</span>
          )}
          {item.category && (
            <span style={{
              fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: 10,
              background: 'var(--accent)', color: 'var(--bg)', fontWeight: 600,
            }}>{item.category}</span>
          )}
        </div>
        {item.description && (
          <div style={{ fontSize: '0.78rem', color: 'var(--fg-dim)', marginTop: '0.15rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.description}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
        <button className="btn btn-sm btn-ghost" onClick={() => onEdit(item)} title="Edit">
          <i className="bi bi-pencil" />
        </button>
        <button className="btn btn-sm btn-ghost"
          style={{ color: 'var(--red)' }} onClick={() => onDelete(item)} title="Remove">
          <i className="bi bi-trash3" />
        </button>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function AdminLabSoftware() {
  const [allSoftware, setAllSoftware] = useState([])
  const [activeLab,   setActiveLab]   = useState('524')
  const [loading,     setLoading]     = useState(true)
  const [showAdd,     setShowAdd]     = useState(false)
  const [editItem,    setEditItem]    = useState(null)
  const [deleteItem,  setDeleteItem]  = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/lab-software/')
      setAllSoftware(data)
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const labSoftware = allSoftware.filter(s => s.lab === activeLab)

  // Group by category
  const grouped = labSoftware.reduce((acc, s) => {
    const cat = s.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  // Per-lab count badges
  const countByLab = LABS.reduce((acc, l) => {
    acc[l] = allSoftware.filter(s => s.lab === l).length
    return acc
  }, {})

  const handleSaved = () => {
    setShowAdd(false)
    setEditItem(null)
    load()
  }
  const handleDeleted = () => {
    setDeleteItem(null)
    load()
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="page-title"><i className="bi bi-laptop" /> Lab Software</h1>
          <p style={{ color: 'var(--fg-dim)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Manage available software per lab room. Students see this when choosing a lab.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <i className="bi bi-plus-lg" /> Add Software
        </button>
      </div>

      {/* Lab tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {LABS.map(l => (
          <button
            key={l}
            className={`btn btn-sm ${activeLab === l ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveLab(l)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <i className="bi bi-door-open" /> Lab {l}
            <span style={{
              minWidth: 20, height: 18, padding: '0 5px', borderRadius: 9,
              background: activeLab === l ? 'rgba(255,255,255,0.25)' : 'var(--bg3)',
              color: activeLab === l ? 'inherit' : 'var(--fg-dim)',
              fontSize: '0.7rem', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {countByLab[l] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--fg-dim)' }}>
          <i className="bi bi-hourglass-split" style={{ fontSize: '1.5rem' }} />
          <p style={{ marginTop: '0.75rem' }}>Loading software list…</p>
        </div>
      ) : labSoftware.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem', color: 'var(--fg-dim)',
          border: '2px dashed var(--border)', borderRadius: 12,
        }}>
          <i className="bi bi-laptop" style={{ fontSize: '2rem', opacity: 0.4 }} />
          <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>No software listed for Lab {activeLab}</p>
          <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>Click "Add Software" to start adding programs.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowAdd(true)}>
            <i className="bi bi-plus-lg" /> Add First Software
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
            <div key={cat}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                marginBottom: '0.65rem', paddingBottom: '0.4rem',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--accent)' }}>{cat}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--fg-dim)' }}>({items.length})</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.6rem' }}>
                {items.map(item => (
                  <SoftwareCard
                    key={item.id}
                    item={item}
                    onEdit={i => setEditItem(i)}
                    onDelete={i => setDeleteItem(i)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <SoftwareFormModal
          initial={{ ...EMPTY_FORM, lab: activeLab }}
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}
      {editItem && (
        <SoftwareFormModal
          initial={{
            lab: editItem.lab,
            name: editItem.name,
            icon: editItem.icon ?? 'bi-app',
            description: editItem.description ?? '',
            version: editItem.version ?? '',
            category: editItem.category ?? 'IDE',
          }}
          editingId={editItem.id}
          onClose={() => setEditItem(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteItem && (
        <DeleteConfirm
          item={deleteItem}
          onClose={() => setDeleteItem(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
