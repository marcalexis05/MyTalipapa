import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Compass, Info, HelpCircle, Navigation, RotateCw, Check, X, Camera, CameraOff, Map, ChevronDown, ChevronUp, Locate, ChevronLeft, ChevronRight } from "lucide-react";
import mapImage from "../../images/map.png";
import { SVG_STALL_COORDS } from "../../utils/coords_dict";
// Removed unused STALL_POSITIONS import

const getStallZone = (num, category) => {
  const stallId = String(num);
  if (category === 'meat') {
    if (['1', '2', '3', '4', '5', '12', '13', 'empty', 'empty2', 'empty3'].includes(stallId)) return 'Zone A';
    if (['51', '52', '53', '54', '55', '56'].includes(stallId)) return 'Zone C';
    if (['1(u2)', '2(u2)', '3(u2)', '4(u2)', '8(u2)', '9(u2)', '10(u2)'].includes(stallId)) return 'Zone F';
    return 'Zone E';
  } else if (category === 'fish') {
    const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
    if (numInt >= 11 && numInt <= 20) return 'Zone A';
    if (numInt >= 21 && numInt <= 40) return 'Zone B';
    if ((numInt >= 41 && numInt <= 50) || (numInt >= 57 && numInt <= 60)) return 'Zone C';
    return 'Zone D';
  } else if (category === 'veggies') {
    const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
    if (numInt >= 5 && numInt <= 24) return 'Zone F';
    if (numInt >= 25 && numInt <= 48) return 'Zone G';
    return 'Zone H';
  }
  return 'Zone A';
};

const getStallCoords = (rawId, category, zone) => {
  const cleanNum = getCleanDbStallNumber(rawId);
  const zoneLetter = String(zone || '').replace('Zone ', '').toUpperCase();
  const isBottomZone = ['E', 'F', 'G', 'H'].includes(zoneLetter);
  const yOffset = isBottomZone ? 250 : 0;

  // Try exact rawId (including variants like (u))
  const rawKey = `${category}-${rawId}`;
  if (SVG_STALL_COORDS[rawKey]) {
    return { x: SVG_STALL_COORDS[rawKey].x, y: SVG_STALL_COORDS[rawKey].y + yOffset };
  }

  // Fallback to cleaned number key
  const cleanKey = `${category}-${cleanNum}`;
  if (SVG_STALL_COORDS[cleanKey]) {
    return { x: SVG_STALL_COORDS[cleanKey].x, y: SVG_STALL_COORDS[cleanKey].y + yOffset };
  }

  // Default fallback position
  return { x: 1020, y: 635 + yOffset };
};

