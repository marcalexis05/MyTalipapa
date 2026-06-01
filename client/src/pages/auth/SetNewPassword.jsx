import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';

const setPasswordStyles = `
  @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  .set-pwd-card { animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
  .set-pwd-input { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
  .set-pwd-input:focus-within { border-color: #1a5c2a !important; box-shadow: 0 0 0 3px rgba(26,92,42,0.12); }
  .submit-btn { position: relative; overflow: hidden; transition: opacity 0.2s ease, transform 0.15s ease; }
  .submit-btn:not(:disabled):hover { opacity: 0.93; transform: translateY(-1px); }
  .submit-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent); background-size: 200% 100%; animation: shimmer 1.6s infinite; }
`;

export default function SetNewPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || '';
  const currentPassword = state?.password || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/change-first-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to change password');
        setLoading(false);
        return;
      }
      // Store token & user info
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      // Redirect based on role (contractor flow)
      if (result.user && result.user.role === 'contractor') {
        window.location.href = '/contractor/dashboard';
      } else {
        // fallback to home
        navigate('/');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <>
      <style>{setPasswordStyles}</style>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 set-pwd-card">
          <h2 className="text-2xl font-bold text-center mb-4" style={{ color: '#1a5c2a' }}>Set New Password</h2>
          {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="set-pwd-input flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
              <Lock size={16} className="text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
                required
                className="flex-1 bg-transparent focus:outline-none text-sm"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="set-pwd-input flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
              <Lock size={16} className="text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="flex-1 bg-transparent focus:outline-none text-sm"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="submit-btn w-full py-3 rounded-xl text-white font-bold flex items-center justify-center"
              style={{ backgroundColor: '#1a5c2a' }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
