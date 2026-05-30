import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Store } from "lucide-react";
import { useCurrentUser, getUser } from '../../utils/auth';
import ContractorLockScreen from './ContractorLockScreen';
import ContractorSidebar from '../../components/ContractorSidebar';
import NotificationBell from '../../components/NotificationBell';

const NAV_ITEMS = [
  {
    id: 'nav-dashboard', label: 'Dashboard', path: '/contractor/dashboard',
    icon: (<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>),
  },
  {
    id: 'nav-stalls', label: 'Stalls', path: '/contractor/stalls',
    icon: (<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>),
  },
  {
    id: 'nav-apps', label: 'Apps', path: '/contractor/applications',
    icon: (<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>),
  },
  {
    id: 'nav-records', label: 'Records', path: '/contractor/records',
    icon: (<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>),
  },
  {
    id: 'nav-profile', label: 'Profile', path: '/contractor/profile',
    icon: (<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
  },
];

const LogoutIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const SECTION_META = {
  Meat: { label: "Meat", color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
  Fishes: { label: "Fishes", color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc" },
  Vegetables: { label: "Vegetables", color: "#15803d", bg: "#dcfce7", border: "#86efac" },
};

const FLOOR_META = {
  upper: { label: "Upper Floor", icon: "⬆️" },
  lower: { label: "Lower Floor", icon: "⬇️" },
};

const STATUS_LABEL = { available: "Available", occupied: "Occupied", pending: "Pending" };

// Sort stalls: by numeric/alphanumeric stallNumber
function sortStalls(list) {
  return [...list].sort((a, b) => {
    const numA = parseInt(a.stallNumber) || 0;
    const numB = parseInt(b.stallNumber) || 0;
    if (numA !== numB) {
      return numA - numB;
    }
    return (a.stallNumber || "").localeCompare(b.stallNumber || "");
  });
}

export default function ContractorStalls() {
  const [activeNav, setActiveNav] = useState('nav-stalls');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStall, setSelectedStall] = useState(null);

  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userName, loading: authLoading } = useCurrentUser();

  // Active section tab (Fishes / Meat / Vegetables)
  const [activeSection, setActiveSection] = useState(null);
  // Active zone tab (A-H or 'all')
  const [activeZone, setActiveZone] = useState('all');

  const user = getUser();
  const userEmail = user?.email || '';

  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/contractor/stalls?email=${userEmail}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setStalls(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [userEmail]);

  // All unique section keys from DB
  const sectionKeys = useMemo(() => {
    const keys = [...new Set(stalls.map(s => s.section).filter(Boolean))];
    // Always ensure "Fishes", "Meat", "Vegetables" are included
    const defaultSections = ["Fishes", "Meat", "Vegetables"];
    defaultSections.forEach(ds => {
      if (!keys.includes(ds)) {
        keys.push(ds);
      }
    });
    // Sort in preferred order
    const order = ["Fishes", "Meat", "Vegetables"];
    return keys.sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [stalls]);

  // Set default section once data loads
  useEffect(() => {
    if (sectionKeys.length > 0 && !activeSection) {
      setActiveSection(sectionKeys[0]);
    }
  }, [sectionKeys, activeSection]);

  // All unique zones for the active section
  const zoneKeys = useMemo(() => {
    if (!activeSection) return [];
    const zones = [...new Set(
      stalls
        .filter(s => s.section === activeSection)
        .map(s => s.zone)
        .filter(Boolean)
    )];
    // Sort alphabetically A-H
    return zones.sort();
  }, [stalls, activeSection]);

  // Set default zone to "all" when section changes
  useEffect(() => {
    setActiveZone("all");
  }, [activeSection]);

  // Occupancy stats
  const totalStalls = stalls.length;
  const occupied = stalls.filter(s => s.status === "occupied").length;
  const occupancyPct = totalStalls > 0 ? Math.round((occupied / totalStalls) * 100) : 0;

  // Section stall counts
  const sectionCounts = useMemo(() => {
    return sectionKeys.reduce((acc, sec) => {
      acc[sec] = stalls.filter(s => s.section === sec).length;
      return acc;
    }, {});
  }, [stalls, sectionKeys]);

  // Filtered + sorted stalls for the active section + zone
  const displayStalls = useMemo(() => {
    if (!activeSection) return [];
    let list = stalls.filter(s => s.section === activeSection);
    if (activeZone && activeZone !== 'all') {
      list = list.filter(s => s.zone === activeZone);
    }
    if (filterStatus !== "all") {
      list = list.filter(s => s.status === filterStatus);
    }
    return sortStalls(list);
  }, [stalls, activeSection, activeZone, filterStatus]);

  // Group displayStalls by zone for visual column grouping
  const stallsByZone = useMemo(() => {
    const map = {};
    for (const stall of displayStalls) {
      const z = stall.zone ?? "?";
      if (!map[z]) map[z] = [];
      map[z].push(stall);
    }
    // Sort keys
    return Object.entries(map).sort(([a], [b]) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
  }, [displayStalls]);

  const filterOptions = ["all", "available", "occupied", "pending"];
  const getSectionMeta = (section) => SECTION_META[section] || { color: "#374151", bg: "#f3f4f6", border: "#d1d5db" };

  const handleNav = (item) => { setActiveNav(item.id); navigate(item.path); };
  const handleLogout = () => navigate('/login');

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
        <ContractorSidebar active="nav-stalls" />

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
                <span className="text-gray-700 font-semibold">Stalls</span>
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

          <main className="dashboard-main stalls-main">
            <div className="stalls-title-block">
              <h1 className="stalls-page-title">Market Floor Plan</h1>
              <p className="stalls-page-sub">Real-time stall availability and management.</p>
            </div>

            {loading && (
              <div className="stalls-state-msg">
                <div className="stalls-spinner" />
                <span>Loading stalls...</span>
              </div>
            )}
            {error && (
              <div className="stalls-error-msg">⚠️ Failed to load stalls: {error}</div>
            )}

            {!loading && !error && (
              <>
                {/* Occupancy Banner */}
                <div className="stalls-occupancy-banner">
                  <div className="occupancy-banner-inner">
                    <span className="occupancy-banner-label">Total Occupancy</span>
                    <span className="occupancy-banner-pct">{occupancyPct}%</span>
                  </div>
                  <div className="occupancy-bar-track">
                    <div className="occupancy-bar-fill" style={{ width: `${occupancyPct}%` }}></div>
                  </div>
                  <div className="occupancy-banner-counts">
                    <span>{occupied} Stalls Occupied</span>
                    <span>{totalStalls} Total Stalls</span>
                  </div>
                </div>

                {/* ── Section Tabs (Fishes / Meat / Vegetables) ── */}
                <div className="stalls-section-tabs-wrap">
                  <div className="stalls-section-tabs">
                    {sectionKeys.map(sec => {
                      const meta = getSectionMeta(sec);
                      return (
                        <button
                          key={sec}
                          className={`stalls-section-tab${activeSection === sec ? " stalls-tab-active" : ""}`}
                          style={activeSection === sec ? { background: meta.color, borderColor: meta.color } : {}}
                          onClick={() => { setActiveSection(sec); setFilterStatus("all"); }}
                        >
                          <span className="tab-section-dot" style={{ background: meta.color }} />
                          {sec}
                          <span className="tab-count">{sectionCounts[sec] ?? 0}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Zone Sub-Tabs (A–H) ── */}
                {zoneKeys.length > 1 && (
                  <div className="stalls-floor-tabs-wrap">
                    <div className="stalls-floor-tabs">
                      <button
                        className={`stalls-floor-tab${activeZone === "all" ? " floor-tab-active" : ""}`}
                        onClick={() => { setActiveZone("all"); setFilterStatus("all"); }}
                      >
                        <span className="floor-tab-icon">🌐</span>
                        All Zones
                        <span className="floor-tab-count">
                          {stalls.filter(s => s.section === activeSection).length}
                        </span>
                      </button>
                      {zoneKeys.map(zone => {
                        const zoneCount = stalls.filter(
                          s => s.section === activeSection && s.zone === zone
                        ).length;
                        return (
                          <button
                            key={zone}
                            className={`stalls-floor-tab${activeZone === zone ? " floor-tab-active" : ""}`}
                            onClick={() => { setActiveZone(zone); setFilterStatus("all"); }}
                          >
                            <span className="floor-tab-icon">📍</span>
                            Zone {zone}
                            <span className="floor-tab-count">{zoneCount}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Section + Zone Header + Filter ── */}
                <div className="stalls-section-header">
                  <div className="stalls-section-name-wrap">
                    {activeSection && (
                      <span
                        className="section-color-badge"
                        style={{
                          background: getSectionMeta(activeSection).bg,
                          color: getSectionMeta(activeSection).color,
                          borderColor: getSectionMeta(activeSection).border,
                        }}
                      >
                        {activeSection}
                      </span>
                    )}
                    {activeZone && activeZone !== "all" && (
                      <span className="floor-label-badge">
                        Zone {activeZone}
                      </span>
                    )}
                    <span className="stalls-section-sub">
                      {displayStalls.length} stall{displayStalls.length !== 1 ? 's' : ''}
                      {filterStatus !== 'all' ? ` · ${STATUS_LABEL[filterStatus]}` : ''}
                    </span>
                  </div>
                  <div className="stalls-filter-wrap">
                    <button className="stalls-filter-btn" onClick={() => setFilterOpen(o => !o)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                      Filter
                      {filterStatus !== 'all' && <span className="filter-active-dot" />}
                    </button>
                    {filterOpen && (
                      <div className="stalls-filter-dropdown">
                        {filterOptions.map(f => (
                          <button
                            key={f}
                            className={`stalls-filter-option${filterStatus === f ? " filter-selected" : ""}`}
                            onClick={() => { setFilterStatus(f); setFilterOpen(false); }}
                          >
                            {f === "all" ? "All Statuses" : STATUS_LABEL[f]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Stall Grid grouped by Zone ── */}
                {stallsByZone.length === 0 ? (
                  <p className="stalls-empty">No stalls match this filter.</p>
                ) : (
                  <div
                    className="stalls-columns-wrap"
                    style={{ "--col-count": stallsByZone.length }}
                  >
                    {stallsByZone.map(([zone, zoneStalls]) => (
                      <div key={zone} className="stalls-column-group">
                        <div className="stalls-col-header">Zone {zone}</div>
                        <div className={`stalls-col-cells ${stallsByZone.length === 1 ? 'grid-3-cols' : ''}`}>
                          {zoneStalls.map(stall => {
                            const key = stall._id || stall.stallNumber;
                            // Display full stallNumber as stored in DB
                            const label = stall.stallNumber || "?";
                            return (
                              <button
                                key={key}
                                className={`stall-cell stall-${stall.status}`}
                                onClick={() => setSelectedStall(stall)}
                                title={`Stall ${label} · ${stall.section} · Zone ${stall.zone} · ${STATUS_LABEL[stall.status]}`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Legend */}
                <div className="stalls-legend">
                  <div className="legend-item"><span className="legend-dot legend-available"></span><span>Available</span></div>
                  <div className="legend-item"><span className="legend-dot legend-occupied"></span><span>Occupied</span></div>
                  <div className="legend-item"><span className="legend-dot legend-pending"></span><span>Pending</span></div>
                </div>
              </>
            )}
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="bottom-nav" aria-label="Main Navigation">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'nav-active' : ''}`}
              onClick={() => handleNav(item)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Stall Detail Modal */}
        {selectedStall && (
          <div className="logout-overlay" onClick={() => setSelectedStall(null)}>
            <div className="stall-modal" onClick={e => e.stopPropagation()}>
              <div className={`stall-modal-badge stall-modal-${selectedStall.status}`}>
                {STATUS_LABEL[selectedStall.status]}
              </div>
              <h2 className="stall-modal-number">Stall #{selectedStall.stallNumber}</h2>
              <p className="stall-modal-section">
                {selectedStall.section}
              </p>

              <div className="stall-modal-meta-row">
                {selectedStall.zone && (
                  <span className="stall-modal-meta-chip">📍 Zone {selectedStall.zone}</span>
                )}
                {selectedStall.monthlyRate && (
                  <span className="stall-modal-meta-chip">💰 ₱{selectedStall.monthlyRate.toLocaleString()}/mo</span>
                )}
              </div>

              {selectedStall.amenities?.length > 0 && (
                <div className="stall-modal-amenities">
                  {selectedStall.amenities.map(a => (
                    <span key={a} className="amenity-chip">{a}</span>
                  ))}
                </div>
              )}

              {selectedStall.status === "occupied" && selectedStall.tenant && (
                <div className="stall-modal-info">
                  <div className="stall-modal-row"><span>Vendor</span><strong>{selectedStall.tenant.name}</strong></div>
                  <div className="stall-modal-row"><span>Contact</span><strong>{selectedStall.tenant.contact}</strong></div>
                  <div className="stall-modal-row"><span>Monthly Rent</span><strong>₱{selectedStall.monthlyRate?.toLocaleString()}</strong></div>
                  {selectedStall.tenant.leaseStart && (
                    <div className="stall-modal-row">
                      <span>Lease Start</span>
                      <strong>{new Date(selectedStall.tenant.leaseStart).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })}</strong>
                    </div>
                  )}
                </div>
              )}
              {selectedStall.status === "occupied" && !selectedStall.tenant && (
                <div className="stall-modal-info">
                  <div className="stall-modal-row"><span>Vendor</span><strong>Juan Dela Cruz</strong></div>
                  <div className="stall-modal-row"><span>Lease Since</span><strong>Jan 2023</strong></div>
                  <div className="stall-modal-row"><span>Monthly Rent</span><strong>₱{selectedStall.monthlyRate?.toLocaleString() || '3,500'}</strong></div>
                </div>
              )}
              {selectedStall.status === "pending" && (
                <div className="stall-modal-info">
                  <div className="stall-modal-row"><span>Status</span><strong>Awaiting Approval</strong></div>
                </div>
              )}
              {selectedStall.status === "available" && (
                <p className="stall-modal-avail">This stall is available for rent.</p>
              )}

              <button className="stall-modal-close" onClick={() => setSelectedStall(null)}>Close</button>
            </div>
          </div>
        )}

        <style>{`
        .stalls-main { padding-bottom: 80px; }
        .stalls-title-block { margin-bottom: 2px; }
        .stalls-page-title { font-size: 20px; font-weight: 800; color: var(--color-text); margin: 0 0 4px; letter-spacing: -0.3px; }
        .stalls-page-sub { font-size: 12px; color: var(--color-text-muted); margin: 0; font-weight: 500; }

        /* Loading / Error */
        .stalls-state-msg { display: flex; align-items: center; gap: 10px; padding: 24px 0; color: var(--color-text-muted); font-size: 14px; font-weight: 600; }
        .stalls-spinner { width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: var(--color-brand-green); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .stalls-error-msg { background: #fef2f2; color: #b91c1c; border: 1.5px solid #fca5a5; border-radius: 10px; padding: 14px 16px; font-size: 13px; font-weight: 600; }

        /* Occupancy Banner */
        .stalls-occupancy-banner { background: var(--color-surface); border-radius: var(--r-lg); padding: 16px 16px 12px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px; }
        .occupancy-banner-inner { display: flex; align-items: center; justify-content: space-between; }
        .occupancy-banner-label { font-size: 13px; font-weight: 700; color: var(--color-text); }
        .occupancy-banner-pct { font-size: 18px; font-weight: 900; color: var(--color-brand-green); }
        .occupancy-bar-track { height: 10px; background: #e5e7eb; border-radius: var(--r-full); overflow: hidden; }
        .occupancy-bar-fill { height: 100%; background: linear-gradient(90deg, var(--color-brand-green), #22c55e); border-radius: var(--r-full); transition: width 1s cubic-bezier(0.4,0,0.2,1); }
        .occupancy-banner-counts { display: flex; justify-content: space-between; font-size: 11px; color: var(--color-text-muted); font-weight: 600; }

        /* Section Tabs */
        .stalls-section-tabs-wrap { overflow-x: auto; scrollbar-width: none; flex-shrink: 0; }
        .stalls-section-tabs-wrap::-webkit-scrollbar { display: none; }
        .stalls-section-tabs { display: flex; gap: 8px; min-width: max-content; }
        .stalls-section-tab { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: var(--r-full); border: 1.5px solid var(--color-border); background: var(--color-surface); font-size: 12px; font-weight: 700; color: var(--color-text-muted); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; white-space: nowrap; }
        .stalls-section-tab:hover { border-color: currentColor; }
        .stalls-tab-active { color: #fff !important; }
        .tab-section-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .stalls-tab-active .tab-section-dot { background: rgba(255,255,255,0.8) !important; }
        .tab-count { background: rgba(0,0,0,0.12); color: inherit; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 99px; }
        .stalls-tab-active .tab-count { background: rgba(255,255,255,0.25); }

        /* Floor Sub-Tabs */
        .stalls-floor-tabs-wrap { overflow-x: auto; scrollbar-width: none; flex-shrink: 0; }
        .stalls-floor-tabs-wrap::-webkit-scrollbar { display: none; }
        .stalls-floor-tabs { display: flex; gap: 6px; min-width: max-content; }
        .stalls-floor-tab { display: flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: var(--r-sm); border: 1.5px solid var(--color-border); background: var(--color-surface); font-size: 11px; font-weight: 700; color: var(--color-text-muted); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; white-space: nowrap; }
        .stalls-floor-tab:hover { border-color: var(--color-brand-green); color: var(--color-text); }
        .floor-tab-active { background: #f0fdf4 !important; border-color: var(--color-brand-green) !important; color: var(--color-brand-green) !important; }
        .floor-tab-icon { font-size: 12px; }
        .floor-tab-count { background: #e5e7eb; color: #6b7280; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 99px; }
        .floor-tab-active .floor-tab-count { background: #bbf7d0; color: #15803d; }

        /* Section Header */
        .stalls-section-header { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; flex-wrap: wrap; gap: 6px; }
        .stalls-section-name-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .section-color-badge { font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: var(--r-full); border: 1.5px solid; }
        .floor-label-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: var(--r-full); background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
        .stalls-section-sub { font-size: 12px; color: var(--color-text-muted); font-weight: 500; }
        .stalls-filter-wrap { position: relative; }
        .stalls-filter-btn { display: flex; align-items: center; gap: 6px; background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: var(--r-sm); padding: 7px 12px; font-size: 12px; font-weight: 700; color: var(--color-text-mid); cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s; position: relative; }
        .stalls-filter-btn:hover { border-color: var(--color-brand-green); color: var(--color-brand-green); }
        .filter-active-dot { width: 7px; height: 7px; background: var(--color-brand-green); border-radius: 50%; position: absolute; top: 5px; right: 5px; }
        .stalls-filter-dropdown { position: absolute; right: 0; top: calc(100% + 6px); background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: var(--r-md); box-shadow: var(--shadow-md); z-index: 50; overflow: hidden; min-width: 150px; }
        .stalls-filter-option { display: block; width: 100%; padding: 10px 14px; background: none; border: none; border-bottom: 1px solid var(--color-border-soft); font-size: 13px; font-weight: 600; color: var(--color-text-mid); text-align: left; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.15s; }
        .stalls-filter-option:last-child { border-bottom: none; }
        .stalls-filter-option:hover { background: #f9fafb; }
        .filter-selected { color: var(--color-brand-green); background: var(--color-brand-green-light) !important; }

        /* Column-grouped stall layout — stretches full width */
        .stalls-columns-wrap { display: grid; grid-template-columns: repeat(var(--col-count, 6), 1fr); gap: 8px; width: 100%; }
        .stalls-column-group { display: flex; flex-direction: column; gap: 4px; width: 100%; }
        .stalls-col-header { text-align: center; font-size: 10px; font-weight: 800; color: var(--color-text-muted); background: #f3f4f6; border-radius: 6px; padding: 3px 0; letter-spacing: 0.5px; text-transform: uppercase; }
        .stalls-col-cells { display: flex; flex-direction: column; gap: 6px; }
        .stalls-col-cells.grid-3-cols {
          column-count: 3;
          column-gap: 8px;
          display: block;
        }
        .stalls-col-cells.grid-3-cols .stall-cell {
          break-inside: avoid;
          margin-bottom: 6px;
          display: flex;
          width: 100%;
        }

        /* Stall Cell — full width of its column, compact fixed height */
        .stall-cell { width: 100%; height: 44px; border-radius: 8px; border: 2px solid transparent; font-size: 11px; font-weight: 800; font-family: 'Inter', sans-serif; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 1.2; padding: 4px; word-break: break-all; }
        .stall-cell:hover { transform: scale(1.06); box-shadow: var(--shadow-md); z-index: 2; position: relative; }
        .stall-available { background: #dcfce7; border-color: #86efac; color: #15803d; }
        .stall-occupied { background: #fed7aa; border-color: #fdba74; color: #c2410c; }
        .stall-pending { background: #fef9c3; border-color: #fde047; color: #a16207; }
        .stalls-empty { text-align: center; color: var(--color-text-faint); font-size: 13px; padding: 40px 0; }

        /* Legend */
        .stalls-legend { display: flex; align-items: center; gap: 20px; justify-content: center; padding: 8px 0 4px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; color: var(--color-text-muted); }
        .legend-dot { width: 14px; height: 14px; border-radius: 4px; border: 2px solid transparent; flex-shrink: 0; }
        .legend-available { background: #dcfce7; border-color: #86efac; }
        .legend-occupied { background: #fed7aa; border-color: #fdba74; }
        .legend-pending { background: #fef9c3; border-color: #fde047; }

        /* Stall Modal */
        .stall-modal { background: var(--color-surface); border-radius: var(--r-xl); padding: 28px 24px 24px; max-width: 340px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px; box-shadow: var(--shadow-lg); animation: slide-up 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .stall-modal-badge { font-size: 10px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; padding: 5px 14px; border-radius: var(--r-full); }
        .stall-modal-available { background: #dcfce7; color: #15803d; }
        .stall-modal-occupied { background: #fed7aa; color: #c2410c; }
        .stall-modal-pending { background: #fef9c3; color: #a16207; }
        .stall-modal-number { font-size: 26px; font-weight: 900; color: var(--color-text); margin: 4px 0 0; }
        .stall-modal-section { font-size: 12px; color: var(--color-text-muted); margin: 0 0 4px; font-weight: 500; }
        .modal-floor-tag { font-weight: 600; color: var(--color-text-mid); }
        .stall-modal-meta-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
        .stall-modal-meta-chip { font-size: 11px; font-weight: 600; background: #f3f4f6; color: var(--color-text-mid); padding: 4px 10px; border-radius: 99px; }
        .stall-modal-amenities { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
        .amenity-chip { font-size: 11px; font-weight: 600; background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 99px; border: 1px solid #bfdbfe; }
        .stall-modal-info { width: 100%; background: #f9fafb; border-radius: var(--r-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
        .stall-modal-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--color-text-mid); }
        .stall-modal-row strong { color: var(--color-text); font-weight: 700; }
        .stall-modal-avail { font-size: 13px; color: var(--color-text-muted); text-align: center; margin: 0 0 8px; }
        .stall-modal-close { width: 100%; padding: 12px; background: var(--color-brand-green); color: #fff; border: none; border-radius: var(--r-md); font-size: 14px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; margin-top: 4px; transition: background 0.2s; }
        .stall-modal-close:hover { background: var(--color-green-mid); }

        @media (min-width: 640px) {
          .stalls-page-title { font-size: 24px; }
          .stall-cell { font-size: 12px; }
          .occupancy-banner-pct { font-size: 22px; }
        }
        @media (min-width: 1024px) {
          .stalls-main { padding-bottom: 32px; }
          .stall-cell { font-size: 13px; border-radius: 10px; }
          .stalls-columns-wrap { gap: 12px; }
        }
      `}</style>
      </div>
    </ContractorLockScreen>
  );
}