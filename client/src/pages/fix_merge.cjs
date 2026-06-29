const fs = require('fs');
const path = 'c:/Users/Val/Desktop/MyTalipapa/client/src/pages/Renter/ArFinder.jsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const out = [];
let inConflict = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('<<<<<<< HEAD')) {
    inConflict = true;
    out.push(`    <ArMapCanvas`);
    out.push(`      userX={userX} userY={userY} heading={heading}`);
    out.push(`      motionActive={motionActive} stepCount={stepCount}`);
    out.push(`      stallsList={stallsList} selectedStallId={selectedStallId}`);
    out.push(`      pathPoints={pathPoints}`);
    out.push(`      onMapClick={handleMapClick}`);
    out.push(`      onSelectStall={(s) => {`);
    out.push(`        setSelectedCategory(s.category);`);
    out.push(`        setSelectedStallId(s.id);`);
    out.push(`        setToastMsg(\`Routing to \${s.label}\`);`);
    out.push(`      }}`);
    out.push(`    />`);
    continue;
  }

  if (inConflict) {
    if (line.includes('>>>>>>> b04b418c')) {
      inConflict = false;
    }
    continue;
  }

  out.push(line);
}

fs.writeFileSync(path, out.join('\n'));
console.log('ArFinder merge conflict resolved.');
