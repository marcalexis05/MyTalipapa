const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const ApplicationSchema = new mongoose.Schema({}, { strict: false });
const Application = mongoose.model('Application', ApplicationSchema, 'applications');

async function inspectApps() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
    const apps = await Application.find({}).sort({ appliedAt: -1 });
    console.log(`Found ${apps.length} applications in DB:\n`);
    
    apps.forEach((app, i) => {
      console.log(`[${i + 1}] ID: ${app._id} | Name: ${app.fullName} | Status: ${app.status} | Stall: ${app.preferredStall}`);
      console.log(`    Message: "${app.additionalMessage || 'EMPTY'}"`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectApps();
