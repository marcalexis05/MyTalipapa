import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Store } from 'lucide-react'
import { useCurrentUser, getUser } from '../../utils/auth'
import marketImage from '../../images/market_live_view.png'
import ContractorLockScreen from './ContractorLockScreen'
import ContractorSidebar from '../../components/ContractorSidebar'
import NotificationBell from '../../components/NotificationBell'

const NAV_ITEMS = [
  {
    id: 'nav-dashboard', label: 'Dashboard', path: '/contractor/dashboard',
    icon: (<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>),
  },
  {
    id: 'nav-stalls', label: 'Stalls', path: '/contractor/stalls',
    icon: (<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>),
  },
  {
    id: 'nav-apps', label: 'Apps', path: '/contractor/applications',
    icon: (<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>),
  },
  {
    id: 'nav-records', label: 'Records', path: '/contractor/records',
    icon: (<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>),
  },
  {
    id: 'nav-profile', label: 'Profile', path: '/contractor/profile',
    icon: (<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
  },
]

const LogoutIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

function OccupancyRing({ percent }) {
  const r = 70
  const circumference = 2 * Math.PI * r
  const offset = circumference - (percent / 100) * circumference
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="occupancy-ring">
      <circle cx="90" cy="90" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
      <circle
        cx="90" cy="90" r={r} fill="none"
        stroke="var(--color-brand-green)" strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 90 90)"
        className="occupancy-progress"
      />
      <text x="90" y="85" textAnchor="middle" className="ring-percent">{percent}%</text>
      <text x="90" y="103" textAnchor="middle" className="ring-label">Capacity</text>
    </svg>
  )
}

