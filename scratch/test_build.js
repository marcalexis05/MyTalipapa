const { SVG_STALL_COORDS } = require('../client/src/utils/coords_dict');

const getStallZone = (num, category) => {
  const stallId = String(num);
  if (category === 'meat') {
    if (['1', '2', '3', '4', '5', '12', '13', 'empty', 'empty2', 'empty3'].includes(stallId)) return 'Zone A';
    if (['51', '52', '53', '54', '55', '56'].includes(stallId)) return 'Zone C';
    if (['1(u2)', '2(u2)', '3(u2)', '4(u2)', '8(u2)', '9(u2)', '10(u2)'].includes(stallId)) return 'Zone F';
    return 'Zone E';
  } else if (category === 'fish') {
    const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
    if (numInt >= 11 && numInt <= 20) return 'Zone A';
    if (numInt >= 21 && numInt <= 40) return 'Zone B';
    if ((numInt >= 41 && numInt <= 50) || (numInt >= 57 && numInt <= 60)) return 'Zone C';
    return 'Zone D';
  } else if (category === 'veggies') {
    const numInt = parseInt(stallId.replace(/[^0-9]/g, '')) || 0;
    if (numInt >= 5 && numInt <= 24) return 'Zone F';
    if (numInt >= 25 && numInt <= 48) return 'Zone G';
    return 'Zone H';
  }
  return 'Zone A';
};

const getStallCoords = (rawId, category, zone) => {
  const key = `${category}-${rawId}`;
  if (SVG_STALL_COORDS[key]) return SVG_STALL_COORDS[key];
  
  // Fallback parsed numeric matching
  const num = parseInt(String(rawId).replace(/[^0-9]/g, '')) || 1;
  const genericKey = `${category}-${num}`;
  if (SVG_STALL_COORDS[genericKey]) return SVG_STALL_COORDS[genericKey];

  return { x: 1020, y: 635 }; // center default fallback
};

const buildAllStalls = () => {
  const meatIds = [
    '1', '1(u)', '1(u2)', '2', '2(u)', '2(u2)', '3', '3(u)', '3(u2)', '4', '4(u)', '4(u2)',
    '5', 'empty', 'empty2', 'empty3',
    '5(u)', '6', '7', '8', '9', '10', '8(u)', '9(u)', '10(u)', '11', '12', '12(u)', '13', '13(u)', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24',
    '51', '52', '53', '54', '55', '56'
  ];
  
  const list = [];
  meatIds.forEach(id => {
    const zone = getStallZone(id, 'meat');
    const coords = getStallCoords(id, 'meat', zone);
    list.push({ id: `meat-${id}`, zone, coords });
  });
  return list;
};

console.log(buildAllStalls().filter(s => s.id.includes('51') || s.id.includes('55')));
