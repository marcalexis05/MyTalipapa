const fs = require('fs');
const path = require('path');

const xml = fs.readFileSync(path.join(__dirname, 'decoded_drawio.xml'), 'utf8');

const ids = [
  'Iw4QoTsPQH7Iv-d7AKtg-262',
  'Iw4QoTsPQH7Iv-d7AKtg-446',
  'Iw4QoTsPQH7Iv-d7AKtg-447',
  'Iw4QoTsPQH7Iv-d7AKtg-449',
  'Iw4QoTsPQH7Iv-d7AKtg-450',
  'Iw4QoTsPQH7Iv-d7AKtg-451'
];

ids.forEach(id => {
  const index = xml.indexOf(`id="${id}"`);
  if (index !== -1) {
    const start = xml.lastIndexOf('<mxCell', index);
    const end = xml.indexOf('</mxCell>', index) + 9;
    console.log(`Cell ${id}:`);
    console.log(xml.substring(start, end));
    console.log('-'.repeat(40));
  } else {
    console.log(`Cell ${id} not found.`);
  }
});
