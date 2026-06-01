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
  .role-btn {
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }
  .role-btn:active {
    transform: scale(0.96);
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
  .footer-link {
    transition: opacity 0.2s ease;
  }
  .footer-link:hover {
    opacity: 0.75;
  }
`

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('renter');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  

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
        // If backend requires password change (403), show modal
        if (response.status === 403) {
          setShowModal(true);
          // Store credentials for later navigation
          setModalEmail(email);
          setModalPassword(password);
          setLoading(false);
          return;
        }
        // Fallback for other errors
        setError(result.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // If renter, ensure email is verified
      if (result.user && result.user.role === 'renter' && !result.user.isVerified) {
        setError('Please verify your email before logging in.');
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (result.user && result.user.role === 'renter') {
        window.location.href = '/renter/dashboard';
      } else if (result.user && result.user.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/contractor/dashboard';
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
          onClick={() => navigate('/')}
          className="back-btn absolute top-4 left-4 z-10 flex items-center gap-1 text-sm font-semibold bg-[#1a5c2a] rounded-md shadow p-2 text-white hover:bg-[#163721] transition-colors"
        >
          ← Back
        </button>

        <div className="w-full max-w-sm relative z-10">

          <div className="login-logo flex flex-col items-center mb-8">
            <div className="login-logo-icon w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#1a5c2a' }}>
              <img src="/logo.png" alt="MyTalipapa Logo" className="h-12 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow">MyTalipapa</h1>
            <p className="text-xs tracking-widest text-gray-300 mt-1 uppercase">
              {role === 'renter' ? 'Vendor Portal' : role === 'admin' ? 'Admin Portal' : 'Contractor Portal'}
            </p>
          </div>

          <div className="login-card bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6">

            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
              {['renter', 'contractor', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className="role-btn flex-1 py-2.5 text-sm font-semibold disabled:opacity-50"
                  style={{
                    backgroundColor: role === r ? '#1a5c2a' : 'white',
                    color: role === r ? 'white' : '#6b7280'
                  }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

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
                    placeholder="name@example.com"
                    required
                    className="flex-1 bg-transparent text-sm focus:outline-none"
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
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="clear-btn text-gray-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="text-right mt-1.5">
                  <Link to="/forgot-password" className="text-xs font-medium" style={{ color: '#f97316' }}>Forgot Password?</Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="submit-btn w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
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
                    {role === 'renter' ? 'Login' : 'Login to Dashboard'}
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <p className="text-center text-sm text-gray-500 mt-5">
              Don't have an account?{' '}
              <a href="/register" style={{ color: '#1a5c2a' }} className="font-semibold">Register</a>
            </p>
          </div>

          <div className="flex justify-center gap-6 mt-6">
            <a href="#" className="footer-link text-xs text-gray-300 hover:text-white transition">Help Center</a>
            <a href="#" className="footer-link text-xs text-gray-300 hover:text-white transition">Privacy Policy</a>
            {showModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full animate-fadeSlideUp" style={{ animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both' }}>
                  <h2 className="text-lg font-semibold mb-4 text-center" style={{ color: '#1a5c2a' }}>You need to set a new password</h2>
                  <p className="mb-4 text-center text-gray-600">For security reasons, please set a new password before continuing.</p>
                  <button type="button"
                    onClick={() => {
                      navigate('/set-new-password', { state: { email: modalEmail, password: modalPassword } });
                      setShowModal(false);
                    }}
                    className="w-full py-2 rounded bg-[#1a5c2a] text-white hover:bg-[#163721] transition"
                  >
                    Set New Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}