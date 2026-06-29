const fs = require('fs');

// We have to mock coords_dict since it's an ES module or we can just redefine the coords
// Or we can just import it if we run with a bundler... let's just parse it directly or redefine it here.
// Since it's an ES module, we can read the file and extract the coords.
const coordsPath = './client/src/utils/coords_dict.js';
const content = fs.readFileSync(coordsPath, 'utf8');

// Extract the object using regex or just eval (it's safe here)
const objStr = content.match(/export const SVG_STALL_COORDS = ({[\s\S]*?});/)[1];
const coords = eval('(' + objStr + ')');

let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2305 1824">\n';
svg += '  <rect x="0" y="0" width="2305" height="1824" fill="#f8fafc" />\n';
svg += '  <rect x="150" y="100" width="1950" height="1650" fill="#ffffff" stroke="#e2e8f0" stroke-width="16" rx="24" />\n';

svg += '  <text x="1152" y="160" text-anchor="middle" fill="#94a3b8" font-size="42" font-weight="800" letter-spacing="12" font-family="sans-serif">NORTH PATHWAY</text>\n';
svg += '  <text x="1152" y="870" text-anchor="middle" fill="#94a3b8" font-size="42" font-weight="800" letter-spacing="12" font-family="sans-serif">CENTRAL PATHWAY</text>\n';
svg += '  <text x="1152" y="1690" text-anchor="middle" fill="#94a3b8" font-size="42" font-weight="800" letter-spacing="12" font-family="sans-serif">MAIN ENTRANCE / EXIT</text>\n';

const stalls = Object.entries(coords).map(([key, c]) => {
  const category = key.split('-')[0];
  const rawNum = key.split('-')[1];
  let displayNum = rawNum.replace(/\(u\d*\)/g, '');
  if (displayNum.startsWith('nostallnum')) displayNum = '';
  if (displayNum.startsWith('empty')) displayNum = '';
  return { id: key, category, displayNum, ...c };
});

// Group by column (x) to find dynamic heights
const cols = {};
stalls.forEach(s => {
  if (!cols[s.x]) cols[s.x] = [];
  cols[s.x].push(s);
});

Object.values(cols).forEach(col => col.sort((a, b) => a.y - b.y));

stalls.forEach(s => {
  let fill = '#e2e8f0'; 
  let stroke = '#cbd5e1';
  let textColor = '#64748b';
  
  if (s.category === 'meat') { fill = '#fee2e2'; stroke = '#fca5a5'; textColor = '#ef4444'; }
  else if (s.category === 'fish') { fill = '#dbeafe'; stroke = '#93c5fd'; textColor = '#3b82f6'; }
  else if (s.category === 'veggies') { fill = '#dcfce7'; stroke = '#86efac'; textColor = '#22c55e'; }

  // Calculate dynamic height to prevent overlapping
  const col = cols[s.x];
  const idx = col.findIndex(c => c.id === s.id);
  let height = 64;
  if (idx < col.length - 1) {
    const nextY = col[idx + 1].y;
    const gap = nextY - s.y;
    if (gap < 68) {
      height = gap - 4; // 4px margin
    }
  }
  const rectY = -(height / 2);

  // Dynamic font size
  let fontSize = 28;
  if (height < 30) fontSize = 16;
  else if (height < 45) fontSize = 20;

  svg += `  <g transform="translate(${s.x},${s.y})">\n`;
  svg += `    <rect x="-78" y="${rectY}" width="156" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="4" rx="8" />\n`;
  if (s.displayNum) {
    // vertical center text
    const textY = (height < 30) ? 5 : 9;
    svg += `    <text x="0" y="${textY}" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="bold" font-family="sans-serif">${s.displayNum}</text>\n`;
  }
  svg += `  </g>\n`;
});

svg += '</svg>';
fs.writeFileSync('./client/src/images/CleanFloorMap.svg', svg);
console.log('SVG written to client/src/images/CleanFloorMap.svg');
