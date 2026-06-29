const fs = require('fs');
const path = 'c:/Users/Val/Desktop/MyTalipapa/client/src/pages/Renter/ArFinder.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove motionActive, stepCount
content = content.replace(/const \[motionActive, setMotionActive\] = useState\(false\);\n/, '');
content = content.replace(/const \[stepCount, setStepCount\] = useState\(0\);\n/, '');

// 2. Remove userYRef and getStepSize
content = content.replace(/\/\/ NEW: Keep userYRef in sync[\s\S]*?return 30;\n  };\n/, '');

// 3. Remove step detection useEffect completely
content = content.replace(/\/\/ ── Step Detection Effect \(FIXED\) ───────────────────────[\s\S]*?return \(\) => window.removeEventListener\('devicemotion', handleMotion\);\n  \}, \[motionActive\]\);\n/, '');

// 4. Update the span displaying stepCount
content = content.replace(/\{heading\}°\{motionActive \? \` \| \$\{stepCount\}\` : ''\}/g, '{heading}°');

// 5. Update the foot toggle button in ArScannerOverlay usage inside ArFinder
content = content.replace(/\{motionActive && \([\s\S]*?<\/span>\n              \)\}/, '');
content = content.replace(/<button\s+onClick=\{.*setMotionActive.*?\s+className=\{`ctrl-btn\$\{motionActive \? " motion-on" : ""\}`\}[\s\S]*?<\/button>/, '');

// 6. Add advanceToNextCheckpoint function before `const handleMapClick`
const advanceFn = `
  const advanceToNextCheckpoint = (e) => {
    if (e) e.stopPropagation();
    const path = findRoute({ x: userX, y: userY }, { x: currentStall.x, y: currentStall.y });
    if (path.length > 1) {
      let nextIndex = 1;
      const ARRIVED_THRESHOLD = 80;
      while (nextIndex < path.length && Math.sqrt((userX - path[nextIndex].x) ** 2 + (userY - path[nextIndex].y) ** 2) < ARRIVED_THRESHOLD) {
        nextIndex++;
      }
      const nextWP = path[nextIndex] || currentStall;
      setUserX(nextWP.x);
      setUserY(nextWP.y);
      setToastMsg("Advanced to next checkpoint.");
    }
  };
`;
content = content.replace(/const handleMapClick = \(e\) => \{/, advanceFn + '\n  const handleMapClick = (e) => {');

// 7. Add the Next Checkpoint button to the ArScannerOverlay or map overlay
// We'll put it in ArScannerOverlay usage
const nextBtn = `
            {pathPoints && pathPoints.length > 1 && !hasArrived && (
              <button 
                onClick={advanceToNextCheckpoint}
                className="ctrl-btn motion-on"
                title="Next Checkpoint"
              >
                <Footprints size={22} />
                <span>Next Step</span>
              </button>
            )}
`;
content = content.replace(/<button\s+onClick=\{.*setCameraActive.*?\s+className="ctrl-btn"/, nextBtn + '\n              <button\n                onClick={() => setCameraActive(!cameraActive)}\n                className="ctrl-btn"');

fs.writeFileSync(path, content);
console.log('Processed ArFinder.jsx');
