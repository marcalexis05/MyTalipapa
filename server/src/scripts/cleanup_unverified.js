const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const deleteRes = await User.deleteMany({ email: 'earvinjohnlopez011@gmail.com', isVerified: false });
    console.log(`Deleted ${deleteRes.deletedCount} unverified users for earvinjohnlopez011@gmail.com`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
