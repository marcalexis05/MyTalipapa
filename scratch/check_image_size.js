const fs = require('fs');
const buffer = fs.readFileSync('c:\\Users\\christian dave\\OneDrive\\Dokumen\\MyTalipapa\\client\\src\\images\\map.png');

const width = buffer.readInt32BE(16);
const height = buffer.readInt32BE(20);

console.log(`map.png dimensions: ${width}x${height}`);