const getCleanDbStallNumber = (rawId) => {
  return String(rawId)
    .replace(/\(u\d*\)/gi, '') // strip (u), (u2), etc.
    .replace(/Stall\s*#/gi, '')
    .replace('#', '')
    .trim()
    .toLowerCase()
    .replace(/^0+(?=\d)/, '');
};

const getCircleDisplayNumber = (rawId) => {
  const clean = getCleanDbStallNumber(rawId);
  if (clean.startsWith('nostallnum') || clean.startsWith('empty')) {
    return '';
  }
  return clean;
};

const buildAllStalls = () => {
  const meatIds = [
    '1', '1(u)', '1(u2)', '2', '2(u)', '2(u2)', '3', '3(u)', '3(u2)', '4', '4(u)', '4(u2)',
    '5', 'empty', 'empty2', 'empty3',
    '5(u)', '6', '7', '8', '9', '10', '8(u2)', '9(u2)', '10(u2)', '11', '12', '12(u)', '13', '13(u)', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24',
    '51', '52', '53', '54', '55', '56'
  ];
  const fishIds = [
    '11', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
    '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
    '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
    '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75',
    'nostallnum1', 'nostallnum2', 'nostallnum3', 'nostallnum4', 'nostallnum5'
  ];
  const veggieIds = [
    '5', '6', '7', '11', '12', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24',
    '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
    '41', '42', '43', '44', '45', '46', '47', '48', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
    '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72'
  ];

  const list = [];

  const processCategory = (category, ids) => {
    ids.forEach((id) => {
      const zone = getStallZone(id, category);
      const { x, y } = getStallCoords(id, category, zone);
      let displayName = `Stall #${id}`;
      if (id.startsWith('nostallnum')) displayName = `Unnumbered Stall #${id.replace('nostallnum', '')}`;
      else if (id.startsWith('empty')) displayName = `Empty Stall #${id.replace('empty', '') || '1'}`;
      list.push({
        id: `${category}-${id}`,
        label: `${displayName} (${category.charAt(0).toUpperCase() + category.slice(1)})`,
        section: category === 'meat' ? 'Meat Section' : category === 'fish' ? 'Fish Section' : 'Vegetables Section',
        zone, x, y, rawId: id, category
      });
    });
  };

  processCategory('meat', meatIds);
  processCategory('fish', fishIds);
  processCategory('veggies', veggieIds);

  return list;
};

const STALLS_AR = buildAllStalls();

const HALLWAY_GROUPS = {
  "Main Entrance": [
    { id: "entrance", label: "Main Entrance", x: 1050, y: 1720 }
  ],
  "Top Pathways": [
    { id: "hallway1", label: "Hallway 1 (Top Left)", x: 30, y: 100 },
    { id: "hallway2", label: "Hallway 2 (Top, A-B)", x: 530, y: 100 },
    { id: "hallway3_4", label: "Hallway 3 & 4 (Top, Zone B)", x: 790, y: 100 },
    { id: "hallway5", label: "Hallway 5 (Top, B-C)", x: 1050, y: 100 },
    { id: "hallway6", label: "Hallway 6 (Top, Zone C)", x: 1300, y: 100 },
    { id: "hallway7", label: "Hallway 7 (Top, C-D)", x: 1570, y: 100 },
    { id: "hallway8_9", label: "Hallway 8 & 9 (Top, Zone D)", x: 1845, y: 100 },
    { id: "hallway10", label: "Hallway 10 (Top Right)", x: 2120, y: 100 }
  ],
  "Middle Pathways": [
    { id: "hallway31H", label: "Hallway 31H (Middle Left)", x: 30, y: 910 },
    { id: "hallway31", label: "Hallway 31 (Middle, E-A)", x: 265, y: 910 },
    { id: "hallway28", label: "Hallway 28 (Middle, E-F)", x: 530, y: 910 },
    { id: "hallway32", label: "Hallway 32 (Middle, B-F)", x: 790, y: 910 },
    { id: "hallway30", label: "Hallway 30 (Middle, C-G)", x: 1050, y: 910 },
    { id: "hallway33", label: "Hallway 33 (Middle, C-G)", x: 1300, y: 910 },
    { id: "hallway29", label: "Hallway 29 (Middle, G-H)", x: 1570, y: 910 },
    { id: "hallway34", label: "Hallway 34 (Middle, D-H)", x: 1845, y: 910 },
    { id: "hallway11", label: "Hallway 11 (Right Mid)", x: 2120, y: 910 }
  ],
  "Bottom Pathways": [
    { id: "hallway27", label: "Hallway 27 (Bottom Left)", x: 30, y: 1720 },
    { id: "hallway25_26", label: "Hallway 25 & 26 (Bottom, Zone E)", x: 265, y: 1720 },
    { id: "hallway24", label: "Hallway 24 (Bottom, E-F)", x: 530, y: 1720 },
    { id: "hallway21_22_23", label: "Hallway 21, 22, 23 (Bottom, Zone F)", x: 790, y: 1720 },
    { id: "hallway20", label: "Hallway 20 (Bottom, F-G)", x: 1050, y: 1720 },
    { id: "hallway17_18_19", label: "Hallway 17, 18, 19 (Bottom, Zone G)", x: 1300, y: 1720 },
    { id: "hallway16", label: "Hallway 16 (Bottom, G-H)", x: 1570, y: 1720 },
    { id: "hallway13_14_15", label: "Hallway 13, 14, 15 (Bottom Right)", x: 1845, y: 1720 },
    { id: "hallway12", label: "Hallway 12 (Bottom Right)", x: 2120, y: 1720 }
  ]
};

const HALLWAYS = Object.values(HALLWAY_GROUPS).flat();


export default function ArFinder({ onBack }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStallId, setSelectedStallId] = useState("meat-1");
  const [stallsList, setStallsList] = useState(STALLS_AR);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDirections, setSearchDirections] = useState("");

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await fetch(`/api/stalls/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success && data.stall) {
        const foundStall = data.stall;

        const targetClean = getCleanDbStallNumber(foundStall.stallNumber);

        const matched = stallsList.find(s => {
          const sec = String(foundStall.section || '').toLowerCase();
          let category = 'meat';
          if (sec.includes('fish') || sec.includes('sea')) category = 'fish';
          else if (sec.includes('veg') || sec.includes('produce')) category = 'veggies';

          const sNum = getCleanDbStallNumber(s.rawId);
          const sZone = String(s.zone || '').replace('Zone ', '').toUpperCase();
          const fZone = String(foundStall.zone || '').replace('Zone ', '').toUpperCase();

          return sNum === targetClean && s.category === category && sZone === fZone;
        });

        if (matched) {
          setSelectedStallId(matched.id);
          setSearchDirections(foundStall.directions || "");
          setToastMsg(`Found Stall #${foundStall.stallNumber} in Zone ${foundStall.zone}`);
        } else {
          setToastMsg(`Stall found in DB but not active/contracted.`);
        }
      } else {
        setToastMsg("Stall not found.");
      }
    } catch (error) {
      console.error("Search failed:", error);
      setToastMsg("Search failed.");
    }
  };

  // Auto-fetch directions when selectedStallId changes
  useEffect(() => {
    const currentStall = stallsList.find(s => s.id === selectedStallId);
    if (!currentStall) return;

    const fetchDirections = async () => {
      try {
        const cleanStallNum = getCleanDbStallNumber(currentStall.rawId);
        const response = await fetch(`/api/stalls/search?zone=${currentStall.zone.replace('Zone ', '')}&stallNumber=${cleanStallNum}`);
        const data = await response.json();
        if (data.success && data.stall) {
          setSearchDirections(data.stall.directions || "");
        } else {
          setSearchDirections("");
        }
      } catch (err) {
        console.error("Failed to fetch directions:", err);
      }
    };
    fetchDirections();
  }, [selectedStallId, stallsList]);

  useEffect(() => {
    fetch('/api/stalls')
      .then(res => res.json())
      .then(dbStalls => {
        if (!Array.isArray(dbStalls)) return;

        // Map database stalls by category, zone, and cleaned stallNumber
        const dbStallMap = {};
        dbStalls.forEach(dbStall => {
          const key = getCleanDbStallNumber(dbStall.stallNumber || dbStall.id || '');
          const sec = String(dbStall.section || '').toLowerCase();
          let category = 'meat';
          if (sec.includes('fish') || sec.includes('sea')) category = 'fish';
          else if (sec.includes('veg') || sec.includes('produce')) category = 'veggies';

          const zoneLetter = String(dbStall.zone || '').replace('Zone ', '').toUpperCase();

          if (key && zoneLetter) {
            dbStallMap[`${category}-${zoneLetter}-${key}`] = dbStall;
          }
        });

        // Update STALLS_AR elements with DB data, do NOT filter them out
        const updatedList = STALLS_AR.map(s => {
          const cleanedId = getCleanDbStallNumber(s.rawId);
          const zoneLetter = String(s.zone || '').replace('Zone ', '').toUpperCase();
          const dbStall = dbStallMap[`${s.category}-${zoneLetter}-${cleanedId}`];
          if (dbStall) {
            const isBottomZone = ['E', 'F', 'G', 'H'].includes(zoneLetter);
            const dbX = dbStall.coordinates?.x;
            const dbY = dbStall.coordinates?.y;
            const yOffset = isBottomZone ? 250 : 0;
            return {
              ...s,
              x: dbX !== undefined ? dbX : s.x,
              y: dbY !== undefined ? dbY + yOffset : s.y,
              status: dbStall.status || s.status,
              price: dbStall.monthlyRate || s.price,
              contractorName: dbStall.contractorName || 'None',
              contractorContact: dbStall.contractorContact || 'N/A',
              dbId: dbStall._id || dbStall.id
            };
          }
          return s; // Keep the fallback instead of filtering out!
        });

        setStallsList(updatedList);

        // Auto-select the first available stall in the updated list if the current selection is not in it
        if (updatedList.length > 0) {
          const exists = updatedList.some(s => s.id === selectedStallId);
          if (!exists) {
            setSelectedStallId(updatedList[0].id);
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch stalls in ArFinder:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const currentStall = stallsList.find(s => s.id === selectedStallId) || stallsList[0] || STALLS_AR[0];

  const [userX, setUserX] = useState(1050);
  const [userY, setUserY] = useState(1720);
  const [heading, setHeading] = useState(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [mapCollapsed, setMapCollapsed] = useState(true); // default collapsed on mobile
  const [showHelp, setShowHelp] = useState(false);
  const [hasOrientation, setHasOrientation] = useState(false);
  const [showCard, setShowCard] = useState(true);
  const [showStartSelector, setShowStartSelector] = useState(false);
  const [selectedStartId, setSelectedStartId] = useState("entrance");
  const [toastMsg, setToastMsg] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const containerRef = useRef(null);

  const gpsWatchIdRef = useRef(null);
  const gpsAnchorRef = useRef(null);
  const [gpsActive, setGpsActive] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const toggleGps = () => {
    if (gpsActive) {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      gpsAnchorRef.current = null;
      setGpsActive(false);
      setToastMsg("GPS tracking disabled.");
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
      setToastMsg("Activating GPS. Please allow location access...");
      gpsAnchorRef.current = null;
      gpsWatchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          if (!gpsAnchorRef.current) {
            gpsAnchorRef.current = {
              lat: latitude,
              lng: longitude,
              mapX: userX,
              mapY: userY
            };
            setToastMsg(`GPS active (Accuracy: ${Math.round(accuracy)}m). Anchored.`);
          } else {
            const latDiff = latitude - gpsAnchorRef.current.lat;
            const lngDiff = longitude - gpsAnchorRef.current.lng;

            const dyMeters = latDiff * 111139;
            const dxMeters = lngDiff * 111139 * Math.cos(gpsAnchorRef.current.lat * Math.PI / 180);

            const scale = 50; // pixels per meter
            const dxPixels = dxMeters * scale;
            const dyPixels = -dyMeters * scale;

            const newX = Math.round(gpsAnchorRef.current.mapX + dxPixels);
            const newY = Math.round(gpsAnchorRef.current.mapY + dyPixels);

            setUserX(Math.max(30, Math.min(2270, newX)));
            setUserY(Math.max(30, Math.min(1790, newY)));
          }
          setGpsActive(true);
        },
        (err) => {
          console.error("GPS error:", err);
          setToastMsg(`GPS tracking failed: ${err.message}`);
          if (gpsWatchIdRef.current !== null) {
            navigator.geolocation.clearWatch(gpsWatchIdRef.current);
            gpsWatchIdRef.current = null;
          }
          setGpsActive(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    if (!cameraEnabled) return;
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = fallback;
        if (videoRef.current) videoRef.current.srcObject = fallback;
        setCameraActive(true);
      } catch {
        setCameraError("Camera unavailable. Running in simulated AR view.");
        setCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  };

  useEffect(() => {
    if (cameraEnabled) startCamera(); else stopCamera();
    const handleOrientation = (e) => {
      let h = e.webkitCompassHeading ?? (360 - e.alpha);
      if (h !== undefined) { setHeading(Math.round(h)); setHasOrientation(true); }
    };
    window.addEventListener("deviceorientation", handleOrientation);
    return () => { stopCamera(); window.removeEventListener("deviceorientation", handleOrientation); };
  }, [cameraEnabled]);

  const handleMapClick = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const vw = 2305, vh = 1824;
    const rr = rect.width / rect.height;
    const vr = vw / vh;
    let scale, ox = 0, oy = 0;
    if (rr > vr) { scale = rect.width / vw; oy = (rect.height - vh * scale) / 2; }
    else { scale = rect.height / vh; ox = (rect.width - vw * scale) / 2; }
    const cx = (e.clientX - rect.left - ox) / scale;
    const cy = (e.clientY - rect.top - oy) / scale;
    if (cx >= 0 && cx <= vw && cy >= 0 && cy <= vh) {
      gpsAnchorRef.current = null;
      setUserX(Math.round(cx));
      setUserY(Math.round(cy));
      setSelectedStartId("custom");
    }
  };

  const X_CORRIDORS = [30, 265, 530, 790, 1050, 1300, 1570, 1845, 2120];
  const Y_PATHWAYS = [100, 910, 1720];

  const getPathPoints = () => {
    const pts = [{ x: userX, y: userY }];
    const sx = currentStall.x, sy = currentStall.y;

    const userCX = X_CORRIDORS.reduce((p, c) => Math.abs(c - userX) < Math.abs(p - userX) ? c : p);
    const stallCX = X_CORRIDORS.reduce((p, c) => Math.abs(c - sx) < Math.abs(p - sx) ? c : p);

    if (userCX === stallCX) {
      if (userX !== userCX) pts.push({ x: userCX, y: userY });
      if (userY !== sy) pts.push({ x: userCX, y: sy });
    } else {
      let bestPY = Y_PATHWAYS[0];
      let minDist = Infinity;
      for (const py of Y_PATHWAYS) {
        const dist = Math.abs(userY - py) + Math.abs(userCX - stallCX) + Math.abs(sy - py);
        if (dist < minDist) {
          minDist = dist;
          bestPY = py;
        }
      }

      if (userX !== userCX) pts.push({ x: userCX, y: userY });
      if (userY !== bestPY) pts.push({ x: userCX, y: bestPY });
      if (userCX !== stallCX) pts.push({ x: stallCX, y: bestPY });
      if (bestPY !== sy) pts.push({ x: stallCX, y: sy });
    }

    const last = pts[pts.length - 1];
    if (last.x !== sx || last.y !== sy) pts.push({ x: sx, y: sy });

    const cleanPts = [];
    for (const p of pts) {
      if (cleanPts.length === 0) {
        cleanPts.push(p);
      } else {
        const lastP = cleanPts[cleanPts.length - 1];
        if (lastP.x !== p.x || lastP.y !== p.y) {
          cleanPts.push(p);
        }
      }
    }
    return cleanPts;
  };

  const pathPoints = getPathPoints();

  const calcDist = (x1, y1, x2, y2) => Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * 0.02);
  const getPathDist = (pts) => {
    let d = 0;
    for (let i = 0; i < pts.length - 1; i++)
      d += Math.sqrt((pts[i + 1].x - pts[i].x) ** 2 + (pts[i + 1].y - pts[i].y) ** 2);
    return Math.round(d * 0.02);
  };
  const totalDistance = getPathDist(pathPoints);

  const getETA = (distInMeters) => {
    const speed = 1.2; // average walking speed: 1.2 m/s
    const totalSeconds = Math.round(distInMeters / speed);
    if (totalSeconds < 60) {
      return `~${totalSeconds}s`;
    } else {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return secs > 0 ? `~${mins}m ${secs}s` : `~${mins}m`;
    }
  };

  const getBearing = (x1, y1, x2, y2) => {
    let a = Math.atan2(x2 - x1, y1 - y2) * (180 / Math.PI);
    return Math.round((a + 360) % 360);
  };

  const targetBearing = getBearing(userX, userY, currentStall.x, currentStall.y);
  const nextWP = pathPoints[1] || currentStall;
  const nextBearing = getBearing(userX, userY, nextWP.x, nextWP.y);
  let relNextAngle = nextBearing - heading;
  if (relNextAngle > 180) relNextAngle -= 360;
  if (relNextAngle < -180) relNextAngle += 360;

  const getArProj = (x, y) => {
    const dist = calcDist(userX, userY, x, y);
    const bearing = getBearing(userX, userY, x, y);
    let rel = bearing - heading;
    if (rel > 180) rel -= 360;
    if (rel < -180) rel += 360;
    const fov = 50;
    return { isVisible: Math.abs(rel) <= fov, xPct: 50 + (rel / fov) * 50, yPct: 65 - (dist / 40) * 30, scale: Math.max(0.4, 1 - dist / 50), dist, relAngle: rel };
  };

  const targetProj = getArProj(currentStall.x, currentStall.y);

  const arPathDots = (() => {
    const dots = [];
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i], p2 = pathPoints[i + 1];
      const d = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      const steps = Math.max(3, Math.round(d / 75));
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        dots.push({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t });
      }
    }
    return dots.map(d => ({ ...d, proj: getArProj(d.x, d.y) }))
      .filter(d => d.proj.isVisible && d.proj.dist > 1.5 && d.proj.dist < 40);
  })();

  const handleStepForward = () => {
    const rad = (heading * Math.PI) / 180;
    setUserX(x => Math.max(30, Math.min(2270, x + Math.round(Math.sin(rad) * 45))));
    setUserY(y => Math.max(30, Math.min(1790, y - Math.round(Math.cos(rad) * 45))));
  };
  const handleRotateLeft = () => setHeading(h => (h - 15 + 360) % 360);
  const handleRotateRight = () => setHeading(h => (h + 15) % 360);
  const handleResetPosition = () => { gpsAnchorRef.current = null; setUserX(1050); setUserY(1720); setHeading(0); setSelectedStartId("entrance"); setToastMsg("Location reset to Main Entrance."); };
  const handleSelectStartPoint = (point) => {
    gpsAnchorRef.current = null;
    setUserX(point.x); setUserY(point.y);
    setSelectedStartId(point.id);
    setToastMsg(`Location set to: ${point.label}`);
    setShowStartSelector(false);
  };

  const requestCompassPermission = async () => {
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      try {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r === "granted") setHasOrientation(true);
        else alert("Sensor permission denied.");
      } catch (err) { console.error(err); }
    }
  };

  // Map panel height for mobile: collapsed = 44px header only, expanded = 220px
  const MAP_EXPANDED_H = 220;
  const MAP_HEADER_H = 44;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#0a0f0a",
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }

        /* ── KEYFRAMES ── */
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scan {
          0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); } to { transform: rotate(360deg); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.6; }
        }
        .animate-fadeIn    { animation: fadeIn 0.2s ease forwards; }
        .animate-scanLine  { position: absolute; animation: scan 3s linear infinite; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }

        /* ── LAYOUT: DESKTOP side-by-side, MOBILE stacked ── */
        .ar-body {
          display: flex;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        /* AR viewport takes all available space */
        .ar-viewport {
          position: relative;
          flex: 1;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          background: #111;
        }

        /* ── MAP PANEL ── */
        /* Desktop: right sidebar */
        .ar-map-panel {
          width: 42%;
          min-width: 320px;
          max-width: 520px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: #fff;
          border-left: 1px solid #e2e8f0;
          overflow: hidden;
          transition: width 0.25s ease;
        }
        .ar-map-panel.collapsed-desktop {
          width: 40px;
          min-width: 40px;
        }

        /* Mobile: bottom sheet that sits BELOW the AR viewport */
        @media (max-width: 640px) {
          .ar-body {
            flex-direction: column;
          }
          .ar-map-panel {
            width: 100% !important;
            min-width: unset;
            max-width: unset;
            border-left: none;
            border-top: 2px solid #e2e8f0;
            flex-shrink: 0;
            /* height controlled inline via JS */
            transition: height 0.25s ease;
          }
          .ar-map-panel.collapsed-desktop {
            width: 100% !important;
          }
        }

        .ar-map-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          height: ${MAP_HEADER_H}px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          flex-shrink: 0;
          cursor: pointer;
          user-select: none;
        }
        .ar-map-header-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #64748b;
          white-space: nowrap;
        }

        .ar-map-body {
          flex: 1;
          position: relative;
          background: #f4f4f5;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
        }

        /* ── HEADER CONTROLS ── */
        .hud-btn {
          width: 38px; height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #fff;
          transition: background 0.15s, transform 0.1s;
          flex-shrink: 0;
        }
        .hud-btn:hover { background: rgba(255,255,255,0.22); }
        .hud-btn:active { transform: scale(0.92); }
        .hud-btn.active { background: #1a5c2a; border-color: #1a5c2a; }

        .ctrl-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(226,232,240,0.6);
          background: rgba(255,255,255,0.92);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #334155;
          transition: background 0.15s, transform 0.1s;
        }
        .ctrl-btn:hover { background: #fff; }
        .ctrl-btn:active { transform: scale(0.92); }
        .ctrl-btn.primary { background: #1a5c2a; color: #fff; border-color: #1a5c2a; }
        .ctrl-btn.primary:hover { background: #154a22; }

        /* ── STALL SELECTS ── */
        .stall-select {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 999px;
          padding: 5px 10px;
          gap: 5px;
          backdrop-filter: blur(8px);
        }
        .stall-select select {
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          background: transparent;
          border: none;
          outline: none;
          cursor: pointer;
          max-width: 120px;
        }
        .stall-select select option { color: #1e293b; background: #fff; }
        .stall-select label {
          font-size: 9px;
          font-weight: 800;
          color: rgba(255,255,255,0.7);
          text-transform: uppercase;
          letter-spacing: 0.07em;
          white-space: nowrap;
        }

        /* Mobile: stall selects wrap below header in a sub-bar */
        .header-selects-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: nowrap;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 6px 10px;
          background: rgba(10,15,10,0.95);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }
        .header-selects-bar::-webkit-scrollbar { display: none; }

        /* ── TOAST ── */
        .toast {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255,255,255,0.97);
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 11px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
          white-space: nowrap;
          z-index: 30;
          animation: fadeSlideIn 0.2s ease;
          max-width: calc(100% - 24px);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── INFO CARD ── */
        .ar-info-card {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 56px; /* leave room for HUD */
          background: rgba(255,255,255,0.97);
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          z-index: 20;
          box-shadow: 0 4px 20px rgba(0,0,0,0.14);
          animation: slideUp 0.2s ease;
        }
        @media (max-width: 640px) {
          .ar-info-card {
            right: 54px;
            left: 8px;
            bottom: 8px;
            padding: 8px 10px;
          }
        }

        /* ── SIM BADGE ── */
        .sim-badge {
          position: absolute;
          bottom: 6px;
          left: 6px;
          background: #1a5c2a;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 10;
        }

        /* ── SCANNER OVERLAY ── */
        .scanner-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(10px);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 16px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          animation: fadeIn 0.15s ease;
        }
      `}</style>

      {/* ── TOP HEADER BAR ── */}
      <header style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 10px",
        background: "rgba(10,15,10,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0, zIndex: 40,
        minHeight: 50,
      }}>
        <button onClick={onBack} className="hud-btn" style={{ flexShrink: 0 }}>
          <ArrowLeft size={16} />
        </button>

        {/* On desktop: selects in header. On mobile: in sub-bar below */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1, minWidth: 0 }}>
            <div className="stall-select">
              <label>START:</label>
              <select value={selectedStartId} onChange={e => {
                const val = e.target.value;
                setSelectedStartId(val);
                gpsAnchorRef.current = null;
                if (val !== "custom") {
                  const found = HALLWAYS.find(h => h.id === val);
                  if (found) {
                    setUserX(found.x);
                    setUserY(found.y);
                    setToastMsg(`Starting point set to ${found.label}`);
                  }
                }
              }} style={{ maxWidth: 160 }}>
                <option value="custom" disabled={selectedStartId !== "custom"}>Custom Location</option>
                {HALLWAYS.map(h => (
                  <option key={h.id} value={h.id}>{h.label}</option>
                ))}
              </select>
            </div>
            <div className="stall-select">
              <label>SECTION:</label>
              <select value={selectedCategory} onChange={e => {
                const cat = e.target.value;
                setSelectedCategory(cat);
                const filtered = cat === "all" ? stallsList : stallsList.filter(s => s.category === cat);
                if (filtered.length > 0) setSelectedStallId(filtered[0].id);
              }}>
                <option value="all">All Sections</option>
                <option value="meat">🥩 Meat</option>
                <option value="fish">🐟 Fishes</option>
                <option value="veggies">🥬 Vegetables</option>
              </select>
            </div>
            <div className="stall-select">
              <label>STALL:</label>
              <select value={selectedStallId} onChange={e => setSelectedStallId(e.target.value)}
                style={{ maxWidth: 180 }}>
                {(selectedCategory === "all" ? stallsList : stallsList.filter(s => s.category === selectedCategory)).map(s => (
                  <option key={s.id} value={s.id}>{s.label} - {s.zone}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isMobile && <div style={{ flex: 1 }} />}

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => setCameraEnabled(c => !c)} className={`hud-btn${cameraEnabled ? " active" : ""}`} title={cameraEnabled ? "Turn Camera Off" : "Turn Camera On"}>
            {cameraEnabled ? <Camera size={15} /> : <CameraOff size={15} />}
          </button>
          <button onClick={() => setShowHelp(h => !h)} className={`hud-btn${showHelp ? " active" : ""}`}>
            <HelpCircle size={15} />
          </button>
        </div>
      </header>

      {/* ── SEARCH BAR HUD INPUT PANEL ── */}
      <div style={{
        padding: "8px 10px",
        background: "rgba(10,15,10,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        zIndex: 35,
        position: "relative",
      }}>
        <div style={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
        }}>
          <input
            type="text"
            placeholder="Search stall (e.g. 'Stall 11', 'Zone E', 'veggies')..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearchSubmit();
            }}
            style={{
              width: "100%",
              padding: "6px 12px",
              paddingRight: "30px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
              outline: "none",
              transition: "border-color 0.2s, background-color 0.2s",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 8,
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button
          onClick={handleSearchSubmit}
          style={{
            padding: "6px 14px",
            background: "#e8621a",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "background 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          Find
        </button>
      </div>

      {/* Mobile-only: selects in a scrollable sub-bar */}
      {isMobile && (
        <div className="header-selects-bar">
          <div className="stall-select" style={{ flexShrink: 0 }}>
            <label>START:</label>
            <select value={selectedStartId} onChange={e => {
              const val = e.target.value;
              setSelectedStartId(val);
              gpsAnchorRef.current = null;
              if (val !== "custom") {
                const found = HALLWAYS.find(h => h.id === val);
                if (found) {
                  setUserX(found.x);
                  setUserY(found.y);
                  setToastMsg(`Starting point set to ${found.label}`);
                }
              }
            }} style={{ maxWidth: 100 }}>
              <option value="custom" disabled={selectedStartId !== "custom"}>Custom</option>
              {HALLWAYS.map(h => (
                <option key={h.id} value={h.id}>{h.label.replace("Hallway ", "H")}</option>
              ))}
            </select>
          </div>
          <div className="stall-select" style={{ flexShrink: 0 }}>
            <label>SEC:</label>
            <select value={selectedCategory} onChange={e => {
              const cat = e.target.value;
              setSelectedCategory(cat);
              const filtered = cat === "all" ? stallsList : stallsList.filter(s => s.category === cat);
              if (filtered.length > 0) setSelectedStallId(filtered[0].id);
            }}>
              <option value="all">All</option>
              <option value="meat">🥩 Meat</option>
              <option value="fish">🐟 Fish</option>
              <option value="veggies">🥬 Veg</option>
            </select>
          </div>
          <div className="stall-select" style={{ flex: 1, minWidth: 0 }}>
            <label>STALL:</label>
            <select value={selectedStallId} onChange={e => setSelectedStallId(e.target.value)}
              style={{ maxWidth: "100%", minWidth: 0 }}>
              {(selectedCategory === "all" ? stallsList : stallsList.filter(s => s.category === selectedCategory)).map(s => (
                <option key={s.id} value={s.id}>{s.label} - {s.zone}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── MAIN BODY ── */}
      <div className="ar-body">

        {/* ── AR VIEWPORT ── */}
        <div className="ar-viewport">

          {/* Camera / Simulated BG */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            {cameraActive && !cameraError && cameraEnabled ? (
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "linear-gradient(135deg, #f0faf2 0%, #e8f5e9 100%)", textAlign: "center", padding: 16 }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(26,92,42,0.1)", border: "1px solid rgba(26,92,42,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CameraOff size={22} color="#1a5c2a" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
                    {!cameraEnabled ? "Camera Feed Turned Off" : "AR Navigation Feed Active"}
                  </p>
                  <p style={{ fontSize: 10, color: "#64748b", maxWidth: 220, margin: 0 }}>
                    {!cameraEnabled ? "Camera disabled. Use simulated perspective." : "Real-world camera stream mock. Rotate device or use HUD controls."}
                  </p>
                </div>
                {cameraError && cameraEnabled && (
                  <p style={{ fontSize: 9, color: "#92400e", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 999, padding: "4px 12px", margin: 0 }}>{cameraError}</p>
                )}
                <button onClick={cameraEnabled ? startCamera : () => setCameraEnabled(true)}
                  style={{ padding: "7px 16px", background: "#1a5c2a", color: "#fff", fontSize: 11, fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer" }}>
                  {cameraEnabled ? "Retry Camera" : "Enable Camera"}
                </button>
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.2) 100%)", pointerEvents: "none" }} />
          </div>

          {/* ── AR OVERLAYS ── */}
          <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>

            {/* Toast */}
            {toastMsg && (
              <div className="toast" style={{ pointerEvents: "auto" }}>
                <Check size={13} color="#22c55e" />
                <span>{toastMsg}</span>
              </div>
            )}

            {/* Help Panel */}
            {showHelp && (
              <div className="animate-fadeIn" style={{
                position: "absolute", top: 10, left: 10, right: 54,
                background: "rgba(255,255,255,0.98)", border: "1px solid #e2e8f0",
                borderRadius: 14, padding: "12px 14px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)", pointerEvents: "auto", zIndex: 20
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #f1f5f9", paddingBottom: 8, marginBottom: 8 }}>
                  <Info size={13} color="#1a5c2a" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>AR Navigation Guide</span>
                  <button onClick={() => setShowHelp(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}><X size={14} /></button>
                </div>
                <ul style={{ fontSize: 11, color: "#475569", paddingLeft: 16, margin: 0, lineHeight: 1.7 }}>
                  <li>Select your starting hallway using the <strong>Starting Point</strong> selector.</li>
                  <li>Follow floating orange dots and direction indicator in the camera view.</li>
                  <li>Use the right-side HUD to simulate walking or rotating.</li>
                  <li>Tap anywhere on the floor map to set your position manually.</li>
                </ul>
              </div>
            )}

            {/* AR Path Dots */}
            {arPathDots.map((dot, i) => (
              <div key={i} style={{
                position: "absolute",
                left: `${dot.proj.xPct}%`, top: `${dot.proj.yPct}%`,
                transform: `translate(-50%,-50%) scale(${dot.proj.scale})`,
                width: 11, height: 11, borderRadius: "50%",
                background: "rgba(232,98,26,0.88)",
                border: "1.5px solid rgba(255,255,255,0.5)",
                boxShadow: "0 0 6px rgba(232,98,26,0.5)",
              }} />
            ))}

            {/* AR Target Marker / Off-screen indicator */}
            {targetProj.isVisible ? (
              <div style={{
                position: "absolute",
                left: `${targetProj.xPct}%`, top: `${targetProj.yPct}%`,
                transform: `translate(-50%,-50%) scale(${targetProj.scale})`,
                display: "flex", flexDirection: "column", alignItems: "center",
                animation: "pulse 1.5s ease-in-out infinite"
              }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(232,98,26,0.95)", border: "2.5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 16px rgba(232,98,26,0.5)" }}>
                  <Navigation size={20} color="#fff" style={{ transform: `rotate(${targetBearing - heading}deg)` }} />
                </div>
                <div style={{ marginTop: 6, background: "rgba(255,255,255,0.97)", border: "1px solid #e2e8f0", borderRadius: 10, padding: "4px 10px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", maxWidth: 160 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentStall.label}</div>
                  <div style={{ fontSize: 9, color: "#e8621a", fontWeight: 700 }}>{totalDistance}m away · {getETA(totalDistance)}</div>
                </div>
              </div>
            ) : (
              <div style={{ position: "absolute", inset: "0 52px", top: "38%", display: "flex", alignItems: "flex-start", justifyContent: relNextAngle < 0 ? "flex-start" : "flex-end" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.97)", border: "1px solid #e2e8f0", borderRadius: 999, padding: "6px 12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", animation: "pulse 1s ease-in-out infinite" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#1e293b" }}>{relNextAngle < 0 ? "◀ Turn Left" : "Turn Right ▶"}</span>
                  <span style={{ fontSize: 9, color: "#e8621a", fontWeight: 700 }}>{Math.round(Math.abs(relNextAngle))}°</span>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT HUD CONTROLS ── */}
          <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", zIndex: 20, display: "flex", flexDirection: "column", gap: 5 }}>
            <button
              onClick={toggleGps}
              className={`ctrl-btn${gpsActive ? " primary" : ""}`}
              style={gpsActive ? { background: "#1a5c2a", color: "#fff", borderColor: "#1a5c2a", marginBottom: 4 } : { marginBottom: 4 }}
              title={gpsActive ? "Disable GPS Tracking" : "Enable GPS Tracking"}
            >
              <Locate size={15} />
            </button>
            {!hasOrientation && (
              <button onClick={requestCompassPermission} className="ctrl-btn" style={{ background: "#e8621a", color: "#fff", borderColor: "#e8621a", marginBottom: 4 }} title="Request Compass">
                <Compass size={15} />
              </button>
            )}
            <div style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(226,232,240,0.8)", borderRadius: 12, padding: 5, display: "flex", flexDirection: "column", gap: 4, backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
              <button onClick={handleStepForward} className="ctrl-btn primary" title="Step Forward"><Navigation size={14} /></button>
              <button onClick={handleRotateLeft} className="ctrl-btn" title="Rotate Left"><RotateCw size={13} style={{ transform: "scaleX(-1)" }} /></button>
              <button onClick={handleRotateRight} className="ctrl-btn" title="Rotate Right"><RotateCw size={13} /></button>
              <div style={{ height: 1, background: "rgba(226,232,240,0.8)", margin: "1px 0" }} />
              <button onClick={handleResetPosition} className="ctrl-btn" title="Reset Position" style={{ fontSize: 7, fontWeight: 800, color: "#64748b" }}>RST</button>
            </div>
          </div>

          {/* ── BOTTOM INFO CARD ── */}
          {showCard && (
            <div className="ar-info-card" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifycontent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(232,98,26,0.1)", border: "1px solid rgba(232,98,26,0.2)", display: "flex", alignItems: "center", justifycontent: "center", flexShrink: 0 }}>
                    <Navigation size={15} color="#e8621a" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
                      <span style={{ fontSize: 8, fontWeight: 800, color: "#1a5c2a", textTransform: "uppercase", letterSpacing: "0.06em" }}>Target</span>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e8621a", display: "inline-block" }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentStall.label}</div>
                    <div style={{ fontSize: 9, color: "#64748b" }}>{currentStall.zone} · <span style={{ color: "#e8621a", fontWeight: 700 }}>{totalDistance}m ({getETA(totalDistance)})</span></div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
                  <button onClick={() => setShowStartSelector(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", background: "#1a5c2a", color: "#fff", fontSize: 10, fontWeight: 700, border: "none", borderRadius: 9, cursor: "pointer", whiteSpace: "nowrap" }}>
                    <Navigation size={12} /><span>Start Point</span>
                  </button>
                  <button onClick={() => setShowCard(false)} style={{ width: 28, height: 28, borderRadius: 7, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifycontent: "center", cursor: "pointer", color: "#64748b", flexShrink: 0 }}>
                    <X size={12} />
                  </button>
                </div>
              </div>
              {searchDirections && (
                <div style={{
                  fontSize: 10,
                  color: "#1e293b",
                  lineHeight: "1.4",
                  background: "rgba(232,98,26,0.06)",
                  borderLeft: "2px solid #e8621a",
                  padding: "6px 10px",
                  borderRadius: "0 6px 6px 0",
                  maxHeight: "80px",
                  overflowY: "auto",
                  width: "100%",
                }}>
                  <span style={{ fontWeight: "800", color: "#e8621a" }}>Directions: </span>
                  {searchDirections}
                </div>
              )}
            </div>
          )}

          {!showCard && (
            <button onClick={() => setShowCard(true)} style={{ position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.95)", border: "1px solid #e2e8f0", borderRadius: 999, padding: "6px 12px", fontSize: 10, fontWeight: 700, color: "#1e293b", cursor: "pointer", zIndex: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <Info size={11} color="#e8621a" /><span>Show Info</span>
            </button>
          )}
        </div>

        {/* ── MAP PANEL ── */}
        <div
          className={`ar-map-panel${!isMobile && mapCollapsed ? " collapsed-desktop" : ""}`}
          style={isMobile ? { height: mapCollapsed ? MAP_HEADER_H : MAP_EXPANDED_H } : {}}
        >
          {/* Map header */}
          <div className="ar-map-header" onClick={() => setMapCollapsed(c => !c)}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Map size={13} color="#e8621a" style={{ flexShrink: 0 }} />
              {(!isMobile ? !mapCollapsed : true) && (
                <span className="ar-map-header-label">
                  {isMobile
                    ? mapCollapsed ? "Show Floor Map" : "Hide Floor Map"
                    : "Floor Map"}
                </span>
              )}
            </div>
            {(!isMobile ? !mapCollapsed : true) && (
              <div style={{ color: "#94a3b8", flexShrink: 0 }}>
                {isMobile
                  ? (mapCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />)
                  : (mapCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />)
                }
              </div>
            )}
          </div>

          {/* Map body — hidden when collapsed */}
          {(!mapCollapsed || (!isMobile && !mapCollapsed)) && (
            <div className="ar-map-body">
              <svg
                viewBox="0 0 2305 1824"
                preserveAspectRatio="xMidYMid meet"
                onClick={handleMapClick}
                style={{ width: "100%", height: "100%", cursor: "crosshair", userSelect: "none" }}
              >
                <image xlinkHref={mapImage} href={mapImage} x="-20" y="-15" width="2305" height="1824" preserveAspectRatio="none" />

                {/* Stalls */}

                {stallsList.filter(s => selectedCategory === "all" || s.category === selectedCategory).map(s => {
                  const isSelected = s.id === selectedStallId;

                  // Color according to dynamic database status
                  let circleColor = "rgba(226,232,240,0.9)";
                  let textColor = "#1e293b";
                  let strokeColor = "#ffffff";
                  let strokeWidth = "2.5";

                  if (isSelected) {
                    circleColor = "#e8621a";
                    textColor = "#ffffff";
                    strokeColor = "#ffffff";
                    strokeWidth = "3.5";
                  } else if (s.status === "available") {
                    circleColor = "rgba(34, 197, 94, 0.9)"; // Brighter theme green matching InteractiveStallMap
                    textColor = "#ffffff";
                    strokeColor = "#ffffff";
                  } else if (s.status === "occupied") {
                    circleColor = "rgba(239, 68, 68, 0.9)"; // Brighter occupied red matching InteractiveStallMap
                    textColor = "#ffffff";
                    strokeColor = "#ffffff";
                  } else if (s.status === "pending") {
                    circleColor = "rgba(245, 158, 11, 0.9)"; // Brighter pending orange matching InteractiveStallMap
                    textColor = "#ffffff";
                    strokeColor = "#ffffff";
                  }

                  return (
                    <g key={s.id} transform={`translate(${s.x},${s.y})`}>
                      <circle r="18" fill={circleColor} stroke={strokeColor} strokeWidth={strokeWidth} />
                      <text
                        y="0"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="13"
                        fontWeight="900"
                        fill={textColor}
                        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
                      >
                        {getCircleDisplayNumber(s.rawId)}
                      </text>
                    </g>
                  );
                })}

                <polyline
                  points={pathPoints.map(p => `${p.x},${p.y}`).join(" ")}
                  fill="none" stroke="#e8621a" strokeWidth="10"
                  strokeDasharray="15 15" strokeLinecap="round" strokeLinejoin="round"
                />

                <g transform={`translate(${userX},${userY})`}>
                  <path d="M0 0 L-70 -120 A140 140 0 0 1 70 -120 Z" fill="rgba(26,92,42,0.22)" transform={`rotate(${heading})`} style={{ transformOrigin: "0px 0px" }} />
                  <g transform={`rotate(${heading})`}>
                    <circle r="25" fill="#1a5c2a" stroke="#fff" strokeWidth="4" />
                    <path d="M0 -15 L12 10 L0 4 L-12 10 Z" fill="#fff" />
                  </g>
                </g>
              </svg>

              <div className="sim-badge">
                <Compass size={10} className="animate-spin-slow" />
                <span>{userX}, {userY} | {heading}°</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STARTING POINT SELECTOR OVERLAY ── */}
      {showStartSelector && (
        <div className="scanner-overlay" style={{ background: "rgba(10,15,10,0.98)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 440, gap: 14 }}>
            <div style={{ textAlign: "center", width: "100%" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Select Starting Point</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0 }}>Choose a hallway or entrance as your navigation start location.</p>
            </div>

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, maxHeight: "65vh", overflowY: "auto", paddingRight: 4 }}>
              {Object.entries(HALLWAY_GROUPS).map(([groupName, items]) => (
                <div key={groupName} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#e8621a", textTransform: "uppercase", letterSpacing: "0.06em", paddingLeft: 4, marginTop: 4 }}>{groupName}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 6 }}>
                    {items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectStartPoint(item)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          background: selectedStartId === item.id ? "#1a5c2a" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${selectedStartId === item.id ? "#22c55e" : "rgba(255,255,255,0.12)"}`,
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                          cursor: "pointer",
                          transition: "background 0.2s, border-color 0.2s",
                          textAlign: "left"
                        }}
                      >
                        <span>{item.label}</span>
                        {selectedStartId === item.id && <Check size={12} color="#22c55e" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowStartSelector(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 20px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                marginTop: 8
              }}
            >
              <X size={14} /><span>Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}