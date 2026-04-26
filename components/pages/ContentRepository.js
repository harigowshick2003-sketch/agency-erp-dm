'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'

// ─── Constants ──────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'shoot',        label: 'Shoot',        icon: '🎬', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'raw_footage',  label: 'Raw Footages', icon: '🎞️', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { id: 'repository',   label: 'Repository',   icon: '🗂️', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'editors',      label: 'Editors',      icon: '✂️', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  { id: 'final_output', label: 'Final Output', icon: '✅', color: '#059669', bg: '#f0fdf4', border: '#a7f3d0' },
]

const STATUSES = ['Pending', 'In Progress', 'Review', 'Done']

const STATUS_STYLES = {
  'Pending':     { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  'In Progress': { bg: '#ede9fe', color: '#5b21b6', dot: '#7c3aed' },
  'Review':      { bg: '#dbeafe', color: '#1e40af', dot: '#2563eb' },
  'Done':        { bg: '#d1fae5', color: '#065f46', dot: '#059669' },
}

const LINK_ICONS = {
  'youtube.com': '▶️', 'youtu.be': '▶️',
  'drive.google.com': '📁', 'docs.google.com': '📝',
  'dropbox.com': '📦', 'figma.com': '🎨',
  'notion.so': '📓', 'vimeo.com': '🎥',
}

function getLinkIcon(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '')
    for (const [domain, icon] of Object.entries(LINK_ICONS)) {
      if (host.includes(domain)) return icon
    }
  } catch (_) {}
  return '🔗'
}

function relativeTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString()
}

function avatarInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const AVATAR_COLORS = ['#7c3aed', '#2563eb', '#0d9488', '#d97706', '#dc2626', '#db2777', '#059669']

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ContentRepository({ state, onRefresh }) {
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [cards, setCards] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addColumnId, setAddColumnId] = useState('shoot')
  const [dragCard, setDragCard] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
  const [searchQ, setSearchQ] = useState('')

  const clients = state.clients || []
  const employees = state.employees || []

  // Pick first client by default
  useEffect(() => {
    if (clients.length && !selectedClientId) {
      setSelectedClientId(clients[0].id)
    }
  }, [clients])

  useEffect(() => {
    if (selectedClientId) loadCards(selectedClientId)
  }, [selectedClientId])

  async function loadCards(clientId) {
    setLoading(true)
    try {
      const { data: cardsData, error: cardsErr } = await supabase
        .from('content_repository_cards')
        .select('*')
        .eq('client_id', clientId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

      if (cardsErr) throw cardsErr

      const cardIds = (cardsData || []).map(c => c.id)
      let attachData = []
      if (cardIds.length) {
        const { data, error: attErr } = await supabase
          .from('content_repository_attachments')
          .select('*')
          .in('card_id', cardIds)
          .order('created_at', { ascending: true })
        if (!attErr) attachData = data || []
      }

      setCards(cardsData || [])
      setAttachments(attachData)
    } catch (err) {
      showToast('Failed to load content repository', 'error')
    } finally {
      setLoading(false)
    }
  }

  function refreshCards() {
    if (selectedClientId) loadCards(selectedClientId)
  }

  // ── Drag & Drop ────────────────────────────────────────────────────

  function handleDragStart(card) {
    setDragCard(card)
  }

  async function handleDrop(colId) {
    if (!dragCard || dragCard.column_id === colId) {
      setDragCard(null)
      setDragOverCol(null)
      return
    }
    // Optimistic update
    setCards(prev => prev.map(c => c.id === dragCard.id ? { ...c, column_id: colId } : c))
    setDragCard(null)
    setDragOverCol(null)

    const { error } = await supabase
      .from('content_repository_cards')
      .update({ column_id: colId, updated_at: new Date().toISOString() })
      .eq('id', dragCard.id)

    if (error) {
      showToast('Failed to move card', 'error')
      refreshCards()
    } else {
      showToast('Card moved ✓')
    }
  }

  // ── Add Card ───────────────────────────────────────────────────────

  async function handleAddCard(form) {
    if (!form.title?.trim()) { showToast('Title is required', 'error'); return }
    const maxPos = Math.max(0, ...cards.filter(c => c.column_id === addColumnId).map(c => c.position))
    const { data, error } = await supabase
      .from('content_repository_cards')
      .insert([{
        client_id: selectedClientId,
        column_id: addColumnId,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        assigned_editor_id: form.assigned_editor_id || null,
        status: form.status || 'Pending',
        position: maxPos + 1,
      }])
      .select()
      .single()

    if (error) { showToast(error.message, 'error'); return }
    setCards(prev => [...prev, data])
    setShowAddModal(false)
    showToast('Card added ✓')
  }

  // ── Update Card ────────────────────────────────────────────────────

  async function handleUpdateCard(cardId, updates) {
    const { data, error } = await supabase
      .from('content_repository_cards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', cardId)
      .select()
      .single()

    if (error) { showToast(error.message, 'error'); return }
    setCards(prev => prev.map(c => c.id === cardId ? data : c))
    setSelectedCard(data)
    showToast('Saved ✓')
  }

  // ── Delete Card ────────────────────────────────────────────────────

  async function handleDeleteCard(cardId) {
    if (!confirm('Delete this card? All attachments will be removed.')) return
    const { error } = await supabase.from('content_repository_cards').delete().eq('id', cardId)
    if (error) { showToast(error.message, 'error'); return }
    setCards(prev => prev.filter(c => c.id !== cardId))
    setAttachments(prev => prev.filter(a => a.card_id !== cardId))
    setSelectedCard(null)
    showToast('Card deleted')
  }

  // ── Add Attachment (link) ──────────────────────────────────────────

  async function handleAddLink(cardId, name, url) {
    if (!url?.startsWith('http')) { showToast('Enter a valid URL', 'error'); return }
    const { data, error } = await supabase
      .from('content_repository_attachments')
      .insert([{ card_id: cardId, type: 'link', name: name || url, url }])
      .select()
      .single()
    if (error) { showToast(error.message, 'error'); return }
    setAttachments(prev => [...prev, data])
    showToast('Link added ✓')
  }

  // ── Upload File ────────────────────────────────────────────────────

  async function handleUploadFile(cardId, file) {
    const ext = file.name.split('.').pop()
    const path = `${cardId}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage
      .from('content-repo')
      .upload(path, file, { contentType: file.type })

    if (upErr) {
      // If bucket doesn't exist yet, fall back gracefully
      showToast('Upload failed: ' + upErr.message, 'error')
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('content-repo').getPublicUrl(path)

    const { data, error } = await supabase
      .from('content_repository_attachments')
      .insert([{ card_id: cardId, type: 'file', name: file.name, url: publicUrl, mime_type: file.type }])
      .select()
      .single()
    if (error) { showToast(error.message, 'error'); return }
    setAttachments(prev => [...prev, data])
    showToast('File uploaded ✓')
  }

  // ── Delete Attachment ──────────────────────────────────────────────

  async function handleDeleteAttachment(attId) {
    const { error } = await supabase.from('content_repository_attachments').delete().eq('id', attId)
    if (error) { showToast(error.message, 'error'); return }
    setAttachments(prev => prev.filter(a => a.id !== attId))
    showToast('Attachment removed')
  }

  // ── Computed ───────────────────────────────────────────────────────

  const filteredCards = cards.filter(c =>
    !searchQ || c.title.toLowerCase().includes(searchQ.toLowerCase())
  )

  const currentClient = clients.find(c => c.id === selectedClientId)

  // ── Render ─────────────────────────────────────────────────────────

  if (!clients.length) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#374151' }}>No clients yet</div>
        <div style={{ marginTop: 6, fontSize: 13 }}>Add clients first to use the Content Repository.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8f9fc', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #e2e6ef',
        padding: '14px 24px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        {/* Client tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {clients.map((c, idx) => {
            const active = c.id === selectedClientId
            const col = AVATAR_COLORS[idx % AVATAR_COLORS.length]
            return (
              <button
                key={c.id}
                onClick={() => setSelectedClientId(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '6px 14px', borderRadius: 20,
                  border: active ? `1.5px solid ${col}` : '1.5px solid #e2e6ef',
                  background: active ? `${col}12` : '#fff',
                  color: active ? col : '#6b7280',
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6, background: active ? col : '#e5e7eb',
                  color: active ? '#fff' : '#9ca3af', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10, fontWeight: 800,
                }}>{c.name[0]}</div>
                {c.name}
              </button>
            )
          })}
        </div>

        {/* Search + Add */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            placeholder="Search cards…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{
              border: '1.5px solid #e2e6ef', borderRadius: 8, padding: '7px 12px',
              fontSize: 12, color: '#374151', outline: 'none', background: '#f8f9fc',
              width: 180,
            }}
          />
          <button
            onClick={() => { setAddColumnId('shoot'); setShowAddModal(true) }}
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Inter', whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
            }}
          >
            + Add Card
          </button>
        </div>
      </div>

      {/* ── Board ───────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Loading board…</div>
        </div>
      ) : (
        <div style={{
          flex: 1, overflowX: 'auto', overflowY: 'hidden',
          display: 'flex', padding: '20px 20px 20px',
          gap: 14,
        }}>
          {COLUMNS.map(col => {
            const colCards = filteredCards.filter(c => c.column_id === col.id)
            const isDragOver = dragOverCol === col.id
            return (
              <KanbanColumn
                key={col.id}
                col={col}
                cards={colCards}
                employees={employees}
                attachments={attachments}
                isDragOver={isDragOver}
                onDragOver={() => setDragOverCol(col.id)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => handleDrop(col.id)}
                onDragStart={handleDragStart}
                onCardClick={card => setSelectedCard(card)}
                onAddCard={() => { setAddColumnId(col.id); setShowAddModal(true) }}
              />
            )
          })}
        </div>
      )}

      {/* ── Add Card Modal ───────────────────────────────────────── */}
      {showAddModal && (
        <AddCardModal
          columnId={addColumnId}
          columns={COLUMNS}
          employees={employees}
          onSave={handleAddCard}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* ── Card Detail Drawer ───────────────────────────────────── */}
      {selectedCard && (
        <CardDetailDrawer
          card={selectedCard}
          employees={employees}
          attachments={attachments.filter(a => a.card_id === selectedCard.id)}
          column={COLUMNS.find(c => c.id === selectedCard.column_id)}
          onUpdate={(updates) => handleUpdateCard(selectedCard.id, updates)}
          onDelete={() => handleDeleteCard(selectedCard.id)}
          onAddLink={(name, url) => handleAddLink(selectedCard.id, name, url)}
          onUploadFile={(file) => handleUploadFile(selectedCard.id, file)}
          onDeleteAttachment={handleDeleteAttachment}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  )
}

// ─── Kanban Column ───────────────────────────────────────────────────────────

function KanbanColumn({ col, cards, employees, attachments, isDragOver, onDragOver, onDragLeave, onDrop, onDragStart, onCardClick, onAddCard }) {
  return (
    <div
      style={{
        width: 280, minWidth: 280, maxWidth: 280,
        display: 'flex', flexDirection: 'column',
        background: isDragOver ? col.bg : '#f1f3f8',
        borderRadius: 14,
        border: isDragOver ? `2px dashed ${col.color}` : '2px solid transparent',
        transition: 'all 0.2s',
        overflow: 'hidden',
      }}
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={e => { e.preventDefault(); onDrop() }}
    >
      {/* Column header */}
      <div style={{
        padding: '14px 16px 12px',
        background: col.bg,
        borderBottom: `2px solid ${col.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>{col.icon}</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: col.color, flex: 1 }}>{col.label}</span>
        <div style={{
          background: col.color, color: '#fff', borderRadius: 20,
          fontSize: 10, fontWeight: 800, padding: '2px 8px', minWidth: 22, textAlign: 'center',
        }}>{cards.length}</div>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
        {cards.map(card => (
          <KanbanCard
            key={card.id}
            card={card}
            employees={employees}
            attachmentCount={attachments.filter(a => a.card_id === card.id).length}
            colColor={col.color}
            onClick={() => onCardClick(card)}
            onDragStart={() => onDragStart(card)}
          />
        ))}
        {cards.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '24px 14px',
            fontSize: 11, color: '#9ca3af', fontStyle: 'italic',
          }}>
            Drop cards here
          </div>
        )}
      </div>

      {/* Add button */}
      <div style={{ padding: '8px 10px', borderTop: `1px solid ${col.border}`, background: col.bg }}>
        <button
          onClick={onAddCard}
          style={{
            width: '100%', padding: '7px', borderRadius: 8,
            border: `1.5px dashed ${col.border}`, background: 'transparent',
            color: col.color, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = col.bg; e.currentTarget.style.borderStyle = 'solid' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderStyle = 'dashed' }}
        >
          + Add Card
        </button>
      </div>
    </div>
  )
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────

