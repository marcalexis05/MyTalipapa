const express = require('express');
const router = express.Router();
const StallRequest = require('../models/StallRequest');
const Stall = require('../models/Stall');
const jwt = require('jsonwebtoken');

// Admin auth middleware
router.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// GET pending requests
router.get('/pending', async (req, res) => {
  try {
    const pending = await StallRequest.find({ status: 'pending', archived: { $ne: true } }).populate('stallId');
    res.json(pending);
  } catch (err) {
    console.error('Error fetching pending stall requests:', err);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// POST review (approve or reject)
router.post('/review', async (req, res) => {
  const { requestId, action } = req.body;
  if (!requestId || !action) return res.status(400).json({ error: 'Missing requestId or action' });

  try {
    const request = await StallRequest.findById(requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (action === 'approve') {
      await Stall.findByIdAndUpdate(request.stallId, {
        managedBy: request.contractorEmail,
        status: 'available',
      });
      request.status = 'approved';
    } else if (action === 'reject') {
      // Restore stall to available so others can request it
      await Stall.findByIdAndUpdate(request.stallId, {
        $unset: { managedBy: '' },
        status: 'available',
      });
      request.status = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    request.updatedAt = new Date();
    await request.save();
    res.json({ message: `Request ${action}d` });
  } catch (err) {
    console.error('Error reviewing stall request:', err);
    res.status(500).json({ error: 'Failed to review request' });
  }
});

// GET approved requests
router.get('/approved', async (req, res) => {
  try {
    const approved = await StallRequest.find({ status: 'approved', archived: { $ne: true } }).populate('stallId');
    res.json(approved);
  } catch (err) {
    console.error('Error fetching approved stall requests:', err);
    res.status(500).json({ error: 'Failed to fetch approved requests' });
  }
});

// GET rejected requests
router.get('/rejected', async (req, res) => {
  try {
    const rejected = await StallRequest.find({ status: 'rejected', archived: { $ne: true } }).populate('stallId');
    res.json(rejected);
  } catch (err) {
    console.error('Error fetching rejected stall requests:', err);
    res.status(500).json({ error: 'Failed to fetch rejected requests' });
  }
});

// GET archived requests
router.get('/archived', async (req, res) => {
  try {
    const archived = await StallRequest.find({ archived: true }).populate('stallId');
    res.json(archived);
  } catch (err) {
    console.error('Error fetching archived stall requests:', err);
    res.status(500).json({ error: 'Failed to fetch archived requests' });
  }
});

// DELETE request (permanently remove)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await StallRequest.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() }, { new: true });
    if (!deleted) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request deleted successfully' });
  } catch (err) {
    console.error('Error deleting stall request:', err);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// PUT archive request
router.put('/:id/archive', async (req, res) => {
  try {
    const request = await StallRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    request.archived = true;
    request.updatedAt = new Date();
    await request.save();
    res.json({ message: 'Request archived successfully', request });
  } catch (err) {
    console.error('Error archiving stall request:', err);
    res.status(500).json({ error: 'Failed to archive request' });
  }
});

// PUT unarchive request
router.put('/:id/unarchive', async (req, res) => {
  try {
    const request = await StallRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    request.archived = false;
    request.updatedAt = new Date();
    await request.save();
    res.json({ message: 'Request unarchived successfully', request });
  } catch (err) {
    console.error('Error unarchiving stall request:', err);
    res.status(500).json({ error: 'Failed to unarchive request' });
  }
});

module.exports = router;
