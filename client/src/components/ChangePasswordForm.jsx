import { useState, useEffect } from 'react';
import { getToken } from "../utils/auth";
import { Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordForm({ onSuccess }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [checkingOld, setCheckingOld] = useState(false);
  const [oldPasswordValid, setOldPasswordValid] = useState(null); // null = not checked, true = valid, false = invalid
  const [oldTimeout, setOldTimeout] = useState(null);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Criteria validation
  const isMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(newPassword);
  const isPasswordValid = isMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;
  
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === newPassword;

  const handleOldPasswordChange = (val) => {
    setOldPassword(val);
    if (oldTimeout) clearTimeout(oldTimeout);
    if (!val) {
      setOldPasswordValid(null);
      return;
    }
    setOldPasswordValid(null);
    setOldTimeout(setTimeout(async () => {
      setCheckingOld(true);
      try {
        const token = getToken();
        const res = await fetch('/api/verify-current-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ password: val })
        });
        if (res.ok) {
          const data = await res.json();
          setOldPasswordValid(data.valid);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingOld(false);
      }
    }, 400));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!oldPasswordValid) {
      setError('Current password is incorrect.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not meet complexity requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Confirm password does not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOldPasswordValid(null);
      if (onSuccess) onSuccess();
      alert('Password changed successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && <p className="text-red-655 text-xs font-semibold bg-red-50 p-2.5 rounded-xl border border-red-100">{error}</p>}
      
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showOldPassword ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => handleOldPasswordChange(e.target.value)}
            required
            className={`w-full bg-[#f5f5f0] border rounded-xl pl-4 pr-24 py-3 text-sm text-gray-800 focus:outline-none transition-all ${
              oldPasswordValid === true ? 'border-green-600 bg-green-50/20' : oldPasswordValid === false ? 'border-red-500 bg-red-50/20' : 'border-transparent focus:bg-white focus:border-[#1a5c2a]'
            }`}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {checkingOld && <span className="text-gray-400 text-xs">Checking…</span>}
            {!checkingOld && oldPasswordValid === true && <span className="text-green-600 font-extrabold text-xs">✓ Match</span>}
            {!checkingOld && oldPasswordValid === false && <span className="text-red-500 font-extrabold text-xs">✗ Incorrect</span>}
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            >
              {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
          New Password
        </label>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full bg-[#f5f5f0] border border-transparent rounded-xl pl-4 pr-12 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#1a5c2a] focus:bg-white transition-all"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
          >
            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        
        {/* Checklist */}
        <div className="mt-2 space-y-1 text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-left">
          <p className="font-semibold text-gray-500 mb-1">Password Strength Checklist:</p>
          {[
            [isMinLength, 'Minimum 8 characters'],
            [hasUppercase, 'At least 1 uppercase letter'],
            [hasLowercase, 'At least 1 lowercase letter'],
            [hasDigit, 'At least 1 number'],
            [hasSpecial, 'At least 1 special character (e.g. !@#$%^&*)'],
          ].map(([valid, label], i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className={valid ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{valid ? '✓' : '✗'}</span>
              <span className={valid ? 'text-green-700 font-medium' : 'text-gray-500'}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={`w-full bg-[#f5f5f0] border rounded-xl pl-4 pr-24 py-3 text-sm text-gray-800 focus:outline-none transition-all ${
              confirmPassword.length === 0 ? 'border-transparent focus:bg-white focus:border-[#1a5c2a]' : passwordsMatch ? 'border-green-600 bg-green-50/20' : 'border-red-500 bg-red-50/20'
            }`}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {confirmPassword.length > 0 && (
              passwordsMatch ? <span className="text-green-600 text-xs font-semibold">✓ Matches</span> : <span className="text-red-500 text-xs font-semibold">✗ Mismatch</span>
            )}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2 flex gap-3">
        <button
          type="submit"
          disabled={loading || !isPasswordValid || !passwordsMatch || !oldPasswordValid}
          className="flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : 'Change Password'}
        </button>
      </div>
    </form>
  );
}
