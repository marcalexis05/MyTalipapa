const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const StallSchema = new mongoose.Schema({}, { strict: false });
const Stall = mongoose.model('Stall', StallSchema, 'stalls');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
    const stalls = await Stall.find({});
    stalls.forEach(s => {
      if (/[a-zA-Z\(\)]/.test(s.stallNumber)) {
        console.log(`Stall: ${s.stallNumber} | Section: ${s.section} | Zone: ${s.zone} | Coords:`, s.coordinates);
      }
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
