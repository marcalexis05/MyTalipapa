import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

const loginStyles = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideInDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes logoBounce {
    0%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
    60% { transform: translateY(-3px); }
  }
  .login-card {
    animation: fadeSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .login-logo {
    animation: fadeIn 0.5s ease both;
  }
  .login-logo-icon {
    animation: logoBounce 0.7s ease 0.3s both;
    transition: transform 0.2s ease;
  }
  .login-logo-icon:hover {
    transform: scale(1.07);
  }
  .login-error {
    animation: slideInDown 0.3s ease both;
  }
  .input-field {
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }
  .input-field:focus-within {
    border-color: #1a5c2a !important;
    box-shadow: 0 0 0 3px rgba(26,92,42,0.12);
    background-color: #fff !important;
  }
  .submit-btn {
    position: relative;
    overflow: hidden;
    transition: opacity 0.2s ease, transform 0.15s ease;
  }
  .submit-btn:not(:disabled):hover {
    opacity: 0.93;
    transform: translateY(-1px);
  }
  .submit-btn:not(:disabled):active {
    transform: scale(0.98) translateY(0);
  }
  .submit-btn:not(:disabled)::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
  }
  .clear-btn {
    transition: color 0.15s ease, transform 0.15s ease;
  }
  .clear-btn:hover {
    transform: scale(1.15);
  }
  .back-btn {
    transition: background-color 0.2s ease, transform 0.15s ease;
  }
  .back-btn:hover {
    transform: translateX(-2px);
  }
`

export default function AdminLogin() {
  const navigate = useNavigate();
  const role = 'admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Redirect to admin dashboard
      if (result.user && result.user.role === 'admin') {
        window.location.href = '/admin/dashboard';
      }

    } catch (err) {
      setError('Network error: ' + err.message)
    }

    setLoading(false)
  }

  return (
    <>
      <style>{loginStyles}</style>
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10 relative"
        style={{
          backgroundImage: 'url("/bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} />

        <button
          onClick={() => navigate('/login')}
          className="back-btn absolute top-4 left-4 z-10 flex items-center gap-1 text-sm font-semibold bg-[#1a5c2a] rounded-md shadow p-2 text-white hover:bg-[#163721] transition-colors"
        >
          ← Back
        </button>

        <div className="w-full sm:max-w-[450px] relative z-10 px-2 sm:px-0">

          <div className="login-logo flex flex-col items-center mb-8">
            <div className="login-logo-icon w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#1a5c2a' }}>
              <img src="/logo.png" alt="MyTalipapa Logo" className="h-12 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow">MyTalipapa</h1>
            <p className="text-xs tracking-widest text-gray-300 mt-1 uppercase">
              Admin Login
            </p>
          </div>

          <div className="login-card bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6">

            {error && (
              <div className="login-error mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Email Address</label>
                <div className="input-field flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                  <Mail size={16} className="text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@mytalipapa.com"
                    required
                    className="flex-1 bg-transparent text-base sm:text-sm focus:outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
                <div className="input-field flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                  <Lock size={16} className="text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="flex-1 bg-transparent text-base sm:text-sm focus:outline-none w-full"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="clear-btn text-gray-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="submit-btn w-full py-3.5 mt-4 rounded-xl text-white font-bold text-base sm:text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#1a5c2a' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Secure Login
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </>
  )
}
