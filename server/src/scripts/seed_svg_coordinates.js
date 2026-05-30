const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Stall = require('../models/Stall');
const svgStalls = require('../../../scratch/mapped_stalls.json');

// Exact ID-based mappings for duplicate Meat stalls
const idMap = {
  // Stall 1
  '000000000000000000000001': { zone: 'A', cx: 195, cy: 560, x: 120, y: 530, hallway: 'hallway1' },
  '6a18a4dbc46e4ad4ad326001': { zone: 'E', cx: 195, cy: 1360, x: 120, y: 1340, hallway: 'hallway27' },
  '6a18a4dbc46e4ad4ad326002': { zone: 'F', cx: 695, cy: 1360, x: 620, y: 1340, hallway: 'hallway24' },
  
  // Stall 2
  '000000000000000000000002': { zone: 'A', cx: 195, cy: 480, x: 120, y: 450, hallway: 'hallway1' },
  '6a18a4dbc46e4ad4ad326003': { zone: 'E', cx: 195, cy: 1300, x: 120, y: 1280, hallway: 'hallway27' },
  '6a18a4dbc46e4ad4ad326004': { zone: 'F', cx: 695, cy: 1300, x: 620, y: 1280, hallway: 'hallway24' },
  
  // Stall 3
  '000000000000000000000003': { zone: 'A', cx: 195, cy: 400, x: 120, y: 370, hallway: 'hallway1' },
  '6a18a4dbc46e4ad4ad326005': { zone: 'E', cx: 195, cy: 1240, x: 120, y: 1220, hallway: 'hallway27' },
  '6a18a4dbc46e4ad4ad326006': { zone: 'F', cx: 695, cy: 1240, x: 620, y: 1220, hallway: 'hallway24' },
  
  // Stall 4
  '000000000000000000000004': { zone: 'A', cx: 195, cy: 310, x: 120, y: 280, hallway: 'hallway1' },
  '6a18a4dbc46e4ad4ad326007': { zone: 'E', cx: 195, cy: 1180, x: 120, y: 1160, hallway: 'hallway27' },
  '6a18a4dbc46e4ad4ad326008': { zone: 'F', cx: 695, cy: 1180, x: 620, y: 1160, hallway: 'hallway24' },
  
  // Stall 5
  '000000000000000000000005': { zone: 'A', cx: 195, cy: 220, x: 120, y: 190, hallway: 'hallway1' },
  '6a18a4dbc46e4ad4ad32600c': { zone: 'E', cx: 195, cy: 1120, x: 120, y: 1100, hallway: 'hallway27' },
  
  // Empty slots in Zone A
  '6a18a4dbc46e4ad4ad326009': { zone: 'A', cx: 195, cy: 560, x: 120, y: 530, hallway: 'hallway1' },
  '6a18a4dbc46e4ad4ad32600a': { zone: 'A', cx: 195, cy: 480, x: 120, y: 450, hallway: 'hallway1' },
  '6a18a4dbc46e4ad4ad32600b': { zone: 'A', cx: 195, cy: 400, x: 120, y: 370, hallway: 'hallway1' },
 
  // Stall 8
  '6a18a4dbc46e4ad4ad32600f': { zone: 'E', cx: 195, cy: 940, x: 120, y: 920, hallway: 'hallway27' },
  '6a18a4dbc46e4ad4ad326012': { zone: 'F', cx: 695, cy: 940, x: 620, y: 920, hallway: 'hallway24' },
  
  // Stall 9
  '6a18a4dbc46e4ad4ad326010': { zone: 'E', cx: 195, cy: 880, x: 120, y: 860, hallway: 'hallway27' },
  '6a18a4dbc46e4ad4ad326013': { zone: 'F', cx: 695, cy: 880, x: 620, y: 860, hallway: 'hallway24' },
  
  // Stall 10
  '6a18a4dbc46e4ad4ad326011': { zone: 'E', cx: 195, cy: 820, x: 120, y: 800, hallway: 'hallway27' },
  '6a18a4dbc46e4ad4ad326014': { zone: 'F', cx: 695, cy: 820, x: 620, y: 800, hallway: 'hallway24' },
  
  // Stall 12
  '000000000000000000000007': { zone: 'A', cx: 345, cy: 510, x: 270, y: 490, hallway: 'hallway2' },
  '6a18a4dbc46e4ad4ad326016': { zone: 'E', cx: 195, cy: 700, x: 120, y: 680, hallway: 'hallway27' },
  
  // Stall 13
  '000000000000000000000008': { zone: 'A', cx: 345, cy: 450, x: 270, y: 430, hallway: 'hallway2' },
  '6a18a4dbc46e4ad4ad326017': { zone: 'E', cx: 345, cy: 1360, x: 270, y: 1340, hallway: 'hallway25&26' }
};

