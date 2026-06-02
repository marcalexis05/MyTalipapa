/**
 * RenterApplications.jsx
 * My Applications page — list view + new inquiry form.
 *
 * Props:
 *   onNavigate(tab) – navigate to another tab in RenterLayout
 *   prefill         – optional { preferredStall } from StallDetails
 */
import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft, Store, Send, Clock, ChevronDown,
  CheckCircle, XCircle, AlertCircle,
  MapPin, Calendar, Eye, User,
  SlidersHorizontal, Fish, Beef, Leaf, Search, X,
} from 'lucide-react'
import { getUser } from '../../utils/auth'
import NotificationBell from '../../components/NotificationBell'

/* ── Animations ──────────────────────────────────────────────── */
const appStyles = `
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
    0%   { opacity: 0; transform: scale(0.85); }
    60%  { transform: scale(1.04); }
    80%  { transform: scale(0.98); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.94) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes sheetIn {
    from { opacity: 0; transform: translateY(100%); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .ra-topbar    { animation: fadeSlideDown 0.35s ease both; }
  .ra-heading   { animation: fadeSlideUp 0.38s ease both; }
  .ra-stat-card { animation: cardPop 0.42s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .ra-app-card  {
    animation: cardPop 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .ra-app-card:hover {
    transform: translateY(-3px) scale(1.01);
    box-shadow: 0 8px 24px rgba(0,0,0,0.09);
  }
  .ra-empty { animation: fadeSlideUp 0.4s ease both; }
  .ra-submit-btn {
    position: relative; overflow: hidden;
    transition: transform 0.15s ease, background-color 0.2s ease;
  }
  .ra-submit-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .ra-submit-btn:active:not(:disabled) { transform: scale(0.97); }
  .ra-submit-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    background-size: 200% 100%; animation: shimmer 2s infinite;
  }
  .ra-view-btn { transition: transform 0.15s ease, background-color 0.15s ease; }
  .ra-view-btn:hover  { transform: scale(1.04); }
  .ra-view-btn:active { transform: scale(0.95); }

  /* Filter bar */
  .ra-filterbar { animation: fadeSlideUp 0.35s ease 0.04s both; }
  .ra-status-chip {
    transition: background-color 0.16s ease, color 0.16s ease, transform 0.12s ease;
  }
  .ra-status-chip:active { transform: scale(0.93); }

  /* Filter bottom-sheet */
  .ra-sheet-overlay { animation: overlayIn 0.2s ease both; }
  .ra-sheet         { animation: sheetIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .ra-sheet-option  { transition: background-color 0.15s ease, transform 0.12s ease; }
  .ra-sheet-option:active { transform: scale(0.97); }

  /* Stall picker modal */
  .ra-stall-overlay { animation: overlayIn 0.18s ease both; }
  .ra-stall-modal   { animation: sheetIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .ra-stall-item    { transition: background-color 0.14s ease; }
  .ra-stall-item:hover { background: #f0f7f0; }
  .ra-stall-item.selected { background: #edf5ed; }

  /* Section header accent */
  .ra-section-fish { color: #1a5c8c; }
  .ra-section-meat { color: #8c2a1a; }
  .ra-section-veg  { color: #2a6b1a; }
  .ra-section-other{ color: #6b6b5a; }

  /* Form view */
  .ra-brand          { animation: bounceIn 0.45s ease both; }
  .ra-prefill-notice { animation: fadeSlideUp 0.35s ease 0.08s both; }
  .ra-form-card      { animation: fadeSlideUp 0.4s ease both; }
  .ra-success        { animation: bounceIn 0.45s ease both; }
  .ra-whats-next     { animation: fadeSlideUp 0.4s ease both; }
  .ra-market-img {
    animation: cardPop 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
    overflow: hidden;
  }
  .ra-market-img:hover img { transform: scale(1.04); }
  .ra-market-img img { transition: transform 0.35s ease; }
  .ra-cta-banner { animation: fadeSlideUp 0.4s ease both; }
  .ra-back-btn   { transition: transform 0.15s ease, opacity 0.15s ease; }
  .ra-back-btn:hover { transform: translateX(-2px); opacity: 0.75; }

  /* Detail modal */
  .ra-overlay { animation: overlayIn 0.2s ease both; }
  .ra-modal   { animation: modalIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .ra-modal-close { transition: transform 0.15s ease, background-color 0.15s ease; }
  .ra-modal-close:hover  { transform: scale(1.1); }
  .ra-modal-close:active { transform: scale(0.92); }

  /* Custom stall trigger */
  .ra-stall-trigger {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    background: #f5f5f0; border: 1.5px solid transparent; border-radius: 0.75rem;
    padding: 0.75rem 1rem; cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;
    text-align: left;
  }
  .ra-stall-trigger:hover { border-color: #c3dfc3; }
  .ra-stall-trigger.open, .ra-stall-trigger:focus { border-color: #1a5c2a; background: white; outline: none; }

  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
  }
`