export default function ContractorDashboard() {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('nav-dashboard')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { userName, loading: authLoading } = useCurrentUser()
  const [processingId, setProcessingId] = useState(null)
  const liveViewMountRef = useRef(null)

  useEffect(() => {
    let THREE
    let renderer, scene, camera, material, animationFrameId
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }
    let spherical = { phi: Math.PI / 2, theta: 0 }

    const mount = liveViewMountRef.current
    if (!mount) return

    let isCleanedUp = false

    async function initThree() {
      // Wait for layout to settle (150ms)
      await new Promise(resolve => setTimeout(resolve, 150))
      if (isCleanedUp) return

      if (!window.THREE) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
          s.onload = resolve
          s.onerror = reject
          document.head.appendChild(s)
        })
      }
      if (isCleanedUp) return
      THREE = window.THREE

      const rect = mount.getBoundingClientRect()
      const width = rect.width || mount.clientWidth || mount.parentElement?.clientWidth || 350
      const height = rect.height || mount.clientHeight || 160

      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000)
      camera.position.set(0, 0, 0.001)

      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      mount.appendChild(renderer.domElement)

      const geometry = new THREE.SphereGeometry(500, 64, 40)
      geometry.scale(-1, 1, 1)

      const texture = new THREE.TextureLoader().load(marketImage)
      material = new THREE.MeshBasicMaterial({ map: texture })
      const sphere = new THREE.Mesh(geometry, material)
      scene.add(sphere)

      const updateCamera = () => {
        const { phi, theta } = spherical
        const x = Math.sin(phi) * Math.cos(theta)
        const y = Math.cos(phi)
        const z = Math.sin(phi) * Math.sin(theta)
        camera.lookAt(x, y, z)
      }
      updateCamera()

      const onMouseDown = (e) => {
        isDragging = true
        previousMousePosition = { x: e.clientX, y: e.clientY }
      }

      const onMouseMove = (e) => {
        if (!isDragging) return
        const deltaX = e.clientX - previousMousePosition.x
        const deltaY = e.clientY - previousMousePosition.y
        previousMousePosition = { x: e.clientX, y: e.clientY }

        spherical.theta -= deltaX * 0.003
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - deltaY * 0.003))
        updateCamera()
      }

      const onMouseUp = () => {
        isDragging = false
      }

      const onTouchStart = (e) => {
        if (e.touches.length === 1) {
          isDragging = true
          previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }
      }

      const onTouchMove = (e) => {
        if (!isDragging || e.touches.length !== 1) return
        const deltaX = e.touches[0].clientX - previousMousePosition.x
        const deltaY = e.touches[0].clientY - previousMousePosition.y
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }

        spherical.theta -= deltaX * 0.003
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - deltaY * 0.003))
        updateCamera()
      }

      const onTouchEnd = () => {
        isDragging = false
      }

      mount.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)

      mount.addEventListener('touchstart', onTouchStart, { passive: true })
      mount.addEventListener('touchmove', onTouchMove, { passive: true })
      mount.addEventListener('touchend', onTouchEnd)

      const handleResize = () => {
        if (!mount || !renderer || !camera) return
        const w = mount.clientWidth
        const h = mount.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', handleResize)

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate)
        if (!isDragging) {
          spherical.theta += 0.001
          updateCamera()
        }
        renderer.render(scene, camera)
      }
      animate()

      // Cleanup function
      return () => {
        cancelAnimationFrame(animationFrameId)
        mount.removeEventListener('mousedown', onMouseDown)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        mount.removeEventListener('touchstart', onTouchStart)
        mount.removeEventListener('touchmove', onTouchMove)
        mount.removeEventListener('touchend', onTouchEnd)
        window.removeEventListener('resize', handleResize)
        if (renderer && renderer.domElement) {
          mount.removeChild(renderer.domElement)
          renderer.dispose()
        }
        if (geometry) geometry.dispose()
        if (material) material.dispose()
        if (texture) texture.dispose()
      }
    }

    let cleanupFn
    initThree().then(cleanup => {
      cleanupFn = cleanup
    })

    return () => {
      isCleanedUp = true
      if (cleanupFn) cleanupFn()
    }
  }, [])

  // ── Live data from DB ──────────────────────────────────
  const [stalls, setStalls] = useState([])
  const [applications, setApplications] = useState([])
  const [loadingStalls, setLoadingStalls] = useState(true)
  const [loadingApps, setLoadingApps] = useState(true)

  const user = getUser()
  const userEmail = user?.email || ''

  // Fetch stalls
  const fetchStalls = () => {
    setLoadingStalls(true)
    fetch(`/api/contractor/stalls?email=${userEmail}`)
      .then(r => r.json())
      .then(data => { setStalls(data); setLoadingStalls(false) })
      .catch(() => setLoadingStalls(false))
  }

  // Fetch applications — only pending ones for dashboard
  const fetchApplications = () => {
    setLoadingApps(true)
    fetch(`/api/contractor/applications?email=${userEmail}`)
      .then(r => r.json())
      .then(data => { setApplications(data); setLoadingApps(false) })
      .catch(() => setLoadingApps(false))
  }

  const [announcements, setAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false)

  const fetchAnnouncements = () => {
    setLoadingAnnouncements(true)
    fetch('/api/public/announcements?role=contractor')
      .then(r => r.json())
      .then(data => { setAnnouncements(data); setLoadingAnnouncements(false) })
      .catch(() => setLoadingAnnouncements(false))
  }

  useEffect(() => {
    if (userEmail) {
      fetchStalls()
      fetchApplications()
      fetchAnnouncements()
    }
  }, [userEmail])

  // ── Derived live stats ─────────────────────────────────
  const totalStalls   = stalls.length
  const availableCount = stalls.filter(s => s.status === 'available').length
  const occupiedCount  = stalls.filter(s => s.status === 'occupied').length
  const pendingApps    = applications.filter(a => a.status === 'pending')
  const occupancyPct   = totalStalls > 0 ? Math.round((occupiedCount / totalStalls) * 100) : 0

  // Total monthly revenue from occupied stalls with a monthlyRate
  const totalRevenue = stalls
    .filter(s => s.status === 'occupied' && s.monthlyRate)
    .reduce((sum, s) => sum + (s.monthlyRate || 0), 0)

  const STATS = [
    {
      id: 'total-stalls', label: 'TOTAL STALLS', value: loadingStalls ? '…' : totalStalls,
      icon: (<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="17" /><line x1="9" y1="14.5" x2="15" y2="14.5" /></svg>),
      accent: 'var(--color-brand-green)',
    },
    {
      id: 'available', label: 'AVAILABLE', value: loadingStalls ? '…' : availableCount,
      icon: (<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></svg>),
      accent: '#16a34a',
    },
    {
      id: 'occupied', label: 'OCCUPIED', value: loadingStalls ? '…' : occupiedCount,
      icon: (<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>),
      accent: '#2563eb',
    },
    {
      id: 'pending', label: 'PENDING APPLICATION', value: loadingApps ? '…' : pendingApps.length,
      icon: (<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>),
      accent: '#dc2626',
    },
  ]

  // ── Approve / Reject from dashboard ───────────────────
  const handleAction = async (id, action) => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/contractor/applications/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }), // "approve" | "reject"
      })
      if (!res.ok) throw new Error('Failed')
      // Refresh both stalls and applications so all stats update live
      await Promise.all([fetchStalls(), fetchApplications()])
    } catch (err) {
      console.error('Failed to update application:', err)
      alert('Action failed. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleNav = (item) => { setActiveNav(item.id); navigate(item.path) }
  const handleLogout = () => navigate('/login')

  return (
    <ContractorLockScreen>
      <div className="flex h-screen bg-[#f5f5f0] font-sans overflow-hidden w-full">
        {/* Logout Modal */}
        {showLogoutModal && (
          <div className="logout-overlay" onClick={() => setShowLogoutModal(false)}>
            <div className="logout-modal" onClick={e => e.stopPropagation()}>
              <div className="logout-modal-icon"><LogoutIcon /></div>
              <h3 className="logout-modal-title">Log Out?</h3>
              <p className="logout-modal-msg">You'll be signed out of your contractor session.</p>
              <div className="logout-modal-actions">
                <button className="logout-cancel-btn" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                <button className="logout-confirm-btn" onClick={handleLogout}>Yes, Log Out</button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <ContractorSidebar active="nav-dashboard" />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header */}
          <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile logo */}
              <div className="md:hidden flex items-center gap-2">
                <div className="w-7 h-7 bg-[#1a5c2a] rounded-lg flex items-center justify-center shrink-0">
                  <Store size={13} color="white" />
                </div>
                <span className="font-extrabold text-gray-900 text-sm">MyTalipapa</span>
              </div>
              {/* Desktop breadcrumb */}
              <div className="hidden md:flex items-center gap-1 text-sm text-gray-400">
                <span>Contractor</span>
                <ChevronRight size={14} />
                <span className="text-gray-700 font-semibold">Dashboard</span>
              </div>
            </div>
            <div className="header-right">
              <div className="header-welcome">
                <span className="welcome-name">{authLoading ? 'Loading…' : userName || 'Welcome, Guest'}</span>
                <span className="welcome-role">Contractor</span>
              </div>
              <NotificationBell />
              <button className="header-logout-btn" aria-label="Log out" onClick={() => setShowLogoutModal(true)}>
                <LogoutIcon />
              </button>
            </div>
          </header>

          <main className="dashboard-main">
            {/* Stats Row — live from DB */}
            <section className="stats-grid" aria-label="Market Statistics">
              {STATS.map(stat => (
                <div key={stat.id} className="stat-card" style={{ '--accent': stat.accent }}>
                  <div className="stat-top">
                    <span className="stat-label">{stat.label}</span>
                    <span className="stat-icon" style={{ color: stat.accent }}>{stat.icon}</span>
                  </div>
                  <span className="stat-value">{stat.value}</span>
                </div>
              ))}
            </section>

            {/* Revenue + Occupancy + Live View */}
            <section className="middle-grid" aria-label="Revenue and Occupancy">
              {/* Revenue Card — live sum of occupied stall rates */}
              <div className="revenue-card">
                <p className="revenue-label">TOTAL MONTHLY REVENUE</p>
                <h2 className="revenue-amount">
                  {loadingStalls ? '…' : `₱${totalRevenue.toLocaleString()}`}
                </h2>
                <div className="revenue-watermark">
                  <svg width="120" height="100" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.15)" strokeWidth={1.2}>
                    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="revenue-footer">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                  </svg>
                  <span>{occupiedCount} occupied stalls @ avg ₱{occupiedCount > 0 ? Math.round(totalRevenue / occupiedCount).toLocaleString() : 0}/mo</span>
                </div>
              </div>

              {/* Occupancy Ring — live */}
              <div className="occupancy-card">
                <h3 className="occupancy-title">Market Occupancy</h3>
                <OccupancyRing percent={loadingStalls ? 0 : occupancyPct} />
                <p className="occupancy-msg">
                  {occupancyPct >= 90
                    ? <><span className="near-full">Near full capacity</span> — {availableCount} stalls left</>
                    : occupancyPct >= 50
                    ? <><span className="near-full">{occupancyPct}% occupied</span> — {availableCount} stalls available</>
                    : <>{availableCount} stalls currently <span className="near-full">available</span></>
                  }
                </p>
              </div>

              {/* Live View */}
              <div 
                className="liveview-card relative overflow-hidden cursor-pointer" 
                onClick={() => navigate('/tour')}
                style={{ height: '160px' }}
              >
                <div ref={liveViewMountRef} style={{ width: '100%', height: '160px' }} className="absolute inset-0 z-0" />
                <div className="liveview-overlay absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-3.5">
                  <span className="live-badge cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); navigate('/tour'); }}>
                    <span className="live-dot" /> VIRTUAL TOUR
                  </span>
                  <span className="liveview-label">Main Produce Section B</span>
                </div>
              </div>
            </section>

            {/* Recent Pending Applications — live from DB */}
            <section className="applications-section" aria-label="Recent Applications">
              <div className="applications-header">
                <h3 className="applications-title">Recent Applications</h3>
                <button className="view-all-btn" onClick={() => navigate('/contractor/applications')}>
                  View All
                </button>
              </div>
              <div className="applications-list">
                {loadingApps ? (
                  <div className="no-applications">
                    <div className="stalls-spinner" style={{ width: 28, height: 28 }} />
                    <span>Loading applications…</span>
                  </div>
                ) : pendingApps.length === 0 ? (
                  <div className="no-applications">
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={1.5}>
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>All applications reviewed!</p>
                  </div>
                ) : (
                  // Show latest 5 pending only on dashboard
                  pendingApps.slice(0, 5).map(app => (
                    <div key={app.id} className="application-row">
                      <div className="app-avatar">
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#6b7280' }}>{app.initials}</span>
                      </div>
                      <div className="app-info">
                        <span className="app-name">{app.name}</span>
                        <span className="app-meta">{app.stall} · {app.applied}</span>
                        {app.additionalMessage && (
                          <p className="text-xs text-gray-500 italic mt-0.5 text-left" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            "{app.additionalMessage}"
                          </p>
                        )}
                        <span className="app-type" style={{ color: app.typeColor }}>{app.type}</span>
                      </div>
                      <div className="app-actions">
                        <button
                          className="btn-reject"
                          disabled={processingId === app.id}
                          onClick={() => handleAction(app.id, 'reject')}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          {processingId === app.id ? '…' : 'Reject'}
                        </button>
                        <button
                          className="btn-approve"
                          disabled={processingId === app.id}
                          onClick={() => handleAction(app.id, 'approve')}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          {processingId === app.id ? '…' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Announcements Section */}
            <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mt-6 text-left">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Market Announcements</h3>
                  <p className="text-xs text-gray-400">Latest updates from market administration</p>
                </div>
                {announcements.length > 0 && (
                  <button
                    onClick={() => setShowAllAnnouncements(true)}
                    className="text-xs font-bold text-[#1a5c2a] hover:text-[#14451f] transition-colors"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {loadingAnnouncements ? (
                  <div className="text-center py-4 text-xs text-gray-400">Loading announcements...</div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-400">
                    📢 No active announcements from management.
                  </div>
                ) : (
                  // Show the latest 3 announcements on the dashboard
                  announcements.slice(0, 3).map(ann => (
                    <div key={ann._id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-100/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-800">{ann.title}</span>
                          <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9px] font-extrabold uppercase tracking-wider">
                            Management
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{ann.content}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                        {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="bottom-nav" aria-label="Main Navigation">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'nav-active' : ''}`}
              onClick={() => handleNav(item)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Announcements Modal ── */}
        {showAllAnnouncements && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAllAnnouncements(false)}
          >
            <div
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900">All Announcements</h3>
                <button
                  onClick={() => setShowAllAnnouncements(false)}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                {announcements.map(ann => (
                  <div key={ann._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                    <span className="text-[10px] text-gray-400 font-bold block mb-1">
                      {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <h4 className="text-sm font-extrabold text-gray-800 mb-1">{ann.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <style>{`
          .stalls-spinner { border: 2px solid #e5e7eb; border-top-color: var(--color-brand-green); border-radius: 50%; animation: spin 0.7s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </ContractorLockScreen>
  )
}