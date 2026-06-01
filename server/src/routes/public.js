const express = require('express');
const router = express.Router();
const Stall = require('../models/Stall');
const Announcement = require('../models/Announcement');


// GET /api/public/stalls/stats
router.get('/stalls/stats', async (req, res) => {
  try {
    const totalStalls = await Stall.countDocuments();
    const occupiedStalls = await Stall.countDocuments({ status: 'occupied' });
    const availableStalls = totalStalls - occupiedStalls;
    res.json({ totalStalls, occupiedStalls, availableStalls });
  } catch (error) {
    console.error('Error fetching stall stats:', error);
    res.status(500).json({ error: 'Failed to fetch stall statistics' });
  }
});

// GET /api/public/announcements
router.get('/announcements', async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role === 'renter') {
      query.targetAudience = { $in: ['all', 'renters'] };
    } else if (role === 'contractor') {
      query.targetAudience = { $in: ['all', 'contractors'] };
    }
    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});



module.exports = router;
