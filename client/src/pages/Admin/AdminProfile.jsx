import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Store } from 'lucide-react'
import { useCurrentUser, getUser, saveUser, getToken } from '../../utils/auth';

import NotificationBell from '../../components/NotificationBell';




const SETTINGS_ITEMS = [
  {
    id: 'personal-info', label: 'Personal Information', path: '/admin/profile/personal',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  },
  {
    id: 'security', label: 'Security', path: '/admin/profile/security',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  },
]

const LogoutIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export default function AdminProfile() {
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)
  const [imgError, setImgError] = useState(false)
  const { userName, loading } = useCurrentUser();
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState(getUser() || {})
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: '',
    contactNumber: ''
  })

  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getToken()
        if (!token) return
        const res = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          saveUser(data)
          setUser(data)
        }
      } catch (err) {
        console.error('Error fetching admin profile:', err)
      }
    }
    fetchProfile()
  }, [])

  const updateProfile = async (data) => {
    setUpdating(true)
    try {
      const token = getToken()
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update profile')
      const result = await res.json()
      saveUser(result.user)
      setUser(result.user)
    } catch (err) {
      console.error(err)
      alert('Error updating profile: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      updateProfile({ profilePicture: reader.result })
    }
    reader.readAsDataURL(file)
  }

  const openEditModal = () => {
    setEditForm({
      fullName: user.full_name || '',
      contactNumber: user.contact_number || ''
    })
    setShowEditModal(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    await updateProfile({
      full_name: editForm.fullName,
      contact_number: editForm.contactNumber
    })
    setShowEditModal(false)
  }

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#f5f5f0] font-sans overflow-hidden w-full">

      {/* ── Logout Modal ── */}
      {showLogout && (
        <div className="logout-overlay" onClick={() => setShowLogout(false)}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-icon"><LogoutIcon /></div>
            <h3 className="logout-modal-title">Log Out?</h3>
            <p className="logout-modal-msg">You'll be signed out of your admin session.</p>
            <div className="logout-modal-actions">
              <button className="logout-cancel-btn" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="logout-confirm-btn" id="confirm-logout" onClick={handleLogout}>Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}

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
              <span>Admin</span>
              <ChevronRight size={14} />
              <span className="text-gray-700 font-semibold">Profile</span>
            </div>
          </div>
          <div className="header-right">
            <NotificationBell />
          </div>
        </header>

        {/* Main */}
        <main className="profile-main">

          {/* Hero */}
          <div className="profile-hero">
            <div className="profile-avatar-wrap cursor-pointer" onClick={handleAvatarClick} title="Click to upload profile picture">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*"
              />
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.full_name} className="profile-avatar" />
              ) : (
                <div className="profile-avatar-fallback">{getInitials(user.full_name || userName)}</div>
              )}
              <button className="profile-edit-btn" aria-label="Edit photo">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
            <div className="profile-hero-text">
              <h1 className="profile-name">{user.full_name || userName || 'Welcome, Guest'}</h1>
              <span className="profile-badge">Administrator</span>
            </div>
          </div>

          {/* Settings */}
          <div className="profile-settings">
            <h2 className="profile-settings-title">Account Settings</h2>
            <div className="profile-settings-card">
              {SETTINGS_ITEMS.map(item => (
                <button
                  key={item.id}
                  id={item.id}
                  className="profile-settings-item"
                  onClick={() => {
                    if (item.id === 'personal-info') {
                      openEditModal();
                    } else {
                      navigate(item.path);
                    }
                  }}
                >
                  <span className="settings-icon">{item.icon}</span>
                  <span className="settings-label">{item.label}</span>
                  <span className="settings-chevron">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </button>
              ))}

              {/* Divider */}
              <div className="mx-4 border-t border-gray-100" />

              {/* Log Out row */}
              <button
                className="profile-settings-item hover:bg-red-50 active:bg-red-100 transition-colors"
                onClick={() => setShowLogout(true)}
              >
                <span className="settings-icon" style={{ color: '#ef4444' }}>
                  <LogoutIcon />
                </span>
                <span className="settings-label" style={{ color: '#ef4444' }}>Log Out</span>
                <span className="settings-chevron" style={{ color: '#fca5a5' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <p className="profile-version">Version 2.4.0 (2026)</p>
        </main>
      </div>



      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900">Personal Information</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-left">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                  required
                  className="w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#1a5c2a] focus:bg-white transition-all duration-200"
                  placeholder="Juan Dela Cruz"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-left">Contact Number</label>
                <input
                  type="text"
                  value={editForm.contactNumber}
                  onChange={(e) => setEditForm(f => ({ ...f, contactNumber: e.target.value }))}
                  required
                  className="w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#1a5c2a] focus:bg-white transition-all duration-200"
                  placeholder="+63 912 345 6789"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-left">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-gray-50 border border-gray-200/50 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed text-left"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {updating ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}