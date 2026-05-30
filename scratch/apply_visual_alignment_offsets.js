const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const StallSchema = new mongoose.Schema({}, { strict: false });
const Stall = mongoose.model('Stall', StallSchema, 'stalls');

async function applyOffsets() {
  try {
    const DX = 20;
    const DY = 15;

    // 1. Update client/src/utils/coords_dict.js
    const dictPath = path.join(__dirname, '../client/src/utils/coords_dict.js');
    let dictContent = fs.readFileSync(dictPath, 'utf8');

    // Parse the file: we can do a regex replacement for x and y
    const xRegex = /"x":\s*(\d+)/g;
    dictContent = dictContent.replace(xRegex, (match, xStr) => {
      return `"x": ${parseInt(xStr) + DX}`;
    });

    const yRegex = /"y":\s*(\d+)/g;
    dictContent = dictContent.replace(yRegex, (match, yStr) => {
      return `"y": ${parseInt(yStr) + DY}`;
    });

    fs.writeFileSync(dictPath, dictContent, 'utf8');
    console.log('✅ Offset applied to coords_dict.js (+20x, +15y)');

    // 2. Update client/src/utils/stall_positions.js
    const positionsPath = path.join(__dirname, '../client/src/utils/stall_positions.js');
    let posContent = fs.readFileSync(positionsPath, 'utf8');

    // Regex shift for circleX, circleY, boxX, boxY
    posContent = posContent.replace(/"circleX":\s*(\d+)/g, (match, v) => `"circleX": ${parseInt(v) + DX}`);
    posContent = posContent.replace(/"circleY":\s*(\d+)/g, (match, v) => `"circleY": ${parseInt(v) + DY}`);
    posContent = posContent.replace(/"boxX":\s*(\d+)/g, (match, v) => `"boxX": ${parseInt(v) + DX}`);
    posContent = posContent.replace(/"boxY":\s*(\d+)/g, (match, v) => `"boxY": ${parseInt(v) + DY}`);

    fs.writeFileSync(positionsPath, posContent, 'utf8');
    console.log('✅ Offset applied to stall_positions.js (+20x, +15y)');

    // 3. Update MongoDB database stalls
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const stalls = await Stall.find({});
    console.log(`Shifting ${stalls.length} stalls in MongoDB...`);

    let updatedCount = 0;
    for (const stall of stalls) {
      if (stall.coordinates && typeof stall.coordinates.x === 'number') {
        stall.coordinates.x += DX;
        stall.coordinates.y += DY;
        stall.markModified('coordinates');
        await stall.save();
        updatedCount++;
      }
    }
    console.log(`✅ Offset applied to ${updatedCount} stalls in MongoDB (+20x, +15y)`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to apply offsets:', err);
    process.exit(1);
  }
}

applyOffsets();
