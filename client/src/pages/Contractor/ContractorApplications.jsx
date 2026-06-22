import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Store } from "lucide-react";
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

const TABS = ["Pending", "Approved", "Rejected"];

export default function ContractorApplication() {
  const [tab, setTab] = useState("Pending");
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { userName, loading: authLoading } = useCurrentUser();
  const [processingId, setProcessingId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [animating, setAnimating] = useState({});
  const [rejectTarget, setRejectTarget] = useState(null); // app being rejected (reason prompt)
  const [rejectReason, setRejectReason] = useState("");

  const filteredApps = applications.filter(
    a => a.status?.toLowerCase() === tab.toLowerCase()
  );

  const user = getUser();
  const userEmail = user?.email || '';

  // ── Fetch renter applications on mount ──────────────────────────
  useEffect(() => {
    if (!userEmail) return;
    setLoadingApps(true);
    fetch(`/api/contractor/applications?email=${userEmail}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(appsData => {
        setApplications(appsData);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch applications:', err);
        setError('Failed to load data. Please refresh.');
      })
      .finally(() => setLoadingApps(false));
  }, [userEmail]);

  const handleLogout = () => {
    navigate('/login');
  };

  // ── Approve / Reject — persists to backend ───────────────
  const handleAction = async (id, action, rejectionReason = '') => {
    setProcessingId(id);
    setAnimating(prev => ({ ...prev, [id]: action }));

    try {
      const res = await fetch(`/api/contractor/applications/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason }), // "approve" | "reject" (+ reason)
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      // Update UI only after backend confirms
      setApplications(prev =>
        prev.map(a =>
          a.id === id
            ? { ...a, status: action === 'approve' ? 'Approved' : 'Rejected' }
            : a
        )
      );
    } catch (err) {
      console.error('Failed to update application:', err);
      alert('Action failed. Please try again.');
    } finally {
      setProcessingId(null);
      setAnimating(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const pendingCount = applications.filter(a => a.status?.toLowerCase() === "pending").length;
  const approvedCount = applications.filter(a => a.status?.toLowerCase() === "approved").length;
  const rejectedCount = applications.filter(a => a.status?.toLowerCase() === "rejected").length;
  const tabCounts = { Pending: pendingCount, Approved: approvedCount, Rejected: rejectedCount };

  // ── Shared list renderer ─────────────────────────────────
  const renderList = () => {
    if (loadingApps) {
      return (
        <div className="no-applications">
          <span style={{ fontSize: 32 }}></span>
          <span>Loading applications…</span>
        </div>
      );
    }
    if (error) {
      return (
        <div className="no-applications" style={{ color: '#dc2626' }}>
          <span style={{ fontSize: 32 }}></span>
          <span>{error}</span>
        </div>
      );
    }
    if (filteredApps.length === 0) {
      return (
        <div className="no-applications">
          <span style={{ fontSize: 32 }}>
            {tab === "Pending" ? "" : tab === "Approved" ? "" : ""}
          </span>
          <span>No {tab.toLowerCase()} applications</span>
        </div>
      );
    }
    return filteredApps.map(app => (
      <div
        key={app.id}
        className={`application-row apps-row-full${animating[app.id] === "approve" ? " action-approved" : ""
          }${animating[app.id] === "reject" ? " action-rejected" : ""
          }`}
      >
        <div className="app-avatar">
          <span style={{ fontSize: 15, fontWeight: 800, color: "#6b7280" }}>
            {app.initials}
          </span>
        </div>
        <div className="app-info">
          <div className="apps-name-row">
            <span className="app-name">{app.fullName || app.name}</span>
            <span className="apps-stall-badge" style={{ background: app.stallColor || app.avatarColor || '#1a5c2a' }}>
              {app.stallLocation || app.stall}
            </span>
          </div>
          <span className="app-meta">{app.contactNumber || app.phone}</span>
          {app.additionalMessage && (
            <div className="mt-2 text-xs bg-gray-50 border border-gray-100 p-2.5 rounded-lg text-gray-600 font-medium text-left">
              <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Message</span>
              <p className="whitespace-pre-wrap leading-relaxed m-0 text-gray-750">{app.additionalMessage}</p>
            </div>
          )}
          <div className="apps-meta-row">
            <span className="apps-date">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: 3 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Applied: {app.date || app.submittedOn || app.applied}
            </span>
            <span className="app-type" style={{ color: app.typeColor }}>{app.intendedBusinessUse || app.type}</span>
          </div>
        </div>
        <div className="apps-action-col">
          {tab === "Pending" ? (
            <>
              <button className="apps-view-btn" onClick={() => setSelectedApp(app)}>View Details</button>
              <div className="app-actions">
                <button
                  className="btn-reject"
                  disabled={processingId === app.id}
                  onClick={() => { setRejectReason(""); setRejectTarget(app); }}
                  aria-label="Reject"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <button
                  className="btn-approve"
                  disabled={processingId === app.id}
                  onClick={() => handleAction(app.id, "approve")}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Approve
                </button>
              </div>
            </>
          ) : (
            <div className="apps-status-row">
              <button className="apps-view-btn" onClick={() => setSelectedApp(app)}>View Details</button>
              <span className={`apps-status-chip apps-status-${app.status?.toLowerCase()}`}>
                {app.status?.toLowerCase() === "approved" ? "✓ Approved" : "✗ Rejected"}
              </span>
            </div>
          )}
        </div>
      </div>
    ));
  };

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
                <span className="text-gray-700 font-semibold">Applications</span>
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

          <main className="dashboard-main apps-main">
            <div className="apps-title-block">
              <h1 className="apps-page-title">Rental Applications</h1>
              <p className="apps-page-sub">Manage and review new stall requests from vendors.</p>
            </div>

            {/* Tab Bar */}
            <div className="apps-tab-bar">
              {TABS.map(t => (
                <button
                  key={t}
                  className={`apps-tab${tab === t ? " apps-tab-active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t}
                  {tabCounts[t] > 0 && (
                    <span className={`apps-tab-badge${tab === t ? " apps-tab-badge-active" : ""}`}>
                      {tabCounts[t]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Applications List */}
            <div className="applications-list apps-list-full">
              {renderList()}
            </div>
          </main>
        </div>


        {/* Detail Modal */}
        {selectedApp && (
          <div className="logout-overlay" onClick={() => setSelectedApp(null)}>
            <div className="app-detail-modal" onClick={e => e.stopPropagation()}>
              <div className="app-detail-header">
                <div className="app-avatar app-detail-avatar">
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#6b7280" }}>
                    {selectedApp.initials}
                  </span>
                </div>
                <div>
                  <h2 className="app-detail-name">{selectedApp.fullName || selectedApp.name}</h2>
                  <span className="app-detail-phone">{selectedApp.contactNumber || selectedApp.phone}</span>
                </div>
              </div>
              <div className="app-detail-grid">
                <div className="app-detail-item">
                  <span className="app-detail-label">Stall Requested</span>
                  <span className="app-detail-value" style={{ color: '#1a5c2a', fontWeight: 800 }}>
                    {selectedApp.stallLocation || selectedApp.stall}
                  </span>
                </div>
                <div className="app-detail-item">
                  <span className="app-detail-label">Application Type</span>
                  <span className="app-detail-value" style={{ color: selectedApp.typeColor }}>
                    {selectedApp.intendedBusinessUse || selectedApp.type}
                  </span>
                </div>
                <div className="app-detail-item">
                  <span className="app-detail-label">Date Applied</span>
                  <span className="app-detail-value">
                    {selectedApp.date || selectedApp.submittedOn || selectedApp.applied}
                  </span>
                </div>
                {selectedApp.additionalMessage && (
                  <div className="app-detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="app-detail-label">Message</span>
                    <p className="app-detail-value" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                      {selectedApp.additionalMessage}
                    </p>
                  </div>
                )}
                <div className="app-detail-item">
                  <span className="app-detail-label">Status</span>
                  <span className={`apps-status-chip apps-status-${selectedApp.status?.toLowerCase()}`} style={{ alignSelf: "flex-start" }}>
                    {selectedApp.status?.charAt(0).toUpperCase() + selectedApp.status?.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
              {selectedApp.status?.toLowerCase() === "pending" && (
                <div className="app-detail-actions">
                  <button
                    className="btn-reject"
                    style={{ flex: 1, justifyContent: "center", gap: 6 }}
                    onClick={() => { setRejectReason(""); setRejectTarget(selectedApp); setSelectedApp(null); }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Reject
                  </button>
                  <button
                    className="btn-approve"
                    style={{ flex: 1, justifyContent: "center", gap: 6 }}
                    onClick={() => { handleAction(selectedApp.id, "approve"); setSelectedApp(null); }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Approve
                  </button>
                </div>
              )}
              <button className="stall-modal-close" onClick={() => setSelectedApp(null)}>Close</button>
            </div>
          </div>
        )}

        {/* ── Reject Reason Modal ── */}
        {rejectTarget && (
          <div
            onClick={() => setRejectTarget(null)}
            style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          >
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Reject Application</h3>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>
                {rejectTarget.name ? `${rejectTarget.name} · ` : ""}{rejectTarget.stall || ""}. The applicant will see this reason and may appeal.
              </p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (e.g. incomplete requirements, stall already reserved)…"
                rows={4}
                autoFocus
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, color: "#111827", outline: "none", resize: "vertical", fontFamily: "inherit", marginBottom: 14, boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setRejectTarget(null)}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  disabled={!rejectReason.trim() || processingId === rejectTarget.id}
                  onClick={() => { const t = rejectTarget; setRejectTarget(null); handleAction(t.id, "reject", rejectReason.trim()); }}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: rejectReason.trim() ? "#dc2626" : "#fca5a5", color: "#fff", fontWeight: 800, fontSize: 13, cursor: rejectReason.trim() ? "pointer" : "not-allowed" }}
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}

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
    </ContractorLockScreen>
  );
}