const express = require('express');
const router = express.Router();
const Stall = require('../models/Stall');
const StallRequest = require('../models/StallRequest');
const jwt = require('jsonwebtoken');

router.use((req, res, next) => {
  console.log('ContractorStallRequests route hit:', req.method, req.path);
  next();
});

// Contractor auth middleware
router.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');
    if (decoded.role !== 'contractor') return res.status(403).json({ error: 'Contractor only' });
    req.contractor = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// POST a new request for a stall (or multiple)
router.post('/request', async (req, res) => {
  const { stallIds } = req.body;
  const email = req.contractor.email;
  
  if (!Array.isArray(stallIds) || stallIds.length === 0) {
    return res.status(400).json({ error: 'Please provide an array of stall IDs' });
  }

  const results = [];
  for (const stallId of stallIds) {
    const stall = await Stall.findById(stallId);
    if (!stall) {
      results.push({ stallId, status: 'error', message: 'Stall not found' });
      continue;
    }
    if (stall.managedBy) {
      results.push({ stallId, status: 'error', message: 'Stall already assigned' });
      continue;
    }
    const existing = await StallRequest.findOne({ stallId, contractorEmail: email, status: 'pending' });
    if (existing) {
      results.push({ stallId, status: 'error', message: 'Request already pending' });
      continue;
    }
    const reqDoc = await StallRequest.create({ stallId, contractorEmail: email });
    results.push({ stallId, status: 'success', requestId: reqDoc._id });
  }
  
  res.status(201).json(results);
});

// Fallback POST route (accepts direct POST without /request)
router.post('/', async (req, res) => {
  // Forward to the same logic as /request
  req.url = '/request';
  router.handle(req, res);
});

// GET available unassigned stalls, optional location filter
router.get('/available', async (req, res) => {
  const { location } = req.query;
  const query = { $or: [{ managedBy: { $exists: false } }, { managedBy: null }] };
  if (location) query.location = new RegExp(location, 'i');
  const stalls = await Stall.find(query);
  res.json(stalls);
});

module.exports = router;
