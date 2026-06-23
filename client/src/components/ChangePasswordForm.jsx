import { useState, useEffect, useMemo } from 'react';
import { getToken } from "../utils/auth";
import { Eye, EyeOff, HelpCircle } from 'lucide-react';

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
  const [showStrengthTooltip, setShowStrengthTooltip] = useState(false);

  // Criteria validation (aligned with Register page)
  const isMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(newPassword);
  const isPasswordValid = isMinLength && hasUppercase && hasDigit && hasSpecial;
  
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === newPassword;

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: 'text-slate-400', barColor: 'bg-slate-200' };
    if (newPassword.length < 8) return { score: 1, label: 'Weak (too short)', color: 'text-red-500', barColor: 'bg-red-500' };
    let score = 1;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(newPassword)) score++;
    if (score === 4) return { score, label: 'Strong', color: 'text-green-600', barColor: 'bg-green-600' };
    if (score === 3) return { score, label: 'Medium', color: 'text-amber-500', barColor: 'bg-amber-500' };
    return { score, label: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' };
  }, [newPassword]);

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
        
        {/* Password Strength Meter */}
        <div className="mt-3 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-150 relative">
          <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Password Strength</span>
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowStrengthTooltip(true)}
                  onMouseLeave={() => setShowStrengthTooltip(false)}
                  onClick={() => setShowStrengthTooltip(!showStrengthTooltip)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors mt-0.5 flex items-center"
                  aria-label="Password requirements info"
                >
                  <HelpCircle size={11} />
                </button>
                {showStrengthTooltip && (
                  <div 
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] p-3 rounded-lg shadow-xl w-48 z-20 space-y-2 border border-slate-700 pointer-events-none"
                    style={{ animation: 'slideInDown 0.2s ease both' }}
                  >
                    <p className="font-bold text-slate-300 border-b border-slate-700 pb-1.5 mb-1.5 text-left">Requirements:</p>
                    <div className="flex items-center gap-2.5 text-left">
                      <span className={isMinLength ? 'text-green-400 font-bold' : 'text-slate-500 font-bold'}>{isMinLength ? '✓' : '✗'}</span>
                      <span className={isMinLength ? 'text-slate-100 font-semibold' : 'text-slate-400'}>Min. 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-left">
                      <span className={hasUppercase ? 'text-green-400 font-bold' : 'text-slate-500 font-bold'}>{hasUppercase ? '✓' : '✗'}</span>
                      <span className={hasUppercase ? 'text-slate-100 font-semibold' : 'text-slate-400'}>One uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-left">
                      <span className={hasDigit ? 'text-green-400 font-bold' : 'text-slate-500 font-bold'}>{hasDigit ? '✓' : '✗'}</span>
                      <span className={hasDigit ? 'text-slate-100 font-semibold' : 'text-slate-400'}>One number</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-left">
                      <span className={hasSpecial ? 'text-green-400 font-bold' : 'text-slate-500 font-bold'}>{hasSpecial ? '✓' : '✗'}</span>
                      <span className={hasSpecial ? 'text-slate-100 font-semibold' : 'text-slate-400'}>One special character</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <span className={`font-bold uppercase tracking-wider ${passwordStrength.color}`}>
              {passwordStrength.label}
            </span>
          </div>
          <div className="flex gap-1 h-1.5 w-full">
            <div className={`flex-1 h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.barColor : 'bg-slate-200'}`} />
            <div className={`flex-1 h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.barColor : 'bg-slate-200'}`} />
            <div className={`flex-1 h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.barColor : 'bg-slate-200'}`} />
          </div>
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
