import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Store } from 'lucide-react';
import { useCurrentUser, getUser } from '../../utils/auth';
import ContractorLockScreen from './ContractorLockScreen';
import NotificationBell from '../../components/NotificationBell';
import ContractsView from '../../components/ContractsView';

const LogoutIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function ContractorContracts() {
  const navigate = useNavigate();
  const { userName, loading: authLoading } = useCurrentUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = getUser();
  const userEmail = user?.email || '';

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/contractor/records?email=${encodeURIComponent(userEmail)}`)
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => { setRecords(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [userEmail]);

  return (
    <ContractorLockScreen>
      <div className="flex h-screen bg-[#f5f5f0] font-sans overflow-hidden w-full">
        {showLogoutModal && (
          <div className="logout-overlay" onClick={() => setShowLogoutModal(false)}>
            <div className="logout-modal" onClick={e => e.stopPropagation()}>
              <div className="logout-modal-icon"><LogoutIcon /></div>
              <h3 className="logout-modal-title">Log Out?</h3>
              <p className="logout-modal-msg">You'll be signed out of your contractor session.</p>
              <div className="logout-modal-actions">
                <button className="logout-cancel-btn" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                <button className="logout-confirm-btn" onClick={() => navigate('/login')}>Yes, Log Out</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
                <span className="text-gray-700 font-semibold">Contracts</span>
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

          <main className="dashboard-main">
            <ContractsView
              records={records}
              loading={loading}
              error={error}
              onOpenRecords={() => navigate('/contractor/records')}
            />
          </main>
        </div>
      </div>
    </ContractorLockScreen>
  );
}
