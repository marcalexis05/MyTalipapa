import { SVG_STALL_COORDS } from '../src/utils/coords_dict.js';
import { STALL_MAP } from '../src/utils/stallMap.js';
import { writeFileSync } from 'fs';
writeFileSync(new URL('./_coords.json', import.meta.url),
  JSON.stringify({ SVG_STALL_COORDS, STALL_MAP }, null, 0));
console.log('SVG keys:', Object.keys(SVG_STALL_COORDS).length,
            '| STALL_MAP cats:', Object.keys(STALL_MAP).join(','));
