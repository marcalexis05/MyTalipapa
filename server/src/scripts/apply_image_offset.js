const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const StallSchema = new mongoose.Schema({}, { strict: false });
const Stall = mongoose.model('Stall', StallSchema, 'stalls');

async function restoreLogicalAndShiftImage() {
  try {
    const DX = 20;
    const DY = 15;

    // 1. Subtract offset from client/src/utils/coords_dict.js
    const dictPath = path.join(__dirname, '../../../client/src/utils/coords_dict.js');
    let dictContent = fs.readFileSync(dictPath, 'utf8');

    dictContent = dictContent.replace(/"x":\s*(\d+)/g, (match, xStr) => `"x": ${parseInt(xStr) - DX}`);
    dictContent = dictContent.replace(/"y":\s*(\d+)/g, (match, yStr) => `"y": ${parseInt(yStr) - DY}`);

    fs.writeFileSync(dictPath, dictContent, 'utf8');
    console.log('✅ Coords restored in coords_dict.js (subtracted -20x, -15y)');

    // 2. Subtract offset from client/src/utils/stall_positions.js
    const positionsPath = path.join(__dirname, '../../../client/src/utils/stall_positions.js');
    let posContent = fs.readFileSync(positionsPath, 'utf8');

    posContent = posContent.replace(/"circleX":\s*(\d+)/g, (match, v) => `"circleX": ${parseInt(v) - DX}`);
    posContent = posContent.replace(/"circleY":\s*(\d+)/g, (match, v) => `"circleY": ${parseInt(v) - DY}`);
    posContent = posContent.replace(/"boxX":\s*(\d+)/g, (match, v) => `"boxX": ${parseInt(v) - DX}`);
    posContent = posContent.replace(/"boxY":\s*(\d+)/g, (match, v) => `"boxY": ${parseInt(v) - DY}`);

    fs.writeFileSync(positionsPath, posContent, 'utf8');
    console.log('✅ Coords restored in stall_positions.js (subtracted -20x, -15y)');

    // 3. Subtract offset from MongoDB database stalls
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const stalls = await Stall.find({});
    console.log(`Restoring ${stalls.length} stalls in MongoDB...`);

    let updatedCount = 0;
    for (const stall of stalls) {
      if (stall.coordinates && typeof stall.coordinates.x === 'number') {
        stall.coordinates.x -= DX;
        stall.coordinates.y -= DY;
        stall.markModified('coordinates');
        await stall.save();
        updatedCount++;
      }
    }
    console.log(`✅ Coords restored for ${updatedCount} stalls in MongoDB (subtracted -20x, -15y)`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to restore coordinates:', err);
    process.exit(1);
  }
}

restoreLogicalAndShiftImage();
