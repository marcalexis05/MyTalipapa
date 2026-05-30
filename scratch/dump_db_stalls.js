const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const StallSchema = new mongoose.Schema({}, { strict: false });
const Stall = mongoose.model('Stall', StallSchema, 'stalls');

async function dumpStalls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
    const stalls = await Stall.find({});
    console.log(`Found ${stalls.length} stalls in DB`);
    
    const countBySection = {};
    stalls.forEach(s => {
      const key = `${s.section || 'Unknown'}`;
      if (!countBySection[key]) countBySection[key] = [];
      countBySection[key].push(s.stallNumber);
    });

    for (const sec in countBySection) {
      console.log(`\nSection: ${sec} (${countBySection[sec].length} stalls)`);
      console.log(countBySection[sec].sort((a, b) => String(a).localeCompare(String(b), undefined, {numeric: true})).join(', '));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

dumpStalls();
