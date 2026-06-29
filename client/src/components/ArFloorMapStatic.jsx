import React, { useMemo } from 'react';
import { SVG_STALL_COORDS } from '../utils/coords_dict';

export default function ArFloorMapStatic() {
  const stalls = useMemo(() => {
    const stallList = Object.entries(SVG_STALL_COORDS).map(([key, coords]) => {
      const category = key.split('-')[0];
      const rawNum = key.split('-')[1];
      let displayNum = rawNum.replace(/\(u\d*\)/g, '');
      if (displayNum.startsWith('nostallnum')) displayNum = '';
      if (displayNum.startsWith('empty')) displayNum = '';
      return { id: key, category, displayNum, ...coords };
    });

    const cols = {};
    stallList.forEach(s => {
      if (!cols[s.x]) cols[s.x] = [];
      cols[s.x].push(s);
    });
    Object.values(cols).forEach(col => col.sort((a, b) => a.y - b.y));

    return stallList.map(s => {
      const col = cols[s.x];
      const idx = col.findIndex(c => c.id === s.id);
      let height = 64;
      if (idx < col.length - 1) {
        const nextY = col[idx + 1].y;
        const gap = nextY - s.y;
        if (gap < 68) height = gap - 4;
      }
      return { ...s, height };
    });
  }, []);

  return (
    <g className="ar-floor-map-static">
      {/* Base Floor Background */}
      <rect x="0" y="0" width="2305" height="1824" fill="#f1f5f9" />
      
      {/* Market Outer Wall */}
      <rect x="150" y="100" width="1950" height="1650" fill="none" stroke="#cbd5e1" strokeWidth="16" rx="24" />

      {/* Pathways Labels */}
      <text x="1152" y="160" textAnchor="middle" fill="#94a3b8" fontSize="42" fontWeight="800" letterSpacing="12">NORTH PATHWAY</text>
      <text x="1152" y="870" textAnchor="middle" fill="#94a3b8" fontSize="42" fontWeight="800" letterSpacing="12">CENTRAL PATHWAY</text>
      <text x="1152" y="1690" textAnchor="middle" fill="#94a3b8" fontSize="42" fontWeight="800" letterSpacing="12">MAIN ENTRANCE / EXIT</text>

      {/* Aisle Labels (Vertical) */}
      <g transform="translate(642, 500) rotate(-90)">
        <text x="0" y="0" textAnchor="middle" fill="#cbd5e1" fontSize="32" fontWeight="700" letterSpacing="8">AISLE 1</text>
      </g>
      <g transform="translate(1142, 500) rotate(-90)">
        <text x="0" y="0" textAnchor="middle" fill="#cbd5e1" fontSize="32" fontWeight="700" letterSpacing="8">AISLE 2</text>
      </g>
      <g transform="translate(1642, 500) rotate(-90)">
        <text x="0" y="0" textAnchor="middle" fill="#cbd5e1" fontSize="32" fontWeight="700" letterSpacing="8">AISLE 3</text>
      </g>
      
      <g transform="translate(642, 1250) rotate(-90)">
        <text x="0" y="0" textAnchor="middle" fill="#cbd5e1" fontSize="32" fontWeight="700" letterSpacing="8">AISLE 4</text>
      </g>
      <g transform="translate(1142, 1250) rotate(-90)">
        <text x="0" y="0" textAnchor="middle" fill="#cbd5e1" fontSize="32" fontWeight="700" letterSpacing="8">AISLE 5</text>
      </g>
      <g transform="translate(1642, 1250) rotate(-90)">
        <text x="0" y="0" textAnchor="middle" fill="#cbd5e1" fontSize="32" fontWeight="700" letterSpacing="8">AISLE 6</text>
      </g>

      {/* Stalls rendering */}
      {stalls.map(s => {
        let fill = '#e2e8f0'; 
        let stroke = '#cbd5e1';
        let textColor = '#64748b';
        
        if (s.category === 'meat') {
          fill = '#fee2e2';
          stroke = '#fca5a5';
          textColor = '#ef4444';
        } else if (s.category === 'fish') {
          fill = '#dbeafe';
          stroke = '#93c5fd';
          textColor = '#3b82f6';
        } else if (s.category === 'veggies') {
          fill = '#dcfce7';
          stroke = '#86efac';
          textColor = '#22c55e';
        }

        const rectY = -(s.height / 2);
        let fontSize = 28;
        if (s.height < 30) fontSize = 16;
        else if (s.height < 45) fontSize = 20;
        const textY = (s.height < 30) ? 5 : 9;

        return (
          <g key={`static-${s.id}`} transform={`translate(${s.x},${s.y})`} style={{ pointerEvents: 'none' }}>
             <rect x="-78" y={rectY} width="156" height={s.height} fill={fill} stroke={stroke} strokeWidth="3" rx="6" />
             {s.displayNum && (
               <text x="0" y={textY} textAnchor="middle" fill={textColor} fontSize={fontSize} fontWeight="bold" opacity="0.8">
                 {s.displayNum}
               </text>
             )}
          </g>
        )
      })}
    </g>
  );
}
