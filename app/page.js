'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/Toast'
import Toast from '@/components/Toast'
import { Spinner } from '@/components/UI'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/pages/Dashboard'
import Calendar from '@/components/pages/Calendar'
import Clients from '@/components/pages/Clients'
import ClientDetail from '@/components/pages/ClientDetail'
import Deliverables from '@/components/pages/Deliverables'
import Jobs from '@/components/pages/Jobs'
import Employees from '@/components/pages/Employees'
import Performance from '@/components/pages/Performance'
import Users from '@/components/pages/Users'
import ContentRepository from '@/components/pages/ContentRepository'
import { LoginForm, SignupForm } from '@/components/AuthForms'

const PAGE_TITLES = {
  dashboard:    'Dashboard',
  calendar:     'Content Calendar',
  content_repo: 'Content Repository',
  clients:      'Clients',
  client_detail: '',
  deliverables: 'Deliverables Split Tracker',
  jobs:         'Job Work Tracker',
  employees:    'Employees',
  performance:  'Employee Performance',
  users:        'User Management'
}

export default function App() {
  const [authState, setAuthState] = useState('loading') // 'loading' | 'login' | 'signup' | 'app'
  const [page, setPage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [appState, setAppState] = useState({
    user: null,
    userRole: 'employee',
    clients: [],
    employees: [],
    deliverables: [],
    jobs: [],
    contentDetails: [],
    selectedClient: null,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        handleUserAuthenticated(data.session.user)
      } else {
        setAuthState('login')
      }
    })
  }, [])

  async function handleUserAuthenticated(user) {
    setAuthState('loading')
    try {
      // 1. Load user role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const role = profile?.role || 'employee'
      setAppState(s => ({ ...s, user, userRole: role }))
      
      // 2. Load app data
      await loadAll()
      setAuthState('app')
    } catch (err) {
      console.error(err)
      setAuthState('login')
    }
  }

  async function loadAll() {
    try {
      const [c, e, d, j, cd] = await Promise.all([
        supabase.from('clients').select('*').order('name'),
        supabase.from('employees').select('*').order('name'),
        supabase.from('deliverables').select('*, client:client_id(name,client_code), daily_tracker(*)').order('date', { ascending: true }),
        supabase.from('job_tracker').select('*, deliverable:deliverable_id(activity_code,client_id,activity_type,date), employee:assigned_to(name,emp_id)').order('created_at', { ascending: false }),
        supabase.from('content_details').select('*, deliverable:deliverable_id(activity_code,client_id,activity_type,date)'),
      ])
      setAppState(s => ({
        ...s,
        clients: c.data || [],
        employees: e.data || [],
        deliverables: d.data || [],
        jobs: j.data || [],
        contentDetails: cd.data || [],
      }))
    } catch (err) {
      showToast('Failed to load data', 'error')
    }
  }

  async function doLogin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await handleUserAuthenticated(data.user)
  }

  async function doSignup(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } } // Optional: Save it in auth metadata if you want, but trigger needs it too!
    })
    if (error) throw error
    // If auto-confirm is enabled, or wait for email
    // The SQL trigger will handle creating the user_profiles row
  }

  async function doLogout() {
    await supabase.auth.signOut()
    setAuthState('login')
    setAppState(s => ({ ...s, user: null, userRole: 'employee' }))
    setPage('dashboard')
  }

  function navigate(p, extra) {
    setPage(p)
    if (extra) setAppState(s => ({ ...s, ...extra }))
  }

  function handleRefresh() { loadAll() }

  // ── AUTH: LOADING ──────────────────────────────────────────────────
  if (authState === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fc' }}>
        <Spinner />
      </div>
    )
  }

  // ── AUTH: LOGIN / SIGNUP ───────────────────────────────────────────
  if (authState === 'login') {
    return (
      <>
        <LoginForm onLogin={doLogin} onSwitchToSignup={() => setAuthState('signup')} />
        <Toast />
      </>
    )
  }

  if (authState === 'signup') {
    return (
      <>
        <SignupForm onSignup={doSignup} onSwitchToLogin={() => setAuthState('login')} />
        <Toast />
      </>
    )
  }

  // ── MAIN APP ───────────────────────────────────────────────────────
  const pageTitle = page === 'client_detail' ? (appState.selectedClient?.name || 'Client') : PAGE_TITLES[page] || ''

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc] relative">
      <Sidebar 
        page={page} 
        onNavigate={navigate} 
        onLogout={doLogout} 
        userRole={appState.userRole}
        user={appState.user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <div style={{
          height: 60, background: '#ffffff', borderBottom: '1px solid #e2e6ef',
          display: 'flex', alignItems: 'center', padding: '0 20px md:padding: 0 28px', gap: 16, flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          <button 
            className="md:hidden"
            onClick={() => setIsSidebarOpen(true)}
            style={{ fontSize: 22, color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ☰
          </button>
          <div style={{ fontFamily: 'Inter', fontSize: 17, fontWeight: 700, flex: 1, color: '#111827', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {pageTitle}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{appState.user?.email}</span>
            <button
              onClick={handleRefresh}
              title="Refresh data"
              style={{
                background: '#f1f3f8', border: '1px solid #e2e6ef', borderRadius: 8,
                color: '#4f46e5', cursor: 'pointer', padding: '6px 14px',
                fontFamily: 'Inter', fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#c7d2fe' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f1f3f8'; e.currentTarget.style.borderColor = '#e2e6ef' }}
            >
              ↺ Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {page === 'dashboard'     && <Dashboard state={appState} />}
          {page === 'calendar'      && <Calendar state={appState} onRefresh={handleRefresh} />}
          {/* Restrict pages by role */}
          {['admin', 'manager'].includes(appState.userRole) && page === 'clients'       && <Clients state={appState} onRefresh={handleRefresh} onNavigate={navigate} />}
          {['admin', 'manager'].includes(appState.userRole) && page === 'client_detail' && <ClientDetail state={appState} onRefresh={handleRefresh} onNavigate={navigate} />}
          {['admin', 'manager'].includes(appState.userRole) && page === 'deliverables'  && <Deliverables state={appState} onRefresh={handleRefresh} />}
          {['admin', 'manager'].includes(appState.userRole) && page === 'content_repo'  && <ContentRepository state={appState} onRefresh={handleRefresh} />}
          
          {page === 'jobs'          && <Jobs state={appState} onRefresh={handleRefresh} />}
          
          {['admin', 'manager'].includes(appState.userRole) && page === 'employees'     && <Employees state={appState} onRefresh={handleRefresh} />}
          {['admin', 'manager'].includes(appState.userRole) && page === 'performance'   && <Performance state={appState} />}
          
          {/* Admin only page */}
          {appState.userRole === 'admin' && page === 'users'           && <Users state={appState} />}
          
          {/* Very basic fallback if they visit a page they shouldn't */}
          {!['dashboard','calendar','jobs'].includes(page) && !['admin', 'manager'].includes(appState.userRole) && (
             <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>You do not have permission to view this page.</div>
          )}
        </div>
      </div>
      <Toast />
    </div>
  )
}

