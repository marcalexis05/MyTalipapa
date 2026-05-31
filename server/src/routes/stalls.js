const express = require('express');
const router = express.Router();
const Stall = require('../models/Stall');

// Helper to determine the descriptive hallway name
const getHallwayName = (hallway) => {
  const map = {
    'hallway1': 'Pathway 1 (near Zone A left)',
    'hallway2': 'Pathway 2 (between Zone A & B)',
    'hallway3&4': 'Pathway 3 & 4 (near Zone B)',
    'hallway5': 'Pathway 5 (near Zone B & C central path)',
    'hallway6': 'Pathway 6 (between Zone C & D)',
    'hallway7': 'Pathway 7 (near Zone D left)',
    'hallway8&9': 'Pathway 8 & 9 (near Zone D right)',
    'hallway10': 'Pathway 10 (far-right top edge)',
    'hallway27': 'Pathway 27 (bottom-left edge)',
    'hallway26': 'Pathway 26 (between left wall and Zone E)',
    'hallway25&26': 'Pathway 25 & 26 (near Zone E)',
    'hallway24': 'Pathway 24 (between Zone E & F)',
    'hallway21&22&23': 'Pathway 21, 22 & 23 (nzear Zone F & G central path)',
    'hallway17&18&19': 'Pathway 17, 18 & 19 (between Zone G & H)',
    'hallway16': 'Pathway 16 (near Zone H left)',
    'hallway13&14&15': 'Pathway 13, 14 & 15 (near Zone H right)',
    'hallway12': 'Pathway 12 (far-right bottom edge)',
  };
  return map[hallway] || 'the main walkway';
};

function generateDirections(stall) {
  const { zone, coordinates, section } = stall;
  const zoneLetter = String(zone || '').toUpperCase();
  const hallwayDesc = getHallwayName(coordinates?.hallway);
  const side = (coordinates?.x < 300) ? 'left' : (coordinates?.x > 500 ? 'right' : 'center');

  const directions = [
    `Enter through the main ENTRANCE & EXIT`,
    `Proceed along Pathway toward Zone ${zoneLetter} (${section || 'Market'} Section)`,
    `Walk down the corridor styled as ${hallwayDesc}`,
    `You will find Stall #${stall.stallNumber} on the ${side} side of the aisle`
  ];
  return directions.join(' → ');
}
// GET /api/stalls - Retrieve all stalls
router.get('/', async (req, res) => {
  try {
    const stalls = await Stall.find({}).sort({ stallNumber: 1 });
    
    const User = require('../models/User');
    const contractors = await User.find({ role: 'contractor' }, 'email full_name contact_number');
    const contractorMap = {};
    const contractorContactMap = {};
    contractors.forEach(c => {
      if (c.email) {
        contractorMap[c.email.toLowerCase()] = c.full_name;
        contractorContactMap[c.email.toLowerCase()] = c.contact_number || 'N/A';
      }
    });

    const stallsWithContractor = stalls.map(stall => {
      const stallObj = stall.toObject();
      if (stallObj.managedBy) {
        stallObj.contractorName = contractorMap[stallObj.managedBy.toLowerCase()] || stallObj.managedBy;
        stallObj.contractorContact = contractorContactMap[stallObj.managedBy.toLowerCase()] || 'N/A';
      } else {
        stallObj.contractorName = 'None';
        stallObj.contractorContact = 'N/A';
      }
      return stallObj;
    });

    res.json(stallsWithContractor);
  } catch (err) {
    console.error('Failed to get all stalls:', err);
    res.status(500).json({ error: 'Failed to fetch stalls' });
  }
});

// GET /api/stalls/search
router.get('/search', async (req, res) => {
  try {
    const { zone, stallNumber, query, productType } = req.query;
    
    let filter = {};
    
    // Search by exact zone + stall number
    if (zone && stallNumber) {
      filter = { 
        zone: zone.toUpperCase(), 
        stallNumber: String(stallNumber).trim().replace(/^0+(?=\d)/, '') 
      };
    }
    // Search by productType
    else if (productType) {
      filter = { productType: String(productType).toLowerCase() };
    }
    // Search by query string
    else if (query) {
      const trimmedQuery = String(query).trim();
      const numMatch = trimmedQuery.match(/\d+/);
      const zoneMatch = trimmedQuery.match(/zone\s+([a-h])/i) || trimmedQuery.match(/\b([a-h])\b/i);

      if (numMatch && zoneMatch) {
        // Looks like e.g. "stall 11 zone E"
        filter = { 
          zone: zoneMatch[1].toUpperCase(), 
          stallNumber: numMatch[0] 
        };
      } else {
        const searchRegex = new RegExp(trimmedQuery, 'i');
        filter = {
          $or: [
            { stallNumber: searchRegex },
            { zone: searchRegex },
            { section: searchRegex },
            { vendorName: searchRegex },
            { location: searchRegex }
          ]
        };
      }
    }
    
    const stall = await Stall.findOne(filter);
    
    if (!stall) {
      return res.status(404).json({ success: false, message: 'Stall not found' });
    }
    
    // Generate descriptive text directions
    const directions = generateDirections(stall);
    
    res.json({
      success: true,
      stall: {
        ...stall.toObject(),
        directions
      }
    });
  } catch (error) {
    console.error('Stall search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
