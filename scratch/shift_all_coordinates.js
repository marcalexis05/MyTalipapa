const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const StallSchema = new mongoose.Schema({
  stallNumber: String,
  zone: String,
  coordinates: {
    x: Number,
    y: Number,
    hallway: String
  }
}, { strict: false });

const Stall = mongoose.model('Stall', StallSchema, 'stalls');

function getShiftedCoords(x, y, zone) {
  const zoneLetter = String(zone || '').toUpperCase().replace('ZONE ', '');
  let dx = 150;
  if (x === 195) {
    dx = 0;
  }
  
  let dy = 120;
  if (['A', 'B', 'C', 'D'].includes(zoneLetter)) {
    dy = 360;
  }
  
  return { x: x + dx, y: y + dy };
}

async function run() {
  try {
    // 1. Shift database coordinates
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const stalls = await Stall.find({});
    console.log(`Found ${stalls.length} stalls in DB to update`);
    
    let updatedCount = 0;
    for (const stall of stalls) {
      if (stall.coordinates && typeof stall.coordinates.x === 'number') {
        const originalX = stall.coordinates.x;
        const originalY = stall.coordinates.y;
        const { x, y } = getShiftedCoords(originalX, originalY, stall.zone);
        
        stall.coordinates.x = x;
        stall.coordinates.y = y;
        
        // Also update hallway name based on new x coordinate if necessary
        // (the original seed_svg_coordinates used match.x, let's keep the seeded hallway unchanged)
        
        await stall.save();
        updatedCount++;
      }
    }
    console.log(`✅ Updated ${updatedCount} stalls in MongoDB with shifted coordinates.`);
    
    // 2. Shift coords_dict.js file
    const dictPath = path.join(__dirname, '../client/src/utils/coords_dict.js');
    let dictContent = fs.readFileSync(dictPath, 'utf8');
    
    // Find all coordinates using regex
    // e.g. "meat-12": { "x": 345, "y": 490 }
    const regex = /"([^"]+)":\s*\{\s*"x":\s*(\d+),\s*"y":\s*(\d+)\s*\}/g;
    
    const newDictContent = dictContent.replace(regex, (match, key, xStr, yStr) => {
      const x = parseInt(xStr);
      const y = parseInt(yStr);
      
      // Determine zone from key
      // We can infer zone from the key and category
      const parts = key.split('-');
      const category = parts[0];
      const rawId = parts[1];
      
      // We need to know the zone for this stall to determine dy
      const getZoneLetter = (num, cat) => {
        const stallId = String(num);
        if (cat === 'meat') {
          if (['1', '2', '3', '4', '5', '12', '13', 'empty', 'empty2', 'empty3'].includes(stallId) || stallId.endsWith('(u)') || stallId.endsWith('(u2)')) {
            if (stallId.includes('(u2)')) return 'F';
            if (stallId.includes('(u)')) return 'E';
            return 'A';
          }
          if (['51', '52', '53', '54', '55', '56'].includes(stallId)) return 'C';
          return 'E';
        } else if (cat === 'fish') {
          const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
          if (numInt >= 11 && numInt <= 20) return 'A';
          if (numInt >= 21 && numInt <= 40) return 'B';
          if ((numInt >= 41 && numInt <= 50) || (numInt >= 57 && numInt <= 60)) return 'C';
          return 'D';
        } else if (cat === 'veggies') {
          const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
          if (numInt >= 5 && numInt <= 24) return 'F';
          if (numInt >= 25 && numInt <= 48) return 'G';
          return 'H';
        }
        return 'A';
      };
      
      const zoneLetter = getZoneLetter(rawId, category);
      const { x: nx, y: ny } = getShiftedCoords(x, y, zoneLetter);
      
      return `"${key}": {
    "x": ${nx},
    "y": ${ny}
  }`;
    });
    
    fs.writeFileSync(dictPath, newDictContent, 'utf8');
    console.log('✅ Updated coords_dict.js file successfully.');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
