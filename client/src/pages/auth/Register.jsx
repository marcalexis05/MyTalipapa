import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Store, Edit, Search, Check, ArrowRight, ArrowLeft, HelpCircle, ChevronDown, X } from 'lucide-react';

const registerStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  
  .login-container {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background-color: #070e0a;
    position: relative;
    overflow-x: hidden;
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
  .divider-line {
    background: linear-gradient(90deg, transparent, rgba(226, 232, 240, 1) 50%, transparent);
  }
  .scrollbar-none::-webkit-scrollbar { display: none; }
  .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-thin::-webkit-scrollbar { width: 4px; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
  .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
  
  .stall-card {
    transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.18s ease, box-shadow 0.18s ease;
  }
  .stall-card:not(:disabled):hover {
    border-color: #1a5c2a !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .stall-card[data-selected="true"] {
    box-shadow: 0 4px 14px rgba(26, 92, 42, 0.15);
  }
`;

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(() => {
    if (location.state && location.state.step) {
      return location.state.step;
    }
    return 1;
  });
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const [form, setForm] = useState(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const stateRole = location.state?.role;
    const stateEmail = location.state?.email || '';
    const urlRole = queryParams.get('role') === 'contractor' ? 'contractor' : 'renter';
    return {
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      full_name: '',
      business_name: '',
      email: stateEmail || '',
      contact_number: '',
      password: '',
      confirm_password: '',
      role: stateRole || urlRole,
      agreed: false
    };
  });

  useEffect(() => {
    if (location.state && location.state.step) {
      setTimer(60);
      setIsRegistered(true);
      setOtpDigits(['', '', '', '']);
    }
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showStrengthTooltip, setShowStrengthTooltip] = useState(false);
  const [showSuffixDropdown, setShowSuffixDropdown] = useState(false);
  const suffixOptions = useMemo(() => ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'], []);
  const [timer, setTimer] = useState(0);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [isRegistered, setIsRegistered] = useState(() => {
    return !!(location?.state && location?.state?.step);
  });
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpDigitChange = (value, idx) => {
    const cleanVal = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[idx] = cleanVal.slice(-1);
    setOtpDigits(newDigits);

    if (cleanVal && idx < 3) {
      const nextInput = document.getElementById(`otp-digit-${idx + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      const prevInput = document.getElementById(`otp-digit-${idx - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newDigits = [...otpDigits];
        newDigits[idx - 1] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 4; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);

    // Auto-focus last pasted digit or the last box
    const focusIndex = Math.min(pastedData.length, 3);
    const targetInput = document.getElementById(`otp-digit-${focusIndex}`);
    if (targetInput) {
      targetInput.focus();
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to resend verification code');
        return;
      }
      setTimer(60);
      setOtpDigits(['', '', '', '']);
      setTimeout(() => {
        const first = document.getElementById('otp-digit-0');
        if (first) first.focus();
      }, 50);
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegistration = async (e) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 4) {
      setError('Please enter the 4-digit code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Verification failed');
        return;
      }
      
      if (form.role === 'contractor') {
        setSuccess('contractor_pending');
      } else {
        setSuccess('immediate');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [stalls, setStalls] = useState([]);
  const [loadingStalls, setLoadingStalls] = useState(false);
  const [selectedStalls, setSelectedStalls] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 500) {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount === 4) {
        navigate('/admin-login');
      }
    } else {
      setClickCount(0);
    }
    setLastClickTime(now);
  };

  const goToStep = (n) => {
    setStep(n);
  };

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: val }));
  };

  const handleNameChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      const parts = [
        next.first_name,
        next.middle_name,
        next.last_name,
        next.suffix
      ].map(p => (p || '').trim()).filter(Boolean);
      next.full_name = parts.join(' ');
      return next;
    });
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('63')) val = val.substring(2);
    else if (val.startsWith('09')) val = val.substring(1);
    if (val.length <= 10) {
      setForm(prev => ({ ...prev, contact_number: val }));
    }
  };

  const isMinLength = form.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasDigit = /[0-9]/.test(form.password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(form.password);
  const isPasswordValid = isMinLength && hasUppercase && hasDigit && hasSpecial;
  const passwordsMatch = form.confirm_password.length > 0 && form.confirm_password === form.password;
  const isPhoneValid = form.contact_number.length === 10 && form.contact_number.startsWith('9');
  const isEmailValid = form.email.trim().includes('@');

  // Step validation
  const isStep1Valid = useMemo(() => {
    const common = form.first_name.trim().length > 0 && 
                   form.last_name.trim().length > 0 && 
                   isPhoneValid && 
                   isEmailValid;
    if (form.role === 'contractor') {
      return common && form.business_name.trim().length > 0;
    }
    return common;
  }, [form.first_name, form.last_name, isPhoneValid, isEmailValid, form.role, form.business_name]);

  const isStep2Valid = useMemo(() => {
    return isPasswordValid && passwordsMatch && form.agreed;
  }, [isPasswordValid, passwordsMatch, form.agreed]);

  // Password strength calculator
  const passwordStrength = useMemo(() => {
    if (!form.password) return { score: 0, label: '', color: 'text-slate-400', barColor: 'bg-slate-200' };
    if (form.password.length < 8) return { score: 1, label: 'Weak (too short)', color: 'text-red-500', barColor: 'bg-red-500' };
    
    let score = 1;
    if (/[A-Z]/.test(form.password)) score++;
    if (/[0-9]/.test(form.password)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(form.password)) score++;
    
    if (score <= 2) {
      return { score: 1, label: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' };
    } else if (score === 3) {
      return { score: 2, label: 'Medium', color: 'text-orange-500', barColor: 'bg-orange-500' };
    } else {
      return { score: 3, label: 'Strong', color: 'text-green-600', barColor: 'bg-green-600' };
    }
  }, [form.password]);

  async function fetchStalls() {
    setLoadingStalls(true);
    setError(null);
    try {
      const response = await fetch('/api/contractor/stalls?unmanaged=true');
      if (!response.ok) throw new Error('Failed to fetch stalls');
      setStalls(await response.json());
    } catch (err) {
      setError('Failed to load stalls. Please try again.');
    } finally {
      setLoadingStalls(false);
    }
  }

  const totalMonthlyRate = useMemo(() =>
    selectedStalls.reduce((sum, stallNum) => {
      const stall = stalls.find(s => s.location === stallNum);
      return sum + (stall?.monthlyRate || 0);
    }, 0), [selectedStalls, stalls]);

  const zones = useMemo(() => {
    const sections = stalls.map(s => s.section).filter(Boolean);
    return ['All', ...new Set(sections)];
  }, [stalls]);

  const filteredStalls = useMemo(() =>
    stalls.filter(stall => {
      const matchesSearch =
        stall.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stall.section.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesZone = selectedZone === 'All' || stall.section.toLowerCase() === selectedZone.toLowerCase();
      return matchesSearch && matchesZone;
    }), [stalls, searchQuery, selectedZone]);

  // Submit Step 2 (either registers renter immediately or moves contractor to Step 3)
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!isStep2Valid) return;

    if (form.role === 'contractor') {
      await fetchStalls();
      goToStep(3);
    } else {
      if (isRegistered) {
        goToStep(3);
        return;
      }
      // Renter registration API call
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: form.first_name,
            middle_name: form.middle_name,
            last_name: form.last_name,
            suffix: form.suffix,
            full_name: form.full_name,
            contact_number: `+63${form.contact_number}`,
            role: form.role,
            email: form.email,
            password: form.password,
            agreed: form.agreed,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || 'Registration failed');
          setLoading(false);
          return;
        }
        setIsRegistered(true);
        setTimer(60);
        setOtpDigits(['', '', '', '']);
        goToStep(3);
      } catch (err) {
        setError('Network error: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  async function handleSubmitContractorApplication() {
    if (isRegistered) {
      goToStep(5);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/contractor/register-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.first_name,
          middleName: form.middle_name,
          lastName: form.last_name,
          suffix: form.suffix,
          fullName: form.full_name,
          businessName: form.business_name,
          email: form.email,
          password: form.password,
          contactNumber: `+63${form.contact_number}`,
          selectedStalls,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Application submission failed');
        setLoading(false);
        return;
      }
      setIsRegistered(true);
      setTimer(60);
      setOtpDigits(['', '', '', '']);
      goToStep(5);
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Stepper titles helper
  const stepTitles = form.role === 'contractor' 
    ? ['Details', 'Security', 'Stalls', 'Review', 'Verification']
    : ['Details', 'Security', 'Verification'];

  return (
    <>
      <style>{registerStyles}</style>
      <div className="login-container min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 relative">
        {/* Background Components */}
        <div className="mesh-gradient" />
        <div className="grid-pattern" />
        <div className="glow-blob blob-1" />
        <div className="glow-blob blob-2" />

        {(step < (form.role === 'contractor' ? 5 : 3) || (isRegistered && !success)) && (
          <button
            onClick={() => {
              if (isRegistered) {
                if (step === (form.role === 'contractor' ? 5 : 3)) {
                  goToStep(1);
                } else {
                  goToStep(form.role === 'contractor' ? 5 : 3);
                }
              } else {
                if (step === 1) navigate('/');
                else goToStep(step - 1);
              }
            }}
            className="back-btn absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white transition-all duration-300 shadow-lg"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        <div className={`w-full relative z-10 px-2 flex flex-col justify-center transition-all duration-300 ${
          step >= 3 ? 'max-w-[480px] sm:max-w-[550px]' : 'max-w-[390px] sm:max-w-[420px]'
        }`}>
          
          <div className="login-logo flex flex-col items-center mb-6 sm:mb-8">
            <div 
              className="login-logo-icon w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center mb-2 sm:mb-4 cursor-pointer shadow-2xl border border-white/10" 
              style={{ backgroundColor: '#1a5c2a' }}
              onClick={handleLogoClick}
            >
              <img src="/logo.png" alt="MyTalipapa Logo" className="h-7 w-auto sm:h-9 object-contain" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">MyTalipapa</h1>
          </div>

          <div className="login-card rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-white/50">
            
            {/* Stepper Progress Wizard */}
            {!success && (
              <div className="flex items-center justify-between mb-6 sm:mb-8 px-1 select-none">
                {stepTitles.map((title, idx) => {
                  const stepNum = idx + 1;
                  const isActive = step === stepNum;
                  const isCompleted = step > stepNum;
                  return (
                    <div key={idx} className="flex items-center flex-1 last:flex-initial">
                      <div className="flex flex-col items-center relative">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs transition-all duration-300 ${
                          isActive 
                            ? 'bg-[#1a5c2a] text-white ring-4 ring-green-900/10' 
                            : isCompleted 
                              ? 'bg-green-600 text-white' 
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {isCompleted ? <Check size={12} strokeWidth={3.5} /> : stepNum}
                        </div>
                        <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mt-1.5 transition-colors duration-300 ${
                          isActive ? 'text-[#1a5c2a]' : 'text-slate-400'
                        }`}>
                          {title}
                        </span>
                      </div>
                      {idx < stepTitles.length - 1 && (
                        <div className="flex-1 h-0.5 mx-2 -mt-4 transition-all duration-500" style={{
                          backgroundColor: isCompleted ? '#16a34a' : '#e2e8f0'
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="login-error mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}

            {/* Success States */}
            {success === 'immediate' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-100">
                  <Check size={32} className="text-green-600" strokeWidth={3} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">Email Verified!</h3>
                <p className="text-xs text-slate-500 mb-6 px-4">
                  Your account has been successfully verified, <strong>{form.full_name}</strong>. You can now log in to the portal.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="submit-btn w-full py-3.5 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: '#1a5c2a' }}
                >
                  Go to Login
                </button>
              </div>
            )}

            {success === 'contractor_pending' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-100">
                  <Check size={32} className="text-green-600" strokeWidth={3} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">Application Submitted!</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed px-4">
                  Your email has been verified and your contractor application has been successfully submitted! It is now being reviewed by the Administration. You will be notified once approved.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="submit-btn w-full py-3.5 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: '#1a5c2a' }}
                >
                  Back to Login
                </button>
              </div>
            )}

            {/* Form Flow */}
            {!success && (
              <>
                {/* STEP 1: Details */}
                {step === 1 && (
                  <form onSubmit={(e) => { e.preventDefault(); if (isStep1Valid) goToStep(2); }} className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-800">Create your account</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Fill in your details to get started as a {form.role === 'contractor' ? 'Contractor' : 'Renter'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">First Name <span className="text-red-500">*</span></label>
                        <div className="input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                          <User size={14} className="input-icon text-slate-400 shrink-0" />
                          <input 
                            type="text" 
                            name="first_name" 
                            value={form.first_name} 
                            onChange={handleNameChange} 
                            placeholder="Juan" 
                            required 
                            className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none min-w-0 text-slate-800 placeholder-slate-400" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Middle Name / Initial</label>
                        <div className="input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                          <input 
                            type="text" 
                            name="middle_name" 
                            value={form.middle_name || ''} 
                            onChange={handleNameChange} 
                            placeholder="M. (Optional)" 
                            className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none min-w-0 text-slate-800 placeholder-slate-400" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Last Name <span className="text-red-500">*</span></label>
                        <div className="input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                          <input 
                            type="text" 
                            name="last_name" 
                            value={form.last_name} 
                            onChange={handleNameChange} 
                            placeholder="Dela Cruz" 
                            required 
                            className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none min-w-0 text-slate-800 placeholder-slate-400" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Suffix (Optional)</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowSuffixDropdown(!showSuffixDropdown)}
                            className="input-container w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-800 focus:outline-none"
                          >
                            <span className={form.suffix ? 'text-slate-800' : 'text-slate-400'}>
                              {form.suffix || 'None'}
                            </span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showSuffixDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          {showSuffixDropdown && (
                            <>
                              <div 
                                className="fixed inset-0 z-35" 
                                onClick={() => setShowSuffixDropdown(false)} 
                              />
                              <ul 
                                className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-150 rounded-xl shadow-xl z-40 py-1 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100"
                                style={{ transformOrigin: 'top' }}
                              >
                                {suffixOptions.map((opt) => (
                                  <li key={opt}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setForm(prev => {
                                          const next = { ...prev, suffix: opt };
                                          const parts = [
                                            next.first_name,
                                            next.middle_name,
                                            next.last_name,
                                            next.suffix
                                          ].map(p => (p || '').trim()).filter(Boolean);
                                          next.full_name = parts.join(' ');
                                          return next;
                                        });
                                        setShowSuffixDropdown(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-slate-50 transition-colors ${
                                        (form.suffix || '') === opt 
                                          ? 'font-bold text-[#1a5c2a] bg-green-50/40' 
                                          : 'text-slate-600'
                                      }`}
                                    >
                                      {opt || 'None'}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {form.role === 'contractor' && (
                      <div>
                        <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Business Name <span className="text-red-500">*</span></label>
                        <div className="input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                          <Store size={14} className="input-icon text-slate-400 shrink-0" />
                          <input 
                            type="text" 
                            name="business_name" 
                            value={form.business_name} 
                            onChange={handleChange} 
                            placeholder="Juan's Organic Produce" 
                            required 
                            className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400" 
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Number <span className="text-red-500">*</span></label>
                      <div className={`input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
                        form.contact_number.length === 0 
                          ? 'border-slate-200 bg-slate-50/70' 
                          : isPhoneValid 
                            ? 'border-green-600 bg-green-50/20' 
                            : 'border-red-400 bg-red-50/20'
                      }`}>
                        <Phone size={14} className="input-icon text-slate-400 shrink-0" />
                        <span className="text-slate-500 text-xs font-semibold select-none shrink-0">+63</span>
                        <input 
                          type="tel" 
                          name="contact_number" 
                          value={form.contact_number} 
                          onChange={handlePhoneChange} 
                          placeholder="9171234567" 
                          required 
                          className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400" 
                        />
                        {isPhoneValid && <Check size={14} className="text-green-600 shrink-0" strokeWidth={3} />}
                      </div>
                      {form.contact_number.length > 0 && !isPhoneValid && (
                        <p className="text-red-500 text-[10px] font-semibold mt-1">Enter a valid PH mobile number</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address <span className="text-red-500">*</span></label>
                      <div className={`input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
                        form.email.length === 0 
                          ? 'border-slate-200 bg-slate-50/70' 
                          : isEmailValid 
                            ? 'border-green-600 bg-green-50/20' 
                            : 'border-red-400 bg-red-50/20'
                      }`}>
                        <Mail size={14} className="input-icon text-slate-400 shrink-0" />
                        <input 
                          type="email" 
                          name="email" 
                          value={form.email} 
                          onChange={handleChange} 
                          placeholder="juan@mytalipapa.ph" 
                          required 
                          className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400" 
                        />
                        {isEmailValid && <Check size={14} className="text-green-600 shrink-0" strokeWidth={3} />}
                      </div>
                      {form.email.length > 0 && !isEmailValid && (
                        <p className="text-red-500 text-[10px] font-semibold mt-1">Enter a valid email address containing @</p>
                      )}
                    </div>

                    <button 
                      type="submit" 
                      disabled={!isStep1Valid}
                      className="submit-btn w-full py-3.5 mt-2 rounded-xl text-white font-bold text-xs sm:text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{ 
                        backgroundColor: '#1a5c2a',
                        boxShadow: '0 4px 15px rgba(26, 92, 42, 0.2)' 
                      }}
                    >
                      Next Step <ArrowRight size={14} className="arrow-icon" />
                    </button>
                  </form>
                )}

                {/* STEP 2: Password & Security */}
                {step === 2 && (
                  <form onSubmit={handleStep2Submit} className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-800">Set Password</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Choose a secure password for your account</p>
                    </div>

                    <div>
                      <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password <span className="text-red-500">*</span></label>
                      <div className={`input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
                        form.password.length === 0 
                          ? 'border-slate-200 bg-slate-50/70' 
                          : isPasswordValid 
                            ? 'border-green-600 bg-green-50/20' 
                            : 'border-slate-200 bg-slate-50/70'
                      }`}>
                        <Lock size={14} className="input-icon text-slate-400 shrink-0" />
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          name="password" 
                          value={form.password} 
                          onChange={handleChange} 
                          placeholder="••••••••" 
                          required 
                          className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)} 
                          className="clear-btn text-slate-400 shrink-0"
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
                      <div className={`input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
                        form.confirm_password.length === 0 
                          ? 'border-slate-200 bg-slate-50/70' 
                          : passwordsMatch 
                            ? 'border-green-600 bg-green-50/20' 
                            : 'border-red-400 bg-red-50/20'
                      }`}>
                        <Lock size={14} className="input-icon text-slate-400 shrink-0" />
                        <input 
                          type={showConfirm ? 'text' : 'password'} 
                          name="confirm_password" 
                          value={form.confirm_password} 
                          onChange={handleChange} 
                          placeholder="••••••••" 
                          required 
                          className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirm(!showConfirm)} 
                          className="clear-btn text-slate-400 shrink-0"
                        >
                          {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {form.confirm_password.length > 0 && !passwordsMatch && (
                        <p className="text-red-500 text-[10px] font-semibold mt-1">Passwords do not match</p>
                      )}
                      {form.confirm_password.length > 0 && passwordsMatch && (
                        <p className="text-green-600 text-[10px] font-semibold mt-1">✓ Passwords match</p>
                      )}
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <input 
                        type="checkbox" 
                        name="agreed" 
                        id="agreed" 
                        checked={form.agreed} 
                        onChange={handleChange} 
                        className="mt-0.5 accent-[#1a5c2a] w-4 h-4 cursor-pointer" 
                      />
                      <label htmlFor="agreed" className="text-[11px] text-slate-500 select-none cursor-pointer">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowTermsModal(true);
                          }}
                          style={{ color: '#1a5c2a' }}
                          className="font-bold hover:underline bg-transparent border-none p-0 inline font-inherit cursor-pointer"
                        >
                          Terms and Privacy Policy
                        </button>
                      </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 transition"
                      >
                        Back
                      </button>
                      <button 
                        type="submit" 
                        disabled={loading || !isStep2Valid}
                        className="submit-btn flex-[2] py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm disabled:opacity-60 flex items-center justify-center gap-2"
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
                            Registering...
                          </>
                        ) : (
                          <>
                            <span>{isRegistered ? 'Return to Verification' : (form.role === 'contractor' ? 'Next: Pick Stalls' : 'Register')}</span>
                            <ArrowRight size={14} className="arrow-icon" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Pick Stalls (Contractors Only) */}
                {step === 3 && form.role === 'contractor' && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-800">Choose Your Stalls</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Select the stalls you want to manage from the list.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="input-container flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input 
                          type="text" 
                          value={searchQuery} 
                          onChange={(e) => setSearchQuery(e.target.value)} 
                          placeholder="Search stall location or zone..." 
                          className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-800 placeholder-slate-400" 
                        />
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                        {zones.map(zone => (
                          <button 
                            key={zone} 
                            type="button" 
                            onClick={() => setSelectedZone(zone)}
                            className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all ${
                              selectedZone === zone 
                                ? 'bg-[#1a5c2a] border-[#1a5c2a] text-white shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {zone}
                          </button>
                        ))}
                      </div>
                    </div>

                    {loadingStalls ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5c2a]"></div>
                        <span className="text-xs text-slate-500">Loading stalls...</span>
                      </div>
                    ) : filteredStalls.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">No stalls found matching criteria.</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                        {filteredStalls.map(stall => {
                          const isSelected = selectedStalls.includes(stall.location);
                          const isAvailable = stall.status === 'available';
                          return (
                            <button 
                              key={stall._id} 
                              type="button" 
                              disabled={!isAvailable}
                              data-selected={isSelected ? 'true' : 'false'}
                              onClick={() => { 
                                if (isSelected) {
                                  setSelectedStalls(selectedStalls.filter(s => s !== stall.location));
                                } else {
                                  setSelectedStalls([...selectedStalls, stall.location]);
                                }
                              }}
                              className={`stall-card flex flex-col text-left p-3 rounded-xl border-2 relative transition-all ${
                                isSelected 
                                  ? 'border-[#1a5c2a] bg-green-50/50' 
                                  : isAvailable 
                                    ? 'border-slate-200 bg-white hover:border-slate-300' 
                                    : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full mb-1">
                                <span className="font-extrabold text-xs text-slate-800">#{stall.location}</span>
                                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                                  isAvailable ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {stall.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">{stall.section}</div>
                              <div className="flex justify-between items-end mt-auto w-full text-[10px]">
                                <div className="flex flex-col">
                                  <span className="text-slate-400 text-[8px]">Size</span>
                                  <span className="font-semibold text-slate-700">{stall.size} sqm</span>
                                </div>
                                <div className="flex flex-col text-right">
                                  <span className="text-slate-400 text-[8px]">Rate</span>
                                  <span className="font-bold text-green-700">₱{stall.monthlyRate?.toLocaleString()}</span>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 bg-[#1a5c2a] text-white rounded-full p-0.5">
                                  <Check size={8} strokeWidth={4} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-150 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          {selectedStalls.length} stall{selectedStalls.length !== 1 ? 's' : ''} selected
                        </span>
                        <span className="text-base font-extrabold text-slate-800">₱{totalMonthlyRate.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => goToStep(2)}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                        >
                          Back
                        </button>
                        <button 
                          type="button" 
                          disabled={selectedStalls.length === 0} 
                          onClick={() => goToStep(4)}
                          className="submit-btn px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl disabled:opacity-60 flex items-center gap-1 shadow-sm"
                        >
                          Next: Review <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Review & Submit (Contractors Only) */}
                {step === 4 && form.role === 'contractor' && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-800">Review & Submit</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Please review your details before submitting.</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 relative">
                      <button 
                        type="button" 
                        onClick={() => goToStep(1)} 
                        className="absolute top-4 right-4 p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-green-700 rounded-lg hover:border-green-700 transition-all" 
                        title="Edit Details"
                      >
                        <Edit size={12} />
                      </button>
                      <div className="flex items-center gap-3 mb-3 text-left">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-extrabold text-sm">
                          {form.full_name ? form.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : ''}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-800">{form.full_name}</h3>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{form.business_name}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        <div className="flex justify-between"><span>Phone:</span><span className="font-semibold">+63 {form.contact_number}</span></div>
                        <div className="flex justify-between"><span>Email:</span><span className="font-semibold">{form.email}</span></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Selected Stalls</span>
                        <span className="text-[9px] bg-orange-100 text-orange-700 font-extrabold px-2 py-0.5 rounded-full">{selectedStalls.length} ITEMS</span>
                      </div>
                      <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                        {selectedStalls.map(stallNum => {
                          const stall = stalls.find(s => s.location === stallNum);
                          if (!stall) return null;
                          return (
                            <div key={stall._id} className="flex items-center justify-between p-2.5 bg-white border border-slate-150 rounded-xl">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-50 text-green-800 border border-green-100 rounded-lg flex items-center justify-center font-extrabold text-xs">
                                  #{stall.location}
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="font-bold text-xs text-slate-800">{stall.section}</span>
                                  <span className="text-[9px] text-slate-400">{stall.size} sqm</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-xs text-green-700">₱{stall.monthlyRate?.toLocaleString()}</span>
                                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Monthly</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2.5 border-t border-b border-slate-150">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Monthly Commitment</span>
                      <span className="text-base font-extrabold text-orange-600">₱{totalMonthlyRate.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => goToStep(3)}
                        className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 transition"
                      >
                        Back
                      </button>
                      <button 
                        type="button" 
                        disabled={loading} 
                        onClick={handleSubmitContractorApplication}
                        className="submit-btn flex-[2] py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm disabled:opacity-60 flex items-center justify-center gap-2"
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
                            Submitting...
                          </>
                        ) : (
                          <>
                            {isRegistered ? 'Return to Verification' : 'Submit Application'}
                            <ArrowRight size={14} className="arrow-icon" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3 (Renter) / STEP 5 (Contractor): Verification */}
                {((step === 3 && form.role === 'renter') || (step === 5 && form.role === 'contractor')) && (
                  <form onSubmit={handleVerifyRegistration} className="space-y-4">
                    <div className="text-center mb-4">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-800">Enter your verification code</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Sent to <span className="font-semibold text-slate-750">{form.email}</span>
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
                        />
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => goToStep(1)}
                        className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 transition"
                      >
                        Review Details
                      </button>
                      <button 
                        type="submit" 
                        disabled={loading || otpDigits.some(d => !d)}
                        className="submit-btn flex-[2] py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm disabled:opacity-60 flex items-center justify-center gap-2"
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
                            onClick={handleResendVerification} 
                            className="text-xs font-bold text-[#1a5c2a] hover:underline"
                          >
                            Resend Code
                          </button>
                        </div>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}

            {/* Back to Login Footer Link */}
            {!success && step === 1 && (
              <>
                <div className="h-px divider-line my-5" />
                <p className="text-center text-xs text-slate-500">
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#1a5c2a' }} className="font-bold hover:underline">Login</Link>
                </p>
              </>
            )}

          </div>

          {/* Terms and Privacy Policy Modal */}
          {showTermsModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4" style={{ animation: 'fadeIn 0.25s ease both' }}>
              <div 
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl max-w-lg w-full border border-slate-100 flex flex-col max-h-[80vh]"
                style={{ animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both' }}
              >
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <h3 className="text-base sm:text-lg font-bold text-slate-850">Terms of Service & Privacy Policy</h3>
                  <button 
                    type="button" 
                    onClick={() => setShowTermsModal(false)}
                    className="text-slate-400 hover:text-slate-650 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="overflow-y-auto my-4 pr-2 text-xs text-slate-600 space-y-4 leading-relaxed font-normal text-left">
                  <section>
                    <h4 className="font-bold text-slate-800 mb-1">1. Welcome to MyTalipapa</h4>
                    <p>
                      By registering or using the MyTalipapa platform, you agree to comply with and be bound by our terms and conditions. If you do not agree, please do not access or use our services.
                    </p>
                  </section>
                  
                  <section>
                    <h4 className="font-bold text-slate-800 mb-1">2. Renter & Contractor Roles</h4>
                    <p>
                      Renters may apply to lease available market stalls, explore 360° virtual tours, and manage their applications. Contractors are responsible for managing and selecting stalls for market deployment. All users must provide accurate, verified information during registration.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-bold text-slate-800 mb-1">3. Privacy and Personal Data</h4>
                    <p>
                      We respect your privacy. Personal details such as your full name, email address, contact details, and business name will be collected and processed securely. This data is solely used to verify your identity, send OTP notifications, manage lease applications, and maintain administrative oversight.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-bold text-slate-800 mb-1">4. Account Verification & Safety</h4>
                    <p>
                      Accounts require a valid email to receive a 4-digit One-Time Password (OTP) for authentication. You are responsible for keeping your password secure and confidential. MyTalipapa staff will never ask for your verification code or login password.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-bold text-slate-800 mb-1">5. Policy Updates</h4>
                    <p>
                      MyTalipapa reserves the right to modify these terms and privacy guidelines at any time. Continued use of the platform constitutes your consent to any updated terms.
                    </p>
                  </section>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button 
                    type="button"
                    onClick={() => {
                      setForm(prev => ({ ...prev, agreed: true }));
                      setShowTermsModal(false);
                    }}
                    className="px-6 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer"
                    style={{ 
                      backgroundColor: '#1a5c2a',
                      boxShadow: '0 4px 12px rgba(26, 92, 42, 0.15)' 
                    }}
                  >
                    I Agree & Close
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