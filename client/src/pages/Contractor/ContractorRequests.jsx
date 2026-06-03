import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Store, Clock, AlertTriangle, FileText, CheckCircle, XCircle } from "lucide-react";
import { useCurrentUser, getUser, getToken } from '../../utils/auth';

import ContractorLockScreen from './ContractorLockScreen';
import NotificationBell from '../../components/NotificationBell';

const LogoutIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);



export default function ContractorRequests() {
  const [requestType, setRequestType] = useState("additions"); // "additions" | "removals"
  const [additions, setAdditions] = useState([]);
  const [removals, setRemovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { userName, loading: authLoading } = useCurrentUser();

  const user = getUser();
  const userEmail = user?.email || '';

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch additions
      const additionsRes = await fetch('/api/contractor/stall-requests/my-requests', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let additionsData = [];
      if (additionsRes.ok) {
        additionsData = await additionsRes.json();
      }

      // 2. Fetch removals
      const removalsRes = await fetch('/api/stall-removal-requests/contractor/my-requests', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let removalsData = [];
      if (removalsRes.ok) {
        removalsData = await removalsRes.json();
      }

      setAdditions(additionsData);
      setRemovals(removalsData);
    } catch (err) {
      console.error('Error fetching contractor requests:', err);
      setError('Failed to load requests. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { bg: '#dcfce7', text: '#15803d', icon: <CheckCircle size={14} /> };
      case 'rejected':
        return { bg: '#fee2e2', text: '#dc2626', icon: <XCircle size={14} /> };
      default:
        return { bg: '#fef9c3', text: '#a16207', icon: <Clock size={14} /> };
    }
  };

  return (
    <ContractorLockScreen>
      <div className="flex h-screen bg-[#f5f5f0] font-sans overflow-hidden w-full text-left">
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
                <span className="text-gray-700 font-semibold">My Requests</span>
              </div>
            </div>
            <div className="header-right">
              <div className="header-welcome">
                <span className="welcome-name">
                  {authLoading ? 'Loading…' : userName ? `${userName}` : 'Welcome, Guest'}
                </span>
                <span className="welcome-role">Contractor</span>
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

          <main className="dashboard-main overflow-y-auto p-6" style={{ paddingBottom: 100 }}>
            <div className="flex flex-col gap-1 mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Requests</h1>
              <p className="text-xs text-gray-400 font-medium">Track your stall additions and removals requests in one place.</p>
            </div>

            {/* Segmented Toggle Control */}
            <div className="flex bg-gray-200/60 p-1 rounded-2xl mb-6 w-full max-w-md border border-gray-100 shrink-0">
              <button
                onClick={() => setRequestType("additions")}
                className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all ${
                  requestType === "additions" ? "bg-white text-green-700 shadow-sm border border-gray-150/40" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Stall Additions ({additions.length})
              </button>
              <button
                onClick={() => setRequestType("removals")}
                className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all ${
                  requestType === "removals" ? "bg-white text-green-700 shadow-sm border border-gray-150/40" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Stall Removals ({removals.length})
              </button>
            </div>

            {/* Content Lists */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5c2a]"></div>
                <span className="text-sm font-semibold">Loading requests...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-center text-sm font-semibold max-w-lg mx-auto">
                {error}
              </div>
            ) : requestType === "additions" ? (
              additions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-[#1a5c2a] mb-4">
                    <Store size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 mb-1">No Addition Requests</h3>
                  <p className="text-xs text-gray-400 text-center">You haven't requested any stalls to be added to your account yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {additions.map(item => {
                    const statusConfig = getStatusColor(item.status);
                    const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <div key={item._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-extrabold text-[#1a5c2a] bg-green-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Add Stall Request
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">{formattedDate}</span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">
                            {item.stallLocation || `Stall #${item.stallId?.stallNumber}`}
                          </h3>
                          <div className="text-xs text-gray-500 space-y-1 mb-2 font-medium">
                            <div>Section: <strong>{item.stallId?.section || 'N/A'}</strong></div>
                            <div>Zone: <strong>{item.stallId?.zone || 'N/A'}</strong></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                          <span className="text-xs text-gray-400 font-semibold">Status</span>
                          <span
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                            style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
                          >
                            {statusConfig.icon}
                            <span className="capitalize">{item.status}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : removals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-[#f59e0b] mb-4">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">No Removal Requests</h3>
                <p className="text-xs text-gray-400 text-center">You haven't requested any stalls to be removed yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {removals.map(item => {
                  const statusConfig = getStatusColor(item.status);
                  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return (
                    <div key={item._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between" style={{ borderLeft: '4px solid #f59e0b' }}>
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-extrabold text-[#d97706] bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Remove Stall Request
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold">{formattedDate}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">
                          {item.location}
                        </h3>
                        <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-600 mb-2">
                          <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Removal Reason</span>
                          <p className="m-0 italic">"{item.requestReason}"</p>
                        </div>
                        {item.adminNotes && (
                          <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs text-blue-700">
                            <span className="block text-[9px] text-blue-500 font-bold uppercase tracking-wider mb-0.5">Admin Response</span>
                            <p className="m-0 font-semibold">{item.adminNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                        <span className="text-xs text-gray-400 font-semibold">Status</span>
                        <span
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
                        >
                          {statusConfig.icon}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

      </div>
    </ContractorLockScreen>
  );
}
