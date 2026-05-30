import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Store } from "lucide-react";
import { useCurrentUser } from '../../utils/auth';
import AdminSidebar from '../../components/AdminSidebar';
import NotificationBell from '../../components/NotificationBell';

const NAV_ITEMS = [
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'nav-stalls',
    label: 'Stalls',
    path: '/admin/stalls',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
  },
  {
    id: 'nav-apps',
    label: 'Apps',
    path: '/admin/applications',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: 'nav-records',
    label: 'Records',
    path: '/admin/records',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </svg>
    ),
  },
  {
    id: 'nav-profile',
    label: 'Profile',
    path: '/admin/profile',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

const LogoutIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const STATUS_CONFIG = {
  active: { label: "ACTIVE", bg: "#16a34a", color: "#fff" },
  late_payment: { label: "LATE PAYMENT", bg: "#f97316", color: "#fff" },
  long_overdue: { label: "LONG OVERDUE", bg: "#dc2626", color: "#fff" },
  archived: { label: "ARCHIVED", bg: "#6b7280", color: "#fff" },
};

const SORT_OPTIONS = ["Recent", "Name A-Z", "Status", "Stall #"];

export default function AdminRecord() {
  const [activeNav, setActiveNav] = useState('nav-records');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { userName, loading: authLoading } = useCurrentUser();
  const navigate = useNavigate();

  // Fetch records from backend
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [archiveRequests, setArchiveRequests] = useState([]);
  const [isShowingArchives, setIsShowingArchives] = useState(false);
  const [archivedRecords, setArchivedRecords] = useState([]);

  useEffect(() => {
    if (isShowingArchives) return;
    setLoading(true);
    fetch('/api/admin/records')
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setRecords(data);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch records:', err);
        setError('Failed to load records. Please refresh.');
      })
      .finally(() => setLoading(false));
  }, [isShowingArchives]);

  useEffect(() => {
    fetch('/api/admin/admin/archive-requests')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch archive requests');
      })
      .then(data => setArchiveRequests(data))
      .catch(err => console.error('Archive requests fetch error:', err));
  }, []);

  useEffect(() => {
    if (!isShowingArchives) return;
    setLoading(true);
    fetch('/api/admin/admin/records/archived')
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setArchivedRecords(data);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch archived records:', err);
        setError('Failed to load archived records.');
      })
      .finally(() => setLoading(false));
  }, [isShowingArchives]);

  const handleArchiveRequest = async (userId, action) => {
    try {
      const res = await fetch(`/api/admin/admin/archive-requests/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error(`Failed to ${action} request`);
      
      setArchiveRequests(prev => prev.filter(req => req._id !== userId));
      alert(`Archive request successfully ${action}ed.`);
    } catch (err) {
      console.error(err);
      alert(`Error updating request: ${err.message}`);
    }
  };

  const RENTERS = isShowingArchives ? archivedRecords : records;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState("Recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const totalRenters = RENTERS.length;
  const activeCount = RENTERS.filter(r => r.status === "active").length;
  const activePct = totalRenters > 0 ? Math.round((activeCount / totalRenters) * 100) : 0;

  const filtered = useMemo(() => {
    let list = RENTERS.filter(r => {
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.stall.toLowerCase().includes(q) ||
        r.phone.includes(q)
      );
    });
    if (filterStatus !== "all") list = list.filter(r => r.status === filterStatus);
    if (sort === "Name A-Z") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "Status") list = [...list].sort((a, b) => {
      const order = { long_overdue: 0, late_payment: 1, active: 2 };
      return order[a.status] - order[b.status];
    });
    if (sort === "Stall #") list = [...list].sort((a, b) => a.stall.localeCompare(b.stall));
    return list;
  }, [search, sort, filterStatus, RENTERS]);

  const handleNav = (item) => {
    setActiveNav(item.id);
    navigate(item.path);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  // Loading and error states
  if (loading) {
    return (
      <div className="dashboard-root">
        <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text)' }}>Loading records...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="dashboard-root">
        <p style={{ color: 'red', padding: '24px', textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f5f5f0] font-sans overflow-hidden w-full">
      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-icon"><LogoutIcon /></div>
            <h3 className="logout-modal-title">Log Out?</h3>
            <p className="logout-modal-msg">You'll be signed out of your admin session.</p>
            <div className="logout-modal-actions">
              <button className="logout-cancel-btn" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="logout-confirm-btn" onClick={handleLogout}>Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <AdminSidebar active="nav-records" />

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
              <span className="text-gray-700 font-semibold">Records</span>
            </div>
          </div>
          <div className="header-right">
            <div className="header-welcome">
              <span className="welcome-name">{authLoading ? 'Loading…' : userName ? `${userName}` : 'Welcome, Guest'}</span>
              <span className="welcome-role">Market Supervisor</span>
            </div>

            <NotificationBell />
            <button
              className="header-logout-btn"
              aria-label="Log out"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogoutIcon />
            </button>
          </div>
        </header>

        <main className="dashboard-main rec-main">
          <div className="rec-title-block">
            <h1 className="rec-page-title">Renter Records</h1>
            <p className="rec-page-sub">Manage and monitor market vendor occupancy.</p>
          </div>

          {/* Search */}
          <div className="rec-search-wrap">
            <svg className="rec-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="rec-search-input"
              type="text"
              placeholder="Search by name or stall number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="rec-search-clear" onClick={() => setSearch("")} aria-label="Clear">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Archive Access Requests Panel */}
          {archiveRequests.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 mb-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-orange-500 text-lg">🔑</span>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  Archive Access Requests
                </h3>
                <span className="ml-2 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-full">
                  {archiveRequests.length} pending
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Contractors have requested access to view historical/archived renter records. Approving will allow them to toggle the archive view.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {archiveRequests.map((req) => (
                  <div key={req._id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <div className="font-semibold text-xs text-gray-800">{req.full_name}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{req.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleArchiveRequest(req._id, 'deny')}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg transition-all"
                      >
                        Deny
                      </button>
                      <button
                        onClick={() => handleArchiveRequest(req._id, 'approve')}
                        className="px-3 py-1.5 bg-[#1a5c2a] hover:bg-[#154d23] text-white text-[10px] font-bold rounded-lg transition-all"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="rec-stats-row">
            <div className="rec-stat-card rec-stat-green">
              <div className="rec-stat-top">
                <span className="rec-stat-label">TOTAL RENTERS</span>
                <span className="rec-stat-icon">👥</span>
              </div>
              <span className="rec-stat-value">{totalRenters}</span>
            </div>
            <div className="rec-stat-card rec-stat-orange">
              <div className="rec-stat-top">
                <span className="rec-stat-label">ACTIVE</span>
                <span className="rec-stat-icon">📈</span>
              </div>
              <span className="rec-stat-value">{activePct}%</span>
            </div>
          </div>

          {/* Archive Toggle Block */}
          <div className="flex justify-between items-center bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4 mb-2">
            <div className="text-left">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Renter Archives</h3>
              <p className="text-[10px] text-gray-400">View all moved out and archived renter records</p>
            </div>
            <button
              onClick={() => setIsShowingArchives(!isShowingArchives)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                isShowingArchives
                  ? 'bg-[#edf5ed] text-[#1a5c2a] border-[#1a5c2a]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#1a5c2a]'
              }`}
            >
              {isShowingArchives ? '← Show Active' : '📁 Show Archives'}
            </button>
          </div>

          {/* Status Filter Pills */}
          {!isShowingArchives && (
            <div className="rec-filter-pills">
              {["all", "active", "late_payment", "long_overdue"].map(s => (
                <button
                  key={s}
                  className={`rec-filter-pill${filterStatus === s ? " rec-pill-active" : ""}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === "all" ? "All" : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          )}

          {/* Activity Header */}
          <div className="rec-activity-header">
            <h2 className="rec-activity-title">Recent Activity</h2>
            <div className="rec-sort-wrap">
              <button className="rec-sort-btn" onClick={() => setSortOpen(o => !o)}>
                Sort
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {sortOpen && (
                <div className="rec-sort-dropdown">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`rec-sort-option${sort === opt ? " rec-sort-selected" : ""}`}
                      onClick={() => { setSort(opt); setSortOpen(false); }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Renters Grid */}
          <div className="rec-grid">
            {filtered.length === 0 ? (
              <div className="no-applications" style={{ gridColumn: "1 / -1" }}>
                <span style={{ fontSize: 32 }}>🔍</span>
                <span>No renters found</span>
              </div>
            ) : (
              filtered.map(renter => {
                const sc = STATUS_CONFIG[renter.status];
                return (
                  <div key={renter.id} className="rec-card">
                    <div className="rec-card-top">
                      <div className="rec-avatar">
                        <span className="rec-avatar-initials">{renter.initials}</span>
                      </div>
                      <div className="rec-card-info">
                        <div className="rec-card-name-row">
                          <span className="rec-card-name">{renter.name}</span>
                          <span className="rec-status-badge" style={{ background: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                        </div>
                        <span className="rec-card-phone">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: 3 }}>
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 5.82 5.82l.95-.96a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          {renter.phone}
                        </span>
                      </div>
                    </div>
                    <div className="rec-stall-row">
                      <span className="rec-stall-label">Stall Location</span>
                      <span className="rec-stall-value">{renter.stall}</span>
                    </div>
                    <button className="rec-history-btn" onClick={() => setSelectedRenter(renter)}>
                      View History
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav" aria-label="Main Navigation">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={item.id}
            className={`nav-item ${activeNav === item.id ? 'nav-active' : ''}`}
            onClick={() => handleNav(item)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Renter History Modal */}
      {selectedRenter && (
        <div className="logout-overlay" onClick={() => setSelectedRenter(null)}>
          <div className="rec-modal" onClick={e => e.stopPropagation()}>
            <div className="rec-modal-header">
              <div className="rec-avatar rec-modal-avatar">
                <span className="rec-avatar-initials">{selectedRenter.initials}</span>
              </div>
              <div>
                <h2 className="rec-modal-name">{selectedRenter.name}</h2>
                <span className="rec-modal-stall">{selectedRenter.stall}</span>
              </div>
              <span
                className="rec-status-badge"
                style={{
                  background: STATUS_CONFIG[selectedRenter.status].bg,
                  color: STATUS_CONFIG[selectedRenter.status].color,
                  marginLeft: "auto",
                  alignSelf: "flex-start",
                  flexShrink: 0,
                }}
              >
                {STATUS_CONFIG[selectedRenter.status].label}
              </span>
            </div>
            <div className="rec-modal-info">
              <div className="rec-modal-info-item">
                <span className="app-detail-label">Phone</span>
                <span className="app-detail-value">{selectedRenter.phone}</span>
              </div>
              <div className="rec-modal-info-item">
                <span className="app-detail-label">Renter Since</span>
                <span className="app-detail-value">{selectedRenter.since}</span>
              </div>
              <div className="rec-modal-info-item">
                <span className="app-detail-label">Last Payment</span>
                <span className="app-detail-value">{selectedRenter.lastPayment}</span>
              </div>
              <div className="rec-modal-info-item">
                <span className="app-detail-label">Amount Due</span>
                <span className="app-detail-value" style={{ color: selectedRenter.status !== "active" && selectedRenter.status !== "archived" ? "#dc2626" : "#15803d", fontWeight: 800 }}>
                  {selectedRenter.amountDue}
                </span>
              </div>
              {selectedRenter.status === 'archived' && (
                <div className="rec-modal-info-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="app-detail-label">Moved Out / Archived Date</span>
                  <span className="app-detail-value">{selectedRenter.archivedAt}</span>
                </div>
              )}
            </div>
            <div className="rec-modal-history">
              <h3 className="rec-modal-history-title">Payment History</h3>
              {selectedRenter.history && selectedRenter.history.length > 0 ? (
                selectedRenter.history.map((h, i) => (
                  <div key={i} className="rec-history-row">
                    <div>
                      <div className="rec-history-date">{h.date}</div>
                      <div className="rec-history-amount">{h.amount}</div>
                    </div>
                    <span className={`rec-history-status rec-history-${h.status}`}>
                      {h.status === "paid" ? "✓ Paid" : "✗ Unpaid"}
                    </span>
                  </div>
                ))
              ) : (
                <p>No payment history available.</p>
              )}
            </div>
            <button className="stall-modal-close" onClick={() => setSelectedRenter(null)}>Close</button>
          </div>
        </div>
      )}

      <style>{`
        .rec-main { padding-bottom: 80px; }
        .rec-title-block { margin-bottom: 2px; }
        .rec-page-title { font-size: 20px; font-weight: 800; color: var(--color-text); margin: 0 0 4px; letter-spacing: -0.3px; }
        .rec-page-sub { font-size: 12px; color: var(--color-text-muted); margin: 0; font-weight: 500; }
        .rec-search-wrap { position: relative; display: flex; align-items: center; }
        .rec-search-icon { position: absolute; left: 14px; color: var(--color-text-faint); pointer-events: none; flex-shrink: 0; }
        .rec-search-input { width: 100%; padding: 12px 40px 12px 40px; border: 1.5px solid var(--color-border); border-radius: var(--r-lg); background: var(--color-surface); font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; color: var(--color-text); box-shadow: var(--shadow-xs); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .rec-search-input:focus { border-color: var(--color-brand-green); box-shadow: 0 0 0 3px rgba(26, 92, 42, 0.1); }
        .rec-search-input::placeholder { color: var(--color-text-faint); }
        .rec-search-clear { position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: var(--color-text-faint); display: flex; align-items: center; padding: 4px; border-radius: 50%; transition: color 0.2s, background 0.2s; }
        .rec-search-clear:hover { color: var(--color-text); background: #f3f4f6; }
        .rec-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .rec-stat-card { border-radius: var(--r-lg); padding: 16px 14px; display: flex; flex-direction: column; gap: 8px; }
        .rec-stat-green { background: var(--color-brand-green); color: #fff; }
        .rec-stat-orange { background: var(--color-orange, #f97316); color: #fff; }
        .rec-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .rec-stat-label { font-size: 10px; font-weight: 800; letter-spacing: 0.5px; opacity: 0.9; }
        .rec-stat-icon { font-size: 16px; }
        .rec-stat-value { font-size: 32px; font-weight: 900; line-height: 1; letter-spacing: -0.5px; }
        .rec-filter-pills { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
        .rec-filter-pills::-webkit-scrollbar { display: none; }
        .rec-filter-pill { padding: 6px 14px; border-radius: var(--r-full); border: 1.5px solid var(--color-border); background: var(--color-surface); font-size: 11px; font-weight: 700; color: var(--color-text-muted); cursor: pointer; font-family: 'Inter', sans-serif; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
        .rec-filter-pill:hover { border-color: var(--color-brand-green); color: var(--color-brand-green); }
        .rec-pill-active { background: var(--color-brand-green) !important; color: #fff !important; border-color: var(--color-brand-green) !important; }
        .rec-activity-header { display: flex; align-items: center; justify-content: space-between; }
        .rec-activity-title { font-size: 15px; font-weight: 800; color: var(--color-text); margin: 0; }
        .rec-sort-wrap { position: relative; }
        .rec-sort-btn { display: flex; align-items: center; gap: 5px; background: none; border: 1.5px solid var(--color-border); border-radius: var(--r-sm); padding: 6px 12px; font-size: 12px; font-weight: 700; color: var(--color-text-mid); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; }
        .rec-sort-btn:hover { border-color: var(--color-brand-green); color: var(--color-brand-green); }
        .rec-sort-dropdown { position: absolute; right: 0; top: calc(100% + 6px); background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: var(--r-md); box-shadow: var(--shadow-md); z-index: 50; overflow: hidden; min-width: 140px; }
        .rec-sort-option { display: block; width: 100%; padding: 10px 14px; background: none; border: none; border-bottom: 1px solid var(--color-border-soft); font-size: 13px; font-weight: 600; color: var(--color-text-mid); text-align: left; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.15s; }
        .rec-sort-option:last-child { border-bottom: none; }
        .rec-sort-option:hover { background: #f9fafb; }
        .rec-sort-selected { color: var(--color-brand-green) !important; background: var(--color-brand-green-light) !important; }
        .rec-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .rec-card { background: var(--color-surface); border-radius: var(--r-lg); padding: 14px 14px 10px; box-shadow: var(--shadow-xs); border: 1px solid var(--color-border-soft); display: flex; flex-direction: column; gap: 10px; transition: box-shadow 0.2s, transform 0.2s; }
        .rec-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .rec-card-top { display: flex; align-items: flex-start; gap: 12px; }
        .rec-avatar { width: 46px; height: 46px; border-radius: 50%; background: #f3f4f6; border: 2px solid #e5e7eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rec-avatar-initials { font-size: 14px; font-weight: 800; color: #6b7280; }
        .rec-card-info { flex: 1; min-width: 0; }
        .rec-card-name-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 3px; }
        .rec-card-name { font-size: 14px; font-weight: 800; color: var(--color-text); line-height: 1.3; }
        .rec-status-badge { font-size: 9px; font-weight: 800; letter-spacing: 0.4px; padding: 3px 8px; border-radius: var(--r-full); flex-shrink: 0; text-transform: uppercase; white-space: nowrap; }
        .rec-card-phone { font-size: 12px; color: var(--color-text-muted); font-weight: 500; display: flex; align-items: center; }
        .rec-stall-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: #f9fafb; border-radius: var(--r-sm); border: 1px solid var(--color-border-soft); }
        .rec-stall-label { font-size: 11px; color: var(--color-text-muted); font-weight: 600; }
        .rec-stall-value { font-size: 12px; font-weight: 800; color: var(--color-text); }
        .rec-history-btn { width: 100%; padding: 10px; background: none; border: 1.5px solid var(--color-border); border-radius: var(--r-md); font-size: 13px; font-weight: 700; color: var(--color-text-mid); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; text-align: center; }
        .rec-history-btn:hover { border-color: var(--color-brand-green); color: var(--color-brand-green); background: var(--color-brand-green-light); }
        .rec-modal { background: var(--color-surface); border-radius: var(--r-xl); padding: 24px 20px 20px; max-width: 400px; width: 100%; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow-lg); animation: slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); max-height: 85dvh; overflow-y: auto; }
        .rec-modal-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .rec-modal-avatar { width: 52px !important; height: 52px !important; }
        .rec-modal-name { font-size: 17px; font-weight: 800; color: var(--color-text); margin: 0 0 2px; }
        .rec-modal-stall { font-size: 12px; color: var(--color-text-muted); font-weight: 500; }
        .rec-modal-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .rec-modal-info-item { background: #f9fafb; border-radius: var(--r-md); padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .rec-modal-history { display: flex; flex-direction: column; gap: 8px; }
        .rec-modal-history-title { font-size: 13px; font-weight: 800; color: var(--color-text); margin: 0; }
        .rec-history-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f9fafb; border-radius: var(--r-sm); border: 1px solid var(--color-border-soft); }
        .rec-history-date { font-size: 12px; color: var(--color-text-muted); font-weight: 500; margin-bottom: 2px; }
        .rec-history-amount { font-size: 14px; font-weight: 800; color: var(--color-text); }
        .rec-history-status { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: var(--r-full); }
        .rec-history-paid { background: #dcfce7; color: #15803d; }
        .rec-history-unpaid { background: #fee2e2; color: #dc2626; }
        .stall-modal-close { width: 100%; padding: 12px; background: var(--color-brand-green); color: #fff; border: none; border-radius: var(--r-md); font-size: 14px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; transition: background 0.2s; }
        .stall-modal-close:hover { background: var(--color-green-mid); }
        .app-detail-label { font-size: 10px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
        .app-detail-value { font-size: 13px; font-weight: 700; color: var(--color-text); }
        @media (min-width: 640px) {
          .rec-page-title { font-size: 24px; }
          .rec-main { padding-bottom: 90px; }
          .rec-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .rec-stat-value { font-size: 38px; }
          .rec-stats-row { gap: 14px; }
        }
        @media (min-width: 1024px) {
          .rec-main { padding-bottom: 32px; }
          .rec-page-title { font-size: 26px; }
          .rec-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
          .rec-activity-title { font-size: 17px; }
          .rec-card { padding: 16px 16px 12px; }
        }
        @media (min-width: 1280px) {
          .rec-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .rec-stat-value { font-size: 44px; }
        }
      `}</style>
    </div>
  );
}