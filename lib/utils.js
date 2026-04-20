export function fmtDate(d) {
  if (!d) return '-'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Light-theme status colours
export function getStatusBg(val) {
  if (!val) return 'transparent'
  const v = val.toLowerCase()
  if (v.includes('approved') || v === 'posted')                                               return '#d1fae5'
  if (v.includes('not written') || v.includes('not started') || v.includes('not done') || v === 'not posted') return '#fee2e2'
  if (v === 'content written')                                                                 return '#e0f2fe'
  if (v.includes('wip') || v.includes('scheduled'))                                           return '#fef3c7'
  if (v.includes('remarks given'))                                                             return '#fef3c7'
  if (v.includes('resolved'))                                                                  return '#dbeafe'
  if (v === 'do not post')                                                                     return '#ede9fe'
  return '#f3f4f6'
}

export function getStatusFg(val) {
  if (!val) return '#9ca3af'
  const v = val.toLowerCase()
  if (v.includes('approved') || v === 'posted')                                               return '#059669'
  if (v.includes('not written') || v.includes('not started') || v.includes('not done') || v === 'not posted') return '#dc2626'
  if (v === 'content written')                                                                 return '#0284c7'
  if (v.includes('wip') || v.includes('scheduled'))                                           return '#d97706'
  if (v.includes('remarks given'))                                                             return '#b45309'
  if (v.includes('resolved'))                                                                  return '#1d4ed8'
  if (v === 'do not post')                                                                     return '#7c3aed'
  return '#6b7280'
}

export const ACTIVITY_LABELS = { AT001: 'Post', AT002: 'Reel', AT004: 'YT Short', AT005: 'YT Long' }
export const ACTIVITY_COLORS = {
  AT001: '#4f46e5', AT002: '#0ea5e9', AT004: '#8b5cf6', AT005: '#059669'
}
export const ACTIVITY_BG = {
  AT001: '#eef2ff', AT002: '#e0f2fe',
  AT004: '#ede9fe', AT005: '#d1fae5'
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
