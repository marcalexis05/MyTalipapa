import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, CheckCircle, ArrowLeft, AlertCircle, HelpCircle, Check, ArrowRight } from 'lucide-react'

const forgotStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  
  .forgot-container {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background-color: #070e0a;
    position: relative;
    overflow: hidden;
    height: 100vh;
    height: 100dvh;
  }

  .mesh-gradient {
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 15% 15%, rgba(26, 92, 42, 0.25) 0%, transparent 45%),
      radial-gradient(circle at 85% 85%, rgba(249, 115, 22, 0.08) 0%, transparent 45%),
      radial-gradient(circle at 50% 50%, rgba(11, 23, 15, 0.98) 0%, #040906 100%);
    z-index: 0;
  }

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

  .forgot-card {
    animation: fadeSlideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 
      0 4px 30px rgba(0, 0, 0, 0.15),
      0 20px 50px rgba(0, 0, 0, 0.25),
      inset 0 1px 1px rgba(255, 255, 255, 0.5);
  }
  .forgot-logo {
    animation: fadeIn 0.8s ease both;
  }
  .forgot-logo-icon {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .forgot-logo-icon:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 12px 24px rgba(26, 92, 42, 0.25);
  }
  .forgot-error {
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
  .submit-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .submit-btn:not(:disabled):hover {
    transform: translateY(-1.5px);
    box-shadow: 0 6px 20px rgba(26, 92, 42, 0.25);
  }
  .submit-btn:not(:disabled):active {
    transform: translateY(0) scale(0.98);
  }
  .submit-btn:not(:disabled)::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  .back-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .back-btn:hover {
    transform: scale(1.05);
    background-color: rgba(255, 255, 255, 0.1);
  }
  .back-btn:active {
    transform: scale(0.95);
  }
  .otp-digit-input:focus {
    border-color: #1a5c2a !important;
    box-shadow: 0 0 0 4px rgba(26, 92, 42, 0.12);
    background-color: #ffffff !important;
  }
`

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [accountName, setAccountName] = useState('')
  const [userId, setUserId] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [timer, setTimer] = useState(0)
  const [stepKey, setStepKey] = useState(1)
  const [showStrengthTooltip, setShowStrengthTooltip] = useState(false)

  useEffect(() => {
    let interval = null
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [timer])

  const handleOtpDigitChange = (value, idx) => {
    const cleanVal = value.replace(/\D/g, '')
    const newDigits = [...otpDigits]
    newDigits[idx] = cleanVal.slice(-1)
    setOtpDigits(newDigits)

    if (cleanVal && idx < 3) {
      const nextInput = document.getElementById(`otp-digit-${idx + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      const prevInput = document.getElementById(`otp-digit-${idx - 1}`)
      if (prevInput) {
        prevInput.focus()
        const newDigits = [...otpDigits]
        newDigits[idx - 1] = ''
        setOtpDigits(newDigits)
      }
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!pastedData) return

    const newDigits = [...otpDigits]
    for (let i = 0; i < 4; i++) {
      newDigits[i] = pastedData[i] || ''
    }
    setOtpDigits(newDigits)

    const focusIndex = Math.min(pastedData.length, 3)
    const targetInput = document.getElementById(`otp-digit-${focusIndex}`)
    if (targetInput) {
      targetInput.focus()
    }
  }

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
      const idResponse = await fetch('/api/identify-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountName }) })
      const idResult = await idResponse.json()
      if (!idResponse.ok) { setError(idResult.error || 'Account not found.'); setLoading(false); return }
      const verifiedUserId = idResult.userId
      setUserId(verifiedUserId); setMaskedEmail(idResult.maskedEmail)
      const sendOtpResponse = await fetch('/api/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: verifiedUserId, method: 'email' }) })
      const sendOtpResult = await sendOtpResponse.json()
      if (!sendOtpResponse.ok) { setError(sendOtpResult.error || 'Failed to send verification code.'); setLoading(false); return }
      
      // If timer is already running (e.g. they reviewed details and came back), keep the timer ticking!
      if (timer <= 0) {
        setTimer(60)
      }
      setOtpDigits(['', '', '', ''])
      goToStep(2)
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    setLoading(true); setError(null)
    try {
      const response = await fetch('/api/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, method: 'email' }) })
      const result = await response.json()
      if (!response.ok) { setError(result.error || 'Failed to resend verification code.'); setLoading(false); return }
      setTimer(60)
      setOtpDigits(['', '', '', ''])
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    const otp = otpDigits.join('')
    if (otp.length !== 4) { setError('Please enter a valid 4-digit verification code.'); return }
    setLoading(true); setError(null)
    try {
      const response = await fetch('/api/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, otp }) })
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
    if (!isPasswordValid) { setError('Password does not meet the complexity requirements.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true); setError(null)
    try {
      const otp = otpDigits.join('')
      const response = await fetch('/api/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, otp, password }) })
      const result = await response.json()
      if (!response.ok) { setError(result.error || 'Failed to reset password.'); setLoading(false); return }
      goToStep(4)
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Password strength meter logic
  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  const isPasswordValid = isMinLength && hasUppercase && hasDigit && hasSpecial;

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' };
    let score = 0;
    if (isMinLength) score = 1;
    if (isMinLength && (hasUppercase || hasDigit || hasSpecial)) score = 2;
    if (isMinLength && hasUppercase && hasDigit && hasSpecial) score = 3;

    if (score === 3) return { score, label: 'Strong', color: 'text-green-600', barColor: 'bg-green-600' };
    if (score === 2) return { score, label: 'Medium', color: 'text-amber-500', barColor: 'bg-amber-500' };
    return { score, label: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' };
  }, [password, isMinLength, hasUppercase, hasDigit, hasSpecial]);

  return (
    <>
      <style>{forgotStyles}</style>
      <div className="forgot-container flex items-center justify-center px-4 py-4 sm:py-12 relative">
        {/* Background Components */}
        <div className="mesh-gradient" />
        <div className="grid-pattern" />
        <div className="glow-blob blob-1" />
        <div className="glow-blob blob-2" />

        {step < 4 && (
          <button
            onClick={() => {
              if (step === 1) navigate('/login')
              if (step === 2) goToStep(1)
              if (step === 3) goToStep(2)
            }}
            className="back-btn absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white transition-all duration-300 shadow-lg"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        <div className="w-full max-w-[390px] sm:max-w-[420px] relative z-10 px-2 flex flex-col justify-center h-full">

          <div className="forgot-logo flex flex-col items-center mb-4 sm:mb-8">
            <div 
              className="forgot-logo-icon w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center mb-2 sm:mb-4 cursor-pointer shadow-2xl border border-white/10" 
              style={{ backgroundColor: '#1a5c2a' }}
              onClick={() => navigate('/login')}
            >
              <img src="/logo.png" alt="MyTalipapa Logo" className="h-7 w-auto sm:h-9 object-contain" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">MyTalipapa</h1>
          </div>

          <div className="forgot-card rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-white/50">
            <div className="pt-2">
              {error && (
                <div className="forgot-error mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold leading-relaxed flex gap-2 items-start">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {step === 1 && (
                <form key={`step-${stepKey}`} onSubmit={handleIdentify} className="space-y-4">
                  <div className="text-center mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">Find Your Account</h2>
                    <p className="text-xs text-slate-500 mt-1">Enter your registered Gmail address</p>
                  </div>

                  <div>
                    <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gmail Address</label>
                    <div className="input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <input 
                        type="email" 
                        value={accountName} 
                        onChange={(e) => setAccountName(e.target.value)} 
                        placeholder="example@gmail.com" 
                        required 
                        disabled={loading} 
                        className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400 w-full" 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="submit-btn w-full py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm disabled:opacity-60 flex items-center justify-center gap-2"
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
                        Finding Account...
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form key={`step-${stepKey}`} onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">Enter Security Code</h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      We sent a 4-digit verification code to <strong className="text-slate-700">{maskedEmail}</strong>.
                    </p>
                  </div>

                  <div className="flex justify-center gap-3.5 my-6">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-digit-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-14 text-center font-bold text-2xl rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:border-[#1a5c2a] focus:ring-4 focus:ring-green-900/10 text-slate-800 transition-all"
                        required
                        autoComplete="off"
                        disabled={loading}
                      />
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => goToStep(1)}
                      className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 transition cursor-pointer"
                    >
                      Review Details
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || otpDigits.some(d => !d)}
                      className="submit-btn flex-[2] py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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
                          Verifying...
                        </>
                      ) : (
                        <>
                          <span>Verify Code</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center mt-6">
                    {timer > 0 ? (
                      <p className="text-xs text-slate-500">
                        Resend code in <span className="font-semibold font-mono text-orange-500">{timer}s</span>
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Didn't get a code?</p>
                        <button 
                          type="button" 
                          onClick={handleResendOtp} 
                          className="text-xs font-bold text-[#1a5c2a] hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                        >
                          Resend Code
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              )}

              {step === 3 && (
                <form key={`step-${stepKey}`} onSubmit={handleResetPassword} className="space-y-4">
                  <div className="text-center mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">Set New Password</h2>
                    <p className="text-xs text-slate-500 mt-1">Create a strong password to secure your account</p>
                  </div>

                  <div>
                    <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Password <span className="text-red-500">*</span></label>
                    <div className="input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                      <Lock size={14} className="input-icon text-slate-400 shrink-0" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                        required 
                        disabled={loading} 
                        className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="text-slate-400 shrink-0"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
                                <p className="font-bold text-slate-300 border-b border-slate-700 pb-1.5 mb-1.5">Requirements:</p>
                                <div className="flex items-center gap-2.5">
                                  <span className={isMinLength ? 'text-green-400 font-bold' : 'text-slate-500 font-bold'}>{isMinLength ? '✓' : '✗'}</span>
                                  <span className={isMinLength ? 'text-slate-100 font-semibold' : 'text-slate-400'}>Min. 8 characters</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <span className={hasUppercase ? 'text-green-400 font-bold' : 'text-slate-500 font-bold'}>{hasUppercase ? '✓' : '✗'}</span>
                                  <span className={hasUppercase ? 'text-slate-100 font-semibold' : 'text-slate-400'}>One uppercase letter</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <span className={hasDigit ? 'text-green-400 font-bold' : 'text-slate-500 font-bold'}>{hasDigit ? '✓' : '✗'}</span>
                                  <span className={hasDigit ? 'text-slate-100 font-semibold' : 'text-slate-400'}>One number</span>
                                </div>
                                <div className="flex items-center gap-2.5">
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
                    <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                    <div className="input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                      <Lock size={14} className="input-icon text-slate-400 shrink-0" />
                      <input 
                        type={showConfirm ? 'text' : 'password'} 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder="••••••••" 
                        required 
                        disabled={loading} 
                        className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirm(!showConfirm)} 
                        className="text-slate-400 shrink-0"
                      >
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <p className="text-red-500 text-[10px] font-semibold mt-1">Passwords do not match</p>
                    )}
                    {confirmPassword.length > 0 && passwordsMatch && (
                      <p className="text-green-600 text-[10px] font-semibold mt-1">✓ Passwords match</p>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !isPasswordValid || !passwordsMatch} 
                    className="submit-btn w-full py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm disabled:opacity-60 flex items-center justify-center gap-2"
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
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === 4 && (
                <div key={`step-${stepKey}`} className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-100">
                    <Check size={32} className="text-green-600" strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2">Password Reset Successful!</h3>
                    <p className="text-xs text-slate-500 leading-relaxed px-4">
                      Your password has been changed. You can now use your new credentials to sign in.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="submit-btn w-full py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm"
                    style={{ 
                      backgroundColor: '#1a5c2a',
                      boxShadow: '0 4px 15px rgba(26, 92, 42, 0.2)' 
                    }}
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}