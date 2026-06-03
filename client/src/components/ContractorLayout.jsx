import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  FileText,
  History,
  User,
  LogOut,
  ClipboardList
} from 'lucide-react'
import { getUser } from '../utils/auth'

const NAV_ITEMS = [
  { id: 'nav-dashboard', label: 'Dashboard', path: '/contractor/dashboard', Icon: LayoutDashboard },
  { id: 'nav-stalls', label: 'Stalls', path: '/contractor/stalls', Icon: Store },
  { id: 'nav-apps', label: 'Applications', path: '/contractor/applications', Icon: FileText },
  { id: 'nav-requests', label: 'My Requests', path: '/contractor/requests', Icon: ClipboardList },
  { id: 'nav-records', label: 'Records', path: '/contractor/records', Icon: History },
  { id: 'nav-profile', label: 'Profile', path: '/contractor/profile', Icon: User },
]

export default function ContractorLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(true)
  const [showLogout, setShowLogout] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const user = getUser()
  const userEmail = user?.email || ''

  useEffect(() => {
    if (!userEmail) return

    const fetchPendingCount = async () => {
      try {
        const res = await fetch(`/api/contractor/applications?email=${encodeURIComponent(userEmail)}`)
        if (res.ok) {
          const apps = await res.json()
          const count = apps.filter(a => a.status === 'pending').length
          setPendingCount(count)
        }
      } catch (err) {
        console.error('Error fetching pending counts for contractor sidebar:', err)
      }
    }

    fetchPendingCount()
    const interval = setInterval(fetchPendingCount, 15000)
    return () => clearInterval(interval)
  }, [userEmail])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const activeNavItem = NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.id || ''

  return (
    <div className="flex h-screen bg-[#f5f5f0] overflow-hidden w-full">
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className="hidden md:flex flex-col bg-white border-r border-gray-100 h-screen sticky top-0 transition-all duration-300 shrink-0 z-40"
        style={{ width: collapsed ? '4rem' : '14rem' }}
      >
        <div className={`flex items-center gap-2 px-4 py-5 border-b border-gray-100 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-[#1a5c2a] rounded-lg flex items-center justify-center shrink-0">
            <Store size={15} color="white" />
          </div>
          {!collapsed && <span className="font-extrabold text-gray-900 text-base tracking-tight">MyTalipapa</span>}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, path, Icon }) => {
            const isActive = activeNavItem === id || location.pathname.startsWith(path)
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
                
                {id === 'nav-apps' && pendingCount > 0 && (
                  collapsed ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                  ) : (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-500 text-[9px] font-black text-white leading-none">
                      {pendingCount}
                    </span>
                  )
                )}

                {!collapsed && isActive && id !== 'nav-apps' && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1a5c2a]" />
                )}
              </button>
            )
          })}
        </nav>

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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children || <Outlet />}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-1 py-1 justify-around items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.map(({ id, label, path, Icon }) => {
          const isActive = activeNavItem === id || location.pathname.startsWith(path)
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center w-full relative h-full"
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-[#edf5ed] text-[#1a5c2a]' : 'text-gray-500'}`}>
                <Icon size={18} className={isActive ? 'text-[#1a5c2a]' : 'text-gray-400'} />
              </div>
              <span className={`text-[9px] mt-0.5 font-medium ${isActive ? 'text-[#1a5c2a]' : 'text-gray-500'}`}>
                {label}
              </span>
              
              {id === 'nav-apps' && pendingCount > 0 && (
                <span className="absolute top-1 right-1/4 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border border-white">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLogout(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
              <LogOut size={20} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 mb-1">Log Out?</h3>
            <p className="text-xs text-gray-400 mb-6">You'll be signed out of your session.</p>
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
    </div>
  )
}
