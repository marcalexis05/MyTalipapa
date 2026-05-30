const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../client/src/images/map.drawio.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// The XML is in the content attribute of the <svg> element, let's extract it
const contentMatch = svgContent.match(/content="([^"]+)"/);
if (!contentMatch) {
  console.error("Could not find content attribute in SVG");
  process.exit(1);
}

// Decode html entities
let xmlString = contentMatch[1]
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/&#xa;/g, '\n')
  .replace(/&#10;/g, '\n');

// Write to a temporary file to inspect
fs.writeFileSync(path.join(__dirname, 'decoded_drawio.xml'), xmlString);
console.log("Decoded drawio xml written to decoded_drawio.xml");
