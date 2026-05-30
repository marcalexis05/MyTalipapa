// scripts/sync-stalls-zones.js
/**
 * Database Migration Script:
 * 1. Remove the 'floorArea' field from all documents.
 * 2. Assign the correct 'zone' (A-H) to existing stalls based on the floor plan layout.
 * 3. Insert the missing stalls to reach the full 172 stalls total, with correct zone, section, and defaults.
 */

const path = require('path');
const mongoose = require('../server/node_modules/mongoose');

// Load environment variables from the server directory
require('../server/node_modules/dotenv').config({ path: path.join(__dirname, '../server/.env') });

const Stall = require('../server/src/models/Stall');

// Zone Mapping Helper
const getStallZoneLetter = (num, section) => {
  const stallId = String(num);
  const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
  const sectionLower = section.toLowerCase();
  const category = sectionLower === 'fishes' ? 'fish' : (sectionLower === 'vegetables' ? 'veggies' : sectionLower);

  if (category === 'meat') {
    // Upper Columns 1 & 2 -> Zone A
    if (['1(u)', '2(u)', '3(u)', '4(u)', '5(u)', '12(u)', '13(u)', 'empty', 'empty2', 'empty3'].includes(stallId)) {
      return 'A';
    }
    // Lower Columns 1 & 2 -> Zone E
    if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'].includes(stallId)) {
      return 'E';
    }
    // Lower Columns 3 & 4 -> Zone F
    if (['1(u2)', '2(u2)', '3(u2)', '4(u2)', '8(u)', '9(u)', '10(u)'].includes(stallId)) {
      return 'F';
    }
    // Upper Columns 5 & 6 -> Zone C
    if (['51', '52', '53', '54', '55', '56'].includes(stallId)) {
      return 'C';
    }
    return 'A'; // default fallback for meat
  } else if (category === 'fish') {
    // Upper Columns 1 & 2 -> Zone A
    if (['11', '14', '15', '16', '17', '18', '19', '20'].includes(stallId)) {
      return 'A';
    }
    // Upper Columns 3 & 4 -> Zone B
    if (numInt >= 21 && numInt <= 40) {
      return 'B';
    }
    // Upper Columns 5 & 6 -> Zone C
    if ((numInt >= 41 && numInt <= 50) || ['57', '58', '59', '60'].includes(stallId)) {
      return 'C';
    }
    // Upper Columns 7 & 8 -> Zone D
    if ((numInt >= 61 && numInt <= 75) || stallId.startsWith('nostallnum')) {
      return 'D';
    }
    return 'A';
  } else if (category === 'veggies') {
    // Lower Columns 3 & 4 -> Zone F
    if (['5', '6', '7', '11', '12', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'].includes(stallId)) {
      return 'F';
    }
    // Lower Columns 5 & 6 -> Zone G
    if (numInt >= 25 && numInt <= 48) {
      return 'G';
    }
    // Lower Columns 7 & 8 -> Zone H
    if (numInt >= 50 && numInt <= 72) {
      return 'H';
    }
    return 'F';
  }
  return 'A';
};

const SECTIONS_CONFIG = {
  meat: {
    color: '#ef4444',
    stalls: [
      '1', '1(u)', '1(u2)', '2', '2(u)', '2(u2)', '3', '3(u)', '3(u2)', '4', '4(u)', '4(u2)',
      '5', 'empty', 'empty2', 'empty3',
      '5(u)', '6', '7', '8', '9', '10', '8(u)', '9(u)', '10(u)', '11', '12', '12(u)', '13', '13(u)', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24',
      '51', '52', '53', '54', '55', '56'
    ]
  },
  fish: {
    color: '#3b82f6',
    stalls: [
      '11', '14', '15', '16', '17', '18', '19', '20',
      '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
      '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
      '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
      '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75',
      'nostallnum1', 'nostallnum2', 'nostallnum3', 'nostallnum4', 'nostallnum5'
    ]
  },
  veggies: {
    color: '#10b981',
    stalls: [
      '5', '6', '7', '11', '12', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
      '41', '42', '43', '44', '45', '46', '47', '48', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
      '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72'
    ]
  }
};

const getDbSectionName = (category) => {
  if (category === 'meat') return 'Meat';
  if (category === 'fish') return 'Fishes';
  if (category === 'veggies') return 'Vegetables';
  return category;
};

