const fs = require('fs');
const path = 'c:/Users/Val/Desktop/MyTalipapa/client/src/pages/Renter/ArFinder.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove state declarations
content = content.replace(/const \[motionActive, setMotionActive\] = useState\(false\);\n/, '');
content = content.replace(/const \[stepCount, setStepCount\] = useState\(0\);\n/, '');

// 2. Remove userYRef and getStepSize
content = content.replace(/\/\/ NEW: Keep userYRef in sync for zone-aware step size calculations[\s\S]*?return 30;\n  };\n/, '');

// 3. Remove step detection useEffect completely
content = content.replace(/\/\/ ── Step Detection Effect \(FIXED\) ───────────────────────[\s\S]*?return \(\) => window\.removeEventListener\('devicemotion', handleMotion\);\n  \}, \[motionActive\]\);\n/, '');

// 4. Update the span displaying stepCount
content = content.replace(/\{heading\}°\{motionActive \? \` \| \$\{stepCount\}\` : ''\}/g, '{heading}°');

// 5. Update the foot toggle button in ArFinder
content = content.replace(/\{\/\* Step Detection Button \*\/\}\s*<button[\s\S]*?<\/button>/, '');

// 6. Remove the step badge overlay
content = content.replace(/\{\/\* Step counter badge — only shown when motion is active \*\/\}\s*\{motionActive && \([\s\S]*?<\/div>\n\s*\)\}/, '');

// 7. Update help text
content = content.replace(/<li>Tap <strong>STEP<\/strong> to enable automatic step detection — walk and the map updates automatically!<\/li>/, '<li>Tap <strong>Next Checkpoint</strong> to manually advance your location along the route.</li>');

// 8. Add advanceToNextCheckpoint function before `const handleMapClick`
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

// 9. Inject Next Checkpoint button before GPS Button
const nextBtn = `
            {/* Next Checkpoint Button */}
            {pathPoints && pathPoints.length > 1 && !isArrived && (
              <button 
                onClick={advanceToNextCheckpoint}
                className="ctrl-btn motion-on"
                style={{ marginBottom: 4 }}
                title="Next Checkpoint"
              >
                <Footprints size={17} />
              </button>
            )}
`;
content = content.replace(/\{\/\* GPS Button \*\/\}/, nextBtn + '\n            {/* GPS Button */}');

fs.writeFileSync(path, content);
console.log('ArFinder perfectly refactored.');