// Fishes special mappings for unnumbered stalls
const fishNostallnumMap = {
  'nostallnum1': { zone: 'D', cx: 1840, cy: 530, hallway: 'hallway10' }, // near Fish 71 center
  'nostallnum2': { zone: 'D', cx: 1840, cy: 470, hallway: 'hallway10' }, // near Fish 72 center
  'nostallnum3': { zone: 'D', cx: 1840, cy: 410, hallway: 'hallway10' }, // near Fish 73 center
  'nostallnum4': { zone: 'D', cx: 1840, cy: 350, hallway: 'hallway10' }, // near Fish 74 center
  'nostallnum5': { zone: 'D', cx: 1840, cy: 290, hallway: 'hallway10' }  // near Fish 75 center
};

const getHallway = (zone, x) => {
  const zoneLetter = String(zone || '').toUpperCase();
  if (zoneLetter === 'A') {
    if (x === 120) return 'hallway1';
    return 'hallway2';
  }
  if (zoneLetter === 'B') {
    if (x === 620) return 'hallway3&4';
    return 'hallway5';
  }
  if (zoneLetter === 'C') {
    if (x === 1120) return 'hallway6';
    return 'hallway7';
  }
  if (zoneLetter === 'D') {
    if (x < 1700) return 'hallway8&9';
    return 'hallway10';
  }
  if (zoneLetter === 'E') {
    if (x === 120) return 'hallway27';
    return 'hallway25&26';
  }
  if (zoneLetter === 'F') {
    if (x === 620) return 'hallway24';
    return 'hallway21&22&23';
  }
  if (zoneLetter === 'G') {
    if (x === 1120) return 'hallway17&18&19';
    return 'hallway16';
  }
  if (zoneLetter === 'H') {
    if (x < 1700) return 'hallway13&14&15';
    return 'hallway12';
  }
  return 'hallway1';
};

async function seedSvgCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const dbStalls = await Stall.find({});
    console.log(`Processing coordinates update for ${dbStalls.length} database stalls...`);

    let updatedCount = 0;
    for (const stall of dbStalls) {
      const sec = String(stall.section || '').toLowerCase();
      let category = 'meat';
      if (sec.includes('fish') || sec.includes('sea')) category = 'fish';
      else if (sec.includes('veg') || sec.includes('produce')) category = 'veggies';

      let x, y, zone, hallway;

      // check explicit ID map first
      if (idMap[stall._id.toString()]) {
        const item = idMap[stall._id.toString()];
        x = item.cx;
        y = item.cy;
        zone = item.zone;
        hallway = item.hallway;
      }
      // check fish special map
      else if (category === 'fish' && fishNostallnumMap[stall.stallNumber]) {
        const item = fishNostallnumMap[stall.stallNumber];
        x = item.cx;
        y = item.cy;
        zone = item.zone;
        hallway = item.hallway;
      }
      // general lookup by category + stallNum
      else {
        const cleanStallNum = String(stall.stallNumber).trim().replace(/^0+(?=\d)/, '');
        // find in mapped_stalls
        let match = svgStalls.find(s => s.category === category && s.stallNum === cleanStallNum);
        
        if (match) {
          x = match.cx;
          y = match.cy;
          zone = match.zone;
          hallway = getHallway(zone, match.x);
        } else {
          // If no exact match, log it and skip
          console.warn(`⚠️ No SVG match for ${category} Stall #${stall.stallNumber} (_id: ${stall._id})`);
          continue;
        }
      }

      stall.zone = zone;
      stall.coordinates = { x, y, hallway };
      stall.location = `Zone ${zone}, Stall #${stall.stallNumber} (${stall.section})`;
      stall.productType = category;
      stall.vendorName = stall.tenant?.name || `Vendor for Stall #${stall.stallNumber}`;

      await stall.save();
      updatedCount++;
    }

    console.log(`✅ Finished seeding! Updated ${updatedCount} stalls with exact draw.io coordinates.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedSvgCoordinates();
