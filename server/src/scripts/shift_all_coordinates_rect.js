const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Stall = require('../models/Stall');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const stalls = await Stall.find({});
    console.log(`Found ${stalls.length} stalls in DB to update`);

    let updatedCount = 0;
    for (const stall of stalls) {
      if (stall.coordinates && typeof stall.coordinates.x === 'number') {
        const originalX = stall.coordinates.x;
        stall.coordinates.x = originalX - 75;
        
        // Let's also update the descriptive location text in the DB if it contains pathway descriptions
        // generateDirections will be computed dynamically, but stall.location has the static location text
        // (location is like "Zone E, Stall #11 (Meat)")
        
        await stall.save();
        updatedCount++;
      }
    }
    console.log(`✅ Updated ${updatedCount} stalls in MongoDB (shifted x by -75).`);

    // Update coords_dict.js file
    const dictPath = path.join(__dirname, '../../../client/src/utils/coords_dict.js');
    let dictContent = fs.readFileSync(dictPath, 'utf8');

    // Regex to match "x": <number>
    const regex = /"x":\s*(\d+)/g;
    const newDictContent = dictContent.replace(regex, (match, xStr) => {
      const x = parseInt(xStr);
      return `"x": ${x - 75}`;
    });

    fs.writeFileSync(dictPath, newDictContent, 'utf8');
    console.log('✅ Updated client/src/utils/coords_dict.js successfully (shifted x by -75).');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
