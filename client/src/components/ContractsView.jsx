/**
 * ContractsView — shared, mobile-first central view of all lease contracts.
 * Used by both the Admin and Contractor "Contracts" pages. Reads the existing
 * records data (tenant + stall + lease dates) and surfaces each contract's
 * deadline status. Lease dates themselves are edited from the Records module.
 */
import { useMemo, useState } from 'react';
import { Search, Calendar, ArrowRight } from 'lucide-react';

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Days remaining until the lease deadline drives the contract's status.
function getContractInfo(rec) {
  const end = rec.leaseEnd ? new Date(rec.leaseEnd) : null;
  if (!end || isNaN(end.getTime())) return { kind: 'none', daysLeft: null };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((end - today) / 86400000);
  if (daysLeft < 0) return { kind: 'expired', daysLeft };
  if (daysLeft <= 30) return { kind: 'expiring', daysLeft };
  return { kind: 'active', daysLeft };
}

function deadlineLabel(info) {
  if (info.kind === 'none') return 'No expiry set';
  if (info.kind === 'expired') return `Expired ${Math.abs(info.daysLeft)} day${Math.abs(info.daysLeft) === 1 ? '' : 's'} ago`;
  return `${info.daysLeft} day${info.daysLeft === 1 ? '' : 's'} left`;
}

const KIND_BADGE = {
  active: { label: 'Active', cls: 'ct-badge-active' },
  expiring: { label: 'Expiring Soon', cls: 'ct-badge-expiring' },
  expired: { label: 'Expired', cls: 'ct-badge-expired' },
  none: { label: 'No Expiry', cls: 'ct-badge-none' },
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'expiring', label: 'Expiring' },
  { id: 'expired', label: 'Expired' },
  { id: 'none', label: 'No Expiry' },
];

const initialsOf = (rec) => {
  if (rec.initials) return rec.initials;
  return (rec.name || '?').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
};

