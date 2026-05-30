const stalls = require('./parsed_stalls.json');

const col1 = stalls.filter(s => s.x === 120).sort((a,b) => a.y - b.y);
console.log("Column x=120 stalls (sorted by y):");
col1.forEach(s => {
  console.log(`y: ${s.y}, h: ${s.height}, value: "${s.value}" (${s.category})`);
});
