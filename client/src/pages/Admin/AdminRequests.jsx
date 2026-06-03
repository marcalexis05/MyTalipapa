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

const TABS = ["Pending", "Approved", "Rejected"];

export default function AdminRequests() {
  const [requestType, setRequestType] = useState('additions'); // 'additions' or 'removals'
  const [additionTab, setAdditionTab] = useState('Pending'); // 'Pending', 'Approved', 'Rejected'
  const [removalTab, setRemovalTab] = useState('Pending'); // 'Pending', 'Approved', 'Rejected'
  
  // Stall Additions state
  const [additionRequests, setAdditionRequests] = useState([]);
  const [loadingAdditions, setLoadingAdditions] = useState(false);
  const [additionError, setAdditionError] = useState(null);
  const [selectedStallRequest, setSelectedStallRequest] = useState(null);

  // Stall Removals state
  const [removalRequests, setRemovalRequests] = useState([]);
  const [loadingRemovals, setLoadingRemovals] = useState(false);
  const [removalError, setRemovalError] = useState(null);
  const [selectedRemovalRequest, setSelectedRemovalRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionStatus, setActionStatus] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Live badge counts
  const [pendingAdditionsCount, setPendingAdditionsCount] = useState(0);
  const [pendingRemovalsCount, setPendingRemovalsCount] = useState(0);

  // Shared UI states
  const [processingId, setProcessingId] = useState(null);
  const [animating, setAnimating] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();
  const { userName, loading: authLoading } = useCurrentUser();

  // Fetch counts of pending items for the header badges
  const fetchHeaderCounts = async () => {
    try {
      const [additionsRes, removalsRes] = await Promise.all([
        fetch('/api/admin/stall-requests/pending', {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
        fetch('/api/stall-removal-requests/admin/requests/pending', {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
      ]);
      if (additionsRes.ok) {
        const additions = await additionsRes.json();
        setPendingAdditionsCount(additions.length);
      }
      if (removalsRes.ok) {
        const removals = await removalsRes.json();
        setPendingRemovalsCount(removals.length);
      }
    } catch (err) {
      console.error('Error fetching header counts:', err);
    }
  };

  // Fetch additions list
  const fetchStallAdditions = async () => {
    setLoadingAdditions(true);
    const endpoint =
      additionTab === 'Approved'
        ? '/api/admin/stall-requests/approved'
        : additionTab === 'Rejected'
        ? '/api/admin/stall-requests/rejected'
        : '/api/admin/stall-requests/pending';

    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      setAdditionRequests(data);
      setAdditionError(null);
    } catch (err) {
      console.error('Failed to fetch stall requests:', err);
      setAdditionError('Failed to load stall addition requests.');
    } finally {
      setLoadingAdditions(false);
    }
  };

  // Fetch removals list
  const fetchRemovalRequests = async () => {
    setLoadingRemovals(true);
    const endpoint =
      removalTab === 'Approved'
        ? '/api/stall-removal-requests/admin/requests/approved'
        : removalTab === 'Rejected'
        ? '/api/stall-removal-requests/admin/requests/rejected'
        : '/api/stall-removal-requests/admin/requests/pending';

    try {
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      setRemovalRequests(data);
      setRemovalError(null);
    } catch (err) {
      console.error('Failed to fetch removal requests:', err);
      setRemovalError('Failed to load stall removal requests.');
    } finally {
      setLoadingRemovals(false);
    }
  };

  // Run fetches on tab changes
  useEffect(() => {
    fetchHeaderCounts();
    if (requestType === 'additions') {
      fetchStallAdditions();
    } else {
      fetchRemovalRequests();
    }
  }, [requestType, additionTab, removalTab]);

  // Stall Addition actions
  const handleStallAction = async (id, action) => {
    setProcessingId(id);
    setAnimating(prev => ({ ...prev, [id]: action }));
    try {
      const res = await fetch('/api/admin/stall-requests/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ requestId: id, action }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      // Remove from view
      setAdditionRequests(prev => prev.filter(r => r._id !== id));
      
      // Update top counts
      fetchHeaderCounts();
    } catch (err) {
      console.error('Failed to update stall request:', err);
      alert('Action failed. Please try again.');
    } finally {
      setProcessingId(null);
      setAnimating(prev => { const next = { ...prev }; delete next[id]; return next; });
    }
  };

  // Stall Removal actions
  const handleRemovalAction = async (requestId, action) => {
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

      // Refresh data
      await fetchRemovalRequests();
      await fetchHeaderCounts();
      
      // Reset modal state
      setSelectedRemovalRequest(null);
      setAdminNotes('');
      alert(`Removal request has been successfully ${action}d!`);
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
      <AdminSidebar active="nav-requests" />

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
              <span className="text-gray-700 font-semibold">Requests</span>
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
        <main className="dashboard-main overflow-y-auto p-6 apps-main">
          {/* Title Block */}
          <div className="apps-title-block mb-6">
            <h1 className="apps-page-title text-2xl font-extrabold text-gray-900 tracking-tight">
              Requests Management
            </h1>
            <p className="apps-page-sub text-xs text-gray-400 font-medium">
              Review and manage contractor requests for adding new stalls or removing existing ones.
            </p>
          </div>

          {/* Segmented Toggle Control */}
          <div className="flex bg-gray-200/60 p-1.5 rounded-2xl mb-6 w-full max-w-md border border-gray-100">
            <button
              onClick={() => setRequestType('additions')}
              className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all relative ${
                requestType === 'additions' ? "bg-white text-green-700 shadow-sm border border-gray-150/40" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Stall Additions
              {pendingAdditionsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white border-2 border-white">
                  {pendingAdditionsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setRequestType('removals')}
              className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all relative ${
                requestType === 'removals' ? "bg-white text-[#d97706] shadow-sm border border-gray-150/40" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Stall Removals
              {pendingRemovalsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f59e0b] text-[9px] font-black text-white border-2 border-white">
                  {pendingRemovalsCount}
                </span>
              )}
            </button>
          </div>

          {/* Sub Content Areas */}
          {requestType === 'additions' ? (
            <>
              {/* Stall Additions Sub-Tabs */}
              <div className="apps-tab-bar mb-4">
                {TABS.map(t => (
                  <button
                    key={t}
                    className={`apps-tab${additionTab === t ? " apps-tab-active" : ""}`}
                    onClick={() => setAdditionTab(t)}
                  >
                    {t}
                    {t === "Pending" && pendingAdditionsCount > 0 && (
                      <span className={`apps-tab-badge${additionTab === t ? " apps-tab-badge-active" : ""}`}>
                        {pendingAdditionsCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Additions List */}
              <div className="applications-list apps-list-full">
                {loadingAdditions ? (
                  <div className="no-applications">
                    <span style={{ fontSize: 32 }}>⏳</span>
                    <span>Loading stall requests…</span>
                  </div>
                ) : additionError ? (
                  <div className="no-applications" style={{ color: '#dc2626' }}>
                    <span style={{ fontSize: 32 }}>⚠️</span>
                    <span>{additionError}</span>
                  </div>
                ) : additionRequests.length === 0 ? (
                  <div className="no-applications">
                    <span style={{ fontSize: 32 }}>✨</span>
                    <span>No {additionTab.toLowerCase()} stall requests</span>
                  </div>
                ) : (
                  additionRequests.map(req => (
                    <div key={req._id} className="application-row apps-row-full bg-white p-5 border border-gray-100 rounded-3xl flex items-center justify-between mb-3 shadow-sm hover:shadow-md transition-all">
                      <div className="app-info flex-1">
                        <div className="apps-name-row flex items-center justify-between mb-1">
                          <span className="app-name font-bold text-gray-800">Stall #{req.stallId?.stallNumber || req.stallId?._id || 'N/A'}</span>
                          <span className="apps-stall-badge text-xs font-bold px-2 py-0.5 rounded-full text-white bg-green-650" style={{ background: '#1a5c2a' }}>
                            {req.contractorEmail}
                          </span>
                        </div>
                        <span className="app-meta text-xs text-gray-400 font-medium">Requested at: {new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="apps-action-col flex items-center gap-2">
                        <button className="apps-view-btn text-xs font-bold border border-gray-200 rounded-xl px-4 py-2 text-gray-600 hover:border-green-650 hover:text-green-650 transition-colors" onClick={() => setSelectedStallRequest(req)}>
                          View Details
                        </button>
                        {additionTab === "Pending" ? (
                          <div className="flex gap-2">
                            <button
                              disabled={processingId === req._id}
                              onClick={() => handleStallAction(req._id, 'reject')}
                              className="bg-red-50 hover:bg-red-100 text-red-650 text-xs font-extrabold px-3 py-2 rounded-xl border border-red-200 transition-all"
                            >
                              Reject
                            </button>
                            <button
                              disabled={processingId === req._id}
                              onClick={() => handleStallAction(req._id, 'approve')}
                              className="bg-green-50 hover:bg-green-100 text-green-750 text-xs font-extrabold px-3 py-2 rounded-xl border border-green-200 transition-all"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className={`apps-status-chip apps-status-${req.status.toLowerCase()}`}>
                            {req.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            // Stall Removals View
            <>
              {/* Stall Removals Sub-Tabs */}
              <div className="apps-tab-bar mb-4">
                {TABS.map(t => (
                  <button
                    key={t}
                    className={`apps-tab${removalTab === t ? " apps-tab-active" : ""}`}
                    onClick={() => setRemovalTab(t)}
                  >
                    {t}
                    {t === "Pending" && pendingRemovalsCount > 0 && (
                      <span className={`apps-tab-badge${removalTab === t ? " apps-tab-badge-active" : ""}`}>
                        {pendingRemovalsCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="applications-list">
                {loadingRemovals ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5c2a]"></div>
                    <span className="text-sm font-semibold">Loading removal requests...</span>
                  </div>
                ) : removalError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-center text-sm font-semibold max-w-lg mx-auto mt-10">
                    {removalError}
                  </div>
                ) : removalRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-100 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-[#1a5c2a] mb-4">
                      <Store size={28} />
                    </div>
                    <h3 className="text-base font-extrabold text-gray-800 mb-1">All Caught Up!</h3>
                    <p className="text-xs text-gray-400 text-center">There are no {removalTab.toLowerCase()} removal requests to review.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {removalRequests.map(req => {
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
                            setSelectedRemovalRequest(req);
                            setAdminNotes(req.adminNotes || '');
                            setActionStatus(null);
                          }}
                          className="bg-white border border-gray-100 rounded-3xl p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative group animate-in fade-in slide-in-from-bottom-4 duration-200"
                          style={{ 
                            borderLeft: req.status === 'approved' 
                              ? '4px solid #1a5c2a' 
                              : req.status === 'rejected' 
                              ? '4px solid #dc2626' 
                              : '4px solid #f59e0b' 
                          }}
                        >
                          <div>
                            {/* Top Row */}
                            <div className="flex justify-between items-start mb-3">
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                req.status === 'approved' 
                                  ? 'text-green-700 bg-green-50' 
                                  : req.status === 'rejected' 
                                  ? 'text-red-750 bg-red-50' 
                                  : 'text-[#d97706] bg-amber-50'
                              }`}>
                                {req.status}
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

                            {/* Reason Message Preview */}
                            <div className="bg-amber-50/40 border border-amber-100/50 p-3 rounded-2xl text-xs text-gray-700 font-medium">
                              <span className="block text-[9px] text-[#d97706] font-extrabold uppercase tracking-wider mb-1">Reason for Removal</span>
                              <p className="line-clamp-3 leading-relaxed m-0 italic">"{req.requestReason}"</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-semibold">
                            <span>{req.status === 'pending' ? 'Click to process' : 'Click to view'}</span>
                            <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Stall Addition Request Detail Modal */}
      {selectedStallRequest && (
        <div className="logout-overlay" onClick={() => setSelectedStallRequest(null)}>
          <div className="app-detail-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  Stall #{selectedStallRequest.stallId?.stallNumber || '—'}
                </h2>
                <span className="text-xs text-gray-400 font-semibold">
                  {selectedStallRequest.stallId?.section} · Zone {selectedStallRequest.stallId?.zone}
                </span>
              </div>
              <span className={`apps-status-chip apps-status-${selectedStallRequest.status}`}>
                {selectedStallRequest.status === "approved" ? "✓ Approved" : selectedStallRequest.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
              </span>
            </div>

            {/* Stall Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="app-detail-item">
                <span className="app-detail-label">Size</span>
                <span className="app-detail-value">{selectedStallRequest.stallId?.size || 12} {selectedStallRequest.stallId?.sizeUnit || 'sqm'}</span>
              </div>
              <div className="app-detail-item">
                <span className="app-detail-label">Monthly Rate</span>
                <span className="app-detail-value">₱{selectedStallRequest.stallId?.monthlyRate?.toLocaleString() || '—'}</span>
              </div>
              <div className="app-detail-item">
                <span className="app-detail-label">Location</span>
                <span className="app-detail-value">{selectedStallRequest.stallId?.location || '—'}</span>
              </div>
              <div className="app-detail-item">
                <span className="app-detail-label">Product Type</span>
                <span className="app-detail-value">{selectedStallRequest.stallId?.productType || '—'}</span>
              </div>
              <div className="app-detail-item">
                <span className="app-detail-label">Operating Hours</span>
                <span className="app-detail-value">{selectedStallRequest.stallId?.operatingHours || '—'}</span>
              </div>
              <div className="app-detail-item">
                <span className="app-detail-label">Status</span>
                <span className="app-detail-value capitalize">{selectedStallRequest.stallId?.status || '—'}</span>
              </div>
            </div>

            {/* Amenities */}
            {selectedStallRequest.stallId?.amenities?.length > 0 && (
              <div className="mb-4">
                <span className="app-detail-label block mb-1">Amenities</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStallRequest.stallId.amenities.map(a => (
                    <span key={a} className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-150">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contractor Info */}
            <div className="bg-gray-50 p-3 rounded-2xl mb-4">
              <span className="app-detail-label block mb-2">Contractor</span>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Email</span>
                  <strong className="text-gray-700">{selectedStallRequest.contractorEmail}</strong>
                </div>
                {selectedStallRequest.stallId?.managedBy && (
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-400">Managed By</span>
                    <strong className="text-gray-700">{selectedStallRequest.stallId.managedBy}</strong>
                  </div>
                )}
                {selectedStallRequest.stallId?.contractorContact && (
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-400">Contact</span>
                    <strong className="text-gray-700">{selectedStallRequest.stallId.contractorContact}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Actions for Pending */}
            {selectedStallRequest.status === "pending" && (
              <div className="flex gap-3 mb-4">
                <button
                  className="btn-reject flex-1 justify-center"
                  onClick={() => { handleStallAction(selectedStallRequest._id, 'reject'); setSelectedStallRequest(null); }}
                >
                  Reject
                </button>
                <button
                  className="btn-approve flex-1 justify-center"
                  onClick={() => { handleStallAction(selectedStallRequest._id, 'approve'); setSelectedStallRequest(null); }}
                >
                  Approve
                </button>
              </div>
            )}

            <button className="stall-modal-close w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200" onClick={() => setSelectedStallRequest(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Stall Removal Request Detail Modal */}
      {selectedRemovalRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedRemovalRequest(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="border-b border-gray-150 pb-3 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedRemovalRequest.location}</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Removal Request Details</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                selectedRemovalRequest.status === 'approved' 
                  ? 'text-green-700 bg-green-50' 
                  : selectedRemovalRequest.status === 'rejected' 
                  ? 'text-red-750 bg-red-50' 
                  : 'text-[#d97706] bg-amber-50'
              }`}>
                {selectedRemovalRequest.status}
              </span>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {/* Contractor Info Card */}
              <div className="bg-gray-50 p-3.5 rounded-2xl space-y-2">
                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Contractor Information</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-gray-400">Business Name</span>
                    <strong className="text-gray-700">{selectedRemovalRequest.contractorId?.businessName || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="block text-gray-400">Email Address</span>
                    <strong className="text-gray-700 overflow-hidden text-ellipsis block">{selectedRemovalRequest.contractorId?.email || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Request Reason */}
              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-sm text-gray-700 font-medium">
                <span className="block text-[10px] text-[#d97706] font-bold uppercase tracking-wider mb-1.5">Reason for Removal</span>
                <p className="m-0 italic leading-relaxed">"{selectedRemovalRequest.requestReason}"</p>
              </div>

              {/* Admin Notes Form */}
              <div className="space-y-2">
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Admin Notes / Remarks
                </label>
                {selectedRemovalRequest.status === 'pending' ? (
                  <textarea
                    placeholder="Enter comments or reason for decision..."
                    rows="3"
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a5c2a] transition-all resize-none text-gray-800"
                  />
                ) : (
                  <p className="text-xs bg-gray-50 border border-gray-150 p-3 rounded-xl font-medium text-gray-700">
                    {selectedRemovalRequest.adminNotes || "No remarks left by administrator."}
                  </p>
                )}
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
                onClick={() => setSelectedRemovalRequest(null)}
              >
                Close
              </button>
              {selectedRemovalRequest.status === 'pending' && (
                <>
                  <button 
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                    disabled={submittingAction}
                    onClick={() => handleRemovalAction(selectedRemovalRequest._id, 'reject')}
                  >
                    Reject Request
                  </button>
                  <button 
                    className="flex-1 py-3 rounded-xl bg-[#1a5c2a] hover:bg-[#154d23] text-white text-xs font-bold transition-all disabled:opacity-50"
                    disabled={submittingAction}
                    onClick={() => handleRemovalAction(selectedRemovalRequest._id, 'approve')}
                  >
                    Approve Request
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styled css elements block */}
      <style>{`
        .apps-main { padding-bottom: 80px; }
        .apps-title-block { margin-bottom: 2px; }
        .apps-page-title { font-size: 20px; font-weight: 800; color: var(--color-text); margin: 0 0 4px; letter-spacing: -0.3px; }
        .apps-page-sub { font-size: 12px; color: var(--color-text-muted); margin: 0; font-weight: 500; }
        .apps-tab-bar { display: flex; gap: 8px; background: var(--color-surface); border-radius: var(--r-lg); padding: 6px; box-shadow: var(--shadow-xs); }
        .apps-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 8px; border-radius: var(--r-md); border: none; background: none; font-size: 13px; font-weight: 700; color: var(--color-text-muted); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; }
        .apps-tab:hover { color: var(--color-text); background: #f3f4f6; }
        .apps-tab-active { background: var(--color-brand-green) !important; color: #fff !important; box-shadow: var(--shadow-green); }
        .apps-tab-badge { background: #e5e7eb; color: var(--color-text-muted); font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: var(--r-full); min-width: 20px; text-align: center; }
        .apps-tab-badge-active { background: rgba(255,255,255,0.25); color: #fff; }
        .apps-list-full { display: flex; flex-direction: column; gap: 10px; }
        .apps-row-full { flex-direction: column; align-items: stretch; gap: 10px; transition: all 0.4s ease; }
        .apps-name-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .apps-stall-badge { font-size: 10px; font-weight: 800; letter-spacing: 0.4px; padding: 3px 9px; border-radius: var(--r-full); color: #fff; flex-shrink: 0; white-space: nowrap; }
        .apps-meta-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px; }
        .apps-date { font-size: 11px; color: var(--color-text-muted); font-weight: 500; display: flex; align-items: center; }
        .apps-action-col { display: flex; flex-direction: column; gap: 8px; }
        .apps-view-btn { background: none; border: 1.5px solid var(--color-border); border-radius: var(--r-sm); padding: 7px 12px; font-size: 12px; font-weight: 700; color: var(--color-text-mid); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; text-align: left; width: 100%; }
        .apps-view-btn:hover { border-color: var(--color-brand-green); color: var(--color-brand-green); background: var(--color-brand-green-light); }
        .apps-status-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .apps-status-chip { font-size: 11px; font-weight: 800; padding: 5px 12px; border-radius: var(--r-full); letter-spacing: 0.3px; flex-shrink: 0; }
        .apps-status-approved { background: #dcfce7; color: #15803d; }
        .apps-status-rejected { background: #fee2e2; color: #dc2626; }
        .apps-status-pending  { background: #fef9c3; color: #a16207; }
        .app-detail-modal { background: var(--color-surface); border-radius: var(--r-xl); padding: 28px 22px 22px; max-width: 380px; width: 100%; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow-lg); animation: slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .app-detail-header { display: flex; align-items: center; gap: 14px; }
        .app-detail-avatar { width: 56px !important; height: 56px !important; flex-shrink: 0; }
        .app-detail-name { font-size: 18px; font-weight: 800; color: var(--color-text); margin: 0 0 2px; }
        .app-detail-phone { font-size: 13px; color: var(--color-text-muted); font-weight: 500; }
        .app-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .app-detail-item { background: #f9fafb; border-radius: var(--r-md); padding: 12px; display: flex; flex-direction: column; gap: 4px; }
        .app-detail-label { font-size: 10px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
        .app-detail-value { font-size: 14px; font-weight: 700; color: var(--color-text); }
        .app-detail-actions { display: flex; gap: 10px; }
        .stall-modal-close { width: 100%; padding: 12px; background: var(--color-brand-green); color: #fff; border: none; border-radius: var(--r-md); font-size: 14px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; transition: background 0.2s; }
        .stall-modal-close:hover { background: var(--color-green-mid); }
        @media (min-width: 640px) {
          .apps-page-title { font-size: 24px; }
          .apps-main { padding-bottom: 90px; }
          .apps-row-full { flex-direction: row; align-items: center; flex-wrap: nowrap; }
          .apps-action-col { flex-direction: column; align-items: flex-end; flex-shrink: 0; gap: 6px; }
          .apps-view-btn { width: auto; }
          .app-actions { flex-direction: row; }
          .apps-status-row { flex-direction: column; align-items: flex-end; }
        }
        @media (min-width: 1024px) {
          .apps-main { padding-bottom: 32px; }
          .apps-page-title { font-size: 26px; }
          .apps-tab { font-size: 14px; padding: 10px 16px; }
        }
      `}</style>
    </div>
  );
}
