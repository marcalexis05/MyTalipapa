import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Store } from "lucide-react";
import { useCurrentUser, getUser } from '../../utils/auth';
import ContractorSidebar from '../../components/ContractorSidebar';
import ContractorLockScreen from './ContractorLockScreen';
import NotificationBell from '../../components/NotificationBell';

const NAV_ITEMS = [
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    path: '/contractor/dashboard',
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
    path: '/contractor/stalls',
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
    path: '/contractor/applications',
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
    path: '/contractor/records',
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
    path: '/contractor/profile',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const LogoutIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const STATUS_CONFIG = {
  active: { label: "ACTIVE", bg: "#16a34a", color: "#fff" },
  late_payment: { label: "LATE PAYMENT", bg: "#f97316", color: "#fff" },
  long_overdue: { label: "LONG OVERDUE", bg: "#dc2626", color: "#fff" },
  archived: { label: "ARCHIVED", bg: "#6b7280", color: "#fff" },
};

const SORT_OPTIONS = ["Recent", "Name A-Z", "Status", "Stall #"];
const SEEN_KEY = 'seenMoveOuts_v1';

// Helper function to parse move out request message and extract details
const parseMoveOutDetails = (message) => {
  const details = {
    stallNumber: '',
    stallType: '',
    contactNumber: '',
    reason: '',
    rawMessage: message
  };

  if (!message) return details;

  // Extract stall number and type: "Tenant at Stall #51 (Meat)"
  const stallMatch = message.match(/Stall #(\d+)\s*\(([^)]+)\)/);
  if (stallMatch) {
    details.stallNumber = stallMatch[1];
    details.stallType = stallMatch[2];
  }

  // Extract contact number: "Renter Contact: 09763198643"
  const contactMatch = message.match(/Renter Contact:\s*([\d\s\-]+)/);
  if (contactMatch) {
    details.contactNumber = contactMatch[1].trim();
  }

  // Extract reason: "Reason: ayaw ko na" or "Reason I saw your..."
  const reasonMatch = message.match(/Reason[:\s]+([^.]+)/);
  if (reasonMatch) {
    details.reason = reasonMatch[1].trim();
  }

  return details;
};

export default function ContractorRecords() {
  const [activeNav, setActiveNav] = useState('nav-records');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { userName, loading: authLoading } = useCurrentUser();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [contractorProfile, setContractorProfile] = useState(null);
  const [isShowingArchives, setIsShowingArchives] = useState(false);
  const [archivedRecords, setArchivedRecords] = useState([]);

  // Move Out Requests state
  const [moveOutRequests, setMoveOutRequests] = useState([]);
  const [loadingMoves, setLoadingMoves] = useState(false);
  const [showMoveOut, setShowMoveOut] = useState(false);
  const [newMoveOutCount, setNewMoveOutCount] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [selectedMoveOut, setSelectedMoveOut] = useState(null);
  const [renterEmail, setRenterEmail] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const prevMoveOutIds = useRef([]);

  const user = getUser();
  const userEmail = user?.email || '';

  // ── Helpers for "seen" tracking ──────────────────────────────
  const getSeenIds = () => {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); }
    catch { return []; }
  };
const markAllSeen = async () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    await fetch('/api/contractor/notifications/read-all', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
  setMoveOutRequests(prev => prev.map(r => ({ ...r, read: true })));
  setNewMoveOutCount(prev => Math.max(0, prev - 1));
  setBannerDismissed(true);
};

  // Mark single move out as read
  const markMoveOutAsRead = async (id) => {
    if (!id) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const res = await fetch(`/api/contractor/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMoveOutRequests(prev => prev.map(r => r._id === id ? { ...r, read: true } : r));
        const seenIds = getSeenIds();
        if (!seenIds.includes(id)) {
          localStorage.setItem(SEEN_KEY, JSON.stringify([...seenIds, id]));
        }
      }
    } catch (err) {
      console.error('Failed to mark move out as read:', err);
    }
  };

  // Mark as read from inside the modal
  const handleMarkAsRead = async () => {
    if (!selectedMoveOut?._id) return;
    setMarkingRead(true);
    await markMoveOutAsRead(selectedMoveOut._id);
    setSelectedMoveOut(prev => ({ ...prev, read: true }));
    setMarkingRead(false);
  };

  // ── Fetch contractor profile ─────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => { if (res.ok) return res.json(); throw new Error('Failed'); })
      .then(data => setContractorProfile(data))
      .catch(err => console.error('Profile fetch error:', err));
  }, []);

  // ── Fetch active records ─────────────────────────────────────
  useEffect(() => {
    if (!userEmail || isShowingArchives) return;
    setLoading(true);
    fetch(`/api/contractor/records?email=${userEmail}`)
      .then(res => { if (!res.ok) throw new Error(`Server error: ${res.status}`); return res.json(); })
      .then(data => { setRecords(data); setError(null); })
      .catch(err => { console.error('Failed to fetch records:', err); setError('Failed to load records. Please refresh.'); })
      .finally(() => setLoading(false));
  }, [userEmail, isShowingArchives]);

  // ── Fetch archived records ───────────────────────────────────
  useEffect(() => {
    if (!userEmail || !isShowingArchives) return;
    const token = localStorage.getItem('authToken');
    setLoading(true);
    fetch('/api/contractor/records/archived', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error(`Server error: ${res.status}`); return res.json(); })
      .then(data => { if (data.error) throw new Error(data.error); setArchivedRecords(data); setError(null); })
      .catch(err => { console.error('Failed to fetch archived records:', err); setError('Failed to load archived records: ' + err.message); })
      .finally(() => setLoading(false));
  }, [userEmail, isShowingArchives]);

  // ── Fetch move-out notifications (poll every 15s) ────────────
  const fetchMoveOuts = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    fetch('/api/contractor/notifications', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error(`Server error: ${res.status}`); return res.json(); })
      .then(data => {
        const moves = data.filter(n => n.title && n.title.toLowerCase().includes('move out'));
        setMoveOutRequests(moves);

        const unread = moves.filter(r => !r.read);
        setNewMoveOutCount(unread.length);

        const currentIds = moves.map(r => r._id || r.message);
        const hasNew = currentIds.some(id => !prevMoveOutIds.current.includes(id));
        if (hasNew && unseen.length > 0) setBannerDismissed(false);
        prevMoveOutIds.current = currentIds;

        setError(null);
      })
      .catch(err => console.error('Failed to fetch move-out requests:', err));
  };

  useEffect(() => {
    setLoadingMoves(true);
    fetchMoveOuts();
    setLoadingMoves(false);
    const interval = setInterval(fetchMoveOuts, 15000);
    return () => clearInterval(interval);
  }, [userEmail]);

  // ── Derived data ─────────────────────────────────────────────
  const RENTERS = isShowingArchives ? archivedRecords : records;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState("Recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recordingPayment, setRecordingPayment] = useState(false);

  const handleNav = (item) => { setActiveNav(item.id); navigate(item.path); };
  const handleLogout = () => navigate('/login');
  const closeRenterModal = () => { setSelectedRenter(null); setShowPaymentForm(false); };
  const closeMoveOutModal = () => {
    setSelectedMoveOut(null);
    setRenterEmail('');
  };

  const handleRequestArchiveAccess = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const res = await fetch('/api/contractor/archive-request', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to request access');
      setContractorProfile(prev => ({ ...prev, archiveAccessStatus: 'pending' }));
      alert('Archive access request submitted to the administrator.');
    } catch (err) { console.error(err); alert('Error requesting access: ' + err.message); }
  };

  const handleMoveOut = async () => {
    if (!selectedRenter) return;
    if (!window.confirm(`Are you sure you want to move out ${selectedRenter.name} from ${selectedRenter.stall}? This will archive their tenancy record and free up the stall.`)) return;
    try {
      const res = await fetch(`/api/contractor/records/${selectedRenter.id}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to archive renter');
      const recordsRes = await fetch(`/api/contractor/records?email=${userEmail}`);
      if (recordsRes.ok) setRecords(await recordsRes.json());
      closeRenterModal();
    } catch (err) { console.error(err); alert('Error moving out renter: ' + err.message); }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount) return;
    setRecordingPayment(true);
    try {
      const res = await fetch(`/api/contractor/records/${selectedRenter.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(payAmount), date: payDate })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
      const recordsRes = await fetch(`/api/contractor/records?email=${userEmail}`);
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data);
        const updated = data.find(r => r.id === selectedRenter.id);
        if (updated) setSelectedRenter(updated);
      }
      setShowPaymentForm(false);
    } catch (err) { console.error(err); alert('Error recording payment: ' + err.message); }
    finally { setRecordingPayment(false); }
  };

  const handleMoveOutClick = async (req) => {
    setSelectedMoveOut(req);
    setRenterEmail('');

    if (!req.read) {
      await markMoveOutAsRead(req._id);
    }

    // Fetch renter email by stall number
    const details = parseMoveOutDetails(req.message);
    if (details.stallNumber) {
      setLoadingEmail(true);
      const token = localStorage.getItem('authToken');
      try {
        const res = await fetch(`/api/contractor/records/by-stall/${details.stallNumber}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRenterEmail(data.email || '');
        }
      } catch (err) {
        console.error('Failed to fetch renter email:', err);
      } finally {
        setLoadingEmail(false);
      }
    }
  };

  const totalRenters = RENTERS.length;
  const activeCount = RENTERS.filter(r => r.status === "active").length;
  const activePct = totalRenters > 0 ? Math.round((activeCount / totalRenters) * 100) : 0;

  const filtered = useMemo(() => {
    let list = RENTERS.filter(r => {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.stall.toLowerCase().includes(q) || r.phone.includes(q);
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

  if (loading) {
    return (
      <ContractorLockScreen>
        <div className="dashboard-root">
          <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text)' }}>Loading records...</p>
        </div>
      </ContractorLockScreen>
    );
  }
  if (error) {
    return (
      <ContractorLockScreen>
        <div className="dashboard-root">
          <p style={{ color: 'red', padding: '24px', textAlign: 'center' }}>{error}</p>
        </div>
      </ContractorLockScreen>
    );
  }

  return (
    <ContractorLockScreen>
      <div className="flex h-screen bg-[#f5f5f0] font-sans overflow-hidden w-full">

        {/* Logout Modal */}
        {showLogoutModal && (
          <div className="logout-overlay" onClick={() => setShowLogoutModal(false)}>
            <div className="logout-modal" onClick={e => e.stopPropagation()}>
              <div className="logout-modal-icon"><LogoutIcon /></div>
              <h3 className="logout-modal-title">Log Out?</h3>
              <p className="logout-modal-msg">You'll be signed out of your contractor session.</p>
              <div className="logout-modal-actions">
                <button className="logout-cancel-btn" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                <button className="logout-confirm-btn" onClick={handleLogout}>Yes, Log Out</button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <ContractorSidebar active="nav-records" />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header */}
          <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="md:hidden flex items-center gap-2">
                <div className="w-7 h-7 bg-[#1a5c2a] rounded-lg flex items-center justify-center shrink-0">
                  <Store size={13} color="white" />
                </div>
                <span className="font-extrabold text-gray-900 text-sm">MyTalipapa</span>
              </div>
              <div className="hidden md:flex items-center gap-1 text-sm text-gray-400">
                <span>Contractor</span>
                <ChevronRight size={14} />
                <span className="text-gray-700 font-semibold">Records</span>
              </div>
            </div>
            <div className="header-right">
              <div className="header-welcome">
                <span className="welcome-name">{authLoading ? 'Loading…' : userName ? `${userName}` : 'Welcome, Guest'}</span>
                <span className="welcome-role">Contractor</span>
              </div>
              <NotificationBell />
              <button className="header-logout-btn" aria-label="Log out" onClick={() => setShowLogoutModal(true)}>
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

            {/* ── Renter Archives Toggle ──────────────────────────────── */}
            <div className="flex justify-between items-center bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4 mb-2">
              <div className="text-left">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Renter Archives</h3>
                <p className="text-[10px] text-gray-400">View moved out and archived renter records</p>
              </div>
              {contractorProfile?.archiveAccessStatus === 'approved' ? (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 font-medium">
                    {(() => {
                      if (!contractorProfile.archiveAccessApprovedAt) return '';
                      const approvedTime = new Date(contractorProfile.archiveAccessApprovedAt);
                      const expiryTime = new Date(approvedTime.getTime() + 24 * 60 * 60 * 1000);
                      const now = new Date();
                      const diffMs = expiryTime - now;
                      if (diffMs <= 0) return 'Access expired';
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      return `🕒 Access expires in: ${diffHours}h ${diffMins}m`;
                    })()}
                  </span>
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
              ) : contractorProfile?.archiveAccessStatus === 'pending' ? (
                <span className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
                  ⏳ Request Pending Review
                </span>
              ) : (
                <button
                  onClick={handleRequestArchiveAccess}
                  className="px-4 py-2 bg-[#1a5c2a] hover:bg-[#154d23] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  🔑 Request Archive Access
                </button>
              )}
            </div>

            {/* ── Move Out Requests Section ───────────────────────────── */}
            <div className="mt-3 mb-2">

              {/* New-request banner */}
              {newMoveOutCount > 0 && !bannerDismissed && (
                <div className="moveout-banner">
                  <div className="moveout-banner-left">
                    <span className="moveout-banner-pulse" />
                    <span className="text-sm">🔔</span>
                    <span className="moveout-banner-text">
                      {newMoveOutCount} new move-out request{newMoveOutCount > 1 ? 's' : ''} received
                    </span>
                  </div>
                  <div className="moveout-banner-actions">
                    <button
                      onClick={() => { markAllSeen(); setShowMoveOut(true); }}
                      className="moveout-banner-view"
                    >
                      View now
                    </button>
                    <button
                      onClick={() => setBannerDismissed(true)}
                      className="moveout-banner-dismiss"
                      aria-label="Dismiss"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Toggle card */}
              <div className="flex justify-between items-center bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Move Out Requests</h3>
                    {moveOutRequests.length > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold">
                        {moveOutRequests.length}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">Tenants requesting to vacate their stall</p>
                </div>
                <button
                  onClick={() => {
                    const next = !showMoveOut;
                    setShowMoveOut(next);
                    if (next) markAllSeen();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    showMoveOut
                      ? 'bg-[#edf5ed] text-[#1a5c2a] border-[#1a5c2a]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#1a5c2a]'
                  }`}
                >
                  {showMoveOut ? '← Hide' : '🚪 Show Requests'}
                </button>
              </div>

              {/* Requests list */}
              {showMoveOut && (
                <div className="mt-2 flex flex-col gap-2">
                  {loadingMoves ? (
                    <p className="text-xs text-gray-400 px-1 py-2">Loading move-out requests…</p>
                  ) : moveOutRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                      <span className="text-2xl block mb-1">🏪</span>
                      <p className="text-xs text-gray-400 font-medium">No move-out requests at this time.</p>
                    </div>
                  ) : (
                    moveOutRequests.map((req, idx) => {
                      const isNew = !req.read;
                      return (
                        <div
                          key={req._id || idx}
                          onClick={() => handleMoveOutClick(req)}
                          className={`moveout-request-card ${isNew ? 'moveout-request-card--new' : ''} cursor-pointer`}
                        >
                          <div className="moveout-request-icon-wrap">
                            <span className="text-base">🚪</span>
                          </div>
                          <div className="moveout-request-body">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="moveout-request-title">{req.title || 'Move Out Request'}</p>
                              {isNew && <span className="moveout-new-badge">NEW</span>}
                            </div>
                            <p className="moveout-request-msg">{req.message}</p>
                            {req.createdAt && (
                              <span className="moveout-request-time">
                                {new Date(req.createdAt).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
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

        {/* ── Move Out Detail Modal ───────────────────────────────── */}
        {selectedMoveOut && (
          <div className="logout-overlay" onClick={closeMoveOutModal}>
            <div className="rec-modal" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="moveout-modal-header">
                <div className="moveout-modal-icon-wrap">
                  <span className="text-2xl">🚪</span>
                </div>
                <div>
                  <h2 className="moveout-modal-title">{selectedMoveOut.title || 'Move Out Request'}</h2>
                  <p className="moveout-modal-time">
                    {new Date(selectedMoveOut.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                {/* Read badge */}
                {selectedMoveOut.read && (
                  <span className="moveout-read-badge">✓ Read</span>
                )}
              </div>

              {/* Details grid */}
              <div className="moveout-modal-content">
                {(() => {
                  const details = parseMoveOutDetails(selectedMoveOut.message);
                  return (
                    <div className="moveout-details-grid">
                      <div className="moveout-detail-item">
                        <span className="moveout-detail-label">STALL NUMBER</span>
                        <span className="moveout-detail-value">#{details.stallNumber}</span>
                      </div>
                      <div className="moveout-detail-item">
                        <span className="moveout-detail-label">STALL TYPE</span>
                        <span className="moveout-detail-value">{details.stallType || 'N/A'}</span>
                      </div>
                      <div className="moveout-detail-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="moveout-detail-label">RENTER CONTACT</span>
                        <span className="moveout-detail-value moveout-contact-value">{details.contactNumber}</span>
                      </div>

                      {/* Email box */}
                      <div className="moveout-detail-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="moveout-detail-label">RENTER EMAIL</span>
                        {loadingEmail ? (
                          <span className="moveout-email-loading">Fetching email…</span>
                        ) : renterEmail ? (
                          <a
                            href={`mailto:${renterEmail}`}
                            className="moveout-detail-value moveout-email-value"
                          >
                            ✉️ {renterEmail}
                          </a>
                        ) : (
                          <span className="moveout-email-empty">No email on file</span>
                        )}
                      </div>

                      <div className="moveout-detail-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="moveout-detail-label">REASON FOR MOVE OUT</span>
                        <p className="moveout-reason-text">{details.reason}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="moveout-modal-actions">
                {/* Info message */}
                <div className="moveout-contact-info-msg">
                  <span className="moveout-contact-info-icon">ℹ️</span>
                  <span>Contact the renter for more info about the request.</span>
                </div>

                  {/* Mark as Read button */}
                  {!selectedMoveOut.read && (
                    <button
                      type="button"
                      className="moveout-markread-btn"
                      onClick={handleMarkAsRead}
                      disabled={markingRead}
                    >
                      {markingRead ? 'Marking…' : '✔ Mark as Read'}
                    </button>
                  )}
                  {selectedMoveOut.read && (
                    <div className="moveout-markread-btn moveout-markread-btn--done">
                      ✓ Marked as Read
                    </div>
                  )}
                {/* Close button */}
                <button
                  type="button"
                  className="moveout-modal-close-btn"
                  onClick={closeMoveOutModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Renter History Modal ────────────────────────────────── */}
        {selectedRenter && (
          <div className="logout-overlay" onClick={closeRenterModal}>
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
                  <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>No payment history available.</p>
                )}
              </div>

              {selectedRenter.status !== 'archived' && (
                <div className="rec-payment-record-section" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px', marginTop: '4px' }}>
                  {!showPaymentForm ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        className="pay-form-btn"
                        onClick={() => {
                          const cleanAmount = selectedRenter.amountDue ? selectedRenter.amountDue.replace(/[^\d]/g, '') : '';
                          setPayAmount(cleanAmount);
                          setPayDate(new Date().toISOString().split('T')[0]);
                          setShowPaymentForm(true);
                        }}
                      >
                        💵 Record Cash Payment
                      </button>
                      <button type="button" className="moveout-btn" onClick={handleMoveOut}>
                        🚪 Move Out (Archive Renter)
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRecordPayment} className="pay-form">
                      <h4 className="pay-form-title">Record Cash Payment</h4>
                      <div className="pay-input-group">
                        <label className="pay-label">Cash Amount (₱)</label>
                        <input
                          type="number"
                          required
                          value={payAmount}
                          onChange={e => setPayAmount(e.target.value)}
                          placeholder="e.g. 4000"
                          className="pay-input"
                        />
                      </div>
                      <div className="pay-input-group">
                        <label className="pay-label">Payment Date</label>
                        <input
                          type="date"
                          required
                          value={payDate}
                          onChange={e => setPayDate(e.target.value)}
                          className="pay-input"
                        />
                      </div>
                      <div className="pay-form-actions">
                        <button type="button" className="pay-cancel-btn" onClick={() => setShowPaymentForm(false)} disabled={recordingPayment}>Cancel</button>
                        <button type="submit" className="pay-submit-btn" disabled={recordingPayment}>
                          {recordingPayment ? 'Saving…' : 'Submit'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              <button className="stall-modal-close" onClick={closeRenterModal}>Close</button>
            </div>
          </div>
        )}

        <style>{`
          /* ── Base ──────────────────────────────────────────── */
          .rec-main { padding-bottom: 80px; }
          .rec-title-block { margin-bottom: 2px; }
          .rec-page-title { font-size: 20px; font-weight: 800; color: var(--color-text); margin: 0 0 4px; letter-spacing: -0.3px; }
          .rec-page-sub { font-size: 12px; color: var(--color-text-muted); margin: 0; font-weight: 500; }

          /* ── Search ────────────────────────────────────────── */
          .rec-search-wrap { position: relative; display: flex; align-items: center; }
          .rec-search-icon { position: absolute; left: 14px; color: var(--color-text-faint); pointer-events: none; flex-shrink: 0; }
          .rec-search-input { width: 100%; padding: 12px 40px 12px 40px; border: 1.5px solid var(--color-border); border-radius: var(--r-lg); background: var(--color-surface); font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; color: var(--color-text); box-shadow: var(--shadow-xs); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
          .rec-search-input:focus { border-color: var(--color-brand-green); box-shadow: 0 0 0 3px rgba(26, 92, 42, 0.1); }
          .rec-search-input::placeholder { color: var(--color-text-faint); }
          .rec-search-clear { position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: var(--color-text-faint); display: flex; align-items: center; padding: 4px; border-radius: 50%; transition: color 0.2s, background 0.2s; }
          .rec-search-clear:hover { color: var(--color-text); background: #f3f4f6; }

          /* ── Stats ─────────────────────────────────────────── */
          .rec-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .rec-stat-card { border-radius: var(--r-lg); padding: 16px 14px; display: flex; flex-direction: column; gap: 8px; }
          .rec-stat-green { background: var(--color-brand-green); color: #fff; }
          .rec-stat-orange { background: var(--color-orange, #f97316); color: #fff; }
          .rec-stat-top { display: flex; align-items: center; justify-content: space-between; }
          .rec-stat-label { font-size: 10px; font-weight: 800; letter-spacing: 0.5px; opacity: 0.9; }
          .rec-stat-icon { font-size: 16px; }
          .rec-stat-value { font-size: 32px; font-weight: 900; line-height: 1; letter-spacing: -0.5px; }

          /* ── Move-out banner ───────────────────────────────── */
          .moveout-banner {
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
            padding: 10px 14px; margin-bottom: 10px; border-radius: 14px;
            border: 1.5px solid #fed7aa;
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
            animation: banner-slide-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          @keyframes banner-slide-in {
            from { opacity: 0; transform: translateY(-8px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          .moveout-banner-left { display: flex; align-items: center; gap: 8px; }
          .moveout-banner-pulse {
            position: relative; display: inline-block;
            width: 8px; height: 8px; border-radius: 50%; background: #f97316; flex-shrink: 0;
          }
          .moveout-banner-pulse::after {
            content: ''; position: absolute; inset: -3px; border-radius: 50%;
            background: #f97316; opacity: 0.3;
            animation: pulse-ring 1.4s ease-out infinite;
          }
          @keyframes pulse-ring {
            0%   { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(2);   opacity: 0; }
          }
          .moveout-banner-text { font-size: 11px; font-weight: 700; color: #c2410c; }
          .moveout-banner-actions { display: flex; align-items: center; gap: 6px; }
          .moveout-banner-view { font-size: 10px; font-weight: 800; color: #ea580c; text-decoration: underline; text-underline-offset: 2px; background: none; border: none; cursor: pointer; padding: 0; font-family: 'Inter', sans-serif; white-space: nowrap; }
          .moveout-banner-view:hover { color: #9a3412; }
          .moveout-banner-dismiss { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: rgba(249,115,22,0.12); border: none; cursor: pointer; color: #ea580c; padding: 0; transition: background 0.15s; }
          .moveout-banner-dismiss:hover { background: rgba(249,115,22,0.22); }

          /* ── Move-out request cards ────────────────────────── */
          .moveout-request-card {
            display: flex; align-items: flex-start; gap: 12px;
            background: #fff; border-radius: 16px; padding: 14px;
            border: 1px solid #f3f4f6; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
            transition: box-shadow 0.2s, transform 0.2s;
          }
          .moveout-request-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
          .moveout-request-card--new { border-color: #fed7aa; background: linear-gradient(135deg, #fff7ed 0%, #fff 60%); }
          .moveout-request-icon-wrap {
            width: 36px; height: 36px; border-radius: 10px;
            background: #fff7ed; border: 1px solid #fed7aa;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .moveout-request-body { flex: 1; min-width: 0; }
          .moveout-request-title { font-size: 12px; font-weight: 800; color: #1f2937; margin: 0; }
          .moveout-request-msg { font-size: 11px; color: #6b7280; line-height: 1.5; margin: 2px 0 4px; }
          .moveout-request-time { font-size: 9px; color: #9ca3af; font-weight: 600; }
          .moveout-new-badge {
            font-size: 8px; font-weight: 900; letter-spacing: 0.5px;
            padding: 2px 6px; border-radius: 999px;
            background: #f97316; color: #fff; flex-shrink: 0;
          }

          /* ── Move out detail modal ─────────────────────────── */
          .moveout-modal-header {
            display: flex; align-items: flex-start; gap: 14px;
            padding-bottom: 14px; border-bottom: 1px solid #f3f4f6;
          }
          .moveout-modal-icon-wrap {
            width: 52px; height: 52px; border-radius: 14px;
            background: #fff7ed; border: 2px solid #fed7aa;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .moveout-modal-title { font-size: 17px; font-weight: 800; color: #1f2937; margin: 0 0 2px; }
          .moveout-modal-time { font-size: 12px; color: #9ca3af; margin: 0; font-weight: 500; }
          .moveout-read-badge {
            margin-left: auto; flex-shrink: 0; align-self: flex-start;
            font-size: 10px; font-weight: 700; color: #15803d;
            background: #dcfce7; border: 1px solid #bbf7d0;
            padding: 3px 10px; border-radius: 999px;
          }
          .moveout-modal-content { padding: 14px 0; }
          .moveout-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .moveout-detail-item {
            background: #f9fafb; border-radius: 12px; padding: 12px;
            display: flex; flex-direction: column; gap: 4px;
            border: 1px solid #f3f4f6;
          }
          .moveout-detail-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.4px; }
          .moveout-detail-value { font-size: 14px; font-weight: 800; color: #1f2937; }
          .moveout-contact-value { font-family: 'Courier New', monospace; letter-spacing: 0.5px; color: #1a5c2a; }
          .moveout-email-value {
            font-size: 13px; font-weight: 700; color: #1a5c2a;
            text-decoration: underline; text-underline-offset: 2px;
            word-break: break-all;
          }
          .moveout-email-value:hover { color: #154d23; }
          .moveout-email-loading { font-size: 12px; color: #9ca3af; font-style: italic; }
          .moveout-email-empty { font-size: 12px; color: #9ca3af; }
          .moveout-reason-text { font-size: 13px; color: #6b7280; line-height: 1.6; margin: 0; }

          /* ── Modal actions ─────────────────────────────────── */
          .moveout-modal-actions {
            display: flex; flex-direction: column; gap: 8px;
            margin-top: 14px; padding-top: 14px; border-top: 1px solid #f3f4f6;
          }

          /* Info message */
          .moveout-contact-info-msg {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 14px;
            background: #eff6ff; border: 1px solid #bfdbfe;
            border-radius: 10px;
            font-size: 12px; font-weight: 600; color: #1d4ed8; line-height: 1.4;
          }
          .moveout-contact-info-icon { font-size: 14px; flex-shrink: 0; }

          /* Mark as read button */
          .moveout-markread-btn {
            width: 100%; padding: 12px;
            background: #1a5c2a; color: #fff;
            border: none; border-radius: 10px;
            font-size: 13px; font-weight: 700;
            font-family: 'Inter', sans-serif;
            cursor: pointer; transition: background 0.2s;
          }
          .moveout-markread-btn:hover:not(:disabled) { background: #154d23; }
          .moveout-markread-btn--done {
            background: #f0fdf4 !important;
            color: #15803d !important;
            border: 1.5px solid #bbf7d0 !important;
            cursor: default !important;
          }
          .moveout-markread-btn:disabled { opacity: 0.7; cursor: not-allowed; }

          /* Close button */
          .moveout-modal-close-btn {
            width: 100%; padding: 10px;
            background: #f3f4f6; border: 1px solid #e5e7eb;
            border-radius: 10px; font-size: 13px; font-weight: 700;
            color: #6b7280; font-family: 'Inter', sans-serif;
            cursor: pointer; transition: background 0.2s;
          }
          .moveout-modal-close-btn:hover { background: #e5e7eb; }

          /* ── Filter pills ──────────────────────────────────── */
          .rec-filter-pills { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
          .rec-filter-pills::-webkit-scrollbar { display: none; }
          .rec-filter-pill { padding: 6px 14px; border-radius: var(--r-full); border: 1.5px solid var(--color-border); background: var(--color-surface); font-size: 11px; font-weight: 700; color: var(--color-text-muted); cursor: pointer; font-family: 'Inter', sans-serif; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
          .rec-filter-pill:hover { border-color: var(--color-brand-green); color: var(--color-brand-green); }
          .rec-pill-active { background: var(--color-brand-green) !important; color: #fff !important; border-color: var(--color-brand-green) !important; }

          /* ── Activity header / sort ────────────────────────── */
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

          /* ── Renter grid & cards ───────────────────────────── */
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

          /* ── Renter modal ──────────────────────────────────── */
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

          /* ── Payment form ──────────────────────────────────── */
          .pay-form-btn { width: 100%; padding: 10px; background: #1a5c2a; color: #fff; border: none; border-radius: var(--r-md); font-size: 13px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; transition: background 0.2s; text-align: center; margin-bottom: 8px; }
          .pay-form-btn:hover { background: #154d23; }
          .moveout-btn { width: 100%; padding: 10px; background: #dc2626; color: #fff; border: none; border-radius: var(--r-md); font-size: 13px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; transition: background 0.2s; text-align: center; margin-bottom: 8px; }
          .moveout-btn:hover { background: #b91c1c; }
          .pay-form { display: flex; flex-direction: column; gap: 10px; padding: 12px; background: #f9fafb; border: 1.5px dashed var(--color-border); border-radius: var(--r-md); margin-bottom: 8px; text-align: left; }
          .pay-form-title { font-size: 12px; font-weight: 800; color: var(--color-text); margin: 0 0 4px; }
          .pay-input-group { display: flex; flex-direction: column; gap: 4px; }
          .pay-label { font-size: 10px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; }
          .pay-input { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--r-sm); font-size: 13px; outline: none; background: #fff; color: #374151; }
          .pay-form-actions { display: flex; gap: 8px; margin-top: 4px; }
          .pay-submit-btn { flex: 1; padding: 8px; background: #1a5c2a; color: #fff; border: none; border-radius: var(--r-sm); font-size: 12px; font-weight: 700; cursor: pointer; }
          .pay-submit-btn:hover { background: #154d23; }
          .pay-cancel-btn { flex: 1; padding: 8px; background: #f3f4f6; color: #4b5563; border: 1px solid var(--color-border); border-radius: var(--r-sm); font-size: 12px; font-weight: 700; cursor: pointer; }
          .pay-cancel-btn:hover { background: #e5e7eb; }
          .app-detail-label { font-size: 10px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
          .app-detail-value { font-size: 13px; font-weight: 700; color: var(--color-text); }

          /* ── Responsive ────────────────────────────────────── */
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
    </ContractorLockScreen>
  );
}