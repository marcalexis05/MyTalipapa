import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  Store,
  FileText,
  User,
  ChevronRight,
  CheckCircle,
  XCircle,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Camera,
  Clock
} from 'lucide-react'
import NotificationBell from '../../components/NotificationBell'

const dashStyles = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-16px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(8px) scale(0.85); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes progressGrow {
    from { width: 0%; }
    to { width: 100%; }
  }
  @keyframes pulseDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.75); }
  }
  @keyframes headerSlideDown {
    from { opacity: 0; transform: translateY(-100%); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes rowFadeIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes cardPop {
    0% { opacity: 0; transform: translateY(16px) scale(0.97); }
    60% { transform: translateY(-2px) scale(1.005); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes imageReveal {
    from { opacity: 0; transform: scale(1.04); }
    to { opacity: 1; transform: scale(1); }
  }

  .dash-header {
    animation: headerSlideDown 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .dash-greeting {
    animation: slideInLeft 0.45s ease 0.05s both;
  }
  .dash-action-btn {
    position: relative;
    overflow: hidden;
    transition: opacity 0.2s ease, transform 0.18s ease, box-shadow 0.18s ease;
  }
  .dash-action-btn:hover {
    opacity: 0.93;
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  }
  .dash-action-btn:active {
    transform: scale(0.97) translateY(0);
  }
  .dash-action-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
    background-size: 200% 100%;
    animation: shimmer 2.2s infinite;
  }
  .dash-stat-card {
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .dash-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  }
  .dash-stat-value {
    animation: countUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .dash-card {
    animation: cardPop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    transition: box-shadow 0.2s ease;
  }
  .dash-card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.07);
  }
  .dash-news-img {
    animation: imageReveal 0.6s ease both;
  }
  .dash-progress-bar {
    animation: progressGrow 1s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both;
  }
  .dash-table-row {
    animation: rowFadeIn 0.35s ease both;
    transition: background-color 0.15s ease;
  }
  .dash-alert {
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .dash-alert:hover {
    transform: translateX(3px);
    box-shadow: 2px 0 8px rgba(0,0,0,0.05);
  }
  .dash-profile-row {
    animation: fadeSlideUp 0.4s ease both;
    transition: background-color 0.15s ease;
  }
  .dash-profile-row:hover {
    background-color: #f9fafb;
    border-radius: 12px;
    padding-left: 4px;
  }
  .dash-pulse-dot {
    animation: pulseDot 1.4s ease-in-out infinite;
  }
  .dash-status-badge {
    transition: transform 0.15s ease;
  }
  .dash-status-badge:hover {
    transform: scale(1.06);
  }
  .stagger-1 { animation-delay: 0.05s; }
  .stagger-2 { animation-delay: 0.12s; }
  .stagger-3 { animation-delay: 0.19s; }
  .stagger-4 { animation-delay: 0.26s; }
  .stagger-5 { animation-delay: 0.33s; }
  .stagger-6 { animation-delay: 0.40s; }
  .stagger-7 { animation-delay: 0.47s; }
  .stagger-8 { animation-delay: 0.54s; }
  .row-stagger-1 { animation-delay: 0.05s; }
  .row-stagger-2 { animation-delay: 0.12s; }
  .row-stagger-3 { animation-delay: 0.19s; }
  .row-stagger-4 { animation-delay: 0.26s; }
  .row-stagger-5 { animation-delay: 0.33s; }
`

export default function RenterDashboard({ onNavigate, onOpenStall }) {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token = localStorage.getItem('authToken')
      const storedUser = localStorage.getItem('user')
      if (!token || !storedUser) return null
      const parsed = JSON.parse(storedUser)
      return parsed.role === 'renter' ? parsed : null
    } catch {
      return null
    }
  })

  const [applications, setApplications] = useState([])
  const [activeStall, setActiveStall] = useState(null)
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false)

  const alerts = [
    { id: 'alert-1', type: 'info', message: 'Market cleanup is scheduled for next Monday. Stall operations will start at 9:00 AM.', date: 'May 22, 2026' },
    { id: 'alert-2', type: 'warning', message: 'Please ensure compliance with standard waste disposal regulations in Produce Section B.', date: 'May 20, 2026' },
  ]

  const appStats = {
    pending: applications.filter(a => a.status === 'Pending').length,
    approved: applications.filter(a => a.status === 'Approved').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
  }

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    const emailParam = `?email=${encodeURIComponent(currentUser.email)}`
    const token = localStorage.getItem('authToken')

    setLoading(true)

    const fetchApps = fetch(`/api/renter/applications${emailParam}`).then(res => {
      if (!res.ok) throw new Error('Failed to fetch applications')
      return res.json()
    })

    const fetchLease = fetch(`/api/renter/active-lease${emailParam}`).then(res => {
      if (!res.ok) throw new Error('Failed to fetch active lease')
      return res.json()
    })

    const fetchProfile = token
      ? fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .catch(err => {
          console.error('Failed to fetch user profile:', err)
          return null
        })
      : Promise.resolve(null)

    const fetchAnnouncements = fetch(`/api/public/announcements?role=renter`).then(res => {
      if (!res.ok) throw new Error('Failed to fetch announcements')
      return res.json()
    })

    Promise.all([fetchApps, fetchLease, fetchProfile, fetchAnnouncements])
      .then(([appsData, leaseData, profileData, announcementsData]) => {
        setApplications(appsData)
        setActiveStall(leaseData)
        setAnnouncements(announcementsData)
        if (profileData) {
          setCurrentUser(profileData)
          localStorage.setItem('user', JSON.stringify(profileData))
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching dashboard data:', err)
        setLoading(false)
      })
  }, [currentUser?.email, navigate])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  if (!currentUser) return null

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f0] h-full">
        <div className="w-10 h-10 border-4 border-[#1a5c2a] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 font-semibold mt-3 animate-pulse">Loading dashboard...</p>
      </div>
    )
  }

  const firstName = currentUser?.full_name?.split(' ')[0] || 'Juan'

  return (
    <>
      <style>{dashStyles}</style>
      <div className="flex flex-col flex-1 overflow-hidden h-full">

        {/* ── TOP HEADER ── */}
        <header className="dash-header bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 bg-[#1a5c2a] rounded-lg flex items-center justify-center">
                <Store size={13} color="white" />
              </div>
              <span className="font-extrabold text-gray-900 text-sm">MyTalipapa</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-sm text-gray-400">
              <span>Renter</span>
              <ChevronRight size={14} />
              <span className="text-gray-700 font-semibold">Home</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-gray-800">Hello, {firstName}!</span>
              <span className="text-[10px] text-gray-400">Stall Owner</span>
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ── */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 px-4 md:px-6 py-5 space-y-5">

          {/* Greeting */}
          <div className="dash-greeting">
            <p className="text-base font-bold text-gray-900">Hello, {firstName}!</p>
            <p className="text-xs text-gray-400">Welcome back to your market dashboard.</p>
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/renter/market-tour')}
              className="dash-action-btn stagger-1 flex flex-col items-center justify-center gap-2 rounded-2xl py-6 px-4 text-white font-bold text-sm"
              style={{ backgroundColor: '#1a5c2a', animation: 'cardPop 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both' }}
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Globe size={20} />
              </div>
              <span className="text-center leading-tight">View 360° Market Tour</span>
            </button>

            <button
              onClick={() => navigate('/renter/ar-finder')}
              className="dash-action-btn flex flex-col items-center justify-center gap-2 rounded-2xl py-6 px-4 text-white font-bold text-sm"
              style={{ backgroundColor: '#e07b00', animation: 'cardPop 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both' }}
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Camera size={20} />
              </div>
              <span className="text-center leading-tight">Find Stall via AR</span>
            </button>
          </div>

          {/* ── APPLICATIONS OVERVIEW ── */}
          <div style={{ animation: 'fadeSlideUp 0.45s ease 0.18s both' }}>
            <h2 className="text-sm font-bold text-gray-800 mb-3">Applications Overview</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Pending', value: appStats.pending, color: 'text-gray-800', delay: '0.20s' },
                { label: 'Approved', value: appStats.approved, color: 'text-gray-800', delay: '0.27s' },
                { label: 'Rejected', value: appStats.rejected, color: 'text-red-500', delay: '0.34s' },
              ].map(s => (
                <div
                  key={s.label}
                  className="dash-stat-card bg-white rounded-2xl py-4 px-3 flex flex-col items-center shadow-sm border border-gray-100"
                  style={{ animation: `cardPop 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${s.delay} both` }}
                >
                  <span className={`dash-stat-value text-2xl font-extrabold ${s.color}`} style={{ animationDelay: s.delay }}>{s.value}</span>
                  <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── MARKET NEWS ── */}
          <div style={{ animation: 'fadeSlideUp 0.45s ease 0.28s both' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-800">Market News</h2>
              {announcements.length > 0 && (
                <button
                  onClick={() => setShowAllAnnouncements(true)}
                  className="text-xs font-bold text-[#1a5c2a] hover:text-[#14451f] transition-colors"
                >
                  View All
                </button>
              )}
            </div>
            {announcements.length > 0 ? (
              <div className="dash-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-4" style={{ animationDelay: '0.28s' }}>
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider text-white" style={{ backgroundColor: '#e07b00' }}>
                      Announcement
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {new Date(announcements[0].createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-1">{announcements[0].title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {announcements[0].content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="dash-card bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 text-xs text-gray-400">
                No active announcements from management.
              </div>
            )}
          </div>

          {/* ── ACTIVE STALL LEASE ── */}
          <div className="dash-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-green-50 text-green-700 transition-transform hover:scale-110">
                  <Store size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Active Stall Lease</h3>
                  <p className="text-[10px] text-gray-400">Current tenancy information</p>
                </div>
              </div>
            </div>
            {activeStall && Array.isArray(activeStall) && activeStall.length > 0 ? (
              <div className="space-y-6">
                {activeStall.map((lease, idx) => (
                  <div key={lease.id} className={idx > 0 ? "pt-6 border-t border-gray-100" : ""}>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-bold text-gray-800">Stall {lease.stallNumber}</h4>
                      <span className="dash-status-badge px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-wide">
                        {lease.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Stall No.', value: lease.stallNumber, cls: 'text-base font-extrabold text-gray-800', delay: '0.38s' },
                        { label: 'Section', value: lease.section, cls: 'text-xs font-extrabold text-gray-800 truncate', delay: '0.43s' },
                        { label: 'Monthly Rent', value: lease.monthlyRate, cls: 'text-base font-extrabold text-green-800', delay: '0.48s' },
                        { label: 'Expiry', value: lease.leaseEnd, cls: 'text-xs font-extrabold text-red-500', delay: '0.53s' },
                      ].map(cell => (
                        <div
                          key={cell.label}
                          className="bg-gray-50 rounded-xl p-3 transition-all hover:bg-gray-100"
                          style={{ animation: `fadeSlideUp 0.4s ease ${cell.delay} both` }}
                        >
                          <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{cell.label}</p>
                          <p className={cell.cls}>{cell.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span className="font-semibold">Lease Progress</span>
                        <span>Started {lease.leaseStart}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="dash-progress-bar h-full rounded-full bg-[#1a5c2a]" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-400 font-semibold" style={{ animation: 'fadeIn 0.4s ease both' }}>
                You do not have an active stall lease yet.
              </div>
            )}
          </div>

          {/* ── APPLICATIONS TABLE ── */}
          <div className="dash-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100" style={{ animationDelay: '0.42s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-orange-50 text-orange-500 transition-transform hover:scale-110">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">My Stall Applications</h3>
                  <p className="text-[10px] text-gray-400">Applications submitted for market leases</p>
                </div>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('applications')}
                  className="text-[11px] font-bold text-[#1a5c2a] hover:text-[#14451f] flex items-center gap-0.5 transition-all hover:gap-1"
                >
                  Apply <ChevronRight size={13} />
                </button>
              )}
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[420px] text-left text-xs border-collapse">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="py-2 px-1 font-semibold uppercase tracking-wide text-[10px]">Stall & Section</th>
                    <th className="py-2 px-1 font-semibold uppercase tracking-wide text-[10px]">Date</th>
                    <th className="py-2 px-1 font-semibold uppercase tracking-wide text-[10px]">Rate</th>
                    <th className="py-2 px-1 font-semibold uppercase tracking-wide text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  {applications.length > 0 ? (
                    applications.map((app, idx) => (
                      <tr
                        key={app.id || app._id}
                        className="dash-table-row hover:bg-gray-50"
                        style={{ animationDelay: `${0.44 + idx * 0.07}s` }}
                      >
                        <td className="py-3 px-1">
                          <div className="font-bold text-gray-800">{app.stall}</div>
                          <div className="text-[10px] text-gray-400">{app.section || app.zone}</div>
                        </td>
                        <td className="py-3 px-1 text-gray-500">{app.date || app.submittedOn}</td>
                        <td className="py-3 px-1 font-bold text-gray-800">{app.fee}</td>
                        <td className="py-3 px-1">
                          <span className={`dash-status-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${app.status === 'Approved' ? 'bg-green-50 text-green-700' :
                            app.status === 'Rejected' ? 'bg-red-50 text-red-500' :
                              'bg-orange-50 text-orange-700'
                            }`}>
                            {app.status === 'Approved' ? <CheckCircle size={9} /> :
                              app.status === 'Rejected' ? <XCircle size={9} /> :
                                <Clock size={9} />}
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-xs text-gray-400 font-semibold" style={{ animation: 'fadeIn 0.4s ease 0.5s both' }}>
                        No applications submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>



          {/* ── PROFILE DETAILS ── */}
          <div className="dash-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100" style={{ animationDelay: '0.56s' }}>
            <h3 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Stallholder Profile Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: User, label: 'Full Name', value: currentUser?.full_name, delay: '0.58s' },
                { icon: Mail, label: 'Email', value: currentUser?.email, delay: '0.64s' },
                { icon: Phone, label: 'Contact', value: currentUser?.contact_number || 'N/A', delay: '0.70s' },
              ].map(row => (
                <div
                  key={row.label}
                  className="dash-profile-row flex items-center gap-3 p-1"
                  style={{ animation: `fadeSlideUp 0.4s ease ${row.delay} both` }}
                >
                  <div className="p-2 bg-gray-100 text-gray-500 rounded-xl shrink-0 transition-all hover:bg-green-50 hover:text-green-700">
                    <row.icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{row.label}</p>
                    <p className="text-xs font-semibold text-gray-800 truncate">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

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
      </div>
    </>
  )
}