function KanbanCard({ card, employees, attachmentCount, colColor, onClick, onDragStart }) {
  const editor = employees.find(e => e.id === card.assigned_editor_id)
  const statusStyle = STATUS_STYLES[card.status] || STATUS_STYLES['Pending']
  const avatarColor = editor ? AVATAR_COLORS[employees.indexOf(editor) % AVATAR_COLORS.length] : '#9ca3af'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        background: '#ffffff', borderRadius: 10,
        border: '1.5px solid #e8eaf2',
        padding: '12px 14px', cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.15s',
        borderLeft: `3px solid ${colColor}`,
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.1)`
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.borderColor = '#c7d2fe'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = '#e8eaf2'
      }}
    >
      {/* Title */}
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', marginBottom: 8, lineHeight: 1.4 }}>
        {card.title}
      </div>

      {/* Description preview */}
      {card.description && (
        <div style={{
          fontSize: 11, color: '#6b7280', marginBottom: 8,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          lineHeight: 1.4,
        }}>
          {card.description}
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Status badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          background: statusStyle.bg, color: statusStyle.color,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusStyle.dot, display: 'inline-block' }} />
          {card.status}
        </span>

        {/* Attachments */}
        {attachmentCount > 0 && (
          <span style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
            📎 {attachmentCount}
          </span>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Editor avatar */}
        {editor ? (
          <div
            title={editor.name}
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: avatarColor, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700,
            }}
          >
            {avatarInitials(editor.name)}
          </div>
        ) : (
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f3f4f6', border: '1.5px dashed #d1d5db' }} title="No editor assigned" />
        )}
      </div>

      {/* Timestamp */}
      <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 6, textAlign: 'right' }}>
        {relativeTime(card.updated_at || card.created_at)}
      </div>
    </div>
  )
}

// ─── Add Card Modal ──────────────────────────────────────────────────────────

function AddCardModal({ columnId, columns, employees, onSave, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', status: 'Pending', assigned_editor_id: '', column_id: columnId })
  const f = v => setForm(p => ({ ...p, ...v }))

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
          width: '100%', maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: 'scaleIn 0.18s ease',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Add New Card</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={e => f({ title: e.target.value })} placeholder="e.g. Product shoot – April batch" autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => f({ description: e.target.value })} placeholder="Brief notes about this content…" style={{ minHeight: 72 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Column</label>
              <select value={form.column_id} onChange={e => f({ column_id: e.target.value })}>
                {columns.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => f({ status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Assign Editor</label>
            <select value={form.assigned_editor_id} onChange={e => f({ assigned_editor_id: e.target.value })}>
              <option value="">— Unassigned —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} {e.emp_id ? `(${e.emp_id})` : ''}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={ghostBtnStyle}>Cancel</button>
          <button onClick={() => onSave({ ...form })} style={primaryBtnStyle}>Add Card</button>
        </div>
      </div>
    </div>
  )
}

// ─── Card Detail Drawer ──────────────────────────────────────────────────────

function CardDetailDrawer({ card, employees, attachments, column, onUpdate, onDelete, onAddLink, onUploadFile, onDeleteAttachment, onClose }) {
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ title: card.title, description: card.description || '', status: card.status, assigned_editor_id: card.assigned_editor_id || '', column_id: card.column_id })
  const [linkForm, setLinkForm] = useState({ name: '', url: '' })
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef()

  const f = v => setForm(p => ({ ...p, ...v }))
  const editor = employees.find(e => e.id === card.assigned_editor_id)
  const statusStyle = STATUS_STYLES[card.status] || STATUS_STYLES['Pending']

  async function handleSave() {
    await onUpdate({
      title: form.title,
      description: form.description || null,
      status: form.status,
      assigned_editor_id: form.assigned_editor_id || null,
      column_id: form.column_id,
    })
    setEditMode(false)
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    await onUploadFile(file)
    setUploading(false)
    e.target.value = ''
  }

  async function handleAddLink() {
    if (!linkForm.url) return
    await onAddLink(linkForm.name || linkForm.url, linkForm.url)
    setLinkForm({ name: '', url: '' })
    setShowLinkForm(false)
  }

  return (
    <>
      {/* Overlay */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.3)', zIndex: 900 }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: 480,
        background: '#fff', zIndex: 950,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        animation: 'slideInRight 0.22s ease',
        fontFamily: 'Inter, sans-serif',
      }}>

        {/* ── Drawer Header ── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #e2e6ef',
          background: column?.bg || '#f8f9fc',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{column?.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: column?.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {column?.label}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                  background: statusStyle.bg, color: statusStyle.color,
                }}>
                  {card.status}
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>{card.title}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Created {relativeTime(card.created_at)} · Updated {relativeTime(card.updated_at)}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#9ca3af', cursor: 'pointer', lineHeight: 1, padding: 4 }}>✕</button>
          </div>
        </div>

        {/* ── Drawer Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Edit / View Mode */}
          {editMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input value={form.title} onChange={e => f({ title: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e => f({ description: e.target.value })} style={{ minHeight: 80 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Column</label>
                  <select value={form.column_id} onChange={e => f({ column_id: e.target.value })}>
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={e => f({ status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Assign Editor</label>
                <select value={form.assigned_editor_id} onChange={e => f({ assigned_editor_id: e.target.value })}>
                  <option value="">— Unassigned —</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSave} style={primaryBtnStyle}>Save Changes</button>
                <button onClick={() => setEditMode(false)} style={ghostBtnStyle}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              {/* Description */}
              {card.description ? (
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 14 }}>{card.description}</p>
              ) : (
                <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginBottom: 14 }}>No description added.</p>
              )}

              {/* Editor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8f9fc', borderRadius: 10, marginBottom: 12 }}>
                {editor ? (
                  <>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: AVATAR_COLORS[employees.indexOf(editor) % AVATAR_COLORS.length],
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                    }}>{avatarInitials(editor.name)}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{editor.name}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{editor.role || 'Editor'}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>No editor assigned</div>
                  </>
                )}
                <button onClick={() => setEditMode(true)} style={{ marginLeft: 'auto', ...ghostBtnStyle, fontSize: 11, padding: '4px 10px' }}>Edit</button>
              </div>
            </div>
          )}

          {/* ── Attachments Section ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>📎 Attachments</div>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setShowLinkForm(v => !v)}
                  style={{ ...ghostBtnStyle, fontSize: 11, padding: '5px 10px' }}
                >
                  + Link
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ ...ghostBtnStyle, fontSize: 11, padding: '5px 10px' }}
                >
                  {uploading ? '⏳ Uploading…' : '↑ Upload'}
                </button>
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} accept="video/*,image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov" />
              </div>
            </div>

            {/* Add link form */}
            {showLinkForm && (
              <div style={{
                background: '#f8f9fc', borderRadius: 10, padding: 14, marginBottom: 12,
                border: '1.5px solid #e2e6ef', display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <input
                  placeholder="Display name (optional)"
                  value={linkForm.name}
                  onChange={e => setLinkForm(p => ({ ...p, name: e.target.value }))}
                  style={{ fontSize: 12 }}
                />
                <input
                  placeholder="https://drive.google.com/..."
                  value={linkForm.url}
                  onChange={e => setLinkForm(p => ({ ...p, url: e.target.value }))}
                  style={{ fontSize: 12 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={handleAddLink} style={{ ...primaryBtnStyle, fontSize: 11, padding: '5px 12px' }}>Add Link</button>
                  <button onClick={() => setShowLinkForm(false)} style={{ ...ghostBtnStyle, fontSize: 11, padding: '5px 10px' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Attachment list */}
            {attachments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: '#d1d5db' }}>
                No attachments yet — add links or upload files above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {attachments.map(att => (
                  <AttachmentRow key={att.id} att={att} onDelete={() => onDeleteAttachment(att.id)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Drawer Footer ── */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #e2e6ef',
          display: 'flex', gap: 10, justifyContent: 'space-between', flexShrink: 0,
        }}>
          <button
            onClick={onDelete}
            style={{
              background: '#fff1f2', color: '#e11d48', border: '1.5px solid #fecdd3',
              borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter',
            }}
          >
            🗑 Delete Card
          </button>
          <button onClick={() => setEditMode(true)} style={primaryBtnStyle}>✎ Edit Card</button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}

// ─── Attachment Row ──────────────────────────────────────────────────────────

function AttachmentRow({ att, onDelete }) {
  const isFile = att.type === 'file'
  const icon = isFile ? getFileIcon(att.mime_type) : getLinkIcon(att.url)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 9,
      background: '#f8f9fc', border: '1px solid #e8eaf2',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#c7d2fe'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#e8eaf2'}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12, fontWeight: 600, color: '#2563eb',
            textDecoration: 'none', display: 'block',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {att.name}
        </a>
        <div style={{ fontSize: 10, color: '#d1d5db', marginTop: 1 }}>
          {isFile ? att.mime_type : att.url.slice(0, 40) + (att.url.length > 40 ? '…' : '')} · {relativeTime(att.created_at)}
        </div>
      </div>
      <button
        onClick={onDelete}
        title="Remove"
        style={{
          background: 'none', border: 'none', color: '#d1d5db',
          cursor: 'pointer', fontSize: 14, padding: '2px 4px', borderRadius: 4,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}
      >
        ✕
      </button>
    </div>
  )
}

function getFileIcon(mimeType) {
  if (!mimeType) return '📎'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📑'
  return '📎'
}

// ─── Shared Styles ───────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5,
}

const primaryBtnStyle = {
  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
  color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 18px', fontSize: 12, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'Inter',
  boxShadow: '0 2px 8px rgba(79,70,229,0.2)',
}

const ghostBtnStyle = {
  background: '#f8f9fc', color: '#374151',
  border: '1.5px solid #e2e6ef', borderRadius: 8,
  padding: '9px 14px', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'Inter',
}
