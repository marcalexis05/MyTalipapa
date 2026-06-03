import { useNavigate } from 'react-router-dom';

import NotificationBell from '../../components/NotificationBell';
import ChangePasswordForm from '../../components/ChangePasswordForm';
import { ChevronRight, Store } from 'lucide-react';

export default function AdminSecurity() {
  const navigate = useNavigate();
  const handleBack = () => navigate('/admin/profile');

  return (
    <div className="flex h-screen bg-[#f5f5f0] font-sans overflow-hidden w-full">

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
              <span className="text-gray-700 font-semibold">Security</span>
            </div>
          </div>
          <div className="header-right">
            <NotificationBell />
          </div>
        </header>

        {/* Main */}
        <main className="profile-main flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold mb-4">Change Password</h2>
          <ChangePasswordForm />
        </main>
      </div>
    </div>
  );
}
