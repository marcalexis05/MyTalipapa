import { useEffect, useRef, useState } from 'react'

import { useNavigate, useLocation } from 'react-router-dom'
import mapImage from '../images/map.png'
import { SVG_STALL_COORDS } from '../utils/coords_dict'
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
  Droplet
} from 'lucide-react'

// ─── Market Pathway Graph for Route Finding ─────────────────────────────────
// Vertical aisle X coordinates (the corridors between stall columns)
const AISLES_X = [35, 265, 580, 840, 1050, 1300, 1570, 1845, 2120];

// Horizontal corridor Y coordinates (the pathways between rows of stalls)
// Top hallway, middle hallway, bottom hallway
const CORRIDORS_Y = [150, 870, 1420];
const ENTRANCE_COORDS = { x: 1050, y: 1550 };


// Find nearest aisle X for a given stall X
const getNearestAisleX = (x) => {
  let best = AISLES_X[0], bestD = Math.abs(x - AISLES_X[0]);
  for (let i = 1; i < AISLES_X.length; i++) {
    const d = Math.abs(x - AISLES_X[i]);
    if (d < bestD) { bestD = d; best = AISLES_X[i]; }
  }
  return best;
};

// Find nearest corridor Y for a given stall Y
const getNearestCorridorY = (y) => {
  let best = CORRIDORS_Y[0], bestD = Math.abs(y - CORRIDORS_Y[0]);
  for (let i = 1; i < CORRIDORS_Y.length; i++) {
    const d = Math.abs(y - CORRIDORS_Y[i]);
    if (d < bestD) { bestD = d; best = CORRIDORS_Y[i]; }
  }
  return best;
};

