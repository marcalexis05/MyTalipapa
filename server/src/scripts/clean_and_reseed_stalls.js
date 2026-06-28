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
    .replace(/\(u\d*\)/gi, '')
    .replace(/Stall\s*#/gi, '')
    .replace('#', '')
    .trim()
    .toLowerCase()
    .replace(/^0+(?=\d)/, '');
};

const getStallZoneLetter = (stallId, category) => {
  const cleanId = getCleanDbStallNumber(stallId);
  const numInt = parseInt(cleanId.replace(/[^0-9]/g, '')) || 0;

  if (category === 'meat') {
    if (['1(u)', '2(u)', '3(u)', '4(u)', '5(u)', '12(u)', '13(u)', 'empty', 'empty2', 'empty3'].includes(stallId)) {
      return 'A';
    }
    if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'].includes(stallId)) {
      return 'E';
    }
    if (['1(u2)', '2(u2)', '3(u2)', '4(u2)', '8(u2)', '9(u2)', '10(u2)'].includes(stallId)) {
      return 'F';
    }
    if (['51', '52', '53', '54', '55', '56'].includes(stallId)) {
      return 'C';
    }
    return 'A';
  } else if (category === 'fish') {
    if (['11', '14', '15', '16', '17', '18', '19', '20'].includes(stallId)) {
      return 'A';
    }
    if (numInt >= 21 && numInt <= 40) {
      return 'B';
    }
    if ((numInt >= 41 && numInt <= 50) || ['57', '58', '59', '60'].includes(stallId)) {
      return 'C';
    }
    if ((numInt >= 61 && numInt <= 75) || stallId.startsWith('nostallnum')) {
      return 'D';
    }
    return 'A';
  } else if (category === 'veggies') {
    if (['5', '6', '7', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'].includes(stallId)) {
      return 'F';
    }
    if (numInt >= 25 && numInt <= 48) {
      return 'G';
    }
    if (numInt >= 50 && numInt <= 72) {
      return 'H';
    }
    return 'F';
  }
  return 'A';
};

const getHallway = (zone, x) => {
  const zoneLetter = String(zone || '').toUpperCase();
  if (zoneLetter === 'A') {
    if (x < 400) return 'hallway1';
    return 'hallway2';
  }
  if (zoneLetter === 'B') {
    if (x < 750) return 'hallway3&4';
    return 'hallway5';
  }
  if (zoneLetter === 'C') {
    if (x < 1400) return 'hallway6';
    return 'hallway7';
  }
  if (zoneLetter === 'D') {
    if (x < 1900) return 'hallway8&9';
    return 'hallway10';
  }
  if (zoneLetter === 'E') {
    if (x < 400) return 'hallway27';
    return 'hallway25&26';
  }
  if (zoneLetter === 'F') {
    if (x < 900) return 'hallway24';
    return 'hallway21&22&23';
  }
  if (zoneLetter === 'G') {
    if (x < 1400) return 'hallway17&18&19';
    return 'hallway16';
  }
  if (zoneLetter === 'H') {
    if (x < 1900) return 'hallway13&14&15';
    return 'hallway12';
  }
  return 'hallway1';
};

const getDbSectionName = (category) => {
  if (category === 'meat') return 'Meat';
  if (category === 'fish') return 'Fishes';
  if (category === 'veggies') return 'Vegetables';
  return category;
};

const getAccentColor = (category) => {
  if (category === 'meat') return '#ef4444';
  if (category === 'fish') return '#3b82f6';
  if (category === 'veggies') return '#10b981';
  return '#6b7280';
};

async function reseed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Backup existing status, tenant, and listing info
    const oldStalls = await Stall.find({});
    console.log(`Backing up ${oldStalls.length} existing stalls...`);
    const backup = {};
    oldStalls.forEach(s => {
      const cat = s.productType || (s.section.toLowerCase().includes('fish') ? 'fish' : s.section.toLowerCase().includes('veg') ? 'veggies' : 'meat');
      const cleanNum = getCleanDbStallNumber(s.stallNumber);
      const zone = s.zone;
      const key = `${cat}-${s.stallNumber}-${zone}`;
      backup[key] = {
        status: s.status,
        tenant: s.tenant,
        listing: s.listing,
        amenities: s.amenities,
        monthlyRate: s.monthlyRate,
        size: s.size,
        sizeUnit: s.sizeUnit
      };
    });

    // 2. Clear collection
    console.log('Clearing stalls collection...');
    await Stall.deleteMany({});

    // 3. Recreate stalls from coords_dict.js
    const newStalls = [];
    const keys = Object.keys(SVG_STALL_COORDS);
    console.log(`Recreating ${keys.length} stalls from coords_dict.js...`);

    keys.forEach((key, index) => {
      const parts = key.split('-');
      const category = parts[0];
      const stallNumber = key.substring(category.length + 1); // everything after 'category-'

      const zone = getStallZoneLetter(stallNumber, category);
      const section = getDbSectionName(category);
      const color = getAccentColor(category);
      const coords = SVG_STALL_COORDS[key];
      const hallway = getHallway(zone, coords.x);

      // check backup
      const backupKey = `${category}-${stallNumber}-${zone}`;
      const bk = backup[backupKey] || {};

      const numInt = parseInt(getCleanDbStallNumber(stallNumber).replace(/[^0-9]/g, '')) || (index + 1);
      const isNearWater = numInt % 3 === 0;
      const waterAccess = isNearWater ? 'Near CR (Easy Access)' : 'Far from CR (Fetching Required)';
      const electricitySetup = numInt % 2 === 0 ? 'Sub-metered' : 'Shared Meter';

      const defaultRate = 12000 + (isNearWater ? 1000 : 0) + (numInt % 3) * 1000;

      newStalls.push({
        stallNumber,
        section,
        color,
        monthlyRate: bk.monthlyRate || defaultRate,
        zone,
        amenities: bk.amenities || [electricitySetup, waterAccess],
        hasStallNumber: !stallNumber.startsWith('nostallnum'),
        status: bk.status || 'available',
        tenant: (bk.tenant && bk.tenant.name) ? bk.tenant : undefined,
        listing: bk.listing || { isActive: true, autoRenew: false },
        size: bk.size || 12,
        sizeUnit: bk.sizeUnit || 'sqm',
        coordinates: {
          x: coords.x,
          y: coords.y,
          hallway
        },
        productType: category,
        location: `Zone ${zone}, Stall #${stallNumber} (${section})`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    const insertRes = await Stall.insertMany(newStalls);
    console.log(`Successfully inserted ${insertRes.length} clean stalls!`);

    // Verify
    const finalMeat = await Stall.countDocuments({ section: 'Meat' });
    const finalFish = await Stall.countDocuments({ section: 'Fishes' });
    const finalVeggies = await Stall.countDocuments({ section: 'Vegetables' });
    const finalTotal = await Stall.countDocuments({});

    console.log('\nFinal clean DB totals:');
    console.log(`- Meat: ${finalMeat} stalls`);
    console.log(`- Fishes: ${finalFish} stalls`);
    console.log(`- Vegetables: ${finalVeggies} stalls`);
    console.log(`- Total: ${finalTotal} stalls`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Reseeding failed:', err);
    process.exit(1);
  }
}

reseed();
