import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Store, X, Plus } from "lucide-react";
import { useCurrentUser } from '../../utils/auth';

import NotificationBell from '../../components/NotificationBell';



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
  upper: { label: "Upper Floor", icon: "⬆" },
  lower: { label: "Lower Floor", icon: "⬇" },
};

const STATUS_LABEL = { available: "Available", occupied: "Occupied", pending: "Pending" };

// Map the DB section names to the front-end category used by the AR views.
const SECTION_TO_CATEGORY = { Meat: "meat", Fishes: "fish", Vegetables: "veggies" };
const sectionToCategory = (section) => SECTION_TO_CATEGORY[section] || String(section || "").toLowerCase();



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

export default function AdminStalls() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStall, setSelectedStall] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newStallData, setNewStallData] = useState({
    stallNumber: '',
    section: 'Fishes',
    zone: 'A',
    monthlyRate: '',
    size: 12,
    isActive: true
  });
  const [formError, setFormError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);



  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userName, loading: authLoading } = useCurrentUser();

  // Active section tab (Fishes / Meat / Vegetables)
  const [activeSection, setActiveSection] = useState(null);
  // Active zone tab (A-H or 'all')
  const [activeZone, setActiveZone] = useState('all');

  useEffect(() => {
    fetch('/api/admin/stalls')
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
  }, []);

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
  const handleLogout = () => navigate('/login');

  const handleAddStallSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    fetch('/api/admin/stalls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStallData)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        return data;
      })
      .then(data => {
        setStalls(prev => sortStalls([...prev, data.stall]));
        setShowAddModal(false);
        setNewStallData({
          stallNumber: '',
          section: 'Fishes',
          zone: 'A',
          monthlyRate: '',
          size: 12,
          isActive: true
        });
      })
      .catch(err => {
        setFormError(err.message);
      })
      .finally(() => {
        setFormSubmitting(false);
      });
  };

  const handleToggleListingStatus = (stall) => {
    const nextActive = stall.listing?.isActive === false ? true : false;
    setTogglingStatus(true);

    fetch(`/api/admin/stalls/${stall._id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: nextActive })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
      })
      .then(data => {
        setStalls(prev => prev.map(s => s._id === stall._id ? data.stall : s));
        setSelectedStall(data.stall);
      })
      .catch(err => {
        alert(`Failed to update stall listing status: ${err.message}`);
      })
      .finally(() => {
        setTogglingStatus(false);
      });
  };

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

      {/* Add Stall Modal */}
      {showAddModal && (
        <div className="logout-overlay" onClick={() => setShowAddModal(false)}>
          <div className="logout-modal form-modal" onClick={e => e.stopPropagation()}>
            <div className="form-modal-header">
              <h3 className="logout-modal-title" style={{ margin: 0 }}>Add New Stall</h3>
              <button className="form-modal-close-icon" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddStallSubmit} className="stall-form">
              {formError && (
                <div className="form-error-msg">{formError}</div>
              )}
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="stallNumber">Stall Number</label>
                  <input
                    type="text"
                    id="stallNumber"
                    required
                    value={newStallData.stallNumber}
                    onChange={e => setNewStallData(prev => ({ ...prev, stallNumber: e.target.value }))}
                    placeholder="e.g. 51"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="size">Size (sqm)</label>
                  <input
                    type="number"
                    id="size"
                    required
                    value={newStallData.size}
                    onChange={e => setNewStallData(prev => ({ ...prev, size: Number(e.target.value) }))}
                    placeholder="12"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="section">Section</label>
                  <select
                    id="section"
                    value={newStallData.section}
                    onChange={e => setNewStallData(prev => ({ ...prev, section: e.target.value }))}
                  >
                    <option value="Fishes">Fishes</option>
                    <option value="Meat">Meat</option>
                    <option value="Vegetables">Vegetables</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="zone">Zone</label>
                  <select
                    id="zone"
                    value={newStallData.zone}
                    onChange={e => setNewStallData(prev => ({ ...prev, zone: e.target.value }))}
                  >
                    <option value="A">Zone A</option>
                    <option value="B">Zone B</option>
                    <option value="C">Zone C</option>
                    <option value="D">Zone D</option>
                    <option value="E">Zone E</option>
                    <option value="F">Zone F</option>
                    <option value="G">Zone G</option>
                    <option value="H">Zone H</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="monthlyRate">Monthly Rate (₱)</label>
                <input
                  type="number"
                  id="monthlyRate"
                  required
                  value={newStallData.monthlyRate}
                  onChange={e => setNewStallData(prev => ({ ...prev, monthlyRate: Number(e.target.value) }))}
                  placeholder="e.g. 3500"
                  min="0"
                />
              </div>

              <div className="form-group toggle-group">
                <div className="toggle-label">
                  <span>List for rent immediately</span>
                  <div className="status-toggle-wrap">
                    <button
                      type="button"
                      className={`custom-toggle-btn ${newStallData.isActive ? 'active' : 'inactive'}`}
                      onClick={() => setNewStallData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    >
                      {newStallData.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="form-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-submit-btn"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Creating...' : 'Create Stall'}
                </button>
              </div>
            </form>
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
              <span>Admin</span>
              <ChevronRight size={14} />
              <span className="text-gray-700 font-semibold">Stalls</span>
            </div>
          </div>
          <div className="header-right">
            <div className="header-welcome">
              <span className="welcome-name">{authLoading ? 'Loading…' : userName ? `${userName}` : 'Welcome, Guest'}</span>
              <span className="welcome-role">Market Supervisor</span>
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
            <div className="stalls-error-msg"> Failed to load stalls: {error}</div>
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
                      <span className="floor-tab-icon"></span>
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
                          <span className="floor-tab-icon"></span>
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
                <div className="stalls-actions-wrap">
                  <button
                    className="add-stall-btn"
                    onClick={() => {
                      setFormError(null);
                      setShowAddModal(true);
                    }}
                  >
                    <Plus size={14} /> Add Stall
                  </button>

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
                          const isInactive = stall.listing?.isActive === false;
                          return (
                            <button
                              key={key}
                              className={`stall-cell stall-${stall.status} ${isInactive ? 'stall-cell-inactive' : ''}`}
                              onClick={() => setSelectedStall(stall)}
                              title={`Stall ${label} · ${stall.section} · Zone ${stall.zone} · ${STATUS_LABEL[stall.status]}${isInactive ? ' (Disabled)' : ''}`}
                            >
                              {label}
                              {isInactive && (
                                <span className="inactive-dot-indicator" title="Listing is Disabled" />
                              )}
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
                <span className="stall-modal-meta-chip"> Zone {selectedStall.zone}</span>
              )}
              {selectedStall.monthlyRate && (
                <span className="stall-modal-meta-chip"> ₱{selectedStall.monthlyRate.toLocaleString()}/mo</span>
              )}
              <span className={`stall-modal-meta-chip listing-status-badge ${selectedStall.listing?.isActive !== false ? 'listing-enabled' : 'listing-disabled'}`}>
                Listing: {selectedStall.listing?.isActive !== false ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {selectedStall.amenities?.length > 0 && (
              <div className="stall-modal-amenities">
                {selectedStall.amenities.map(a => (
                  <span key={a} className="amenity-chip">{a}</span>
                ))}
              </div>
            )}

            {/* Contractor Info Row */}
            <div className="stall-modal-info" style={{ marginBottom: '4px', marginTop: '4px' }}>
              <div className="stall-modal-row">
                <span>Contractor Manager</span>
                <strong>{selectedStall.contractorName || selectedStall.managedBy || 'None'}</strong>
              </div>
              {selectedStall.managedBy && (
                <div className="stall-modal-row">
                  <span>Contractor Contact</span>
                  <strong>{selectedStall.contractorContact || 'N/A'}</strong>
                </div>
              )}
            </div>

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
                <div className="stall-modal-row"><span>Vendor</span></div>
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

            <div style={{ width: '100%', marginTop: '8px' }}>
              <button
                className={`stall-listing-toggle-btn ${selectedStall.listing?.isActive !== false ? 'btn-disable' : 'btn-enable'}`}
                onClick={() => handleToggleListingStatus(selectedStall)}
                disabled={togglingStatus}
              >
                {togglingStatus ? 'Updating...' : selectedStall.listing?.isActive !== false ? 'Disable Listing' : 'Enable Listing'}
              </button>
            </div>

            <button className="stall-modal-close" onClick={() => setSelectedStall(null)}>Close</button>
          </div>
        </div>
      )}



      <style>{`
        .stalls-main { padding-bottom: 80px; }

        .stalls-actions-wrap { display: flex; align-items: center; gap: 8px; }
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

        /* Stall list style updates */
        .add-stall-btn { display: flex; align-items: center; gap: 6px; background: var(--color-brand-green); border: none; border-radius: var(--r-sm); padding: 7px 12px; font-size: 12px; font-weight: 700; color: #fff; cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.2s; white-space: nowrap; }
        .add-stall-btn:hover { background: var(--color-green-mid); }
        .stall-cell-inactive { opacity: 0.6; border: 2px dashed #9ca3af !important; background: #f3f4f6 !important; color: #4b5563 !important; position: relative; }
        .inactive-dot-indicator { position: absolute; top: 3px; right: 3px; width: 6px; height: 6px; background: #ef4444; border-radius: 50%; }

        /* Listing status chips */
        .listing-status-badge { font-weight: 700; text-transform: uppercase; font-size: 10px; }
        .listing-enabled { background: #dcfce7 !important; color: #15803d !important; border: 1px solid #bbf7d0 !important; }
        .listing-disabled { background: #fee2e2 !important; color: #b91c1c !important; border: 1px solid #fca5a5 !important; }

        /* Listing status toggle button */
        .stall-listing-toggle-btn { width: 100%; padding: 10px; border-radius: var(--r-md); font-size: 13px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; border: 1.5px solid; transition: all 0.2s; }
        .stall-listing-toggle-btn.btn-disable { background: #fff; border-color: #ef4444; color: #ef4444; }
        .stall-listing-toggle-btn.btn-disable:hover { background: #fef2f2; }
        .stall-listing-toggle-btn.btn-enable { background: #fff; border-color: var(--color-brand-green); color: var(--color-brand-green); }
        .stall-listing-toggle-btn.btn-enable:hover { background: #f0fdf4; }
        .stall-listing-toggle-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Add Stall Form Modal */
        .form-modal { max-width: 420px; align-items: stretch; gap: 16px; padding: 24px; }
        .form-modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border-soft); padding-bottom: 12px; }
        .form-modal-close-icon { background: none; border: none; color: var(--color-text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 50%; transition: background 0.2s; }
        .form-modal-close-icon:hover { background: #f3f4f6; color: var(--color-text); }
        .stall-form { display: flex; flex-direction: column; gap: 14px; margin-top: 8px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group input, .form-group select { width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 8px; border: 1.5px solid var(--color-border); font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; background: var(--color-surface); color: var(--color-text); }
        .form-group input:focus, .form-group select:focus { border-color: var(--color-brand-green); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .toggle-group { flex-direction: row; align-items: center; justify-content: space-between; padding: 8px 12px; background: #f9fafb; border-radius: 8px; border: 1px solid var(--color-border-soft); }
        .toggle-label { display: flex; align-items: center; justify-content: space-between; width: 100%; cursor: pointer; }
        .toggle-label span { font-size: 12px; font-weight: 700; color: var(--color-text-mid); }
        .status-toggle-wrap { display: flex; align-items: center; }
        .custom-toggle-btn { padding: 6px 14px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; cursor: pointer; transition: all 0.2s; border: 1.5px solid transparent; }
        .custom-toggle-btn.active { background: #dcfce7; border-color: #86efac; color: #15803d; }
        .custom-toggle-btn.inactive { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }
        .form-actions { display: flex; gap: 10px; margin-top: 10px; }
        .form-cancel-btn { flex: 1; padding: 10px; background: #f3f4f6; color: var(--color-text-mid); border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
        .form-cancel-btn:hover { background: #e5e7eb; }
        .form-submit-btn { flex: 1; padding: 10px; background: var(--color-brand-green); color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
        .form-submit-btn:hover { background: var(--color-green-mid); }
        .form-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .form-error-msg { background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 8px; padding: 8px 12px; font-size: 12px; font-weight: 600; text-align: center; }

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
  );
}