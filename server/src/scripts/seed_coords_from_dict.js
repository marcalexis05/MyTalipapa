const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Stall = require('../models/Stall');

// Load coords_dict.js contents dynamically
const dictPath = path.join(__dirname, '../../../client/src/utils/coords_dict.js');
const fileContent = fs.readFileSync(dictPath, 'utf8');
const jsCode = fileContent.replace('export const SVG_STALL_COORDS =', 'const data =') + '; return data;';
const SVG_STALL_COORDS = new Function(jsCode)();

const getCleanDbStallNumber = (rawId) => {
  return String(rawId)
    .replace(/\(u\d*\)/gi, '') // strip (u), (u2), etc.
    .replace(/Stall\s*#/gi, '')
    .replace('#', '')
    .trim()
    .toLowerCase()
    .replace(/^0+(?=\d)/, '');
};

const getHallwayForStall = (zone, x) => {
  const zoneLetter = String(zone || '').toUpperCase();
  const isBottom = ['E', 'F', 'G', 'H'].includes(zoneLetter);
  
  if (!isBottom) {
    if (x === 100) return 'hallway1';
    if (x === 430) return 'hallway2';
    if (x === 630) return 'hallway3_4';
    if (x === 950) return 'hallway5';
    if (x === 1150) return 'hallway6';
    if (x === 1450) return 'hallway7';
    if (x === 1690) return 'hallway8_9';
    if (x === 2000) return 'hallway10';
  } else {
    if (x === 100) return 'hallway27';
    if (x === 430) return 'hallway25_26';
    if (x === 630) return 'hallway24';
    if (x === 950) return 'hallway21_22_23';
    if (x === 1150) return 'hallway20';
    if (x === 1450) return 'hallway17_18_19';
    if (x === 1690) return 'hallway16';
    if (x === 2000) return 'hallway13_14_15';
  }
  return 'hallway1';
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const dbStalls = await Stall.find({});
    console.log(`Processing coordinates update for ${dbStalls.length} database stalls...`);

    let updatedCount = 0;
    let missingCount = 0;

    for (const stall of dbStalls) {
      const sec = String(stall.section || '').toLowerCase();
      let category = 'meat';
      if (sec.includes('fish') || sec.includes('sea')) category = 'fish';
      else if (sec.includes('veg') || sec.includes('produce')) category = 'veggies';

      const zoneLetter = String(stall.zone || '').toUpperCase();
      const num = getCleanDbStallNumber(stall.stallNumber);

      // Construct keys to check
      let keysToCheck = [];

      if (zoneLetter === 'E' && category === 'meat') {
        // Zone E meat stalls have (u) suffixes for duplicates in coords_dict (1-5, 12, 13)
        if (['1', '2', '3', '4', '5', '12', '13'].includes(num)) {
          keysToCheck.push(`${category}-${num}(u)`);
        }
      } else if (zoneLetter === 'F' && category === 'meat') {
        // Zone F meat stalls have (u2) suffixes in coords_dict
        keysToCheck.push(`${category}-${num}(u2)`);
      }

      // Add general fallback key
      keysToCheck.push(`${category}-${num}`);

      // Find the first key that exists in SVG_STALL_COORDS
      let coords = null;
      let matchedKey = null;
      for (const key of keysToCheck) {
        if (SVG_STALL_COORDS[key]) {
          coords = SVG_STALL_COORDS[key];
          matchedKey = key;
          break;
        }
      }

      if (coords) {
        const hallway = getHallwayForStall(zoneLetter, coords.x);
        stall.coordinates = {
          x: coords.x,
          y: coords.y,
          hallway: hallway
        };
        stall.productType = category;
        stall.location = `Zone ${zoneLetter}, Stall #${stall.stallNumber} (${stall.section})`;
        await stall.save();
        updatedCount++;
      } else {
        console.warn(`⚠️ No coordinates found in coords_dict.js for Stall #${stall.stallNumber} in ${stall.section} (Zone ${zoneLetter}) [Tried keys: ${keysToCheck.join(', ')}]`);
        missingCount++;
      }
    }

    console.log(`\n✅ Finished updating stalls!`);
    console.log(`- Updated: ${updatedCount}`);
    console.log(`- Missing: ${missingCount}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
