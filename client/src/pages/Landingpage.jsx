import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ChevronLeft, ChevronRight, CheckCircle2, MapPin, Navigation, Compass,
  TrendingUp, Layers, Users, FileText, ArrowUpRight, Lock, Calendar, Star, ShieldCheck,
  Menu, X, Search, Check
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import heroImage from '../images/1.png';
import arImage from '../images/2.png';
import tour360Preview from '../images/tour360_preview.png';
import marketLiveView from '../images/market_live_view.png';

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function CountUpTo({ target, trigger = true, duration = 1200 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    const end = parseInt(target, 10) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    
    const startTime = performance.now();
    let animationFrameId;

    const updateCount = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easeProgress * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration, trigger]);

  return <span>{count}</span>;
}

export default function Landingpage() {
  const navigate = useNavigate();
  const SHOW_AR_FINDER = true;
  const [stats, setStats] = useState({ totalStalls: 120, availableStalls: 15, occupiedStalls: 105 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [howItWorksTab, setHowItWorksTab] = useState('renter');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (ref) => {
    setMobileMenuOpen(false);
    if (ref.current) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = ref.current.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Slideshow State
  const slideshowImages = [
    { src: heroImage, title: 'Manage Stalls Effortlessly', desc: 'Real-time booking and inventory tracking' },
    { src: marketLiveView, title: 'Interactive Market Map', desc: 'Visualize occupied and available stalls instantly' },
    { src: arImage, title: 'AR Indoor Directory', desc: 'Guide customers to your stalls in real time' },
    { src: tour360Preview, title: '360° Virtual Tour', desc: 'Explore the market layout in 3D' }
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  // Contractor Slideshow State
  const [contractorSlide, setContractorSlide] = useState(0);
  const contractorSteps = [
    { step: "01", title: "Initialize Portal Application", desc: "Access the specialized Contractor Registration Portal directly from the portals link or the registration route.", tip: "Make sure the URL contains '?role=contractor' to enable contractor onboarding steps." },
    { step: "02", title: "Enter Business & Contact Info", desc: "Fill out the contractor application form, including your official business name and active mobile number.", tip: "This business name will represent your brand on all assigned stalls." },
    { step: "03", title: "Select Stalls to Manage", desc: "Browse the visual directory and pick the unmanaged market stalls that your organization will operate.", tip: "You can select one or multiple stalls depending on your lease." },
    { step: "04", title: "Establish Credentials", desc: "Set up a secure login password and review the registration terms to ensure legal alignment.", tip: "Passwords must be at least 8 characters with letters, numbers, and symbols." },
    { step: "05", title: "Verify OTP & Apply", desc: "Type in the 4-digit verification code sent to your email to submit the request. Wait for the market administrator to review.", tip: "Admin will receive the application and instantly approve your portal access." }
  ];

  const nextContractorSlide = (e) => {
    if (e) e.preventDefault();
    if (contractorSlide === 4) {
      navigate('/register?role=contractor');
    } else {
      setContractorSlide(prev => prev + 1);
    }
  };

  const prevContractorSlide = (e) => {
    if (e) e.preventDefault();
    setContractorSlide(prev => Math.max(0, prev - 1));
  };

  // Renter Slideshow State
  const [renterSlide, setRenterSlide] = useState(0);
  const renterSteps = [
    { step: "01", title: "Explore the Market", desc: "Browse the live interactive directory and take a 3D Virtual Tour of the market floor to locate vacant spots and check pricing.", tip: "Use the Virtual Tour to inspect the surroundings before choosing." },
    { step: "02", title: "Select Your Stall", desc: "Choose your preferred stall directly from the interactive map and review its category, monthly rate, and size details.", tip: "Click any green stall on the map to see its dimensions." },
    { step: "03", title: "Fill Renter Application", desc: "Fill in your personal details, business info, and describe your intended usage (e.g. Vegetables, Meat, Fishes).", tip: "Double-check your contact number for OTP delivery." },
    { step: "04", title: "OTP Verification", desc: "Enter the 4-digit verification code sent to your email to verify your registration request.", tip: "Check your spam folder if the code doesn't arrive in 60 seconds." },
    { step: "05", title: "Access Vendor Dashboard", desc: "Once approved, log in to access your dashboard, track your bills, manage contracts, and view market announcements.", tip: "You can now log in using the main Login screen." }
  ];

  const nextRenterSlide = (e) => {
    if (e) e.preventDefault();
    if (renterSlide === 4) {
      navigate('/register');
    } else {
      setRenterSlide(prev => prev + 1);
    }
  };

  const prevRenterSlide = (e) => {
    if (e) e.preventDefault();
    setRenterSlide(prev => Math.max(0, prev - 1));
  };

  const [heroRef, heroInView] = useInView(0.1);
  const [statsRef, statsInView] = useInView(0.2);
  const [whyRef, whyInView] = useInView(0.15);
  const [howRef, howInView] = useInView(0.15);
  const [featuresRef, featuresInView] = useInView(0.1);
  const [portalRef, portalInView] = useInView(0.15);
  const [ctaRef, ctaInView] = useInView(0.2);
  const [footerRef, footerInView] = useInView(0.1);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Auto-play slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slideshowImages.length]);

  const handlePrevSlide = (e) => {
    e.preventDefault();
    setCurrentSlide((prev) => (prev === 0 ? slideshowImages.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    e.preventDefault();
    setCurrentSlide((prev) => (prev + 1) % slideshowImages.length);
  };

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // PWA install prompt capture
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      window.open('https://my-talipapa-market.vercel.app', '_blank');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
  };



  const modalContent = {
    privacy: {
      title: "Privacy Policy",
      body: `
        <h3 class="text-white font-semibold mb-2">1. Information We Collect</h3>
        <p class="mb-4">MyTalipapa collects information you provide directly, including name, contact details, and stall registration data when you sign up or use our platform. We also collect usage data such as pages visited, features used, and device information.</p>
        <h3 class="text-white font-semibold mb-2">2. How We Use Your Information</h3>
        <p class="mb-4">We use your data to operate and improve our services, process payments, communicate with you about your account, send relevant updates about market operations, and comply with legal obligations.</p>
        <h3 class="text-white font-semibold mb-2">3. Data Sharing</h3>
        <p class="mb-4">We do not sell your personal information. We may share data with trusted service providers who assist in operating our platform, always under strict confidentiality agreements. Market administrators may access stall tenant data as part of their management responsibilities.</p>
        <h3 class="text-white font-semibold mb-2">4. Data Retention</h3>
        <p class="mb-4">We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data by contacting mytalipapa@gmail.com.</p>
        <h3 class="text-white font-semibold mb-2">5. Contact Us</h3>
        <p>For privacy concerns, email us at mytalipapa@gmail.com.</p>
      `
    },
    terms: {
      title: "Terms of Service",
      body: `
        <h3 class="text-white font-semibold mb-2">1. Acceptance of Terms</h3>
        <p class="mb-4">By accessing or using MyTalipapa, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
        <h3 class="text-white font-semibold mb-2">2. Use of the Platform</h3>
        <p class="mb-4">MyTalipapa is intended for lawful use by market administrators and stall tenants. You agree not to misuse the platform, attempt unauthorized access, or use it for fraudulent transactions.</p>
        <h3 class="text-white font-semibold mb-2">3. Stall Rental Agreements</h3>
        <p class="mb-4">Digital rental agreements processed through MyTalipapa are legally binding. Tenants are responsible for timely payments. MyTalipapa facilitates but is not a party to rental contracts between market administrators and tenants.</p>
        <h3 class="text-white font-semibold mb-2">4. Intellectual Property</h3>
        <p class="mb-4">All content, features, and functionality of MyTalipapa are owned by MyTalipapa Systems Inc. and protected under Philippine intellectual property laws.</p>
        <h3 class="text-white font-semibold mb-2">5. Limitation of Liability</h3>
        <p class="mb-4">MyTalipapa shall not be liable for indirect, incidental, or consequential damages arising from use of the platform. Our liability is limited to the amount paid for services in the 3 months preceding a claim.</p>
        <h3 class="text-white font-semibold mb-2">6. Governing Law</h3>
        <p>These terms are governed by the laws of the Republic of the Philippines.</p>
      `
    },
    accessibility: {
      title: "Accessibility",
      body: `
        <h3 class="text-white font-semibold mb-2">Our Commitment</h3>
        <p class="mb-4">MyTalipapa is committed to ensuring our platform is accessible to all users, including those with disabilities. We strive to meet WCAG 2.1 Level AA standards across our web and mobile applications.</p>
        <h3 class="text-white font-semibold mb-2">Features We Support</h3>
        <p class="mb-4">Our platform is designed with keyboard navigation support, screen reader compatibility, sufficient color contrast ratios, resizable text without loss of content, and descriptive alt text for all meaningful images.</p>
        <h3 class="text-white font-semibold mb-2">${SHOW_AR_FINDER ? 'AR and ' : ''}360° Features</h3>
        <p class="mb-4">For users who cannot access our ${SHOW_AR_FINDER ? 'AR navigation or ' : ''}360° market tour due to visual or motor impairments, we provide an accessible text-based stall directory as an equivalent alternative.</p>
        <h3 class="text-white font-semibold mb-2">Known Limitations</h3>
        <p class="mb-4">We are actively working to improve accessibility in our ${SHOW_AR_FINDER ? 'AR navigation feature and ' : ''}certain data visualization components. Updates are ongoing.</p>
        <h3 class="text-white font-semibold mb-2">Get Help</h3>
        <p>If you experience any accessibility barriers, contact us at mytalipapa@gmail.com and we will respond within 2 business days.</p>
      `
    }
  };

  useEffect(() => {
    const fetchStallStats = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/public/stalls/stats`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setStats({ totalStalls: data.totalStalls, availableStalls: data.availableStalls, occupiedStalls: data.occupiedStalls });
      } catch (error) {
        console.error('Failed to fetch stall stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStallStats();
  }, []);

  const fadeUp = (inView, delay = 0) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0px)' : 'translateY(40px)',
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  });

  const fadeIn = (inView, delay = 0) => ({
    opacity: inView ? 1 : 0,
    transition: `opacity 0.8s ease ${delay}s`,
  });

  const slideLeft = (inView, delay = 0) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateX(0px)' : 'translateX(-50px)',
    transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
  });

  const slideRight = (inView, delay = 0) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateX(0px)' : 'translateX(50px)',
    transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
  });

  const scaleIn = (inView, delay = 0) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'scale(1)' : 'scale(0.95)',
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/20 via-white to-gray-50 text-gray-800" style={{ overflowX: 'hidden' }}>

      <style>{`
        button, a, [role="button"], .cursor-pointer {
          cursor: pointer !important;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        ::-webkit-scrollbar-thumb {
          background: #15803d;
          border-radius: 9999px;
          border: 2px solid #f8fafc;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #166534;
        }
        html {
          scrollbar-width: thin;
          scrollbar-color: #15803d #f8fafc;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(21,128,61,0.3); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(21,128,61,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(21,128,61,0); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95) translateY(15px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .card-hover {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 35px rgba(21,128,61,0.06);
        }
        .btn-bounce {
          transition: all 0.25s ease;
        }
        .btn-bounce:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(21,128,61,0.25);
        }
        .btn-bounce:active {
          transform: translateY(1px);
        }
      `}</style>

      {/* Navigation */}
      <nav
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100"
        style={{
          boxShadow: navScrolled ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
          transition: 'all 0.3s ease',
          animation: 'fadeSlideDown 0.5s ease forwards',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            style={{ animation: 'fadeSlideDown 0.5s ease 0.1s both' }}
            onClick={() => scrollToSection(heroRef)}
          >
            <img src="/logo.png" alt="MyTalipapa Logo" className="h-9 w-auto object-contain animate-[float_4s_infinite_ease-in-out]" />
            <span className="text-xl font-bold tracking-tight text-green-700">MyTalipapa</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-7" style={{ animation: 'fadeSlideDown 0.5s ease 0.15s both' }}>
            {[
              { label: 'Home', ref: heroRef },
              { label: 'Why Us', ref: whyRef },
              { label: 'How It Works', ref: howRef },
              { label: 'Features', ref: featuresRef },
              { label: 'Portals', ref: portalRef }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.ref)}
                className="text-sm font-semibold text-gray-600 hover:text-green-700 transition relative py-1 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-green-700 after:transition-all after:duration-300"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Login */}
          <div className="hidden md:flex gap-4 items-center" style={{ animation: 'fadeSlideDown 0.5s ease 0.2s both' }}>
            <Link
              to="/login"
              className="bg-green-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-800 btn-bounce text-sm sm:text-base shadow-sm"
              style={{ animation: 'pulse-ring 3s ease-in-out infinite' }}
            >
              Login
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-3" style={{ animation: 'fadeSlideDown 0.5s ease 0.2s both' }}>
            <Link
              to="/login"
              className="bg-green-700 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-green-800 text-xs shadow-sm"
            >
              Login
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-green-700 focus:outline-none p-1.5 rounded-lg hover:bg-gray-50 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1 animate-[fadeSlideDown_0.25s_ease_forwards]">
            {[
              { label: 'Home', ref: heroRef },
              { label: 'Why Us', ref: whyRef },
              { label: 'How It Works', ref: howRef },
              { label: 'Features', ref: featuresRef },
              { label: 'Portals', ref: portalRef }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.ref)}
                className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-green-700 hover:bg-green-50/50 transition"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center font-sans">
          
          {/* Hero text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div style={fadeUp(heroInView, 0.1)}>
              <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                <CheckCircle2 size={14} className="text-green-600 animate-pulse" /> Next-Gen Market Infrastructure
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.12] tracking-tight">
                Your modern <span className="text-green-700">stall management</span> partner
              </h1>
            </div>
            <div style={fadeUp(heroInView, 0.25)}>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Streamline stall rentals, automate leases, and showcase availability to tenants with our 3D mapping and interactive directory. Built for public market administrators and modern vendors.
              </p>
            </div>
            
            {/* Call to Actions */}
            <div style={fadeUp(heroInView, 0.4)} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/login"
                className="bg-green-700 text-white px-8 py-4 rounded-full font-bold hover:bg-green-800 transition flex items-center justify-center gap-2 btn-bounce shadow-md shadow-green-700/10 text-base"
              >
                Get Started <ArrowRight size={18} />
              </Link>
              <Link
                to="/tour"
                className="bg-white text-gray-700 border border-gray-200 hover:border-gray-300 px-8 py-4 rounded-full font-bold transition flex items-center justify-center gap-2 hover:bg-gray-50 text-base"
              >
                Start Virtual Tour
              </Link>
            </div>
          </div>

          {/* Hero Slideshow Card */}
          <div 
            className="lg:col-span-5 w-full mx-auto max-w-md lg:max-w-none"
            style={slideRight(heroInView, 0.3)}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-white group">
              
              {/* Image Slideshow */}
              <div className="relative h-64 sm:h-80 lg:h-[420px] overflow-hidden bg-gray-50">
                {slideshowImages.map((slide, index) => (
                  <div
                    key={index}
                    className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                    style={{ opacity: index === currentSlide ? 1 : 0, pointerEvents: index === currentSlide ? 'auto' : 'none' }}
                  >
                    <img 
                      src={slide.src} 
                      alt={slide.title} 
                      className="w-full h-full object-cover transform scale-100 group-hover:scale-102 transition-transform duration-1000 ease-out" 
                    />
                    {/* Caption Overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-white">
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-1">{slide.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-300">{slide.desc}</p>
                    </div>
                  </div>
                ))}

                {/* Left/Right Arrows (Visible on Hover) */}
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75 transition active:scale-95 z-10 opacity-0 group-hover:opacity-100"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75 transition active:scale-95 z-10 opacity-0 group-hover:opacity-100"
                  aria-label="Next Slide"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Dots indicators inside a capsule */}
                <div className="absolute top-4 right-4 flex gap-1.5 bg-black/60 px-3 py-1.5 rounded-full z-10">
                  {slideshowImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => { e.preventDefault(); setCurrentSlide(index); }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-4 bg-green-500' : 'w-1.5 bg-white/50'}`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { 
              value: <CountUpTo target={stats.totalStalls} trigger={statsInView} />, 
              label: 'Total Stalls', 
              color: 'text-orange-600', 
              icon: <Layers size={22} className="text-orange-500" />, 
              bg: 'bg-orange-50', 
              border: 'border-gray-100 hover:border-orange-200',
              delay: 0 
            },
            { 
              value: <CountUpTo target={stats.availableStalls} trigger={statsInView} />, 
              label: 'Available Stalls', 
              color: 'text-green-700', 
              icon: <CheckCircle2 size={22} className="text-green-600" />, 
              bg: 'bg-green-50', 
              border: 'border-gray-100 hover:border-green-200',
              delay: 0.15 
            },
            { 
              value: <CountUpTo target={stats.occupiedStalls} trigger={statsInView} />, 
              label: 'Occupied Stalls', 
              color: 'text-gray-900', 
              icon: <Users size={22} className="text-gray-600" />, 
              bg: 'bg-gray-100', 
              border: 'border-gray-100 hover:border-gray-200',
              delay: 0.3 
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl p-6 sm:p-7 border ${stat.border} flex items-center justify-between card-hover shadow-sm`}
              style={scaleIn(statsInView, stat.delay)}
            >
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">{stat.label}</span>
                <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${stat.color}`}>{stat.value}</div>
              </div>
              <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center shadow-sm`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose MyTalipapa Section */}
      <section ref={whyRef} className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3" style={fadeUp(whyInView, 0)}>
          <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-3.5 py-1.5 rounded-full">Value Proposition</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Why Use MyTalipapa?</h2>
          <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
            Engineered specifically to solve public market challenges and bring them into the modern digital age.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Layers className="text-green-600" size={24} />,
              title: "Digital Stall Mapping",
              desc: "Accurately coordinate stall placements, boundaries, and zoning using our interactive visual map."
            },
            {
              icon: <FileText className="text-green-600" size={24} />,
              title: "Paperless Contracts",
              desc: "Upload application credentials, review terms, and sign leasing documentation entirely digitally."
            },
            {
              icon: <TrendingUp className="text-green-600" size={24} />,
              title: "Real-time Telemetry",
              desc: "Instant metrics on available spaces, pending applications, and market occupancy parameters."
            },
            {
              icon: <Lock className="text-green-600" size={24} />,
              title: "Secure Encrypted Auth",
              desc: "Industry-standard JWT credentials secure your business credentials and personal tenant info."
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover flex flex-col justify-between"
              style={scaleIn(whyInView, idx * 0.1)}
            >
              <div>
                <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section ref={howRef} className="bg-white border-y border-gray-100 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3" style={fadeUp(howInView, 0)}>
            <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-3.5 py-1.5 rounded-full">Interactive Guide</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">How It Works</h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base font-medium">
              Choose your profile to understand the digital steps on MyTalipapa.
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex justify-center" style={fadeUp(howInView, 0.1)}>
            <div className="bg-gray-100 p-1 rounded-full flex flex-wrap justify-center gap-1 border border-gray-200">
              <button
                onClick={() => setHowItWorksTab('renter')}
                className={`px-4 sm:px-6 py-2 rounded-full font-bold text-xs sm:text-sm transition-all ${howItWorksTab === 'renter' ? 'bg-green-700 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
              >
                For Renters / Vendors
              </button>
              <button
                onClick={() => setHowItWorksTab('contractor')}
                className={`px-4 sm:px-6 py-2 rounded-full font-bold text-xs sm:text-sm transition-all ${howItWorksTab === 'contractor' ? 'bg-green-700 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
              >
                For Contractors
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {howItWorksTab === 'renter' && (
              <div 
                className="bg-gray-50/70 rounded-[2rem] p-6 sm:p-10 border border-gray-100 flex flex-col lg:flex-row gap-8 items-stretch shadow-sm"
                style={fadeUp(howInView, 0.1)}
              >
                {/* Left Side: Interactive Graphic/Visual for the active step */}
                <div className="w-full lg:w-1/2 flex justify-center items-center h-56 sm:h-72 bg-green-950/5 rounded-2xl border border-green-900/10 p-6 relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1a5c2a 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  
                  {renterSlide === 0 && (
                    <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-xl border border-gray-150 overflow-hidden flex flex-col">
                      {/* Search Header */}
                      <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b border-gray-200 shrink-0 select-none">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-green-600" />
                          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">3D Virtual Finder</span>
                        </div>
                        <Compass size={14} className="text-green-700 shrink-0" />
                      </div>
                      {/* Search Body */}
                      <div className="p-6 flex flex-col items-center justify-center bg-gray-50/50 flex-1 space-y-3.5 min-h-[120px]">
                        <div className="w-full bg-white border border-green-200 rounded-xl px-3 py-2 text-[11px] text-green-800 font-bold flex items-center gap-2 shadow-sm">
                          <Search size={14} className="text-green-600 shrink-0" />
                          <span>Search vacant stalls...</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none text-center">
                          Explore Live 3D Floor Maps
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {renterSlide === 1 && (
                    <div className="w-full max-w-[260px] bg-white rounded-2xl shadow-xl border border-green-100 p-5 space-y-3">
                      <div className="h-3.5 w-2/3 bg-gray-200 rounded" />
                      <div className="h-10 w-full bg-green-50 border-2 border-green-600 rounded-xl flex items-center justify-between px-3 text-xs text-green-700 font-bold">
                        <span>Stall #42 (Meat)</span>
                        <Check size={16} className="text-green-600" />
                      </div>
                      <div className="h-4 w-1/3 bg-gray-100 rounded" />
                    </div>
                  )}
                  
                  {renterSlide === 2 && (
                    <div className="w-full max-w-[260px] bg-white rounded-2xl shadow-xl border border-orange-100 p-5 space-y-3">
                      <div className="h-3.5 w-1/2 bg-gray-200 rounded" />
                      <div className="space-y-1.5">
                        <div className="h-3 bg-gray-100 rounded w-full" />
                        <div className="h-3 bg-gray-100 rounded w-5/6" />
                        <div className="h-3 bg-gray-100 rounded w-2/3" />
                      </div>
                      <div className="h-8 w-full bg-green-700 rounded-lg flex items-center justify-center text-xs text-white font-bold">
                        Submit Renter Application
                      </div>
                    </div>
                  )}
                  
                  {renterSlide === 3 && (
                    <div className="w-full max-w-[260px] bg-white rounded-2xl shadow-xl border border-slate-100 p-5 space-y-3 text-center">
                      <div className="h-3.5 w-1/2 bg-gray-200 rounded mx-auto mb-2" />
                      <div className="flex justify-center gap-2">
                        <div className="h-10 w-9 border-2 border-green-600 rounded-xl flex items-center justify-center font-bold text-lg text-green-700 bg-green-50">5</div>
                        <div className="h-10 w-9 border-2 border-green-600 rounded-xl flex items-center justify-center font-bold text-lg text-green-700 bg-green-50">0</div>
                        <div className="h-10 w-9 border-2 border-green-600 rounded-xl flex items-center justify-center font-bold text-lg text-green-700 bg-green-50">7</div>
                        <div className="h-10 w-9 border-2 border-green-600 rounded-xl flex items-center justify-center font-bold text-lg text-green-700 bg-green-50">2</div>
                      </div>
                      <div className="h-3.5 w-2/3 bg-orange-100 rounded mx-auto mt-2" />
                    </div>
                  )}
                  
                  {renterSlide === 4 && (
                    <div className="w-full max-w-[260px] bg-white rounded-2xl shadow-xl border border-slate-100 p-5 space-y-3 text-center">
                      <div className="h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="h-3.5 w-1/2 bg-gray-200 rounded mx-auto" />
                      <div className="h-3 w-1/3 bg-gray-100 rounded mx-auto" />
                    </div>
                  )}
                </div>

                {/* Right Side: Step Description & Controls */}
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-800 bg-green-100 px-3 py-1 rounded-full uppercase tracking-wider">
                        Step {renterSteps[renterSlide].step} of 05
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{renterSteps[renterSlide].title}</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{renterSteps[renterSlide].desc}</p>
                    <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100/50 text-xs font-semibold text-gray-600 leading-normal">
                      💡 {renterSteps[renterSlide].tip}
                    </div>
                  </div>

                  {/* Navigation controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-200">
                    <div className="flex gap-2">
                      {renterSteps.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => { e.preventDefault(); setRenterSlide(idx); }}
                          className={`h-2 rounded-full transition-all duration-300 ${idx === renterSlide ? 'w-6 bg-green-700' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                          aria-label={`Go to step ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={prevRenterSlide}
                        className="p-2.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition active:scale-95 disabled:opacity-40"
                        disabled={renterSlide === 0}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={nextRenterSlide}
                        className="px-5 py-2.5 rounded-full bg-green-700 text-white font-bold hover:bg-green-800 transition active:scale-95 flex items-center gap-1.5 text-sm"
                      >
                        {renterSlide === 4 ? (
                          <>
                            Go to Registration
                            <ArrowRight size={16} />
                          </>
                        ) : (
                          <>
                            Next Step
                            <ChevronRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {howItWorksTab === 'contractor' && (
              <div 
                className="bg-gray-50/70 rounded-[2rem] p-6 sm:p-10 border border-gray-100 flex flex-col lg:flex-row gap-8 items-stretch shadow-sm"
                style={fadeUp(howInView, 0.1)}
              >
                {/* Left Side: Interactive Graphic/Visual for the active step */}
                <div className="w-full lg:w-1/2 flex justify-center items-center h-56 sm:h-72 bg-green-950/5 rounded-2xl border border-green-900/10 p-6 relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1a5c2a 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  
                  {contractorSlide === 0 && (
                    <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-xl border border-gray-150 overflow-hidden flex flex-col">
                      {/* Browser Window Header */}
                      <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200 shrink-0 select-none">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-400" />
                          <div className="w-3 h-3 rounded-full bg-yellow-400" />
                          <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        {/* URL Bar */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-[10px] text-gray-450 font-mono flex items-center gap-1.5 overflow-hidden">
                          <Lock size={10} className="text-green-600 shrink-0" />
                          <span className="truncate">mytalipapa.com/register?role=contractor</span>
                        </div>
                      </div>
                      {/* Browser Window Body */}
                      <div className="p-6 flex flex-col items-center justify-center bg-gray-50/50 flex-1 space-y-3 min-h-[120px]">
                        <span className="bg-orange-55 text-orange-700 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-orange-100">
                          Contractor Setup
                        </span>
                        <p className="text-[11px] font-bold text-gray-800 text-center leading-normal">
                          Initiate Application Portal
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {contractorSlide === 1 && (
                    <div className="w-full max-w-[260px] bg-white rounded-2xl shadow-xl border border-orange-100 p-5 space-y-3">
                      <div className="h-3.5 w-2/3 bg-gray-200 rounded" />
                      <div className="h-10 w-full bg-orange-50/65 border border-orange-100 rounded-xl flex items-center px-3 text-xs text-orange-700 font-bold">
                        Benito Market Inc.
                      </div>
                      <div className="h-7 w-1/3 bg-green-700 rounded-lg" />
                    </div>
                  )}
                  
                  {contractorSlide === 2 && (
                    <div className="w-full max-w-[260px] bg-white rounded-2xl shadow-xl border border-green-100 p-5 space-y-3">
                      <div className="h-3.5 w-1/2 bg-gray-200 rounded" />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-10 rounded-lg border border-green-600 bg-green-50 flex items-center justify-center font-bold text-xs text-green-700">Stall 01</div>
                        <div className="h-10 rounded-lg border border-green-600 bg-green-50 flex items-center justify-center font-bold text-xs text-green-700">Stall 02</div>
                        <div className="h-10 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400">Stall 03</div>
                      </div>
                    </div>
                  )}
                  
                  {contractorSlide === 3 && (
                    <div className="w-full max-w-[260px] bg-white rounded-2xl shadow-xl border border-slate-100 p-5 space-y-3 text-center">
                      <div className="h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-2">
                        <ShieldCheck size={24} />
                      </div>
                      <div className="h-3.5 w-1/2 bg-gray-200 rounded mx-auto" />
                      <div className="h-3 w-1/3 bg-gray-100 rounded mx-auto" />
                    </div>
                  )}
                  
                  {contractorSlide === 4 && (
                    <div className="w-full max-w-[260px] bg-white rounded-2xl shadow-xl border border-slate-100 p-5 space-y-3 text-center">
                      <div className="h-3.5 w-1/2 bg-gray-200 rounded mx-auto mb-2" />
                      <div className="flex justify-center gap-2">
                        <div className="h-10 w-9 border-2 border-green-600 rounded-xl flex items-center justify-center font-bold text-lg text-green-700 bg-green-50">4</div>
                        <div className="h-10 w-9 border-2 border-green-600 rounded-xl flex items-center justify-center font-bold text-lg text-green-700 bg-green-50">8</div>
                        <div className="h-10 w-9 border-2 border-green-600 rounded-xl flex items-center justify-center font-bold text-lg text-green-700 bg-green-50">1</div>
                        <div className="h-10 w-9 border-2 border-green-600 rounded-xl flex items-center justify-center font-bold text-lg text-green-700 bg-green-50">9</div>
                      </div>
                      <div className="h-3.5 w-2/3 bg-orange-100 rounded mx-auto mt-2" />
                    </div>
                  )}
                </div>

                {/* Right Side: Step Description & Controls */}
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-800 bg-green-100 px-3 py-1 rounded-full uppercase tracking-wider">
                        Step {contractorSteps[contractorSlide].step} of 05
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{contractorSteps[contractorSlide].title}</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{contractorSteps[contractorSlide].desc}</p>
                    <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100/50 text-xs font-semibold text-gray-600 leading-normal">
                      💡 {contractorSteps[contractorSlide].tip}
                    </div>
                  </div>

                  {/* Navigation controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-200">
                    <div className="flex gap-2">
                      {contractorSteps.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => { e.preventDefault(); setContractorSlide(idx); }}
                          className={`h-2 rounded-full transition-all duration-300 ${idx === contractorSlide ? 'w-6 bg-green-700' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                          aria-label={`Go to step ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={prevContractorSlide}
                        className="p-2.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition active:scale-95 disabled:opacity-40"
                        disabled={contractorSlide === 0}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={nextContractorSlide}
                        className="px-5 py-2.5 rounded-full bg-green-700 text-white font-bold hover:bg-green-800 transition active:scale-95 flex items-center gap-1.5 text-sm"
                      >
                        {contractorSlide === 4 ? (
                          <>
                            Go to Registration
                            <ArrowRight size={16} />
                          </>
                        ) : (
                          <>
                            Next Step
                            <ChevronRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 max-w-6xl mx-auto">
        <div className="space-y-16">
          
          <div style={fadeUp(featuresInView, 0)} className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-3.5 py-1.5 rounded-full">Interactive Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Transforming the Palengke Experience
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
              Explore the advanced features built specifically to modernize public market stall management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Easy Rental */}
            <div
              className="rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-md card-hover flex flex-col h-full"
              style={slideLeft(featuresInView, 0.15)}
            >
              <div 
                className="relative h-48 sm:h-56 bg-orange-50/20 flex items-center justify-center p-6 overflow-hidden border-b border-gray-100/60 group"
                style={{ backgroundImage: 'radial-gradient(#ea580c 0.65px, transparent 0.65px)', backgroundSize: '16px 16px' }}
              >
                {/* Floating blur shapes */}
                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-orange-400/10 blur-xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-green-500/10 blur-xl pointer-events-none" />

                {/* Hand-coded UI Card Mockup */}
                <div className="w-full max-w-[250px] bg-white rounded-2xl shadow-xl border border-orange-100 p-4 transform translate-y-1 group-hover:-translate-y-1.5 transition-all duration-500 ease-out space-y-3">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      Stall A-12
                    </span>
                    <span className="text-[11px] font-bold text-gray-900">₱250<span className="text-gray-400 font-normal">/day</span></span>
                  </div>

                  {/* Stall Title */}
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-gray-900">Dry Goods Section</h4>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <MapPin size={9} className="text-orange-500" /> Ground Floor, Zone 2
                    </p>
                  </div>

                  {/* Status Box */}
                  <div className="h-6 rounded-lg bg-gray-50 border border-gray-100/60 px-2 flex items-center justify-between">
                    <span className="text-[9px] text-gray-400">Application Status</span>
                    <span className="text-[9px] font-bold text-orange-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" /> Pending Review
                    </span>
                  </div>

                  {/* Action Button Mock */}
                  <div className="w-full py-1.5 rounded-xl bg-orange-600 text-white text-[10px] font-bold text-center shadow-sm hover:bg-orange-700 transition">
                    Start Renter Application
                  </div>
                </div>

                <div className="absolute top-4 left-4 bg-orange-600/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-full tracking-wider uppercase shadow-md">
                  STREAMLINED BOOKING
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Easy Rental System</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    No paperwork, no queues. Renter applications are handled digitally from start to finish. Submit requirements, sign contracts, and check stall pricing details inside a clean web dashboard.
                  </p>
                </div>
                <div className="mt-6 pt-4 flex items-center justify-between">
                  <Link to="/login" className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700 transition">
                    Apply For Stall <ChevronRight size={16} />
                  </Link>
                  <MapPin className="text-orange-500/40" size={24} />
                </div>
              </div>
            </div>

            {/* 360 Market Tour */}
            <div
              className="rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-md card-hover flex flex-col h-full"
              style={slideRight(featuresInView, 0.25)}
            >
              <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100 group shadow-inner">
                <img
                  src={tour360Preview}
                  alt="360° Market Tour Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-green-700/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-full tracking-wider uppercase shadow-md">
                  VIRTUAL TOUR
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">360° Market Exploration</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    Renters can explore the market and look at stalls in 3D directly from their phone or computer, eliminating the need for physically visiting the site beforehand.
                  </p>
                </div>
                <div className="mt-6 pt-4 flex items-center justify-between">
                  <Link to="/tour" className="inline-flex items-center gap-1 text-sm font-bold text-green-700 hover:text-green-800 transition">
                    Start Tour Now <ChevronRight size={16} />
                  </Link>
                  <Compass className="text-green-600/40" size={24} />
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Role-Based Portals Spotlight */}
      <section ref={portalRef} className="px-4 sm:px-6 lg:px-8 py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3" style={fadeUp(portalInView, 0)}>
            <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-3.5 py-1.5 rounded-full">Secure Portals</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Tailored Marketplace Portals</h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
              Dedicated interfaces customized for your specific workflow on MyTalipapa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Renter Portal */}
            <div 
              className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between card-hover group"
              style={slideLeft(portalInView, 0.15)}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-green-50 text-green-700 text-xs font-bold uppercase px-3.5 py-1 rounded-full">VENDORS & RENTERS</span>
                  <Users className="text-green-600" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition-colors">Renter Portal</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Access your tenant account. Submit rental applications for free spaces, track your approval status, review leasing terms, and review active billing details securely.
                </p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-3.5 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-bold transition flex items-center justify-center gap-2 group-hover:shadow-md"
              >
                Access Renter Portal <ArrowUpRight size={18} />
              </button>
            </div>

            {/* Contractor/Admin Portal */}
            <div 
              className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between card-hover group"
              style={slideRight(portalInView, 0.25)}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-orange-50 text-orange-600 text-xs font-bold uppercase px-3.5 py-1 rounded-full">ADMINISTRATIVE STAFF</span>
                  <Lock className="text-orange-500" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition-colors">Contractor Portal</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Oversee full market layouts. Review contractor submissions, change tenant accounts parameters, edit stall SVG coordinates, and track live available analytics.
                </p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-3.5 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold transition flex items-center justify-center gap-2 group-hover:shadow-md"
              >
                Access Contractor Portal <ArrowUpRight size={18} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        className="bg-gradient-to-br from-green-950 via-green-900 to-emerald-950 px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-white relative overflow-hidden border-t border-green-800/20"
      >
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        
        {/* Large atmospheric glow shapes */}
        <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-green-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-7 relative z-10">
          <div style={fadeUp(ctaInView, 0)} className="space-y-3">
            <span className="inline-flex items-center gap-1 bg-green-500/15 border border-green-500/30 text-green-300 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
              Start Your Journey
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Ready to upgrade your market experience?
            </h2>
            <p className="text-green-100 max-w-xl mx-auto text-sm sm:text-base leading-relaxed opacity-90">
              Create an account or log in to manage your stalls, submit applications, or browse the 360° virtual marketplace.
            </p>
          </div>
          <div style={fadeUp(ctaInView, 0.2)} className="pt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 bg-white text-green-800 hover:bg-green-50 px-9 py-4 rounded-full font-bold transition btn-bounce shadow-xl shadow-green-950/20 text-base"
            >
              Get Started <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className="bg-slate-950 text-slate-400 px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900/60 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-16">
            
            {/* Brand column */}
            <div className="space-y-4 col-span-1 sm:col-span-2 lg:col-span-1" style={slideLeft(footerInView, 0)}>
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="MyTalipapa Logo" className="h-8 w-auto object-contain" />
                <span className="text-white font-bold text-lg tracking-tight">MyTalipapa</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Building modern, reliable digital tools and mapping systems for the Filipino public market community since 2026.
              </p>
            </div>

            {/* Navigation Quick Links */}
            <div style={slideLeft(footerInView, 0.1)} className="space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2.5 text-xs">
                <li><button onClick={() => scrollToSection(heroRef)} className="text-slate-400 hover:text-green-500 transition-colors text-left font-semibold">Home</button></li>
                <li><button onClick={() => scrollToSection(whyRef)} className="text-slate-400 hover:text-green-500 transition-colors text-left font-semibold">Why Us</button></li>
                <li><button onClick={() => scrollToSection(howRef)} className="text-slate-400 hover:text-green-500 transition-colors text-left font-semibold">How It Works</button></li>
                <li><button onClick={() => scrollToSection(featuresRef)} className="text-slate-400 hover:text-green-500 transition-colors text-left font-semibold">Features</button></li>
                <li><button onClick={() => scrollToSection(portalRef)} className="text-slate-400 hover:text-green-500 transition-colors text-left font-semibold">Portals</button></li>
              </ul>
            </div>

            {/* Support/Contact column */}
            <div style={slideRight(footerInView, 0.15)} className="space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Contact & Support</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="font-semibold text-slate-400">Email:</span>
                  <a href="mailto:mytalipapa@gmail.com" className="hover:text-green-500 transition-colors">mytalipapa@gmail.com</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold text-slate-400">Location:</span>
                  <span>Manila, Philippines</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold text-slate-400">Status:</span>
                  <span className="flex items-center gap-1.5 text-green-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live & Online
                  </span>
                </li>
              </ul>
            </div>

            {/* Legal column */}
            <div style={slideRight(footerInView, 0.2)} className="space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Legal & Access</h4>
              <ul className="space-y-2.5 text-xs">
                <li><button onClick={() => setModal('privacy')} className="text-slate-400 hover:text-white transition-colors text-left font-semibold">Privacy Policy</button></li>
                <li><button onClick={() => setModal('terms')} className="text-slate-400 hover:text-white transition-colors text-left font-semibold">Terms of Service</button></li>
                <li><button onClick={() => setModal('accessibility')} className="text-slate-400 hover:text-white transition-colors text-left font-semibold">Accessibility Commitment</button></li>
              </ul>
            </div>

            {/* Get Mobile App column */}
            <div style={slideRight(footerInView, 0.25)} className="space-y-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Get Mobile App</h4>
              <div className="bg-white p-2 rounded-xl inline-block shadow-md">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&ecc=M&data=https%3A%2F%2Fmy-talipapa-market.vercel.app"
                  alt="Scan to visit MyTalipapa"
                  width="84"
                  height="84"
                  className="block rounded"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Scan with your phone camera to install, or tap the button below.
              </p>
              {isInstalled ? (
                <div className="flex items-center gap-2 text-green-500 text-[11px] font-bold">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                  App Installed!
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white font-bold text-[11px] px-4 py-2.5 rounded-xl transition shadow-sm w-max"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  {installPrompt ? 'Install App' : 'Open Web App'}
                </button>
              )}
            </div>

          </div>

          <div
            className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500"
            style={fadeIn(footerInView, 0.3)}
          >
            <p>© 2026 MyTalipapa Systems Inc. All rights reserved.</p>
            <p>Designed for public market administrators and tenants.</p>
          </div>
        </div>
      </footer>

      {/* Legal Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setModal(null)}
          style={{ animation: 'fadeSlideDown 0.2s ease forwards' }}
        >
          <div
            className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'modalPop 0.3s ease forwards' }}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h3 className="text-white font-bold text-base tracking-tight">{modalContent[modal].title}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div
              className="p-6 text-sm text-gray-300 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: modalContent[modal].body }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
