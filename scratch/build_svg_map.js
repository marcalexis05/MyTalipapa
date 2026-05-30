const fs = require('fs');
const path = require('path');

const parsedStalls = require('./parsed_stalls.json');

const mapped = [];
const unmapped = [];

parsedStalls.forEach(s => {
  // Ignore toilet, guard house, legend blocks, etc.
  if (s.value.includes("TOILET") || s.value.includes("GUARD HOUSE") || s.value === "") {
    return;
  }

  // Determine zone
  let zone = '';
  if (s.y < 600) {
    if (s.x < 450) zone = 'A';
    else if (s.x < 900) zone = 'B';
    else if (s.x < 1450) zone = 'C';
    else zone = 'D';
  } else {
    if (s.x < 450) zone = 'E';
    else if (s.x < 950) zone = 'F';
    else if (s.x < 1450) zone = 'G';
    else zone = 'H';
  }

  // In the top-left column (x = 120, y < 600), all values are "5".
  // Let's map them to their correct stallNumbers 1 to 5 based on y position (bottom-to-top).
  let stallNum = s.value;
  if (s.x === 120 && s.y < 600 && s.category === 'meat') {
    // y = 530 is 1, y = 450 is 2, y = 370 is 3, y = 280 is 4, y = 190 is 5
    if (s.y === 530) stallNum = '1';
    else if (s.y === 450) stallNum = '2';
    else if (s.y === 370) stallNum = '3';
    else if (s.y === 280) stallNum = '4';
    else if (s.y === 190) stallNum = '5';
  }

  // In Zone F Meat section, we have duplicates of 1 to 10 in the same column (x = 620, y > 600).
  // Wait, let's check how they are labeled. In the parsed stalls we saw Meat stalls in column 620:
  // y = 800 (10), y = 860 (9), y = 880 (empty? wait), etc.
  // Let's see what values are there.

  mapped.push({
    ...s,
    zone,
    stallNum
  });
});

console.log(`Mapped ${mapped.length} stalls.`);
fs.writeFileSync(path.join(__dirname, 'mapped_stalls.json'), JSON.stringify(mapped, null, 2));
console.log("Mapped stalls written to mapped_stalls.json");