export default function ContractsView({ records = [], loading, error, onOpenRecords }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const enriched = useMemo(
    () => records.map(r => ({ ...r, contract: getContractInfo(r) })),
    [records]
  );

  const counts = useMemo(() => {
    const c = { total: enriched.length, active: 0, expiring: 0, expired: 0, none: 0 };
    enriched.forEach(r => { c[r.contract.kind] += 1; });
    return c;
  }, [enriched]);

  const filtered = useMemo(() => {
    let list = filter === 'all' ? enriched : enriched.filter(r => r.contract.kind === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.stall || '').toLowerCase().includes(q) ||
        (r.section || '').toLowerCase().includes(q)
      );
    }
    const order = { expired: 0, expiring: 1, active: 2, none: 3 };
    return [...list].sort((a, b) => {
      const oa = order[a.contract.kind], ob = order[b.contract.kind];
      if (oa !== ob) return oa - ob;
      if (a.contract.daysLeft == null || b.contract.daysLeft == null) return 0;
      return a.contract.daysLeft - b.contract.daysLeft;
    });
  }, [enriched, filter, query]);

  const STATS = [
    { id: 'all', label: 'Total', value: counts.total, accent: 'var(--color-brand-green)' },
    { id: 'expiring', label: 'Expiring Soon', value: counts.expiring, accent: '#d97706' },
    { id: 'expired', label: 'Expired', value: counts.expired, accent: '#dc2626' },
    { id: 'none', label: 'No Expiry', value: counts.none, accent: '#6b7280' },
  ];

  return (
    <div className="ct-wrap">
      <div className="ct-title-block">
        <h1 className="ct-page-title">Contracts</h1>
        <p className="ct-page-sub">Lease contracts and their deadlines, at a glance.</p>
      </div>

      {loading && (
        <div className="ct-state"><div className="ct-spinner" /><span>Loading contracts…</span></div>
      )}
      {error && !loading && (
        <div className="ct-error">Couldn't load contracts: {error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Summary stats — tap a card to filter */}
          <div className="ct-stats-grid">
            {STATS.map(s => (
              <button
                key={s.id}
                className={`ct-stat-card${filter === s.id ? ' ct-stat-active' : ''}`}
                style={{ '--accent': s.accent }}
                onClick={() => setFilter(f => (f === s.id ? 'all' : s.id))}
              >
                <span className="ct-stat-value">{s.value}</span>
                <span className="ct-stat-label">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Search + filter chips */}
          <div className="ct-controls">
            <div className="ct-search">
              <Search size={15} className="ct-search-icon" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search tenant, stall, or section…"
              />
            </div>
            <div className="ct-chips">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  className={`ct-chip${filter === f.id ? ' ct-chip-active' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contract list */}
          {filtered.length === 0 ? (
            <div className="ct-empty">
              <Calendar size={32} strokeWidth={1.5} />
              <p>No contracts match this view.</p>
              {onOpenRecords && (
                <button className="ct-empty-link" onClick={onOpenRecords}>
                  Go to Records <ArrowRight size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="ct-list">
              {filtered.map(rec => {
                const badge = KIND_BADGE[rec.contract.kind];
                return (
                  <div key={rec.id} className="ct-card">
                    <div className="ct-card-top">
                      <div className="ct-tenant">
                        <div className="ct-avatar">{initialsOf(rec)}</div>
                        <div className="ct-tenant-text">
                          <span className="ct-tenant-name">{rec.name || 'Unnamed tenant'}</span>
                          <span className="ct-tenant-meta">{rec.stall}{rec.section ? ` · ${rec.section}` : ''}</span>
                        </div>
                      </div>
                      <span className={`ct-badge ${badge.cls}`}>{badge.label}</span>
                    </div>

                    <div className="ct-card-dates">
                      <div className="ct-date-col">
                        <span className="ct-date-cap">Lease Start</span>
                        <span className="ct-date-val">{fmtDate(rec.leaseStart)}</span>
                      </div>
                      <ArrowRight size={14} className="ct-date-arrow" />
                      <div className="ct-date-col">
                        <span className="ct-date-cap">Deadline</span>
                        <span className="ct-date-val">{rec.leaseEnd ? fmtDate(rec.leaseEnd) : 'No expiry'}</span>
                      </div>
                      <div className="ct-date-col ct-date-right">
                        <span className="ct-date-cap">Monthly</span>
                        <span className="ct-date-val ct-amount">{rec.amountDue || '—'}</span>
                      </div>
                    </div>

                    <div className={`ct-deadline ct-deadline-${rec.contract.kind}`}>
                      {deadlineLabel(rec.contract)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <style>{`
        .ct-wrap { display: flex; flex-direction: column; gap: 14px; }
        .ct-title-block { margin-bottom: 2px; }
        .ct-page-title { font-size: 20px; font-weight: 800; color: var(--color-text); margin: 0 0 4px; letter-spacing: -0.3px; }
        .ct-page-sub { font-size: 12px; color: var(--color-text-muted); margin: 0; font-weight: 500; }

        .ct-state { display: flex; align-items: center; gap: 10px; padding: 28px 0; color: var(--color-text-muted); font-size: 14px; font-weight: 600; }
        .ct-spinner { width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: var(--color-brand-green); border-radius: 50%; animation: ct-spin .7s linear infinite; }
        @keyframes ct-spin { to { transform: rotate(360deg); } }
        .ct-error { background: #fef2f2; color: #b91c1c; border: 1.5px solid #fca5a5; border-radius: 10px; padding: 14px 16px; font-size: 13px; font-weight: 600; }

        /* Stats — 2 cols on mobile, 4 on wider screens */
        .ct-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .ct-stat-card { display: flex; flex-direction: column; gap: 2px; text-align: left; background: var(--color-surface); border: 1.5px solid var(--color-border); border-left: 4px solid var(--accent); border-radius: var(--r-md); padding: 12px 14px; cursor: pointer; box-shadow: var(--shadow-xs); transition: transform .15s, box-shadow .15s, border-color .15s; font-family: inherit; }
        .ct-stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .ct-stat-active { border-color: var(--accent); box-shadow: var(--shadow-md); }
        .ct-stat-value { font-size: 26px; font-weight: 800; color: var(--color-text); line-height: 1; }
        .ct-stat-label { font-size: 10px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: var(--color-text-muted); }

        .ct-controls { display: flex; flex-direction: column; gap: 10px; }
        .ct-search { position: relative; display: flex; align-items: center; }
        .ct-search-icon { position: absolute; left: 12px; color: var(--color-text-faint); pointer-events: none; }
        .ct-search input { width: 100%; padding: 11px 14px 11px 36px; border: 1.5px solid var(--color-border); border-radius: var(--r-md); font-size: 14px; font-family: inherit; background: var(--color-surface); color: var(--color-text); outline: none; transition: border-color .15s, box-shadow .15s; }
        .ct-search input:focus { border-color: var(--color-brand-green); }
        .ct-chips { display: flex; gap: 7px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .ct-chips::-webkit-scrollbar { display: none; }
        .ct-chip { flex-shrink: 0; padding: 8px 14px; border-radius: var(--r-full); border: 1.5px solid var(--color-border); background: var(--color-surface); font-size: 12px; font-weight: 700; color: var(--color-text-muted); cursor: pointer; font-family: inherit; transition: all .15s; white-space: nowrap; }
        .ct-chip:hover { border-color: var(--color-brand-green); color: var(--color-brand-green); }
        .ct-chip-active { background: var(--color-brand-green); border-color: var(--color-brand-green); color: #fff; }

        .ct-list { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .ct-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--r-lg); padding: 14px; box-shadow: var(--shadow-xs); display: flex; flex-direction: column; gap: 12px; }
        .ct-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .ct-tenant { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .ct-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--color-brand-green-light); color: var(--color-brand-green); font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ct-tenant-text { display: flex; flex-direction: column; min-width: 0; }
        .ct-tenant-name { font-size: 14px; font-weight: 700; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ct-tenant-meta { font-size: 11px; font-weight: 600; color: var(--color-text-muted); }
        .ct-badge { flex-shrink: 0; font-size: 10px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; padding: 5px 10px; border-radius: var(--r-full); }
        .ct-badge-active { background: #dcfce7; color: #15803d; }
        .ct-badge-expiring { background: #fef3c7; color: #b45309; }
        .ct-badge-expired { background: #fee2e2; color: #b91c1c; }
        .ct-badge-none { background: #f3f4f6; color: #4b5563; }

        .ct-card-dates { display: flex; align-items: center; gap: 10px; background: #f9fafb; border: 1px solid var(--color-border-soft); border-radius: var(--r-md); padding: 10px 12px; flex-wrap: wrap; }
        .ct-date-col { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .ct-date-right { margin-left: auto; text-align: right; }
        .ct-date-cap { font-size: 9px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: var(--color-text-faint); }
        .ct-date-val { font-size: 13px; font-weight: 700; color: var(--color-text); }
        .ct-amount { color: var(--color-brand-green); }
        .ct-date-arrow { color: var(--color-text-faint); flex-shrink: 0; }

        .ct-deadline { font-size: 12px; font-weight: 700; padding: 8px 12px; border-radius: var(--r-sm); text-align: center; }
        .ct-deadline-active { background: #f0fdf4; color: #15803d; }
        .ct-deadline-expiring { background: #fffbeb; color: #b45309; }
        .ct-deadline-expired { background: #fef2f2; color: #b91c1c; }
        .ct-deadline-none { background: #f9fafb; color: #6b7280; }

        .ct-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 44px 0; color: var(--color-text-faint); font-size: 13px; font-weight: 500; }
        .ct-empty-link { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: var(--color-brand-green); font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }

        @media (min-width: 640px) {
          .ct-stats-grid { grid-template-columns: repeat(4, 1fr); }
          .ct-controls { flex-direction: row; align-items: center; }
          .ct-search { flex: 1; }
          .ct-page-title { font-size: 24px; }
        }
        @media (min-width: 1024px) {
          .ct-list { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
      `}</style>
    </div>
  );
}
