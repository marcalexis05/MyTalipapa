const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const ApplicationSchema = new mongoose.Schema({}, { strict: false });
const Application = mongoose.model('Application', ApplicationSchema, 'applications');

async function createTestApp() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
    
    // Delete any old test applications for Test Message User to keep clean
    await Application.deleteMany({ fullName: "Test Message User" });

    const newApp = await Application.create({
      fullName: "Test Message User",
      contactNumber: "09171234567",
      email: "rentertest@example.com",
      preferredStall: "15", // clean stall number
      stallLabel: "Fishes (Lower Floor)", // label format
      intendedBusinessUse: "Fishes",
      additionalMessage: "Hello Contractor!\nI would like to inquire about renting Stall #15 (Fishes) for my seafood business.\nI plan to sell fresh salmon, tuna, and tilapia.\n\nPlease let me know the next steps.",
      status: "pending",
      initials: "TU",
      avatarColor: "#1a5c2a",
      appliedAt: new Date(),
    });

    console.log("Created test application:", newApp);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createTestApp();
