import { useState, useEffect } from "react";
import { getUser } from "../../utils/auth";

const stallsStyles = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(-14px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes cardPop {
    0% { opacity: 0; transform: translateY(16px) scale(0.97); }
    60% { transform: translateY(-2px) scale(1.005); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes emptyBounce {
    0%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
    60% { transform: translateY(-3px); }
  }
  @keyframes filterSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .stalls-header {
    animation: fadeSlideIn 0.4s ease both;
  }
  .stalls-search {
    animation: fadeSlideUp 0.4s ease 0.1s both;
  }
  .stalls-search input {
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .stalls-search input:focus {
    box-shadow: 0 0 0 3px rgba(26,92,42,0.12);
  }
  .stalls-filters {
    animation: fadeSlideUp 0.4s ease 0.16s both;
  }
  .filter-btn {
    transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.15s ease;
  }
  .filter-btn:hover {
    transform: scale(1.04);
  }
  .filter-btn:active {
    transform: scale(0.96);
  }
  .stall-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .stall-card.clickable:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 10px 28px rgba(0,0,0,0.11);
  }
  .stall-card.clickable:active {
    transform: scale(0.98);
  }
  .stall-card.clickable img {
    transition: transform 0.35s ease;
  }
  .stall-card.clickable:hover img {
    transform: scale(1.04);
  }
  .toggle-btn {
    position: relative;
    overflow: hidden;
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
  }
  .toggle-btn:hover {
    transform: translateY(-1px);
  }
  .toggle-btn:active {
    transform: scale(0.97);
  }
  .toggle-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  .empty-icon {
    animation: emptyBounce 0.7s ease both;
  }
  .empty-card {
    animation: cardPop 0.5s ease both;
  }
  .avail-btn {
    position: relative;
    overflow: hidden;
    transition: background-color 0.2s ease, transform 0.15s ease;
  }
  .avail-btn:hover {
    transform: translateY(-1px);
  }
  .avail-btn:active {
    transform: scale(0.97);
  }
  .avail-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  .no-results {
    animation: fadeSlideUp 0.4s ease both;
  }
`

// --- Icons ---
const Icon = ({ d, size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

const SearchIcon = () => (
  <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" size={16} />
);

const CloseIcon = () => <Icon d="M18 6L6 18M6 6l12 12" size={16} />;

const StoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// --- Data ---
const stallImages = {
  produce: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=200&fit=crop",
  fruits: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=200&fit=crop",
  seafood: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&h=200&fit=crop",
  dryGoods: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=200&fit=crop",
  meat: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=200&fit=crop",
  veggies: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=200&fit=crop",
};

// --- Card ---
const StatusBadge = ({ status }) => (
  <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full transition-transform hover:scale-105 ${status === "available" ? "bg-[#2d6a2d] text-white" : "bg-red-600 text-white"
    }`}>
    {status}
  </span>
);

const getStallImage = (section) => {
  const sec = (section || "").toLowerCase();
  if (sec.includes("fish") || sec.includes("sea")) return stallImages.seafood;
  if (sec.includes("meat")) return stallImages.meat;
  if (sec.includes("veg") || sec.includes("produce")) return stallImages.veggies;
  if (sec.includes("fruit")) return stallImages.fruits;
  return stallImages.dryGoods;
};

const StallCard = ({ stall, onClick, animDelay = "0s", isBlocked = false }) => {
  const displayId = stall.stallNumber || stall.id || stall._id?.toString() || "";
  const displayCategory = stall.section || stall.category || "";
  const displayZone = stall.zone ? `Zone ${stall.zone}` : (stall.floorArea ? (stall.floorArea === 'upper' ? 'Upper Floor' : 'Lower Floor') : "");
  const displaySize = stall.size || 12;
  const displayPrice = stall.monthlyRate || stall.price || 0;
  const displayImg = stall.img || getStallImage(stall.section || stall.category);

  return (
    <div
      onClick={isBlocked ? undefined : onClick}
      className={`stall-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 ${isBlocked ? 'cursor-not-allowed opacity-60' : 'clickable cursor-pointer'
        }`}
      style={{ animation: `cardPop 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${animDelay} both` }}
      title={isBlocked ? "This stall is occupied" : undefined}
    >
      <div className="relative h-36 overflow-hidden">
        <img src={displayImg} className="w-full h-full object-cover" alt={displayCategory} />
        <StatusBadge status={stall.status} />
        {isBlocked && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full">
              Not Available
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="font-bold text-gray-900">Stall #{displayId}</p>
        <p className="text-xs text-gray-500">{displayZone} · {displayCategory}</p>

        <div className="text-xs font-semibold text-gray-700 mt-2">
          {displaySize} sqm · ₱{displayPrice.toLocaleString()}/mo
        </div>
      </div>
    </div>
  );
};

// --- MAIN ---
export default function RenterStalls({ onNavigate, onOpenStall }) {
  const [stalls, setStalls] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const currentUser = getUser();
  const userEmail = currentUser?.email?.toLowerCase();

  useEffect(() => {
    fetch("/api/renter/stalls")
      .then((res) => res.json())
      .then((data) => setStalls(data))
      .catch(() => {
        setStalls([
          { id: "042", zone: "A", category: "Produce", status: "available", size: 12.5, price: 3200, img: stallImages.produce },
          { id: "089", zone: "D", category: "Fruits", status: "occupied", size: 15.0, price: 4500, img: stallImages.fruits, tenant: { email: "vendor@mytalipapa.com", name: "Juan Dela Cruz" } },
          { id: "112", zone: "C", category: "Seafood", status: "available", size: 10.0, price: 2800, img: stallImages.seafood },
          { id: "055", zone: "A", category: "Dry Goods", status: "available", size: 12.5, price: 3200, img: stallImages.dryGoods },
          { id: "031", zone: "B", category: "Meat", status: "occupied", size: 18.0, price: 5100, img: stallImages.meat, tenant: { email: "vendor@mytalipapa.com", name: "Juan Dela Cruz" } },
          { id: "077", zone: "B", category: "Vegetables", status: "available", size: 9.5, price: 2500, img: stallImages.veggies },
        ]);
      });
  }, []);

  const filters = ["All", "Available", "Occupied", "Zone A", "Zone B", "Zone C", "Zone D", "Zone E", "Zone F", "Zone G", "Zone H"];

  const ownedStalls = stalls.filter((s) =>
    s.status === "occupied" &&
    s.tenant &&
    s.tenant.email &&
    s.tenant.email.toLowerCase() === userEmail
  );

  const hasOwnedStalls = ownedStalls.length > 0;
  const displayedStalls = showAll ? stalls : ownedStalls;

  const filtered = displayedStalls.filter((s) => {
    const stallCategory = s.category || s.section || "";
    const stallZone = s.zone || (s.floorArea === 'upper' ? 'A' : (s.floorArea === 'lower' ? 'B' : 'A'));

    const matchSearch =
      (s.stallNumber || s.id || "").toString().toLowerCase().includes(search.toLowerCase()) ||
      stallZone.toLowerCase().includes(search.toLowerCase()) ||
      stallCategory.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "All" ||
      (filter === "Available" && s.status === "available") ||
      (filter === "Occupied" && s.status === "occupied") ||
      filter === `Zone ${stallZone}`;

    return matchSearch && matchFilter;
  });

  const isBlocked = (stall) =>
    stall.status === 'occupied' &&
    stall.tenant?.email?.toLowerCase() !== userEmail;

  return (
    <>
      <style>{stallsStyles}</style>
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#f5f5f0] font-sans">

        <main className="px-4 md:px-6 py-5 space-y-5">

          {/* Header */}
          <div className="stalls-header flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-950">Market Stalls</h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                {showAll ? "Browse available stalls to rent" : "My occupied stalls"}
              </p>
            </div>

            {hasOwnedStalls && (
              <button
                onClick={() => setShowAll(!showAll)}
                className={`toggle-btn px-4 py-2 rounded-xl text-xs font-bold active:scale-95 ${showAll
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-[#1a5c2a] text-white hover:bg-[#154d23]"
                  }`}
              >
                {showAll ? "Show Only My Stalls" : "Avail Another Stall"}
              </button>
            )}
          </div>

          {!showAll && !hasOwnedStalls ? (
            <div className="empty-card bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto space-y-4 my-8">
              <div className="w-12 h-12 bg-green-50 text-[#1a5c2a] rounded-full flex items-center justify-center mx-auto empty-icon">
                <StoreIcon />
              </div>
              <div style={{ animation: 'fadeSlideUp 0.4s ease 0.15s both' }}>
                <h3 className="font-extrabold text-gray-950 text-sm">No Occupied Stalls</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  You do not own or lease any stalls in the market yet.
                </p>
              </div>
              <button
                onClick={() => setShowAll(true)}
                className="avail-btn bg-[#1a5c2a] text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-[#154d23]"
                style={{ animation: 'fadeSlideUp 0.4s ease 0.25s both' }}
              >
                Avail a Stall
              </button>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="stalls-search relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon />
                </span>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search stalls..."
                  className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#1a5c2a] transition-all"
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors hover:scale-110"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="stalls-filters flex gap-2 overflow-x-auto pb-1">
                {filters.map((f, idx) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`filter-btn px-4 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${filter === f
                        ? "bg-[#2d6a2d] text-white border-transparent"
                        : "bg-white text-gray-500 border-gray-200 hover:text-gray-700"
                      }`}
                    style={{ animation: `filterSlideIn 0.3s ease ${0.18 + idx * 0.03}s both` }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length > 0 ? (
                  filtered.map((stall, idx) => (
                    <StallCard
                      key={stall.id || stall._id}
                      stall={stall}
                      isBlocked={isBlocked(stall)}
                      onClick={() => {
                        if (!isBlocked(stall)) {
                          onOpenStall && onOpenStall(stall);
                        }
                      }}
                      animDelay={`${0.22 + idx * 0.07}s`}
                    />
                  ))
                ) : (
                  <div className="no-results col-span-full bg-white border border-gray-100 rounded-2xl py-12 text-center text-xs text-gray-400 font-semibold shadow-sm">
                    No stalls match your search or filters.
                  </div>
                )}
              </div>
            </>
          )}

        </main>
      </div>
    </>
  );
}