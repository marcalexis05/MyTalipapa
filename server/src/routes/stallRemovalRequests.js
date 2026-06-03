const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const StallRemovalRequest = require('../models/StallRemovalRequest');
const Stall = require('../models/Stall');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'mytalipapa-secret-key-12345';

// Middleware for contractor authentication
const verifyContractor = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'contractor') {
      return res.status(403).json({ error: 'Contractor access only' });
    }
    req.contractor = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware for admin authentication
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/stall-removal-requests/request
router.post('/request', verifyContractor, async (req, res) => {
  const { stallId, location, requestReason } = req.body;

  if (!stallId || !location || !requestReason) {
    return res.status(400).json({ error: 'stallId, location, and requestReason are required' });
  }

  try {
    // Check contractor exists
    const user = await User.findById(req.contractor.id).select('email');
    if (!user) return res.status(404).json({ error: 'Contractor account not found' });
    const contractorEmail = user.email;

    // Check stall exists and status is "available"
    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({ error: 'Stall not found' });
    }

    if (stall.status !== 'available') {
      return res.status(400).json({ error: 'Stall status must be available to request removal' });
    }

    // Check contractor owns the stall
    if (stall.managedBy?.toLowerCase() !== contractorEmail.toLowerCase()) {
      return res.status(403).json({ error: 'You do not have permission to manage this stall' });
    }

    // Check no pending request already exists
    const existingPending = await StallRemovalRequest.findOne({ stallId, status: 'pending' });
    if (existingPending) {
      return res.status(400).json({ error: 'A removal request is already pending for this stall' });
    }

    // Create document in StallRemovalRequests collection
    const newRequest = await StallRemovalRequest.create({
      stallId,
      location,
      contractorId: req.contractor.id,
      requestReason,
      status: 'pending',
      requestedAt: new Date(),
    });

    return res.status(201).json({ message: 'Removal request submitted successfully', request: newRequest });
  } catch (err) {
    console.error('Error creating removal request:', err);
    return res.status(500).json({ error: 'Failed to submit removal request' });
  }
});

// GET /api/stall-removal-requests/admin/requests/pending
router.get('/admin/requests/pending', verifyAdmin, async (req, res) => {
  try {
    const pendingRequests = await StallRemovalRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('contractorId', 'businessName email');

    return res.json(pendingRequests);
  } catch (err) {
    console.error('Error fetching pending removal requests:', err);
    return res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// PUT /api/stall-removal-requests/admin/requests/:requestId/approve
router.put('/admin/requests/:requestId/approve', verifyAdmin, async (req, res) => {
  const { requestId } = req.params;
  const { adminNotes } = req.body;

  try {
    const request = await StallRemovalRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Removal request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Update request
    request.status = 'approved';
    request.adminNotes = adminNotes || '';
    request.reviewedAt = new Date();
    request.reviewedBy = req.admin.id;
    await request.save();

    // Update stall: tenant=null, status="available", and release managedBy
    await Stall.findByIdAndUpdate(request.stallId, {
      $set: {
        tenant: {
          name: null,
          contact: null,
          email: null,
          leaseStart: null,
          leaseEnd: null,
        },
        status: 'available',
        managedBy: null, // Clear/release management of the stall
      },
    });

    return res.json({ message: 'Removal request approved successfully', request });
  } catch (err) {
    console.error('Error approving removal request:', err);
    return res.status(500).json({ error: 'Failed to approve removal request' });
  }
});

// PUT /api/stall-removal-requests/admin/requests/:requestId/reject
router.put('/admin/requests/:requestId/reject', verifyAdmin, async (req, res) => {
  const { requestId } = req.params;
  const { adminNotes } = req.body;

  try {
    const request = await StallRemovalRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Removal request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Update request
    request.status = 'rejected';
    request.adminNotes = adminNotes || '';
    request.reviewedAt = new Date();
    request.reviewedBy = req.admin.id;
    await request.save();

    return res.json({ message: 'Removal request rejected successfully', request });
  } catch (err) {
    console.error('Error rejecting removal request:', err);
    return res.status(500).json({ error: 'Failed to reject removal request' });
  }
});

module.exports = router;
