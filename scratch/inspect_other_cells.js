const fs = require('fs');
const path = require('path');

const xml = fs.readFileSync(path.join(__dirname, 'decoded_drawio.xml'), 'utf8');

const parseAttrs = (str) => {
  const attrs = {};
  const regex = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = regex.exec(str)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
};

const mxCellTagRegex = /<mxCell\s+([^>]+)>/g;
let tagMatch;

console.log("Non-Stall Cells in Draw.io:");
while ((tagMatch = mxCellTagRegex.exec(xml)) !== null) {
  const mxCellAttrsStr = tagMatch[1];
  const mxCellAttrs = parseAttrs(mxCellAttrsStr);
  
  if (mxCellAttrs.vertex !== '1') continue;

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

  // If it's a stall shape, skip
  const style = mxCellAttrs.style || '';
  if (style.includes('fillColor=#b85450') || style.includes('fillColor=#dae8fc') || style.includes('fillColor=#d5e8d4')) {
    continue;
  }

  // Find the geometry for this cell
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

  console.log(`- Value: "${cleanValue}" | x: ${x}, y: ${y}, w: ${width}, h: ${height} | id: ${mxCellAttrs.id}`);
}
