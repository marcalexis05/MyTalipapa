const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'MyTalipapa' });
    console.log("Connected to DB");
    
    const hash = await bcrypt.hash('Password123!', 10);
    
    // Reset contractor
    const contractorEmail = 'contractor@mytalipapa.com';
    const cRes = await User.updateOne(
      { email: contractorEmail },
      { 
        $set: { 
          passwordHash: hash,
          isVerified: true,
          status: 'approved'
        } 
      }
    );
    console.log(`Updated contractor:`, cRes);

    // Reset admin
    const adminEmail = 'admin@mytalipapa.com';
    const aRes = await User.updateOne(
      { email: adminEmail },
      { 
        $set: { 
          passwordHash: hash,
          isVerified: true,
          status: 'approved'
        } 
      }
    );
    console.log(`Updated admin:`, aRes);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
