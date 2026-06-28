import { useEffect, useRef, useState } from 'react'

import { useNavigate, useLocation } from 'react-router-dom'
import mapImage from '../images/map_aligned.jpg'
import logoImage from '../images/logo.png'
import { SVG_STALL_COORDS } from '../utils/coords_dict';
import { STALL_MAP } from '../utils/stallMap';
import { PANO_HEADINGS } from '../utils/panoHeadings';
import { findRoute, ENTRANCE, METERS_PER_PIXEL } from '../utils/marketGraph'
import {
  ArrowLeft,
  X,
  MapPin,
  Zap,
  Maximize2,
  Minimize2,
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
  User,
  Droplet,
  Camera,
  FileText,
  LogOut
} from 'lucide-react'

// ─── Market route finding ───────────────────────────────────────────────────
// The pathway geometry now lives in one shared, data-derived module
// (utils/marketGraph) so the 360° tour and the AR finder always agree on where
// the walkable aisles are and never draw routes through stall blocks.
const ENTRANCE_COORDS = ENTRANCE;
const findMarketRoute = (fromCoords, toCoords) => findRoute(fromCoords, toCoords);



const getStallZone = (num, category) => {
  const stallId = String(num);
  if (category === 'meat') {
    // Zone A holds the upper-floor "(u)" twins of meat 1–5/12/13 plus the empties;
    // the bare base numbers fall through to Zone E. Kept in sync with the DB and
    // ArFinder.getStallZone so stall lookups resolve to the correct zone.
    if (['1(u)', '2(u)', '3(u)', '4(u)', '5(u)', '12(u)', '13(u)'].includes(stallId) || stallId.startsWith('empty')) {
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
      ['Beef Sirloin: ₱420/kg', 'Beef Shank (Bulalo): ₱380/kg', 'Ground Beef: ₱350/kg', 'Beef Brisket: ₱380/kg'],
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
      category,
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
      '5', '6', '7', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
      '41', '42', '43', '44', '45', '46', '47', '48', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
      '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72'
    ])
  }
}

