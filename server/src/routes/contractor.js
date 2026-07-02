// server/src/routes/contractor.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/contractorController');

// Get applications list
router.get('/applications', controller.getApplications);

// Update application status (approve/reject)
router.post('/applications/:id/status', controller.updateApplicationStatus);

// Get contractor registration applications
router.get('/contractor-applications', controller.getContractorApplications);

// Update contractor registration application status (approve/reject)
router.post('/contractor-applications/:id/status', controller.updateContractorApplicationStatus);

// Get stalls list
router.get('/stalls', controller.getStalls);

// Enable/disable a stall listing (contractor-managed) — matches admin toggle
router.put('/stalls/:id/status', controller.toggleStallStatus);

// Get renter records
router.get('/records', controller.getRecords);

// Record cash payment
router.post('/records/:renterId/payments', controller.recordPayment);

// Archive a renter (move out)
router.post('/records/:renterId/archive', controller.archiveRenter);

// Request archive access for contractor
router.post('/archive-request', controller.requestArchiveAccess);

// Get archived records (contractor, access-restricted)
// NOTE: must be before /records/:id if that ever gets added
router.get('/records/archived', controller.getArchivedRecords);

// Get renter email by stall number (for move-out modal)
router.get('/records/by-stall/:stallNumber', controller.getRenterByStall);

// Get archive requests list (admin)
router.get('/admin/archive-requests', controller.getArchiveRequests);

// Update archive request status (admin approval/denial)
router.post('/admin/archive-requests/:userId/status', controller.updateArchiveRequestStatus);

// Get archived records (admin, unrestricted)
router.get('/admin/records/archived', controller.getAdminArchivedRecords);

// Notifications routes
router.get('/notifications', controller.getNotifications);
router.post('/notifications/:id/read', controller.markAsRead);
router.post('/notifications/read-all', controller.markAllAsRead);

// Activity logs — scoped to this contractor's actions
router.get('/activity-logs', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const ActivityLog = require('../models/ActivityLog');
    const User = require('../models/User');
    const Stall = require('../models/Stall');
    
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    let email = req.query.email || '';

    // Prefer email from verified JWT so contractors can't spoof each other's logs
    let fullName = '';
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');
        if (decoded.id) {
          const user = await User.findById(decoded.id);
          if (user) {
            if (user.email) email = user.email.toLowerCase();
            fullName = user.full_name;
          }
        } else if (decoded.email) {
          email = decoded.email.toLowerCase();
          const user = await User.findOne({ email });
          if (user) {
            fullName = user.full_name;
          }
        }
      } catch (_) { /* fall back to query param */ }
    }

    if (!email) return res.status(400).json({ error: 'Email required' });

    // Try to find full name if we don't have it yet
    if (!fullName) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        fullName = user.full_name;
      }
    }

    // Show logs performed by this contractor OR logs about their managed stalls
    const lowerEmail = email.toLowerCase();
    const managedStalls = await Stall.find({ managedBy: lowerEmail });
    const stallNumbers = managedStalls.map(s => String(s.stallNumber));

    const orConditions = [
      { performedBy: lowerEmail }
    ];
    if (fullName) {
      orConditions.push({ performedBy: fullName });
    }

    if (stallNumbers.length > 0) {
      stallNumbers.forEach(num => {
        orConditions.push({
          details: { $regex: new RegExp(`Stall\\s*#?\\s*0*${num}\\b`, 'i') }
        });
      });
    }

    const logs = await ActivityLog.find({ $or: orConditions }).sort({ createdAt: -1 });

    // Enrich performedBy: if it looks like an email, replace with user's full_name
    const emailsToLookup = [...new Set(
      logs.map(l => l.performedBy).filter(p => p && p.includes('@'))
    )];
    const userMap = {};
    if (emailsToLookup.length > 0) {
      const users = await User.find(
        { email: { $in: emailsToLookup } },
        'email full_name'
      );
      users.forEach(u => { userMap[u.email.toLowerCase()] = u.full_name; });
    }
    const enriched = logs.map(log => {
      const pb = log.performedBy || '';
      const fullName = pb.includes('@') ? (userMap[pb.toLowerCase()] || pb) : pb;
      return { ...log.toObject(), performedBy: fullName };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Contractor activity-logs error:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;