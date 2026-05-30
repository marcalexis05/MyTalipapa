const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const StallSchema = new mongoose.Schema({}, { strict: false });
const Stall = mongoose.model('Stall', StallSchema, 'stalls');

// Columns to scale: Fish columns in Zones A, B, C, D
const TARGET_X_VALUES = [345, 695, 845, 1195, 1345, 1690, 1840];
const TARGET_ZONES = ['A', 'B', 'C', 'D'];

function scaleY(y) {
  // Map y from [30, 570] down to [210, 570]
  // y_new = 210 + (y_orig - 30) * (360 / 540) = 210 + (y_orig - 30) * (2 / 3)
  return Math.round(210 + (y - 30) * (2 / 3));
}

async function scaleFishesVertical() {
  try {
    // 1. Update client/src/utils/coords_dict.js
    const dictPath = path.join(__dirname, '../../../client/src/utils/coords_dict.js');
    let dictContent = fs.readFileSync(dictPath, 'utf8');

    // Parse JS object from file content safely
    const coords = require(dictPath).SVG_STALL_COORDS;
    
    let updatedCoordsCount = 0;
    for (const key in coords) {
      const item = coords[key];
      const isTopZone = TARGET_ZONES.some(z => key.includes(`-${z.toLowerCase()}-`) || key.includes(`-${z}-`));
      const isFishCol = TARGET_X_VALUES.includes(item.x);
      
      // Special check for Zone A duplicate key name conventions in coords_dict
      const isZoneA = key.startsWith('meat-12') || key.startsWith('meat-13') || key.includes('-a-') || key.endsWith('-a');
      const isFishOrA = isFishCol || (isZoneA && item.x === 345);

      if (isFishOrA && item.y <= 570) {
        item.y = scaleY(item.y);
        updatedCoordsCount++;
      }
    }

    // Rewrite coords_dict.js file
    let newDictContent = 'export const SVG_STALL_COORDS = {\n';
    const keys = Object.keys(coords);
    keys.forEach((k, idx) => {
      newDictContent += `  "${k}": {\n    "x": ${coords[k].x},\n    "y": ${coords[k].y}\n  }${idx === keys.length - 1 ? '' : ','}\n`;
    });
    newDictContent += '};\n';
    fs.writeFileSync(dictPath, newDictContent, 'utf8');
    console.log(`✅ Scaled ${updatedCoordsCount} entries in coords_dict.js`);

    // 2. Update client/src/utils/stall_positions.js
    const positionsPath = path.join(__dirname, '../../../client/src/utils/stall_positions.js');
    const positions = require(positionsPath).STALL_POSITIONS;

    let updatedPosCount = 0;
    positions.forEach(item => {
      const isTopZone = TARGET_ZONES.includes(item.zone);
      const isFishCol = TARGET_X_VALUES.includes(item.circleX);

      if (isTopZone && isFishCol && item.circleY <= 570) {
        // Scale circleY
        const origY = item.circleY;
        item.circleY = scaleY(item.circleY);
        
        // Scale boxY & boxHeight to align centered with circleY
        item.boxY = item.circleY - 20;
        item.boxHeight = 40;
        updatedPosCount++;
      }
    });

    // Rewrite stall_positions.js
    let newPosContent = '// Automatically generated from mapped_stalls.json\nexport const STALL_POSITIONS = [\n';
    positions.forEach((p, idx) => {
      newPosContent += `  {\n    "zone": "${p.zone}",\n    "number": "${p.number}",\n    "category": "${p.category}",\n    "circleX": ${p.circleX},\n    "circleY": ${p.circleY},\n    "circleRadius": ${p.circleRadius},\n    "boxX": ${p.boxX},\n    "boxY": ${p.boxY},\n    "boxWidth": ${p.boxWidth},\n    "boxHeight": ${p.boxHeight}\n  }${idx === positions.length - 1 ? '' : ','}\n`;
    });
    newPosContent += '];\n';
    fs.writeFileSync(positionsPath, newPosContent, 'utf8');
    console.log(`✅ Scaled ${updatedPosCount} entries in stall_positions.js`);

    // 3. Update MongoDB database stalls
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const stalls = await Stall.find({});
    console.log(`Analyzing ${stalls.length} stalls in DB...`);

    let updatedDbCount = 0;
    for (const stall of stalls) {
      if (stall.coordinates && typeof stall.coordinates.x === 'number') {
        const isTopZone = TARGET_ZONES.includes(stall.zone);
        const isFishCol = TARGET_X_VALUES.includes(stall.coordinates.x);

        if (isTopZone && isFishCol && stall.coordinates.y <= 570) {
          stall.coordinates.y = scaleY(stall.coordinates.y);
          stall.markModified('coordinates');
          await stall.save();
          updatedDbCount++;
        }
      }
    }
    console.log(`✅ Scaled ${updatedDbCount} stalls in MongoDB`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to scale Fishes vertical coordinates:', err);
    process.exit(1);
  }
}

scaleFishesVertical();