// Dijkstra's shortest path through the corridor graph
const findMarketRoute = (fromCoords, toCoords) => {
  const startAisleX = getNearestAisleX(fromCoords.x);
  const endAisleX = getNearestAisleX(toCoords.x);
  const startCorridorY = getNearestCorridorY(fromCoords.y);
  const endCorridorY = getNearestCorridorY(toCoords.y);

  // The stall approach points — these are on the pathway, not inside stall blocks
  const startEntry = { x: startAisleX, y: startCorridorY };
  const endEntry   = { x: endAisleX,   y: endCorridorY   };

  // Build corridor graph nodes
  const nodes = [];
  AISLES_X.forEach(x => {
    nodes.push({ id: `top-${x}`, x, y: 150  });
    nodes.push({ id: `mid-${x}`, x, y: 870  });
    nodes.push({ id: `bot-${x}`, x, y: 1420 });
  });

  // Add dynamic entry/exit nodes
  const startId = 'start-entry';
  const endId   = 'end-entry';
  nodes.push({ id: startId, ...startEntry });
  nodes.push({ id: endId,   ...endEntry   });

  // Build adjacency list
  const adj = {};
  nodes.forEach(n => adj[n.id] = []);

  const addEdge = (uId, vId) => {
    const u = nodes.find(n => n.id === uId);
    const v = nodes.find(n => n.id === vId);
    if (!u || !v) return;
    const d = Math.hypot(u.x - v.x, u.y - v.y);
    adj[uId].push({ to: vId, weight: d });
    adj[vId].push({ to: uId, weight: d });
  };

  // Horizontal corridor edges (TOP Y=150)
  for (let i = 0; i < AISLES_X.length - 1; i++) {
    addEdge(`top-${AISLES_X[i]}`, `top-${AISLES_X[i+1]}`);
  }
  // Horizontal corridor edges (MID Y=870)
  for (let i = 0; i < AISLES_X.length - 1; i++) {
    addEdge(`mid-${AISLES_X[i]}`, `mid-${AISLES_X[i+1]}`);
  }
  // Horizontal corridor edges (BOTTOM Y=1420)
  for (let i = 0; i < AISLES_X.length - 1; i++) {
    addEdge(`bot-${AISLES_X[i]}`, `bot-${AISLES_X[i+1]}`);
  }

  // Vertical aisle edges (connecting corridor intersections)
  AISLES_X.forEach(x => {
    addEdge(`top-${x}`, `mid-${x}`);
    addEdge(`mid-${x}`, `bot-${x}`);
  });

  // Connect start/end entries to their nearest corridor graph nodes
  const connectEntry = (entryId, entryPt) => {
    const x = entryPt.x;
    const y = entryPt.y;
    // Find the two corridor nodes on the same aisle (same X) that bracket this Y
    const aisleNodes = nodes.filter(n => n.x === x && n.id !== entryId);
    aisleNodes.sort((a, b) => a.y - b.y);
    let connected = false;
    for (let i = 0; i < aisleNodes.length - 1; i++) {
      if (y >= aisleNodes[i].y && y <= aisleNodes[i+1].y) {
        addEdge(entryId, aisleNodes[i].id);
        addEdge(entryId, aisleNodes[i+1].id);
        connected = true;
        break;
      }
    }
    if (!connected) {
      // Snap to nearest aisle node
      const nearest = aisleNodes.reduce((prev, curr) =>
        Math.abs(curr.y - y) < Math.abs(prev.y - y) ? curr : prev
      );
      addEdge(entryId, nearest.id);
    }
  };

  connectEntry(startId, startEntry);
  connectEntry(endId, endEntry);

  // Dijkstra
  const dist = {};
  const prev = {};
  const visited = new Set();
  nodes.forEach(n => dist[n.id] = Infinity);
  dist[startId] = 0;

  const pq = [startId];
  while (pq.length > 0) {
    pq.sort((a, b) => dist[a] - dist[b]);
    const u = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === endId) break;
    (adj[u] || []).forEach(edge => {
      if (visited.has(edge.to)) return;
      const alt = dist[u] + edge.weight;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = u;
        pq.push(edge.to);
      }
    });
  }

  // Reconstruct path through graph
  const pathIds = [];
  let curr = endId;
  while (curr) { pathIds.unshift(curr); curr = prev[curr]; }

  if (pathIds[0] !== startId) {
    // Fallback: L-shaped corridor path
    return [fromCoords, { x: fromCoords.x, y: startCorridorY }, { x: toCoords.x, y: startCorridorY }, toCoords];
  }

  const graphWaypoints = pathIds.map(id => {
    const n = nodes.find(nd => nd.id === id);
    return { x: n.x, y: n.y };
  });

  // Remove collinear middle points
  const simplified = [graphWaypoints[0]];
  for (let i = 1; i < graphWaypoints.length - 1; i++) {
    const p = graphWaypoints[i - 1], c = graphWaypoints[i], nx = graphWaypoints[i + 1];
    const cross = (c.x - p.x) * (nx.y - p.y) - (c.y - p.y) * (nx.x - p.x);
    if (Math.abs(cross) > 1) simplified.push(c);
  }
  if (graphWaypoints.length > 1) simplified.push(graphWaypoints[graphWaypoints.length - 1]);

  // Build the full corridor-safe path:
  // fromCoords → perpendicular to corridor → graph path → perpendicular to dest
  const fullPath = [
    fromCoords,
    // Move perpendicular from stall to its nearest corridor Y (along stall column X)
    { x: fromCoords.x, y: startCorridorY },
    ...simplified,
    // Move perpendicular from corridor to destination stall (along stall column X)
    { x: toCoords.x, y: endCorridorY },
    toCoords
  ];

  // Remove exact duplicates
  const deduped = [fullPath[0]];
  for (let i = 1; i < fullPath.length; i++) {
    if (fullPath[i].x !== deduped[deduped.length-1].x || fullPath[i].y !== deduped[deduped.length-1].y) {
      deduped.push(fullPath[i]);
    }
  }

  // Final collinear simplification
  const final = [deduped[0]];
  for (let i = 1; i < deduped.length - 1; i++) {
    const p = deduped[i - 1], c = deduped[i], nx = deduped[i + 1];
    const cross = (c.x - p.x) * (nx.y - p.y) - (c.y - p.y) * (nx.x - p.x);
    if (Math.abs(cross) > 1) final.push(c);
  }
  if (deduped.length > 1) final.push(deduped[deduped.length - 1]);

  return final;
};
// ────────────────────────────────────────────────────────────────────────────

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
  const [privacyMode, setPrivacyMode] = useState(true)
  const [showBadges, setShowBadges] = useState(true)
  const [stallDropdownOpen, setStallDropdownOpen] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  // Route finder state for the expanded map
  const [routeFrom, setRouteFrom] = useState(null) // { secKey, stallId }
  const [routeTo, setRouteTo] = useState(null)     // { secKey, stallId }
  const [routePickStep, setRoutePickStep] = useState(null) // 'from' | 'to' | null

  // AR Navigation State
  const [navigationMode, setNavigationMode] = useState('360') // '360' or 'ar'
  const [destinationStall, setDestinationStall] = useState(null)
  const [arWaypoints, setArWaypoints] = useState([])
  const [routeInstructions, setRouteInstructions] = useState([])
  const [arStepIndex, setArStepIndex] = useState(0)
  const [isWalkingSimulation, setIsWalkingSimulation] = useState(false)
  const [arStream, setArStream] = useState(null)
  const [arCameraError, setArCameraError] = useState(true)
  const [dbLoading, setDbLoading] = useState(false)
  const videoRef = useRef(null)

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        setArStream(stream);
        setArCameraError(false);
      } else {
        setArCameraError(true);
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable, using simulated AR camera mode.", err);
      setArCameraError(true);
    }
  };

  const stopCamera = () => {
    if (arStream) {
      arStream.getTracks().forEach(track => track.stop());
      setArStream(null);
    }
  };

  // Sync Route Finder 'FROM' selector with the current stall position
  useEffect(() => {
    if (currentStall) {
      setRouteFrom({ secKey: activeSectionKey, stallId: currentStall.id });
    }
  }, [currentStall, activeSectionKey]);

  useEffect(() => {
    return () => {
      if (arStream) {
        arStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [arStream]);

  // Bind live camera stream to video element when active
  useEffect(() => {
    if (videoRef.current) {
      if (arStream) {
        videoRef.current.srcObject = arStream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [arStream, arCameraError, navigationMode]);

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
    if (navigationMode === '360' && routeInstructions.length > 0 && routeInstructions[arStepIndex]) {
      const stepCoords = routeInstructions[arStepIndex].coords;
      if (stepCoords) {
        // Find the stall closest to these coordinates
        let bestStall = null;
        let bestSecKey = null;
        let bestIdx = -1;
        let minDistance = Infinity;
        
        Object.entries(sectionsData).forEach(([secKey, sec]) => {
          sec.stalls.forEach((st, idx) => {
            const coords = getRawCoordinates(st, secKey);
            const dist = Math.sqrt((coords.x - stepCoords.x) ** 2 + (coords.y - stepCoords.y) ** 2);
            if (dist < minDistance) {
              minDistance = dist;
              bestStall = st;
              bestSecKey = secKey;
              bestIdx = idx;
            }
          });
        });
        
        if (bestStall && minDistance < 120) {
          const isDifferent = bestStall.id !== currentStall.id || bestSecKey !== activeSectionKey;
          if (isDifferent) {
            setActiveSectionKey(bestSecKey);
            setStallIndex(bestIdx);
            triggerSceneTransition(getStallImagePath(bestStall.id, bestSecKey));
          }
        }
      }
    }
  }, [arStepIndex, navigationMode, routeInstructions]);

  // Sync step index when currentStall changes manually in 360 mode
  useEffect(() => {
    if (navigationMode === '360' && routeInstructions.length > 0 && destinationStall) {
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
      const distMeters = Math.round(distPixels * 0.05); // scale pixels to meters
      
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
    const startCoords = startStall ? getRawCoordinates(startStall, startSec) : { x: 1050, y: 1550 };
    
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
    
    if (navigationMode === 'ar') {
      startCamera();
    }
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
  const stateRef = useRef({ activeSectionKey, stallIndex, currentStall, sectionsData, showBadges, lastCompassDeg: -1, bestForward: null, bestBackward: null, destinationStall, navigationMode })
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
      destinationStall,
      navigationMode
    }
  }, [activeSectionKey, stallIndex, currentStall, sectionsData, showBadges, destinationStall, navigationMode])

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

  // Recreate hotspots when sectionsData, showBadges, destinationStall, or navigationMode updates
  useEffect(() => {
    if (sceneRef.current && currentStall && window.THREE) {
      recreateHotspots(sceneRef.current, currentStall, window.THREE);
    }
  }, [sectionsData, showBadges, destinationStall, navigationMode]);

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

  // Google Street View-style ground navigation line: glowing line with directional chevrons
  const createGroundArrowTexture = (THREE) => {
    const S = 256;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, S, S);
    const cx = S / 2;

    // Horizontal glowing green gradient for the line
    const grad = ctx.createLinearGradient(0, 0, S, 0);
    grad.addColorStop(0.0, 'rgba(16, 185, 129, 0.0)');
    grad.addColorStop(0.35, 'rgba(16, 185, 129, 0.45)');
    grad.addColorStop(0.46, 'rgba(16, 185, 129, 0.95)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)'); // White hot core
    grad.addColorStop(0.54, 'rgba(16, 185, 129, 0.95)');
    grad.addColorStop(0.65, 'rgba(16, 185, 129, 0.45)');
    grad.addColorStop(1.0, 'rgba(16, 185, 129, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    // Draw small indicator arrows pointing forward down the line
    ctx.fillStyle = '#ffffff';
    for (let y of [60, 128, 196]) {
      ctx.beginPath();
      ctx.moveTo(cx - 15, y + 10);
      ctx.lineTo(cx, y - 10);
      ctx.lineTo(cx + 15, y + 10);
      ctx.lineTo(cx, y + 2);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  const createArChevronTexture = (THREE) => {
    const S = 256;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, S, S);
    const cx = S / 2;

    // Create a beautiful horizontal gradient for the glowing route line
    const grad = ctx.createLinearGradient(0, 0, S, 0);
    grad.addColorStop(0.0, 'rgba(16, 185, 129, 0.0)');
    grad.addColorStop(0.35, 'rgba(16, 185, 129, 0.45)');
    grad.addColorStop(0.46, 'rgba(16, 185, 129, 0.95)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)'); // White hot core
    grad.addColorStop(0.54, 'rgba(16, 185, 129, 0.95)');
    grad.addColorStop(0.65, 'rgba(16, 185, 129, 0.45)');
    grad.addColorStop(1.0, 'rgba(16, 185, 129, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

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
    const yOffset = isBottomZone ? 250 : 0;

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

    // Ground arrow meshes — 2 chevrons (one pointing forward, one pointing backward)
    const arrowTex = createGroundArrowTexture(THREE);
    for (let i = 0; i < 2; i++) {
      const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true, depthTest: false, opacity: 0.0 });
      const arrowMesh = new THREE.Mesh(new THREE.PlaneGeometry(35, 110), arrowMat);
      arrowMesh.visible = false;
      arrowMesh.userData = { type: 'go_forward', label: 'Go Forward', targetStallInfo: null, arrowIndex: i };
      scene.add(arrowMesh);
      hotspotMeshes.current.push(arrowMesh);
    }

    // Dynamic nearby stall markers (Google Maps style)
    const currentSectionsData = stateRef.current.sectionsData;
    const currentActiveSectionKey = stateRef.current.activeSectionKey;
    const currentCoords = getRawCoordinates(stall, currentActiveSectionKey);
    const sectionKeys = ['meat', 'fish', 'veggies'];
    
    // Prevent displaying duplicate badge numbers in the current viewport (e.g. 8 and 8(u))
    const renderedNumbers = new Set([extractCleanNumber(stall.name)]);

    // Calibrate camera direction offset
    let northOffset = 0;
    const upsideDownStalls = ['13(u)', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];
    const zoneAFishUpsideDown = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
    const zoneAMeatUpsideDown = ['12', '13'];

    const isZoneEMeat = currentActiveSectionKey === 'meat' && upsideDownStalls.includes(stall.id);
    const isZoneAFish = currentActiveSectionKey === 'fish' && zoneAFishUpsideDown.includes(stall.id);
    const isZoneAMeat = currentActiveSectionKey === 'meat' && zoneAMeatUpsideDown.includes(stall.id);

    if (stall && stall.id === '1(u)') {
      northOffset = -90;
    } else if (stall && (isZoneEMeat || isZoneAFish || isZoneAMeat)) {
      northOffset = 180;
    }



    // 3D Route Chevrons overlay directly in the 360 panorama map!
    const activeRouteTo = stateRef.current.destinationStall;
    if (activeRouteTo) {
      const chevTex = createArChevronTexture(THREE);
      const startCoords = getRawCoordinates(stall, currentActiveSectionKey);
      
      let targetSec = currentActiveSectionKey;
      Object.entries(currentSectionsData).forEach(([secKey, sec]) => {
        if (sec.stalls.some(s => s.id === activeRouteTo.id)) {
          targetSec = secKey;
        }
      });
      const endCoords = getRawCoordinates(activeRouteTo, targetSec);
      
      const path = findMarketRoute(startCoords, endCoords);
      if (path && path.length > 1) {
        let chevCount = 0;
        const maxChevrons = 35;
        const stepDist = 16; // space in pixels between segments
        let leftover = 0;
        
        for (let i = 0; i < path.length - 1; i++) {
          const P_start = path[i];
          const P_end = path[i + 1];
          const dx = P_end.x - P_start.x;
          const dy = P_end.y - P_start.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len === 0) continue;
          
          const angleRad = Math.atan2(dy, dx);
          const angleDeg = (angleRad * 180 / Math.PI + 450) % 360;
          const segThetaDeg = (angleDeg - northOffset) % 360;
          const segThetaRad = (segThetaDeg * Math.PI) / 180;
          
          let d = leftover;
          while (d < len && chevCount < maxChevrons) {
            const ratio = d / len;
            const px = P_start.x + dx * ratio;
            const py = P_start.y + dy * ratio;
            
            const rx = px - path[0].x;
            const ry = py - path[0].y;
            const rDist = Math.sqrt(rx * rx + ry * ry);
            
            if (rDist > 15 && rDist < 480) {
              const rAngleRad = Math.atan2(ry, rx);
              const rAngleDeg = (rAngleRad * 180 / Math.PI + 450) % 360;
              const rThetaDeg = (rAngleDeg - northOffset) % 360;
              const rThetaRad = (rThetaDeg * Math.PI) / 180;
              
              const sphereDist = 90 + (rDist * 0.45);
              const cx = Math.cos(rThetaRad) * sphereDist;
              const cz = Math.sin(rThetaRad) * sphereDist;
              const cy = -65; // floor level
              
              const chevMat = new THREE.MeshBasicMaterial({
                map: chevTex,
                transparent: true,
                depthWrite: false,
                opacity: 0.85 - (rDist / 480) * 0.45
              });
              
              const chevMesh = new THREE.Mesh(new THREE.PlaneGeometry(35, 35), chevMat);
              chevMesh.position.set(cx, cy, cz);
              chevMesh.rotation.set(-Math.PI / 2 + 0.15, 0, segThetaRad - Math.PI / 2);
              
              chevMesh.userData = {
                type: 'route_chevron',
                label: `To: ${activeRouteTo.name}`
              };
              
              scene.add(chevMesh);
              hotspotMeshes.current.push(chevMesh);
              chevCount++;
            }
            d += stepDist;
          }
          leftover = d - len;
        }
      }
    }
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
          } else if (m.userData.type === 'route_chevron') {
            // Marching/flowing animation along the route
            const dist = m.position.length();
            const phase = time - dist * 0.035;
            const flowOpacity = 0.45 + Math.sin(phase) * 0.35;
            m.material.opacity = flowOpacity * (1.0 - Math.min(1.0, dist / 480));
            
            // Subtle bounce/hover effect
            m.position.y = -65 + Math.sin(time * 1.5 + dist * 0.02) * 1.5;
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

  const getArrowRotation = () => {
    const instructionText = routeInstructions[arStepIndex]?.text || '';
    if (instructionText.toLowerCase().includes('left')) return 'rotateY(-45deg) rotateX(75deg)';
    if (instructionText.toLowerCase().includes('right')) return 'rotateY(45deg) rotateX(75deg)';
    return 'rotateX(75deg)';
  };

  return (
    <div className="relative w-full bg-black overflow-hidden font-sans select-none" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <style>{`
        @keyframes arMarch {
          0% { transform: rotateX(75deg) translateZ(320px) scale(0.45); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { transform: rotateX(75deg) translateZ(0px) scale(1.2); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1) translate(-50%, -50%); filter: drop-shadow(0 0 10px rgba(224, 123, 0, 0.6)); }
          50% { transform: scale(1.06) translate(-50%, -50%); filter: drop-shadow(0 0 22px rgba(224, 123, 0, 0.95)); }
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes marchingLine {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -48; }
        }
        .animate-marching-line {
          animation: marchingLine 1.5s infinite linear;
        }
      `}</style>

      {/* 360 ThreeJS Viewer Mount */}
      <div
        ref={mountRef}
        className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out ${(isMapExpanded && navigationMode === '360') ? 'h-[62%]' : 'h-full'}`}
        style={{ cursor, filter: privacyMode ? 'blur(6px) contrast(1.05)' : 'none', display: navigationMode === '360' ? 'block' : 'none' }}
      />

      {/* AR Camera Viewer Mount */}
      {navigationMode === 'ar' && (
        <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden bg-[#0b0f19]">
          {arCameraError ? (
            /* Simulated AR Camera Background - Beautiful futuristic UI */
            <div className="absolute inset-0 bg-cover bg-center filter brightness-50" style={{ backgroundImage: "url('/export360/stall1 - meat.jpg')" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 pointer-events-none" />
              <div className="absolute inset-0 border-[20px] border-slate-950/20 pointer-events-none flex items-center justify-center">
                <div className="w-[90%] h-[82%] border border-emerald-500/10 relative">
                  {/* Camera corner brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500/60 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500/60 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500/60 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500/60 rounded-br-lg" />
                  {/* Scanning sweep */}
                  <div className="absolute left-0 w-full h-[3px] bg-emerald-500/30 top-0 animate-[scan_5s_infinite_linear] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover brightness-50"
            />
          )}
          
          {/* Animated 3D Ground Navigation Line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
            <div className="w-full h-1/2 max-w-lg relative mt-32" style={{ perspective: '800px', transformStyle: 'preserve-3d' }}>
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-0 w-24 h-96 origin-bottom transition-all duration-1000"
                style={{
                  transform: `${getArrowRotation()} translateY(-10px)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <svg viewBox="0 0 100 400" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="arLineGradient" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#10b881" stopOpacity="0.1" />
                      <stop offset="15%" stopColor="#10b881" stopOpacity="0.85" />
                      <stop offset="85%" stopColor="#10b881" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#10b881" stopOpacity="0.1" />
                    </linearGradient>
                    <filter id="arLineGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="8" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Glowing wide pathway boundary */}
                  <line 
                    x1="50" y1="400" x2="50" y2="0" 
                    stroke="url(#arLineGradient)" 
                    strokeWidth="32" 
                    strokeLinecap="round" 
                    filter="url(#arLineGlow)"
                    opacity="0.45"
                  />
                  
                  {/* Outer solid glow line */}
                  <line 
                    x1="50" y1="400" x2="50" y2="0" 
                    stroke="url(#arLineGradient)" 
                    strokeWidth="16" 
                    strokeLinecap="round" 
                  />
                  
                  {/* Core white highlight line */}
                  <line 
                    x1="50" y1="400" x2="50" y2="0" 
                    stroke="#ffffff" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    opacity="0.9"
                  />

                  {/* Animated marching center line */}
                  <line 
                    x1="50" y1="400" x2="50" y2="0" 
                    stroke="#ffffff" 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                    strokeDasharray="24, 24"
                    className="animate-marching-line"
                  />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Floating Target Stall Pin in 3D AR space */}
          {destinationStall && arStepIndex >= routeInstructions.length - 2 && (
            <div 
              className="absolute left-1/2 top-[35%] z-20 flex flex-col items-center animate-[pulseGlow_3s_infinite_ease-in-out]"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Floating Profile Card */}
              <div 
                className="bg-[#e07b00] border-2 border-white text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md cursor-pointer pointer-events-auto hover:bg-[#b86500] transition-all"
                onClick={() => {
                  setSelectedStall(destinationStall);
                  setDetailsCollapsed(false);
                }}
              >
                <Store size={18} className="animate-bounce" />
                <div className="text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider block opacity-80 leading-none mb-0.5">Target Destination</span>
                  <span className="text-xs font-black">{destinationStall.name}</span>
                </div>
                <span className="w-6 h-6 rounded-full bg-white text-[#e07b00] flex items-center justify-center font-bold text-xs shrink-0 shadow-md ml-1">i</span>
              </div>
              {/* Stem linking card to path */}
              <div className="w-[3px] h-16 bg-gradient-to-b from-white to-transparent" />
            </div>
          )}
        </div>
      )}

      {/* Mode Switcher Tab (Top Center) */}
      {uiVisible && (
        <div className="absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 z-30 bg-white/90 backdrop-blur-md px-1.5 py-1.5 rounded-2xl shadow-2xl border border-black/10 flex items-center gap-1.5">
          <button
            onClick={() => {
              setNavigationMode('360');
              stopCamera();
              setIsWalkingSimulation(false);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              navigationMode === '360' ? 'bg-[#1a5c2a] text-white shadow-md' : 'text-slate-700 hover:bg-black/5'
            }`}
          >
            <Maximize2 size={13} />
            <span>360° Panorama Map</span>
          </button>
          <button
            onClick={() => {
              setNavigationMode('ar');
              startCamera();
              // Auto route to current or first stall if no target
              if (!destinationStall) {
                handleRouteMe(currentStall || activeSection.stalls[0]);
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              navigationMode === 'ar' ? 'bg-[#e07b00] text-white shadow-md' : 'text-slate-700 hover:bg-black/5'
            }`}
          >
            <Zap size={13} className="animate-pulse" />
            <span>Live 3D AR Navigation</span>
          </button>
        </div>
      )}

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
                navigate(location.pathname.startsWith('/renter') ? '/renter/dashboard' : '/');
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

      {/* AR Navigation Top HUD Panel */}
      {uiVisible && routeInstructions.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-black/10 shadow-2xl flex flex-col gap-3">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {navigationMode === 'ar' ? 'Live AR Route' : '360° Panorama Route'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-800">
                  {arStepIndex + 1} of {routeInstructions.length} Steps
                </span>
                <button
                  onClick={() => {
                    setDestinationStall(null);
                    setRouteInstructions([]);
                    setArWaypoints([]);
                    setIsWalkingSimulation(false);
                    setRouteFrom(null);
                    setRouteTo(null);
                  }}
                  className="p-1 rounded-full bg-red-50 hover:bg-red-100 text-red-500 transition-all cursor-pointer border-none flex items-center justify-center"
                  title="Cancel Route"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            
            {/* Active Instruction */}
            <div className="flex items-start gap-3.5 my-1">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl shadow-md shrink-0">
                <CompassIcon size={20} className={isWalkingSimulation ? "animate-spin" : ""} style={{ animationDuration: '6s' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900 leading-snug break-words">
                  {routeInstructions[arStepIndex]?.text}
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                  Target: {destinationStall?.name}
                </p>
              </div>
            </div>
            
            {/* Walk Simulation Controller */}
            <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-black/5">
              <button
                onClick={() => setArStepIndex(prev => Math.max(0, prev - 1))}
                disabled={arStepIndex === 0}
                className="flex-1 py-2 rounded-xl border border-black/10 text-slate-700 hover:bg-slate-50 text-[11px] font-bold transition-all disabled:opacity-40 cursor-pointer"
              >
                ← Prev Step
              </button>
              
              <button
                onClick={() => setIsWalkingSimulation(!isWalkingSimulation)}
                className={`flex-1 py-2 rounded-xl text-[11px] font-black text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
                  isWalkingSimulation 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-[#1a5c2a] hover:bg-[#12421e]'
                }`}
              >
                {isWalkingSimulation ? <Pause size={12} /> : <Play size={12} />}
                <span>{isWalkingSimulation ? "Pause Walk" : "Simulate Walk"}</span>
              </button>
              
              <button
                onClick={() => {
                  if (arStepIndex < routeInstructions.length - 1) {
                    setArStepIndex(prev => prev + 1);
                  } else {
                    // Arrived! Show bottom sheet
                    setSelectedStall(destinationStall);
                    setDetailsCollapsed(false);
                  }
                }}
                className="flex-1 py-2 rounded-xl border border-black/10 text-slate-700 hover:bg-slate-50 text-[11px] font-bold transition-all cursor-pointer"
              >
                {arStepIndex === routeInstructions.length - 1 ? "Open Details" : "Next Step →"}
              </button>
            </div>
          </div>
        </div>
      )}

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
      {uiVisible && navigationMode === '360' && isMapExpanded && (
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

      {uiVisible && navigationMode === '360' && (
        <div
          onClick={!isMapExpanded ? () => {
            setIsMapExpanded(true);
            let count = 0;
            const interval = setInterval(() => {
              window.dispatchEvent(new Event('resize'));
              if (count++ > 30) clearInterval(interval);
            }, 16);
          } : undefined}
          className={`absolute transition-all duration-500 ease-out z-40 border border-white/10 flex flex-col rounded-3xl ${
            isMapExpanded
              ? 'bottom-[12.5vh] left-[4vw] sm:left-[calc(50%-28rem)] w-[92vw] h-[75vh] max-w-4xl p-4 sm:p-5 bg-slate-950/15 backdrop-blur-md overflow-hidden'
              : 'bottom-24 left-3 sm:bottom-6 sm:left-6 w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48 overflow-hidden cursor-pointer bg-slate-950/85 backdrop-blur-md hover:-translate-y-2'
          }`}
          style={{
            transform: isMapExpanded
              ? 'perspective(1500px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)'
              : 'perspective(850px) rotateX(38deg) rotateY(0deg) rotateZ(-22deg)',
            transformStyle: 'preserve-3d',
            boxShadow: isMapExpanded
              ? '0 25px 50px rgba(0, 0, 0, 0.5)'
              : '-10px 20px 30px rgba(0, 0, 0, 0.45), 0 0 20px rgba(16, 185, 129, 0.15)'
          }}
        >
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
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMapExpanded(true);
                let count = 0;
                const interval = setInterval(() => {
                  window.dispatchEvent(new Event('resize'));
                  if (count++ > 30) clearInterval(interval);
                }, 16);
              }}
              className="absolute top-2.5 right-2.5 z-40 bg-white/95 backdrop-blur-sm p-1.5 rounded-full shadow-lg border border-black/10 hover:bg-white text-slate-800 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              title="Expand Map"
            >
              <Maximize2 size={13} />
            </button>
          )}

          {/* Map Body Content */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                    style={{ pointerEvents: isMapExpanded ? 'auto' : 'none' }}
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

                    <image href={mapImage} x="-20" y="-15" width="2305" height="1824" preserveAspectRatio="none" style={{ pointerEvents: 'none', opacity: 0.75 }} />

                    {/* Google Maps–style corridor route */}
                    {fromCoords && toCoords && (() => {
                      const waypoints = findMarketRoute(fromCoords, toCoords);
                      const pathWaypoints = waypoints.slice(1, -1);
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
                              if (routeFrom && !routeTo) {
                                setRouteTo({ secKey, stallId: st.id });
                                handleRouteMe(st);
                              } else {
                                setRouteFrom({ secKey, stallId: st.id });
                              }
                            }}
                          />
                        );
                      });
                    })}

                    {/* View Cone and Pin positioned accurately on the coordinate (hidden when route is active) */}
                    {!(routeFrom && routeTo) && (
                      <g transform={`translate(${mapCoords.x}, ${mapCoords.y})`}>
                        {/* View Cone */}
                        <path d="M0 0 L-100 -200 A200 200 0 0 1 100 -200 Z" fill="rgba(239, 68, 68, 0.25)" transform={`rotate(${compassAngle})`} style={{ pointerEvents: 'none' }} />
                        
                        {/* Base Shadow */}
                        <ellipse cx="0" cy="0" rx="20" ry="10" fill="rgba(0,0,0,0.2)" />
                        
                        {/* Pin Circle */}
                        <circle r="22" fill="#ef4444" stroke="#ffffff" strokeWidth="4" className="animate-pulse" />
                        
                        {/* Basket Icon */}
                        <g transform="translate(-9, -9)" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 9h14" />
                          <path d="m13 9-3-5" />
                          <path d="m3 9 3-5" />
                          <path d="M3.5 9v4a4.5 4.5 0 0 0 9 0V9" />
                          <path d="M6.5 12h5" />
                        </g>
                      </g>
                    )}
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>
      )}



      {/* BOTTOM CENTER STALL QUICK SWITCHER CONTROLS */}
      {navigationMode === '360' && (
        <div className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'} ${detailsCollapsed ? 'bottom-6 sm:bottom-10' : 'bottom-[330px] md:bottom-[240px]'} flex flex-col items-center gap-1.5 sm:gap-2.5 scale-90 sm:scale-100 origin-bottom`}>
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
                <span>Route Me (3D AR)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini Map in AR Mode */}
      {navigationMode === 'ar' && uiVisible && (
        <div 
          className="absolute bottom-24 left-3 sm:bottom-6 sm:left-6 w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border border-white/20 bg-slate-950/85 backdrop-blur-md overflow-hidden z-20 shadow-2xl transition-all duration-500 hover:-translate-y-2"
          style={{
            transform: 'perspective(800px) rotateX(38deg) rotateY(0deg) rotateZ(-22deg)',
            transformStyle: 'preserve-3d',
            boxShadow: '-10px 20px 30px rgba(0, 0, 0, 0.45), 0 0 20px rgba(34, 197, 94, 0.15)'
          }}
        >
          <div className="w-full h-full p-1.5 relative">
            {(() => {
              const mapCoords = routeInstructions[arStepIndex]?.coords || ENTRANCE_COORDS;
              const zoomWidth = 620;
              const zoomHeight = 620;
              const vbX = Math.max(0, Math.min(2305 - zoomWidth, mapCoords.x - zoomWidth / 2));
              const vbY = Math.max(0, Math.min(1824 - zoomHeight, mapCoords.y - zoomHeight / 2));
              
              // Route path points
              const pathWaypoints = arWaypoints.slice(1, -1);
              const pts = pathWaypoints.map(p => `${p.x},${p.y}`).join(' ');
              
              return (
                <svg viewBox={`${vbX} ${vbY} ${zoomWidth} ${zoomHeight}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                  <defs>
                    <linearGradient id="arPinStemGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  <image href={mapImage} x="-20" y="-15" width="2305" height="1824" preserveAspectRatio="none" style={{ pointerEvents: 'none', opacity: 0.65 }} />
                  
                  {/* Render route path in mini map */}
                  {pathWaypoints.length >= 2 && (
                    <g>
                      <polyline points={pts} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  )}
                  
                  {/* View Cone and Pin positioned accurately on the coordinate in AR mini map */}
                  <g transform={`translate(${mapCoords.x}, ${mapCoords.y})`}>
                    {/* View Cone */}
                    <path d="M0 0 L-100 -200 A200 200 0 0 1 100 -200 Z" fill="rgba(34, 197, 94, 0.3)" transform={`rotate(${compassAngle})`} style={{ pointerEvents: 'none' }} />
                    

                    
                    {/* Base Shadow */}
                    <ellipse cx="0" cy="0" rx="20" ry="10" fill="rgba(0,0,0,0.2)" />
                    
                    {/* Pin Circle */}
                    <circle r="22" fill="#22c55e" stroke="#ffffff" strokeWidth="4" className="animate-pulse" />
                    
                    {/* Basket Icon */}
                    <g transform="translate(-9, -9)" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 9h14" />
                      <path d="m13 9-3-5" />
                      <path d="m3 9 3-5" />
                      <path d="M3.5 9v4a4.5 4.5 0 0 0 9 0V9" />
                      <path d="M6.5 12h5" />
                    </g>
                  </g>
                </svg>
              );
            })()}
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
