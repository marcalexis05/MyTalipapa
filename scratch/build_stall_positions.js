const fs = require('fs');
const path = require('path');

const mappedStalls = require('./mapped_stalls.json');

const stallPositions = [];

mappedStalls.forEach(s => {
  const cleanNum = s.stallNum.trim().replace(/^0+(?=\d)/, '');
  stallPositions.push({
    zone: s.zone,
    number: cleanNum,
    category: s.category,
    circleX: s.cx,
    circleY: s.cy,
    circleRadius: 18,
    boxX: s.x,
    boxY: s.y,
    boxWidth: s.width,
    boxHeight: s.height
  });
});

// Remove any duplicates based on category, zone, number
const uniqueMap = {};
const uniquePositions = [];

stallPositions.forEach(pos => {
  const key = `${pos.category}-${pos.zone}-${pos.number}`;
  if (!uniqueMap[key]) {
    uniqueMap[key] = true;
    uniquePositions.push(pos);
  }
});

const outPath = path.join(__dirname, '../client/src/utils/stall_positions.js');
const fileContent = `// Automatically generated from mapped_stalls.json
export const STALL_POSITIONS = ${JSON.stringify(uniquePositions, null, 2)};
`;

fs.writeFileSync(outPath, fileContent, 'utf8');
console.log(`Generated ${uniquePositions.length} unique stall positions in ${outPath}`);
