import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import heroImage from '../images/1.png';
import arImage from '../images/2.png';
import tour360Preview from '../images/tour360_preview.png';

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

export default function Landingpage() {
  const [stats, setStats] = useState({ totalStalls: 120, availableStalls: 15, occupiedStalls: 105 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [displayStats, setDisplayStats] = useState({ totalStalls: 0, availableStalls: 0, occupiedStalls: 0 });

  const [heroRef, heroInView] = useInView(0.1);
  const [statsRef, statsInView] = useInView(0.2);
  const [featuresRef, featuresInView] = useInView(0.1);
  const [ctaRef, ctaInView] = useInView(0.2);
  const [footerRef, footerInView] = useInView(0.1);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!statsInView) return;
    const targets = { totalStalls: stats.totalStalls, availableStalls: stats.availableStalls, occupiedStalls: stats.occupiedStalls };
    const duration = 1500;
    const steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayStats({
        totalStalls: Math.round(targets.totalStalls * ease),
        availableStalls: Math.round(targets.availableStalls * ease),
        occupiedStalls: Math.round(targets.occupiedStalls * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [statsInView, stats]);

  const modalContent = {
    privacy: {
      title: "Privacy Policy",
      body: `
        <p class="text-gray-400 text-xs mb-4">Last updated: January 1, 2026</p>
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
        <p class="text-gray-400 text-xs mb-4">Last updated: January 1, 2026</p>
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
        <p class="text-gray-400 text-xs mb-4">Last updated: January 1, 2026</p>
        <h3 class="text-white font-semibold mb-2">Our Commitment</h3>
        <p class="mb-4">MyTalipapa is committed to ensuring our platform is accessible to all users, including those with disabilities. We strive to meet WCAG 2.1 Level AA standards across our web and mobile applications.</p>
        <h3 class="text-white font-semibold mb-2">Features We Support</h3>
        <p class="mb-4">Our platform is designed with keyboard navigation support, screen reader compatibility, sufficient color contrast ratios, resizable text without loss of content, and descriptive alt text for all meaningful images.</p>
        <h3 class="text-white font-semibold mb-2">AR and 360° Features</h3>
        <p class="mb-4">For users who cannot access our AR navigation or 360° market tour due to visual or motor impairments, we provide an accessible text-based stall directory as an equivalent alternative.</p>
        <h3 class="text-white font-semibold mb-2">Known Limitations</h3>
        <p class="mb-4">We are actively working to improve accessibility in our AR navigation feature and certain data visualization components. Updates are ongoing.</p>
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
    transform: inView ? 'scale(1)' : 'scale(0.85)',
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white" style={{ overflowX: 'hidden' }}>

      {/* Global keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(21,128,61,0.4); }
          70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(21,128,61,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(21,128,61,0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }
        .btn-bounce:hover {
          animation: none;
          transform: scale(1.04);
          transition: transform 0.2s ease;
        }
        .btn-bounce:active {
          transform: scale(0.97);
        }
        .image-zoom img {
          transition: transform 0.5s ease;
        }
        .image-zoom:hover img {
          transform: scale(1.06);
        }
      `}</style>

      {/* Navigation */}
      <nav
        className="sticky top-0 z-50 bg-white border-b border-gray-100"
        style={{
          boxShadow: navScrolled ? '0 4px 24px rgba(0,0,0,0.08)' : 'none',
          transition: 'box-shadow 0.3s ease',
          animation: 'fadeSlideDown 0.5s ease forwards',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ animation: 'fadeSlideDown 0.5s ease 0.1s both' }}>
            <img src="/logo.png" alt="MyTalipapa Logo" className="h-8 w-auto object-contain" />
            <span className="text-xl font-bold text-green-700">MyTalipapa</span>
          </div>
          <div className="flex gap-4 items-center" style={{ animation: 'fadeSlideDown 0.5s ease 0.2s both' }}>
            <Link
              to="/login"
              className="bg-green-700 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-800 btn-bounce text-sm sm:text-base sm:px-6"
              style={{ animation: 'pulse-ring 2.5s ease-in-out 2s infinite' }}
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div style={fadeUp(heroInView, 0.1)}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                  Your modern stall management partner
                </h1>
              </div>
              <div style={fadeUp(heroInView, 0.25)}>
                <p className="text-base sm:text-lg text-gray-700 mb-8 leading-relaxed">
                  Streamline stall rentals, guide customers with AR, and manage your public market with the industrial reliability of a modern digital tool.
                </p>
              </div>
              <div style={fadeUp(heroInView, 0.4)} className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/login"
                  className="bg-green-700 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-800 transition flex items-center justify-center gap-2 btn-bounce"
                >
                  Get Started <ArrowRight size={20} />
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div
              className="hidden lg:block relative h-96 image-zoom"
              style={{ ...slideRight(heroInView, 0.3), animation: heroInView ? 'float 5s ease-in-out infinite' : 'none' }}
            >
              <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-3xl overflow-hidden shadow-2xl h-full w-full">
                <img src={heroImage} alt="Market" className="w-full h-full object-cover rounded-3xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { value: loading ? '...' : displayStats.totalStalls, label: 'TOTAL STALLS', color: 'text-orange-500', delay: 0 },
            { value: loading ? '...' : `• ${displayStats.availableStalls}`, label: 'AVAILABLE STALLS', color: 'text-green-700', delay: 0.15 },
            { value: loading ? '...' : displayStats.occupiedStalls, label: 'OCCUPIED STALLS', color: 'text-gray-900', delay: 0.3 },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 sm:p-8 border border-gray-100 text-center card-hover"
              style={scaleIn(statsInView, stat.delay)}
            >
              <div className={`text-4xl sm:text-5xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <p className="text-gray-600 font-semibold text-sm sm:text-base">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <div style={fadeUp(featuresInView, 0)}>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
              Transforming the Palengke Experience
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* AR Stall Navigation */}
            <div
              className="rounded-2xl overflow-hidden shadow-md bg-white card-hover"
              style={slideLeft(featuresInView, 0.15)}
            >
              <div className="h-48 sm:h-56 bg-gradient-to-br from-gray-700 to-gray-900 relative overflow-hidden image-zoom">
                <img src={arImage} alt="AR Navigation" className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded">
                  INNOVATION
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">AR Stall Navigation</h3>
                <p className="text-gray-600 mb-4">Never get lost in the market again. Real-time digital paths guiding your customers directly to their favorite vendors.</p>
              </div>
            </div>

            {/* Easy Rental */}
            <div
              className="rounded-2xl overflow-hidden shadow-md bg-orange-50 card-hover"
              style={slideRight(featuresInView, 0.25)}
            >
              <div className="p-6 sm:p-8 h-full flex flex-col justify-center">
                <div className="text-4xl mb-4" style={{ display: 'inline-block', animation: featuresInView ? 'float 3s ease-in-out infinite' : 'none' }}>📦</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Easy Rental</h3>
                <p className="text-gray-700 mb-4">Digital contracts, automated billing, and transparent stall availability at your fingertips.</p>
              </div>
            </div>
          </div>

          {/* 360 Market Tour */}
          <div style={fadeUp(featuresInView, 0.35)}>
            <Link to="/tour" className="block rounded-2xl overflow-hidden shadow-md bg-white card-hover">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="h-48 sm:h-64 lg:h-72 relative order-2 lg:order-1 overflow-hidden image-zoom">
                  <img
                    src={tour360Preview}
                    alt="360° Market Tour Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded">
                    VIRTUAL TOUR
                  </div>
                </div>
                <div className="p-6 sm:p-8 flex flex-col justify-center order-1 lg:order-2">
                  <div className="text-4xl mb-4" style={{ display: 'inline-block', animation: featuresInView ? 'float 4s ease-in-out 0.5s infinite' : 'none' }}>👁️</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">360° Market Tour</h3>
                  <p className="text-gray-700">A virtual window into your market. Showcase stall spaces to potential tenants without a site visit.</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        className="bg-green-700 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-white"
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {/* animated background rings */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.08)',
          animation: 'pulse-ring 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px', height: '400px',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
          animation: 'pulse-ring 4s ease-in-out 1s infinite',
          pointerEvents: 'none',
        }} />
        <div className="max-w-4xl mx-auto text-center" style={{ position: 'relative' }}>
          <div style={fadeUp(ctaInView, 0)}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to upgrade your market?</h2>
          </div>
          <div style={fadeUp(ctaInView, 0.2)}>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-white text-green-700 px-8 py-3 rounded-full font-semibold hover:bg-green-50 mt-4 btn-bounce"
            >
              Get Started <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className="bg-gray-900 text-gray-300 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <div style={slideLeft(footerInView, 0)}>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="MyTalipapa Logo" className="h-8 w-auto object-contain" />
                <span className="text-white font-bold">MyTalipapa</span>
              </div>
              <p className="text-sm text-gray-400">
                Building the digital infrastructure for the Filipino market community since 2026.
              </p>
            </div>
            <div style={slideRight(footerInView, 0.15)}>
              <h4 className="text-white font-semibold mb-4 text-sm">LEGAL</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setModal('privacy')} className="text-gray-400 hover:text-white transition text-left">Privacy Policy</button></li>
                <li><button onClick={() => setModal('terms')} className="text-gray-400 hover:text-white transition text-left">Terms of Service</button></li>
                <li><button onClick={() => setModal('accessibility')} className="text-gray-400 hover:text-white transition text-left">Accessibility</button></li>
              </ul>
            </div>
          </div>
          <div
            className="border-t border-gray-800 pt-8 text-sm text-gray-500"
            style={fadeIn(footerInView, 0.3)}
          >
            <p>© 2026 MyTalipapa Systems Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Legal Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
          style={{ animation: 'fadeSlideDown 0.2s ease forwards' }}
        >
          <div
            className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'modalPop 0.3s ease forwards' }}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-700">
              <h3 className="text-white font-semibold text-base">{modalContent[modal].title}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div
              className="p-5 text-sm text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: modalContent[modal].body }}
            />
          </div>
        </div>
      )}
    </div>
  );
}