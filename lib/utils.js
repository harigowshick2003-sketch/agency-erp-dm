export function fmtDate(d) {
  if (!d) return '-'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Light-theme status colours
export function getStatusBg(val) {
  if (!val) return 'transparent'
  const v = val.toLowerCase()
  if (v.includes('approved') || v === 'posted')                                               return 'var(--success-bg)'
  if (v.includes('not written') || v.includes('not started') || v.includes('not done') || v === 'not posted') return 'var(--danger-bg)'
  if (v === 'content written')                                                                 return 'var(--info-bg)'
  if (v.includes('wip') || v.includes('scheduled'))                                           return 'var(--warning-bg)'
  if (v.includes('remarks given'))                                                             return 'var(--warning-bg)'
  if (v.includes('resolved'))                                                                  return 'var(--info-bg)'
  if (v === 'do not post')                                                                     return 'var(--accent-light)'
  return 'var(--surface2)'
}

export function getStatusFg(val) {
  if (!val) return 'var(--text-3)'
  const v = val.toLowerCase()
  if (v.includes('approved') || v === 'posted')                                               return 'var(--success)'
  if (v.includes('not written') || v.includes('not started') || v.includes('not done') || v === 'not posted') return 'var(--danger)'
  if (v === 'content written')                                                                 return 'var(--info)'
  if (v.includes('wip') || v.includes('scheduled'))                                           return 'var(--warning)'
  if (v.includes('remarks given'))                                                             return 'var(--warning)'
  if (v.includes('resolved'))                                                                  return 'var(--info)'
  if (v === 'do not post')                                                                     return 'var(--accent)'
  return 'var(--text-2)'
}

export const ACTIVITY_LABELS = { AT001: 'Post', AT002: 'Reel', AT004: 'YT Short', AT005: 'YT Long' }
export const ACTIVITY_COLORS = {
  AT001: 'var(--accent)', AT002: 'var(--info)', AT004: 'var(--text-2)', AT005: 'var(--success)'
}
export const ACTIVITY_BG = {
  AT001: 'var(--accent-light)', AT002: 'var(--info-bg)',
  AT004: 'var(--surface2)', AT005: 'var(--success-bg)'
}

export const CONTENT_STATUSES = [
  'Content Not Written', 'Content Written', 'Content Approved', 'Content Remarks Given', 'Content Remarks Resolved'
]
export const CREATIVE_STATUSES = [
  'Creative Not Started', 'Creative WIP', 'Creative Done', 'Creative Approved',
  'Creative Remarks Given', 'Creative Remarks Resolved'
]
export const CLIENT_STATUSES = [
  'Not Sent', 'Sent to Client', 'Client Approved', 'Client Remarks Given', 'Client Remarks Resolved'
]
export const POSTING_STATUSES = ['Not Posted', 'Scheduled', 'Posted', 'Do Not Post']
