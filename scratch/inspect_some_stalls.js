const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const StallSchema = new mongoose.Schema({}, { strict: false });
const Stall = mongoose.model('Stall', StallSchema, 'stalls');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
    const stalls = await Stall.find({});
    console.log(`Found ${stalls.length} stalls in DB`);
    
    stalls.forEach(s => {
      if (s.stallNumber === '1' || s.stallNumber === '11' || s.stallNumber === '19' || String(s.stallNumber).includes('1')) {
        console.log(`ID: ${s._id} | Stall: ${s.stallNumber} | Section: ${s.section} | Zone: ${s.zone} | Coords:`, s.coordinates);
      }
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
