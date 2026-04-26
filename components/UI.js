'use client'
import { getStatusBg, getStatusFg, ACTIVITY_LABELS, ACTIVITY_COLORS, ACTIVITY_BG } from '@/lib/utils'

// ── Button ──────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', style: s, type = 'button', disabled }) {
  const base = {
    fontFamily: 'Inter, sans-serif',
    border: 'none', borderRadius: size === 'sm' ? 6 : 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
    fontSize: size === 'sm' ? 11 : 13,
    padding: size === 'sm' ? '4px 10px' : '8px 16px',
    fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '-0.01em',
    display: 'inline-flex', alignItems: 'center', gap: 5,
  }
  const variants = {
    primary: {
      background: 'var(--accent)',
      color: '#ffffff',
      boxShadow: 'var(--shadow)',
    },
    ghost: {
      background: 'var(--bg)', color: 'var(--text)',
      border: '1.5px solid var(--border)',
    },
    danger: {
      background: 'var(--danger-bg)', color: 'var(--danger)',
      border: '1.5px solid var(--danger-bg)',
    },
    success: {
      background: 'var(--success-bg)', color: 'var(--success)',
      border: '1.5px solid var(--success-bg)',
    },
  }
  return (
    <button
      onClick={onClick} type={type} disabled={disabled}
      style={{ ...base, ...variants[variant], ...s }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1' }}
    >
      {children}
    </button>
  )
}

// ── Badge ────────────────────────────────────────────────────────────
export function Badge({ status }) {
  if (!status) return <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
  const short = status.length > 20
    ? status.replace('Content ', '').replace('Creative ', '').replace('Client ', '')
    : status
  return (
    <span style={{
      background: getStatusBg(status), color: getStatusFg(status),
      padding: '3px 8px', borderRadius: 5, fontSize: 11,
      display: 'inline-block', whiteSpace: 'nowrap', fontWeight: 600,
    }}>
      {short}
    </span>
  )
}

// ── ActivityBadge ────────────────────────────────────────────────────
export function ActivityBadge({ type }) {
  if (!type) return <span style={{ color: '#d1d5db' }}>—</span>
  return (
    <span style={{
      background: ACTIVITY_BG[type] || '#f3f4f6',
      color: ACTIVITY_COLORS[type] || '#6b7280',
      padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
    }}>
      {ACTIVITY_LABELS[type] || type}
    </span>
  )
}

// ── Card ─────────────────────────────────────────────────────────────
export function Card({ children, style: s }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 20,
      boxShadow: 'var(--shadow)',
      ...s
    }}>
      {children}
    </div>
  )
}

// ── CardTitle ────────────────────────────────────────────────────────
export function CardTitle({ children, action }) {
  return (
    <div style={{
      fontFamily: 'Inter', fontSize: 14, fontWeight: 700,
      marginBottom: 16, color: 'var(--text)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      letterSpacing: '-0.2px',
    }}>
      <span>{children}</span>
      {action}
    </div>
  )
}

// ── StatCard ─────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accentColor = 'var(--accent)', icon }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
      boxShadow: 'var(--shadow)',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accentColor, borderRadius: '12px 12px 0 0',
      }} />
      <div style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-1px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, color: 'var(--text-3)', gap: 14 }}>
      <div style={{
        width: 32, height: 32, border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ fontSize: 13, fontWeight: 500 }}>Loading...</span>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────
export function EmptyState({ icon = '◈', message = 'No data found' }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)' }}>{message}</div>
      <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-3)' }}>Nothing here yet</div>
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────
export function Table({ headers, children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--bg)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '11px 14px',
                fontSize: 11, letterSpacing: '0.05em',
                textTransform: 'uppercase', color: 'var(--text-2)',
                borderBottom: '1px solid var(--border)',
                whiteSpace: 'nowrap', fontWeight: 600,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

// ── Td ───────────────────────────────────────────────────────────────
export function Td({ children, style: s }) {
  return (
    <td style={{
      padding: '11px 14px', borderBottom: '1px solid var(--border)',
      verticalAlign: 'middle', color: 'var(--text)', ...s,
    }}>
      {children}
    </td>
  )
}

// ── RoleBadge ─────────────────────────────────────────────────────────
const ROLE_STYLES = {
  admin:    { bg: 'var(--accent-light)', color: 'var(--accent)', border: 'var(--border)', label: '⚡ Admin' },
  manager:  { bg: 'var(--info-bg)', color: 'var(--info)', border: 'var(--border)', label: '◈ Manager' },
  employee: { bg: 'var(--success-bg)', color: 'var(--success)', border: 'var(--border)', label: '◑ Employee' },
}
export function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] || { bg: 'var(--bg)', color: 'var(--text-2)', border: 'var(--border)', label: role || 'Unknown' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      display: 'inline-block', whiteSpace: 'nowrap',
      letterSpacing: '0.01em',
    }}>
      {s.label}
    </span>
  )
}

// ── PipelineBar ───────────────────────────────────────────────────────
export function PipelineBar({ label, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
        <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{count}/{total} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 6 }}>
        <div style={{
          width: `${pct}%`, background: color, height: 6,
          borderRadius: 4, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}
