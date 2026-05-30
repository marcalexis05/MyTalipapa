const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../env') });
// fallback env path
dotenv.config({ path: path.join(__dirname, '../../.env') });

const StallSchema = new mongoose.Schema({}, { strict: false });
const Stall = mongoose.model('Stall', StallSchema, 'stalls');

async function findDbDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const stalls = await Stall.find({});
    
    const seen = {};
    const duplicates = [];

    stalls.forEach(s => {
      const key = `${s.section || 'Unknown'} | Zone ${s.zone || 'None'} | Stall #${s.stallNumber || 'None'}`;
      if (!seen[key]) seen[key] = [];
      seen[key].push(s);
    });

    console.log("Duplicate (section, zone, stallNumber) keys in DB:");
    let count = 0;
    for (const key in seen) {
      if (seen[key].length > 1) {
        console.log(`- ${key}: ${seen[key].length} stalls`);
        seen[key].forEach(s => {
          console.log(`    _id: ${s._id}, status: ${s.status}, coordinates: ${JSON.stringify(s.coordinates)}`);
        });
        count++;
      }
    }
    if (count === 0) {
      console.log("No duplicates found!");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findDbDuplicates();
