const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Stall = require('../models/Stall');

const getStallZone = (num, category) => {
  const stallId = String(num);
  if (category === 'meat') {
    if (['1', '2', '3', '4', '5', '12', '13'].includes(stallId) || stallId.startsWith('empty')) return 'Zone A';
    if (['51', '52', '53', '54', '55', '56'].includes(stallId)) return 'Zone C';
    if (['1(u2)', '2(u2)', '3(u2)', '4(u2)', '8(u2)', '9(u2)', '10(u2)'].includes(stallId)) return 'Zone F';
    return 'Zone E';
  } else if (category === 'fish') {
    const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
    if (numInt >= 11 && numInt <= 20) return 'Zone A';
    if (numInt >= 21 && numInt <= 40) return 'Zone B';
    if ((numInt >= 41 && numInt <= 50) || (numInt >= 57 && numInt <= 60)) return 'Zone C';
    return 'Zone D';
  } else if (category === 'veggies') {
    const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
    if (numInt >= 5 && numInt <= 24) return 'Zone F';
    if (numInt >= 25 && numInt <= 48) return 'Zone G';
    return 'Zone H';
  }
  return 'Zone A';
};

const getStallCoords = (rawId, category, zone) => {
  const num = parseInt(String(rawId).replace(/[^0-9]/g, '')) || 1;
  let x = 100;
  let y = 300;

  if (['Zone E', 'Zone F', 'Zone G', 'Zone H'].includes(zone)) {
    if (zone === 'Zone E') {
      if (num <= 12) {
        x = 50;
        y = 400 - (num - 1) * 14.54;
      } else {
        x = 110;
        y = 400 - (num - 13) * 14.54;
      }
    } else if (zone === 'Zone F') {
      if (num <= 12) {
        x = 170;
        y = 400 - (num - 1) * 14.54;
      } else {
        x = 230;
        y = 400 - (num - 13) * 14.54;
      }
    } else if (zone === 'Zone G') {
      if (num <= 36) {
        x = 290;
        y = 400 - (num - 25) * 14.54;
      } else {
        x = 410;
        y = 400 - (num - 37) * 14.54;
      }
    } else if (zone === 'Zone H') {
      if (num <= 60) {
        x = 530;
        y = 400 - (num - 50) * 16.0;
      } else {
        x = 590;
        y = 400 - (num - 61) * 14.54;
      }
    }
  } else {
    if (zone === 'Zone A') {
      if (num <= 5) {
        x = 50;
        y = 220 - (num - 1) * 25.0;
      } else {
        const baseNum = num < 11 ? 11 : num;
        x = 110;
        y = 220 - (baseNum - 11) * 17.78;
      }
    } else if (zone === 'Zone B') {
      if (num <= 30) {
        x = 170;
        y = 220 - (num - 21) * 17.78;
      } else {
        x = 230;
        y = 220 - (num - 31) * 17.78;
      }
    } else if (zone === 'Zone C') {
      if (num <= 50) {
        x = 290;
        y = 220 - (num - 41) * 17.78;
      } else {
        x = 410;
        y = 220 - (num - 51) * 17.78;
      }
    } else if (zone === 'Zone D') {
      if (num <= 70) {
        x = 530;
        y = 220 - (num - 61) * 17.78;
      } else {
        const baseNum = num < 71 ? 71 : num;
        x = 590;
        y = 220 - (baseNum - 71) * 25.0;
      }
    }
  }

  return { x: Math.round(x), y: Math.round(y) };
};

const getHallway = (zone, x) => {
  const zoneLetter = String(zone || '').toUpperCase();
  if (zoneLetter === 'ZONE A') {
    if (x === 50) return 'hallway1';
    return 'hallway2';
  }
  if (zoneLetter === 'ZONE B') {
    if (x === 170) return 'hallway3&4';
    return 'hallway5';
  }
  if (zoneLetter === 'ZONE C') {
    if (x === 290) return 'hallway6';
    return 'hallway7';
  }
  if (zoneLetter === 'ZONE D') {
    if (x === 530) return 'hallway8&9';
    return 'hallway10';
  }
  if (zoneLetter === 'ZONE E') {
    if (x === 50) return 'hallway27';
    return 'hallway25&26';
  }
  if (zoneLetter === 'ZONE F') {
    if (x === 170) return 'hallway24';
    return 'hallway21&22&23';
  }
  if (zoneLetter === 'ZONE G') {
    if (x === 290) return 'hallway17&18&19';
    return 'hallway16';
  }
  if (zoneLetter === 'ZONE H') {
    if (x === 530) return 'hallway13&14&15';
    return 'hallway12';
  }
  return 'hallway1';
};

async function seedCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const stalls = await Stall.find({});
    console.log(`Analyzing ${stalls.length} stalls...`);

    let updatedCount = 0;
    for (const stall of stalls) {
      const sec = String(stall.section || '').toLowerCase();
      let category = 'meat';
      if (sec.includes('fish') || sec.includes('sea')) category = 'fish';
      else if (sec.includes('veg') || sec.includes('produce')) category = 'veggies';

      const zoneName = getStallZone(stall.stallNumber, category);
      const { x, y } = getStallCoords(stall.stallNumber, category, zoneName);
      const hallway = getHallway(zoneName, x);

      stall.zone = zoneName.replace('Zone ', '');
      stall.coordinates = { x, y, hallway };
      stall.location = `${zoneName}, Stall #${stall.stallNumber} (${stall.section})`;
      stall.productType = category;
      stall.vendorName = stall.tenant?.name || `Vendor for Stall #${stall.stallNumber}`;

      await stall.save();
      updatedCount++;
    }

    console.log(`✅ Successfully updated ${updatedCount} stalls with location coordinates.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding coordinates failed:', err);
    process.exit(1);
  }
}

seedCoordinates();
