import { useEffect, useRef, useState } from 'react'



import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  X,
  MapPin,
  Zap,
  Maximize2,
  RotateCcw,
  Compass as CompassIcon,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  HelpCircle,
  Send,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Store,
  Eye,
  EyeOff,
  Shield,
  ShieldOff,
  Phone,
  User
} from 'lucide-react'

const getStallZone = (num, category) => {
  const stallId = String(num);
  if (category === 'meat') {
    if (['1', '2', '3', '4', '5', '12', '13'].includes(stallId) || stallId.startsWith('empty')) {
      return 'Zone A';
    }
    if (['51', '52', '53', '54', '55', '56'].includes(stallId)) {
      return 'Zone C';
    }
    if (['1(u2)', '2(u2)', '3(u2)', '4(u2)', '8(u2)', '9(u2)', '10(u2)'].includes(stallId)) {
      return 'Zone F';
    }
    return 'Zone E';
  } else if (category === 'fish') {
    const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
    if (numInt >= 11 && numInt <= 20) {
      return 'Zone A';
    }
    if (numInt >= 21 && numInt <= 40) {
      return 'Zone B';
    }
    if ((numInt >= 41 && numInt <= 50) || (numInt >= 57 && numInt <= 60)) {
      return 'Zone C';
    }
    return 'Zone D';
  } else if (category === 'veggies') {
    const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
    if (numInt >= 5 && numInt <= 24) {
      return 'Zone F';
    }
    if (numInt >= 25 && numInt <= 48) {
      return 'Zone G';
    }
    return 'Zone H';
  }
  return 'Zone A';
};

// Helper to programmatically generate details for all 142 stalls in the folder
const generateStalls = (category, numbers) => {
  const meatNames = [
    "Aling Nena's Pork & Beef", "Juan's Choice Cuts", "Fresh Poultry Center",
    "Bulacan Specialty Longganisa", "Master Choice Pork", "Native Chicken Supply",
    "Mang Tomas Meat Shop", "Prime Cuts Retailer", "Batangas Beef Stand",
    "Hog & Cattle Fresh Meat", "Aling Belen's Pork Shop", "Choice Chicken Outlet"
  ];
  const fishNames = [
    "Dagupan Fresh Bangus", "Seafood Express", "Aling Marta's Fresh Catch",
    "Deep Sea Fishery", "Shellfish & Squid Station", "Bataan Crab & Prawns",
    "Dried Fish & Anchovies", "Shrimp & Lobsters Corner", "Squid & Octopus Hub",
    "Manila Bay Fresh Seafood", "Aling Cora's Tilapia Stand"
  ];
  const veggieNames = [
    "Baguio Veggies Fresh", "Organic Greens & Salads", "Onion, Garlic & Spices Center",
    "Lola Elena's Pinakbet Veggies", "Highland Fresh Produce", "Garlic, Ginger & Chili Shop",
    "Sweet Potato & Root Crops", "Benguet Cabbage Corner", "Fresh Tomato & Cucumber",
    "Native Corn & Squash", "Hydroponics Greens & Herbs", "Aling Rosa's Pumpkin Stand"
  ];

  const productsData = {
    meat: [
      ['Pork Belly (Liempo): ₱340/kg', 'Pork Chop: ₱310/kg', 'Ground Pork: ₱290/kg', 'Pork Ribs: ₱320/kg'],
      ['Beef Sirloin: ₱420/kg', 'Beef Shank (Bulalo): ₱380/kg', 'Ground Beef: ₱350/kg', 'Beef Brisket: ₱390/kg'],
      ['Whole Chicken: ₱180/kg', 'Chicken Breast: ₱210/kg', 'Chicken Wings: ₱190/kg', 'Chicken Drumsticks: ₱200/kg'],
      ['Garlic Longganisa: ₱150/pack', 'Sweet Longganisa: ₱150/pack', 'Tocino: ₱160/pack', 'Beef Tapa: ₱180/pack'],
      ['Pork Tenderloin: ₱350/kg', 'Pork Pata: ₱260/kg', 'Beef Caldereta Cuts: ₱370/kg']
    ],
    fish: [
      ['Dagupan Bangus: ₱180/kg', 'Boneless Bangus: ₱210/kg', 'Daing na Bangus: ₱190/kg'],
      ['Tiger Prawns: ₱580/kg', 'White Shrimp: ₱380/kg', 'Mud Crabs (Alimango): ₱650/kg'],
      ['Live Tilapia: ₱140/kg', 'Catfish (Hito): ₱160/kg', 'Galunggong: ₱180/kg'],
      ['Yellowfin Tuna: ₱380/kg', 'Salmon Steaks: ₱550/kg', 'Red Snapper (Maya-Maya): ₱320/kg'],
      ['Fresh Squid: ₱280/kg', 'Mussels (Tahong): ₱90/kg', 'Clams (Halaan): ₱120/kg']
    ],
    veggies: [
      ['Cabbage (Repolyo): ₱70/kg', 'Carrots: ₱80/kg', 'Potato (Patatas): ₱90/kg', 'Broccoli: ₱150/kg'],
      ['Lettuce: ₱120/kg', 'Cherry Tomatoes: ₱140/kg', 'Kale: ₱180/kg', 'Spinach: ₱100/kg'],
      ['Red Onion: ₱120/kg', 'White Onion: ₱150/kg', 'Garlic: ₱130/kg', 'Ginger: ₱110/kg'],
      ['Eggplant: ₱60/kg', 'Ampalaya (Bittergourd): ₱80/kg', 'Squash (Kalabasa): ₱40/kg', 'Okra: ₱50/kg'],
      ['Cauliflower: ₱120/kg', 'Sayote: ₱40/kg', 'Bell Peppers: ₱160/kg', 'Celery: ₱100/kg']
    ]
  };

  const productsPool = productsData[category];

  return numbers.map((num, index) => {
    const products = productsPool[index % productsPool.length];

    const numInt = parseInt(String(num).match(/^\d+/)?.[0]) || (index + 1);

    // Water Access distance
    const isNearWater = numInt % 3 === 0;
    const waterAccess = isNearWater ? 'Near CR (Easy Access)' : 'Far from CR (Fetching Required)';

    // Rental Price (depends on water access, around 12k - 18k, average 15k)
    const priceVal = 12000 + (isNearWater ? 1000 : 0) + (numInt % 3) * 1000;
    const price = `₱${priceVal.toLocaleString()}`;

    const status = numInt % 3 === 0 ? 'Occupied' : 'Available';
    const electricitySetup = numInt % 2 === 0 ? 'Sub-metered' : 'Shared Meter';
    const utilities = `Electricity (Paid by Renter - ${electricitySetup}) · Water (Free)`;
    const zone = getStallZone(num, category);

    let displayName = `Stall #${num}`;
    if (String(num).startsWith('nostallnum')) {
      const indexStr = String(num).replace('nostallnum', '');
      displayName = `Unnumbered Stall #${indexStr}`;
    } else if (String(num).startsWith('empty')) {
      const numStr = String(num).replace('empty', '') || '1';
      displayName = `Empty Stall #${numStr}`;
    } else if (String(num).includes('(u)') || String(num).includes('(2)') || String(num).includes('u2')) {
      const baseNum = String(num).match(/^\d+/)?.[0] || String(num);
      displayName = `${zone} - Stall #${baseNum}`;
    }

    return {
      id: String(num),
      name: displayName,
      price,
      status,
      utilities,
      electricitySetup,
      waterAccess,
      zone,
      products
    };
  });
};