/* ── Static data ─────────────────────────────────────────────── */
const MARKET_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=600&q=80', alt: 'Market interior' },
  { src: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80', alt: 'Fresh produce' },
]

/* ── Status config ───────────────────────────────────────────── */
const STATUS_CFG = {
  Approved: { pill: 'bg-[#1a5c2a] text-white', Icon: CheckCircle, label: 'APPROVED' },
  Pending: { pill: 'bg-[#e8621a] text-white', Icon: AlertCircle, label: 'PENDING' },
  Rejected: { pill: 'bg-red-600 text-white', Icon: XCircle, label: 'REJECTED' },
}

/* ── Section classifier ──────────────────────────────────────── */
const SECTIONS = ['Meat', 'Fishes', 'Vegetables', 'Other']
const SECTION_META = {
  Meat: { color: 'bg-red-50 text-red-700', border: 'border-red-100', dot: 'bg-red-400', cls: 'ra-section-meat' },
  Fishes: { color: 'bg-blue-50 text-blue-700', border: 'border-blue-100', dot: 'bg-blue-400', cls: 'ra-section-fish' },
  Vegetables: { color: 'bg-green-50 text-green-700', border: 'border-green-100', dot: 'bg-green-500', cls: 'ra-section-veg' },
  Other: { color: 'bg-gray-50 text-gray-600', border: 'border-gray-100', dot: 'bg-gray-400', cls: 'ra-section-other' },
}
const SectionIcon = ({ sec, size = 14 }) => {
  if (sec === 'Fishes') return <Fish size={size} />
  if (sec === 'Meat') return <Beef size={size} />
  if (sec === 'Vegetables') return <Leaf size={size} />
  return <Store size={size} />
}

function getStallSection(s) {
  const sec = (s.section || s.location || '').toLowerCase()
  if (sec.includes('fish') || sec.includes('sea')) return 'Fishes'
  if (sec.includes('meat')) return 'Meat'
  if (sec.includes('veg') || sec.includes('produce') || sec.includes('vegetable')) return 'Vegetables'
  return 'Other'
}

/* ── Shared form styles ──────────────────────────────────────── */
const fieldLabel = 'block text-xs font-semibold text-gray-700 mb-1.5'
const inputCls =
  'w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 ' +
  'text-sm text-gray-800 placeholder-gray-400 ' +
  'focus:outline-none focus:border-[#1a5c2a] focus:bg-white transition-all duration-200'

/* ════════════════════════════════════════════════════════════════
   StallPickerModal — grouped, searchable stall selector
   ════════════════════════════════════════════════════════════════ */
