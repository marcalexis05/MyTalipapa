// scripts/generateStallMap.js (CommonJS compatible)

const fs = require('fs');
const path = require('path');

// Resolve project paths
const projectRoot = path.resolve(__dirname, '..');
const exportDir = path.join(projectRoot, 'client', 'public', 'export360');
const coordsPath = path.join(projectRoot, 'client', 'src', 'utils', 'coords_dict.js');
const orientationPath = path.join(projectRoot, 'client', 'src', 'utils', 'orientation.js');
const outputPath = path.join(projectRoot, 'client', 'src', 'utils', 'stallMap.js');

// Helper to import ES modules in CommonJS
async function importESM(filePath) {
  const url = require('url').pathToFileURL(filePath).href;
  return import(url);
}

(async () => {
  const { SVG_STALL_COORDS } = await importESM(coordsPath);
  let STALL_ORIENTATION = { meat: {}, fish: {}, veggies: {} };
  try {
    const orientationModule = await importESM(orientationPath);
    STALL_ORIENTATION = orientationModule.STALL_ORIENTATION || STALL_ORIENTATION;
  } catch (e) {
    // ignore if missing
  }

  function parseFilename(filename) {
    const name = filename.replace(/\.(jpg|jpeg)$/i, '').trim();
    const idMatch = name.match(/stall([\d]+(?:\(u\d*\))?)/i);
    if (!idMatch) return null;
    const id = idMatch[1];
    let category = 'meat';
    if (/fish/i.test(name)) category = 'fish';
    else if (/veg|veggies|vegetable/i.test(name)) category = 'veggies';
    return { id, category };
  }

  function getDefaultNorthOffset(x) {
    if (x <= 350) return -90;
    if (x > 350 && x <= 550) return 90;
    if (x > 550 && x <= 850) return -90;
    if (x > 850 && x <= 1050) return 90;
    if (x > 1050 && x <= 1350) return -90;
    if (x > 1350 && x <= 1550) return 90;
    if (x > 1550 && x <= 1850) return -90;
    return 90;
  }

  const files = fs.readdirSync(exportDir).filter(f => /\.(jpe?g)$/i.test(f));
  const stallMap = {};

  for (const file of files) {
    const parsed = parseFilename(file);
    if (!parsed) continue;
    const { id, category } = parsed;
    const key = `${category}-${id}`;
    const raw = SVG_STALL_COORDS[key] || SVG_STALL_COORDS[id] || SVG_STALL_COORDS[`${category}-${id.replace(/\(.*\)/, '')}`];
    if (!raw) continue;
    const northOffset = (STALL_ORIENTATION[category] && STALL_ORIENTATION[category][id] !== undefined)
      ? STALL_ORIENTATION[category][id]
      : getDefaultNorthOffset(raw.x);
    if (!stallMap[category]) stallMap[category] = {};
    stallMap[category][id] = { x: raw.x, y: raw.y, northOffset };
  }

  const outputContent = `// Auto‑generated stall map – do not edit manually\nexport const STALL_MAP = ${JSON.stringify(stallMap, null, 2)};`;
  fs.writeFileSync(outputPath, outputContent, 'utf8');
  console.log('Stall map generated at', outputPath);
})();