const SECTIONS = {
  meat: {
    id: 'meat',
    name: 'Meat Section',
    icon: '',
    bgTheme: 'from-red-500/20 to-transparent',
    accentColor: '#ef4444',
    stalls: generateStalls('meat', [
      '1', '1(u)', '1(u2)', '2', '2(u)', '2(u2)', '3', '3(u)', '3(u2)', '4', '4(u)', '4(u2)',
      '5', 'empty', 'empty2', 'empty3',
      '5(u)', '6', '7', '8', '9', '10', '8(u)', '9(u)', '10(u)', '11', '12', '12(u)', '13', '13(u)', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24',
      '51', '52', '53', '54', '55', '56'
    ])
  },
  fish: {
    id: 'fish',
    name: 'Fish Section',
    icon: '',
    bgTheme: 'from-blue-500/20 to-transparent',
    accentColor: '#3b82f6',
    stalls: generateStalls('fish', [
      '11', '14', '15', '16', '17', '18', '19', '20',
      '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
      '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
      '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
      '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75',
      'nostallnum1', 'nostallnum2', 'nostallnum3', 'nostallnum4', 'nostallnum5'
    ])
  },
  veggies: {
    id: 'veggies',
    name: 'Vegetables Section',
    icon: '',
    bgTheme: 'from-green-500/20 to-transparent',
    accentColor: '#10b981',
    stalls: generateStalls('veggies', [
      '5', '6', '7', '11', '12', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
      '41', '42', '43', '44', '45', '46', '47', '48', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
      '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72'
    ])
  }
}

const getStallImagePath = (id, category) => {
  const stallId = String(id);
  if (category === 'meat') {
    if (stallId === '3') return '/export360/stall3  - meat.jpg';
    if (stallId === '4') return '/export360/stall4 -  meat.jpg';
    if (stallId === '10') return '/export360/stall10 -  meat.jpg';
    if (stallId === '11') return '/export360/stall11-  meat.jpg';
    if (stallId === '12') return '/export360/stall12(2) - meat.jpg';
    if (stallId === '13') return '/export360/stall13(2)- meat.jpg';
    if (stallId === '19') return '/export360/stall19 -meat.jpg';
    if (stallId === '20') return '/export360/stall20 -  meat.jpg';
    if (stallId === '22') return '/export360/stall22 -  meat.jpg';
    if (stallId.startsWith('empty')) {
      return `/export360/${stallId}.jpg`;
    }

    // Doubled / unoccupied / alternative stalls in meat:
    if (stallId === '1(u)') return '/export360/stall1(u) - meat.jpg';
    if (stallId === '2(u)') return '/export360/stall2(u) - meat.jpg';
    if (stallId === '5(u)') return '/export360/stall5(u) - meat.jpg';
    if (stallId === '1(u2)') return '/export360/stall13 - meat.jpg';
    if (stallId === '2(u2)') return '/export360/stall14 - meat.jpg';
    if (stallId === '3(u2)') return '/export360/stall15 - meat.jpg';
    if (stallId === '4(u2)') return '/export360/stall16 - meat.jpg';
    if (stallId === '3(u)') return '/export360/stall3(u)-  meat.jpg';
    if (stallId === '4(u)') return '/export360/stall3(u)-  meat.jpg';
    if (stallId === '8(u)') return '/export360/stall20 -  meat.jpg';
    if (stallId === '9(u)') return '/export360/stall21 - meat.jpg';
    if (stallId === '10(u)') return '/export360/stall22 -  meat.jpg';
    if (stallId === '12(u)') return '/export360/stall12 - meat.jpg';
    if (stallId === '13(u)') return '/export360/stall13 - meat.jpg';

    return `/export360/stall${stallId} - meat.jpg`;
  } else if (category === 'fish') {
    if (stallId === '11') return '/export360/stall11 -  fishes.jpg';
    const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
    if (numInt === 21) {
      return '/export360/stall11 -  fishes.jpg';
    }
    if (numInt === 22) {
      return '/export360/stall12(2) - meat.jpg';
    }
    if (numInt === 23) {
      return '/export360/stall13(2)- meat.jpg';
    }
    if (numInt >= 24 && numInt <= 30) {
      const oppositeStall = numInt - 10;
      return `/export360/stall${oppositeStall} - fishes.jpg`;
    }
    if (numInt >= 41 && numInt <= 50) {
      const oppositeStall = numInt - 10;
      return `/export360/stall${oppositeStall} - fishes.jpg`;
    }
    if (numInt >= 61 && numInt <= 66) {
      const oppositeStall = numInt - 10;
      return `/export360/stall${oppositeStall} - meat.jpg`;
    }
    if (numInt >= 67 && numInt <= 70) {
      const oppositeStall = numInt - 10;
      return `/export360/stall${oppositeStall} - fishes.jpg`;
    }
    if (String(stallId).startsWith('nostallnum')) {
      return `/export360/${stallId}.jpg`;
    }
    return `/export360/stall${stallId} - fishes.jpg`;
  } else if (category === 'veggies') {
    const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
    if (numInt === 5) return '/export360/stall17 - meat.jpg';
    if (numInt === 6) return '/export360/stall18 - meat.jpg';
    if (numInt === 7) return '/export360/stall19 -meat.jpg';
    if (numInt === 11) return '/export360/stall23 - meat.jpg';
    if (numInt === 12) return '/export360/stall24 - meat.jpg';
    if (numInt >= 13 && numInt <= 23) {
      const oppositeStall = numInt + 12;
      return `/export360/stall${oppositeStall} - vegies.jpg`;
    }
    if (numInt >= 50 && numInt <= 60) {
      const oppositeStall = numInt - 12;
      return `/export360/stall${oppositeStall} - vegies.jpg`;
    }
    if (numInt === 36) {
      return '/export360/stall24 - vegies.jpg';
    }
    return `/export360/stall${stallId} - vegies.jpg`;
  }
  return `/export360/stall${stallId}.jpg`;
};

