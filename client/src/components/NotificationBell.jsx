import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
// import { Bell, X } from 'lucide-react';
import { Bell, X } from 'lucide-react';
import { getToken } from '../utils/auth';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const containerRef = useRef(null);
  const token = getToken();

  const fetchNotifications = async () => {
    if (!token) return;
    fetch('/api/contractor/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setNotifications(data); })
      .catch(err => console.error('Failed to fetch notifications:', err));

    try {
      const res = await fetch('/api/contractor/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        console.error('Failed to fetch notifications', res.status);
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications', err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/contractor/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  const markSingleAsRead = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/contractor/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleNotifClick = async (n) => {
    setOpen(false);
    setSelectedNotif(n);
    if (!n.read) await markSingleAsRead(n._id);
  };

  const closeModal = () => setSelectedNotif(null);

  const handleModalNavigate = () => {
    closeModal();
    // Always navigate to records, regardless of the link in notification
    navigate('/contractor/records');
  };

  return (
    <>
      <div className="relative inline-block" ref={containerRef}>
        <button
          className="notif-btn"
          onClick={() => setOpen(!open)}
          aria-label="Notifications"
          style={{ position: 'relative' }}
        >
          <Bell size={22} />
          {unreadCount > 0 && <span className="notif-dot" />}
        </button>

        {open && (
          <div
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden font-sans"
            style={{ transformOrigin: 'top right' }}
          >
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-[#1a5c2a] hover:text-[#154d23] transition-all cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-gray-400">
                  🔔 No notifications yet
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n._id}
                    onClick={() => handleNotifClick(n)}
                    className={`px-4 py-3 text-left transition-all cursor-pointer ${n.read ? 'bg-white hover:bg-gray-50' : 'bg-green-50/30 hover:bg-green-50/55'
                      }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className={`text-xs font-bold ${n.read ? 'text-gray-700' : 'text-[#1a5c2a]'}`}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 bg-[#1a5c2a] rounded-full mt-1 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10.5px] text-gray-500 leading-normal mb-1">{n.message}</p>
                    <span className="text-[9px] text-gray-400 font-medium">
                      {new Date(n.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Notification Detail Modal via Portal ── */}
      {selectedNotif && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-[20px] w-full max-w-[340px] overflow-hidden border border-gray-100"
            style={{ animation: 'modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-[18px] pt-4 pb-[14px] border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#edf5ed] flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-[#1a5c2a]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 leading-tight m-0">
                    {selectedNotif.title}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 m-0">
                    {new Date(selectedNotif.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 hover:bg-gray-200 transition-colors"
              >
                <X size={13} className="text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-[18px] py-4">
              <p className="text-[13px] text-gray-700 leading-relaxed m-0">
                {selectedNotif.message}
              </p>
            </div>

            {/* Footer */}
            <div className="px-[18px] pb-[18px]">
              <button
                onClick={closeModal}
                className="w-full py-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[12px] font-semibold rounded-[10px] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          <style>{`
            @keyframes modalIn {
              from { opacity: 0; transform: scale(0.94) translateY(12px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>,
        document.body
      )}
    </>
  );
}