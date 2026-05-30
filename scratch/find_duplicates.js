const stalls = require('./parsed_stalls.json');

const seen = {};
stalls.forEach(s => {
  const key = `${s.category}-${s.value}`;
  if (!seen[key]) seen[key] = [];
  seen[key].push(s);
});

console.log("Duplicate keys in drawio:");
let dupCount = 0;
for (const key in seen) {
  if (seen[key].length > 1) {
    console.log(`- ${key}: ${seen[key].length} occurrences:`);
    seen[key].forEach(s => {
      console.log(`  id: ${s.id}, x: ${s.x}, y: ${s.y}, w: ${s.width}, h: ${s.height}`);
    });
    dupCount++;
  }
}
if (dupCount === 0) {
  console.log("No duplicate keys found!");
}
