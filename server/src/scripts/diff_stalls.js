const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const StallSchema = new mongoose.Schema({}, { strict: false });
const Stall = mongoose.model('Stall', StallSchema, 'stalls');

const svgStalls = require('../../../scratch/mapped_stalls.json');

async function diffStalls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const dbStalls = await Stall.find({});
    
    // Build set of SVG keys: category-zone-stallNum
    const svgKeys = new Set(svgStalls.map(s => `${s.category}-${s.zone}-${s.stallNum}`));

    console.log("DB Stalls NOT in SVG:");
    let dbMissingCount = 0;
    dbStalls.forEach(s => {
      const sec = String(s.section || '').toLowerCase();
      let category = 'meat';
      if (sec.includes('fish') || sec.includes('sea')) category = 'fish';
      else if (sec.includes('veg') || sec.includes('produce')) category = 'veggies';

      const key = `${category}-${s.zone}-${s.stallNumber}`;
      if (!svgKeys.has(key)) {
        console.log(`- ${s.section} Section | Zone ${s.zone} | Stall #${s.stallNumber} (_id: ${s._id})`);
        dbMissingCount++;
      }
    });
    console.log(`Total DB stalls not in SVG: ${dbMissingCount}\n`);

    // Build set of DB keys: category-zone-stallNum
    const dbKeys = new Set(dbStalls.map(s => {
      const sec = String(s.section || '').toLowerCase();
      let category = 'meat';
      if (sec.includes('fish') || sec.includes('sea')) category = 'fish';
      else if (sec.includes('veg') || sec.includes('produce')) category = 'veggies';
      return `${category}-${s.zone}-${s.stallNumber}`;
    }));

    console.log("SVG Stalls NOT in DB:");
    let svgMissingCount = 0;
    svgStalls.forEach(s => {
      const key = `${s.category}-${s.zone}-${s.stallNum}`;
      if (!dbKeys.has(key)) {
        console.log(`- ${s.section} Section | Zone ${s.zone} | Stall #${s.stallNum} (x: ${s.x}, y: ${s.y})`);
        svgMissingCount++;
      }
    });
    console.log(`Total SVG stalls not in DB: ${svgMissingCount}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

diffStalls();
