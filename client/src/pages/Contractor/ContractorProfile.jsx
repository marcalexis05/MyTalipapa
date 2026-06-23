import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronDown, Store, CheckCircle } from 'lucide-react'
import { useCurrentUser, getUser, saveUser, getToken } from '../../utils/auth';
import ContractorLockScreen from './ContractorLockScreen';

import NotificationBell from '../../components/NotificationBell';




const SETTINGS_ITEMS = [
  {
    id: 'personal-info', label: 'Personal Information', path: '/contractor/profile/personal',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  },
  {
    id: 'security', label: 'Security', path: '/contractor/profile/security',
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

export default function ContractorProfile() {
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)
  const [imgError, setImgError] = useState(false)
  const { userName, loading } = useCurrentUser();
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState(getUser() || {})
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSuffixDropdown, setShowSuffixDropdown] = useState(false)
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
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
        console.error('Error fetching contractor profile:', err)
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

  const [archiveStatus, setArchiveStatus] = useState('none'); // none | pending | granted | expired
  const fetchArchiveStatus = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/contractor/archive-request/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      setArchiveStatus(data.status);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchArchiveStatus();
  }, []);

  const handleAvatarClick = () => { fileInputRef.current.click(); };


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
      firstName: user.first_name || '',
      middleName: user.middle_name || 'N/A',
      lastName: user.last_name || '',
      suffix: user.suffix || 'N/A',
      contactNumber: user.contact_number || ''
    })
    setShowSuffixDropdown(false)
    setShowConfirmSaveModal(false)
    setShowEditModal(true)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    setShowConfirmSaveModal(true)
  }

  const executeSaveProfile = async () => {
    await updateProfile({
      first_name: editForm.firstName,
      middle_name: editForm.middleName === 'N/A' ? '' : editForm.middleName,
      last_name: editForm.lastName,
      suffix: editForm.suffix === 'N/A' ? '' : editForm.suffix,
      contact_number: editForm.contactNumber
    })
    setShowSuffixDropdown(false)
    setShowConfirmSaveModal(false)
    setShowEditModal(false)
  }

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <ContractorLockScreen>
      <div className="flex h-screen bg-[#f5f5f0] font-sans overflow-hidden w-full">

        {/* ── Logout Modal ── */}
        {showLogout && (
          <div className="logout-overlay" onClick={() => setShowLogout(false)}>
            <div className="logout-modal" onClick={e => e.stopPropagation()}>
              <div className="logout-modal-icon"><LogoutIcon /></div>
              <h3 className="logout-modal-title">Log Out?</h3>
              <p className="logout-modal-msg">You'll be signed out of your contractor session.</p>
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
                <span>Contractor</span>
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
                <span className="profile-badge">Contractor</span>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-left">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                    required
                    className="w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#1a5c2a] focus:bg-white transition-all duration-200"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-left">Middle Name / Initial</label>
                  <input
                    type="text"
                    value={editForm.middleName}
                    onChange={(e) => setEditForm(f => ({ ...f, middleName: e.target.value }))}
                    required
                    className="w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#1a5c2a] focus:bg-white transition-all duration-200"
                    placeholder="e.g. A. or N/A"
                  />
                </div>
              </div>
              <div className={`grid grid-cols-2 gap-3 relative ${showSuffixDropdown ? 'z-20' : 'z-0'}`}>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-left">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                    required
                    className="w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#1a5c2a] focus:bg-white transition-all duration-200"
                    placeholder="Dela Cruz"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-left">Suffix</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSuffixDropdown(!showSuffixDropdown)}
                      className="w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#1a5c2a] focus:bg-white transition-all duration-200 flex items-center justify-between text-left"
                    >
                      <span>{editForm.suffix || 'N/A'}</span>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${showSuffixDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showSuffixDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowSuffixDropdown(false)} 
                        />
                        <ul 
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-150 rounded-xl shadow-xl z-50 py-1 max-h-48 overflow-y-auto"
                          style={{ transformOrigin: 'top' }}
                        >
                          {['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'].map((opt) => (
                            <li key={opt}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditForm(f => ({ ...f, suffix: opt }));
                                  setShowSuffixDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                  editForm.suffix === opt 
                                    ? 'font-bold text-[#1a5c2a] bg-green-50/40' 
                                    : 'text-gray-700'
                                }`}
                              >
                                {opt}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
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

      {/* ── Confirm Save Changes Modal ── */}
      {showConfirmSaveModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowConfirmSaveModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex flex-col items-center pt-8 pb-2 px-6">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 text-center">Save Changes?</h3>
              <p className="text-xs text-gray-400 text-center mt-2 mb-6">
                Are you sure you want to save these changes to your personal information?
              </p>
            </div>
            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmSaveModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSaveProfile}
                disabled={updating}
                className="flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors"
              >
                {updating ? 'Saving…' : 'Yes, Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ContractorLockScreen>
  )
}