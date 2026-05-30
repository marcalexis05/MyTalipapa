const fs = require('fs');
const stalls = JSON.parse(fs.readFileSync('c:\\Users\\christian dave\\OneDrive\\Dokumen\\MyTalipapa\\scratch\\mapped_stalls.json'));

const cxMap = {};
stalls.forEach(s => {
  const key = `${s.category} - Zone ${s.zone}`;
  if (!cxMap[key]) cxMap[key] = new Set();
  cxMap[key].add(s.cx);
});

for (const key in cxMap) {
  console.log(`${key}: cx values = ${Array.from(cxMap[key]).sort((a,b)=>a-b).join(', ')}`);
}
