import React, { useState } from "react";

// --- Icons ---
const Icon = ({ d, size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const HomeIcon = () => <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />;
const NavigateIcon = () => <Icon d="M3 12h18M12 3l9 9-9 9" />;
const StallIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7" /><rect x="3" y="9" width="18" height="13" rx="1" /><path d="M9 22V12h6v10" />
  </svg>
);
const ApplicationIcon = () => <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />;
const ProfileIcon = () => <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />;
const RecordsIcon = () => <Icon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />;
const ChevronRightIcon = () => <Icon d="M9 18l6-6-6-6" size={16} />;
const ArrowLeftIcon = () => <Icon d="M19 12H5M12 5l-7 7 7 7" size={20} />;
const ZoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const SizeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);
const WaterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6 8 4 12 4 15a8 8 0 0 0 16 0c0-3-2-7-8-13z" />
  </svg>
);
const PowerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
const WasteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const WrenchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const SendReportIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const CheckDoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const TourIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
  </svg>
);
const InquiryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MoveOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 5l7 7-7 7M20 12H3" />
  </svg>
);

// --- Animations ---
const stallDetailStyles = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cardPop {
    0%   { opacity: 0; transform: translateY(16px) scale(0.97); }
    60%  { transform: translateY(-2px) scale(1.005); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes bounceIn {
    0%   { opacity: 0; transform: scale(0.8); }
    60%  { transform: scale(1.06); }
    80%  { transform: scale(0.97); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .sd-header { animation: fadeSlideDown 0.35s ease both; }
  .sd-hero-img { animation: fadeIn 0.55s ease both; }
  .sd-mobile-card { animation: fadeSlideUp 0.4s ease 0.05s both; }
  .sd-desktop-title-card { animation: fadeSlideUp 0.4s ease 0.1s both; }
  .sd-status-badge { animation: bounceIn 0.4s ease 0.25s both; }
  .sd-section { animation: fadeSlideUp 0.4s ease both; }
  .sd-amenity-pill {
    animation: bounceIn 0.35s ease both;
    transition: transform 0.15s ease;
  }
  .sd-amenity-pill:hover { transform: scale(1.05); }
  .sd-floor-cell {
    animation: cardPop 0.3s ease both;
    transition: transform 0.15s ease;
  }
  .sd-btn {
    position: relative;
    overflow: hidden;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.2s ease;
  }
  .sd-btn:hover { transform: translateY(-1px); }
  .sd-btn:active { transform: scale(0.97); }
  .sd-btn-primary::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  .sd-back-btn { transition: transform 0.15s ease, color 0.15s ease; }
  .sd-back-btn:hover { transform: translateX(-2px); }

  @keyframes successPop {
    0%   { opacity: 0; transform: scale(0.85) translateY(8px); }
    60%  { transform: scale(1.04) translateY(-2px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  .sd-report-success { animation: successPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .sd-report-textarea {
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }
  .sd-report-textarea:focus { box-shadow: 0 0 0 3px rgba(45,106,45,0.12); }

  .sd-readonly-input {
    background-color: #f9fafb !important;
    cursor: not-allowed;
    color: #6b7280;
  }

  @media (prefers-reduced-motion: reduce) {
    .sd-header, .sd-hero-img, .sd-mobile-card, .sd-desktop-title-card,
    .sd-status-badge, .sd-section, .sd-amenity-pill, .sd-floor-cell,
    .sd-btn, .sd-back-btn {
      animation: none !important;
      transition: none !important;
    }
  }
`;

const navItems = [
  { label: "Home",         icon: <HomeIcon />,        path: "home" },
  { label: "Navigate",     icon: <NavigateIcon />,    path: "navigate" },
  { label: "Stalls",       icon: <StallIcon />,       path: "stalls" },
  { label: "Applications", icon: <ApplicationIcon />, path: "applications" },
  { label: "Records",      icon: <RecordsIcon />,     path: "records" },
  { label: "Profile",      icon: <ProfileIcon />,     path: "profile" },
];

// --- Floor plan grid ---
const floorGrid = [
  ["038", "039", "040", "041"],
  ["043", "042", "044", "045"],
  ["046", "047", "048", "049"],
];

const stallData = {
  id: "042",
  section: "Meat Section",
  zone: "Zone C",
  size: 15,
  monthlyRate: 6000,
  status: "available",
  img: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&h=400&fit=crop",
  description:
    "This premium stall is situated in the heart of the Meat Section, offering high foot traffic from early morning shoppers. Its prime corner location ensures maximum visibility from both the main entrance and the central walkway.",
  amenities: [
    { label: "Water Supply",     icon: <WaterIcon />, color: "text-[#2d6a2d] bg-[#edf5ed] border-[#c3dfc3]" },
    { label: "220V Outlets",     icon: <PowerIcon />, color: "text-amber-700 bg-amber-50 border-amber-200" },
    { label: "Waste Management", icon: <WasteIcon />, color: "text-sky-700 bg-sky-50 border-sky-200" },
  ],
};

const stallImages = {
  produce:  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop",
  fruits:   "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&h=400&fit=crop",
  seafood:  "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=800&h=400&fit=crop",
  dryGoods: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=400&fit=crop",
  meat:     "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&h=400&fit=crop",
  veggies:  "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=400&fit=crop",
};

const getStallImage = (section) => {
  const sec = (section || "").toLowerCase();
  if (sec.includes("fish") || sec.includes("sea")) return stallImages.seafood;
  if (sec.includes("meat")) return stallImages.meat;
  if (sec.includes("veg") || sec.includes("produce")) return stallImages.veggies;
  if (sec.includes("fruit")) return stallImages.fruits;
  return stallImages.dryGoods;
};

const mapAmenity = (amenity) => {
  if (typeof amenity === "object" && amenity !== null) return amenity;
  const str = String(amenity).toLowerCase();
  if (str.includes("water")) return { label: "Water Supply", icon: <WaterIcon />, color: "text-[#2d6a2d] bg-[#edf5ed] border-[#c3dfc3]" };
  if (str.includes("power") || str.includes("elect") || str.includes("220v") || str.includes("outlet")) return { label: "220V Outlets", icon: <PowerIcon />, color: "text-amber-700 bg-amber-50 border-amber-200" };
  if (str.includes("waste") || str.includes("trash") || str.includes("garbage") || str.includes("manage")) return { label: "Waste Management", icon: <WasteIcon />, color: "text-sky-700 bg-sky-50 border-sky-200" };
  return {
    label: String(amenity),
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    color: "text-gray-700 bg-gray-50 border-gray-200"
  };
};

// --- Common Problems (dropdown) ---
const COMMON_PROBLEMS = [
  { id: "electric", label: "Electrical Issue",  icon: "⚡" },
  { id: "pest",     label: "Pest / Rodents",    icon: "🐀" },
  { id: "drain",    label: "Clogged Drain",     icon: "🚿" },
  { id: "floor",    label: "Flooring / Tiles",  icon: "🪨" },
  { id: "waste",    label: "Waste Disposal",    icon: "🗑️" },
];

const REPORT_TYPES = [
  "Urgent – Needs immediate attention",
  "High – Fix within 24 hours",
  "Medium – Fix within a week",
  "Low – General maintenance",
];

// --- Stall Detail Page ---
export default function StallDetail({ stall = stallData, onBack, onNavigate, onInquiry }) {
  const displayId             = stall.stallNumber || stall.id || stall._id?.toString() || "";
  const displayImg            = stall.img || getStallImage(stall.section || stall.category);
  const displaySection        = stall.section || stall.category || "";
  const displayPrice          = stall.monthlyRate || stall.rate || 0;
  const displayDescription    = stall.description || "No description available.";
  const displayZone           = stall.zone || "";
  const displaySize           = stall.size || 0;
  const status                = stall.status || "available";
  const rawAmenities          = stall.amenities && stall.amenities.length > 0 ? stall.amenities : stallData.amenities;
  const activeAmenities       = rawAmenities.map(mapAmenity);
  const displayContractorName = stall.contractorName || "None";
  const displayContractorContact = stall.contractorContact || "N/A";

  const handleNavClick = (path) => {
    if (onNavigate) onNavigate(path);
  };

  // --- Maintenance Report state ---
  const [selectedProblem,  setSelectedProblem]  = useState("");
  const [reportType,       setReportType]       = useState("");
  const [reportDetails,    setReportDetails]    = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted,  setReportSubmitted]  = useState(false);

  // --- Move-Out Request state ---
  const [moveOutContact, setMoveOutContact] = useState(stall.renterContact || "");
  const [moveOutEmail, setMoveOutEmail] = useState(stall.renterEmail || "");
  const [moveOutReason, setMoveOutReason] = useState("");
  const [moveOutSubmitting, setMoveOutSubmitting] = useState(false);
  const [moveOutSubmitted, setMoveOutSubmitted] = useState(false);

  const handleReportSubmit = () => {
    if (reportSubmitting || reportSubmitted) return;
    if (!selectedProblem && !reportDetails.trim()) return;
    setReportSubmitting(true);

    const payload = {
      stallId: displayId,
      problem: selectedProblem,
      reportType,
      details: reportDetails,
    };

    fetch("/api/renter/maintenance-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(res => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .catch(() => {})
      .finally(() => {
        setReportSubmitting(false);
        setReportSubmitted(true);
        setTimeout(() => {
          setReportSubmitted(false);
          setSelectedProblem("");
          setReportType("");
          setReportDetails("");
        }, 3500);
      });
  };

  // --- Move-Out Request handler ---
  const handleMoveOutSubmit = () => {
    if (moveOutSubmitting || moveOutSubmitted) return;
    if (!moveOutReason.trim()) return;
    setMoveOutSubmitting(true);

    const payload = {
      stallId: displayId,
      contactNumber: moveOutContact,
      email: moveOutEmail,
      reason: moveOutReason,
    };

    fetch(`/api/renter/stalls/${stall._id || stall.id}/move-out`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(res => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .catch(() => {})
      .finally(() => {
        setMoveOutSubmitting(false);
        setMoveOutSubmitted(true);
        setTimeout(() => {
          setMoveOutSubmitted(false);
          setMoveOutReason("");
        }, 3500);
      });
  };

  return (
    <>
      <style>{stallDetailStyles}</style>
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f5f0] font-sans">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">

          {/* Desktop Top Header */}
          <header className="sd-header hidden md:flex bg-white border-b border-gray-100 px-6 py-4 items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <button onClick={onBack} className="sd-back-btn flex items-center gap-1 text-[#2d6a2d] font-bold hover:underline transition-all">
                <ArrowLeftIcon /> Back
              </button>
              <span>/</span>
              <span>Market</span>
              <ChevronRightIcon />
              <span className="cursor-pointer hover:text-gray-600 transition-colors" onClick={onBack}>Stalls</span>
              <ChevronRightIcon />
              <span className="text-gray-700 font-medium font-bold">Stall #{displayId}</span>
            </div>
          </header>

          {/* Mobile Header — overlaid on image */}
          <div className="md:hidden relative">
            <div className="relative h-52 w-full overflow-hidden">
              <img
                src={displayImg}
                alt={displaySection}
                className="sd-hero-img w-full h-full object-cover"
                onError={e => { e.target.src = "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&h=400&fit=crop"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="sd-header absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
                <button
                  onClick={onBack}
                  className="sd-back-btn w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow text-gray-700"
                >
                  <ArrowLeftIcon />
                </button>
                <span className="font-semibold text-white text-sm drop-shadow">Stall #{displayId}</span>
              </div>
              <div className="absolute top-4 right-4 mt-10">
                <span className={`sd-status-badge text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow text-white ${
                  status === "available" ? "bg-[#2d6a2d]" : status === "occupied" ? "bg-red-600" : "bg-amber-600"
                }`}>
                  {status}
                </span>
              </div>
            </div>

            {/* Mobile card */}
            <div className="sd-mobile-card bg-white rounded-t-3xl -mt-4 relative px-4 pt-4 pb-4 shadow-sm">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Stall #{displayId}</h1>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
                    <span>{displaySection}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Monthly Rate</p>
                  <p className="text-xl font-bold text-[#2d6a2d]">₱{displayPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Hero */}
          <div className="hidden md:block px-6 pt-5">
            <div className="relative rounded-2xl overflow-hidden h-56 w-full shadow-sm">
              <img
                src={displayImg}
                alt={displaySection}
                className="sd-hero-img w-full h-full object-cover"
                onError={e => { e.target.src = "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&h=400&fit=crop"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <div className="absolute top-3 right-3">
                <span className={`sd-status-badge text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow text-white ${
                  status === "available" ? "bg-[#2d6a2d]" : status === "occupied" ? "bg-red-600" : "bg-amber-600"
                }`}>
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop title & rate card */}
          <div className="hidden md:block px-6 pt-4">
            <div className="sd-desktop-title-card bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Stall #{displayId}</h1>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
                  <span>{displaySection}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Monthly Rate</p>
                <p className="text-2xl font-bold text-[#2d6a2d]">₱{displayPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Shared body */}
          <div className="px-4 md:px-6 pt-3 pb-4 space-y-3">

            {/* Description */}
            <div className="sd-section bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm" style={{ animationDelay: "0.15s" }}>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {displayDescription.split("high foot traffic").map((part, i, arr) =>
                  i < arr.length - 1
                    ? <span key={i}>{part}<strong className="text-gray-900 font-semibold">high foot traffic</strong></span>
                    : <span key={i}>{part}</span>
                )}
              </p>
            </div>

            {/* Zone + Size + Contractor + Contractor Contact */}
            <div className="sd-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" style={{ animationDelay: "0.22s" }}>
              <div className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 bg-[#edf5ed] rounded-lg flex items-center justify-center text-[#2d6a2d] shrink-0">
                  <ZoneIcon />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Zone</p>
                  <p className="text-sm font-bold text-gray-900">{displayZone}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 shrink-0">
                  <SizeIcon />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Size</p>
                  <p className="text-sm font-bold text-gray-900">{displaySize} sqm</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                  <ProfileIcon />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Contractor</p>
                  <p className="text-sm font-bold text-gray-900">{displayContractorName}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Contractor Contact</p>
                  <p className="text-sm font-bold text-gray-900">{displayContractorContact}</p>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="sd-section bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm" style={{ animationDelay: "0.29s" }}>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2.5">Stall Amenities</p>
              <div className="flex flex-wrap gap-2">
                {activeAmenities.map((a, idx) => (
                  <span
                    key={a.label}
                    className={`sd-amenity-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${a.color}`}
                    style={{ animationDelay: `${0.32 + idx * 0.07}s` }}
                  >
                    {a.icon}
                    {a.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Floor Plan */}
            <div className="sd-section bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm" style={{ animationDelay: "0.36s" }}>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-3">Floor Plan Location</p>
              <div className="space-y-1.5">
                {floorGrid.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-4 gap-1.5">
                    {row.map((cell, ci) => (
                      <div
                        key={cell}
                        className={`sd-floor-cell h-10 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                          cell === displayId
                            ? "bg-[#e87722] text-white shadow-sm scale-105"
                            : "bg-gray-100 text-gray-400"
                        }`}
                        style={{ animationDelay: `${0.38 + (ri * 4 + ci) * 0.04}s` }}
                      >
                        {cell}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[10px] text-gray-400">Section: {displaySection} ({displayZone})</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#e87722]" />
                  <span className="text-[10px] text-gray-500 font-semibold">Your Selection</span>
                </div>
              </div>
            </div>

            {/* Maintenance Report — only for occupied stalls */}
            {status === "occupied" && <div className="sd-section bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm" style={{ animationDelay: "0.44s" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center text-red-500 shrink-0">
                  <WrenchIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Report a Problem</p>
                  <p className="text-[10px] text-gray-400">Submit a maintenance request for this stall</p>
                </div>
              </div>

              {reportSubmitted ? (
                <div className="sd-report-success bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 items-start">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
                    <CheckDoneIcon />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-800 mb-0.5">Report Submitted!</p>
                    <p className="text-xs text-green-700 leading-relaxed">
                      Our maintenance team has been notified and will respond within 24–48 hours.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">

                  {/* Common problems — dropdown */}
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Common Problems</p>
                    <div className="relative">
                      <select
                        value={selectedProblem}
                        onChange={e => setSelectedProblem(e.target.value)}
                        className="w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#2d6a2d] focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select a problem…</option>
                        {COMMON_PROBLEMS.map(p => (
                          <option key={p.id} value={p.id}>{p.icon}  {p.label}</option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                  </div>

                  {/* Priority level */}
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Priority Level</p>
                    <div className="relative">
                      <select
                        value={reportType}
                        onChange={e => setReportType(e.target.value)}
                        className="w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#2d6a2d] focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select priority level…</option>
                        {REPORT_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                  </div>

                  {/* Describe the problem */}
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Describe the Problem</p>
                    <textarea
                      value={reportDetails}
                      onChange={e => setReportDetails(e.target.value)}
                      placeholder="e.g. The water pipe near the left corner has been leaking since Monday morning. It's affecting the floor and nearby stalls…"
                      rows={4}
                      className="sd-report-textarea w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2d6a2d] focus:bg-white transition-all duration-200 resize-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 text-right">{reportDetails.length} / 500</p>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleReportSubmit}
                    disabled={reportSubmitting || (!selectedProblem && !reportDetails.trim())}
                    className="sd-btn w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-red-500 hover:bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <SendReportIcon />
                    {reportSubmitting ? "Submitting…" : "Submit Maintenance Report"}
                  </button>
                </div>
              )}
            </div>}

            {/* Move-Out Request Section — only for occupied stalls */}
            {status === "occupied" && <div className="sd-section bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm" style={{ animationDelay: "0.51s" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center text-red-500 shrink-0">
                  <MoveOutIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Request Move-Out</p>
                  <p className="text-[10px] text-gray-400">Notify the contractor of your intention to vacate</p>
                </div>
              </div>

              {moveOutSubmitted ? (
                <div className="sd-report-success bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 items-start">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
                    <CheckDoneIcon />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-800 mb-0.5">Move-Out Request Submitted!</p>
                    <p className="text-xs text-green-700 leading-relaxed">
                      The contractor has been notified and will review your request. They will contact you at <strong>{moveOutEmail}</strong> or <strong>{moveOutContact}</strong> within 24–48 hours to discuss the move-out process.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">

                  {/* Contact Number (Read-only) */}
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Contact Number</p>
                    <input
                      type="text"
                      value={moveOutContact}
                      readOnly
                      className="sd-readonly-input w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-2.5 text-sm text-gray-600 focus:outline-none transition-all duration-200"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Email Address</p>
                    <input
                      type="email"
                      value={moveOutEmail}
                      readOnly
                      className="sd-readonly-input w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-2.5 text-sm text-gray-600 focus:outline-none transition-all duration-200"
                    />
                  </div>

                  {/* Reason for Move-Out */}
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Reason for Move-Out</p>
                    <textarea
                      value={moveOutReason}
                      onChange={e => setMoveOutReason(e.target.value)}
                      placeholder="e.g. Need to relocate due to personal reasons, finding a larger space, etc…"
                      rows={4}
                      className="sd-report-textarea w-full bg-[#f5f5f0] border border-transparent rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#dc2626] focus:bg-white transition-all duration-200 resize-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 text-right">{moveOutReason.length} / 500</p>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleMoveOutSubmit}
                    disabled={moveOutSubmitting || !moveOutReason.trim()}
                    className="sd-btn w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <MoveOutIcon />
                    {moveOutSubmitting ? "Submitting…" : "Submit Move-Out Request"}
                  </button>
                </div>
              )}
            </div>}

            {/* CTA Buttons */}
            <div className="sd-section space-y-2.5 pt-1" style={{ animationDelay: "0.52s" }}>
              <button
                onClick={() => handleNavClick("navigate")}
                className="sd-btn w-full py-3 rounded-xl border-2 border-[#2d6a2d] text-[#2d6a2d] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#edf5ed]"
              >
                <TourIcon />
                View in 360° Tour
              </button>
              <button
                disabled={status !== "available"}
                onClick={() => {
                  if (onInquiry) {
                    onInquiry(stall);
                  } else {
                    handleNavClick("applications");
                  }
                }}
                className={`sd-btn w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm ${
                  status === "available"
                    ? "sd-btn-primary bg-[#e87722] hover:bg-[#d06618] text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300/30"
                }`}
              >
                <InquiryIcon />
                {status === "occupied"
                  ? "Stall Occupied"
                  : status === "pending"
                  ? "Application Pending"
                  : "Send Rental Inquiry"}
              </button>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}