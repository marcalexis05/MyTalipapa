const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dictPath = path.join(__dirname, '../../../client/src/utils/coords_dict.js');
const fileContent = fs.readFileSync(dictPath, 'utf8');
const jsCode = fileContent.replace('export const SVG_STALL_COORDS =', 'const data =') + '; return data;';
const SVG_STALL_COORDS = new Function(jsCode)();

const Stall = require('../models/Stall');

async function find() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const dbStalls = await Stall.find({});
    
    const dbKeys = new Set(dbStalls.map(s => {
      const cat = s.productType || (s.section.toLowerCase().includes('fish') ? 'fish' : s.section.toLowerCase().includes('veg') ? 'veggies' : 'meat');
      let suffix = '';
      if (s.zone === 'E' && ['1','2','3','4','5','12','13'].includes(s.stallNumber)) {
        suffix = '(u)';
      } else if (s.zone === 'F' && cat === 'meat') {
        suffix = '(u2)';
      }
      return `${cat}-${s.stallNumber}${suffix}`;
    }));

    console.log('--- KEYS IN COORDS_DICT.JS BUT MISSING IN MONGODB ---');
    Object.keys(SVG_STALL_COORDS).forEach(k => {
      if (!dbKeys.has(k)) {
        console.log(k);
      }
    });

    console.log('--- KEYS IN MONGODB BUT MISSING IN COORDS_DICT.JS ---');
    dbStalls.forEach(s => {
      const cat = s.productType || (s.section.toLowerCase().includes('fish') ? 'fish' : s.section.toLowerCase().includes('veg') ? 'veggies' : 'meat');
      let suffix = '';
      if (s.zone === 'E' && ['1','2','3','4','5','12','13'].includes(s.stallNumber)) {
        suffix = '(u)';
      } else if (s.zone === 'F' && cat === 'meat') {
        suffix = '(u2)';
      }
      const key = `${cat}-${s.stallNumber}${suffix}`;
      if (!SVG_STALL_COORDS[key]) {
        console.log(`${key} (Stall #${s.stallNumber} in ${s.section}, Zone ${s.zone})`);
      }
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

find();