export default function MarketTour360() {
  const navigate = useNavigate()
  const location = useLocation()
  const stateStall = location.state?.stall

  // Tab State
  const [activeSectionKey, setActiveSectionKey] = useState(() => {
    if (stateStall) {
      const sectionName = stateStall.section || stateStall.category;
      if (sectionName) {
        const lower = sectionName.toLowerCase();
        if (lower.includes('meat')) return 'meat';
        if (lower.includes('fish') || lower.includes('sea')) return 'fish';
        if (lower.includes('veg') || lower.includes('produce') || lower.includes('fruit') || lower.includes('dry')) return 'veggies';
      }
    }
    return 'meat';
  })
  const [sectionsData, setSectionsData] = useState(SECTIONS);

  // Set CSS variable for mobile viewport height to handle address bar resizing
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);
  const activeSection = sectionsData[activeSectionKey]

  // Stall Selection State
  const [stallIndex, setStallIndex] = useState(() => {
    if (stateStall) {
      const sectionName = stateStall.section || stateStall.category;
      let sectionKey = 'meat';
      if (sectionName) {
        const lower = sectionName.toLowerCase();
        if (lower.includes('meat')) sectionKey = 'meat';
        else if (lower.includes('fish') || lower.includes('sea')) sectionKey = 'fish';
        else if (lower.includes('veg') || lower.includes('produce') || lower.includes('fruit') || lower.includes('dry')) sectionKey = 'veggies';
      }
      const cleanId = (str) => String(str).replace(/Stall\s*#/gi, '').replace('#', '').trim().toLowerCase().replace(/^0+(?=\d)/, '');
      const targetStallNum = cleanId(stateStall.stallNumber || stateStall.id || '');
      console.log('[MarketTour360] stateStall provided:', stateStall, 'resolved sectionKey:', sectionKey, 'targetStallNum:', targetStallNum);
      const idx = SECTIONS[sectionKey].stalls.findIndex(s => cleanId(s.id) === targetStallNum);
      console.log('[MarketTour360] findIndex result for targetStallNum:', targetStallNum, 'is index:', idx);
      if (idx !== -1) return idx;
    }
    return 0;
  })
  const currentStall = activeSection.stalls[stallIndex] || activeSection.stalls[0]

  // Interactive UI State
  const [selectedStall, setSelectedStall] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [uiVisible, setUiVisible] = useState(true)
  const [detailsCollapsed, setDetailsCollapsed] = useState(false)
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false)
  const [privacyMode, setPrivacyMode] = useState(true)
  const [stallDropdownOpen, setStallDropdownOpen] = useState(false)

  // Floating Tooltip State
  const [hoveredHotspot, setHoveredHotspot] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Three.js Refs
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const materialRef = useRef(null)
  const frameRef = useRef(null)
  const isDragging = useRef(false)
  const [cursor, setCursor] = useState('grab')
  const lastPos = useRef({ x: 0, y: 0 })
  const spherical = useRef({ phi: Math.PI / 2, theta: 0 })
  const hotspotMeshes = useRef([])
  const [compassAngle, setCompassAngle] = useState(0)

  // Sync details sheet when stall changes
  useEffect(() => {
    setSelectedStall(currentStall)
  }, [currentStall])

  // Track active references to prevent stale closures in events
  const stateRef = useRef({ activeSectionKey, stallIndex, currentStall })
  useEffect(() => {
    stateRef.current = { activeSectionKey, stallIndex, currentStall }
  }, [activeSectionKey, stallIndex, currentStall])

  // Fetch real stalls from database on mount and merge details into sectionsData
  useEffect(() => {
    fetch('/api/renter/stalls')
      .then((res) => res.json())
      .then((dbStalls) => {
        if (!Array.isArray(dbStalls)) return;

        console.log('[MarketTour360] Fetched database stalls:', dbStalls);

        setSectionsData((prevSections) => {
          const updated = { ...prevSections };

          const dbStallMap = {};
          const cleanId = (str) => String(str).replace(/Stall\s*#/gi, '').replace('#', '').trim().toLowerCase().replace(/^0+(?=\d)/, '');

          dbStalls.forEach((dbStall) => {
            const key = cleanId(dbStall.stallNumber || dbStall.id || '');
            if (key) {
              dbStallMap[key] = dbStall;
            }
          });

          Object.keys(updated).forEach((secKey) => {
            updated[secKey] = {
              ...updated[secKey],
              stalls: updated[secKey].stalls.map((s) => {
                const cleanedId = cleanId(s.id);
                const dbStall = dbStallMap[cleanedId];

                if (dbStall) {
                  return {
                    ...s,
                    price: dbStall.monthlyRate ? `₱${dbStall.monthlyRate.toLocaleString()}` : s.price,
                    status: dbStall.status ? (dbStall.status.charAt(0).toUpperCase() + dbStall.status.slice(1)) : s.status,
                    utilities: dbStall.utilities || s.utilities,
                    electricitySetup: dbStall.electricitySetup || s.electricitySetup,
                    waterAccess: dbStall.waterAccess || s.waterAccess,
                    zone: dbStall.zone ? `Zone ${dbStall.zone}` : s.zone,
                    contractorName: dbStall.contractorName || 'None',
                    contractorContact: dbStall.contractorContact || 'N/A',
                    size: dbStall.size || s.size || 12,
                    description: dbStall.description || s.description || s.name
                  };
                }
                return s;
              })
            };
          });

          return updated;
        });
      })
      .catch((err) => {
        console.error('[MarketTour360] Failed to fetch stalls from database:', err);
      });
  }, []);

  const isInitialMount = useRef(true);

  // Sync state when location.state (stateStall) changes (e.g. user clicked View in 360 from Stall Details)
  useEffect(() => {
    if (stateStall) {
      console.log('[MarketTour360] stateStall changed or component navigated with state:', stateStall);

      // Resolve Section Key
      const sectionName = stateStall.section || stateStall.category;
      let sectionKey = 'meat';
      if (sectionName) {
        const lower = sectionName.toLowerCase();
        if (lower.includes('meat')) sectionKey = 'meat';
        else if (lower.includes('fish') || lower.includes('sea')) sectionKey = 'fish';
        else if (lower.includes('veg') || lower.includes('produce') || lower.includes('fruit') || lower.includes('dry')) sectionKey = 'veggies';
      }

      const cleanId = (str) => String(str).replace(/Stall\s*#/gi, '').replace('#', '').trim().toLowerCase().replace(/^0+(?=\d)/, '');
      const targetStallNum = cleanId(stateStall.stallNumber || stateStall.id || '');

      const idx = sectionsData[sectionKey].stalls.findIndex(s => cleanId(s.id) === targetStallNum);

      if (idx !== -1) {
        const isDifferent = sectionKey !== activeSectionKey || idx !== stallIndex;

        if (isDifferent || !isInitialMount.current) {
          console.log('[MarketTour360] Syncing state to navigated stall:', targetStallNum, 'in section:', sectionKey);
          setActiveSectionKey(sectionKey);
          setStallIndex(idx);

          const matchedStall = sectionsData[sectionKey].stalls[idx];
          triggerSceneTransition(getStallImagePath(matchedStall.id, sectionKey));
        }
      }
    }
    isInitialMount.current = false;
  }, [stateStall]);

  // Reset indices when switching sections
  const selectSection = (key) => {
    if (transitioning) return
    setActiveSectionKey(key)
    setStallIndex(0)
    triggerSceneTransition(getStallImagePath(sectionsData[key].stalls[0].id, key))
  }

  const handleNextStall = () => {
    if (transitioning) return
    const sectionKeys = ['meat', 'fish', 'veggies']
    const currentSectionIdx = sectionKeys.indexOf(stateRef.current.activeSectionKey)
    const stalls = sectionsData[stateRef.current.activeSectionKey].stalls

    if (stateRef.current.stallIndex >= stalls.length - 1) {
      // Go to next section
      const nextSectionIdx = (currentSectionIdx + 1) % sectionKeys.length
      const nextSectionKey = sectionKeys[nextSectionIdx]
      setActiveSectionKey(nextSectionKey)
      setStallIndex(0)
      const nextStall = sectionsData[nextSectionKey].stalls[0]
      triggerSceneTransition(getStallImagePath(nextStall.id, nextSectionKey))
    } else {
      const nextIdx = stateRef.current.stallIndex + 1
      setStallIndex(nextIdx)
      triggerSceneTransition(getStallImagePath(stalls[nextIdx].id, stateRef.current.activeSectionKey))
    }
  }

  const handlePrevStall = () => {
    if (transitioning) return
    const sectionKeys = ['meat', 'fish', 'veggies']
    const currentSectionIdx = sectionKeys.indexOf(stateRef.current.activeSectionKey)
    const stalls = sectionsData[stateRef.current.activeSectionKey].stalls

    if (stateRef.current.stallIndex <= 0) {
      // Go to prev section
      const prevSectionIdx = (currentSectionIdx - 1 + sectionKeys.length) % sectionKeys.length
      const prevSectionKey = sectionKeys[prevSectionIdx]
      const prevStalls = sectionsData[prevSectionKey].stalls
      const prevIdx = prevStalls.length - 1
      setActiveSectionKey(prevSectionKey)
      setStallIndex(prevIdx)
      triggerSceneTransition(getStallImagePath(prevStalls[prevIdx].id, prevSectionKey))
    } else {
      const prevIdx = stateRef.current.stallIndex - 1
      setStallIndex(prevIdx)
      triggerSceneTransition(getStallImagePath(stalls[prevIdx].id, stateRef.current.activeSectionKey))
    }
  }

  // Pre-load texture helper with percentage progress simulation
  const triggerSceneTransition = (texturePath) => {
    setTransitioning(true)
    setLoaded(false)
    setLoadingProgress(10)

    // Simulate progress while loading
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 80) {
          clearInterval(interval)
          return 80
        }
        return prev + 15
      })
    }, 100)

    setTimeout(() => {
      if (!window.THREE || !materialRef.current || !sceneRef.current) {
        clearInterval(interval)
        setLoaded(true)
        setTransitioning(false)
        return
      }

      const THREE = window.THREE
      new THREE.TextureLoader().load(
        texturePath,
        (tex) => {
          clearInterval(interval)
          setLoadingProgress(100)
          setTimeout(() => {
            materialRef.current.map = tex
            materialRef.current.needsUpdate = true

            // Recreate Hotspots in 3D Space
            recreateHotspots(sceneRef.current, stateRef.current.currentStall, THREE)

            // Reset camera viewing angle slightly to default
            spherical.current.phi = Math.PI / 2
            spherical.current.theta = 0

            setLoaded(true)
            setTransitioning(false)
          }, 150)
        },
        null,
        (err) => {
          console.error('Failed to load panorama', err)
          clearInterval(interval)
          setLoaded(true)
          setTransitioning(false)
        }
      )
    }, 300)
  }

  // Helper to create beautiful glowing canvas textures for hotspots
  const createHotspotTexture = (THREE, type, label) => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')

    // Clean drawing surface
    ctx.clearRect(0, 0, 128, 128)

    // Define colors based on type
    const color = type === 'info' ? '#e07b00' : '#1a5c2a'
    const glowColor = type === 'info' ? 'rgba(224, 123, 0, ' : 'rgba(26, 92, 42, '

    // Radial outer glow
    const grad = ctx.createRadialGradient(64, 64, 15, 64, 64, 55)
    grad.addColorStop(0, glowColor + '1)')
    grad.addColorStop(0.5, glowColor + '0.4)')
    grad.addColorStop(1, glowColor + '0)')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(64, 64, 55, 0, Math.PI * 2)
    ctx.fill()

    // Inner core solid circle
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(64, 64, 28, 0, Math.PI * 2)
    ctx.fill()

    // Border circle
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(64, 64, 28, 0, Math.PI * 2)
    ctx.stroke()

    // Center icon/symbol
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (type === 'info') {
      ctx.font = 'bold italic 36px Georgia, serif'
      ctx.fillText('i', 64, 61)
    } else {
      ctx.font = 'bold 36px sans-serif'
      ctx.fillText(label === 'next' ? '➔' : '◀', 64, 62)
    }

    return new THREE.CanvasTexture(canvas)
  }

  // Node Graph to map stalls/hallways to Map X,Y coordinates
  const getNodeCoordinates = (stall) => {
    // A simulated node graph for the floor plan connecting the 360 images
    const num = parseInt(String(stall.id).replace(/[^0-9]/g, '')) || 1;
    let x = 50;
    let y = 50;
    
    if (stall.zone === 'Zone A') { x = 20 + (num % 5) * 5; y = 20 + (num % 4) * 5; }
    else if (stall.zone === 'Zone B') { x = 40 + (num % 5) * 5; y = 20 + (num % 4) * 5; }
    else if (stall.zone === 'Zone C') { x = 60 + (num % 5) * 5; y = 20 + (num % 4) * 5; }
    else if (stall.zone === 'Zone D') { x = 80 + (num % 5) * 5; y = 20 + (num % 4) * 5; }
    else if (stall.zone === 'Zone E') { x = 20 + (num % 5) * 5; y = 60 + (num % 4) * 5; }
    else if (stall.zone === 'Zone F') { x = 40 + (num % 5) * 5; y = 60 + (num % 4) * 5; }
    else if (stall.zone === 'Zone G') { x = 60 + (num % 5) * 5; y = 60 + (num % 4) * 5; }
    else if (stall.zone === 'Zone H') { x = 80 + (num % 5) * 5; y = 60 + (num % 4) * 5; }
    else { x = 50 + (num % 10) * 2; y = 50 + (num % 10) * 2; }
    
    // ensure within map bounds
    x = Math.max(10, Math.min(90, x));
    y = Math.max(10, Math.min(90, y));
    
    return { x, y };
  };

  // Re-populate the 3D scene with relevant Hotspots
  const recreateHotspots = (scene, stall, THREE) => {
    // Clear old sprites
    hotspotMeshes.current.forEach((mesh) => scene.remove(mesh))
    hotspotMeshes.current = []

    // Next Arrow Hotspot (Forward-Right)
    const nextTex = createHotspotTexture(THREE, 'nav', 'next')
    const nextMat = new THREE.SpriteMaterial({ map: nextTex, transparent: true, depthTest: false })
    const nextSprite = new THREE.Sprite(nextMat)
    nextSprite.position.set(150, -40, -150)
    nextSprite.scale.set(30, 30, 1)
    nextSprite.userData = { type: 'next', label: 'Next' }
    scene.add(nextSprite)
    hotspotMeshes.current.push(nextSprite)

    // Previous Arrow Hotspot (Forward-Left)
    const prevTex = createHotspotTexture(THREE, 'nav', 'prev')
    const prevMat = new THREE.SpriteMaterial({ map: prevTex, transparent: true, depthTest: false })
    const prevSprite = new THREE.Sprite(prevMat)
    prevSprite.position.set(-150, -40, -150)
    prevSprite.scale.set(30, 30, 1)
    prevSprite.userData = { type: 'prev', label: 'Previous' }
    scene.add(prevSprite)
    hotspotMeshes.current.push(prevSprite)
  }

  // Main Three.js Init
  useEffect(() => {
    let THREE
    let cancelled = false

    async function init() {
      if (!window.THREE) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
          s.onload = resolve
          s.onerror = reject
          document.head.appendChild(s)
        })
      }
      if (cancelled) return
      THREE = window.THREE

      const W = mountRef.current.clientWidth
      const H = mountRef.current.clientHeight

      // Scene
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // Camera
      const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 1000)
      camera.position.set(0, 0, 0.001)
      cameraRef.current = camera

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(W, H)
      mountRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // 360 Skybox Sphere Geometry
      const geometry = new THREE.SphereGeometry(500, 64, 40)
      geometry.scale(-1, 1, 1)

      // Initial Texture Loading
      setLoadingProgress(25)
      const texture = new THREE.TextureLoader().load(
        getStallImagePath(stateRef.current.currentStall.id, stateRef.current.activeSectionKey),
        () => {
          setLoadingProgress(100)
          setTimeout(() => {
            if (!cancelled) setLoaded(true)
          }, 200)
        }
      )
      const material = new THREE.MeshBasicMaterial({ map: texture })
      materialRef.current = material

      const sphere = new THREE.Mesh(geometry, material)
      scene.add(sphere)

      // Draw initial hotspots
      recreateHotspots(scene, stateRef.current.currentStall, THREE)

      // Raycaster for interactions
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()

      function onPointerDown(e) {
        const rect = renderer.domElement.getBoundingClientRect()
        const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
        const clientX = touch ? touch.clientX : e.clientX
        const clientY = e.touches ? e.touches[0].clientY : e.clientY

        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const hits = raycaster.intersectObjects(hotspotMeshes.current)

        if (hits.length > 0) {
          const uData = hits[0].object.userData
          if (uData.type === 'next') {
            handleNextStall()
          } else if (uData.type === 'prev') {
            handlePrevStall()
          }
        }
      }

      renderer.domElement.addEventListener('click', onPointerDown)
      renderer.domElement.addEventListener('touchend', onPointerDown)

      // Track hovering to show tooltips & change cursors
      function onPointerMove(e) {
        const rect = renderer.domElement.getBoundingClientRect()
        const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
        const clientX = touch ? touch.clientX : e.clientX
        const clientY = e.touches ? e.touches[0].clientY : e.clientY

        // Track screen mouse positions for tooltips
        setMousePos({ x: clientX, y: clientY })

        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const hits = raycaster.intersectObjects(hotspotMeshes.current)

        if (hits.length > 0) {
          const hovered = hits[0].object.userData
          setHoveredHotspot(hovered)
          if (!isDragging.current) setCursor('pointer')
        } else {
          setHoveredHotspot(null)
          if (!isDragging.current) setCursor('grab')
        }
      }

      window.addEventListener('mousemove', onPointerMove)

      // Camera Look-At Logic
      function updateCamera() {
        const { phi, theta } = spherical.current
        const x = Math.sin(phi) * Math.cos(theta)
        const y = Math.cos(phi)
        const z = Math.sin(phi) * Math.sin(theta)
        camera.lookAt(x, y, z)

        // Sync compass rotation
        const deg = Math.round((theta * 180) / Math.PI) % 360
        setCompassAngle(-deg)
      }
      updateCamera()

      // Animation Loop
      function animate() {
        frameRef.current = requestAnimationFrame(animate)

        // Slowly rotate camera if Auto-Rotate is active
        if (autoRotate && !isDragging.current) {
          spherical.current.theta += 0.0018
          updateCamera()
        }

        renderer.render(scene, camera)
      }
      animate()

      // Resize Handler
      function onResize() {
        if (!mountRef.current) return
        const W2 = mountRef.current.clientWidth
        const H2 = mountRef.current.clientHeight
        camera.aspect = W2 / H2
        camera.updateProjectionMatrix()
        renderer.setSize(W2, H2)
      }
      window.addEventListener('resize', onResize)

      // Drag Handlers
      function onMouseDown(e) {
        isDragging.current = true
        setCursor('grabbing')
        lastPos.current = { x: e.clientX, y: e.clientY }
      }

      function onMouseMove(e) {
        if (!isDragging.current) return
        const dx = e.clientX - lastPos.current.x
        const dy = e.clientY - lastPos.current.y
        lastPos.current = { x: e.clientX, y: e.clientY }

        spherical.current.theta -= dx * 0.003
        spherical.current.phi = Math.max(0.4, Math.min(Math.PI - 0.4, spherical.current.phi + dy * 0.003))
        updateCamera()
      }

      function onMouseUp() {
        isDragging.current = false
        setCursor('grab')
      }

      // Touch handlers
      function onTouchStart(e) {
        if (e.touches.length === 1) {
          isDragging.current = true
          setCursor('grabbing')
          lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }
      }

      function onTouchMove(e) {
        if (!isDragging.current || e.touches.length !== 1) return
        const dx = e.touches[0].clientX - lastPos.current.x
        const dy = e.touches[0].clientY - lastPos.current.y
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }

        spherical.current.theta -= dx * 0.004
        spherical.current.phi = Math.max(0.4, Math.min(Math.PI - 0.4, spherical.current.phi + dy * 0.004))
        updateCamera()
      }

      function onTouchEnd() {
        isDragging.current = false
        setCursor('grab')
      }

      renderer.domElement.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true })
      renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true })
      renderer.domElement.addEventListener('touchend', onTouchEnd)

      // Cleanup
      renderer.domElement._cleanup = () => {
        window.removeEventListener('resize', onResize)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('mousemove', onPointerMove)
        renderer.domElement.removeEventListener('click', onPointerDown)
        renderer.domElement.removeEventListener('touchend', onPointerDown)
      }
    }

    init().catch(console.error)

    return () => {
      cancelled = true
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      if (rendererRef.current) {
        if (rendererRef.current.domElement._cleanup) rendererRef.current.domElement._cleanup()
        rendererRef.current.domElement.remove()
        rendererRef.current.dispose()
      }
      if (mountRef.current) {
        mountRef.current.innerHTML = ''
      }
    }
  }, [autoRotate]) // Re-run when auto-rotate state changes

  // Zoom In Handler
  const zoomIn = () => {
    if (!cameraRef.current) return
    cameraRef.current.fov = Math.max(30, cameraRef.current.fov - 8)
    cameraRef.current.updateProjectionMatrix()
  }

  // Zoom Out Handler
  const zoomOut = () => {
    if (!cameraRef.current) return
    cameraRef.current.fov = Math.min(100, cameraRef.current.fov + 8)
    cameraRef.current.updateProjectionMatrix()
  }

  // Reset Camera angle
  const resetCamera = () => {
    spherical.current.phi = Math.PI / 2
    spherical.current.theta = 0
    if (cameraRef.current) {
      cameraRef.current.fov = 70
      cameraRef.current.updateProjectionMatrix()
    }
  }

  // No inquiry handling needed

  return (
    <div className="relative w-full bg-black overflow-hidden font-sans select-none" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* 360 ThreeJS Viewer Mount */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full transition-all duration-300"
        style={{ cursor, filter: privacyMode ? 'blur(6px) contrast(1.05)' : 'none' }}
      />

      {/* Floating SHOW CONTROLS Toggle Button (Visible ONLY when UI is hidden) */}
      {!uiVisible && (
        <div className="absolute top-4 right-4 z-40">
          <button
            onClick={() => setUiVisible(true)}
            className="px-4 py-2.5 rounded-xl bg-[#e07b00] hover:bg-[#b86500] text-white shadow-2xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer animate-bounce"
            style={{ animationDuration: '3s' }}
            title="Show UI Overlay Controls"
          >
            <Eye size={15} />
            <span>Show Controls</span>
          </button>
        </div>
      )}

      {/* Screen Fade Transition Overlay (prevents jarring cuts) */}
      <div
        className={`absolute inset-0 bg-black z-10 transition-opacity duration-300 pointer-events-none ${transitioning ? 'opacity-100' : 'opacity-0'
          }`}
      />



      {/* Hover Tooltip for Hotspots */}
      {hoveredHotspot && loaded && uiVisible && (
        <div
          className="absolute z-40 bg-white/95 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl pointer-events-none shadow-xl border border-black/10 -translate-x-1/2 -translate-y-12 backdrop-blur-sm transition-all"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          ➔ {hoveredHotspot.label}
        </div>
      )}

      {/* TOP HEADER SECTION */}
      <div className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2 sm:p-4 pointer-events-none transition-all duration-300 ${uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12 pointer-events-none'}`}>
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate(location.pathname.startsWith('/renter') ? '/renter/dashboard' : '/');
              }
            }}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white active:scale-95 transition-all text-slate-800 border border-black/10 cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl px-4 py-2 flex items-center gap-2.5 shadow-lg border border-black/10 text-slate-800">
            <MapPin size={16} className="text-[#1a5c2a] shrink-0" />
            <div>
              <span className="text-xs font-black tracking-wide block uppercase text-[#1a5c2a]">MyTalipapa Public Market</span>
              <span className="text-[10px] text-slate-500 font-semibold leading-none">Virtual 360° Stall Walkthrough</span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setUiVisible(false)}
            className="px-4.5 py-2.5 rounded-2xl bg-white/80 hover:bg-white backdrop-blur-md text-slate-800 border border-black/10 text-xs font-black flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
            title="Hide all overlay buttons and panels"
          >
            <EyeOff size={15} />
            <span>Hide Controls</span>
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white active:scale-95 transition-all text-slate-800 border border-black/10 cursor-pointer"
            title="Help Guide"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>



      {/* FLOATING SIDE HUD CONTROLS (Right Side) */}
      <div className="absolute right-4 top-28 md:top-1/2 md:-translate-y-1/2 z-20 flex flex-col items-center gap-4">
        {/* Compass Overlay Dial */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 mb-1 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center border border-black/10 shadow-2xl relative overflow-hidden transition-all duration-300 ${uiVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}>
          <div
            className="w-10 h-10 flex items-center justify-center transition-transform duration-100"
            style={{ transform: `rotate(${compassAngle}deg)` }}
          >
            <CompassIcon size={24} className="text-[#1a5c2a]" />
          </div>
          <div className="absolute top-0.5 text-[8px] font-black text-[#1a5c2a]">N</div>
        </div>

        {/* Action Button Pad */}
        <div className={`bg-white/90 backdrop-blur-md p-2 rounded-3xl flex flex-col gap-2.5 border border-black/10 shadow-2xl transition-all duration-300 ${uiVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}>
          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${autoRotate ? 'bg-[#1a5c2a] text-white animate-pulse' : 'bg-black/5 text-slate-800 hover:bg-black/10'
              }`}
            title="Toggle Auto-Rotate"
          >
            {autoRotate ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={zoomIn}
            className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 text-slate-800 flex items-center justify-center transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={zoomOut}
            className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 text-slate-800 flex items-center justify-center transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={resetCamera}
            className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 text-slate-800 flex items-center justify-center transition-all cursor-pointer"
            title="Reset Camera View"
          >
            <RotateCcw size={17} />
          </button>
          <button
            onClick={() => setPrivacyMode(prev => !prev)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${privacyMode ? 'bg-[#1a5c2a] text-white' : 'bg-black/5 text-slate-800 hover:bg-black/10'
              }`}
            title="Toggle Privacy Blur (Obscure Faces)"
          >
            {privacyMode ? <Shield size={18} /> : <ShieldOff size={18} />}
          </button>
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch((err) => console.error(err))
              } else {
                document.exitFullscreen()
              }
            }}
            className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 text-slate-800 flex items-center justify-center transition-all cursor-pointer"
            title="Fullscreen Toggle"
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </div>

      {/* MINI MAP OVERLAY */}
      {uiVisible && (
        <div className="absolute bottom-36 right-4 md:bottom-32 md:right-6 w-32 h-32 md:w-48 md:h-48 bg-white/90 backdrop-blur-md border border-black/20 shadow-2xl rounded-2xl overflow-hidden z-30 transition-all duration-300">
          <div className="relative w-full h-full bg-slate-200">
            <img src="/export360/map.png" alt="Floor Plan" className="w-full h-full object-contain" />
            
            {/* Red Dot indicating user position */}
            <div 
              className="absolute w-3 h-3 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)] -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out z-10"
              style={{ 
                left: `${getNodeCoordinates(currentStall).x}%`, 
                top: `${getNodeCoordinates(currentStall).y}%` 
              }}
            >
              {/* View Cone */}
              <div 
                className="absolute pointer-events-none"
                style={{ 
                  bottom: '50%',
                  left: '50%',
                  marginLeft: '-25px',
                  width: '0', 
                  height: '0', 
                  borderLeft: '25px solid transparent',
                  borderRight: '25px solid transparent',
                  borderTop: '50px solid rgba(239, 68, 68, 0.4)',
                  transform: `rotate(${compassAngle}deg)`,
                  transformOrigin: '50% 100%'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM CENTER STALL QUICK SWITCHER CONTROLS */}
      <div className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'} ${detailsCollapsed ? 'bottom-20' : 'bottom-[330px] md:bottom-[240px]'} flex flex-col items-center gap-2.5`}>
        {/* Stall Selector Button floating directly ABOVE the main switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setStallDropdownOpen(prev => !prev)
              setSectionDropdownOpen(false)
            }}
            className="bg-white/95 backdrop-blur-md border border-black/10 rounded-full px-5 py-2 text-xs font-black text-slate-800 shadow-xl hover:bg-white transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{currentStall.name} ({stallIndex + 1}/{activeSection.stalls.length})</span>
            <ChevronDown size={12} className="text-[#1a5c2a]" />
          </button>

          {stallDropdownOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 bg-white/95 backdrop-blur-md border border-black/10 rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 min-w-[200px] max-h-[220px] overflow-y-auto">
              {activeSection.stalls.map((st, idx) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setStallIndex(idx)
                    triggerSceneTransition(getStallImagePath(st.id, activeSectionKey))
                    setStallDropdownOpen(false)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${idx === stallIndex
                    ? 'bg-[#1a5c2a] text-white'
                    : 'text-slate-700 hover:bg-black/5'
                    }`}
                >
                  {st.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Section Switcher and Navigation Pill */}
        <div className="bg-white/90 backdrop-blur-md rounded-full px-5 py-3 flex items-center gap-4 shadow-2xl border border-black/10 text-slate-800">
          <button
            onClick={handlePrevStall}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 text-slate-800 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Previous Stall"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="text-center min-w-[120px] relative">
            <button
              onClick={() => {
                setSectionDropdownOpen(prev => !prev)
                setStallDropdownOpen(false)
              }}
              className="text-[10px] text-[#e07b00] font-extrabold uppercase tracking-widest leading-none mb-0.5 flex items-center justify-center gap-1 mx-auto hover:text-[#b86500] cursor-pointer"
            >
              <span>{activeSection.name}</span>
              <ChevronDown size={10} />
            </button>
            <p className="text-[10px] text-slate-500 font-bold leading-none">
              Section Selector
            </p>
            {detailsCollapsed && (
              <button
                onClick={() => setDetailsCollapsed(false)}
                className="mt-1.5 text-[9px] font-black uppercase text-[#1a5c2a] hover:underline cursor-pointer block mx-auto leading-none"
              >
                View Details
              </button>
            )}

            {sectionDropdownOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white/95 backdrop-blur-md border border-black/10 rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 min-w-[140px]">
                {Object.values(sectionsData).map((sect) => (
                  <button
                    key={sect.id}
                    onClick={() => {
                      selectSection(sect.id)
                      setSectionDropdownOpen(false)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${sect.id === activeSectionKey
                      ? 'bg-[#1a5c2a] text-white'
                      : 'text-slate-700 hover:bg-black/5'
                      }`}
                  >
                    {sect.icon} {sect.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleNextStall}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 text-slate-800 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Next Stall"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* STALL DETAILS DRAWER (Bottom Panel) */}
      {selectedStall && uiVisible && !detailsCollapsed && (
        <div className="absolute bottom-16 md:bottom-0 left-0 right-0 z-20 px-4 pb-4">
          <div className="max-w-2xl mx-auto relative">
            <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-black/10 shadow-2xl flex flex-col md:flex-row gap-5 relative overflow-hidden">
              {/* Collapse Toggle */}
              <button
                onClick={() => setDetailsCollapsed(true)}
                className="absolute top-3 right-3 z-30 bg-white/80 hover:bg-white border border-black/10 rounded-full p-1.5 text-slate-600 hover:text-slate-900 transition-colors shadow-sm cursor-pointer"
                title="Collapse details"
              >
                <ChevronDown size={16} />
              </button>
              {/* Background Ambient Glow */}
              <div className={`absolute -right-32 -bottom-32 w-64 h-64 rounded-full bg-gradient-to-br ${activeSection.bgTheme} blur-3xl opacity-40 pointer-events-none`} />

              {/* Main Info */}
              <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-black/10 text-slate-800">
                    {selectedStall.zone}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 truncate leading-tight">
                  {selectedStall.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 flex flex-col gap-0.5">
                  <span>Category: {activeSection.name}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Utilities: {selectedStall.utilities}</span>
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-2 bg-black/5 rounded-2xl p-3 border border-black/5 hover:bg-black/10 transition-all">
                    <Zap size={15} className="text-[#1a5c2a] shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Electricity</p>
                      <p className="text-xs font-bold text-slate-800">{selectedStall.electricitySetup}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/5 rounded-2xl p-3 border border-black/5 hover:bg-black/10 transition-all">
                    <MapPin size={15} className="text-[#1a5c2a] shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Water Access</p>
                      <p className="text-xs font-bold text-slate-800">{selectedStall.waterAccess}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/5 rounded-2xl p-3 border border-black/5 hover:bg-black/10 transition-all">
                    <User size={15} className="text-[#1a5c2a] shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Contractor</p>
                      <p className="text-xs font-bold text-slate-800">{selectedStall.contractorName || 'None'}</p>
                    </div>
                  </div>
                  {selectedStall.contractorName && selectedStall.contractorName !== 'None' && (
                    <div className="flex items-center gap-2 bg-black/5 rounded-2xl p-3 border border-black/5 hover:bg-black/10 transition-all">
                      <Phone size={15} className="text-[#1a5c2a] shrink-0" />
                      <div>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Contact</p>
                        <p className="text-xs font-bold text-slate-800">{selectedStall.contractorContact || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Details Block */}
              <div className="w-full md:w-52 shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-l border-black/10 pt-4 md:pt-0 md:pl-5 z-10">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-[#e07b00] leading-none whitespace-nowrap">
                    {selectedStall.price}
                  </p>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">per month (negotiable)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HELP GUIDE OVERLAY MODAL */}
      {helpOpen && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-black/10 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setHelpOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/5 hover:bg-black/10 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-1.5 flex items-center gap-2">
              <span></span> 360° Virtual Tour Guide
            </h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Explore the public market spaces virtually from your device. Inspect stalls and compare rates instantly.
            </p>

            <div className="space-y-4">
              <div className="flex gap-4 items-start bg-black/5 p-3 rounded-2xl border border-black/5">
                <span className="text-xl"></span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Look Around</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Drag with mouse or swipe with touch in any direction to turn the camera view.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start bg-black/5 p-3 rounded-2xl border border-black/5">
                <span className="text-xl"></span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Zoom In / Out</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Use scroll wheel or float buttons (+ / -) to change viewing field-of-view.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start bg-black/5 p-3 rounded-2xl border border-black/5">
                <span className="text-xl"></span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Dynamic Hotspots</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Tap hotspots to walk to adjacent stalls virtually.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setHelpOpen(false)}
              className="w-full mt-6 py-3 rounded-xl bg-[#1a5c2a] hover:bg-[#14451f] text-white font-black text-xs transition-all cursor-pointer"
            >
              Got It, Let's Tour!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
