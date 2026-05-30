const stalls = require('./parsed_stalls.json');

const topLeftStalls = stalls.filter(s => s.x < 400 && s.y < 600).sort((a, b) => {
  if (a.x !== b.x) return a.x - b.x;
  return a.y - b.y;
});

console.log("Top-Left Quadrant Stalls (x < 400, y < 600):");
topLeftStalls.forEach(s => {
  console.log(`x: ${s.x}, y: ${s.y}, w: ${s.width}, h: ${s.height}, value: "${s.value}" (${s.category})`);
});
