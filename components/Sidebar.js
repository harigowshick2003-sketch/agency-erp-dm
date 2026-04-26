'use client'
import { RoleBadge } from '@/components/UI'

// Define which roles can access each nav item
const navItems = [
  { id: 'dashboard',       icon: '▦',  label: 'Dashboard',        section: 'Main',   roles: ['admin', 'manager', 'employee'] },
  { id: 'calendar',        icon: '◫',  label: 'Content Calendar', section: null,     roles: ['admin', 'manager', 'employee'] },
  { id: 'content_repo',   icon: '⊞',  label: 'Content Repo',     section: null,     roles: ['admin', 'manager'] },
  { id: 'clients',         icon: '◎',  label: 'Clients',          section: 'Manage', roles: ['admin', 'manager'] },
  { id: 'deliverables',    icon: '◈',  label: 'Deliverables',     section: null,     roles: ['admin', 'manager'] },
  { id: 'jobs',            icon: '⊟',  label: 'Job Tracker',      section: null,     roles: ['admin', 'manager', 'employee'] },
  { id: 'employees',       icon: '◑',  label: 'Employees',        section: 'Team',   roles: ['admin', 'manager'] },
  { id: 'performance',     icon: '◉',  label: 'Performance',      section: null,     roles: ['admin', 'manager'] },
  { id: 'users',           icon: '⊛',  label: 'Users',            section: 'Admin',  roles: ['admin'] },
]

export default function Sidebar({ page, onNavigate, onLogout, userRole, user, isOpen, onClose }) {
  // Filter nav items based on the current user's role
  const role = userRole || 'employee'
  const visibleItems = navItems.filter(item => item.roles.includes(role))

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-10 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 bg-white border-r border-[#e2e6ef] flex flex-col overflow-hidden z-20 transition-transform duration-300 w-[228px] md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}
      >
      {/* Logo */}
      <div style={{
        padding: '22px 20px 18px',
        borderBottom: '1px solid #e2e6ef',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: '#fff', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
        }}>⬡</div>
        <div>
          <div style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, color: '#111827', letterSpacing: '-0.3px' }}>
            Agency ERP
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#9ca3af', fontWeight: 500, marginTop: 1 }}>
            Operations Platform
          </div>
        </div>
      </div>

      {/* User badge */}
      {user && (
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid #f1f3f8',
          background: '#fafbff',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: '#fff', border: '1px solid #e2e6ef',
            borderRadius: 8, padding: '8px 10px',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {(user.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
              <div style={{ marginTop: 3 }}>
                <RoleBadge role={role} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {visibleItems.map((item, idx) => {
          // Show section header only when section changes
          const prevSection = idx > 0 ? visibleItems[idx - 1].section : null
          const showSection = item.section && item.section !== prevSection
          return (
            <div key={item.id}>
              {showSection && (
                <div style={{
                  padding: '14px 10px 6px',
                  fontSize: 10, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600,
                }}>{item.section}</div>
              )}
              <NavItem
                icon={item.icon}
                label={item.label}
                active={page === item.id || (page === 'client_detail' && item.id === 'clients')}
                onClick={() => { onNavigate(item.id); if (onClose) onClose(); }}
              />
            </div>
          )
        })}
      </div>

      {/* Logout */}
      <div style={{ padding: '10px 10px 16px', borderTop: '1px solid #e2e6ef' }}>
        <div style={{ padding: '10px 10px 6px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>
          Account
        </div>
        <NavItem icon="⊗" label="Sign Out" onClick={onLogout} />
      </div>
      </div>
    </>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', cursor: 'pointer', borderRadius: 8,
        margin: '2px 0', transition: 'all 0.15s',
        color: active ? '#4f46e5' : '#6b7280',
        fontSize: 13, fontWeight: active ? 600 : 500,
        background: active ? '#eef2ff' : 'transparent',
        letterSpacing: '-0.01em',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = '#f8f9fc'
          e.currentTarget.style.color = '#374151'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#6b7280'
        }
      }}
    >
      <span style={{
        fontSize: 15, width: 20, textAlign: 'center',
        color: active ? '#4f46e5' : '#9ca3af',
        transition: 'color 0.15s',
      }}>{icon}</span>
      <span>{label}</span>
      {active && (
        <div style={{
          marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
          background: '#4f46e5',
        }} />
      )}
    </div>
  )
}
