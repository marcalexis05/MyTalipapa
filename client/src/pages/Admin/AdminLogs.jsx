import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Activity, FileText, CheckCircle2, XCircle, Clock, Search, RefreshCw, Filter } from 'lucide-react'

const PAGE_SIZE = 10

const ACTION_FILTERS = [
  { key: 'all',                   label: 'All'       },
  { key: 'application_submitted', label: 'Submitted' },
  { key: 'application_approved',  label: 'Approved'  },
  { key: 'application_rejected',  label: 'Rejected'  },
]

const ACTION_META = {
  application_submitted: {
    Icon: FileText,
    bg: 'bg-blue-50', text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700', label: 'Submitted',
  },
  application_approved: {
    Icon: CheckCircle2,
    bg: 'bg-green-50', text: 'text-green-600',
    badge: 'bg-green-100 text-green-700', label: 'Approved',
  },
  application_rejected: {
    Icon: XCircle,
    bg: 'bg-red-50', text: 'text-red-600',
    badge: 'bg-red-100 text-red-700', label: 'Rejected',
  },
}

const DEFAULT_META = {
  Icon: Activity, bg: 'bg-gray-50', text: 'text-gray-400',
  badge: 'bg-gray-100 text-gray-500', label: 'Activity',
}

function formatTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdminLogs() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('/api/admin/activity-logs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setLogs((await res.json()) || [])
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  // Reset to page 1 when filter or search changes
  useEffect(() => { setPage(1) }, [activeFilter, search])

  const filtered = logs.filter(log => {
    const matchType = activeFilter === 'all' || log.action === activeFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (log.details || '').toLowerCase().includes(q) ||
      (log.performedBy || '').toLowerCase().includes(q)
    return matchType && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const counts = {
    all: logs.length,
    application_submitted: logs.filter(l => l.action === 'application_submitted').length,
    application_approved:  logs.filter(l => l.action === 'application_approved').length,
    application_rejected:  logs.filter(l => l.action === 'application_rejected').length,
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f0] pb-20 md:pb-0">

      {/* Page Header */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span
              className="cursor-pointer hover:text-gray-700 transition-colors"
              onClick={() => navigate('/admin/dashboard')}
            >Admin</span>
            <ChevronRight size={13} />
            <span className="text-gray-800 font-semibold">Activity Logs</span>
          </div>
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-6 py-5 max-w-5xl mx-auto w-full">

        {/* Title row */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">Activity Logs</h1>
            <p className="text-xs text-gray-400 mt-0.5">Application submissions &amp; admin decisions</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-2.5 py-1.5 shadow-sm shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a5c2a] animate-pulse" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {ACTION_FILTERS.map(f => {
            const isActive = activeFilter === f.key
            const meta = ACTION_META[f.key]
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#1a5c2a] text-white border-[#1a5c2a] shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {meta ? <meta.Icon size={11} /> : <Filter size={11} />}
                {f.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{counts[f.key]}</span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 mb-4 focus-within:border-[#1a5c2a] focus-within:ring-2 focus-within:ring-[#1a5c2a]/10 transition-all">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400 min-w-0"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500 text-xs font-bold shrink-0">✕</button>
          )}
        </div>

        {/* Logs container */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-[#1a5c2a] animate-spin" />
              <span className="text-xs text-gray-400">Loading logs…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                <Activity size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400">No activity logs found</p>
              <p className="text-xs text-gray-300">
                {search ? 'Try a different search term' : 'Actions will appear here once performed'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">

              {/* Desktop-only table header */}
              <div className="hidden md:grid md:grid-cols-[2.5rem_1fr_12rem_9rem] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div />
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Details</span>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Performed By</span>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider text-right">Date &amp; Time</span>
              </div>

              {paginated.map((log, i) => {
                const meta = ACTION_META[log.action] || DEFAULT_META
                const { Icon } = meta
                return (
                  <div key={log._id || i}>

                    {/* Mobile card */}
                    <div className="md:hidden flex items-start gap-3 p-4 hover:bg-gray-50/60 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.bg} ${meta.text}`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-snug break-words">{log.details}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${meta.badge}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold">{log.performedBy || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={10} className="text-gray-300 shrink-0" />
                          <span className="text-[10px] text-gray-400">{formatTime(log.createdAt)}</span>
                          <span className="text-[10px] text-gray-300 ml-0.5">· {timeAgo(log.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop row */}
                    <div className="hidden md:grid md:grid-cols-[2.5rem_1fr_12rem_9rem] gap-4 items-start px-5 py-4 hover:bg-gray-50/60 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.text}`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 break-words leading-snug">{log.details}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-700">{log.performedBy || '—'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-gray-700 block">{formatTime(log.createdAt)}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(log.createdAt)}</span>
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination + entry count */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <p className="text-xs text-gray-400 order-2 sm:order-1">
              Showing{' '}
              <span className="font-bold text-gray-600">
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>
              {' '}of{' '}
              <span className="font-bold text-gray-600">{filtered.length}</span>{' '}entries
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={12} /> Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs font-bold rounded-xl border transition-colors ${
                      p === safePage
                        ? 'bg-[#1a5c2a] text-white border-[#1a5c2a]'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
