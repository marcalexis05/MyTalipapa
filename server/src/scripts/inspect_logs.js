const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const LogSchema = new mongoose.Schema({}, { strict: false });
const ActivityLog = mongoose.model('ActivityLog', LogSchema, 'activitylogs');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'MyTalipapa' });
    console.log("Connected to DB");
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 });
    console.log(`Found ${logs.length} logs:`);
    logs.forEach((log, i) => {
      console.log(`[${i+1}] Action: ${log.action} | PerformedBy: ${log.performedBy} | Details: "${log.details}" | CreatedAt: ${log.createdAt}`);
    });
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
