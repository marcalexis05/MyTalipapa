const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const StallSchema = new mongoose.Schema({}, { strict: false });
const Stall = mongoose.model('Stall', StallSchema, 'stalls');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Find stall 45
    const stall = await Stall.findOne({ stallNumber: { $in: ["45", "045"] } });
    if (!stall) {
      console.log("Stall 45 not found.");
      process.exit(0);
    }

    console.log("Current Stall 45 details:", JSON.stringify(stall, null, 2));

    // Update status to available and clear tenant
    stall.status = 'available';
    stall.tenant = {
      name: null,
      contact: null,
      email: null,
      leaseStart: null,
      leaseEnd: null
    };
    // Also remove managedBy if it's supposed to be completely unmanaged/available
    // But let's check what the user asked: "remove this sample data that stall it should be available to be accesible for the real user it appear on the admin stalls"
    // In MyTalipapa, occupied/available refers to renting status. Let's make it available.
    
    await stall.save();
    console.log("Stall 45 has been updated to available and tenant data cleared.");

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