function StallPickerModal({ stallsList, value, onChange, onClose }) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const searchRef = useRef(null)

  useEffect(() => { searchRef.current?.focus() }, [])

  const grouped = SECTIONS.reduce((acc, key) => { acc[key] = []; return acc }, {})
  stallsList.forEach(s => grouped[getStallSection(s)].push(s))
  const visibleSections = SECTIONS.filter(sec => grouped[sec].length > 0)

  const filterStalls = (list) =>
    search
      ? list.filter(s =>
        (s.location || `Stall #${s.stallNumber}`)
          .toLowerCase().includes(search.toLowerCase()))
      : list

  const tabSections = activeTab === 'All' ? visibleSections : [activeTab]

  return (
    <div
      className="ra-stall-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="ra-stall-modal bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-extrabold text-gray-900 text-sm">Choose a Stall</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{stallsList.length} stalls available</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stall number or zone…"
              className="w-full bg-[#f5f5f0] rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white border border-transparent focus:border-[#1a5c2a] transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Section tabs */}
          {!search && (
            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5 scrollbar-none">
              {['All', ...visibleSections].map(tab => {
                const isActive = activeTab === tab
                const meta = SECTION_META[tab]
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`ra-status-chip shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${isActive
                        ? tab === 'All'
                          ? 'bg-gray-800 text-white border-gray-800'
                          : `${meta.color} border-transparent`
                        : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                      }`}
                  >
                    {tab !== 'All' && <SectionIcon sec={tab} size={11} />}
                    {tab}
                    <span className={`text-[9px] px-1 py-0.5 rounded-full font-extrabold ${isActive && tab !== 'All' ? 'bg-white/60' : 'bg-gray-100 text-gray-500'}`}>
                      {tab === 'All' ? stallsList.length : grouped[tab].length}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Stall list */}
        <div className="overflow-y-auto flex-1">
          {tabSections.map(sec => {
            const stalls = filterStalls(grouped[sec])
            if (!stalls.length) return null
            const meta = SECTION_META[sec]
            return (
              <div key={sec}>
                {/* Section header */}
                <div className={`flex items-center gap-2 px-5 py-2.5 sticky top-0 bg-white border-b ${meta.border} z-10`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${meta.color} text-[10px]`}>
                    <SectionIcon sec={sec} size={11} />
                  </div>
                  <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest">{sec}</span>
                  <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${meta.color}`}>
                    {stalls.length}
                  </span>
                </div>

                {/* Stall items */}
                {stalls.map(s => {
                  const isSelected = value === s._id
                  const label = s.location || `Stall #${s.stallNumber}`
                  const isUnavailable = s.status && s.status !== 'available'
                  return (
                    <button
                      key={s._id}
                      disabled={isUnavailable}
                      onClick={() => { onChange(s); onClose() }}
                      className={`ra-stall-item w-full flex items-center justify-between px-5 py-3 border-b border-gray-50 text-left transition-colors ${isSelected ? 'selected' : ''
                        } ${isUnavailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#1a5c2a] text-white' : meta.color}`}>
                          <SectionIcon sec={sec} size={12} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold leading-tight truncate ${isSelected ? 'text-[#1a5c2a]' : 'text-gray-800'}`}>
                            {label}
                          </p>
                          {isUnavailable && (
                            <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{s.status}</p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle size={15} className="text-[#1a5c2a] shrink-0 ml-2" />
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}

          {/* Empty search */}
          {search && tabSections.every(sec => filterStalls(grouped[sec]).length === 0) && (
            <div className="py-10 text-center text-sm text-gray-400 font-semibold">
              No stalls match "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   FilterSheet — bottom-sheet filter for application status
   ════════════════════════════════════════════════════════════════ */
const FILTER_OPTIONS = [
  { key: 'All', label: 'All Applications', desc: 'Show everything', icon: '📋', activeClass: 'border-gray-700 bg-gray-50' },
  { key: 'Approved', label: 'Approved', desc: 'Accepted by management', icon: '✅', activeClass: 'border-[#1a5c2a] bg-[#edf5ed]' },
  { key: 'Pending', label: 'Pending Review', desc: 'Awaiting a decision', icon: '⏳', activeClass: 'border-[#e8621a] bg-[#fff4ee]' },
  { key: 'Rejected', label: 'Rejected', desc: 'Not approved this time', icon: '❌', activeClass: 'border-red-400 bg-red-50' },
]

function FilterSheet({ activeFilter, counts, onSelect, onClose }) {
  return (
    <div
      className="ra-sheet-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="ra-sheet bg-white w-full max-w-md rounded-t-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-2 pt-1 flex items-center justify-between">
          <div>
            <p className="font-extrabold text-gray-900 text-base">Filter Applications</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Select a status to filter your list</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-4 pb-6 pt-2 space-y-2">
          {FILTER_OPTIONS.map(({ key, label, desc, icon, activeClass }) => {
            const isActive = activeFilter === key
            const count = key === 'All' ? (counts.All ?? 0) : (counts[key] ?? 0)
            return (
              <button
                key={key}
                onClick={() => { onSelect(key); onClose() }}
                className={`ra-sheet-option w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${isActive ? activeClass : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <span className="text-lg leading-none shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold leading-tight ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                    {label}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                </div>
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 ${isActive ? 'bg-white/70 text-gray-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                  {count}
                </span>
                {isActive && <CheckCircle size={16} className="text-[#1a5c2a] shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── ApplicationCard ─────────────────────────────────────────── */
function ApplicationCard({ app, onViewDetails, animDelay = '0s' }) {
  const { pill, Icon, label } = STATUS_CFG[app.status] || STATUS_CFG.Pending
  return (
    <div
      className="ra-app-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      style={{ animationDelay: animDelay }}
    >
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">Stall {app.stall}</p>
          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
            <MapPin size={11} />
            <span>{app.zone}</span>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[9px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full ${pill}`}>
          <Icon size={9} />
          {label}
        </span>
      </div>
      <div className="mx-4 border-t border-gray-100" />
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Submitted On</p>
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
            <Calendar size={11} className="text-gray-400" />
            {app.submittedOn}
          </div>
        </div>
        <button
          onClick={() => onViewDetails && onViewDetails(app)}
          className="ra-view-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all"
        >
          <Eye size={12} />
          View Details
        </button>
      </div>
    </div>
  )
}

/* ── TopBar ──────────────────────────────────────────────────── */
function TopBar({ showBack, onBack }) {
  return (
    <header className="ra-topbar bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
      <div className="w-20">
        {showBack && (
          <button onClick={onBack} className="ra-back-btn flex items-center gap-1.5 text-[#1a5c2a] text-sm font-semibold">
            <ArrowLeft size={16} />
            Back
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[#1a5c2a] font-extrabold text-sm tracking-tight md:hidden">
        <Store size={15} />
        MyTalipapa
      </div>
      <div className="flex items-center gap-2 w-20 justify-end">
        <NotificationBell />
      </div>
    </header>
  )
}

/* ════════════════════════════════════════════════════════════════
   Main export
   ════════════════════════════════════════════════════════════════ */
export default function RenterApplications({ prefill }) {
  const [view, setView] = useState('list')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState([])
  const [selectedApp, setSelectedApp] = useState(null)
  const [stallsList, setStallsList] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [showStallPicker, setShowStallPicker] = useState(false)

  const [form, setForm] = useState({
    fullName: getUser()?.full_name || getUser()?.name || '',
    contactNumber: getUser()?.contact_number || '',
    emailAddress: getUser()?.email || '',
    preferredStall: '',
    preferredStallLabel: '',
    intendedBusinessUse: '',
    additionalMessage: '',
  })

  /* ── Fetch helpers ── */
  const fetchApplications = () => {
    const user = getUser()
    const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : ''
    fetch(`/api/renter/applications${emailParam}`)
      .then(res => { if (!res.ok) throw new Error('Failed'); return res.json() })
      .then(data => setApplications(data))
      .catch(() => {
        setApplications([
          { id: 'app-1', stall: '#042', zone: 'Zone A', status: 'Approved', submittedOn: 'Oct 24, 2023' },
          { id: 'app-2', stall: '#115', zone: 'Zone C', status: 'Pending', submittedOn: 'Nov 02, 2023' },
          { id: 'app-3', stall: '#009', zone: 'Zone B', status: 'Rejected', submittedOn: 'Sep 15, 2023' },
        ])
      })
  }

  const fetchStallsList = () => {
    fetch('/api/stalls')
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(data => {
        const withContractor = data.filter(s =>
          s.managedBy && s.managedBy.trim() !== ''
        )
        const sorted = withContractor.sort((a, b) => (parseInt(a.stallNumber) || 0) - (parseInt(b.stallNumber) || 0))
        setStallsList(sorted)
      })
      .catch(err => console.error('Failed to fetch stalls list:', err))
  }

  useEffect(() => { fetchApplications(); fetchStallsList() }, [])

  useEffect(() => {
    if (prefill?.preferredStall) {
      const cleanStall = prefill.preferredStall.replace(/Stall\s*#/gi, '').replace('#', '').trim()
      let businessUse = prefill.intendedBusinessUse || ''
      let targetStallId = prefill.stallId || ''
      let targetLabel = ''

      if (stallsList.length > 0) {
        if (!targetStallId) {
          const found = stallsList.find(s =>
            s.stallNumber === cleanStall &&
            (!businessUse || s.section?.toLowerCase().includes(businessUse.toLowerCase().replace('fishes', 'fish')))
          )
          if (found) { targetStallId = found._id; targetLabel = found.location || `Stall #${found.stallNumber}` }
        } else {
          const found = stallsList.find(s => s._id === targetStallId)
          if (found) {
            targetLabel = found.location || `Stall #${found.stallNumber}`
            const sec = (found.section || '').toLowerCase()
            if (sec.includes('fish') || sec.includes('sea')) businessUse = 'Fishes'
            else if (sec.includes('meat')) businessUse = 'Meat'
            else if (sec.includes('veg') || sec.includes('produce')) businessUse = 'Vegetables'
          }
        }
      }

      setForm(f => ({
        ...f,
        preferredStall: targetStallId || cleanStall,
        preferredStallLabel: targetLabel || prefill.preferredStall,
        intendedBusinessUse: businessUse || f.intendedBusinessUse,
      }))
      setView('form')
    }
  }, [prefill, stallsList])

  /* ── Derived counts ── */
  const totalActive = applications.filter(a => a.status !== 'Rejected').length
  const totalPending = applications.filter(a => a.status === 'Pending').length
  const counts = {
    All: applications.length,
    Approved: applications.filter(a => a.status === 'Approved').length,
    Pending: applications.filter(a => a.status === 'Pending').length,
    Rejected: applications.filter(a => a.status === 'Rejected').length,
  }

  const filteredApplications =
    activeFilter === 'All' ? applications : applications.filter(a => a.status === activeFilter)

  /* ── Form helpers ── */
  const setField = key => e => setForm(f => ({ ...f, [key]: e.target.value }))
  const goToForm = () => { setView('form'); setSubmitted(false) }
  const goToList = () => { setView('list'); setSubmitted(false) }

  /* ── Stall picker selection ── */
  const handleStallSelect = (s) => {
    const sec = getStallSection(s)
    let businessUse = ''
    if (sec === 'Fishes') businessUse = 'Fishes'
    else if (sec === 'Meat') businessUse = 'Meat'
    else if (sec === 'Vegetables') businessUse = 'Vegetables'
    setForm(f => ({
      ...f,
      preferredStall: s._id,
      preferredStallLabel: s.location || `Stall #${s.stallNumber}`,
      intendedBusinessUse: businessUse,
    }))
  }

  /* ── Submit ── */
  const handleSubmit = () => {
    if (loading || submitted || !form.fullName || !form.contactNumber || !form.preferredStall) return
    setLoading(true)

    const payload = {
      fullName: form.fullName,
      contactNumber: form.contactNumber,
      email: form.emailAddress || getUser()?.email || '',
      preferredStall: form.preferredStall,
      intendedBusinessUse: form.intendedBusinessUse || 'Other',
      additionalMessage: form.additionalMessage || '',
    }

    fetch('/api/renter/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => { if (!res.ok) throw new Error('Submission failed'); return res.json() })
      .then(() => {
        setLoading(false); setSubmitted(true); fetchApplications()
        setTimeout(() => {
          setView('list')
          setForm({
            fullName: getUser()?.full_name || getUser()?.name || '',
            contactNumber: getUser()?.contact_number || '',
            emailAddress: getUser()?.email || '',
            preferredStall: '', preferredStallLabel: '',
            intendedBusinessUse: '', additionalMessage: '',
          })
          setSubmitted(false)
        }, 2500)
      })
      .catch(err => {
        console.error('Submit error:', err)
        setLoading(false)
        alert('Failed to submit application: ' + err.message)
      })
  }

  /* ── Active filter display info ── */
  const filterInfo = FILTER_OPTIONS.find(f => f.key === activeFilter)

  return (
    <>
      <style>{appStyles}</style>
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f5f0]">

        <TopBar showBack={view === 'form'} onBack={goToList} />

        <div className="flex-1 overflow-y-auto pb-24 md:pb-8">

          {/* ════════ LIST VIEW ════════ */}
          {view === 'list' && (
            <div className="max-w-2xl mx-auto px-4 md:px-6 pt-5 space-y-4">

              <div className="ra-heading">
                <h1 className="text-xl font-bold text-gray-900">My Applications</h1>
                <p className="text-xs text-gray-400 mt-0.5">Manage and track your market stall requests.</p>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="ra-stat-card bg-[#1a5c2a] rounded-2xl p-4 flex items-center gap-3" style={{ animationDelay: '0.08s' }}>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest">Total Active</p>
                    <p className="text-[28px] font-extrabold text-white leading-none mt-0.5">{String(totalActive).padStart(2, '0')}</p>
                  </div>
                </div>
                <div className="ra-stat-card bg-[#e8621a] rounded-2xl p-4 flex items-center gap-3" style={{ animationDelay: '0.14s' }}>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest">Pending</p>
                    <p className="text-[28px] font-extrabold text-white leading-none mt-0.5">{String(totalPending).padStart(2, '0')}</p>
                  </div>
                </div>
              </div>

              {/* ── Filter bar ── */}
              <div className="ra-filterbar flex items-center gap-2">
                {/* Filter button */}
                <button
                  onClick={() => setShowFilterSheet(true)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border font-bold text-xs transition-all shrink-0 ${activeFilter !== 'All'
                      ? 'bg-[#1a5c2a] text-white border-[#1a5c2a]'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  <SlidersHorizontal size={13} />
                  Filter
                  {activeFilter !== 'All' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  )}
                </button>

                {/* Active filter pill / summary */}
                <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none">
                  {activeFilter === 'All' ? (
                    <div className="flex gap-1.5">
                      {(['Approved', 'Pending', 'Rejected']).map(s => (
                        <button
                          key={s}
                          onClick={() => setActiveFilter(s)}
                          className={`ra-status-chip flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all whitespace-nowrap ${s === 'Approved' ? 'border-[#c3dfc3] bg-white text-[#1a5c2a] hover:bg-[#edf5ed]'
                              : s === 'Pending' ? 'border-orange-200 bg-white text-[#e8621a] hover:bg-[#fff4ee]'
                                : 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                            }`}
                        >
                          {s === 'Approved' && <CheckCircle size={10} />}
                          {s === 'Pending' && <AlertCircle size={10} />}
                          {s === 'Rejected' && <XCircle size={10} />}
                          {s}
                          <span className="text-[9px] font-extrabold opacity-70 ml-0.5">{counts[s]}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                      <span className="text-xs font-bold text-gray-700">{filterInfo?.label}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${activeFilter === 'Approved' ? 'bg-[#edf5ed] text-[#1a5c2a]'
                          : activeFilter === 'Pending' ? 'bg-[#fff4ee] text-[#e8621a]'
                            : 'bg-red-50 text-red-600'
                        }`}>{counts[activeFilter]}</span>
                      <button
                        onClick={() => setActiveFilter('All')}
                        className="ml-1 text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Application list */}
              <div className="space-y-3">
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((app, idx) => (
                    <ApplicationCard
                      key={app.id || app._id}
                      app={app}
                      onViewDetails={setSelectedApp}
                      animDelay={`${0.05 + idx * 0.07}s`}
                    />
                  ))
                ) : (
                  <div className="ra-empty bg-white border border-gray-100 rounded-2xl py-10 px-4 text-center shadow-sm">
                    <p className="text-2xl mb-2">{activeFilter === 'All' ? '' : filterInfo?.icon}</p>
                    <p className="text-sm font-bold text-gray-700 mb-1">
                      {activeFilter === 'All' ? 'No applications yet' : `No ${activeFilter.toLowerCase()} applications`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {activeFilter === 'All'
                        ? 'Submit your first stall inquiry to get started.'
                        : `You have no ${activeFilter.toLowerCase()} applications right now.`}
                    </p>
                    {activeFilter !== 'All' && (
                      <button
                        onClick={() => setActiveFilter('All')}
                        className="mt-3 text-xs font-semibold text-[#1a5c2a] hover:underline"
                      >
                        View all applications
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={goToForm}
                className="ra-submit-btn w-full flex items-center justify-center gap-2 bg-[#1a5c2a] hover:bg-[#154d23] text-white font-bold text-sm rounded-2xl py-3.5 shadow-sm"
                style={{ animation: 'fadeSlideUp 0.4s ease both' }}
              >
                <Send size={15} />
                Submit New Inquiry
              </button>

            </div>
          )}

          {/* ════════ FORM VIEW ════════ */}
          {view === 'form' && (
            <div className="max-w-xl mx-auto px-4 md:px-6 pt-6 space-y-5">

              <div className="ra-brand flex flex-col items-center gap-2 pt-2 pb-1">
                <div className="w-16 h-16 bg-[#1a5c2a] rounded-2xl flex items-center justify-center shadow-md">
                  <Store size={28} color="white" />
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-gray-900 text-base tracking-tight">MyTalipapa</p>
                  <p className="text-gray-400 text-xs mt-0.5">Complete your rental request</p>
                </div>
              </div>

              {prefill?.preferredStall && (
                <div className="ra-prefill-notice bg-[#edf5ed] border border-[#c3dfc3] rounded-xl px-4 py-3 flex items-center gap-2">
                  <Store size={14} className="text-[#1a5c2a] shrink-0" />
                  <p className="text-xs text-[#1a5c2a] font-semibold">
                    Inquiring for <span className="font-extrabold">{prefill.preferredStall}</span>
                  </p>
                </div>
              )}

              <div className="ra-form-card bg-white rounded-2xl shadow-sm p-5 space-y-4" style={{ animationDelay: '0.1s' }}>

                <div>
                  <label className={fieldLabel}>Full Name</label>
                  <input className={inputCls} placeholder="e.g. Juan Dela Cruz"
                    value={form.fullName} onChange={setField('fullName')} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={fieldLabel}>Contact Number</label>
                    <input className={inputCls} placeholder="+63 912 345 6789" type="tel"
                      value={form.contactNumber} onChange={setField('contactNumber')} />
                  </div>
                  <div>
                    <label className={fieldLabel}>Email Address</label>
                    <input className={inputCls} placeholder="juan@example.com" type="email"
                      value={form.emailAddress} onChange={setField('emailAddress')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ── Custom Stall Picker Trigger ── */}
                  <div>
                    <label className={fieldLabel}>Preferred Stall</label>
                    <button
                      type="button"
                      onClick={() => setShowStallPicker(true)}
                      className={`ra-stall-trigger ${showStallPicker ? 'open' : ''}`}
                    >
                      {form.preferredStall ? (
                        <div className="flex items-center gap-2 min-w-0">
                          {form.intendedBusinessUse && (
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${SECTION_META[form.intendedBusinessUse]?.color || 'bg-gray-100 text-gray-500'
                              }`}>
                              <SectionIcon sec={form.intendedBusinessUse} size={12} />
                            </div>
                          )}
                          <span className="text-sm font-semibold text-gray-800 truncate">
                            {form.preferredStallLabel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Select preferred stall…</span>
                      )}
                      <ChevronDown size={14} className="text-gray-400 shrink-0 ml-2" />
                    </button>
                  </div>

                  {/* ── Intended Business Use (read-only, auto-filled) ── */}
                  <div>
                    <label className={fieldLabel}>Intended Business Use</label>
                    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${form.intendedBusinessUse
                        ? `${SECTION_META[form.intendedBusinessUse]?.border || 'border-gray-100'} bg-white`
                        : 'border-transparent bg-[#f5f5f0]'
                      }`}>
                      {form.intendedBusinessUse ? (
                        <>
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${SECTION_META[form.intendedBusinessUse]?.color}`}>
                            <SectionIcon sec={form.intendedBusinessUse} size={12} />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{form.intendedBusinessUse}</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Auto-filled from stall</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={fieldLabel}>Additional Message</label>
                  <textarea className={`${inputCls} resize-none h-28`}
                    placeholder="Tell us more about your business plans…"
                    value={form.additionalMessage} onChange={setField('additionalMessage')} />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || submitted || !form.fullName || !form.contactNumber || !form.preferredStall}
                className="ra-submit-btn w-full flex items-center justify-center gap-2 bg-[#e8621a] hover:bg-[#d45a16] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl py-3.5 shadow-sm"
                style={{ animation: 'fadeSlideUp 0.4s ease 0.18s both' }}
              >
                {loading
                  ? <span className="animate-pulse">Submitting…</span>
                  : submitted
                    ? <span className="flex items-center gap-1.5"><CheckCircle size={15} /> Submitted Successfully</span>
                    : <><Send size={15} /> Submit Inquiry</>
                }
              </button>

              {submitted && (
                <div className="ra-success bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
                    <CheckCircle size={15} color="white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-800 mb-1">Inquiry Submitted!</p>
                    <p className="text-xs text-green-700 leading-relaxed">
                      Your inquiry has been received. Our team will get back to you shortly.
                    </p>
                  </div>
                </div>
              )}

              <div className="ra-whats-next bg-[#fff8f4] border border-[#fde8d8] rounded-2xl p-4 flex gap-3" style={{ animationDelay: '0.24s' }}>
                <div className="w-8 h-8 bg-[#e8621a] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={15} color="white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-1">What's Next?</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Our market management team will review your application. Expect a response
                    within <span className="font-bold text-gray-800">24–48 hours</span> via email or phone.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2">
                {MARKET_IMAGES.map((img, i) => (
                  <div key={i} className="ra-market-img rounded-2xl aspect-video bg-gray-200" style={{ animationDelay: `${0.28 + i * 0.08}s` }}>
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>



            </div>
          )}
        </div>

        {/* ── Filter bottom-sheet ── */}
        {showFilterSheet && (
          <FilterSheet
            activeFilter={activeFilter}
            counts={counts}
            onSelect={setActiveFilter}
            onClose={() => setShowFilterSheet(false)}
          />
        )}

        {/* ── Stall picker modal ── */}
        {showStallPicker && (
          <StallPickerModal
            stallsList={stallsList}
            value={form.preferredStall}
            onChange={handleStallSelect}
            onClose={() => setShowStallPicker(false)}
          />
        )}

        {/* ── Detail Modal ── */}
        {selectedApp && (
          <div
            className="ra-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={() => setSelectedApp(null)}
          >
            <div
              className="ra-modal bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header — fixed */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f0f7f0] flex items-center justify-center text-[#1a5c2a] font-extrabold text-sm shrink-0">
                    {selectedApp.fullName
                      ? selectedApp.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : 'AP'}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 leading-tight">Application Details</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Stall {selectedApp.stall} · {selectedApp.zone || selectedApp.section || 'Market'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="ra-modal-close w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100">
                  ✕
                </button>
              </div>

              {/* Modal body — scrollable, fills remaining space */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
                <div className="flex items-center justify-between bg-[#f9fafb] rounded-xl px-4 py-3" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Application Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${selectedApp.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      selectedApp.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-700'
                    }`}>
                    {selectedApp.status === 'Approved' && <CheckCircle size={10} />}
                    {selectedApp.status === 'Rejected' && <XCircle size={10} />}
                    {selectedApp.status === 'Pending' && <AlertCircle size={10} />}
                    {selectedApp.status}
                  </span>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Stall Information</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Stall Number', value: selectedApp.stall },
                      { label: 'Zone / Floor', value: selectedApp.zone || selectedApp.section || 'N/A' },
                      { label: 'Section', value: selectedApp.section || selectedApp.category || 'N/A' },
                      { label: 'Size', value: selectedApp.size ? `${selectedApp.size} sqm` : 'N/A' },
                      { label: 'Monthly Rate', value: selectedApp.monthlyRate ? `₱${Number(selectedApp.monthlyRate).toLocaleString()}` : 'N/A' },
                      { label: 'Contractor Manager', value: selectedApp.contractorName || 'N/A' },
                      { label: 'Contractor Contact', value: selectedApp.contractorContact || 'N/A' },
                    ].map(({ label, value }, i) => (
                      <div key={label} className="bg-[#f9fafb] rounded-xl p-3 flex flex-col gap-0.5" style={{ animation: 'fadeSlideUp 0.3s ease both', animationDelay: `${0.04 + i * 0.05}s` }}>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                        <span className="text-xs font-semibold text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Applicant Information</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Full Name', value: selectedApp.fullName || 'N/A' },
                      { label: 'Contact', value: selectedApp.contactNumber || 'N/A' },
                      { label: 'Business Type', value: selectedApp.intendedBusinessUse || 'N/A' },
                      { label: 'Submitted On', value: selectedApp.submittedOn || selectedApp.date || 'N/A' },
                    ].map(({ label, value }, i) => (
                      <div key={label} className="bg-[#f9fafb] rounded-xl p-3 flex flex-col gap-0.5" style={{ animation: 'fadeSlideUp 0.3s ease both', animationDelay: `${0.28 + i * 0.05}s` }}>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                        <span className="text-xs font-semibold text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedApp.additionalMessage && (
                  <div className="bg-[#f9fafb] rounded-xl p-3 flex flex-col gap-1.5" style={{ animation: 'fadeSlideUp 0.3s ease 0.48s both' }}>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Additional Message</span>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedApp.additionalMessage}</p>
                  </div>
                )}

                {selectedApp.status === 'Rejected' && selectedApp.rejectionReason && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col gap-1.5" style={{ animation: 'bounceIn 0.35s ease 0.52s both' }}>
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Rejection Reason</span>
                    <p className="text-xs text-red-700 leading-relaxed">{selectedApp.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Modal footer — fixed */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0">
                <button onClick={() => setSelectedApp(null)} className="ra-submit-btn w-full py-2.5 bg-[#1a5c2a] hover:bg-[#154d23] text-white font-bold text-xs rounded-xl shadow-sm">
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}