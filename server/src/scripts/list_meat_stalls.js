const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const StallSchema = new mongoose.Schema({}, { strict: false });
const Stall = mongoose.model('Stall', StallSchema, 'stalls');

async function listMeat() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const stalls = await Stall.find({ section: 'Meat' }).sort({ _id: 1 });
    console.log(`Found ${stalls.length} Meat stalls in DB:`);
    stalls.forEach(s => {
      console.log(`_id: ${s._id} | stallNumber: "${s.stallNumber}" | zone: "${s.zone}" | coordinates: ${JSON.stringify(s.coordinates)}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listMeat();
