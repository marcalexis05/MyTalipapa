import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';

const loginStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  
  .login-container {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background-color: #070e0a;
    position: relative;
    overflow: hidden;
    height: 100vh;
    height: 100dvh;
  }

  /* Deep premium mesh gradient background */
  .mesh-gradient {
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 15% 15%, rgba(26, 92, 42, 0.25) 0%, transparent 45%),
      radial-gradient(circle at 85% 85%, rgba(249, 115, 22, 0.08) 0%, transparent 45%),
      radial-gradient(circle at 50% 50%, rgba(11, 23, 15, 0.98) 0%, #040906 100%);
    z-index: 0;
  }

  /* Glowing developer-style grid pattern */
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px);
    background-size: 48px 48px;
    background-position: center;
    mask-image: radial-gradient(ellipse at center, black, transparent 80%);
    -webkit-mask-image: radial-gradient(ellipse at center, black, transparent 80%);
    z-index: 1;
  }

  /* Abstract glow blobs */
  .glow-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.6;
    z-index: 0;
  }
  .blob-1 {
    top: -10%;
    left: 20%;
    width: 400px;
    height: 400px;
    background-color: rgba(26, 92, 42, 0.3);
  }
  .blob-2 {
    bottom: -10%;
    right: 20%;
    width: 450px;
    height: 450px;
    background-color: rgba(249, 115, 22, 0.1);
  }

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

  .login-card {
    animation: fadeSlideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 
      0 4px 30px rgba(0, 0, 0, 0.15),
      0 20px 50px rgba(0, 0, 0, 0.25),
      inset 0 1px 1px rgba(255, 255, 255, 0.5);
  }
  .login-logo {
    animation: fadeIn 0.8s ease both;
  }
  .login-logo-icon {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .login-logo-icon:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 12px 24px rgba(26, 92, 42, 0.25);
  }
  .login-error {
    animation: slideInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .input-container {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .input-container:focus-within {
    border-color: #1a5c2a !important;
    box-shadow: 0 0 0 4px rgba(26, 92, 42, 0.12);
    background-color: #ffffff !important;
  }
  .input-container:focus-within svg.input-icon {
    color: #1a5c2a !important;
  }
  .submit-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .submit-btn:not(:disabled):hover {
    background-color: #13451e !important;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(26, 92, 42, 0.3);
  }
  .submit-btn:not(:disabled):hover .arrow-icon {
    transform: translateX(3px);
  }
  .submit-btn:not(:disabled):active {
    transform: translateY(0) scale(0.99);
  }
  .submit-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  .arrow-icon {
    transition: transform 0.2s ease;
  }
  .clear-btn {
    transition: all 0.2s ease;
  }
  .clear-btn:hover {
    color: #1a5c2a !important;
    transform: scale(1.08);
  }
  .back-btn {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .back-btn:hover {
    background-color: rgba(255, 255, 255, 0.15) !important;
    color: #ffffff !important;
    transform: scale(1.05);
  }
  .footer-link {
    transition: all 0.2s ease;
  }
  .footer-link:hover {
    color: #ffffff !important;
    opacity: 1;
  }
  .divider-line {
    background: linear-gradient(90deg, transparent, rgba(226, 232, 240, 1) 50%, transparent);
  }
`;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [modalPassword, setModalPassword] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.mustChangePassword) {
          setShowModal(true);
          setModalEmail(email);
          setModalPassword(password);
          setLoading(false);
          return;
        }
        if (result.unverified) {
          navigate('/register', { 
            state: { 
              email: result.email, 
              role: result.role, 
              step: result.role === 'contractor' ? 5 : 3 
            } 
          });
          setLoading(false);
          return;
        }
        setError(result.error || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      if (result.user && result.user.role === 'renter' && !result.user.isVerified) {
        setError('Please verify your email before logging in.');
        setLoading(false);
        return;
      }

      if (result.user && result.user.role === 'renter') {
        window.location.href = '/renter/dashboard';
      } else if (result.user && result.user.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/contractor/dashboard';
      }

    } catch (err) {
      setError('Network error: ' + err.message);
    }

    setLoading(false);
  }

  return (
    <>
      <style>{loginStyles}</style>
      <div className="login-container h-screen h-[100dvh] flex items-center justify-center px-4 py-4 sm:py-12 relative">
        {/* Background Components */}
        <div className="mesh-gradient" />
        <div className="grid-pattern" />
        <div className="glow-blob blob-1" />
        <div className="glow-blob blob-2" />

        <button
          onClick={() => navigate('/')}
          className="back-btn absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white transition-all duration-300 shadow-lg"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="w-full max-w-[390px] sm:max-w-[420px] relative z-10 px-2 flex flex-col justify-center h-full">

          <div className="login-logo flex flex-col items-center mb-4 sm:mb-8">
            <div 
              className="login-logo-icon w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center mb-2 sm:mb-4 cursor-pointer shadow-2xl border border-white/10" 
              style={{ backgroundColor: '#1a5c2a' }}
              onClick={() => navigate('/')}
            >
              <img src="/logo.png" alt="MyTalipapa Logo" className="h-7 w-auto sm:h-9 object-contain" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">MyTalipapa</h1>
          </div>

          <div className="login-card rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-white/50">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">Welcome back</h2>
              <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">Please enter your credentials</p>
            </div>

            {error && (
              <div className="login-error mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Email Address</label>
                <div className="input-container flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/70">
                  <Mail size={14} className="input-icon text-slate-400 shrink-0 sm:w-4 sm:h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Password</label>
                <div className="input-container flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/70">
                  <Lock size={14} className="input-icon text-slate-400 shrink-0" sm:w-4 sm:h-4 />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400 w-full"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="clear-btn text-slate-400 shrink-0"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="text-right mt-1.5 sm:mt-2">
                  <Link 
                    to="/forgot-password" 
                    className="text-[9px] sm:text-[10px] font-bold hover:underline" 
                    style={{ color: '#f97316' }}
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="submit-btn w-full py-3 sm:py-4 mt-1.5 sm:mt-2 rounded-xl sm:rounded-2xl text-white font-bold text-xs sm:text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: '#1a5c2a',
                  boxShadow: '0 4px 15px rgba(26, 92, 42, 0.2)' 
                }}
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
                    Sign In
                    <ArrowRight size={15} className="arrow-icon" />
                  </>
                )}
              </button>
            </form>

            <div className="h-px divider-line my-4 sm:my-6" />

            <div className="text-center text-xs text-slate-500 space-y-1.5">
              <div>Don't have an account?</div>
              <div className="flex justify-center items-center gap-2 flex-wrap">
                <a href="/register" style={{ color: '#1a5c2a' }} className="font-bold hover:underline">
                  Register
                </a>
              </div>
            </div>
          </div>



          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4">
              <div 
                className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full border border-slate-100" 
                style={{ 
                  animation: 'fadeSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both' 
                }}
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                    <Lock size={22} className="text-orange-500" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Password Change Required</h2>
                  <p className="mb-6 text-sm text-slate-500 leading-relaxed">
                    For security reasons, you need to set a new password before you can access your dashboard.
                  </p>
                  <button 
                    type="button"
                    onClick={() => {
                      navigate('/set-new-password', { state: { email: modalEmail, password: modalPassword } });
                      setShowModal(false);
                    }}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all duration-200"
                    style={{ 
                      backgroundColor: '#1a5c2a',
                      boxShadow: '0 4px 12px rgba(26, 92, 42, 0.15)' 
                    }}
                  >
                    Set New Password
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}