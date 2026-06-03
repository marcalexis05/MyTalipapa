import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Store, MessageSquare, Trash2, Mail, Phone, Calendar, CheckCircle, Eye } from 'lucide-react';
import { useCurrentUser } from '../../utils/auth';

import NotificationBell from '../../components/NotificationBell';



const LogoutIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const TABS = ["All", "Unread", "Read"];

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("All");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();
  const { userName, loading: authLoading } = useCurrentUser();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contact-messages');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    setUpdatingId(id);
    const newStatus = currentStatus === 'read' ? 'unread' : 'read';
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m._id === id ? { ...m, status: newStatus } : m));
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAsRead = async (msg) => {
    if (msg.status === 'unread') {
      await handleToggleStatus(msg._id, 'unread');
    }
  };

  const handleDeleteMessage = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m._id !== id));
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'R';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const filteredMessages = messages.filter(m => {
    if (tab === "Unread") return m.status === "unread";
    if (tab === "Read") return m.status === "read";
    return true;
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;
  const readCount = messages.filter(m => m.status === 'read').length;
  const tabCounts = { All: messages.length, Unread: unreadCount, Read: readCount };

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
              <button className="logout-confirm-btn" onClick={() => navigate('/login')}>Yes, Log Out</button>
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
              <span>Admin</span>
              <ChevronRight size={14} />
              <span className="text-gray-700 font-semibold">Messages</span>
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
            <button
              className="header-logout-btn"
              aria-label="Log out"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogoutIcon />
            </button>
          </div>
        </header>

        <main className="dashboard-main messages-main flex flex-col flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="apps-title-block mb-4">
            <h1 className="apps-page-title">Renter Reports &amp; Messages</h1>
            <p className="apps-page-sub">View and respond to inquiries or complaints sent by the renters.</p>
          </div>

          {/* Tab Bar */}
          <div className="apps-tab-bar mb-4 max-w-md">
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

          {/* Messages list container */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="no-applications py-12">
                <div className="stalls-spinner" style={{ width: 32, height: 32 }} />
                <span className="mt-2 text-sm text-gray-500 font-semibold">Loading messages…</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="no-applications py-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                <MessageSquare size={44} className="text-gray-300 mb-3" />
                <p className="font-extrabold text-gray-800 text-base">No Messages Found</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
                  There are no {tab.toLowerCase() !== 'all' ? tab.toLowerCase() : ''} renter report messages to show.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredMessages.map(msg => (
                  <div
                    key={msg._id}
                    onClick={() => { setSelectedMessage(msg); handleMarkAsRead(msg); }}
                    className={`bg-white rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md hover:border-[#1a5c2a]/30 ${
                      msg.status === 'unread' ? 'border-[#1a5c2a]/20 shadow-sm relative overflow-hidden' : 'border-gray-150'
                    }`}
                  >
                    {/* Unread Indicator Bar */}
                    {msg.status === 'unread' && (
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#1a5c2a]" />
                    )}

                    <div className="flex items-start gap-3.5 min-w-0 pl-1">
                      <div className="w-10 h-10 rounded-full bg-[#f0f7f0] text-[#1a5c2a] flex items-center justify-center font-black text-sm shrink-0">
                        {getInitials(msg.renterName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${msg.status === 'unread' ? 'font-black text-gray-900' : 'font-semibold text-gray-700'}`}>
                            {msg.renterName || 'Unknown Renter'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">•</span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className={`text-xs mt-1 ${msg.status === 'unread' ? 'font-extrabold text-gray-800' : 'font-medium text-gray-500'}`}>
                          Subject: {msg.subject}
                        </h4>
                        <p className="text-xs text-gray-450 mt-1.5 truncate max-w-xl">
                          {msg.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        title={msg.status === 'read' ? 'Mark as Unread' : 'Mark as Read'}
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(msg._id, msg.status); }}
                        disabled={updatingId === msg._id}
                        className={`p-2 rounded-xl border transition-all ${
                          msg.status === 'read'
                            ? 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                            : 'bg-[#edf5ed] border-transparent text-[#1a5c2a] hover:bg-[#e2efe2]'
                        }`}
                      >
                        <CheckCircle size={15} />
                      </button>
                      <button
                        title="Delete Message"
                        onClick={(e) => handleDeleteMessage(msg._id, e)}
                        className="p-2 rounded-xl border border-gray-100 text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Bottom Nav for Mobile ── */}

      {/* Message Details Modal */}
      {selectedMessage && (
        <div className="logout-overlay" onClick={() => setSelectedMessage(null)}>
          <div className="app-detail-modal text-left max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="app-detail-header border-b border-gray-100 pb-4 mb-4">
              <div className="app-avatar app-detail-avatar w-12 h-12 bg-[#edf5ed] text-[#1a5c2a] rounded-full flex items-center justify-center font-extrabold text-base">
                {getInitials(selectedMessage.renterName)}
              </div>
              <div className="text-left min-w-0">
                <h2 className="app-detail-name text-base font-extrabold text-gray-900 truncate">
                  {selectedMessage.renterName}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  <span>Renter Feedback</span>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] ${selectedMessage.status === 'unread' ? 'bg-[#edf5ed] text-[#1a5c2a]' : 'bg-gray-100 text-gray-500'}`}>
                    {selectedMessage.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Sender info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-[#f9fafb] p-3 rounded-xl flex items-center gap-2">
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider">Email</span>
                    <a href={`mailto:${selectedMessage.renterEmail}`} className="text-xs font-semibold text-[#1a5c2a] hover:underline block truncate">
                      {selectedMessage.renterEmail || 'N/A'}
                    </a>
                  </div>
                </div>
                <div className="bg-[#f9fafb] p-3 rounded-xl flex items-center gap-2">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider">Contact</span>
                    <span className="text-xs font-semibold text-gray-700 block">
                      {selectedMessage.renterContact || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="bg-[#f9fafb] p-3 rounded-xl flex items-center gap-2 sm:col-span-2">
                  <Calendar size={14} className="text-gray-400 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider">Sent Date &amp; Time</span>
                    <span className="text-xs font-semibold text-gray-700 block">
                      {new Date(selectedMessage.createdAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Subject and body */}
              <div className="bg-[#f9fafb] p-4 rounded-xl border border-gray-100/50">
                <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider mb-1.5">Subject</span>
                <h4 className="text-sm font-extrabold text-gray-800 mb-3">{selectedMessage.subject}</h4>
                
                <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider mb-1.5">Message / Report Detail</span>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-medium bg-white p-3 rounded-lg border border-gray-50 max-h-[150px] overflow-y-auto">
                  {selectedMessage.message}
                </p>
              </div>

              {/* Admin Reply Section */}
              <div className="bg-[#f5f7f5] p-4 rounded-xl border border-[#1a5c2a]/10">
                <span className="block text-[9px] text-[#1a5c2a] font-bold uppercase tracking-wider mb-1.5">Admin Reply</span>
                {selectedMessage.reply && !selectedMessage._isEditingReply ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-medium bg-white p-3 rounded-lg border border-gray-50">
                      {selectedMessage.reply}
                    </p>
                    <span className="block text-[9px] text-gray-400 font-semibold">
                      Replied on: {new Date(selectedMessage.repliedAt).toLocaleString()}
                    </span>
                    <button
                      onClick={() => setSelectedMessage(prev => ({ ...prev, _isEditingReply: true }))}
                      className="text-[10px] text-[#1a5c2a] hover:underline font-bold"
                    >
                      Edit Reply
                    </button>
                  </div>
                ) : selectedMessage._isEditingReply ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const replyText = e.target.replyText.value.trim();
                    if (!replyText) return;
                    try {
                      const res = await fetch(`/api/admin/contact-messages/${selectedMessage._id}/reply`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reply: replyText })
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setMessages(prev => prev.map(m => m._id === selectedMessage._id ? updated : m));
                        setSelectedMessage(updated);
                      }
                    } catch (err) {
                      console.error('Failed to send reply:', err);
                    }
                  }} className="space-y-2">
                    <textarea
                      name="replyText"
                      defaultValue={selectedMessage.reply || ''}
                      placeholder="Type your response here..."
                      rows={3}
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#1a5c2a] resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-[#1a5c2a] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#154d23]"
                      >
                        Submit Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMessage(prev => ({ ...prev, _isEditingReply: false }))}
                        className="text-gray-500 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setSelectedMessage(prev => ({ ...prev, _isEditingReply: true }))}
                    className="w-full py-2 bg-[#1a5c2a] hover:bg-[#154d23] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={13} />
                    Write a Reply
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2.5 mt-6 shrink-0">
              <button
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedMessage(null)}
              >
                Close
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                onClick={() => handleDeleteMessage(selectedMessage._id)}
              >
                <Trash2 size={13} />
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .messages-main { padding-bottom: 80px; }
        .stalls-spinner { border: 2px solid #e5e7eb; border-top-color: var(--color-brand-green); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Page Title Styles */
        .apps-title-block {
          margin-bottom: 18px;
        }
        .apps-page-title {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 6px;
          letter-spacing: -0.5px;
        }
        .apps-page-sub {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          font-weight: 500;
        }

        /* Segmented Tabs Styles */
        .apps-tab-bar {
          display: flex;
          gap: 8px;
          background: #ffffff;
          border-radius: 16px;
          padding: 6px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }
        .apps-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 12px;
          border: none;
          background: none;
          font-size: 13px;
          font-weight: 700;
          color: #6b7280;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }
        .apps-tab:hover {
          color: #111827;
          background: #f9fafb;
        }
        .apps-tab-active {
          background: #1a5c2a !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(26, 92, 42, 0.15);
        }
        .apps-tab-badge {
          background: #f3f4f6;
          color: #6b7280;
          font-size: 10px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 9999px;
          min-width: 20px;
          text-align: center;
        }
        .apps-tab-badge-active {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }

        /* Modal Styles */
        .app-detail-modal {
          background: #ffffff;
          border-radius: 24px;
          padding: 28px 24px 24px;
          max-width: 500px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          animation: slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .app-detail-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .app-detail-avatar {
          width: 48px !important;
          height: 48px !important;
          flex-shrink: 0;
        }
        .app-detail-name {
          font-size: 16px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 2px;
        }
      `}</style>
    </div>
  );
}
