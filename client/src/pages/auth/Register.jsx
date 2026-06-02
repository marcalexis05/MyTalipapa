import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Lock, Eye, EyeOff, Store, ShoppingBag, Edit, Search, Check, ArrowRight } from 'lucide-react'

const registerStyles = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(24px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeSlideBack {
    from { opacity: 0; transform: translateX(-24px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes successBounce {
    0% { opacity: 0; transform: scale(0.4) translateY(10px); }
    60% { transform: scale(1.12); }
    80% { transform: scale(0.96); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes successFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes stallPop {
    0% { transform: scale(1); }
    35% { transform: scale(1.07); }
    65% { transform: scale(0.97); }
    100% { transform: scale(1); }
  }
  @keyframes progressGrow {
    from { width: 0%; }
    to { width: var(--progress-width); }
  }
  @keyframes logoBounce {
    0%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
    60% { transform: translateY(-3px); }
  }
  .reg-card {
    animation: fadeSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .reg-logo {
    animation: fadeSlideUp 0.4s ease both;
  }
  .reg-logo-icon {
    animation: logoBounce 0.7s ease 0.25s both;
    transition: transform 0.2s ease;
  }
  .step-forward {
    animation: fadeSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .step-backward {
    animation: fadeSlideBack 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
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
  .role-card {
    transition: border-color 0.22s ease, background-color 0.22s ease, transform 0.18s ease, box-shadow 0.18s ease;
  }
  .role-card:hover:not([data-selected="true"]) {
    border-color: #9ca3af;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.07);
  }
  .role-card[data-selected="true"] {
    transform: scale(1.02);
    box-shadow: 0 4px 16px rgba(26,92,42,0.18);
  }
  .role-icon {
    transition: background-color 0.22s ease, transform 0.18s ease;
  }
  .role-card[data-selected="true"] .role-icon {
    transform: scale(1.1);
  }
  .input-field {
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }
  .input-field:focus-within {
    border-color: #1a5c2a !important;
    box-shadow: 0 0 0 3px rgba(26,92,42,0.12);
    background-color: #fff !important;
  }
  .stall-card {
    transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.18s ease, box-shadow 0.18s ease;
  }
  .stall-card:not(:disabled):hover {
    border-color: #6b7280 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .stall-card[data-selected="true"] {
    animation: stallPop 0.3s ease both;
    box-shadow: 0 2px 10px rgba(26,92,42,0.15);
  }
  .progress-bar {
    transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .success-emoji {
    animation: successBounce 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
    display: inline-block;
  }
  .success-text {
    animation: successFadeUp 0.4s ease 0.2s both;
  }
  .success-btn {
    animation: successFadeUp 0.4s ease 0.35s both;
    position: relative;
    overflow: hidden;
    transition: opacity 0.2s ease, transform 0.15s ease;
  }
  .success-btn:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }
  .checklist-row {
    transition: color 0.25s ease;
  }
  .zone-btn {
    transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.15s ease;
  }
  .zone-btn:hover {
    transform: scale(1.04);
  }
  .zone-btn:active {
    transform: scale(0.96);
  }
  .back-btn-inline {
    transition: color 0.15s ease, transform 0.15s ease;
  }
  .back-btn-inline:hover {
    transform: translateX(-2px);
  }
  .back-btn-top {
    transition: background-color 0.2s ease, transform 0.15s ease;
  }
  .back-btn-top:hover {
    transform: translateX(-2px);
  }
  .next-btn {
    position: relative;
    overflow: hidden;
    transition: background-color 0.2s ease, transform 0.15s ease, opacity 0.2s ease;
  }
  .next-btn:not(:disabled):hover {
    transform: translateY(-1px);
  }
  .next-btn:not(:disabled):active {
    transform: scale(0.97);
  }
  .next-btn:not(:disabled)::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    background-size: 200% 100%;
    animation: shimmer 1.8s infinite;
  }
  .scrollbar-none::-webkit-scrollbar { display: none; }
  .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-thin::-webkit-scrollbar { width: 4px; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
  .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
`

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [stepDir, setStepDir] = useState('forward')
  const [stepKey, setStepKey] = useState(1)
  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    email: '',
    contact_number: '',
    password: '',
    confirm_password: '',
    role: '',
    agreed: false
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)

  const [stalls, setStalls] = useState([])
  const [loadingStalls, setLoadingStalls] = useState(false)
  const [selectedStalls, setSelectedStalls] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedZone, setSelectedZone] = useState('All')

  function goToStep(n, dir = 'forward') {
    setStepDir(dir)
    setStepKey(n)
    setStep(n)
  }

  function handleChange(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: val })
  }

  function handlePhoneChange(e) {
    let val = e.target.value.replace(/\D/g, '')
    if (val.startsWith('63')) val = val.substring(2)
    else if (val.startsWith('09')) val = val.substring(1)
    if (val.length <= 10) setForm(prev => ({ ...prev, contact_number: val }))
  }

  const isMinLength = form.password.length >= 8
  const hasUppercase = /[A-Z]/.test(form.password)
  const hasDigit = /[0-9]/.test(form.password)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(form.password)
  const isPasswordValid = isMinLength && hasUppercase && hasDigit && hasSpecial
  const passwordsMatch = form.confirm_password.length > 0 && form.confirm_password === form.password
  const isPhoneValid = form.contact_number.length === 10 && form.contact_number.startsWith('9')
  const isEmailValid = form.email.trim().includes('@')

  const isFormValid =
    form.full_name.trim().length > 0 &&
    (form.role !== 'contractor' || form.business_name.trim().length > 0) &&
    isEmailValid && isPasswordValid && passwordsMatch && isPhoneValid && form.agreed && form.role

  function selectRole(role) { setForm({ ...form, role }); setError(null) }

  async function fetchStalls() {
    setLoadingStalls(true); setError(null)
    try {
      const response = await fetch('/api/contractor/stalls?unmanaged=true')
      if (!response.ok) throw new Error('Failed to fetch stalls')
      setStalls(await response.json())
    } catch (err) {
      setError('Failed to load stalls. Please try again.')
    } finally {
      setLoadingStalls(false)
    }
  }

  const totalMonthlyRate = useMemo(() =>
    selectedStalls.reduce((sum, stallNum) => {
      const stall = stalls.find(s => s.location === stallNum)
      return sum + (stall?.monthlyRate || 0)
    }, 0), [selectedStalls, stalls])

  const zones = useMemo(() => {
    const sections = stalls.map(s => s.section).filter(Boolean)
    return ['All', ...new Set(sections)]
  }, [stalls])

  const filteredStalls = useMemo(() =>
    stalls.filter(stall => {
      const matchesSearch =
        stall.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stall.section.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesZone = selectedZone === 'All' || stall.section.toLowerCase() === selectedZone.toLowerCase()
      return matchesSearch && matchesZone
    }), [stalls, searchQuery, selectedZone])

  async function handleRegister(e) {
    e.preventDefault()
    setError(null); setDebugInfo(null)
    if (!form.role) { setError('Please select whether you are a Renter or Contractor.'); return }
    if (form.role === 'contractor' && !form.business_name) { setError('Please enter your business name.'); return }
    if (!isPasswordValid) { setError('Password does not meet the requirements.'); return }
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return }
    if (!isPhoneValid) { setError('Please enter a valid PH mobile number.'); return }
    if (!isEmailValid) { setError('Please enter a valid email address.'); return }
    if (!form.agreed) { setError('Please agree to the Terms and Privacy Policy.'); return }

    if (form.role === 'contractor') { await fetchStalls(); goToStep(2, 'forward'); return }

    setLoading(true)
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          contact_number: `+63${form.contact_number}`,
          role: form.role, email: form.email,
          password: form.password, agreed: form.agreed,
        }),
      })
      const result = await response.json()
      setDebugInfo({ error: result.error ?? null, user_id: result.user?.id ?? null, user_email: result.user?.email ?? null, session: result.session ? 'present' : 'null', identities_count: result.user?.identities?.length ?? 'n/a', raw: JSON.stringify(result, null, 2) })
      if (!response.ok) { setError(result.error || 'Registration failed'); setLoading(false); return }
      if (result.token) localStorage.setItem('authToken', result.token)
      if (result.user) localStorage.setItem('user', JSON.stringify(result.user))
      setSuccess('immediate')
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitContractorApplication() {
    setError(null); setLoading(true)
    try {
      const response = await fetch('/api/contractor/register-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.full_name, businessName: form.business_name,
          email: form.email, password: form.password,
          contactNumber: `+63${form.contact_number}`, selectedStalls,
        }),
      })
      const result = await response.json()
      if (!response.ok) { setError(result.error || 'Application submission failed'); setLoading(false); return }
      setSuccess('contractor_pending')
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const stepClass = stepDir === 'forward' ? 'step-forward' : 'step-backward'

  return (
    <>
      <style>{registerStyles}</style>
      <div
        className="min-h-screen flex flex-col relative"
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
          className="back-btn-top absolute top-4 left-4 z-20 flex items-center gap-1 text-sm font-semibold bg-[#1a5c2a] rounded-md shadow p-2 text-white hover:bg-[#163721] transition-colors"
        >
          ← Back
        </button>

        <div className="reg-logo h-32 sm:h-40 flex items-center justify-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="reg-logo-icon w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <img src="/logo.png" alt="MyTalipapa Logo" className="h-7 w-auto object-contain" />
            </div>
            <span className="text-white text-2xl font-bold drop-shadow">MyTalipapa</span>
          </div>
        </div>

        <div className="flex-1 flex items-start justify-center px-4 -mt-6 pb-10 relative z-10">
          <div className={`w-full ${step === 2 || step === 3 ? 'max-w-md' : 'max-w-sm'}`}>
            <div className="reg-card bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 relative">

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
              )}



              {success === 'immediate' && (
                <div className="text-center py-6">
                  <div className="text-5xl mb-4 success-emoji"></div>
                  <div className="success-text">
                    <h3 className="font-bold text-gray-800 text-lg mb-2">Account created! Please check your email for verification link.</h3>
                    <p className="text-sm text-gray-500 mb-6">Welcome, <strong>{form.full_name}</strong>!</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="success-btn inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold w-full"
                      style={{ backgroundColor: '#1a5c2a' }}
                    >
                      Go to Login
                    </button>
                  </div>
                </div>
              )}

              {success === 'contractor_pending' && (
                <div className="text-center py-6">
                  <div className="text-5xl mb-4 success-emoji"></div>
                  <div className="success-text">
                    <h3 className="font-bold text-gray-800 text-lg mb-2">Application Submitted!</h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                      Your registration is being reviewed by the Admin. You will be notified via SMS/email once approved.
                    </p>
                    <button
                      onClick={() => navigate('/login')}
                      className="success-btn inline-block px-6 py-3 rounded-xl text-white text-sm font-semibold w-full"
                      style={{ backgroundColor: '#1a5c2a' }}
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              )}

              {!success && (
                <>
                  {step === 1 && (
                    <form key={`step-${stepKey}`} onSubmit={handleRegister} className={`${stepClass} space-y-4`}>
                      <h2 className="text-lg font-bold text-gray-800 mb-1">Create your account</h2>
                      <p className="text-xs text-gray-500 mb-2">Fill in your details to get started</p>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Register as:</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button type="button" onClick={() => selectRole('renter')}
                            data-selected={form.role === 'renter' ? 'true' : 'false'}
                            className={`role-card flex flex-col items-center gap-2 p-4 rounded-2xl border-2 ${form.role === 'renter' ? 'border-green-700 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className={`role-icon w-10 h-10 rounded-xl flex items-center justify-center ${form.role === 'renter' ? 'bg-green-700' : 'bg-gray-200'}`}>
                              <ShoppingBag size={20} className={form.role === 'renter' ? 'text-white' : 'text-gray-500'} />
                            </div>
                            <div className="text-center">
                              <p className={`text-sm font-semibold ${form.role === 'renter' ? 'text-green-800' : 'text-gray-700'}`}>Renter</p>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">I want to rent a stall</p>
                            </div>
                            {form.role === 'renter' && <span className="text-xs font-bold text-green-700">✓ Selected</span>}
                          </button>

                          <button type="button" onClick={() => selectRole('contractor')}
                            data-selected={form.role === 'contractor' ? 'true' : 'false'}
                            className={`role-card flex flex-col items-center gap-2 p-4 rounded-2xl border-2 ${form.role === 'contractor' ? 'border-green-700 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className={`role-icon w-10 h-10 rounded-xl flex items-center justify-center ${form.role === 'contractor' ? 'bg-green-700' : 'bg-gray-200'}`}>
                              <Store size={20} className={form.role === 'contractor' ? 'text-white' : 'text-gray-500'} />
                            </div>
                            <div className="text-center">
                              <p className={`text-sm font-semibold ${form.role === 'contractor' ? 'text-green-800' : 'text-gray-700'}`}>Contractor</p>
                              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">I manage stalls</p>
                            </div>
                            {form.role === 'contractor' && <span className="text-xs font-bold text-green-700">✓ Selected</span>}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Full Name</label>
                        <div className="input-field flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                          <User size={16} className="text-gray-400 shrink-0" />
                          <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Juan Dela Cruz" required className="flex-1 bg-transparent text-sm focus:outline-none" />
                          {form.full_name && <button type="button" onClick={() => setForm({ ...form, full_name: '' })} className="text-gray-400 transition-transform hover:scale-110">✕</button>}
                        </div>
                      </div>

                      {form.role === 'contractor' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Business Name</label>
                          <div className="input-field flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                            <Store size={16} className="text-gray-400 shrink-0" />
                            <input type="text" name="business_name" value={form.business_name} onChange={handleChange} placeholder="Juan's Organic Produce" required className="flex-1 bg-transparent text-sm focus:outline-none" />
                            {form.business_name && <button type="button" onClick={() => setForm({ ...form, business_name: '' })} className="text-gray-400 transition-transform hover:scale-110">✕</button>}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Contact Number</label>
                        <div className={`input-field flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${form.contact_number.length === 0 ? 'border-gray-200 bg-gray-50' : isPhoneValid ? 'border-green-600 bg-green-50/20' : 'border-red-500 bg-red-50/20'}`}>
                          <Phone size={16} className="text-gray-400 shrink-0" />
                          <span className="text-gray-500 text-sm font-semibold select-none shrink-0">+63</span>
                          <input type="tel" name="contact_number" value={form.contact_number} onChange={handlePhoneChange} placeholder="9171234567" required className="flex-1 bg-transparent text-sm focus:outline-none" />
                          {isPhoneValid && <Check size={16} className="text-green-600 shrink-0" strokeWidth={3} />}
                          {form.contact_number && <button type="button" onClick={() => setForm({ ...form, contact_number: '' })} className="text-gray-400 transition-transform hover:scale-110">✕</button>}
                        </div>
                        {form.contact_number.length > 0 && !isPhoneValid && <p className="text-red-500 text-[11px] font-semibold mt-1">Enter a valid PH mobile number</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Email Address</label>
                        <div className={`input-field flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${form.email.length === 0 ? 'border-gray-200 bg-gray-50' : isEmailValid ? 'border-green-600 bg-green-50/20' : 'border-red-500 bg-red-50/20'}`}>
                          <Mail size={16} className="text-gray-400 shrink-0" />
                          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="juan@mytalipapa.ph" required className="flex-1 bg-transparent text-sm focus:outline-none" />
                          {isEmailValid && <Check size={16} className="text-green-600 shrink-0" strokeWidth={3} />}
                          {form.email && <button type="button" onClick={() => setForm({ ...form, email: '' })} className="text-gray-400 transition-transform hover:scale-110">✕</button>}
                        </div>
                        {form.email.length > 0 && !isEmailValid && <p className="text-red-500 text-[11px] font-semibold mt-1">Enter a valid email address containing @</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
                        <div className={`input-field flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${form.password.length === 0 ? 'border-gray-200 bg-gray-50' : isPasswordValid ? 'border-green-600 bg-green-50/20' : 'border-gray-200 bg-gray-50'}`}>
                          <Lock size={16} className="text-gray-400 shrink-0" />
                          <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required className="flex-1 bg-transparent text-sm focus:outline-none" />
                          {isPasswordValid && <Check size={16} className="text-green-600 shrink-0" strokeWidth={3} />}
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 transition-transform hover:scale-110">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                        <div className="mt-2 space-y-1 text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                          <p className="font-semibold text-gray-500 mb-1">Password Strength Checklist:</p>
                          {[
                            [isMinLength, 'Minimum 8 characters'],
                            [hasUppercase, 'At least 1 uppercase letter'],
                            [hasDigit, 'At least 1 number'],
                            [hasSpecial, 'At least 1 special character (e.g. !@#$%^&*)'],
                          ].map(([valid, label], i) => (
                            <div key={i} className="checklist-row flex items-center gap-1.5">
                              <span className={valid ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{valid ? '✓' : '✗'}</span>
                              <span className={valid ? 'text-green-700 font-medium' : 'text-gray-500'}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Confirm Password</label>
                        <div className={`input-field flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${form.confirm_password.length === 0 ? 'border-gray-200 bg-gray-50' : passwordsMatch ? 'border-green-600 bg-green-50/20' : 'border-red-500 bg-red-50/20'}`}>
                          <Lock size={16} className="text-gray-400 shrink-0" />
                          <input type={showConfirm ? 'text' : 'password'} name="confirm_password" value={form.confirm_password} onChange={handleChange} placeholder="••••••••" required className="flex-1 bg-transparent text-sm focus:outline-none" />
                          {passwordsMatch && <Check size={16} className="text-green-600 shrink-0" strokeWidth={3} />}
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 transition-transform hover:scale-110">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                        {form.confirm_password.length > 0 && !passwordsMatch && <p className="text-red-500 text-[11px] font-semibold mt-1">Passwords do not match</p>}
                        {form.confirm_password.length > 0 && passwordsMatch && <p className="text-green-600 text-[11px] font-semibold mt-1">✓ Passwords match</p>}
                      </div>

                      <div className="flex items-start gap-2">
                        <input type="checkbox" name="agreed" id="agreed" checked={form.agreed} onChange={handleChange} className="mt-0.5 accent-green-700" />
                        <label htmlFor="agreed" className="text-xs text-gray-500">
                          I agree to the{' '}
                          <a href="#" style={{ color: '#1a5c2a' }} className="font-semibold">Terms and Privacy Policy</a>
                        </label>
                      </div>

                      <button type="submit" disabled={loading || !isFormValid}
                        className="submit-btn w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#1a5c2a' }}>
                        {loading ? (
                          <><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Processing...</>
                        ) : (
                          <><span>{form.role === 'contractor' ? 'Next: Pick Stalls' : 'Register'}</span><span>→</span></>
                        )}
                      </button>
                    </form>
                  )}

                  {step === 2 && (
                    <div key={`step-${stepKey}`} className={stepClass}>
                      <button type="button" onClick={() => goToStep(1, 'backward')} className="back-btn-inline absolute top-6 left-6 text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-semibold">← Back</button>
                      <div className="pt-6">
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                          <span className="font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-md">Step 2 of 3 — Pick Stalls</span>
                          <span>66% Complete</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full mb-6 overflow-hidden">
                          <div className="progress-bar bg-green-700 h-full rounded-full" style={{ width: '66.6%' }}></div>
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-800 mb-1">Choose Your Stalls</h2>
                        <p className="text-xs text-gray-500 mb-5">Select the stalls you want to manage from the available list.</p>
                        <div className="space-y-3 mb-6">
                          <div className="input-field flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                            <Search size={16} className="text-gray-400 shrink-0" />
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search stall location or zone..." className="flex-1 bg-transparent text-sm focus:outline-none" />
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                            {zones.map(zone => (
                              <button key={zone} type="button" onClick={() => setSelectedZone(zone)}
                                className={`zone-btn px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${selectedZone === zone ? 'bg-green-700 border-green-700 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                {zone}
                              </button>
                            ))}
                          </div>
                        </div>
                        {loadingStalls ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                            <span className="text-xs text-gray-500">Loading stalls...</span>
                          </div>
                        ) : filteredStalls.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 text-sm">No stalls found matching your criteria.</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 mb-20 scrollbar-thin">
                            {filteredStalls.map(stall => {
                              const isSelected = selectedStalls.includes(stall.location)
                              const isAvailable = stall.status === 'available'
                              return (
                                <button key={stall._id} type="button" disabled={!isAvailable}
                                  data-selected={isSelected ? 'true' : 'false'}
                                  onClick={() => { if (isSelected) setSelectedStalls(selectedStalls.filter(s => s !== stall.location)); else setSelectedStalls([...selectedStalls, stall.location]) }}
                                  className={`stall-card flex flex-col text-left p-3.5 rounded-2xl border-2 relative ${isSelected ? 'border-green-700 bg-green-50/50' : isAvailable ? 'border-gray-200 bg-white hover:border-gray-300' : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'}`}>
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-extrabold text-sm text-gray-800">#{stall.location}</span>
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{stall.status.toUpperCase()}</span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-semibold mb-3 uppercase tracking-wider">{stall.section}</div>
                                  <div className="flex justify-between items-end mt-auto w-full text-[11px]">
                                    <div className="flex flex-col"><span className="text-gray-400">Size</span><span className="font-semibold text-gray-700">{stall.size} {stall.sizeUnit || 'sqm'}</span></div>
                                    <div className="flex flex-col text-right"><span className="text-gray-400">Rate</span><span className="font-bold text-green-700">₱{stall.monthlyRate?.toLocaleString()}/mo</span></div>
                                  </div>
                                  {isSelected && <div className="absolute top-2 right-2 bg-green-700 text-white rounded-full p-0.5"><Check size={10} strokeWidth={3} /></div>}
                                </button>
                              )
                            })}
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 rounded-b-3xl flex items-center justify-between z-10">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedStalls.length} stall{selectedStalls.length !== 1 ? 's' : ''} selected</span>
                            <span className="text-lg font-extrabold text-gray-800">₱{totalMonthlyRate.toLocaleString()}</span>
                          </div>
                          <button type="button" disabled={selectedStalls.length === 0} onClick={() => goToStep(3, 'forward')}
                            className="next-btn px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl disabled:opacity-60 flex items-center gap-1">
                            Next: Review <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div key={`step-${stepKey}`} className={stepClass}>
                      <button type="button" onClick={() => goToStep(2, 'backward')} className="back-btn-inline absolute top-6 left-6 text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-semibold">← Back</button>
                      <div className="pt-6">
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                          <span className="font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-md">Step 3 of 3</span>
                          <span>100% Complete</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full mb-6 overflow-hidden">
                          <div className="progress-bar bg-green-700 h-full rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-800 mb-1">Review & Submit</h2>
                        <p className="text-xs text-gray-500 mb-5">Please review your contractor details and selected stalls before submitting.</p>
                        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">{error}</div>}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 mb-5 relative">
                          <button type="button" onClick={() => goToStep(1, 'backward')} className="absolute top-4 right-4 p-1.5 bg-white border border-gray-200 text-gray-500 hover:text-green-700 rounded-lg hover:border-green-700 transition-all" title="Edit Details"><Edit size={14} /></button>
                          <div className="flex items-center gap-3 mb-3 text-left">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-extrabold text-sm">
                              {form.full_name ? form.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : ''}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-sm text-gray-800">{form.full_name}</h3>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{form.business_name}</span>
                            </div>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600 border-t border-gray-100 pt-3">
                            <div className="flex justify-between"><span>Phone:</span><span className="font-semibold">+63 {form.contact_number}</span></div>
                            <div className="flex justify-between"><span>Email:</span><span className="font-semibold">{form.email}</span></div>
                          </div>
                        </div>
                        <div className="mb-5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Selected Stalls</span>
                            <span className="text-[9px] bg-orange-100 text-orange-700 font-extrabold px-2 py-0.5 rounded-full">{selectedStalls.length} ITEMS</span>
                          </div>
                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                            {selectedStalls.map(stallNum => {
                              const stall = stalls.find(s => s.location === stallNum)
                              if (!stall) return null
                              return (
                                <div key={stall._id} className="flex items-center justify-between p-3 bg-white border border-gray-150 rounded-xl">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-green-50 text-green-800 border border-green-100 rounded-lg flex items-center justify-center font-extrabold text-xs">#{stall.location}</div>
                                    <div className="flex flex-col text-left">
                                      <span className="font-bold text-xs text-gray-800">{stall.section}</span>
                                      <span className="text-[9px] text-gray-400">{stall.size} sqm</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-extrabold text-xs text-green-700">₱{stall.monthlyRate?.toLocaleString()}</span>
                                    <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Monthly</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-3 border-t border-b border-gray-100 mb-5">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Monthly Commitment</span>
                          <span className="text-lg font-extrabold text-orange-600">₱{totalMonthlyRate.toLocaleString()}</span>
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-150 rounded-2xl flex items-start gap-2.5 mb-6 text-left">
                          <span className="text-base mt-0.5">📋</span>
                          <p className="text-[10px] text-blue-800 font-semibold leading-relaxed">Your registration will be reviewed by the Admin. You will be notified via SMS/email once approved.</p>
                        </div>
                        <button type="button" disabled={loading} onClick={handleSubmitContractorApplication}
                          className="submit-btn w-full py-3.5 bg-green-700 hover:bg-green-800 text-white font-extrabold text-sm rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
                          {loading ? (
                            <><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Submitting...</>
                          ) : 'Submit for Review →'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!success && step === 1 && (
                <p className="text-center text-sm text-gray-500 mt-5">
                  Already have an account?{' '}
                  <a href="/login" style={{ color: '#1a5c2a' }} className="font-semibold">Login</a>
                </p>
              )}
            </div>

            <p className="text-center text-xs text-gray-300 mt-6">
              © 2026 MyTalipapa Market Management. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}