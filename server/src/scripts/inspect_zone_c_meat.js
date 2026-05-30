const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const StallSchema = new mongoose.Schema({}, { strict: false });
const Stall = mongoose.model('Stall', StallSchema, 'stalls');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const stalls = await Stall.find({ zone: 'C', section: 'Meat' });
    console.log(JSON.stringify(stalls.map(s => ({
      id: s._id.toString(),
      stallNumber: s.stallNumber,
      coordinates: s.coordinates,
      managedBy: s.managedBy,
      status: s.status
    })), null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
