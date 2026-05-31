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

module.exports = router;