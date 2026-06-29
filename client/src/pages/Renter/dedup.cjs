const fs = require('fs');
const path = 'c:/Users/Val/Desktop/MyTalipapa/client/src/pages/Renter/ArFinder.jsx';
let content = fs.readFileSync(path, 'utf8');

// The block to remove is from `const advanceToNextCheckpoint = (e) => {` 
// to `setToastMsg("Advanced to next checkpoint.");\n    }\n  };\n`
const regex = /\s*const advanceToNextCheckpoint = \(e\) => \{[\s\S]*?setToastMsg\("Advanced to next checkpoint\."\);\n\s*\}\n\s*\};\n/;

// Remove the first occurrence
content = content.replace(regex, '');

// Also deduplicate the Next Checkpoint Button
const btnRegex = /\s*\{\/\* Next Checkpoint Button \*\/\}\s*\{pathPoints && pathPoints\.length > 1 && !isArrived && \([\s\S]*?<\/button>\n\s*\)\}\n/;
content = content.replace(btnRegex, '');

fs.writeFileSync(path, content);
console.log('Deduplicated.');
