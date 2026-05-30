const fs = require('fs');
const path = require('path');

const xmlPath = path.join(__dirname, 'decoded_drawio.xml');
const xml = fs.readFileSync(xmlPath, 'utf8');

// We need to parse all <mxCell> tags. Let's find each mxCell element.
// Note that mxCell can either be:
// <mxCell ...> <mxGeometry ... /> </mxCell>
// or it can be a self-closing tag if it has no geometry (e.g. style objects)
// Let's find mxCells and search for nested mxGeometry using a robust scanner.

const stalls = [];

// Helper to parse key-value attributes from a tag string
const parseAttrs = (str) => {
  const attrs = {};
  const regex = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = regex.exec(str)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
};

// Find all mxCell tags
const mxCellTagRegex = /<mxCell\s+([^>]+)>/g;
let tagMatch;

while ((tagMatch = mxCellTagRegex.exec(xml)) !== null) {
  const mxCellAttrsStr = tagMatch[1];
  const mxCellAttrs = parseAttrs(mxCellAttrsStr);
  
  if (mxCellAttrs.vertex !== '1') continue;

  const style = mxCellAttrs.style || '';
  let category = '';
  let section = '';
  if (style.includes('fillColor=#b85450')) {
    category = 'meat';
    section = 'Meat';
  } else if (style.includes('fillColor=#dae8fc')) {
    category = 'fish';
    section = 'Fishes';
  } else if (style.includes('fillColor=#d5e8d4')) {
    category = 'veggies';
    section = 'Vegetables';
  } else {
    // Skip shapes that are not stalls (e.g. Toilet, Guard House, legend)
    continue;
  }

  const value = mxCellAttrs.value || '';
  const cleanValue = value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#xa;/g, ' ')
    .replace(/&#10;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();

  // Find the geometry for this cell
  // It should be within the next few characters until </mxCell>
  const startSearchIndex = tagMatch.index + tagMatch[0].length;
  const endSearchIndex = xml.indexOf('</mxCell>', startSearchIndex);
  if (endSearchIndex === -1) continue;

  const innerXml = xml.substring(startSearchIndex, endSearchIndex);
  const mxGeometryMatch = innerXml.match(/<mxGeometry\s+([^>]+)\s*\/>/);
  if (!mxGeometryMatch) continue;

  const mxGeometryAttrs = parseAttrs(mxGeometryMatch[1]);
  const x = parseFloat(mxGeometryAttrs.x || 0);
  const y = parseFloat(mxGeometryAttrs.y || 0);
  const width = parseFloat(mxGeometryAttrs.width || 0);
  const height = parseFloat(mxGeometryAttrs.height || 0);

  // Center coordinate of the stall
  const cx = x + width / 2;
  const cy = y + height / 2;

  stalls.push({
    id: mxCellAttrs.id,
    value: cleanValue,
    category,
    section,
    x,
    y,
    width,
    height,
    cx: Math.round(cx),
    cy: Math.round(cy)
  });
}

console.log(`Parsed ${stalls.length} stalls.`);
fs.writeFileSync(path.join(__dirname, 'parsed_stalls.json'), JSON.stringify(stalls, null, 2));
console.log("Parsed stalls written to parsed_stalls.json");
