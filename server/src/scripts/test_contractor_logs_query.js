const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Stall = require('../models/Stall');
const ActivityLog = require('../models/ActivityLog');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'MyTalipapa' });
    console.log("Connected to DB");
    
    // Find contractor
    const email = 'contractor@mytalipapa.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.error("Contractor not found!");
      process.exit(1);
    }
    console.log(`Testing query for contractor: ${user.email} (ID: ${user._id})`);

    // Let's check which stalls are managed by this contractor
    const managedStalls = await Stall.find({ managedBy: email.toLowerCase() });
    const stallNumbers = managedStalls.map(s => String(s.stallNumber));
    console.log(`Stalls managed by contractor:`, stallNumbers);

    // Build the query we just implemented in the backend route
    const orConditions = [
      { performedBy: email.toLowerCase() }
    ];
    if (user.full_name) {
      orConditions.push({ performedBy: user.full_name });
    }

    if (stallNumbers.length > 0) {
      stallNumbers.forEach(num => {
        orConditions.push({
          details: { $regex: new RegExp(`Stall\\s*#?\\s*0*${num}\\b`, 'i') }
        });
      });
    }

    console.log("Constructed query:", JSON.stringify({ $or: orConditions }));

    const logs = await ActivityLog.find({ $or: orConditions }).sort({ createdAt: -1 });
    console.log(`Found ${logs.length} logs for this contractor:`);
    logs.forEach((log, i) => {
      console.log(`[${i+1}] Details: "${log.details}" | PerformedBy: ${log.performedBy} | CreatedAt: ${log.createdAt}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
