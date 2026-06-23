const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const ContractorApplication = require('../models/ContractorApplication');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const users = await User.find({});
    console.log(`Total users in DB: ${users.length}`);
    for (const u of users) {
      console.log(`User: ${u.email} | Role: ${u.role} | Verified: ${u.isVerified} | Status: ${u.status}`);
    }

    const apps = await ContractorApplication.find({});
    console.log(`\nTotal contractor applications: ${apps.length}`);
    for (const a of apps) {
      console.log(`App: ${a.email} | Status: ${a.status} | Business: ${a.businessName}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
