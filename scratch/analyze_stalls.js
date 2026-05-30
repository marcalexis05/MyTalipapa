const fs = require('fs');
const path = require('path');

const stalls = require('./parsed_stalls.json');

// Group stalls by section/category
const sections = {};
stalls.forEach(s => {
  if (!sections[s.section]) sections[s.section] = [];
  sections[s.section].push(s);
});

console.log("Sections count:");
for (const sec in sections) {
  console.log(`- ${sec}: ${sections[sec].length} stalls`);
}

// Find unique column x values for each section
for (const sec in sections) {
  const xs = [...new Set(sections[sec].map(s => s.x))].sort((a,b) => a-b);
  console.log(`\n${sec} Section Column X coordinates:`);
  xs.forEach(x => {
    const matching = sections[sec].filter(s => s.x === x);
    const yRange = [Math.min(...matching.map(s => s.y)), Math.max(...matching.map(s => s.y))];
    const vals = matching.map(s => s.value).filter(Boolean);
    console.log(`  - x = ${x} (width: ${matching[0].width}, y: ${yRange[0]} to ${yRange[1]}) values: ${vals.slice(0, 5).join(', ')}... (total ${matching.length})`);
  });
}
