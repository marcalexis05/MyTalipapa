const fs = require('fs');
const path = require('path');

const mapped = JSON.parse(fs.readFileSync(path.join(__dirname, 'mapped_stalls.json'), 'utf8'));

mapped.forEach(item => {
  if (item.zone === 'A' && item.category === 'fish') {
    console.log(`StallNum: ${item.stallNum} | Val: ${item.value} | cx: ${item.cx}, cy: ${item.cy} | x: ${item.x}, y: ${item.y}`);
  }
});
