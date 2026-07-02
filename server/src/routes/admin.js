const express = require('express');
const contractorController = require('../controllers/contractorController');
const router = express.Router();
const Announcement = require('../models/Announcement');

// GET announcements (admin view, optional role filter)
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
    console.error('Error fetching announcements (admin):', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Create a new announcement
router.post('/announcements', async (req, res) => {
  try {
    const { title, content, targetAudience } = req.body;
    const newAnnouncement = new Announcement({ title, content, targetAudience });
    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(400).json({ error: 'Failed to create announcement' });
  }
});

// Update an existing announcement
router.put('/announcements/:id', async (req, res) => {
  try {
    const { title, content, targetAudience } = req.body;
    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, content, targetAudience },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Announcement not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete an announcement
router.delete('/announcements/:id', async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() }, { new: true });
    if (!deleted) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

router.get('/applications', contractorController.getApplications);
router.post('/applications/:id/status', contractorController.updateApplicationStatus);
router.get('/contractor-applications', contractorController.getContractorApplications);
router.post('/contractor-applications/:id/status', contractorController.updateContractorApplicationStatus);

// Admin stalls endpoint
router.get('/stalls', contractorController.getStalls);

// Admin records endpoint (approved renter records)
router.get('/records', contractorController.getRecords);
router.get('/records/archived', contractorController.getAdminArchivedRecords);
router.get('/admin/records/archived', contractorController.getAdminArchivedRecords);
router.post('/records/:renterId/archive', contractorController.archiveRenter);
router.post('/admin/records/:renterId/archive', contractorController.archiveRenter);
router.post('/records/:renterId/unarchive', contractorController.unarchiveRenter);
router.post('/admin/records/:renterId/unarchive', contractorController.unarchiveRenter);

// Admin archive request handling
router.get('/archive-requests', contractorController.getArchiveRequests);
router.post('/archive-requests/:userId/status', contractorController.updateArchiveRequestStatus);

// Duplicate routes to support client URLs that mistakenly include a second "admin" segment
router.get('/admin/archive-requests', contractorController.getArchiveRequests);
router.post('/admin/archive-requests/:userId/status', contractorController.updateArchiveRequestStatus);

// Walk-in renter creation endpoint
router.post('/walk-in-renter', contractorController.createWalkInRenter);

// Stall creation and status toggle endpoints
router.post('/stalls', contractorController.addStall);
router.put('/stalls/:id/status', contractorController.toggleStallStatus);

// Activity Logs endpoint (Restricted to Admin account only)
const jwt = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/activity-logs', verifyAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 });

    // Build a lookup map: email -> full_name for any performedBy that looks like an email
    const emailsToLookup = [...new Set(
      logs
        .map(l => l.performedBy)
        .filter(p => p && p.includes('@'))
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
    console.error('Error fetching activity logs:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;
