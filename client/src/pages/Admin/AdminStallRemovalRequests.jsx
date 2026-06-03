import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Store, Trash2, User, Mail, Calendar, Info, FileText } from 'lucide-react';
import { useCurrentUser, getToken } from '../../utils/auth';
import AdminSidebar from '../../components/AdminSidebar';
import NotificationBell from '../../components/NotificationBell';

const LogoutIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function AdminStallRemovalRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionStatus, setActionStatus] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const navigate = useNavigate();
  const { userName, loading: authLoading } = useCurrentUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stall-removal-requests/admin/requests/pending', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      setRequests(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch removal requests:', err);
      setError('Failed to load pending removal requests. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleAction = async (requestId, action) => {
    setSubmittingAction(true);
    setActionStatus(null);
    try {
      const res = await fetch(`/api/stall-removal-requests/admin/requests/${requestId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} request`);

      // Refresh list
      await fetchPendingRequests();
      // Close modal
      setSelectedRequest(null);
      setAdminNotes('');
      alert(`Request has been successfully ${action}d!`);
    } catch (err) {
      setActionStatus(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#f5f5f0] font-sans overflow-hidden w-full text-left">
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
      <AdminSidebar active="nav-removal-requests" />

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
              <span>Admin</span>
              <ChevronRight size={14} />
              <span className="text-gray-700 font-semibold">Stall Removal Requests</span>
            </div>
          </div>
          <div className="header-right">
            <div className="header-welcome">
              <span className="welcome-name">
                {authLoading ? 'Loading…' : userName ? `${userName}` : 'Welcome, Guest'}
              </span>
              <span className="welcome-role">Market Supervisor</span>
            </div>
            <NotificationBell />
            <button className="header-logout-btn" aria-label="Log out" onClick={() => setShowLogoutModal(true)}>
              <LogoutIcon />
            </button>
          </div>
        </header>

        {/* Content Main */}
        <main className="dashboard-main overflow-y-auto p-6">
          <div className="flex flex-col gap-1 mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              Stall Removal Requests
              {requests.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#f59e0b] text-xs font-black text-white leading-none">
                  {requests.length}
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-400 font-medium">Review and process requests submitted by contractors to remove available stalls.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5c2a]"></div>
              <span className="text-sm font-semibold">Loading pending requests...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-center text-sm font-semibold max-w-lg mx-auto mt-10">
              {error}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-100 rounded-3xl p-8 max-w-lg mx-auto mt-6 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-[#1a5c2a] mb-4">
                <Store size={28} />
              </div>
              <h3 className="text-base font-extrabold text-gray-800 mb-1">All Caught Up!</h3>
              <p className="text-xs text-gray-400 text-center">There are no pending stall removal requests to review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map(req => {
                const dateString = new Date(req.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div
                    key={req._id}
                    onClick={() => {
                      setSelectedRequest(req);
                      setAdminNotes(req.adminNotes || '');
                      setActionStatus(null);
                    }}
                    className="bg-white border border-gray-100 rounded-3xl p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative group animate-in fade-in slide-in-from-bottom-4 duration-200"
                    style={{ borderLeft: '4px solid #f59e0b' }}
                  >
                    <div>
                      {/* Top Row */}
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-extrabold text-[#d97706] bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Pending Removal
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">{dateString}</span>
                      </div>

                      {/* Location & Stall */}
                      <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-[#1a5c2a] transition-colors">
                        {req.location}
                      </h3>

                      {/* Contractor Info */}
                      <div className="flex flex-col gap-1 text-xs text-gray-500 mb-4 font-medium">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-gray-400" />
                          <span>{req.contractorId?.businessName || 'Contractor'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-gray-400" />
                          <span>{req.contractorId?.email || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Reason message preview */}
                      <div className="bg-amber-50/40 border border-amber-100/50 p-3 rounded-2xl text-xs text-gray-700 font-medium">
                        <span className="block text-[9px] text-[#d97706] font-extrabold uppercase tracking-wider mb-1">Reason for Removal</span>
                        <p className="line-clamp-3 leading-relaxed m-0 italic">"{req.requestReason}"</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-semibold">
                      <span>Click to process</span>
                      <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="border-b border-gray-150 pb-3 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedRequest.location}</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Removal Request Details</span>
              </div>
              <span className="text-[10px] font-extrabold text-[#d97706] bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Pending
              </span>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {/* Contractor info card */}
              <div className="bg-gray-50 p-3.5 rounded-2xl space-y-2">
                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Contractor Information</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-gray-400">Business Name</span>
                    <strong className="text-gray-700">{selectedRequest.contractorId?.businessName || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="block text-gray-400">Email Address</span>
                    <strong className="text-gray-700 overflow-hidden text-ellipsis block">{selectedRequest.contractorId?.email || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Request Reason */}
              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-sm text-gray-700 font-medium">
                <span className="block text-[10px] text-[#d97706] font-bold uppercase tracking-wider mb-1.5">Reason for Removal</span>
                <p className="m-0 italic leading-relaxed">"{selectedRequest.requestReason}"</p>
              </div>

              {/* Admin Notes Form */}
              <div className="space-y-2">
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Admin Notes / Remarks
                </label>
                <textarea
                  placeholder="Enter comments or reason for decision..."
                  rows="3"
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a5c2a] transition-all resize-none text-gray-800"
                />
              </div>

              {actionStatus && (
                <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl">
                  {actionStatus}
                </div>
              )}
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex w-full gap-3 mt-2">
              <button 
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
              <button 
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                disabled={submittingAction}
                onClick={() => handleAction(selectedRequest._id, 'reject')}
              >
                Reject Request
              </button>
              <button 
                className="flex-1 py-3 rounded-xl bg-[#1a5c2a] hover:bg-[#154d23] text-white text-xs font-bold transition-all disabled:opacity-50"
                disabled={submittingAction}
                onClick={() => handleAction(selectedRequest._id, 'approve')}
              >
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
