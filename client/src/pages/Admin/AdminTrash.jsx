import { useState, useEffect, useCallback } from 'react'
import { Trash2, RotateCcw, RefreshCw, Archive, Users, Store, FileMinus } from 'lucide-react'

// Friendly labels for the soft-deleted model groups returned by /api/admin/trash
const MODEL_LABELS = {
  User: 'Accounts',
  Stall: 'Stalls',
  Application: 'Rental Applications',
  Announcement: 'Announcements',
  Payment: 'Payments',
  StallRequest: 'Stall Requests',
  StallRemovalRequest: 'Removal Requests',
  ContractorApplication: 'Contractor Applications',
  Notification: 'Notifications',
  AdminContactMessage: 'Contact Messages',
  OccupancyRecord: 'Occupancy Records',
}

// The app's PRE-EXISTING archive feature ("Move Out / Archive" for renters,
// and archive for stall-addition / removal requests) uses a separate `archived`
// flag with its own list + unarchive endpoints — distinct from the soft-delete
// (isDeleted) Trash. We surface those here as clearly-labelled groups so this
// page is the single place to review and restore everything recoverable.
const ARCHIVE_GROUPS = [
  {
    key: '__archivedRenters',
    label: 'Archived Renters (Move-Outs)',
    kind: 'Archived',
    listUrl: '/api/admin/records/archived',
    map: (r) => ({
      id: r.id,
      primary: r.name || r.email || 'Renter',
      secondary: [r.stall, r.email].filter(Boolean).join(' · '),
      deletedAt: r.archivedAt || null,
    }),
    restore: (id) => ({ url: `/api/admin/records/${id}/unarchive`, method: 'POST' }),
  },
  {
    key: '__archivedStallRequests',
    label: 'Archived Stall Requests',
    kind: 'Archived',
    listUrl: '/api/admin/stall-requests/archived',
    map: (r) => ({
      id: r._id,
      primary: r.stallId?.stallNumber ? `Stall #${r.stallId.stallNumber}` : 'Stall Request',
      secondary: [r.contractorEmail, r.status].filter(Boolean).join(' · '),
      deletedAt: r.updatedAt || r.createdAt || null,
    }),
    restore: (id) => ({ url: `/api/admin/stall-requests/${id}/unarchive`, method: 'PUT' }),
  },
  {
    key: '__archivedRemovalRequests',
    label: 'Archived Removal Requests',
    kind: 'Archived',
    listUrl: '/api/stall-removal-requests/admin/requests/archived',
    map: (r) => ({
      id: r._id,
      primary: r.location ? `Removal · ${r.location}` : 'Removal Request',
      secondary: r.status || '',
      deletedAt: r.updatedAt || r.requestedAt || null,
    }),
    restore: (id) => ({ url: `/api/stall-removal-requests/admin/requests/${id}/unarchive`, method: 'PUT' }),
  },
]
const ARCHIVE_GROUP_BY_KEY = Object.fromEntries(ARCHIVE_GROUPS.map(g => [g.key, g]))
const GROUP_ICON = {
  __archivedRenters: Users,
  __archivedStallRequests: Store,
  __archivedRemovalRequests: FileMinus,
}

