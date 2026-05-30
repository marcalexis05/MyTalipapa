const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, '../client/src/utils/coords_dict.js');
let dictContent = fs.readFileSync(dictPath, 'utf8');

// Regex to match "x": <number>
const regex = /"x":\s*(\d+)/g;
const newDictContent = dictContent.replace(regex, (match, xStr) => {
  const x = parseInt(xStr);
  return `"x": ${x + 75}`;
});

fs.writeFileSync(dictPath, newDictContent, 'utf8');
console.log('✅ Shifted client/src/utils/coords_dict.js coordinates back (+75) successfully.');
