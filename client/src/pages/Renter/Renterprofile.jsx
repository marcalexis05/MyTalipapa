/**
 * RenterProfile.jsx
 * Profile page for MyTalipapa renter app.
 * Matches mobile + tablet screenshots.
 *
 * Props:
 *   onNavigate(tab) – from RenterLayout
 *   onLogout()      – from RenterLayout
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Bell, User, ChevronRight, ChevronDown, ExternalLink,
  LogOut, Shield, Bell as BellIcon,
  ShoppingBag, Calendar, CheckCircle, Edit, MessageSquare, Send,
  Eye, EyeOff, HelpCircle,
} from 'lucide-react'
import { getUser, saveUser, getToken } from '../../utils/auth'
import NotificationBell from '../../components/NotificationBell'

/* ── Animations ──────────────────────────────────────────────── */
const profileStyles = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cardPop {
    0%   { opacity: 0; transform: translateY(16px) scale(0.97); }
    60%  { transform: translateY(-2px) scale(1.005); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes bounceIn {
    0%   { opacity: 0; transform: scale(0.82); }
    60%  { transform: scale(1.06); }
    80%  { transform: scale(0.97); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.94) translateY(14px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes successPop {
    0%   { opacity: 0; transform: scale(0.8); }
    60%  { transform: scale(1.08); }
    100% { opacity: 1; transform: scale(1); }
  }

  /* Top bar */
  .rp-topbar {
    animation: fadeSlideDown 0.35s ease both;
  }

  /* Hero section */
  .rp-avatar {
    animation: bounceIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .rp-avatar:hover {
    transform: scale(1.04);
  }
  .rp-name {
    animation: fadeSlideUp 0.38s ease 0.1s both;
  }
  .rp-email {
    animation: fadeSlideUp 0.38s ease 0.15s both;
  }
  .rp-badge {
    animation: bounceIn 0.4s ease 0.2s both;
  }
  .rp-edit-btn {
    animation: fadeSlideUp 0.38s ease 0.25s both;
    position: relative;
    overflow: hidden;
    transition: transform 0.15s ease, background-color 0.2s ease;
  }
  .rp-edit-btn:hover {
    transform: translateY(-1px);
  }
  .rp-edit-btn:active {
    transform: scale(0.97);
  }
  .rp-edit-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }

  /* Section labels */
  .rp-section-label {
    animation: fadeSlideUp 0.35s ease both;
  }

  /* Menu group card */
  .rp-menu-group {
    animation: cardPop 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  /* Individual menu rows */
  .rp-menu-row {
    transition: background-color 0.15s ease, transform 0.15s ease;
  }
  .rp-menu-row:hover {
    transform: translateX(2px);
  }
  .rp-menu-row:active {
    transform: scale(0.99);
  }

  /* Active rental card */
  .rp-rental-card {
    animation: cardPop 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .rp-rental-field {
    animation: fadeSlideUp 0.35s ease both;
  }

  /* No lease card */
  .rp-no-lease {
    animation: cardPop 0.45s ease both;
  }
  .rp-no-lease-icon {
    animation: bounceIn 0.5s ease 0.1s both;
  }

  /* Modals */
  .rp-overlay {
    animation: overlayIn 0.2s ease both;
  }
  .rp-modal {
    animation: modalIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .rp-modal-close {
    transition: transform 0.15s ease, background-color 0.15s ease;
  }
  .rp-modal-close:hover {
    transform: scale(1.1);
  }
  .rp-modal-close:active {
    transform: scale(0.92);
  }
  .rp-modal-btn {
    position: relative;
    overflow: hidden;
    transition: transform 0.15s ease, background-color 0.2s ease;
  }
  .rp-modal-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  .rp-modal-btn:active:not(:disabled) {
    transform: scale(0.97);
  }
  .rp-modal-btn-primary::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }

  /* Success state */
  .rp-success-icon {
    animation: successPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @media (prefers-reduced-motion: reduce) {
    .rp-topbar, .rp-avatar, .rp-name, .rp-email, .rp-badge, .rp-edit-btn,
    .rp-section-label, .rp-menu-group, .rp-menu-row, .rp-rental-card,
    .rp-rental-field, .rp-no-lease, .rp-no-lease-icon, .rp-overlay,
    .rp-modal, .rp-modal-close, .rp-modal-btn, .rp-success-icon {
      animation: none !important;
      transition: none !important;
    }
  }
`

/* ── Section header label ────────────────────────────────────── */
function SectionLabel({ children, style }) {
  return (
    <p
      className="rp-section-label text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 md:px-6 pt-5 pb-2"
      style={style}
    >
      {children}
    </p>
  )
}

/* ── Menu row ────────────────────────────────────────────────── */
function MenuRow({ icon: Icon, label, external, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rp-menu-row w-full flex items-center justify-between px-4 md:px-6 py-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#f0f7f0] flex items-center justify-center shrink-0">
          <Icon size={16} className="text-[#1a5c2a]" />
        </div>
        <span className="text-sm font-medium text-gray-800">{label}</span>
      </div>
      {external
        ? <ExternalLink size={15} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
        : <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
      }
    </button>
  )
}

/* ── Divider between rows ────────────────────────────────────── */
function RowDivider() {
  return <div className="mx-4 md:mx-6 border-t border-gray-100" />
}

/* ── Main component ──────────────────────────────────────────── */
export default function RenterProfile({ onLogout }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [activeRental, setActiveRental] = useState(null)
  const [loadingRental, setLoadingRental] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState(getUser() || {})
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ firstName: '', middleName: '', lastName: '', suffix: '', contactNumber: '' })
  const [showSuffixDropdown, setShowSuffixDropdown] = useState(false)
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [checkingCurrentPassword, setCheckingCurrentPassword] = useState(false)
  const [currentPasswordValid, setCurrentPasswordValid] = useState(null)
  const [currentPasswordTimeout, setCurrentPasswordTimeout] = useState(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showStrengthTooltip, setShowStrengthTooltip] = useState(false)

  const isMinLength = passwordForm.newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(passwordForm.newPassword)
  const hasDigit = /[0-9]/.test(passwordForm.newPassword)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(passwordForm.newPassword)
  const isPasswordValid = isMinLength && hasUppercase && hasDigit && hasSpecial
  const passwordsMatch = passwordForm.confirmPassword.length > 0 && passwordForm.confirmPassword === passwordForm.newPassword

  const passwordStrength = useMemo(() => {
    if (!passwordForm.newPassword) return { score: 0, label: '', color: 'text-slate-400', barColor: 'bg-slate-200' }
    if (passwordForm.newPassword.length < 8) return { score: 1, label: 'Weak (too short)', color: 'text-red-500', barColor: 'bg-red-500' }
    let score = 1
    if (/[A-Z]/.test(passwordForm.newPassword)) score++
    if (/[0-9]/.test(passwordForm.newPassword)) score++
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(passwordForm.newPassword)) score++
    if (score === 4) return { score, label: 'Strong', color: 'text-green-600', barColor: 'bg-green-600' }
    if (score === 3) return { score, label: 'Medium', color: 'text-amber-500', barColor: 'bg-amber-500' }
    return { score, label: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' }
  }, [passwordForm.newPassword])

  const closePasswordModal = () => {
    setShowPasswordModal(false)
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setShowStrengthTooltip(false)
  }

  /* ── Contact Admin state ── */
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactForm, setContactForm] = useState({ subject: '', message: '' })
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [activeContactTab, setActiveContactTab] = useState('send') // 'send' | 'inbox'
  const [renterMessages, setRenterMessages] = useState([])
  const [loadingInbox, setLoadingInbox] = useState(false)
  const [expandedMessageId, setExpandedMessageId] = useState(null)

  const fetchRenterMessages = async () => {
    if (!user || !user.email) return
    setLoadingInbox(true)
    try {
      const res = await fetch(`/api/renter/contact-messages?email=${encodeURIComponent(user.email)}`)
      if (res.ok) {
        const data = await res.json()
        setRenterMessages(data)
      }
    } catch (err) {
      console.error('Failed to fetch renter contact messages:', err)
    } finally {
      setLoadingInbox(false)
    }
  }

  const fileInputRef = useRef(null)

  const updateProfile = async (data) => {
    setUpdating(true)
    try {
      const token = getToken()
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

  const handleAvatarClick = () => fileInputRef.current.click()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => updateProfile({ profilePicture: reader.result })
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

  const handleSecuritySettings = () => setShowPasswordModal(true)

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))

    if (name === 'currentPassword') {
      if (currentPasswordTimeout) clearTimeout(currentPasswordTimeout)
      if (!value) {
        setCurrentPasswordValid(null)
        return
      }
      setCurrentPasswordValid(null)
      setCurrentPasswordTimeout(setTimeout(async () => {
        setCheckingCurrentPassword(true)
        try {
          const token = getToken()
          const res = await fetch('/api/verify-current-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password: value })
          })
          if (res.ok) {
            const data = await res.json()
            setCurrentPasswordValid(data.valid)
          }
        } catch (err) {
          console.error(err)
        } finally {
          setCheckingCurrentPassword(false)
        }
      }, 400))
    }
  }

  const submitPasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    try {
      const token = getToken()
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      })
      if (!res.ok) throw new Error('Password change failed')
      alert('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setCurrentPasswordValid(null)
      closePasswordModal()
    } catch (err) {
      console.error(err)
      alert('Error: ' + err.message)
    }
  }

  /* ── Contact Admin handlers ── */
  const openContactModal = () => {
    setContactForm({ subject: '', message: '' })
    setMessageSent(false)
    setActiveContactTab('send')
    setRenterMessages([])
    setExpandedMessageId(null)
    setShowContactModal(true)
  }

  const handleContactInputChange = (e) => {
    const { name, value } = e.target
    setContactForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    setSendingMessage(true)
    try {
      const token = getToken()
      const res = await fetch('/api/contact-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: contactForm.subject,
          message: contactForm.message,
          renterName: currentUser.full_name || currentUser.name,
          renterEmail: currentUser.email,
          renterContact: currentUser.contact_number || '',
        })
      })
      if (!res.ok) throw new Error('Failed to send message')
      setMessageSent(true)
      setTimeout(() => {
        setShowContactModal(false)
        setMessageSent(false)
        setContactForm({ subject: '', message: '' })
      }, 2200)
    } catch (err) {
      console.error(err)
      alert('Error sending message: ' + err.message)
    } finally {
      setSendingMessage(false)
    }
  }

  const currentUser = user

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getToken()
        if (!token) return
        const res = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          saveUser(data)
          setUser(data)
        }
      } catch (err) {
        console.error('Error fetching renter profile:', err)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    if (!user || !user.email) { setLoadingRental(false); return }
    fetch(`/api/renter/active-lease?email=${encodeURIComponent(user.email)}`)
      .then(res => { if (!res.ok) throw new Error('Failed'); return res.json() })
      .then(data => {
        if (data) {
          setActiveRental({
            stallNumber: data.stallNumber,
            section: `${data.section} Section`,
            monthlyRate: data.monthlyRate,
            nextDue: data.nextDue,
            status: data.status.toUpperCase()
          })
        } else {
          setActiveRental(null)
        }
        setLoadingRental(false)
      })
      .catch(err => { console.error('Error fetching profile lease details:', err); setLoadingRental(false) })
  }, [user?.email])

  const handleLogout = () => {
    setLoggingOut(true)
    setTimeout(() => onLogout?.(), 600)
  }

  const getInitials = (name) => {
    if (!name) return 'R'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <>
      <style>{profileStyles}</style>
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f5f0]">

        {/* ── Top bar ── */}
        <header className="rp-topbar bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[#1a5c2a] font-extrabold text-sm tracking-tight md:invisible">
            <ShoppingBag size={15} />
            MyTalipapa
          </div>
          <div className="ml-auto flex items-center">
            <NotificationBell />
          </div>
        </header>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto pb-24 md:pb-8">

          {/* ── Hero: avatar + name + badge + edit ── */}
          <div className="flex flex-col items-center pt-8 pb-5 px-4">

            {/* Avatar */}
            <div
              className="rp-avatar relative mb-3 cursor-pointer group"
              onClick={handleAvatarClick}
              title="Click to upload profile picture"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*"
              />
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-200 flex items-center justify-center text-gray-500 font-extrabold text-xl group-hover:opacity-90 transition-opacity">
                {currentUser.profilePicture ? (
                  <img
                    src={currentUser.profilePicture}
                    alt={currentUser.full_name || currentUser.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getInitials(currentUser.full_name || currentUser.name)}</span>
                )}
              </div>
              <div className="absolute bottom-0.5 right-0.5 w-6 h-6 bg-[#1a5c2a] rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <Edit size={10} color="white" />
              </div>
            </div>

            {/* Name */}
            <h1 className="rp-name text-lg font-extrabold text-gray-900 text-center leading-tight">
              {currentUser.full_name || currentUser.name || 'Renter Account'}
            </h1>

            {/* Email */}
            <p className="rp-email text-xs text-gray-400 text-center mt-1">
              {currentUser.email || 'renter@mytalipapa.com'}
            </p>

            {/* Contact number */}
            {currentUser.contact_number && (
              <p className="rp-email text-[11px] text-gray-400 text-center mt-0.5" style={{ animationDelay: '0.18s' }}>
                {currentUser.contact_number}
              </p>
            )}

            {/* Verified badge */}
            <div className="rp-badge flex items-center gap-1 mt-3 bg-[#1a5c2a] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              <CheckCircle size={10} />
              Verified Renter
            </div>

            {/* Edit Profile button */}
            <button
              onClick={openEditModal}
              className="rp-edit-btn mt-4 bg-[#1a5c2a] hover:bg-[#154d23] text-white text-sm font-bold px-8 py-2.5 rounded-xl shadow-sm"
            >
              Edit Profile
            </button>
          </div>

          {/* ── Account Settings ── */}
          <SectionLabel style={{ animationDelay: '0.28s' }}>Account Settings</SectionLabel>

          <div className="rp-menu-group bg-white border-y border-gray-100" style={{ animationDelay: '0.32s' }}>
            <MenuRow icon={User} label="Personal Information" onClick={openEditModal} />
            <RowDivider />
            <MenuRow icon={Shield} label="Change Password" onClick={handleSecuritySettings} />
          </div>

          {/* ── Help & Support ── */}
          <SectionLabel style={{ animationDelay: '0.38s' }}>Help &amp; Support</SectionLabel>

          <div className="rp-menu-group bg-white border-y border-gray-100" style={{ animationDelay: '0.42s' }}>
            <MenuRow icon={MessageSquare} label="Contact Admin" onClick={openContactModal} />
          </div>

          {/* ── Account / Logout ── */}
          <SectionLabel style={{ animationDelay: '0.44s' }}>Account</SectionLabel>

          <div className="rp-menu-group bg-white border-y border-gray-100" style={{ animationDelay: '0.48s' }}>
            <button
              onClick={() => setShowLogout(true)}
              disabled={loggingOut}
              className="rp-menu-row w-full flex items-center justify-between px-4 md:px-6 py-3.5 bg-white hover:bg-red-50 active:bg-red-100 group disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <LogOut size={16} className="text-red-500" />
                </div>
                <span className="text-sm font-medium text-red-500">
                  {loggingOut ? 'Logging out…' : 'Log Out'}
                </span>
              </div>
              <ChevronRight size={15} className="text-red-300 group-hover:text-red-400 transition-colors" />
            </button>
          </div>

          {/* ── Active Rental Info card ── */}
          {activeRental ? (
            <div className="rp-rental-card mx-4 md:mx-6 mt-5 bg-[#e8621a] rounded-2xl p-4 relative overflow-hidden shadow-sm" style={{ animationDelay: '0.54s' }}>
              <span className="absolute top-3.5 right-3.5 bg-white/25 text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                {activeRental.status}
              </span>

              <p className="text-white font-extrabold text-sm mb-0.5">Active Rental Info</p>
              <p className="text-white/75 text-[11px] mb-4">{activeRental.section}</p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: 'Stall Number', value: activeRental.stallNumber },
                  { label: 'Monthly Rate', value: activeRental.monthlyRate },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    className="rp-rental-field bg-white/20 rounded-xl px-3 py-2.5"
                    style={{ animationDelay: `${0.60 + i * 0.07}s` }}
                  >
                    <p className="text-white/70 text-[9px] font-bold uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-white font-extrabold text-sm">{value}</p>
                  </div>
                ))}
              </div>

              <div
                className="rp-rental-field flex items-center gap-1.5 text-white/90 text-[11px] font-semibold"
                style={{ animationDelay: '0.74s' }}
              >
                <Calendar size={12} />
                Next payment due: <span className="font-extrabold">{activeRental.nextDue}</span>
              </div>
            </div>
          ) : !loadingRental && (
            <div className="rp-no-lease mx-4 md:mx-6 mt-5 bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm" style={{ animationDelay: '0.54s' }}>
              <div className="rp-no-lease-icon w-12 h-12 bg-[#edf5ed] rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag size={20} className="text-[#1a5c2a]" />
              </div>
              <p className="font-bold text-gray-800 text-sm">No Active Lease</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Once your stall rental inquiry is approved by the contractor, your active rental lease info will appear here.
              </p>
            </div>
          )}

        </div>

        {/* ── Logout Confirmation Modal ── */}
        {showLogout && (
          <div
            className="rp-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLogout(false)}
          >
            <div
              className="rp-modal bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex flex-col items-center pt-8 pb-2 px-6">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <LogOut size={24} className="text-red-500" />
                </div>
                <h3 className="text-base font-extrabold text-gray-900 text-center">Log Out?</h3>
                <p className="text-xs text-gray-400 text-center mt-2 mb-6">
                  You'll be signed out of your renter session.
                </p>
              </div>
              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="rp-modal-btn flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="rp-modal-btn flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loggingOut ? 'Logging out…' : 'Yes, Log Out'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirm Save Changes Modal ── */}
        {showConfirmSaveModal && (
          <div
            className="rp-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowConfirmSaveModal(false)}
          >
            <div
              className="rp-modal bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
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
                  className="rp-modal-btn flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSaveProfile}
                  disabled={updating}
                  className="rp-modal-btn flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors"
                >
                  {updating ? 'Saving…' : 'Yes, Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Profile Modal ── */}
        {showEditModal && (
          <div
            className="rp-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <div
              className="rp-modal bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900">Personal Information</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="rp-modal-close w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3" style={{ animation: 'fadeSlideUp 0.32s ease 0.05s both' }}>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
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
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Middle Name / Initial</label>
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
                <div className={`grid grid-cols-2 gap-3 relative ${showSuffixDropdown ? 'z-20' : 'z-0'}`} style={{ animation: 'fadeSlideUp 0.32s ease 0.08s both' }}>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
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
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Suffix</label>
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
                                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${editForm.suffix === opt
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
                <div style={{ animation: 'fadeSlideUp 0.32s ease 0.1s both' }}>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Contact Number</label>
                  <input
                    type="text"
                    value={editForm.contactNumber}
                    onChange={(e) => setEditForm(f => ({ ...f, contactNumber: e.target.value }))}
                    required
                    className="w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#1a5c2a] focus:bg-white transition-all duration-200"
                    placeholder="+63 912 345 6789"
                  />
                </div>
                <div style={{ animation: 'fadeSlideUp 0.32s ease 0.15s both' }}>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address (Read-only)</label>
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="w-full bg-gray-50 border border-gray-200/50 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div className="pt-2 flex gap-3" style={{ animation: 'fadeSlideUp 0.32s ease 0.2s both' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="rp-modal-btn flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="rp-modal-btn rp-modal-btn-primary flex-1 py-3 rounded-xl bg-[#1a5c2a] hover:bg-[#154d23] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {updating ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Change Password Modal ── */}
        {showPasswordModal && (
          <div
            className="rp-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closePasswordModal}
          >
            <div
              className="rp-modal bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-extrabold text-gray-900">Change Password</h3>
                <button
                  onClick={closePasswordModal}
                  className="rp-modal-close w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={submitPasswordChange} className="p-6 space-y-4">
                {/* Current Password */}
                <div style={{ animation: 'fadeSlideUp 0.32s ease 0.05s both' }}>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-left">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordInputChange}
                      required
                      className={`w-full border rounded-xl pl-4 pr-24 py-3 text-sm text-gray-800 focus:outline-none transition-all ${currentPasswordValid === true ? 'border-green-600 bg-green-50/20' : currentPasswordValid === false ? 'border-red-500 bg-red-50/20' : 'border-gray-200 focus:ring-2 focus:ring-[#1a5c2a] focus:border-transparent'
                        }`}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {checkingCurrentPassword && <span className="text-gray-400 text-xs">Checking…</span>}
                      {!checkingCurrentPassword && currentPasswordValid === true && <span className="text-green-600 font-extrabold text-xs">✓ Match</span>}
                      {!checkingCurrentPassword && currentPasswordValid === false && <span className="text-red-500 font-extrabold text-xs">✗ Incorrect</span>}
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* New Password */}
                <div style={{ animation: 'fadeSlideUp 0.32s ease 0.12s both' }}>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-left">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordInputChange}
                      required
                      className="w-full border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Password Strength Meter */}
                  <div className="mt-3 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-150 relative">
                    <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-500 uppercase tracking-wider">Password Strength</span>
                        <div className="relative">
                          <button
                            type="button"
                            onMouseEnter={() => setShowStrengthTooltip(true)}
                            onMouseLeave={() => setShowStrengthTooltip(false)}
                            onClick={() => setShowStrengthTooltip(!showStrengthTooltip)}
                            className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors mt-0.5 flex items-center"
                            aria-label="Password requirements info"
                          >
                            <HelpCircle size={11} />
                          </button>
                          {showStrengthTooltip && (
                            <div
                              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] p-3 rounded-lg shadow-xl w-48 z-20 space-y-2 border border-slate-700 pointer-events-none"
                              style={{ animation: 'slideInDown 0.2s ease both' }}
                            >
                              <p className="font-bold text-slate-300 border-b border-slate-700 pb-1.5 mb-1.5 text-left">Requirements:</p>
                              <div className="flex items-center gap-2.5 text-left">
                                <span className={isMinLength ? 'text-green-400 font-bold' : 'text-slate-500 font-bold'}>{isMinLength ? '✓' : '✗'}</span>
                                <span className={isMinLength ? 'text-slate-100 font-semibold' : 'text-slate-400'}>Min. 8 characters</span>
                              </div>
                              <div className="flex items-center gap-2.5 text-left">
                                <span className={hasUppercase ? 'text-green-400 font-bold' : 'text-slate-500 font-bold'}>{hasUppercase ? '✓' : '✗'}</span>
                                <span className={hasUppercase ? 'text-slate-100 font-semibold' : 'text-slate-400'}>One uppercase letter</span>
                              </div>
                              <div className="flex items-center gap-2.5 text-left">
                                <span className={hasDigit ? 'text-green-400 font-bold' : 'text-slate-500 font-bold'}>{hasDigit ? '✓' : '✗'}</span>
                                <span className={hasDigit ? 'text-slate-100 font-semibold' : 'text-slate-400'}>One number</span>
                              </div>
                              <div className="flex items-center gap-2.5 text-left">
                                <span className={hasSpecial ? 'text-green-400 font-bold' : 'text-slate-500 font-bold'}>{hasSpecial ? '✓' : '✗'}</span>
                                <span className={hasSpecial ? 'text-slate-100 font-semibold' : 'text-slate-400'}>One special character</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`font-bold uppercase tracking-wider ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1.5 w-full">
                      <div className={`flex-1 h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.barColor : 'bg-slate-200'}`} />
                      <div className={`flex-1 h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.barColor : 'bg-slate-200'}`} />
                      <div className={`flex-1 h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.barColor : 'bg-slate-200'}`} />
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={{ animation: 'fadeSlideUp 0.32s ease 0.19s both' }}>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-left">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordInputChange}
                      required
                      className={`w-full border rounded-xl pl-4 pr-24 py-3 text-sm text-gray-800 focus:outline-none transition-all ${passwordForm.confirmPassword.length === 0 ? 'border-gray-200 focus:ring-2 focus:ring-[#1a5c2a] focus:border-transparent' : (passwordForm.confirmPassword === passwordForm.newPassword) ? 'border-green-600 bg-green-50/20' : 'border-red-500 bg-red-50/20'
                        }`}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {passwordForm.confirmPassword.length > 0 && (
                        (passwordForm.confirmPassword === passwordForm.newPassword) ? <span className="text-green-600 text-xs font-semibold">✓ Matches</span> : <span className="text-red-500 text-xs font-semibold">✗ Mismatch</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3" style={{ animation: 'fadeSlideUp 0.32s ease 0.26s both' }}>
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="rp-modal-btn flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !currentPasswordValid ||
                      !(passwordForm.newPassword.length >= 8 &&
                        /[A-Z]/.test(passwordForm.newPassword) &&
                        /[a-z]/.test(passwordForm.newPassword) &&
                        /[0-9]/.test(passwordForm.newPassword) &&
                        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(passwordForm.newPassword)) ||
                      passwordForm.confirmPassword !== passwordForm.newPassword
                    }
                    className="rp-modal-btn rp-modal-btn-primary flex-1 py-3 rounded-xl bg-[#1a5c2a] hover:bg-[#154d23] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Contact Admin Modal ── */}
        {showContactModal && (
          <div
            className="rp-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { if (!sendingMessage) setShowContactModal(false) }}
          >
            <div
              className="rp-modal bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#f0f7f0] flex items-center justify-center">
                    <MessageSquare size={14} className="text-[#1a5c2a]" />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900">Contact Admin</h3>
                </div>
                <button
                  onClick={() => { if (!sendingMessage) setShowContactModal(false) }}
                  className="rp-modal-close w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-3 flex border-b border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveContactTab('send')}
                  className={`flex-1 pb-2.5 text-center text-xs font-extrabold border-b-2 transition-all ${activeContactTab === 'send'
                    ? 'border-[#1a5c2a] text-[#1a5c2a]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                  Send Message
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveContactTab('inbox');
                    fetchRenterMessages();
                  }}
                  className={`flex-1 pb-2.5 text-center text-xs font-extrabold border-b-2 transition-all relative ${activeContactTab === 'inbox'
                    ? 'border-[#1a5c2a] text-[#1a5c2a]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                  Message History
                  {renterMessages.some(m => m.reply && m.status === 'unread') && (
                    <span className="absolute top-0.5 right-6 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto">
                {activeContactTab === 'send' ? (
                  messageSent ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                      <div className="rp-success-icon w-16 h-16 rounded-full bg-[#edf5ed] flex items-center justify-center">
                        <CheckCircle size={32} className="text-[#1a5c2a]" />
                      </div>
                      <p className="font-extrabold text-gray-900 text-base">Message Sent!</p>
                      <p className="text-xs text-gray-400 max-w-xs">
                        Your message has been sent to the admin. They will get back to you soon.
                      </p>
                    </div>
                  ) : (
                    /* Form */
                    <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                      {/* Renter info (read-only preview) */}
                      <div className="bg-[#f5f5f0] rounded-xl px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1a5c2a] flex items-center justify-center text-white text-xs font-extrabold shrink-0">
                          {getInitials(currentUser.full_name || currentUser.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {currentUser.full_name || currentUser.name || 'Renter'}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{currentUser.email}</p>
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Subject
                        </label>
                        <input
                          type="text"
                          name="subject"
                          value={contactForm.subject}
                          onChange={handleContactInputChange}
                          required
                          maxLength={120}
                          className="w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#1a5c2a] focus:bg-white transition-all duration-200"
                          placeholder="e.g. Payment concern, Stall issue…"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Message
                        </label>
                        <textarea
                          name="message"
                          value={contactForm.message}
                          onChange={handleContactInputChange}
                          required
                          rows={4}
                          maxLength={1000}
                          className="w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#1a5c2a] focus:bg-white transition-all duration-200 resize-none"
                          placeholder="Describe your concern in detail…"
                        />
                        <p className="text-right text-[10px] text-gray-300 mt-1">
                          {contactForm.message.length}/1000
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="pt-1 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowContactModal(false)}
                          disabled={sendingMessage}
                          className="rp-modal-btn flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={sendingMessage}
                          className="rp-modal-btn rp-modal-btn-primary flex-1 py-3 rounded-xl bg-[#1a5c2a] hover:bg-[#154d23] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-70"
                        >
                          {sendingMessage ? (
                            <>
                              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                              Sending…
                            </>
                          ) : (
                            <>
                              <Send size={12} />
                              Send Message
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  /* Inbox / Message History List */
                  <div className="p-4 space-y-3">
                    {loadingInbox ? (
                      <div className="flex flex-col items-center justify-center py-10">
                        <svg className="animate-spin h-6 w-6 text-[#1a5c2a]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span className="text-xs text-gray-400 mt-2 font-semibold">Loading history…</span>
                      </div>
                    ) : renterMessages.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                        <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-xs font-bold">No Message History</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Inquiries you send will be displayed here.</p>
                      </div>
                    ) : (
                      renterMessages.map(msg => {
                        const isExpanded = expandedMessageId === msg._id;
                        return (
                          <div
                            key={msg._id}
                            className={`border border-gray-100 rounded-2xl overflow-hidden transition-all duration-200 ${isExpanded ? 'bg-gray-50 border-gray-200' : 'bg-white hover:bg-gray-50'
                              }`}
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedMessageId(isExpanded ? null : msg._id)}
                              className="w-full text-left p-4 flex items-start justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-gray-800 truncate">
                                    {msg.subject}
                                  </span>
                                  {msg.reply && (
                                    <span className="bg-[#edf5ed] text-[#1a5c2a] text-[8px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">
                                      Replied
                                    </span>
                                  )}
                                </div>
                                <span className="block text-[9px] text-gray-400 font-semibold mt-1">
                                  {new Date(msg.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <ChevronRight
                                size={14}
                                className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                            </button>

                            {isExpanded && (
                              <div className="px-4 pb-4 space-y-3 border-t border-gray-100/50 pt-3">
                                <div>
                                  <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                                    Your Message
                                  </span>
                                  <p className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-gray-50 whitespace-pre-wrap">
                                    {msg.message}
                                  </p>
                                </div>

                                {msg.reply ? (
                                  <div className="bg-[#f0f7f0] p-3 rounded-xl border border-[#1a5c2a]/10">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-[#1a5c2a]">
                                      <MessageSquare size={10} />
                                      <span className="text-[9px] font-extrabold uppercase tracking-wider">
                                        Admin Response
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-gray-100">
                                      {msg.reply}
                                    </p>
                                    <span className="block text-[8px] text-gray-400 font-semibold mt-2">
                                      Date replied: {new Date(msg.repliedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="bg-yellow-50/50 p-2.5 rounded-xl border border-yellow-100 text-yellow-700 text-[10px] font-semibold">
                                    ⏳ Waiting for Admin response.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}