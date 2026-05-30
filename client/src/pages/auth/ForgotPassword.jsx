import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react'

const forgotStyles = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeSlideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(-20px); }
  }
  @keyframes slideInDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes successBounce {
    0% { opacity: 0; transform: scale(0.5); }
    60% { transform: scale(1.1); }
    80% { transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes checkDraw {
    from { stroke-dashoffset: 100; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes timerPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }
  @keyframes logoBounce {
    0%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
    60% { transform: translateY(-3px); }
  }
  .fp-card {
    animation: fadeSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .fp-logo {
    animation: fadeSlideUp 0.4s ease both;
  }
  .fp-logo-icon {
    animation: logoBounce 0.7s ease 0.25s both;
    transition: transform 0.2s ease;
    cursor: pointer;
  }
  .fp-logo-icon:hover {
    transform: scale(1.07);
  }
  .step-enter {
    animation: fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .fp-error {
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
  .otp-input:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(26,92,42,0.15);
    border-color: #1a5c2a !important;
  }
  .submit-btn {
    position: relative;
    overflow: hidden;
    transition: opacity 0.2s ease, transform 0.15s ease;
  }
  .submit-btn:not(:disabled):hover {
    opacity: 0.92;
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
  .success-icon {
    animation: successBounce 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .success-content {
    animation: fadeSlideUp 0.45s ease 0.15s both;
  }
  .timer-low {
    animation: timerPulse 1s ease-in-out infinite;
  }
  .back-btn {
    transition: color 0.15s ease, transform 0.15s ease;
  }
  .back-btn:hover {
    transform: translateX(-2px);
  }
  .resend-btn {
    transition: color 0.15s ease;
  }
  .resend-btn:hover {
    opacity: 0.8;
  }
  .checklist-row {
    transition: color 0.25s ease;
  }
`

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [accountName, setAccountName] = useState('')
  const [userId, setUserId] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [timer, setTimer] = useState(0)
  const [stepKey, setStepKey] = useState(1)

  useEffect(() => {
    let interval = null
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [timer])

  function goToStep(n) {
    setStepKey(n)
    setStep(n)
    setError(null)
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  async function handleIdentify(e) {
    e.preventDefault()
    if (!accountName.trim()) { setError('Please enter your account name or email address.'); return }
    setLoading(true); setError(null)
    try {
      const idResponse = await fetch('http://localhost:5000/api/identify-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountName }) })
      const idResult = await idResponse.json()
      if (!idResponse.ok) { setError(idResult.error || 'Account not found.'); setLoading(false); return }
      const verifiedUserId = idResult.userId
      setUserId(verifiedUserId); setMaskedEmail(idResult.maskedEmail)
      const sendOtpResponse = await fetch('http://localhost:5000/api/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: verifiedUserId, method: 'email' }) })
      const sendOtpResult = await sendOtpResponse.json()
      if (!sendOtpResponse.ok) { setError(sendOtpResult.error || 'Failed to send verification code.'); setLoading(false); return }
      setTimer(300); goToStep(2)
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    setLoading(true); setError(null)
    try {
      const response = await fetch('http://localhost:5000/api/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, method: 'email' }) })
      const result = await response.json()
      if (!response.ok) { setError(result.error || 'Failed to resend verification code.'); setLoading(false); return }
      setTimer(300); setOtp('')
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Please enter a valid 6-digit verification code.'); return }
    setLoading(true); setError(null)
    try {
      const response = await fetch('http://localhost:5000/api/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, otp }) })
      const result = await response.json()
      if (!response.ok) { setError(result.error || 'Invalid or expired verification code.'); setLoading(false); return }
      goToStep(3)
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasDigitOrSpecial = /[\d\W]/.test(password)
    if (!hasLetter || !hasDigitOrSpecial) { setError('Password must contain at least one letter and one number or special character.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true); setError(null)
    try {
      const response = await fetch('http://localhost:5000/api/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, otp, password }) })
      const result = await response.json()
      if (!response.ok) { setError(result.error || 'Failed to reset password.'); setLoading(false); return }
      goToStep(4)
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const isLenValid = password.length >= 6
  const isComplexityValid = /[a-zA-Z]/.test(password) && /[\d\W]/.test(password)
  const isMatchValid = password && password === confirmPassword

  return (
    <>
      <style>{forgotStyles}</style>
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

        <div className="w-full max-w-sm relative z-10">

          <div className="fp-logo flex flex-col items-center mb-8">
            <div className="fp-logo-icon w-20 h-20 rounded-2xl flex items-center justify-center mb-4" onClick={() => navigate('/login')} style={{ backgroundColor: '#1a5c2a' }}>
              <img src="/logo.png" alt="MyTalipapa Logo" className="h-12 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow">MyTalipapa</h1>
            <p className="text-xs tracking-widest text-gray-300 mt-1 uppercase">Account Recovery</p>
          </div>

          <div className="fp-card bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 relative overflow-hidden">

            {step < 4 && (
              <button
                onClick={() => {
                  if (step === 1) navigate('/login')
                  if (step === 2) goToStep(1)
                  if (step === 3) goToStep(2)
                }}
                className="back-btn absolute top-6 left-6 text-gray-500 hover:text-gray-700 flex items-center gap-1 text-xs font-semibold"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}

            <div className="pt-6">
              {error && (
                <div className="fp-error mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold flex gap-1.5 items-start">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {step === 1 && (
                <form key={`step-${stepKey}`} onSubmit={handleIdentify} className="step-enter space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Find Your Account</h2>
                    <p className="text-xs text-gray-500 mb-4">Enter your username, registered name, or email address</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Account Name or Email</label>
                    <div className="input-field flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                      <Mail size={16} className="text-gray-400" />
                      <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Username, email or contact number" required disabled={loading} className="flex-1 bg-transparent text-sm focus:outline-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="submit-btn w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm" style={{ backgroundColor: '#1a5c2a' }}>
                    {loading ? (
                      <><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Finding Account...</>
                    ) : 'Continue →'}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form key={`step-${stepKey}`} onSubmit={handleVerifyOtp} className="step-enter space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Enter Security Code</h2>
                    <p className="text-xs text-gray-500 mb-4">We sent a 6-digit verification code to <strong className="text-gray-700">{maskedEmail}</strong>.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-center">Verification Code</label>
                    <div className="flex justify-center">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setOtp(val) }}
                        placeholder="000000"
                        disabled={loading}
                        className="otp-input text-center font-mono text-3xl tracking-[0.6em] pl-4 py-3 rounded-xl border border-gray-250 bg-gray-50 focus:outline-none w-full font-bold max-w-[200px] transition-all"
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="submit-btn w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm" style={{ backgroundColor: '#1a5c2a' }}>
                    {loading ? (
                      <><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Verifying...</>
                    ) : 'Verify Code →'}
                  </button>
                  <div className="text-center mt-4">
                    <p className="text-xs text-gray-400">
                      {timer > 0 ? (
                        <span>Code expires in <span className={`font-semibold font-mono ${timer <= 60 ? 'text-red-500 timer-low' : 'text-orange-500'}`}>{formatTime(timer)}</span></span>
                      ) : (
                        <span>Code expired.{' '}<button type="button" onClick={handleResendOtp} className="resend-btn font-bold text-orange-500 hover:text-orange-600 transition-colors">Resend OTP</button></span>
                      )}
                    </p>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form key={`step-${stepKey}`} onSubmit={handleResetPassword} className="step-enter space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Set New Password</h2>
                    <p className="text-xs text-gray-500 mb-4">Create a strong password containing letters and numbers/symbols.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">New Password</label>
                    <div className="input-field flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-250 bg-gray-50">
                      <Lock size={16} className="text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} className="flex-1 bg-transparent text-sm focus:outline-none" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 transition-transform hover:scale-110">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Confirm Password</label>
                    <div className="input-field flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-250 bg-gray-50">
                      <Lock size={16} className="text-gray-400" />
                      <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required disabled={loading} className="flex-1 bg-transparent text-sm focus:outline-none" />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 transition-transform hover:scale-110">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                  <div className="space-y-1 bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs">
                    {[[isLenValid, 'At least 6 characters'], [isComplexityValid, 'Contains letter + number/symbol'], [isMatchValid, 'Passwords match']].map(([valid, label], i) => (
                      <div key={i} className="checklist-row flex items-center gap-1.5">
                        <span className={valid ? 'text-green-600' : 'text-gray-400'}>{valid ? '✓' : '•'}</span>
                        <span className={valid ? 'text-green-800' : 'text-gray-500'}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <button type="submit" disabled={loading || !isLenValid || !isComplexityValid || !isMatchValid}
                    className="submit-btn w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm" style={{ backgroundColor: '#1a5c2a' }}>
                    {loading ? (
                      <><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Resetting Password...</>
                    ) : 'Reset Password →'}
                  </button>
                </form>
              )}

              {step === 4 && (
                <div key={`step-${stepKey}`} className="text-center py-6 space-y-4">
                  <div className="success-icon flex justify-center text-green-700">
                    <CheckCircle size={64} strokeWidth={1.5} />
                  </div>
                  <div className="success-content">
                    <h3 className="font-bold text-gray-800 text-lg mb-1">Password Reset Successful!</h3>
                    <p className="text-xs text-gray-500 px-2 leading-relaxed">Your password has been changed. You can now use your new credentials to sign in.</p>
                  </div>
                  <button onClick={() => navigate('/login')} className="submit-btn w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-sm" style={{ backgroundColor: '#1a5c2a' }}>
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-300 mt-8">
            © 2026 MyTalipapa Market Management. All rights reserved.
          </p>
        </div>
      </div>
    </>
  )
}