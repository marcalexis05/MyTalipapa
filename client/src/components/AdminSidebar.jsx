import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  FileText,
  History,
  User,
  LogOut,
  MessageSquare,
  ClipboardList
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'nav-dashboard', label: 'Dashboard', path: '/admin/dashboard', Icon: LayoutDashboard },
  { id: 'nav-stalls', label: 'Stalls', path: '/admin/stalls', Icon: Store },
  { id: 'nav-apps', label: 'Applications', path: '/admin/applications', Icon: FileText },
  { id: 'nav-requests', label: 'Requests', path: '/admin/requests', Icon: ClipboardList },
  { id: 'nav-records', label: 'Records', path: '/admin/records', Icon: History },
  { id: 'nav-messages', label: 'Messages', path: '/admin/messages', Icon: MessageSquare },
  { id: 'nav-profile', label: 'Profile', path: '/admin/profile', Icon: User },
]

export default function AdminSidebar({ active }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(true)
  const [showLogout, setShowLogout] = useState(false)
  const [pendingAppsCount, setPendingAppsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  // Fetch pending applications count and messages for notification badge
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [renterRes, contractorRes, messagesRes, removalRes, stallRes] = await Promise.all([
          fetch('/api/admin/applications'),
          fetch('/api/admin/contractor-applications'),
          fetch('/api/admin/contact-messages'),
          fetch('/api/stall-removal-requests/admin/requests/pending', {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          }),
          fetch('/api/admin/stall-requests/pending', {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          })
        ])
        
        let count = 0
        if (renterRes.ok) {
          const renters = await renterRes.json()
          count += renters.filter(a => a.status === 'pending').length
        }
        if (contractorRes.ok) {
          const contractors = await contractorRes.json()
          count += contractors.filter(a => a.status === 'pending').length
        }
        setPendingAppsCount(count)

        if (messagesRes.ok) {
          const messages = await messagesRes.json()
          const unread = messages.filter(m => m.status === 'unread').length
          setUnreadMessagesCount(unread)
        }

        let removalsCount = 0
        if (removalRes.ok) {
          const removals = await removalRes.json()
          removalsCount = removals.length
        }

        let additionsCount = 0
        if (stallRes.ok) {
          const additions = await stallRes.json()
          additionsCount = additions.length
        }

        setPendingRequestsCount(removalsCount + additionsCount)
      } catch (err) {
        console.error('Error fetching counts for sidebar:', err)
      }
    }

    fetchCounts()
    // Poll every 15 seconds to keep counts relatively fresh
    const interval = setInterval(fetchCounts, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <>
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className="hidden md:flex flex-col bg-white border-r border-gray-100 h-screen sticky top-0 transition-all duration-300 shrink-0 z-40"
        style={{ width: collapsed ? '4rem' : '14rem' }}
      >
        {/* Brand Logo */}
        <div className={`flex items-center gap-2 px-4 py-5 border-b border-gray-100 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-[#1a5c2a] rounded-lg flex items-center justify-center shrink-0">
            <Store size={15} color="white" />
          </div>
          {!collapsed && <span className="font-extrabold text-gray-900 text-base tracking-tight">MyTalipapa</span>}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, path, Icon }) => {
            const isActive = active === id || location.pathname.startsWith(path)
            return (
              <button
                key={id}
                onClick={() => navigate(path)}
                title={collapsed ? label : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-[#edf5ed] text-[#1a5c2a]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={18} className={isActive ? 'text-[#1a5c2a]' : 'text-gray-400 group-hover:text-gray-600'} />
                
                {!collapsed && <span className="font-semibold text-sm">{label}</span>}
                
                {/* Notification Badge */}
                {id === 'nav-apps' && pendingAppsCount > 0 && (
                  collapsed ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                  ) : (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-500 text-[9px] font-black text-white leading-none">
                      {pendingAppsCount}
                    </span>
                  )
                )}

                {id === 'nav-messages' && unreadMessagesCount > 0 && (
                  collapsed ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                  ) : (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-500 text-[9px] font-black text-white leading-none">
                      {unreadMessagesCount}
                    </span>
                  )
                )}

                {id === 'nav-requests' && pendingRequestsCount > 0 && (
                  collapsed ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f59e0b]" />
                  ) : (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-[#f59e0b] text-[9px] font-black text-white leading-none">
                      {pendingRequestsCount}
                    </span>
                  )
                )}

                {!collapsed && isActive && id !== 'nav-apps' && id !== 'nav-messages' && id !== 'nav-requests' && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1a5c2a]" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <button
            onClick={() => setShowLogout(true)}
            title={collapsed ? 'Logout' : ''}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={16} />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLogout(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
              <LogOut size={20} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 mb-1">Log Out?</h3>
            <p className="text-xs text-gray-400 mb-6">You'll be signed out of your admin session.</p>
            <div className="flex w-full gap-3">
              <button 
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-sm shadow-red-100"
                onClick={handleLogout}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