const generateStallObject = (num, category, index) => {
  const numInt = parseInt(String(num).match(/^\d+/)?.[0]) || (index + 1);
  const isNearWater = numInt % 3 === 0;
  const waterAccess = isNearWater ? 'Near CR (Easy Access)' : 'Far from CR (Fetching Required)';
  const priceVal = 12000 + (isNearWater ? 1000 : 0) + (numInt % 3) * 1000;
  const electricitySetup = numInt % 2 === 0 ? 'Sub-metered' : 'Shared Meter';
  const section = getDbSectionName(category);
  const zone = getStallZoneLetter(num, section);

  return {
    stallNumber: String(num),
    section,
    color: SECTIONS_CONFIG[category].color,
    monthlyRate: priceVal,
    zone,
    amenities: [electricitySetup, waterAccess],
    hasStallNumber: !String(num).startsWith('nostallnum'),
    status: 'available',
    tenant: null,
    listing: { isActive: true, autoRenew: false },
    size: 12,
    sizeUnit: 'sqm',
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;

  if (!mongoUri) {
    console.error('Error: MONGODB_URI or MONGO_URI is missing from environment.');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongoUri, {
    ...(dbName ? { dbName } : {})
  });
  console.log('Connected to MongoDB successfully.');

  // 1. Fetch all existing documents from database
  const existingDocs = await Stall.find({});
  console.log(`Initial stalls in DB: ${existingDocs.length}`);

  // 2. Remove floorArea and update zone for all existing documents
  console.log('Updating existing documents (removing floorArea and setting correct zone)...');
  const existingUpdates = existingDocs.map(doc => {
    const correctZone = getStallZoneLetter(doc.stallNumber, doc.section);
    return {
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $unset: { floorArea: "" },
          $set: { zone: correctZone, updatedAt: new Date() }
        }
      }
    };
  });

  if (existingUpdates.length > 0) {
    const updateRes = await Stall.collection.bulkWrite(existingUpdates);
    console.log(`Updated ${updateRes.modifiedCount} existing stalls.`);
  }

  // 3. Build the full set of 172 stalls
  const fullStallsList = [];
  for (const [category, config] of Object.entries(SECTIONS_CONFIG)) {
    config.stalls.forEach((num, index) => {
      fullStallsList.push(generateStallObject(num, category, index));
    });
  }

  // 4. Fetch the database state again to get updated existing keys
  const remainingDocs = await Stall.find({}, 'stallNumber section');
  const remainingKeys = new Set(remainingDocs.map(d => `${d.stallNumber}:${d.section}`));

  // 5. Find missing stalls to insert
  const missingStalls = fullStallsList.filter(stall => {
    const key = `${stall.stallNumber}:${stall.section}`;
    return !remainingKeys.has(key);
  });

  console.log(`Found ${missingStalls.length} missing stalls to insert.`);

  // 6. Insert the missing ones using insertMany
  if (missingStalls.length > 0) {
    const insertRes = await Stall.insertMany(missingStalls);
    console.log(`Successfully inserted ${insertRes.length} missing stalls.`);
  } else {
    console.log('No missing stalls to insert.');
  }

  // 7. Verify final counts
  const finalMeat = await Stall.countDocuments({ section: 'Meat' });
  const finalFish = await Stall.countDocuments({ section: 'Fishes' });
  const finalVeggies = await Stall.countDocuments({ section: 'Vegetables' });
  const finalTotal = await Stall.countDocuments({});

  console.log('\nFinal DB totals:');
  console.log(`- Meat: ${finalMeat} stalls (Expected: 47)`);
  console.log(`- Fishes: ${finalFish} stalls (Expected: 62)`);
  console.log(`- Vegetables: ${finalVeggies} stalls (Expected: 63)`);
  console.log(`- Total: ${finalTotal} stalls (Expected: 172)`);

  // Spot-check check: count of stalls with floorArea
  const countWithFloorArea = await Stall.countDocuments({ floorArea: { $exists: true } });
  console.log(`Stalls still containing floorArea field: ${countWithFloorArea} (Expected: 0)`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

run().catch(err => {
  console.error('Error during sync operations:', err);
  process.exit(1);
});
