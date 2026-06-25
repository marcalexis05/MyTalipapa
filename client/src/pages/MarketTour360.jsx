import { useEffect, useRef, useState } from 'react'

import { useNavigate, useLocation } from 'react-router-dom'
import mapImage from '../images/map_aligned.jpg'
import logoImage from '../images/logo.png'
import { SVG_STALL_COORDS } from '../utils/coords_dict'
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
            const dist = Math.sqrt((sc.x - stepCoords.x)**2 + (sc.y - stepCoords.y)**2);
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
      const p2 = waypoints[i+1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distPixels = Math.hypot(dx, dy);
      const distMeters = Math.round(distPixels * METERS_PER_PIXEL); // shared scale (utils/marketGraph)
      
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = (angleRad * 180 / Math.PI + 450) % 360;
      
      let action = "Walk forward";
      if (i > 0) {
        const prevP = waypoints[i-1];
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
    let targetSec = activeSectionKey;
    Object.entries(sectionsData).forEach(([secKey, sec]) => {
      if (sec.stalls.some(s => s.id === targetStall.id)) {
        targetSec = secKey;
      }
    });
    
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
        const c = getRawCoordinates(st, secKey);
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
    triggerSceneTransition(getStallImagePath(closestStall.id, closestSec));
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
    let secKey = activeSectionKey;
    Object.entries(sectionsData).forEach(([key, sec]) => {
      if (sec.stalls.some(s => s.id === targetStall.id)) secKey = key;
    });
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

  // Recreate hotspots when sectionsData, showBadges, or destinationStall updates
  useEffect(() => {
    if (sceneRef.current && currentStall && window.THREE) {
      recreateHotspots(sceneRef.current, currentStall, window.THREE);
    }
  }, [sectionsData, showBadges, destinationStall]);

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
  const triggerSceneTransition = (texturePath, preserveTheta = false) => {
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
        return prev + 30
      })
    }, 50)

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

        materialRef.current.map = tex
        materialRef.current.needsUpdate = true

        // Recreate Hotspots in 3D Space
        recreateHotspots(sceneRef.current, stateRef.current.currentStall, THREE)

        // Reset camera viewing angle slightly to default
        spherical.current.phi = Math.PI / 2
        if (!preserveTheta) {
          spherical.current.theta = 0
        }
        if (cameraRef.current) {
          cameraRef.current.fov = 70;
          cameraRef.current.position.set(0, 0, 0.001);
          cameraRef.current.updateProjectionMatrix();
        }

        setLoaded(true)
        setTransitioning(false)
      },
      null,
      (err) => {
        console.error('Failed to load panorama', err)
        clearInterval(interval)
        setLoaded(true)
        setTransitioning(false)
      }
    )
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
  const getRawCoordinates = (stall, overrideCategory = null) => {
    const cleanNum = getCleanDbStallNumber(stall.id);
    const category = overrideCategory || stateRef.current.activeSectionKey;
    const zoneLetter = String(stall.zone || '').replace('Zone ', '').toUpperCase();
    const isBottomZone = ['E', 'F', 'G', 'H'].includes(zoneLetter);
    const yOffset = 0;

    let x = 1020;
    let y = 635 + yOffset;

    const rawKey = `${category}-${stall.id}`;
    const cleanKey = `${category}-${cleanNum}`;

    if (SVG_STALL_COORDS[rawKey]) {
      x = SVG_STALL_COORDS[rawKey].x;
      y = SVG_STALL_COORDS[rawKey].y + yOffset;
    } else if (SVG_STALL_COORDS[cleanKey]) {
      x = SVG_STALL_COORDS[cleanKey].x;
      y = SVG_STALL_COORDS[cleanKey].y + yOffset;
    }

    return { x, y };
  };

  const findNearestStallInDirection = (currentStall, currentCompassAngle) => {
    const currentSectionsData = stateRef.current.sectionsData;
    const currentActiveSectionKey = stateRef.current.activeSectionKey;
    const currentCoords = getRawCoordinates(currentStall, currentActiveSectionKey);
    let bestMatch = null;
    let minDistance = Infinity;

    const sectionKeys = ['meat', 'fish', 'veggies'];

    sectionKeys.forEach((secKey) => {
      const stalls = currentSectionsData[secKey].stalls;
      stalls.forEach((stall, idx) => {
        if (secKey === currentActiveSectionKey && stall.id === currentStall.id) return;

        const targetCoords = getRawCoordinates(stall, secKey);

        const dx = targetCoords.x - currentCoords.x;
        const dy = targetCoords.y - currentCoords.y;
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

  // Re-populate the 3D scene with relevant Hotspots
  const recreateHotspots = (scene, stall, THREE) => {
    // Clear old sprites
    hotspotMeshes.current.forEach((mesh) => scene.remove(mesh))
    hotspotMeshes.current = []
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

        // Reject clicks that were actually camera drags/swipes
        const dragDist = Math.sqrt((clientX - clickStartX) ** 2 + (clientY - clickStartY) ** 2)
        if (dragDist > 8) return

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
                
                // Dynamically query latest details from DB
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
          } else if (uData.type === 'go_forward' || uData.type === 'nearby_stall') {
            const targetInfo = uData.type === 'go_forward' ? uData.targetStallInfo : uData;
            if (targetInfo) {
              const { sectionKey, stall } = targetInfo;
              const targetStallId = stall.id;
              if (transitioning) return;

              setTransitioning(true);
              const startFov = camera.fov;
              const targetFov = Math.max(30, startFov - 25);
              const duration = 400; // 400ms zoom animation
              const startTime = performance.now();

              const animateForward = (time) => {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease in out
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
        } else {
          // "Click to Navigate" Feature
          const rx = raycaster.ray.direction.x;
          const rz = raycaster.ray.direction.z;
          const clickTheta = Math.atan2(rz, rx);

          let northOffset = 0;
          const currentStall = stateRef.current.currentStall;
          const activeSectionKey = stateRef.current.activeSectionKey;
          const upsideDownStalls = ['13(u)', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];
          const zoneAFishUpsideDown = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
          const zoneAMeatUpsideDown = ['12', '13'];

          const isZoneEMeat = activeSectionKey === 'meat' && upsideDownStalls.includes(currentStall.id);
          const isZoneAFish = activeSectionKey === 'fish' && zoneAFishUpsideDown.includes(currentStall.id);
          const isZoneAMeat = activeSectionKey === 'meat' && zoneAMeatUpsideDown.includes(currentStall.id);

          if (currentStall && currentStall.id === '1(u)') {
            northOffset = -90;
          } else if (currentStall && (isZoneEMeat || isZoneAFish || isZoneAMeat)) {
            northOffset = 180;
          }

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

      renderer.domElement.addEventListener('click', onPointerDown)

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

          if (hit.object.userData.type === 'go_forward') {
            arrowIsHovered = true;
            setCursor('pointer')
            setHoveredHotspot(null)
            return
          }

          let dynamicLabel = hit.object.userData.label;
          if (hit.object.userData.type === 'next' || hit.object.userData.type === 'prev') {
            const cameraDirection = new THREE.Vector3()
            cameraRef.current.getWorldDirection(cameraDirection)
            const arrowDirection = new THREE.Vector3().copy(hit.object.position).normalize()
            const dot = cameraDirection.dot(arrowDirection)
            dynamicLabel = dot > 0 ? 'Forward' : 'Backward'
          } else if (hit.object.userData.type === 'go_forward') {
            const target = hit.object.userData.targetStallInfo;
            if (target) {
              if (stateRef.current.currentStall.id === '1(u)' && target.stall.id === '13(u)') {
                dynamicLabel = `Go Left to ${target.stall.name || 'Stall ' + target.stall.id}`;
              } else if (stateRef.current.currentStall.id === '24' && target.stall.id === '12(u)') {
                dynamicLabel = `Go Left to ${target.stall.name || 'Stall ' + target.stall.id}`;
              } else if (stateRef.current.currentStall.id === '24' && target.sectionKey === 'veggies' && target.stall.id === '12') {
                dynamicLabel = `Go Right to ${target.stall.name || 'Stall ' + target.stall.id}`;
              } else if (stateRef.current.currentStall.id === '12(u)' && target.stall.id === '24') {
                dynamicLabel = `Go Right to ${target.stall.name || 'Stall ' + target.stall.id}`;
              } else if (stateRef.current.currentStall.id === '13(u)' && target.stall.id === '1(u)') {
                dynamicLabel = `Go Right to ${target.stall.name || 'Stall ' + target.stall.id}`;
              } else {
                dynamicLabel = `Forward to ${target.stall.name || 'Stall ' + target.stall.id}`;
              }
            }
          } else if (hit.object.userData.type === 'nearby_stall') {
            dynamicLabel = `Visit ${hit.object.userData.label}`;
          } else if (hit.object.userData.type === 'info_button') {
            dynamicLabel = `View Details for ${hit.object.userData.stall.name}`;
          }

          setHoveredHotspot({
            ...hit.object.userData,
            dynamicLabel
          })
          setCursor('pointer')
        } else {
          setHoveredHotspot(null)
          setCursor('grab')
          arrowIsHovered = false;
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

        let northOffset = 0;
        const upsideDownStalls = ['13(u)', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];
        const zoneAFishUpsideDown = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
        const zoneAMeatUpsideDown = ['12', '13'];

        const isZoneEMeat = stateRef.current.activeSectionKey === 'meat' && upsideDownStalls.includes(stateRef.current.currentStall.id);
        const isZoneAFish = stateRef.current.activeSectionKey === 'fish' && zoneAFishUpsideDown.includes(stateRef.current.currentStall.id);
        const isZoneAMeat = stateRef.current.activeSectionKey === 'meat' && zoneAMeatUpsideDown.includes(stateRef.current.currentStall.id);

        if (stateRef.current.currentStall && stateRef.current.currentStall.id === '1(u)') {
          northOffset = -90; // Calibrate left turn to point to Stall #13
        } else if (stateRef.current.currentStall && (isZoneEMeat || isZoneAFish || isZoneAMeat)) {
          northOffset = 180; // Correct cone to align with the actual camera orientation for the entire row
        }

        // Sync compass rotation (0 deg = North)
        const deg = Math.round((theta * 180) / Math.PI) + northOffset;
        const compassDeg = ((deg % 360) + 360) % 360; // ensure positive

        // Optimize: Only recalculate heavy math and React state if the degree actually changed
        if (stateRef.current.lastCompassDeg !== compassDeg) {
          stateRef.current.lastCompassDeg = compassDeg;
          setCompassAngle(compassDeg)

          // Find nearest stall in this direction
          const currentStall = stateRef.current.currentStall;
          const nearestStallInfo = findNearestStallInDirection(currentStall, compassDeg);

          // Update Google Street View-style ground arrow pool
          const arrowMeshes = hotspotMeshes.current.filter(m => m.userData.type === 'go_forward');

          // Collect all navigable nearby stalls in both forward and backward directions
          const currentSectData = stateRef.current.sectionsData;
          const curSectionKey = stateRef.current.activeSectionKey;
          const curCoords = getRawCoordinates(currentStall, curSectionKey);
          
          const forwards = [];
          const backwards = [];

          ['meat', 'fish', 'veggies'].forEach((secKey) => {
            const stalls = currentSectData[secKey].stalls;
            stalls.forEach((s, idx) => {
              if (secKey === curSectionKey && s.id === currentStall.id) return;
              const tCoords = getRawCoordinates(s, secKey);
              const ddx = tCoords.x - curCoords.x;
              const ddy = tCoords.y - curCoords.y;
              const dist = Math.sqrt(ddx * ddx + ddy * ddy);
              
              // Only within grid walking range
              if (dist < 10 || dist > 420) return;

              const mapAngleRad = Math.atan2(ddy, ddx);
              const mapAngleDeg = (mapAngleRad * 180) / Math.PI;
              const tCompassAngle = (mapAngleDeg + 450) % 360;

              // Angle difference relative to forward look angle (compassDeg)
              let diffF = Math.abs(tCompassAngle - compassDeg);
              if (diffF > 180) diffF = 360 - diffF;

              // Angle difference relative to backward look angle (compassDeg + 180)
              let diffB = Math.abs(tCompassAngle - ((compassDeg + 180) % 360));
              if (diffB > 180) diffB = 360 - diffB;

              if (diffF <= 75) {
                forwards.push({ secKey, stall: s, idx, dist, tCompassAngle, diff: diffF });
              } else if (diffB <= 75) {
                backwards.push({ secKey, stall: s, idx, dist, tCompassAngle, diff: diffB });
              }
            });
          });

          // Sort by deviation from center of look/back cones
          forwards.sort((a, b) => a.diff - b.diff);
          backwards.sort((a, b) => a.diff - b.diff);

          stateRef.current.bestForward = forwards[0] || null;
          stateRef.current.bestBackward = backwards[0] || null;

          arrowMeshes.forEach((arrowMesh, i) => {
            const targetStall = i === 0 ? stateRef.current.bestForward : stateRef.current.bestBackward;

            if (targetStall) {
              const { secKey, stall: ns, idx, tCompassAngle } = targetStall;
              arrowMesh.userData.targetStallInfo = { sectionKey: secKey, stall: ns, index: idx, tCompassAngle };

              // Preload target image
              const targetImagePath = getStallImagePath(ns.id, secKey);
              if (!window.__preloadedPaths) window.__preloadedPaths = new Set();
              if (!window.__preloadedPaths.has(targetImagePath)) {
                window.__preloadedPaths.add(targetImagePath);
                const img = new Image();
                img.src = targetImagePath;
              }
            } else {
              arrowMesh.userData.targetStallInfo = null;
            }
          });
        }

        // DYNAMIC POSITION & LIFT: Update chevron tilt and height on every camera update
        const arrowMeshes = hotspotMeshes.current.filter(m => m.userData.type === 'go_forward');
        const cameraPitchFactor = Math.max(0, Math.PI / 2 - spherical.current.phi); // positive when looking up
        const dynamicY = -90 + cameraPitchFactor * 25;
        const tiltAngle = Math.max(0, (Math.PI - spherical.current.phi) * 0.3);

        arrowMeshes.forEach((arrowMesh) => {
          const target = arrowMesh.userData.targetStallInfo;
          if (target && target.tCompassAngle !== undefined) {
            const arrowThetaRad = ((target.tCompassAngle - northOffset) * Math.PI) / 180;
            const placeDist = 125;
            const ax = Math.cos(arrowThetaRad) * placeDist;
            const az = Math.sin(arrowThetaRad) * placeDist;
            
            arrowMesh.position.set(ax, dynamicY, az);
            arrowMesh.scale.set(1.0, 1.0, 1.0);
            arrowMesh.rotation.set(-Math.PI / 2 + tiltAngle, 0, arrowThetaRad - Math.PI / 2);
          }
        });
      }
      updateCamera()

      // Mutable hover state for arrow — shared by onPointerMove and animate
      let arrowIsHovered = false;

      // Animation Loop
      function animate() {
        frameRef.current = requestAnimationFrame(animate)

        if (autoRotate && !isDragging.current) {
          spherical.current.theta += 0.0018
          updateCamera()
        }

        // Hover-driven opacity: fade in when hovered, stay at base 0.55 when visible, invisible when no target
        const time = Date.now() * 0.004;
        hotspotMeshes.current.forEach(m => {
          if (m.userData.type === 'go_forward') {
            const hasTarget = !!m.userData.targetStallInfo;
            if (hasTarget) {
              m.visible = true;
              const targetOpacity = arrowIsHovered ? 0.95 : 0.55;
              m.material.opacity += (targetOpacity - m.material.opacity) * 0.15;
            } else {
              m.material.opacity = Math.max(0, m.material.opacity - 0.08);
              if (m.material.opacity <= 0) {
                m.visible = false;
              }
            }
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
              <path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/>
              <path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/>
              <path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/>
            </svg>
          </div>
          {!sidebarCollapsed && <span className="font-extrabold text-gray-900 text-base tracking-tight">MyTalipapa</span>}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {[
            { id: 'home',      label: 'Home',            icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,   action: () => { const token = localStorage.getItem('authToken'); navigate(token ? '/renter/dashboard' : '/'); } },
            { id: 'navigate',  label: '360° Tour',       icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,             action: null },
            { id: 'ar-finder', label: 'AR Stall Finder', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, action: () => handleOpenArView(currentStall) },
            { id: 'stalls',    label: 'Stalls',          icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 3h18v4H3zM3 10h18M3 17h18M3 14h18"/></svg>,            action: () => navigate('/renter/stalls') },
            ...(isLoggedIn ? [
              { id: 'applications', label: 'Applications', icon: <FileText size={18} />, action: () => navigate('/renter/applications') },
              { id: 'profile',      label: 'Profile',      icon: <User size={18} />,     action: () => navigate('/renter/profile') }
            ] : [])
          ].map(({ id, label, icon, action }) => {
            const isActive = id === 'navigate';
            return (
              <button
                key={id}
                onClick={action || undefined}
                disabled={!action}
                title={sidebarCollapsed ? label : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
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
        className={`absolute inset-0 bg-black z-10 transition-all duration-300 pointer-events-none flex flex-col items-center justify-center ${transitioning ? 'opacity-100' : 'opacity-0'
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
          {hoveredHotspot.type === 'nearby_stall' ? '' : (hoveredHotspot.dynamicLabel && hoveredHotspot.dynamicLabel.startsWith('Go Left') ? '←' : hoveredHotspot.dynamicLabel && hoveredHotspot.dynamicLabel.startsWith('Go Right') ? '→' : (hoveredHotspot.type === 'go_forward' || (hoveredHotspot.dynamicLabel && hoveredHotspot.dynamicLabel.startsWith('Forward'))) ? '↑' : hoveredHotspot.dynamicLabel === 'Backward' ? '↓' : 'i')}{hoveredHotspot.type === 'nearby_stall' ? '' : ' '}{hoveredHotspot.dynamicLabel || hoveredHotspot.label}
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
                navigate(location.pathname.startsWith('/renter') ? '/renter/stalls' : '/');
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
      {/* MAP OVERLAY (Mini or Expanded) */}
      {/* 3D Isometric Mini Map (Tilted at bottom-left) */}
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
          className={`absolute transition-all duration-150 ease-out z-40 flex flex-col ${
            isMapExpanded
              ? 'bottom-[12.5vh] left-[4vw] sm:left-[calc(50%-28rem)] w-[92vw] h-[75vh] max-w-4xl p-4 sm:p-5 bg-slate-950/15 backdrop-blur-md overflow-hidden rounded-3xl border border-white/10'
              : 'bottom-40 right-3 sm:bottom-6 sm:left-6 sm:right-auto w-28 h-28 sm:w-48 sm:h-48 md:w-56 md:h-56 overflow-hidden cursor-pointer bg-slate-950/85 backdrop-blur-md hover:scale-105 rounded-full border-[3px] sm:border-4 border-[#e8621a]'
          }`}
          style={{
            boxShadow: isMapExpanded
              ? '0 25px 50px rgba(0, 0, 0, 0.5)'
              : '-4px 8px 24px rgba(0, 0, 0, 0.45), 0 0 20px rgba(232, 98, 26, 0.35)'
          }}
        >
          {/* no label on minimized map */}
          {/* Collapse/Minimize Button or Route Finder Header */}
          {isMapExpanded ? (
            <div className="flex items-center justify-between py-2 shrink-0 z-10 mb-4 px-1" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 overflow-x-auto pr-2">
                <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">Route Finder</span>
                
                {/* FROM selector */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#22c55e] border-2 border-white shadow-sm shrink-0" />
                  <select
                    className="text-[11px] font-bold text-white bg-slate-900 border border-white/20 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={routeFrom ? `${routeFrom.secKey}::${routeFrom.stallId}` : ''}
                    onChange={e => {
                      if (!e.target.value) { setRouteFrom(null); return; }
                      const [secKey, stallId] = e.target.value.split('::');
                      setRouteFrom({ secKey, stallId });
                      const targetSec = sectionsData[secKey];
                      if (targetSec) {
                        const idx = targetSec.stalls.findIndex(s => s.id === stallId);
                        if (idx !== -1 && !transitioning) {
                          setActiveSectionKey(secKey);
                          setStallIndex(idx);
                          triggerSceneTransition(getStallImagePath(stallId, secKey));
                        }
                      }
                    }}
                  >
                    <option value="">From stall…</option>
                    {Object.entries(sectionsData).map(([secKey, sec]) =>
                      sec.stalls.map(st => (
                        <option key={`f-${secKey}-${st.id}`} value={`${secKey}::${st.id}`} className="bg-slate-900 text-white">
                          [{secKey === 'meat' ? '🥩' : secKey === 'fish' ? '🐟' : '🥦'}] {st.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <span className="text-slate-500 font-black shrink-0">→</span>

                {/* TO selector */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#ef4444] border-2 border-white shadow-sm shrink-0" />
                  <select
                    className="text-[11px] font-bold text-white bg-slate-900 border border-white/20 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                    value={routeTo ? `${routeTo.secKey}::${routeTo.stallId}` : ''}
                    onChange={e => {
                      if (!e.target.value) {
                        setRouteTo(null);
                        setDestinationStall(null);
                        setRouteInstructions([]);
                        setArWaypoints([]);
                        setIsWalkingSimulation(false);
                        return;
                      }
                      const [secKey, stallId] = e.target.value.split('::');
                      setRouteTo({ secKey, stallId });
                      const targetStall = sectionsData[secKey]?.stalls.find(s => s.id === stallId);
                      if (targetStall) {
                        handleRouteMe(targetStall);
                      }
                    }}
                  >
                    <option value="">To stall…</option>
                    {Object.entries(sectionsData).map(([secKey, sec]) =>
                      sec.stalls.map(st => (
                        <option key={`t-${secKey}-${st.id}`} value={`${secKey}::${st.id}`} className="bg-slate-900 text-white">
                          [{secKey === 'meat' ? '🥩' : secKey === 'fish' ? '🐟' : '🥦'}] {st.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

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
                    className="text-[10px] font-black text-slate-400 hover:text-red-400 transition-colors shrink-0 px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer ml-1"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

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
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0 ml-4 shadow-lg border border-white/5"
                title="Collapse Map"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          ) : null}

          {/* Map Body Content */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden" onClick={isMapExpanded ? (e) => e.stopPropagation() : undefined}>
            {(() => {
              const mapCoords = getRawCoordinates(currentStall);
              
              // Resolve route coords
              let fromCoords = null;
              let toCoords = null;
              
              if (destinationStall) {
                fromCoords = getRawCoordinates(currentStall, activeSectionKey);
                let targetSec = activeSectionKey;
                Object.entries(sectionsData).forEach(([secKey, sec]) => {
                  if (sec.stalls.some(s => s.id === destinationStall.id)) {
                    targetSec = secKey;
                  }
                });
                toCoords = getRawCoordinates(destinationStall, targetSec);
              } else {
                const fromStall = routeFrom ? sectionsData[routeFrom.secKey]?.stalls.find(s => s.id === routeFrom.stallId) : null;
                const toStall = routeTo ? sectionsData[routeTo.secKey]?.stalls.find(s => s.id === routeTo.stallId) : null;
                fromCoords = fromStall ? getRawCoordinates(fromStall, routeFrom.secKey) : null;
                toCoords = toStall ? getRawCoordinates(toStall, routeTo.secKey) : null;
              }

              // Determine viewBox parameters
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
                  style={{
                    filter: isMapExpanded ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.75))' : 'none'
                  }}
                >
                  <svg
                    viewBox={viewBoxStr}
                    preserveAspectRatio="xMidYMid meet"
                    className="max-w-full max-h-full transition-all duration-700"
                    style={{ pointerEvents: isMapExpanded ? 'auto' : 'none', cursor: isMapExpanded ? 'pointer' : 'default' }}
                    onClick={isMapExpanded ? handleMapTeleport : undefined}
                  >
                    <defs>
                      <linearGradient id="pinStemGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
                      </linearGradient>
                      <linearGradient id="startPinStemGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
                      </linearGradient>
                      <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00f2fe" />
                        <stop offset="100%" stopColor="#4facfe" />
                      </linearGradient>
                    </defs>

                    <image href={mapImage} x="0" y="0" width="2305" height="1824" preserveAspectRatio="none" style={{ pointerEvents: 'none', opacity: 0.75 }} />

                    {/* Google Maps–style corridor route */}
                    {fromCoords && toCoords && (() => {
                      const waypoints = findMarketRoute(fromCoords, toCoords);
                      // Draw the full path (including the short exit/entry segments)
                      // so the line connects the start pin → aisles → end pin with
                      // no gaps. Pins are layered on top of the endpoints.
                      const pathWaypoints = waypoints;
                      const pts = pathWaypoints.map(p => `${p.x},${p.y}`).join(' ');
                      
                      // Animated directional arrows overlay
                      const arrows = [];
                      if (pathWaypoints.length >= 2) {
                        for (let i = 0; i < pathWaypoints.length - 1; i++) {
                          const p1 = pathWaypoints[i];
                          const p2 = pathWaypoints[i+1];
                          const dx = p2.x - p1.x;
                          const dy = p2.y - p1.y;
                          const dist = Math.hypot(dx, dy);
                          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                          
                          // Place arrows every 120 pixels along each segment
                          const step = 120;
                          for (let d = step; d < dist; d += step) {
                            const ratio = d / dist;
                            arrows.push({
                              mx: p1.x + dx * ratio,
                              my: p1.y + dy * ratio,
                              angle
                            });
                          }
                        }
                      }

                      return (
                        <g>
                          {pathWaypoints.length >= 2 && (
                            <>
                              <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth={isMapExpanded ? "26" : "18"} strokeLinecap="round" strokeLinejoin="round" opacity="0.35" filter="url(#routeGlow)" />
                              <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth={isMapExpanded ? "18" : "12"} strokeLinecap="round" strokeLinejoin="round" />
                              <polyline points={pts} fill="none" stroke="url(#routeGradient)" strokeWidth={isMapExpanded ? "10" : "6"} strokeLinecap="round" strokeLinejoin="round" />
                            </>
                          )}

                          {/* Render arrows */}
                          {arrows.map((a, i) => (
                            <g key={i} transform={`translate(${a.mx},${a.my}) rotate(${a.angle})`}>
                              <polygon points="-14,-9 0,0 -14,9" fill="#ffffff" opacity="0.95" />
                              <polygon points="-12,-7 0,0 -12,7" fill="#00f2fe" opacity="0.9" />
                            </g>
                          ))}

                          {/* START marker — green 3D vertical pin */}
                          <g>
                            <ellipse cx={fromCoords.x} cy={fromCoords.y} rx={isMapExpanded ? "20" : "12"} ry={isMapExpanded ? "10" : "6"} fill="rgba(0,0,0,0.25)" />
                            <line x1={fromCoords.x} y1={fromCoords.y} x2={fromCoords.x} y2={fromCoords.y - (isMapExpanded ? 100 : 60)} stroke="url(#startPinStemGradient)" strokeWidth={isMapExpanded ? 6 : 4} />
                            <circle cx={fromCoords.x} cy={fromCoords.y - (isMapExpanded ? 100 : 60)} r={isMapExpanded ? 20 : 12} fill="#22c55e" stroke="#ffffff" strokeWidth={isMapExpanded ? 5 : 3.5} />
                            <text x={fromCoords.x} y={fromCoords.y - (isMapExpanded ? 92 : 55)} textAnchor="middle" fill="#fff" fontSize={isMapExpanded ? 20 : 12} fontWeight="900" fontFamily="system-ui">A</text>
                          </g>

                          {/* END marker — red 3D vertical pin */}
                          <g>
                            <ellipse cx={toCoords.x} cy={toCoords.y} rx={isMapExpanded ? "20" : "12"} ry={isMapExpanded ? "10" : "6"} fill="rgba(0,0,0,0.25)" />
                            <line x1={toCoords.x} y1={toCoords.y} x2={toCoords.x} y2={toCoords.y - (isMapExpanded ? 100 : 60)} stroke="url(#pinStemGradient)" strokeWidth={isMapExpanded ? 6 : 4} />
                            <circle cx={toCoords.x} cy={toCoords.y - (isMapExpanded ? 100 : 60)} r={isMapExpanded ? 20 : 12} fill="#ef4444" stroke="#ffffff" strokeWidth={isMapExpanded ? 5 : 3.5} className="animate-pulse" />
                            <text x={toCoords.x} y={toCoords.y - (isMapExpanded ? 92 : 55)} textAnchor="middle" fill="#fff" fontSize={isMapExpanded ? 20 : 12} fontWeight="900" fontFamily="system-ui">B</text>
                          </g>
                        </g>
                      );
                    })()}

                    {/* Clickable Stall Hotspots on Map (only when expanded) */}
                    {isMapExpanded && Object.entries(sectionsData).map(([secKey, sec]) => {
                      return sec.stalls.map((st, idx) => {
                        const coords = getRawCoordinates(st, secKey);
                        if (coords.x === 1020 && (coords.y === 635 || coords.y === 885)) return null;
                        const isCurrent = secKey === activeSectionKey && idx === stallIndex;
                        const isFrom = routeFrom && routeFrom.secKey === secKey && routeFrom.stallId === st.id;
                        const isTo = routeTo && routeTo.secKey === secKey && routeTo.stallId === st.id;
                        return (
                          <circle
                            key={`${secKey}-${st.id}`}
                            cx={coords.x}
                            cy={coords.y}
                            r={isFrom || isTo ? 30 : 24}
                            fill={isFrom ? 'rgba(34,197,94,0.35)' : isTo ? 'rgba(239,68,68,0.35)' : 'transparent'}
                            stroke={isFrom ? '#22c55e' : isTo ? '#ef4444' : 'transparent'}
                            strokeWidth={isFrom || isTo ? 6 : 0}
                            style={{ pointerEvents: 'auto', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                            title={`Go to ${st.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (transitioning) return;
                              // Tap-to-navigate: jump the panorama to the clicked stall,
                              // then collapse the map so the user lands in the 360° view.
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
                          />
                        );
                      });
                    })}

                    {/* View Cone and Pin positioned accurately on the coordinate */}
                    <g transform={`translate(${mapCoords.x}, ${mapCoords.y})`}>
                      {/* View Cone */}
                      <path d="M0 0 L-100 -200 A200 200 0 0 1 100 -200 Z" fill="rgba(232, 98, 26, 0.35)" transform={`rotate(${compassAngle})`} style={{ pointerEvents: 'none' }} />
                      
                      {/* Base Shadow */}
                      <ellipse cx="0" cy="0" rx="20" ry="10" fill="rgba(0,0,0,0.2)" />
                      
                      {/* Pin Circle */}
                      <circle r="22" fill="#3b82f6" stroke="#ffffff" strokeWidth="4" className="animate-pulse" />
                      <circle r="7" fill="#ffffff" />
                    </g>

                    {/* MyTalipapa Logo — placed directly over diamond icon */}
                    <image
                      href={logoImage}
                      x="20" y="1604"
                      width="200" height="200"
                      preserveAspectRatio="xMidYMid meet"
                      style={{ pointerEvents: 'none', opacity: 0.6 }}
                    />
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>
      )}



      {/* BOTTOM NAV BAR — mirrors RenterLayout bottom tab bar */}
      {uiVisible && (
        <nav className="md:hidden absolute bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-black/10 flex justify-around items-center h-14 px-1 shadow-lg">
          {[
            { id: 'home',      label: 'Home',         icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, action: () => { const token = localStorage.getItem('authToken'); navigate(token ? '/renter/dashboard' : '/'); } },
            { id: 'navigate',  label: '360° Tour',    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>, action: null },
            { id: 'ar-finder', label: 'AR Stall Finder', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, action: () => handleOpenArView(currentStall) },
            { id: 'stalls',    label: 'Stalls',       icon: <Store size={16} />, action: () => navigate('/renter/stalls') },
            ...(isLoggedIn ? [
              { id: 'applications', label: 'Applications', icon: <FileText size={16} />, action: () => navigate('/renter/applications') },
              { id: 'profile',      label: 'Profile',      icon: <User size={16} />,     action: () => navigate('/renter/profile') }
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
                    {/* Section Header */}
                    <div
                      className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sticky top-0 bg-white/95 backdrop-blur-md"
                      style={{ color: secColor }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: secColor }}
                      />
                      {secIcon} {sec.name}
                    </div>
                    {/* Stalls under this section */}
                    {sec.stalls.map((st, idx) => {
                      const isActive = secKey === activeSectionKey && idx === stallIndex;
                      return (
                        <button
                          key={`${secKey}-${st.id}`}
                          onClick={() => {
                            setActiveSectionKey(secKey);
                            setStallIndex(idx);
                            triggerSceneTransition(getStallImagePath(st.id, secKey));
                            setStallDropdownOpen(false);
                          }}
                          className="px-4 py-1.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer w-full"
                          style={{
                            backgroundColor: isActive ? secColor : 'transparent',
                            color: isActive ? '#ffffff' : '#334155'
                          }}
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
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm shrink-0" 
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
