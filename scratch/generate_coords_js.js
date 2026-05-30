const fs = require('fs');
const path = require('path');

const mappedStalls = require('./mapped_stalls.json');

const coordsMap = {};

// Hardcode the ID-based meat mappings in the same format
const idMap = {
  // Zone A
  'meat-1': { x: 195, y: 530 },
  'meat-2': { x: 195, y: 450 },
  'meat-3': { x: 195, y: 370 },
  'meat-4': { x: 195, y: 280 },
  'meat-5': { x: 195, y: 190 },
  'meat-empty': { x: 195, y: 530 },
  'meat-empty2': { x: 195, y: 450 },
  'meat-empty3': { x: 195, y: 370 },

  // Zone E
  'meat-6': { x: 195, y: 1040 },
  'meat-7': { x: 195, y: 980 },
  'meat-11': { x: 195, y: 740 },
  'meat-12': { x: 195, y: 700 }, // Zone E meat 12
  'meat-13': { x: 345, y: 1360 }, // Zone E meat 13
  'meat-14': { x: 345, y: 1300 },
  'meat-15': { x: 345, y: 1240 },
  'meat-16': { x: 345, y: 1180 },
  'meat-17': { x: 345, y: 1120 },
  'meat-18': { x: 345, y: 1060 },
  'meat-19': { x: 345, y: 1000 },
  'meat-20': { x: 345, y: 940 },
  'meat-21': { x: 345, y: 880 },
  'meat-22': { x: 345, y: 820 },
  'meat-23': { x: 345, y: 760 },
  'meat-24': { x: 345, y: 700 },

  // Zone F Meat duplicates
  'meat-1(u2)': { x: 695, y: 1360 },
  'meat-2(u2)': { x: 695, y: 1280 },
  'meat-3(u2)': { x: 695, y: 1220 },
  'meat-4(u2)': { x: 695, y: 1160 },
  'meat-8(u2)': { x: 695, y: 940 },
  'meat-9(u2)': { x: 695, y: 880 },
  'meat-10(u2)': { x: 695, y: 820 }
};

// Fishes special mappings for unnumbered
const fishNostallnumMap = {
  'fish-nostallnum1': { x: 1840, y: 530 },
  'fish-nostallnum2': { x: 1840, y: 470 },
  'fish-nostallnum3': { x: 1840, y: 410 },
  'fish-nostallnum4': { x: 1840, y: 350 },
  'fish-nostallnum5': { x: 1840, y: 290 }
};

mappedStalls.forEach(s => {
  const key = `${s.category}-${s.stallNum}`;
  coordsMap[key] = { x: s.cx, y: s.cy };
});

// Overwrite with exact explicit maps
Object.assign(coordsMap, idMap);
Object.assign(coordsMap, fishNostallnumMap);

// Output JS code
const jsCode = `export const SVG_STALL_COORDS = ${JSON.stringify(coordsMap, null, 2)};\n`;
fs.writeFileSync(path.join(__dirname, '../client/src/utils/coords_dict.js'), jsCode);
console.log("Dictionary JS generated in client/src/utils/coords_dict.js");