export default function AdminTrash() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [restoring, setRestoring] = useState(null) // `${model}:${id}` currently restoring

  const fetchTrash = useCallback(() => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('authToken')
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

    // 1) Soft-deleted (isDeleted) records across all models.
    const trashReq = fetch('/api/admin/trash')
      .then(res => (res.ok ? res.json() : []))
      .catch(() => [])

    // 2) Pre-existing "archived" groups (renters, stall requests, removals),
    //    each via its own list endpoint.
    const archiveReqs = ARCHIVE_GROUPS.map(g =>
      fetch(g.listUrl, { headers: authHeaders })
        .then(res => (res.ok ? res.json() : []))
        .catch(() => [])
    )

    Promise.all([trashReq, ...archiveReqs])
      .then(([trash, ...archiveResults]) => {
        const merged = []
        // Archived (recoverable) groups first, clearly distinguished.
        ARCHIVE_GROUPS.forEach((g, i) => {
          const rows = archiveResults[i]
          if (Array.isArray(rows) && rows.length) {
            merged.push({ model: g.key, kind: g.kind, count: rows.length, items: rows.map(g.map) })
          }
        })
        // Then soft-deleted (trash) groups.
        if (Array.isArray(trash)) {
          trash.forEach(t => merged.push({ ...t, kind: 'Deleted' }))
        }
        setGroups(merged)
      })
      .catch(err => {
        console.error('Failed to load archived records:', err)
        setError('Failed to load archived records. Please refresh.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTrash() }, [fetchTrash])

  const handleRestore = async (model, id) => {
    const key = `${model}:${id}`
    setRestoring(key)
    try {
      // Pre-existing archived groups restore through their own unarchive
      // endpoints (which re-apply side-effects like re-occupying a stall);
      // everything else uses the generic soft-delete restore.
      const special = ARCHIVE_GROUP_BY_KEY[model]
      const { url, method } = special
        ? special.restore(id)
        : { url: `/api/admin/trash/${model}/${id}/restore`, method: 'POST' }
      const token = localStorage.getItem('authToken')
      const res = await fetch(url, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server error: ${res.status}`)
      }
      // Optimistically drop the restored item from the list.
      setGroups(prev =>
        prev
          .map(g => g.model === model
            ? { ...g, count: g.count - 1, items: g.items.filter(it => it.id !== id) }
            : g)
          .filter(g => g.items.length > 0)
      )
    } catch (err) {
      console.error('Restore failed:', err)
      alert(err.message || 'Failed to restore record. Please try again.')
    } finally {
      setRestoring(null)
    }
  }

  const totalCount = groups.reduce((sum, g) => sum + g.count, 0)

  return (
    <div className="min-h-screen bg-[#f5f5f0] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a5c2a] flex items-center justify-center">
              <Archive size={20} color="white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Archived &amp; Deleted</h1>
              <p className="text-xs text-gray-400 font-medium">
                Everything recoverable in one place — <span className="font-bold text-amber-600">Archived</span> items (move-outs, requests) and <span className="font-bold text-red-500">Deleted</span> records. Restore anything removed by mistake.
              </p>
            </div>
          </div>
          <button
            onClick={fetchTrash}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm font-medium">Loading archived records…</div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 text-sm font-semibold">{error}</div>
        ) : totalCount === 0 ? (
          <div className="text-center py-20">
            <Trash2 size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-500">Nothing archived</p>
            <p className="text-xs text-gray-400 mt-1">Deleted records will appear here and can be restored.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => {
              const isArchived = group.kind === 'Archived'
              const GroupIcon = GROUP_ICON[group.model] || (isArchived ? Archive : Trash2)
              const label = ARCHIVE_GROUP_BY_KEY[group.model]?.label || MODEL_LABELS[group.model] || group.model
              return (
              <div key={group.model} className={`bg-white rounded-2xl border overflow-hidden ${isArchived ? 'border-amber-200' : 'border-gray-100'}`}>
                <div className={`flex items-center justify-between px-5 py-3 border-b ${isArchived ? 'border-amber-100 bg-amber-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-center gap-2">
                    <GroupIcon size={15} className={isArchived ? 'text-amber-600' : 'text-gray-400'} />
                    <h2 className="text-sm font-extrabold text-gray-800">{label}</h2>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${isArchived ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                      {group.kind}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-gray-200 text-[10px] font-black text-gray-600">
                    {group.count}
                  </span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {group.items.map(item => {
                    const key = `${group.model}:${item.id}`
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{item.primary}</p>
                          {item.secondary && (
                            <p className="text-xs text-gray-400 truncate">{item.secondary}</p>
                          )}
                          {item.deletedAt && (
                            <p className="text-[10px] text-gray-300 mt-0.5">
                              {isArchived ? 'Archived' : 'Deleted'} {new Date(item.deletedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRestore(group.model, item.id)}
                          disabled={restoring === key}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#edf5ed] text-[#1a5c2a] text-xs font-bold hover:bg-[#dcecdc] transition-colors disabled:opacity-50 shrink-0"
                        >
                          <RotateCcw size={13} />
                          {restoring === key ? 'Restoring…' : 'Restore'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