const getStallImagePath = (id, category) => {
  const stallId = String(id);
  if (category === 'meat') {
    if (stallId === '1') return '/export360/stall1(u) - meat.jpg';
    if (stallId === '2') return '/export360/stall2(u) - meat.jpg';
    if (stallId === '3') return '/export360/stall3(u)-  meat.jpg';
    if (stallId === '4') return '/export360/stall3(u)-  meat.jpg';
    if (stallId === '5') return '/export360/stall5(u) - meat.jpg';
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
    if (stallId === '1(u)') return '/export360/stall1 - meat.jpg';
    if (stallId === '2(u)') return '/export360/stall2 - meat.jpg';
    if (stallId === '5(u)') return '/export360/stall5 - meat.jpg';
    if (stallId === '1(u2)') return '/export360/stall13 - meat.jpg';
    if (stallId === '2(u2)') return '/export360/stall14 - meat.jpg';
    if (stallId === '3(u2)') return '/export360/stall15 - meat.jpg';
    if (stallId === '4(u2)') return '/export360/stall16 - meat.jpg';
    if (stallId === '3(u)') return '/export360/stall3  - meat.jpg';
    if (stallId === '4(u)') return '/export360/stall4 -  meat.jpg';
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
  const isLoggedIn = !!localStorage.getItem('authToken');
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

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
  const autoRotateRef = useRef(false)
  // Keep ref in sync so the animation loop reads it without being a React dependency
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  const [transitioning, setTransitioning] = useState(false)
  const [uiVisible, setUiVisible] = useState(true)
  const [detailsCollapsed, setDetailsCollapsed] = useState(true)
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false)
  const [privacyMode, setPrivacyMode] = useState(false)
  const [showBadges, setShowBadges] = useState(true)
  const [stallDropdownOpen, setStallDropdownOpen] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  // Route finder state for the expanded map
  const [routeFrom, setRouteFrom] = useState(null) // { secKey, stallId }
  const [routeTo, setRouteTo] = useState(null)     // { secKey, stallId }
  const [routePickStep, setRoutePickStep] = useState(null) // 'from' | 'to' | null
  const [routePickerSearch, setRoutePickerSearch] = useState('')
  const [routePickerCat, setRoutePickerCat] = useState('all')

  // AR Navigation State
  const [destinationStall, setDestinationStall] = useState(null)
  const [arWaypoints, setArWaypoints] = useState([])
  const [routeInstructions, setRouteInstructions] = useState([])
  const [arStepIndex, setArStepIndex] = useState(0)
  const [isWalkingSimulation, setIsWalkingSimulation] = useState(false)
  const [dbLoading, setDbLoading] = useState(false)

  // Sync Route Finder 'FROM' selector with the current stall position
  useEffect(() => {
    if (currentStall) {
      setRouteFrom({ secKey: activeSectionKey, stallId: currentStall.id });
    }
  }, [currentStall, activeSectionKey]);


  // Walk simulation effect
  useEffect(() => {
    let timer;
    if (isWalkingSimulation && routeInstructions.length > 0) {
      timer = setInterval(() => {
        setArStepIndex((prev) => {
          if (prev >= routeInstructions.length - 1) {
            setIsWalkingSimulation(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2200);
    }
    return () => clearInterval(timer);
  }, [isWalkingSimulation, routeInstructions]);

  // Sync 360 panorama view with route steps (when simulating or stepping through the route in 360 mode)
  useEffect(() => {
    if (routeInstructions.length > 0 && routeInstructions[arStepIndex]) {
      const stepCoords = routeInstructions[arStepIndex].coords;
      if (stepCoords) {
        // Move to stall closest to this coordinate
        let closestStall = null;
        let closestDist = Infinity;
        let closestSec = null;
        Object.entries(sectionsData).forEach(([secKey, sec]) => {
          sec.stalls.forEach(s => {
            const sc = getRawCoordinates(s, secKey);
            const dist = Math.sqrt((sc.x - stepCoords.x) ** 2 + (sc.y - stepCoords.y) ** 2);
            if (dist < closestDist) {
              closestDist = dist;
              closestStall = s;
              closestSec = secKey;
            }
          });
        });
        if (closestStall && closestDist < 300 && (currentStall?.id !== closestStall.id || activeSectionKey !== closestSec)) {
          setActiveSectionKey(closestSec);
          setStallIndex(sectionsData[closestSec].stalls.findIndex(s => s.id === closestStall.id));
        }
      }
    }
  }, [arStepIndex, routeInstructions]);

  // Sync step index when currentStall changes manually in 360 mode
  useEffect(() => {
    if (routeInstructions.length > 0 && destinationStall) {
      const curCoords = getRawCoordinates(currentStall, activeSectionKey);

      // Find the step in routeInstructions whose coordinates are closest to curCoords
      let bestStepIdx = arStepIndex;
      let minDistance = Infinity;

      routeInstructions.forEach((step, idx) => {
        if (step.coords) {
          const dist = Math.sqrt((step.coords.x - curCoords.x) ** 2 + (step.coords.y - curCoords.y) ** 2);
          if (dist < minDistance) {
            minDistance = dist;
            bestStepIdx = idx;
          }
        }
      });

      if (bestStepIdx !== arStepIndex && minDistance < 60) {
        setArStepIndex(bestStepIdx);
      }
    }
  }, [currentStall, activeSectionKey, routeInstructions, destinationStall]);

  const generateRouteInstructions = (waypoints) => {
    const instructions = [];
    if (!waypoints || waypoints.length < 2) return [{ text: "You have arrived at your destination!", distance: 0, coords: ENTRANCE_COORDS }];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distPixels = Math.hypot(dx, dy);
      const distMeters = Math.round(distPixels * METERS_PER_PIXEL); // shared scale (utils/marketGraph)

      const angleRad = Math.atan2(dy, dx);
      const angleDeg = (angleRad * 180 / Math.PI + 450) % 360;

      let action = "Walk forward";
      if (i > 0) {
        const prevP = waypoints[i - 1];
        const prevDx = p1.x - prevP.x;
        const prevDy = p1.y - prevP.y;
        const prevAngleRad = Math.atan2(prevDy, prevDx);
        const prevAngleDeg = (prevAngleRad * 180 / Math.PI + 450) % 360;

        let diff = angleDeg - prevAngleDeg;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        if (diff > 45 && diff < 135) {
          action = "Turn right";
        } else if (diff < -45 && diff > -135) {
          action = "Turn left";
        } else if (Math.abs(diff) >= 135) {
          action = "Turn around";
        }
      } else {
        action = "Enter market and walk forward";
      }

      instructions.push({
        text: `${action} for ${distMeters} meters`,
        distance: distMeters,
        coords: p1
      });
    }

    instructions.push({
      text: "You have arrived at your destination!",
      distance: 0,
      coords: waypoints[waypoints.length - 1]
    });

    return instructions;
  };

  const handleRouteMe = (targetStall) => {
    setDestinationStall(targetStall);
    setSelectedStall(targetStall);

    const startStall = currentStall;
    const startSec = activeSectionKey;
    const startCoords = startStall ? getRawCoordinates(startStall, startSec) : ENTRANCE_COORDS;

    // Find section of targetStall
    const targetSec = targetStall.category || activeSectionKey;

    const targetCoords = getRawCoordinates(targetStall, targetSec);
    const routeWaypoints = findMarketRoute(startCoords, targetCoords);

    setArWaypoints(routeWaypoints);
    const steps = generateRouteInstructions(routeWaypoints);
    setRouteInstructions(steps);
    setArStepIndex(0);
  };

  // Teleport the panorama to whichever stall is nearest the point the user
  // tapped on the expanded map. Translates the click position from screen
  // pixels into the SVG/map coordinate space, then snaps to the closest stall.
  const handleMapTeleport = (e) => {
    if (!isMapExpanded || transitioning) return;
    const svg = e.currentTarget;
    if (!svg || typeof svg.createSVGPoint !== 'function') return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(ctm.inverse());

    let closestStall = null;
    let closestSec = null;
    let closestIdx = -1;
    let closestDist = Infinity;
    Object.entries(sectionsData).forEach(([secKey, sec]) => {
      sec.stalls.forEach((st, idx) => {
        const c = getStallInfo(st, secKey);
        // Skip stalls that have no real mapped coordinate (fallback position)
        if (c.x === 1020 && (c.y === 635 || c.y === 885)) return;
        const d = Math.hypot(c.x - x, c.y - y);
        if (d < closestDist) {
          closestDist = d;
          closestStall = st;
          closestSec = secKey;
          closestIdx = idx;
        }
      });
    });

    // Ignore taps that land far from any stall (e.g. on the logo or margins)
    if (!closestStall || closestDist > 300) return;

    setActiveSectionKey(closestSec);
    setStallIndex(closestIdx);
    setSelectedStall(closestStall);
    triggerSceneTransition(closestStall, closestSec);
    setIsMapExpanded(false);
    let count = 0;
    const interval = setInterval(() => {
      window.dispatchEvent(new Event('resize'));
      if (count++ > 30) clearInterval(interval);
    }, 16);
  };

  // Hand off from the panorama to the AR view, targeting the given stall.
  // ArFinder reads this router state to focus the stall and open the QR scanner.
  const handleOpenArView = (targetStall) => {
    if (!targetStall) return;
    const secKey = targetStall.category || activeSectionKey;
    navigate('/renter/ar-finder', {
      state: {
        stall: {
          category: secKey,
          rawId: targetStall.id,
          zone: targetStall.zone,
          stallNumber: getCleanDbStallNumber(targetStall.id),
          name: targetStall.name,
          fromPanorama: true,
        },
      },
    });
  };

  const fetchStallDetailsFromDb = async (stallId, zone) => {
    setDbLoading(true);
    try {
      const cleanNum = getCleanDbStallNumber(stallId);
      const cleanZone = String(zone || '').replace('Zone ', '').toUpperCase();
      const res = await fetch(`/api/stalls/search?zone=${cleanZone}&stallNumber=${cleanNum}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stall) {
          setDbLoading(false);
          return data.stall;
        }
      }
    } catch (err) {
      console.error('Failed to query backend for stall details:', err);
    }
    setDbLoading(false);
    return null;
  };


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
  const latestRequestedPath = useRef(null)
  const textureCache = useRef(new Map())
  const updateCameraRef = useRef(null)  // allows triggerSceneTransition to call updateCamera
  const [compassAngle, setCompassAngle] = useState(0)

  // Sync details sheet when stall changes
  useEffect(() => {
    setSelectedStall(currentStall)
  }, [currentStall])

  // Track active references to prevent stale closures in events
  const stateRef = useRef({ activeSectionKey, stallIndex, currentStall, sectionsData, showBadges, lastCompassDeg: -1, bestForward: null, bestBackward: null, destinationStall })
  useEffect(() => {
    stateRef.current = {
      activeSectionKey,
      stallIndex,
      currentStall,
      sectionsData,
      showBadges,
      lastCompassDeg: stateRef.current.lastCompassDeg,
      bestForward: stateRef.current.bestForward,
      bestBackward: stateRef.current.bestBackward,
      destinationStall
    }
  }, [activeSectionKey, stallIndex, currentStall, sectionsData, showBadges, destinationStall])

  // Image Preloader: Quietly preload adjacent panoramas into browser cache
  useEffect(() => {
    if (!sectionsData[activeSectionKey] || !sectionsData[activeSectionKey].stalls) return;
    const stalls = sectionsData[activeSectionKey].stalls;
    if (!stalls.length) return;

    const nextIdx = (stallIndex + 1) % stalls.length;
    const prevIdx = (stallIndex - 1 + stalls.length) % stalls.length;

    const preloads = [
      getStallImagePath(stalls[nextIdx].id, activeSectionKey),
      getStallImagePath(stalls[prevIdx].id, activeSectionKey)
    ];

    preloads.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [stallIndex, activeSectionKey, sectionsData]);

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
                    description: dbStall.description || s.description || s.name,
                    vendorName: dbStall.vendorName || dbStall.tenant?.name || s.vendorName || 'Vibrant Local Vendor',
                    productType: dbStall.productType || s.productType || (secKey === 'meat' ? 'Premium Meats' : secKey === 'fish' ? 'Fresh Seafood' : 'Organic Vegetables'),
                    operatingHours: dbStall.operatingHours || s.operatingHours || '4:00 AM - 6:00 PM',
                    phoneNumber: dbStall.phoneNumber || s.phoneNumber || 'N/A'
                  };
                }
                return {
                  ...s,
                  vendorName: s.vendorName || 'Vibrant Local Vendor',
                  productType: s.productType || (secKey === 'meat' ? 'Premium Meats' : secKey === 'fish' ? 'Fresh Seafood' : 'Organic Vegetables'),
                  operatingHours: s.operatingHours || '4:00 AM - 6:00 PM',
                  phoneNumber: s.phoneNumber || 'N/A'
                };
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

  // Recreate hotspots when showBadges or destinationStall updates (NOT sectionsData —
  // triggerSceneTransition already handles that to prevent double-calls)
  useEffect(() => {
    if (sceneRef.current && currentStall && window.THREE) {
      recreateHotspots(sceneRef.current, currentStall, window.THREE);
    }
  }, [showBadges, destinationStall]);

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
          triggerSceneTransition(matchedStall, sectionKey);
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
    triggerSceneTransition(sectionsData[key].stalls[0], key)
  }

  const handleNextStall = () => {
    if (transitioning) return
    const sectionKeys = ['meat', 'fish', 'veggies']
    const currentSectionIdx = sectionKeys.indexOf(stateRef.current.activeSectionKey)
    const stalls = sectionsData[stateRef.current.activeSectionKey].stalls

    if (stateRef.current.stallIndex >= stalls.length - 1) {
      const nextSectionIdx = (currentSectionIdx + 1) % sectionKeys.length
      const nextSectionKey = sectionKeys[nextSectionIdx]
      setActiveSectionKey(nextSectionKey)
      setStallIndex(0)
      const nextStall = sectionsData[nextSectionKey].stalls[0]
      triggerSceneTransition(nextStall, nextSectionKey, true) // preserve camera
    } else {
      const nextIdx = stateRef.current.stallIndex + 1
      setStallIndex(nextIdx)
      triggerSceneTransition(stalls[nextIdx], stateRef.current.activeSectionKey, true) // preserve camera
    }
  }

  const handlePrevStall = () => {
    if (transitioning) return
    const sectionKeys = ['meat', 'fish', 'veggies']
    const currentSectionIdx = sectionKeys.indexOf(stateRef.current.activeSectionKey)
    const stalls = sectionsData[stateRef.current.activeSectionKey].stalls

    if (stateRef.current.stallIndex <= 0) {
      const prevSectionIdx = (currentSectionIdx - 1 + sectionKeys.length) % sectionKeys.length
      const prevSectionKey = sectionKeys[prevSectionIdx]
      const prevStalls = sectionsData[prevSectionKey].stalls
      const prevIdx = prevStalls.length - 1
      setActiveSectionKey(prevSectionKey)
      setStallIndex(prevIdx)
      triggerSceneTransition(prevStalls[prevIdx], prevSectionKey, true) // preserve camera
    } else {
      const prevIdx = stateRef.current.stallIndex - 1
      setStallIndex(prevIdx)
      triggerSceneTransition(stalls[prevIdx], stateRef.current.activeSectionKey, true) // preserve camera
    }
  }

  // Transition helper — preserveCamera=true keeps theta+phi so the user's
  // viewing direction is not disturbed (used for chevron/next/prev navigation)
  const triggerSceneTransition = (targetStall, targetSectionKey, preserveCamera = false) => {
    if (!targetStall || !targetSectionKey) return;

    const THREE = window.THREE;
    if (!THREE || !materialRef.current || !sceneRef.current) return;

    const texturePath = getStallImagePath(targetStall.id, targetSectionKey);
    latestRequestedPath.current = texturePath;

    // Immediately sync stateRef so updateCamera() reads the new stall on the next frame
    stateRef.current = {
      ...stateRef.current,
      currentStall: targetStall,
      activeSectionKey: targetSectionKey,
    };

    // Recreate chevron meshes and position them immediately
    recreateHotspots(sceneRef.current, targetStall, THREE);
    if (updateCameraRef.current) updateCameraRef.current();

    const applyTexture = (tex) => {
      if (latestRequestedPath.current !== texturePath) return;

      materialRef.current.map = tex;
      materialRef.current.needsUpdate = true;

      if (!preserveCamera) {
        // Full reset — only for map teleports / section jumps
        spherical.current.phi = Math.PI / 2;
        spherical.current.theta = 0;
        if (cameraRef.current) {
          cameraRef.current.fov = 70;
          cameraRef.current.position.set(0, 0, 0.001);
          cameraRef.current.updateProjectionMatrix();
        }
      }
      // Always re-run updateCamera so chevrons reposition for the new stall
      if (updateCameraRef.current) updateCameraRef.current();
    };

    const cached = textureCache.current.get(texturePath);
    if (cached) {
      applyTexture(cached);
    } else {
      new THREE.TextureLoader().load(
        texturePath,
        (tex) => {
          textureCache.current.set(texturePath, tex);
          applyTexture(tex);
        },
        null,
        (err) => console.error('Failed to load panorama', err)
      );
    }
  }

  // Helper to create beautiful glowing canvas textures for hotspots
  const createHotspotTexture = (THREE, type, label) => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 128, 128)

    const color = type === 'info' ? '#e07b00' : '#1a5c2a'
    const glowColor = type === 'info' ? 'rgba(224, 123, 0, ' : 'rgba(26, 92, 42, '
    const grad = ctx.createRadialGradient(64, 64, 15, 64, 64, 55)
    grad.addColorStop(0, glowColor + '1)')
    grad.addColorStop(0.5, glowColor + '0.4)')
    grad.addColorStop(1, glowColor + '0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(64, 64, 55, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(64, 64, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(64, 64, 28, 0, Math.PI * 2)
    ctx.stroke()
    if (type === 'info') {
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'bold italic 36px Georgia, serif'
      ctx.fillText('i', 64, 61)
    }
    return new THREE.CanvasTexture(canvas)
  }


  const getCleanDbStallNumber = (rawId) => {
    return String(rawId)
      .replace(/\(u\d*\)/gi, '')
      .replace(/Stall\s*#/gi, '')
      .replace('#', '')
      .trim()
      .toLowerCase()
      .replace(/^0+(?=\d)/, '');
  };

  // Node Graph to map stalls/hallways to Map X,Y coordinates
   // ── Missing stall coordinates ────────────────────────────────────────────
   // Only stalls that have NO entry in SVG_STALL_COORDS need a manual fallback.
   // These 4 stalls are interpolated from their neighbors' positions.
   const MISSING_STALL_COORDS = {
     'meat-4(u)':  { x: 317, y: 1392 },  // between 3(u) at 1452 and 5(u) at 1332
     'meat-8(u)':  { x: 317, y: 1152 },  // same row as meat-8
     'meat-9(u)':  { x: 317, y: 1092 },  // same row as meat-9
     'meat-10(u)': { x: 317, y: 1032 },  // same row as meat-10
   };

   // Helper to derive north-offset from the stall's x-column on the SVG map
   const getNorthOffsetFromX = (x) => {
     if (x <= 350) return -90;
     if (x <= 550) return 90;
     if (x <= 850) return -90;
     if (x <= 1050) return 90;
     if (x <= 1350) return -90;
     if (x <= 1550) return 90;
     if (x <= 1850) return -90;
     return 90;
   };

   // Helper to retrieve stall info (coords & orientation).
   // Uses the stall's OWN position on the map — the blue dot always shows
   // where this stall physically is, regardless of which photo file it shares.
   const getStallInfo = (stall, overrideCategory = null) => {
     const category = overrideCategory || stateRef.current.activeSectionKey;
     const id = stall.id;

     // 1) Direct lookup in SVG_STALL_COORDS (most stalls have an entry)
     const rawKey = `${category}-${id}`;
     if (SVG_STALL_COORDS[rawKey]) {
       const c = SVG_STALL_COORDS[rawKey];
       return { x: c.x, y: c.y, northOffset: getNorthOffsetFromX(c.x) };
     }

     // 2) Try with cleaned stall number (strip parenthetical suffixes)
     const cleanNum = getCleanDbStallNumber(id);
     const cleanKey = `${category}-${cleanNum}`;
     if (SVG_STALL_COORDS[cleanKey]) {
       const c = SVG_STALL_COORDS[cleanKey];
       return { x: c.x, y: c.y, northOffset: getNorthOffsetFromX(c.x) };
     }

     // 3) Check missing-stall fallback coords
     if (MISSING_STALL_COORDS[rawKey]) {
       const c = MISSING_STALL_COORDS[rawKey];
       return { x: c.x, y: c.y, northOffset: getNorthOffsetFromX(c.x) };
     }

     // 4) Check STALL_MAP (auto-generated from file scan)
     if (STALL_MAP[category] && STALL_MAP[category][id]) {
       return STALL_MAP[category][id];
     }

     // 5) Ultimate fallback
     return { x: 1020, y: 635, northOffset: 0 };
   };

   // ── Panorama heading calibration ─────────────────────────────────────────
   // The cone must reflect what the *photo* is actually showing — not the map
   // column of whichever stall happens to reuse that photo. Many stalls share a
   // single panorama file (see getStallImagePath), so we resolve each photo back
   // to the stall it was captured at ("canonical" stall) and derive the heading
   // from THAT position. This makes the cone identical every time the same photo
   // is shown, instead of pointing different ways per display-stall — which was
   // the main reason the cone never stayed in sync with the 360 view.
   const resolveCanonicalCoordsFromPhoto = (photoPath) => {
     if (!photoPath) return null;
     // Filenames look like: "stall14 - fishes.jpg", "stall1(u) - meat.jpg",
     // "stall12(2) - meat.jpg", "stall19 -meat.jpg". Pull the base number and the
     // file's own category (which is where the photo physically lives).
     const m = photoPath.match(/stall0*(\d+)(?:\([^)]*\))?\s*-\s*(meat|fishes|vegies)/i);
     if (!m) return null;
     const num = m[1];
     const fileCat = m[2].toLowerCase();
     const canonCat = fileCat === 'fishes' ? 'fish' : fileCat === 'vegies' ? 'veggies' : 'meat';
     const key = `${canonCat}-${num}`;
     if (SVG_STALL_COORDS[key]) return SVG_STALL_COORDS[key];
     if (STALL_MAP[canonCat] && STALL_MAP[canonCat][num]) return STALL_MAP[canonCat][num];
     return null;
   };

   // ── Two global calibration constants (set by testing against the live 360) ──
   // THETA_SIGN: which way the cone turns as you drag. If the cone rotates the
   //   OPPOSITE way to the 360 view, flip to -1.
   // PANO_HEADING_OFFSET: a one-time 0/180 frame fix. If every cone points the
   //   exact opposite direction to where you're looking, set this to 180.
   const THETA_SIGN = 1;
   const PANO_HEADING_OFFSET = 0;

   // Base heading (degrees, 0 = map-north/up) that the panorama faces at theta = 0.
   // Primary source: PANO_HEADINGS, derived from the painted stall numbers in each
   // photo (see scripts/compute_headings.py). Falls back to geometry only if a
   // photo isn't in the table.
   const getPanoBaseHeading = (stall, category) => {
     const photoPath = getStallImagePath(stall.id, category);
     const file = photoPath.split('/').pop();
     if (PANO_HEADINGS[file] !== undefined) {
       return (PANO_HEADINGS[file] + PANO_HEADING_OFFSET + 360) % 360;
     }
     const rawCoords = getStallInfo(stall, category);
     // Entrance stalls look straight down the entrance corridor (north).
     if (rawCoords.y < 800 && rawCoords.x <= 350) return 0;
     const canon = resolveCanonicalCoordsFromPhoto(photoPath);
     if (canon) return getNorthOffsetFromX(canon.x);
     // Fallback: derive from the display stall's own column.
     return getNorthOffsetFromX(rawCoords.x);
   };

   // Compute camera (blue dot) position using stall info and entrance handling
   const getCameraPosition = (stall) => {
     const info = getStallInfo(stall);
     let cameraX = info.x;
     const isEntranceStall = info.y < 800 && info.x <= 350;
     if (!isEntranceStall) {
       if (info.x <= 350) cameraX = 392;
       else if (info.x > 350 && info.x <= 550) cameraX = 392;
       else if (info.x > 550 && info.x <= 850) cameraX = 892;
       else if (info.x > 850 && info.x <= 1050) cameraX = 892;
       else if (info.x > 1050 && info.x <= 1350) cameraX = 1392;
       else if (info.x > 1350 && info.x <= 1550) cameraX = 1392;
       else if (info.x > 1550 && info.x <= 1850) cameraX = 1887;
       else if (info.x > 1850) cameraX = 1887;
     }
     return { x: cameraX, y: info.y };
   };

  // When the stall changes, triggerSceneTransition resets the pan to theta = 0.
  // updateCamera (which pushes setCompassAngle) only runs on drag/auto-rotate, so
  // without this the cone would keep the previous stall's heading until touched.
  // Snap the cone to the new photo's base heading immediately so it stays in sync.
  useEffect(() => {
    if (!currentStall) return;
    const base = ((getPanoBaseHeading(currentStall, activeSectionKey) % 360) + 360) % 360;
    setCompassAngle(base);
    stateRef.current.lastCompassDeg = base;
  }, [currentStall, activeSectionKey]);

  const findNearestStallInDirection = (currentStall, currentCompassAngle) => {
    const currentSectionsData = stateRef.current.sectionsData;
    const currentActiveSectionKey = stateRef.current.activeSectionKey;
    const currentInfo = getStallInfo(currentStall, currentActiveSectionKey);
    let bestMatch = null;
    let minDistance = Infinity;

    const sectionKeys = ['meat', 'fish', 'veggies'];

    sectionKeys.forEach((secKey) => {
      const stalls = currentSectionsData[secKey].stalls;
      stalls.forEach((stall, idx) => {
        if (secKey === currentActiveSectionKey && stall.id === currentStall.id) return;

        const targetInfo = getStallInfo(stall, secKey);

        const dx = targetInfo.x - currentInfo.x;
        const dy = targetInfo.y - currentInfo.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Filter distance: max 410px so it doesn't jump through walls across the map, min 10px
        // (410px allows jumping the 400px gap between x=30 and x=430 for Zone E Stall 1 to 13)
        if (distance < 10 || distance > 410) return;

        const mapAngleRad = Math.atan2(dy, dx);
        const mapAngleDeg = (mapAngleRad * 180) / Math.PI;
        // Convert Map coordinate angle to Compass Angle
        const targetCompassAngle = (mapAngleDeg + 450) % 360;

        let angleDiff = Math.abs(targetCompassAngle - currentCompassAngle);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;

        // Valid if within 45 degrees field of view
        if (angleDiff <= 45) {
          if (distance < minDistance) {
            minDistance = distance;
            bestMatch = { sectionKey: secKey, index: idx, stall, distance };
          }
        }
      });
    });

    return bestMatch;
  };

  const extractCleanNumber = (name) => {
    if (!name) return '';
    // Super robust extraction of raw number/ID from name (e.g. "Zone E - Stall #10" -> "#10", "Stall 12" -> "#12", "Empty Stall 2" -> "#2")
    const hashMatch = name.match(/#\s*([a-zA-Z0-9()-]+)/i);
    if (hashMatch) {
      return `#${hashMatch[1]}`;
    }
    const numberMatch = name.match(/(\d+\s*\(?[a-zA-Z0-9]*\)?)$/i) || name.match(/(\d+)/);
    if (numberMatch) {
      return `#${numberMatch[1]}`;
    }
    // Fallback: strip Stall prefixes and truncate if too long
    const stripped = name.replace(/Stall\s*#/gi, '').replace(/Stall/gi, '').trim();
    return stripped.length > 5 ? stripped.substring(0, 4) + '..' : stripped;
  };

  // Helper to create beautiful Google Maps style placemarks for nearby stalls
  const createStallPinTexture = (THREE, name, sectionKey) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    const cleanNum = extractCleanNumber(name);

    // Section Colors from Legend: Meat = Brownish-red, Fishes = Cyan, Vegetables = Green
    let categoryColor = '#00c362'; // default vegetables
    let glowColor = 'rgba(0, 195, 98, 0.3)';
    if (sectionKey === 'meat') {
      categoryColor = '#8d3e3c';
      glowColor = 'rgba(141, 62, 60, 0.3)';
    } else if (sectionKey === 'fish') {
      categoryColor = '#00b5e2';
      glowColor = 'rgba(0, 181, 226, 0.3)';
    }

    const cx = 64;
    const cy = 64;
    const r = 24;

    // Draw outer glow/ring
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Draw background circle (Solid category color)
    ctx.fillStyle = categoryColor;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Draw thin white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Draw number text inside (White) - Dynamically adjust font size to prevent overflow/clipping
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let fontSize = 15;
    if (cleanNum.length > 6) {
      fontSize = 11;
    } else if (cleanNum.length > 4) {
      fontSize = 13;
    }

    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(cleanNum, cx, cy);

    return new THREE.CanvasTexture(canvas);
  };

  // Original shared chevron texture — a single ∧ shape, rotated per direction via angleOffset
  const createChevronTexture = (THREE) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    // Setup shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    // Define a sleek, thin filled chevron path (pointing UP)
    ctx.beginPath();
    // Outer tip
    ctx.moveTo(64, 35);
    // Right outer edge
    ctx.lineTo(114, 85);
    // Right wing tip (cut perpendicular to the wing direction)
    ctx.lineTo(104, 95);
    // Inner notch
    ctx.lineTo(64, 55);
    // Left wing tip (cut perpendicular)
    ctx.lineTo(24, 95);
    // Left outer edge
    ctx.lineTo(14, 85);
    ctx.closePath();

    // Fill with semi-transparent off-white
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();

    // Turn off shadow for the stroke so it remains crisp
    ctx.shadowColor = 'transparent';

    // Stroke with a sharp, thin dark border for contrast
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  // Re-populate the 3D scene with relevant Hotspots
  const recreateHotspots = (scene, stall, THREE) => {
    // Guard: bail out if Three.js or the scene hasn't initialised yet
    if (!scene || !THREE) return;

    // Clear old sprites — safe with optional chaining even if ref is undefined
    (hotspotMeshes.current ?? []).forEach((mesh) => { try { scene.remove(mesh); } catch (_) { } });
    hotspotMeshes.current = [];

    // Shared chevron texture — each mesh rotates it via angleOffset
    const chevronTex = createChevronTexture(THREE);

    ['Up', 'Down', 'Left', 'Right'].forEach((dir) => {
      const chevMat = new THREE.MeshBasicMaterial({
        map: chevronTex,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        opacity: 0.7
      });

      const chevMesh = new THREE.Mesh(new THREE.PlaneGeometry(35, 35), chevMat);
      chevMesh.position.set(0, -999, 0);
      chevMesh.visible = false;

      chevMesh.userData = {
        type: 'nav_chevron',
        direction: dir,
        label: '',
        targetStallInfo: null,
        isHovered: false
      };

      scene.add(chevMesh);
      hotspotMeshes.current.push(chevMesh);
    });
  };

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

      let clickStartX = 0
      let clickStartY = 0

      renderer.domElement.addEventListener('mousedown', (e) => {
        clickStartX = e.clientX
        clickStartY = e.clientY
      })

      renderer.domElement.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
          clickStartX = e.touches[0].clientX
          clickStartY = e.touches[0].clientY
        }
      })

      function onPointerDown(e) {
        const rect = renderer.domElement.getBoundingClientRect()
        const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
        const clientX = touch ? touch.clientX : e.clientX
        const clientY = touch ? touch.clientY : e.clientY

        // Separate thresholds: touch fingers drift more than mouse clicks
        const isTouch = !!touch;
        const dragDist = Math.sqrt((clientX - clickStartX) ** 2 + (clientY - clickStartY) ** 2)
        if (dragDist > (isTouch ? 20 : 8)) return;

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
          } else if (uData.type === 'nav_chevron') {
            if (uData.targetStallInfo) {
              const { sectionKey, index, stall: targetStall } = uData.targetStallInfo;
              setActiveSectionKey(sectionKey);
              setStallIndex(index);
              triggerSceneTransition(targetStall, sectionKey, true); // preserve camera angle
            }
          } else if (uData.type === 'info_button') {
            const { sectionKey, stall } = uData;
            if (stall) {
              const freshSectionsData = stateRef.current.sectionsData;
              const stalls = freshSectionsData[sectionKey].stalls;
              const targetIdx = stalls.findIndex(s => s.id === stall.id);
              if (targetIdx !== -1) {
                setActiveSectionKey(sectionKey);
                setStallIndex(targetIdx);
                setDetailsCollapsed(false);

                const cleanZone = String(stall.zone || '').replace('Zone ', '').toUpperCase();
                fetchStallDetailsFromDb(stall.id, cleanZone).then((dbDetails) => {
                  if (dbDetails) {
                    setSectionsData((prev) => {
                      const updated = { ...prev };
                      updated[sectionKey].stalls[targetIdx] = {
                        ...updated[sectionKey].stalls[targetIdx],
                        vendorName: dbDetails.vendorName || dbDetails.tenant?.name || 'Vibrant Local Vendor',
                        productType: dbDetails.productType || 'General Produce',
                        operatingHours: dbDetails.operatingHours || '4:00 AM - 6:00 PM',
                        phoneNumber: dbDetails.phoneNumber || 'N/A',
                        status: dbDetails.status ? (dbDetails.status.charAt(0).toUpperCase() + dbDetails.status.slice(1)) : 'Available',
                        price: dbDetails.monthlyRate ? `₱${dbDetails.monthlyRate.toLocaleString()}` : updated[sectionKey].stalls[targetIdx].price,
                        size: dbDetails.size || 12
                      };
                      return updated;
                    });
                  }
                });
              }
            }
          }
        } else {
          // "Click to Navigate" Feature
          const rx = raycaster.ray.direction.x;
          const rz = raycaster.ray.direction.z;
          const clickTheta = Math.atan2(rz, rx);

          const currentStall = stateRef.current.currentStall;
          const activeSectionKey = stateRef.current.activeSectionKey;
          
          const info = getStallInfo(currentStall, activeSectionKey);
          const northOffset = info.northOffset !== undefined ? info.northOffset : 0;
          const deg = Math.round((clickTheta * 180) / Math.PI) + northOffset;
          const clickCompassDeg = ((deg % 360) + 360) % 360;

          const target = findNearestStallInDirection(currentStall, clickCompassDeg);
          
          if (target && !transitioning) {
            const { sectionKey, stall } = target;
            const targetStallId = stall.id;

            setTransitioning(true);
            const startFov = camera.fov;
            const targetFov = Math.max(30, startFov - 25);
            const duration = 400; // 400ms zoom animation
            const startTime = performance.now();

            const animateForward = (time) => {
              const elapsed = time - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

              camera.fov = startFov - ((startFov - targetFov) * ease);
              camera.updateProjectionMatrix();

              if (progress < 1) {
                requestAnimationFrame(animateForward);
              } else {
                const freshSectionsData = stateRef.current.sectionsData;
                const stalls = freshSectionsData[sectionKey].stalls;
                const targetIdx = stalls.findIndex(s => s.id === targetStallId);
                
                if (targetIdx !== -1) {
                  setActiveSectionKey(sectionKey);
                  setStallIndex(targetIdx);
                  triggerSceneTransition(getStallImagePath(stalls[targetIdx].id, sectionKey), true);
                } else {
                  setTransitioning(false);
                }
              }
            };
            requestAnimationFrame(animateForward);
          }
        }
      }

      // Mouse click — desktop chevron tap
      renderer.domElement.addEventListener('click', onPointerDown)
      // Touch tap — mobile chevron tap (MUST be registered for mobile to work)
      renderer.domElement.addEventListener('touchend', onPointerDown)

      // Mutable hover state for arrow — shared by onPointerMove and animate
      let arrowIsHovered = false;

      // Track hovering to show tooltips & change cursors
      function onPointerMove(e) {
        const rect = renderer.domElement.getBoundingClientRect()
        const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
        const clientX = touch ? touch.clientX : e.clientX
        const clientY = touch ? touch.clientY : e.clientY

        // Track screen mouse positions for tooltips
        setMousePos({ x: clientX, y: clientY })

        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const hits = raycaster.intersectObjects(hotspotMeshes.current)

        if (hits.length > 0) {
          const hit = hits[0]

          let dynamicLabel = hit.object.userData.label;
          if (hit.object.userData.type === 'next' || hit.object.userData.type === 'prev') {
            const cameraDirection = new THREE.Vector3()
            cameraRef.current.getWorldDirection(cameraDirection)
            const arrowDirection = new THREE.Vector3().copy(hit.object.position).normalize()
            const dot = cameraDirection.dot(arrowDirection)
            dynamicLabel = dot > 0 ? 'Forward' : 'Backward'
          } else if (hit.object.userData.type === 'info_button') {
            dynamicLabel = `View Details for ${hit.object.userData.stall.name}`;
          } else if (hit.object.userData.type === 'nav_chevron') {
            if (!hit.object.userData.targetStallInfo) {
              dynamicLabel = '';
            } else {
              const compassDeg = stateRef.current.lastCompassDeg;
              const targetAngle = hit.object.userData.targetStallInfo.compassAngle;
              let diff = (targetAngle - compassDeg + 360) % 360;
              if (diff > 180) diff -= 360;

              const targetName = hit.object.userData.targetStallInfo.stall.name;

              if (Math.abs(diff) <= 45) {
                dynamicLabel = `Forward to ${targetName}`;
              } else if (diff > 45 && diff < 135) {
                dynamicLabel = `Go Right to ${targetName}`;
              } else if (diff < -45 && diff > -135) {
                dynamicLabel = `Go Left to ${targetName}`;
              } else {
                dynamicLabel = `Backward to ${targetName}`;
              }

              hit.object.userData.isHovered = true;
            }
          }

          // Clear hovered status on other chevrons
          (hotspotMeshes.current ?? []).forEach((m) => {
            if (m !== hit.object && m.userData.type === 'nav_chevron') {
              m.userData.isHovered = false;
            }
          });

          setHoveredHotspot({
            ...hit.object.userData,
            dynamicLabel
          })
          setCursor('pointer')
        } else {
          // Clear hovered status on all chevrons
          (hotspotMeshes.current ?? []).forEach((m) => {
            if (m.userData.type === 'nav_chevron') {
              m.userData.isHovered = false;
            }
          });
          setHoveredHotspot(null)
          setCursor('grab')
        }
      }

      window.addEventListener('mousemove', onPointerMove)

      // Camera Look-At Logic
      let northOffset = 0;
      function updateCamera() {
        const { phi, theta } = spherical.current
        const x = Math.sin(phi) * Math.cos(theta)
        const y = Math.cos(phi)
        const z = Math.sin(phi) * Math.sin(theta)
        camera.lookAt(x, y, z)

        // Heading the panorama faces at theta = 0, resolved from the PHOTO (so a
        // reused photo always yields the same cone) rather than the display column.
        northOffset = getPanoBaseHeading(stateRef.current.currentStall, stateRef.current.activeSectionKey);

        const isZoneEMeat = stateRef.current.activeSectionKey === 'meat' && upsideDownStalls.includes(stateRef.current.currentStall.id);
        const isZoneAFish = stateRef.current.activeSectionKey === 'fish' && zoneAFishUpsideDown.includes(stateRef.current.currentStall.id);
        const isZoneAMeat = stateRef.current.activeSectionKey === 'meat' && zoneAMeatUpsideDown.includes(stateRef.current.currentStall.id);

        if (stateRef.current.currentStall && stateRef.current.currentStall.id === '1(u)') {
          northOffset = -90; // Calibrate left turn to point to Stall #13
        } else if (stateRef.current.currentStall && (isZoneEMeat || isZoneAFish || isZoneAMeat)) {
          northOffset = 180; // Correct cone to align with the actual camera orientation for the entire row
        }

        // Sync compass rotation (0 deg = North)
        const deg = -Math.round((theta * 180) / Math.PI) + northOffset;
        const compassDeg = ((deg % 360) + 360) % 360; // ensure positive

        // Optimize: Only update compass state if the degree actually changed
        if (stateRef.current.lastCompassDeg !== compassDeg) {
          stateRef.current.lastCompassDeg = compassDeg;
          setCompassAngle(compassDeg)
        }

        // Update ground navigation chevrons dynamically in arrow keys layout
        const arrowMeshes = hotspotMeshes.current.filter(m => m.userData.type === 'nav_chevron');

        // Hide all chevrons by default
        arrowMeshes.forEach(m => {
          m.visible = false;
          m.userData.targetStallInfo = null;
          m.position.set(0, -999, 0);
        });

        if (arrowMeshes.length > 0 && stateRef.current.currentStall) {
          const currentStall = stateRef.current.currentStall;
          const currentCoords = getRawCoordinates(currentStall, stateRef.current.activeSectionKey);

          const forwards = [];
          const backwards = [];
          const lefts = [];
          const rights = [];

          const sectionKeys = ['meat', 'fish', 'veggies'];
          sectionKeys.forEach((secKey) => {
            if (!stateRef.current.sectionsData[secKey]) return;
            const stalls = stateRef.current.sectionsData[secKey].stalls;
            stalls.forEach((s, idx) => {
              if (secKey === stateRef.current.activeSectionKey && s.id === currentStall.id) return;

              const targetCoords = getRawCoordinates(s, secKey);
              const dx = targetCoords.x - currentCoords.x;
              const dy = targetCoords.y - currentCoords.y;
              const distance = Math.hypot(dx, dy);

              if (distance < 10 || distance > 380) return;

              const mapAngleRad = Math.atan2(dy, dx);
              const mapAngleDeg = (mapAngleRad * 180) / Math.PI;
              const targetCompassAngle = (mapAngleDeg + 450) % 360;

              // Angle difference relative to camera looking angle (compassDeg)
              let diff = (targetCompassAngle - compassDeg + 360) % 360;
              if (diff > 180) diff -= 360; // -180 to 180

              const item = {
                sectionKey: secKey,
                index: idx,
                stall: s,
                distance,
                compassAngle: targetCompassAngle,
                diff: Math.abs(diff),
                signedDiff: diff
              };

              if (Math.abs(diff) <= 45) {
                forwards.push(item);
              } else if (diff > 45 && diff < 135) {
                rights.push(item);
              } else if (diff < -45 && diff > -135) {
                lefts.push(item);
              } else {
                backwards.push({ ...item, diff: 180 - Math.abs(diff) });
              }
            });
          });

          // Sort by deviation from center of view cones
          forwards.sort((a, b) => a.diff - b.diff);
          rights.sort((a, b) => a.diff - b.diff);
          lefts.sort((a, b) => a.diff - b.diff);
          backwards.sort((a, b) => a.diff - b.diff);

          const bestForward = forwards[0] || null;
          const bestRight = rights[0] || null;
          const bestLeft = lefts[0] || null;
          const bestBackward = backwards[0] || null;

          // Responsive styling for smartphones (narrow portrait viewports)
          const aspect = camera.aspect;
          const responsiveScale = aspect < 1.0 ? Math.max(0.4, aspect * 0.85) : 1.0;

          const placeDist = aspect < 1.0 ? 110 : 100;
          const gap = 38 * responsiveScale;
          const vGap = 38 * responsiveScale;

          arrowMeshes.forEach((arrowMesh) => {
            const dir = arrowMesh.userData.direction;
            let target = null;
            let cx = 0, cz = 0;
            let angleOffset = 0;

            if (dir === 'Up') {
              target = bestForward;
              cx = Math.cos(theta) * (placeDist + vGap);
              cz = Math.sin(theta) * (placeDist + vGap);
              angleOffset = -Math.PI / 2;  // tip points forward (^)
            } else if (dir === 'Down') {
              target = bestBackward;
              cx = Math.cos(theta) * placeDist;
              cz = Math.sin(theta) * placeDist;
              angleOffset = Math.PI / 2;   // tip points backward (⌄)
            } else if (dir === 'Left') {
              target = bestLeft;
              cx = Math.cos(theta) * placeDist + Math.cos(theta - Math.PI / 2) * gap;
              cz = Math.sin(theta) * placeDist + Math.sin(theta - Math.PI / 2) * gap;
              angleOffset = 0;
            } else if (dir === 'Right') {
              target = bestRight;
              cx = Math.cos(theta) * placeDist + Math.cos(theta + Math.PI / 2) * gap;
              cz = Math.sin(theta) * placeDist + Math.sin(theta + Math.PI / 2) * gap;
              angleOffset = Math.PI;
            }

            if (target) {
              arrowMesh.visible = true;
              arrowMesh.position.set(cx, -65, cz);
              arrowMesh.rotation.set(-Math.PI / 2, 0, theta + angleOffset);
              arrowMesh.scale.set(responsiveScale, responsiveScale, 1);
              arrowMesh.userData.targetStallInfo = target;

              // Set the text label dynamically
              const targetName = target.stall.name;
              if (dir === 'Up') arrowMesh.userData.label = `Forward to ${targetName}`;
              else if (dir === 'Down') arrowMesh.userData.label = `Backward to ${targetName}`;
              else if (dir === 'Left') arrowMesh.userData.label = `Go Left to ${targetName}`;
              else if (dir === 'Right') arrowMesh.userData.label = `Go Right to ${targetName}`;

            } else {
              arrowMesh.visible = false;
              arrowMesh.position.set(0, -999, 0);
              arrowMesh.userData.targetStallInfo = null;
            }
          });

          // Proactively warm the THREE texture cache for all visible chevron targets
          // so the NEXT stall switch is instant (no network wait)
          arrowMeshes.forEach((m) => {
            const info = m.userData.targetStallInfo;
            if (!info) return;
            const path = getStallImagePath(info.stall.id, info.sectionKey);
            if (!textureCache.current.has(path)) {
              new THREE.TextureLoader().load(path, (tex) => {
                textureCache.current.set(path, tex);
              });
            }
          });
        }
      } // end updateCamera

      // Expose updateCamera so triggerSceneTransition can call it outside this effect
      updateCameraRef.current = updateCamera;
      updateCamera()

      // Animation Loop
      function animate() {
        frameRef.current = requestAnimationFrame(animate)

        if (autoRotateRef.current && !isDragging.current) {
          spherical.current.theta += 0.0018
          updateCamera()
        }

        // Pulse ground chevrons
        const time = Date.now() * 0.004;
        (hotspotMeshes.current ?? []).forEach((m) => {
          if (m.userData.type === 'nav_chevron') {
            const baseOpacity = m.userData.isHovered ? 0.95 : 0.6;
            const pulse = m.userData.isHovered ? 0 : Math.sin(time + m.position.x * 0.05) * 0.15;
            m.material.opacity = baseOpacity + pulse;
          }
        });

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

        // Google Maps Street View style "grab the scene" drag: the view follows
        // the finger. In this rig, theta+ turns the camera right, so horizontal is
        // -dx (drag right -> look left) and vertical is -dy (drag down -> look up).
        spherical.current.theta -= dx * 0.003
        spherical.current.phi = Math.max(0.4, Math.min(Math.PI - 0.4, spherical.current.phi - dy * 0.003))
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

        // Google Maps Street View style "grab" drag (matches the mouse handler).
        spherical.current.theta -= dx * 0.004
        spherical.current.phi = Math.max(0.4, Math.min(Math.PI - 0.4, spherical.current.phi - dy * 0.004))
        updateCamera()
      }

      function onTouchEnd() {
        isDragging.current = false
        setCursor('grab')
        // Reposition chevrons immediately after panning — no extra tap needed
        updateCamera()
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
  }, []) // Run once on mount — autoRotate is read via autoRotateRef to avoid scene rebuilds

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
  const activeSectColor = activeSectionKey === 'meat' ? '#8d3e3c' : activeSectionKey === 'fish' ? '#00b5e2' : '#00c362';


  return (
    <div className="relative w-full bg-black overflow-hidden font-sans select-none flex" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <style>{`
      `}</style>

      {/* ── DESKTOP SIDEBAR ── hidden on mobile ── */}
      <aside
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
        className="hidden md:flex flex-col bg-white border-r border-gray-200 h-full shrink-0 z-50 transition-all duration-300 shadow-sm"
        style={{ width: sidebarCollapsed ? '4rem' : '14rem' }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2 px-4 py-5 border-b border-gray-100 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-[#1a5c2a] rounded-lg flex items-center justify-center shrink-0">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5" />
              <path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244" />
              <path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05" />
            </svg>
          </div>
          {!sidebarCollapsed && <span className="font-extrabold text-gray-900 text-base tracking-tight">MyTalipapa</span>}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {[
            { id: 'home', label: 'Home', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>, action: () => { const token = localStorage.getItem('authToken'); navigate(token ? '/renter/dashboard' : '/'); } },
            { id: 'navigate', label: '360° Tour', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>, action: null },
            { id: 'ar-finder', label: 'AR Stall Finder', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>, action: () => handleOpenArView(currentStall) },
            { id: 'stalls', label: 'Stalls', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 3h18v4H3zM3 10h18M3 17h18M3 14h18" /></svg>, action: () => navigate('/renter/stalls') },
            ...(isLoggedIn ? [
              { id: 'applications', label: 'Applications', icon: <FileText size={18} />, action: () => navigate('/renter/applications') },
              { id: 'profile', label: 'Profile', icon: <User size={18} />, action: () => navigate('/renter/profile') }
            ] : [])
          ].map(({ id, label, icon, action }) => {
            const isActive = id === 'navigate';
            return (
              <button
                key={id}
                onClick={action || undefined}
                disabled={!action}
                title={sidebarCollapsed ? label : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${isActive
                  ? 'bg-[#edf5ed] text-[#1a5c2a]'
                  : action ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-800' : 'text-gray-400 cursor-default'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <span className={isActive ? 'text-[#1a5c2a]' : 'text-gray-400 group-hover:text-gray-600'}>{icon}</span>
                {!sidebarCollapsed && <span>{label}</span>}
                {!sidebarCollapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1a5c2a]" />}
              </button>
            );
          })}
        </nav>

        {isLoggedIn && (
          <div className="p-3 border-t border-gray-150 space-y-1">
            <button
              onClick={() => setShowLogout(true)}
              title={sidebarCollapsed ? 'Logout' : ''}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut size={15} />
              {!sidebarCollapsed && 'Logout'}
            </button>
          </div>
        )}
      </aside>

      {/* ── CONTENT AREA (fills remaining space on desktop) ── */}
      <div className="relative flex-1 overflow-hidden">

        {/* 360 ThreeJS Viewer Mount */}
        <div
          ref={mountRef}
          className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out ${isMapExpanded ? 'h-[62%]' : 'h-full'}`}
          style={{ cursor, filter: privacyMode ? 'blur(6px) contrast(1.05)' : 'none', display: 'block' }}
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

        {/* Screen Fade Transition Overlay with Loading Animation */}
        <div
          className={`absolute inset-0 bg-black z-10 transition-all duration-300 pointer-events-none flex flex-col items-center justify-center ${!loaded ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3" />
          <div className="text-white font-semibold text-xs tracking-wider animate-pulse">Loading...</div>
        </div>



        {/* Hover Tooltip for Hotspots */}
        {hoveredHotspot && loaded && uiVisible && (
          <div
            className="absolute z-40 bg-white/95 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl pointer-events-none shadow-xl border border-black/10 -translate-x-1/2 -translate-y-12 backdrop-blur-sm transition-all"
            style={{ left: mousePos.x, top: mousePos.y }}
          >
            {hoveredHotspot.type === 'nearby_stall' ? '' : (hoveredHotspot.dynamicLabel && hoveredHotspot.dynamicLabel.startsWith('Go Left') ? '←' : hoveredHotspot.dynamicLabel && hoveredHotspot.dynamicLabel.startsWith('Go Right') ? '→' : (hoveredHotspot.type === 'go_forward' || (hoveredHotspot.dynamicLabel && hoveredHotspot.dynamicLabel.startsWith('Forward'))) ? '↑' : (hoveredHotspot.dynamicLabel && (hoveredHotspot.dynamicLabel === 'Backward' || hoveredHotspot.dynamicLabel.startsWith('Backward') || hoveredHotspot.dynamicLabel.startsWith('Go Back'))) ? '↓' : 'i')}{hoveredHotspot.type === 'nearby_stall' ? '' : ' '}{hoveredHotspot.dynamicLabel || hoveredHotspot.label}
          </div>
        )}

        {/* TOP HEADER SECTION */}
        <div className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2 sm:p-4 pointer-events-none transition-all duration-300 ${uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12 pointer-events-none'}`}>
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => {
                if (location.pathname.startsWith('/renter')) {
                  navigate('/renter/ar-finder');
                } else {
                  if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                }
              }}
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white active:scale-95 transition-all text-slate-800 border border-black/10 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="bg-white/80 backdrop-blur-md rounded-full sm:rounded-2xl px-3 py-2 sm:px-4 flex items-center gap-2.5 shadow-lg border border-black/10 text-slate-800">
              <MapPin size={16} className="text-[#1a5c2a] shrink-0" />
              <div className="hidden sm:block">
                <span className="text-xs font-black tracking-wide block uppercase text-[#1a5c2a]">MyTalipapa Public Market</span>
                <span className="text-[10px] text-slate-500 font-semibold leading-none">Virtual 360° Stall Walkthrough</span>
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => handleOpenArView(currentStall)}
              className="px-3 py-2 sm:px-4.5 sm:py-2.5 rounded-full sm:rounded-2xl bg-[#1a5c2a] hover:bg-[#15491f] text-white text-xs font-black flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
              title="Open the live AR view for the stall you're looking at"
            >
              <Camera size={15} />
              <span className="hidden sm:inline">Open AR View</span>
            </button>
            <button
              onClick={() => setUiVisible(false)}
              className="px-3 py-2 sm:px-4.5 sm:py-2.5 rounded-full sm:rounded-2xl bg-white/80 hover:bg-white backdrop-blur-md text-slate-800 border border-black/10 text-xs font-black flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
              title="Hide all overlay buttons and panels"
            >
              <EyeOff size={15} />
              <span className="hidden sm:inline">Hide Controls</span>
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
        <div className="absolute right-2 sm:right-4 top-20 sm:top-28 md:top-1/2 md:-translate-y-1/2 z-20 flex flex-col items-center gap-2 sm:gap-4">
          {/* Compass Overlay Dial */}
          <div className={`w-10 h-10 sm:w-14 sm:h-14 mb-0 sm:mb-1 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center border border-black/10 shadow-2xl relative overflow-hidden transition-all duration-300 ${uiVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}>
            <div
              className="w-10 h-10 flex items-center justify-center transition-transform duration-100"
              style={{ transform: `rotate(${compassAngle}deg)` }}
            >
              <CompassIcon size={24} className="text-[#1a5c2a]" />
            </div>
            <div className="absolute top-0.5 text-[8px] font-black text-[#1a5c2a]">N</div>
          </div>

          {/* Action Button Pad */}
          <div className={`bg-white/90 backdrop-blur-md p-1.5 sm:p-2 rounded-[2rem] flex flex-col gap-1.5 sm:gap-2.5 border border-black/10 shadow-2xl origin-top-right scale-90 sm:scale-100 transition-all duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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

        {/* MAP OVERLAY (Mini or Expanded) */}
        {uiVisible && isMapExpanded && (
          <div
            onClick={() => {
              setIsMapExpanded(false);
              let count = 0;
              const interval = setInterval(() => {
                window.dispatchEvent(new Event('resize'));
                if (count++ > 30) clearInterval(interval);
              }, 16);
            }}
            className="fixed inset-0 bg-transparent backdrop-blur-md z-30 cursor-pointer animate-fade-in"
          />
        )}

        {uiVisible && (
          <div
            onClick={!isMapExpanded ? () => {
              setIsMapExpanded(true);
              let count = 0;
              const interval = setInterval(() => {
                window.dispatchEvent(new Event('resize'));
                if (count++ > 30) clearInterval(interval);
              }, 16);
            } : undefined}
            className={`absolute transition-all duration-150 ease-out z-40 flex flex-col ${isMapExpanded
              ? 'bottom-[12.5vh] left-[4vw] sm:left-[calc(50%-28rem)] w-[92vw] h-[75vh] max-w-4xl p-4 sm:p-5 bg-slate-950/15 backdrop-blur-md overflow-hidden rounded-3xl border border-white/10'
              : 'bottom-40 right-3 sm:bottom-6 sm:left-6 sm:right-auto w-28 h-28 sm:w-48 sm:h-48 md:w-56 md:h-56 overflow-hidden cursor-pointer bg-slate-950/85 backdrop-blur-md hover:scale-105 rounded-full border-[3px] sm:border-4 border-[#e8621a]'
              }`}
            style={{
              boxShadow: isMapExpanded
                ? '0 25px 50px rgba(0, 0, 0, 0.5)'
                : '-4px 8px 24px rgba(0, 0, 0, 0.45), 0 0 20px rgba(232, 98, 26, 0.35)'
            }}
          >
            {isMapExpanded ? (
              <div className="flex flex-col gap-2 shrink-0 z-10 mb-3 px-1" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Route Finder</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMapExpanded(false);
                      let count = 0;
                      const interval = setInterval(() => {
                        window.dispatchEvent(new Event('resize'));
                        if (count++ > 30) clearInterval(interval);
                      }, 16);
                    }}
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0 shadow-lg border border-white/5"
                    title="Collapse Map"
                  >
                    <Minimize2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => { setRoutePickStep('from'); setRoutePickerSearch(''); setRoutePickerCat('all'); }}
                    className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl border cursor-pointer transition-all active:scale-95"
                    style={{ background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.35)' }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] border border-white/60 shrink-0" />
                    <span className="text-[11px] font-bold text-white max-w-[110px] truncate">
                      {routeFrom ? (sectionsData[routeFrom.secKey]?.stalls.find(s => s.id === routeFrom.stallId)?.name ?? 'From…') : 'From stall…'}
                    </span>
                    <ChevronDown size={10} className="text-slate-400 shrink-0" />
                  </button>

                  <span className="text-slate-500 font-black shrink-0">→</span>

                  <button
                    onClick={() => { setRoutePickStep('to'); setRoutePickerSearch(''); setRoutePickerCat('all'); }}
                    className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl border cursor-pointer transition-all active:scale-95"
                    style={{ background: routeTo ? 'rgba(232,98,26,0.12)' : 'rgba(255,255,255,0.06)', borderColor: routeTo ? 'rgba(232,98,26,0.35)' : 'rgba(255,255,255,0.15)' }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-white/60 shrink-0" style={{ background: routeTo ? '#e8621a' : '#ef4444' }} />
                    <span className="text-[11px] font-bold text-white max-w-[110px] truncate">
                      {routeTo ? (sectionsData[routeTo.secKey]?.stalls.find(s => s.id === routeTo.stallId)?.name ?? 'To…') : 'To stall…'}
                    </span>
                    <ChevronDown size={10} className="text-slate-400 shrink-0" />
                  </button>

                  {(routeFrom || routeTo) && (
                    <button
                      onClick={() => {
                        setRouteFrom(null);
                        setRouteTo(null);
                        setDestinationStall(null);
                        setRouteInstructions([]);
                        setArWaypoints([]);
                        setIsWalkingSimulation(false);
                      }}
                      className="text-[10px] font-black text-slate-400 hover:text-red-400 transition-colors shrink-0 px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden" onClick={isMapExpanded ? (e) => e.stopPropagation() : undefined}>
              {(() => {
                const mapCoords = getRawCoordinates(currentStall);
                let fromCoords = null;
                let toCoords = null;

                if (destinationStall) {
                  fromCoords = getRawCoordinates(currentStall, activeSectionKey);
                  const targetSec = destinationStall.category || activeSectionKey;
                  toCoords = getRawCoordinates(destinationStall, targetSec);
                } else {
                  const fromStall = routeFrom ? sectionsData[routeFrom.secKey]?.stalls.find(s => s.id === routeFrom.stallId) : null;
                  const toStall = routeTo ? sectionsData[routeTo.secKey]?.stalls.find(s => s.id === routeTo.stallId) : null;
                  fromCoords = fromStall ? getRawCoordinates(fromStall, routeFrom.secKey) : null;
                  toCoords = toStall ? getRawCoordinates(toStall, routeTo.secKey) : null;
                }

                let viewBoxStr = "0 0 2305 1824";
                if (!isMapExpanded) {
                  let centerTarget = mapCoords;
                  if (fromCoords && toCoords) {
                    const waypoints = findMarketRoute(fromCoords, toCoords);
                    if (waypoints.length > 1) {
                      const nextWp = waypoints[1];
                      centerTarget = {
                        x: (mapCoords.x + nextWp.x) / 2,
                        y: (mapCoords.y + nextWp.y) / 2
                      };
                    }
                  }
                  const zoomWidth = 550;
                  const zoomHeight = 550;
                  const vbX = Math.max(0, Math.min(2305 - zoomWidth, centerTarget.x - zoomWidth / 2));
                  const vbY = Math.max(0, Math.min(1824 - zoomHeight, centerTarget.y - zoomHeight / 2));
                  viewBoxStr = `${vbX} ${vbY} ${zoomWidth} ${zoomHeight}`;
                }

                return (
                  <div
                    className="w-full h-full transition-all duration-1000 ease-out flex items-center justify-center p-2 max-h-full max-w-full"
                    style={{ filter: isMapExpanded ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.75))' : 'none' }}
                  >
                    <svg
                      viewBox={viewBoxStr}
                      preserveAspectRatio="xMidYMid meet"
                      className="max-w-full max-h-full transition-all duration-700"
                      style={{ pointerEvents: isMapExpanded ? 'auto' : 'none', cursor: isMapExpanded ? 'pointer' : 'default' }}
                      onClick={isMapExpanded ? handleMapTeleport : undefined}
                    >
                      <image href={mapImage} x="0" y="0" width="2305" height="1824" preserveAspectRatio="none" style={{ pointerEvents: 'none', opacity: 0.85 }} />
                      <circle cx="205" cy="803" r="22" fill="#c4c6c4" opacity="0.95" />
                      <circle cx="205" cy="1603" r="22" fill="#c4c6c4" opacity="0.95" />
                      {Object.entries(sectionsData).map(([secKey, sec]) =>
                        sec.stalls.map((st, idx) => {
                          const coords = getRawCoordinates(st, secKey);
                          if (coords.x === 1020 && (coords.y === 635 || coords.y === 885)) return null;
                          const isCurrent = secKey === activeSectionKey && idx === stallIndex;
                          const isFrom = routeFrom && routeFrom.secKey === secKey && routeFrom.stallId === st.id;
                          const isTo = routeTo && routeTo.secKey === secKey && routeTo.stallId === st.id;
                          const isHighlighted = isCurrent || isFrom || isTo;
                          return (
                            <g
                              key={`${secKey}-${st.id}`}
                              transform={`translate(${coords.x},${coords.y})`}
                              style={{ cursor: 'pointer', opacity: isHighlighted ? 1 : 0.14, transition: 'opacity 0.2s' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (transitioning) return;
                                setActiveSectionKey(secKey);
                                setStallIndex(idx);
                                setSelectedStall(st);
                                triggerSceneTransition(getStallImagePath(st.id, secKey));
                                setIsMapExpanded(false);
                                let count = 0;
                                const interval = setInterval(() => {
                                  window.dispatchEvent(new Event('resize'));
                                  if (count++ > 30) clearInterval(interval);
                                }, 16);
                              }}
                            >
                              <rect x="-78" y="-32" width="156" height="64" fill="transparent" />
                              {isTo && (
                                <>
                                  <path d="M 0 16 C -11 7, -14 0, -14 -6 A 14 14 0 0 1 14 -6 C 14 0, 11 7, 0 16 Z" fill="#e8621a" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
                                  <circle cx="0" cy="-6" r="4.5" fill="#ffffff" />
                                </>
                              )}
                              {isFrom && !isCurrent && (
                                <>
                                  <circle cx="0" cy="0" r="10" fill="#22c55e" stroke="#fff" strokeWidth="3" />
                                  <circle cx="0" cy="0" r="3.5" fill="#fff" />
                                </>
                              )}
                            </g>
                          );
                        })
                      )}
                      {fromCoords && toCoords && (() => {
                        const waypoints = findMarketRoute(fromCoords, toCoords);
                        if (waypoints.length < 2) return null;
                        const pts = waypoints.map(p => `${p.x},${p.y}`).join(' ');
                        const sw = isMapExpanded ? 9 : 6;
                        const casing = isMapExpanded ? 18 : 12;
                        return (
                          <g style={{ pointerEvents: 'none' }}>
                            <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth={casing} strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
                            <polyline points={pts} fill="none" stroke="#e8621a" strokeWidth={sw} strokeDasharray="1 26" strokeLinecap="round" strokeLinejoin="round">
                              <animate attributeName="stroke-dashoffset" from="27" to="0" dur="0.7s" repeatCount="indefinite" />
                            </polyline>
                          </g>
                        );
                      })()}
                      <g transform={`translate(${mapCoords.x}, ${mapCoords.y})`} style={{ pointerEvents: 'none' }}>
                        <path d="M0 0 L-70 -120 A140 140 0 0 1 70 -120 Z" fill="rgba(26,92,42,0.30)" transform={`rotate(${compassAngle})`} style={{ transformOrigin: '0px 0px' }} />
                        <g transform={`rotate(${compassAngle})`}>
                          <circle r="25" fill="#1a5c2a" stroke="#fff" strokeWidth="4" />
                          <path d="M0 -15 L12 10 L0 4 L-12 10 Z" fill="#fff" />
                        </g>
                      </g>
                      <image href={logoImage} x="20" y="1604" width="200" height="200" preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: 'none', opacity: 0.6 }} />
                    </svg>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── ROUTE PICKER BOTTOM SHEET (ArFinder-style) ── */}
        {routePickStep && (() => {
          const isFrom = routePickStep === 'from';
          const accentColor = isFrom ? '#22c55e' : '#e8621a';
          const accentRing = isFrom ? 'rgba(34,197,94,0.35)' : 'rgba(232,98,26,0.35)';
          const title = isFrom ? 'Choose Start Stall' : 'Choose Destination Stall';

          const allRouteStalls = Object.entries(sectionsData).flatMap(([secKey, sec]) =>
            sec.stalls.map(st => ({
              value: `${secKey}::${st.id}`,
              secKey,
              st,
              section: secKey === 'meat' ? 'Meat Section' : secKey === 'fish' ? 'Fish Section' : 'Vegetables Section',
              sectionIcon: secKey === 'meat' ? '🥩' : secKey === 'fish' ? '🐟' : '🥦',
            }))
          );

          const filtered = allRouteStalls.filter(item => {
            const catOk = routePickerCat === 'all' || item.secKey === routePickerCat;
            const q = routePickerSearch.trim().toLowerCase();
            const textOk = !q || item.st.name.toLowerCase().includes(q) || item.section.toLowerCase().includes(q);
            return catOk && textOk;
          });

          const currentVal = isFrom
            ? (routeFrom ? `${routeFrom.secKey}::${routeFrom.stallId}` : '')
            : (routeTo ? `${routeTo.secKey}::${routeTo.stallId}` : '');

          return (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 300, display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.18s ease' }}
              onClick={() => setRoutePickStep(null)}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', background: '#0f1710', borderRadius: '20px 20px 0 0', borderTop: '1px solid rgba(255,255,255,0.12)', maxHeight: '78vh', display: 'flex', flexDirection: 'column', animation: 'sheetUp 0.22s cubic-bezier(0.22,1,0.36,1)', overflow: 'hidden' }}
              >
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '10px auto 0', flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 8px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: accentColor, border: '2px solid rgba(255,255,255,0.5)', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{title}</span>
                  </div>
                  <button onClick={() => setRoutePickStep(null)} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                    <X size={13} />
                  </button>
                </div>
                <div style={{ padding: '0 14px 8px', flexShrink: 0, position: 'relative' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input type="text" placeholder="Search stall…" value={routePickerSearch} onChange={e => setRoutePickerSearch(e.target.value)} autoFocus style={{ width: '100%', padding: '8px 12px 8px 34px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', flexShrink: 0, overflowX: 'auto' }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'meat', label: '🥩 Meat' },
                    { id: 'fish', label: '🐟 Fish' },
                    { id: 'veggies', label: '🥦 Vegetables' },
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setRoutePickerCat(c.id)}
                      style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 800, cursor: 'pointer', transition: 'all 0.12s', background: routePickerCat === c.id ? accentColor : 'rgba(255,255,255,0.07)', color: routePickerCat === c.id ? '#fff' : 'rgba(255,255,255,0.5)', border: routePickerCat === c.id ? `1px solid ${accentColor}` : '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 20px', WebkitOverflowScrolling: 'touch' }}>
                  {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px 16px', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600 }}>No stalls match "{routePickerSearch}"</div>
                  ) : (
                    filtered.map(({ value, secKey, st, section, sectionIcon }) => {
                      const isSelected = currentVal === value;
                      return (
                        <div
                          key={value}
                          onClick={() => {
                            if (isFrom) {
                              setRouteFrom({ secKey, stallId: st.id });
                              const targetSec = sectionsData[secKey];
                              if (targetSec) {
                                const idx = targetSec.stalls.findIndex(s => s.id === st.id);
                                if (idx !== -1 && !transitioning) {
                                  setActiveSectionKey(secKey);
                                  setStallIndex(idx);
                                  triggerSceneTransition(st, secKey);
                                }
                              }
                            } else {
                              setRouteTo({ secKey, stallId: st.id });
                              const targetStall = sectionsData[secKey]?.stalls.find(s => s.id === st.id);
                              if (targetStall) handleRouteMe(targetStall);
                            }
                            setRoutePickStep(null);
                          }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, marginBottom: 3, cursor: 'pointer', gap: 8, transition: 'background 0.12s', background: isSelected ? `rgba(${isFrom ? '34,197,94' : '232,98,26'},0.18)` : 'transparent' }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 14, flexShrink: 0 }}>{sectionIcon}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.05em', color: accentColor, background: `rgba(${isFrom ? '34,197,94' : '232,98,26'},0.12)`, border: `1px solid ${accentRing}`, borderRadius: 999, padding: '2px 7px', whiteSpace: 'nowrap' }}>{section}</span>
                            {isSelected && (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* BOTTOM NAV BAR — mirrors RenterLayout bottom tab bar */}
        {uiVisible && (
          <nav className="md:hidden absolute bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-black/10 flex justify-around items-center h-14 px-1 shadow-lg">
            {[
              { id: 'home', label: 'Home', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>, action: () => { const token = localStorage.getItem('authToken'); navigate(token ? '/renter/dashboard' : '/'); } },
              { id: 'navigate', label: '360° Tour', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>, action: null },
              { id: 'ar-finder', label: 'AR Stall Finder', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>, action: () => handleOpenArView(currentStall) },
              { id: 'stalls', label: 'Stalls', icon: <Store size={16} />, action: () => navigate('/renter/stalls') },
              ...(isLoggedIn ? [
                { id: 'applications', label: 'Applications', icon: <FileText size={16} />, action: () => navigate('/renter/applications') },
                { id: 'profile', label: 'Profile', icon: <User size={16} />, action: () => navigate('/renter/profile') }
              ] : [])
            ].map(({ id, label, icon, action }) => {
              const isActive = id === 'navigate';
              return (
                <button
                  key={id}
                  onClick={action || undefined}
                  disabled={!action}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 transition-all ${!action ? 'opacity-100' : 'active:scale-90'}`}
                >
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#1a5c2a]' : ''}`}>
                    <span className={isActive ? 'text-white' : 'text-gray-400'}>{icon}</span>
                  </div>
                  <span className={`text-[8px] font-bold leading-tight text-center ${isActive ? 'text-[#1a5c2a]' : 'text-gray-400'}`}>{label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* BOTTOM CENTER STALL QUICK SWITCHER CONTROLS */}
        {true && (
          <div className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'} ${detailsCollapsed ? 'bottom-16 sm:bottom-10' : 'bottom-[330px] md:bottom-[240px]'} flex flex-col items-center gap-1.5 sm:gap-2.5 scale-90 sm:scale-100 origin-bottom`}>
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
                <ChevronDown size={12} style={{ color: activeSectColor }} />
              </button>

              {stallDropdownOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 bg-white/95 backdrop-blur-md border border-black/10 rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-0 min-w-[220px] max-h-[280px] overflow-y-auto">
                  {Object.entries(sectionsData).map(([secKey, sec]) => {
                    const secColor = secKey === 'meat' ? '#8d3e3c' : secKey === 'fish' ? '#00b5e2' : '#00c362';
                    const secIcon = secKey === 'meat' ? '🥩' : secKey === 'fish' ? '🐟' : '🥦';
                    return (
                      <div key={secKey}>
                        <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sticky top-0 bg-white/95 backdrop-blur-md" style={{ color: secColor }}>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: secColor }} />
                          {secIcon} {sec.name}
                        </div>
                        {sec.stalls.map((st, idx) => {
                          const isActive = secKey === activeSectionKey && idx === stallIndex;
                          return (
                            <button
                              key={`${secKey}-${st.id}`}
                              onClick={() => {
                                setActiveSectionKey(secKey);
                                setStallIndex(idx);
                                triggerSceneTransition(st, secKey);
                                setStallDropdownOpen(false);
                              }}
                              className="px-4 py-1.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer w-full"
                              style={{ backgroundColor: isActive ? secColor : 'transparent', color: isActive ? '#ffffff' : '#334155' }}
                            >
                              {st.name}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
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
                  className="text-[11px] font-black uppercase tracking-widest leading-none mb-1.5 flex items-center justify-center gap-1.5 mx-auto hover:opacity-85 active:scale-95 transition-all cursor-pointer"
                  style={{ color: activeSectColor }}
                >
                  <span>{activeSection.name}</span>
                  <ChevronDown size={11} style={{ color: activeSectColor }} />
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
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white/95 backdrop-blur-md border border-black/10 rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 min-w-[155px]">
                    {Object.values(sectionsData).map((sect) => {
                      const sectColor = sect.id === 'meat' ? '#8d3e3c' : sect.id === 'fish' ? '#00b5e2' : '#00c362';
                      return (
                        <button
                          key={sect.id}
                          onClick={() => {
                            selectSection(sect.id)
                            setSectionDropdownOpen(false)
                          }}
                          className={`px-3 py-2 rounded-xl text-left text-xs font-black transition-all cursor-pointer flex items-center gap-2.5 ${sect.id === activeSectionKey
                            ? 'bg-slate-100 text-slate-900 font-extrabold shadow-sm'
                            : 'text-slate-600 hover:bg-black/5 hover:text-slate-900'
                            }`}
                        >
                            style={{ backgroundColor: sectColor }}
                          />
                          <span>{sect.name}</span>
                        </button>
                      );
                    })}
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
        )}

        {/* STALL DETAILS DRAWER (Bottom Panel) */}
        {selectedStall && uiVisible && !detailsCollapsed && (
          <div className="absolute bottom-16 md:bottom-6 left-0 right-0 z-20 px-4">
            <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-black/10 shadow-2xl flex flex-col md:flex-row gap-5 relative overflow-hidden">
              {/* Collapse button */}
              <button
                onClick={() => setDetailsCollapsed(true)}
                className="absolute top-4 right-4 z-30 bg-slate-100 hover:bg-slate-200 rounded-full p-2 text-slate-600 hover:text-slate-900 transition-colors shadow-sm cursor-pointer"
                title="Hide details"
              >
                <ChevronDown size={18} />
              </button>
              {/* Background Ambient Glow */}
              <div className={`absolute -right-32 -bottom-32 w-64 h-64 rounded-full bg-gradient-to-br ${activeSection.bgTheme} blur-3xl opacity-40 pointer-events-none`} />

              {/* Main Info */}
              <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-black/10 text-slate-800">
                    {selectedStall.zone || 'Zone A'}
                  </span>

                  {/* Open Status Badge */}
                  {selectedStall.status === 'Occupied' ? (
                    <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                      Open Now
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-sm flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                      Available
                    </span>
                  )}
                  {dbLoading && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm animate-pulse">
                      Updating...
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-slate-900 truncate leading-tight flex items-center gap-2">
                  <Store size={18} className="text-[#1a5c2a]" />
                  {selectedStall.name}
                </h3>

                <p className="text-xs text-slate-600 mt-1 flex flex-col gap-0.5">
                  <span className="font-bold">Category: <span className="text-[#1a5c2a]">{selectedStall.productType || activeSection.name}</span></span>
                  <span className="text-[10px] text-slate-500 font-medium">Utilities: {selectedStall.utilities}</span>
                </p>

                {/* Utilities Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {/* Electricity Setup card */}
                  <div className="bg-slate-100/80 rounded-2xl p-3 flex items-start gap-2.5 border border-slate-200/50">
                    <Zap size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block tracking-wider uppercase leading-none mb-1">Electricity</span>
                      <span className="text-xs font-black text-slate-700 leading-tight block">
                        {selectedStall.electricitySetup || (parseInt(selectedStall.id) % 2 === 0 ? 'Sub-metered' : 'Shared Meter')}
                      </span>
                    </div>
                  </div>

                  {/* Water Access card */}
                  <div className="bg-slate-100/80 rounded-2xl p-3 flex items-start gap-2.5 border border-slate-200/50">
                    <Droplet size={16} className="text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block tracking-wider uppercase leading-none mb-1">Water Access</span>
                      <span className="text-xs font-black text-slate-700 leading-tight block">
                        {selectedStall.waterAccess || (parseInt(selectedStall.id) % 3 === 0 ? 'Near CR (Easy Access)' : 'Far from CR (Fetching Required)')}
                      </span>
                    </div>
                  </div>

                  {/* Contractor card */}
                  <div className="bg-slate-100/80 rounded-2xl p-3 flex items-start gap-2.5 border border-slate-200/50">
                    <User size={16} className="text-slate-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 block tracking-wider uppercase leading-none mb-1">Contractor</span>
                      <span className="text-xs font-black text-slate-700 leading-tight block">
                        {selectedStall.contractor || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Navigation Button Block */}
              <div className="w-full md:w-56 shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-black/10 pt-4 md:pt-0 md:pl-5 z-10">
                <div className="mb-2">
                  <p className="text-xl sm:text-2xl font-black text-[#e07b00] leading-none whitespace-nowrap">
                    {selectedStall.price}
                  </p>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">per month (negotiable)</p>
                </div>

                {/* Route Me Button */}
                <button
                  onClick={() => {
                    handleRouteMe(selectedStall);
                    setDetailsCollapsed(true);
                  }}
                  className="w-full mt-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
                >
                  <Zap size={14} className="animate-pulse shrink-0" />
                  <span>Route Me</span>
                </button>

                {/* Open AR View Button — hands off to the live AR + QR scanner */}
                <button
                  onClick={() => handleOpenArView(selectedStall)}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[#1a5c2a] hover:bg-[#15491f] text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
                >
                  <Camera size={14} className="shrink-0" />
                  <span>Open AR View</span>
                </button>
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

        {/* ── Logout Modal ── */}
        {showLogout && (
          <div className="logout-overlay" style={{ zIndex: 100 }} onClick={() => setShowLogout(false)}>
            <div className="logout-modal" onClick={e => e.stopPropagation()}>
              <div className="logout-modal-icon"><LogOut size={20} /></div>
              <h3 className="logout-modal-title">Log Out?</h3>
              <p className="logout-modal-msg">You'll be signed out of your renter session.</p>
              <div className="logout-modal-actions">
                <button className="logout-cancel-btn" onClick={() => setShowLogout(false)}>Cancel</button>
                <button className="logout-confirm-btn" id="confirm-logout" onClick={handleLogout}>Yes, Log Out</button>
              </div>
            </div>
          </div>
        )}
      </div>{/* end content area */}
    </div>
  )
}
