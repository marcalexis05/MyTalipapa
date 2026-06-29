const fs = require('fs');
const path = 'c:/Users/Val/Desktop/MyTalipapa/client/src/pages/Renter/ArFinder.jsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const out = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('const [motionActive, setMotionActive] = useState(false);')) continue;
  if (line.includes('const [stepCount, setStepCount] = useState(0);')) continue;
  
  if (line.includes('// NEW: Keep userYRef in sync')) {
    skip = true;
    continue;
  }
  if (skip && line.includes('  };')) { // end of getStepSize
    skip = false;
    continue;
  }
  if (skip) continue;

  if (line.includes('// ── Step Detection Effect (FIXED) ───────────────────────')) {
    skip = true;
    continue;
  }
  if (skip && line.includes('  }, [motionActive]);')) {
    skip = false;
    continue;
  }
  if (skip) continue;

  if (line.includes('const handleMapClick = (e) => {')) {
    out.push(`
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
    `);
  }

  // Handle span interpolation replacement
  let modLine = line.replace(/\{heading\}°\{motionActive \? \` \| \$\{stepCount\}\` : ''\}/, '{heading}°');
  
  if (modLine.includes('{/* Step Detection Button */}')) {
    skip = true;
    // Inject Next Checkpoint button here instead
    out.push(`            {/* Next Checkpoint Button */}`);
    out.push(`            {pathPoints && pathPoints.length > 1 && !hasArrived && (`);
    out.push(`              <button`);
    out.push(`                onClick={advanceToNextCheckpoint}`);
    out.push(`                className="ctrl-btn motion-on"`);
    out.push(`                style={{ marginBottom: 4 }}`);
    out.push(`                title="Advance to next checkpoint"`);
    out.push(`              >`);
    out.push(`                <Footprints size={17} />`);
    out.push(`              </button>`);
    out.push(`            )}`);
    continue;
  }
  if (skip && modLine.includes('</button>')) {
    skip = false;
    continue;
  }
  if (skip) continue;

  // Handle ArScannerOverlay usage
  if (modLine.includes('motionActive={motionActive}')) {
    modLine = modLine.replace('motionActive={motionActive}', '');
  }
  if (modLine.includes('stepCount={stepCount}')) {
    modLine = modLine.replace('stepCount={stepCount}', '');
  }

  out.push(modLine);
}

fs.writeFileSync(path, out.join('\n'));
console.log('ArFinder refactored.');
