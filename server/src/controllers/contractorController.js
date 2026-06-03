// contractorController.js
const Stall = require('../models/Stall');
const Application = require('../models/Application');

// ── Helper: resolve stallNumber from application ──────────
async function findStallByAppStallNumber(raw, intendedBusinessUse = '') {
  if (!raw) return null;

  const clean = raw.replace(/Stall\s*#/gi, '').replace('#', '').trim();

  const mongoose = require('mongoose');
  if (mongoose.Types.ObjectId.isValid(clean)) {
    const stall = await Stall.findById(clean);
    if (stall) return stall;
  }

  const use = (intendedBusinessUse || '').toLowerCase();
  let productType = '';
  if (use.includes('fish') || use.includes('sea')) productType = 'fish';
  else if (use.includes('meat')) productType = 'meat';
  else if (use.includes('veg') || use.includes('produce')) productType = 'veggies';

  let query = { stallNumber: clean };
  if (productType) {
    query.productType = productType;
  }
  let stall = await Stall.findOne(query);
  if (stall) return stall;

  // 1. Exact match
  stall = await Stall.findOne({ stallNumber: raw });
  if (stall) return stall;

  // 2. Strip leading zeros (e.g. "045" → "45")
  const stripped = String(Number(raw.replace(/\D/g, '')));
  stall = await Stall.findOne({ stallNumber: stripped });
  if (stall) return stall;

  // 3. Digits only (e.g. "STALL #045" → "45")
  const numOnly = raw.replace(/\D/g, '');
  stall = await Stall.findOne({ stallNumber: numOnly });
  if (stall) return stall;

  return null;
}

// ── GET /api/contractor/stalls ────────────────────────────
exports.getStalls = async (req, res) => {
  try {
    const { email, unmanaged, hasContractor } = req.query;
    let query = {};
    if (email) {
      query = { managedBy: email.toLowerCase() };
    } else if (unmanaged === 'true') {
      query = {
        $or: [
          { managedBy: { $exists: false } },
          { managedBy: null },
          { managedBy: '' }
        ]
      };
    } else if (hasContractor === 'true') {
      query = {
        managedBy: { $exists: true, $nin: [null, ''] }
      };
    }
    const stalls = await Stall.find(query).sort({ section: 1, floorArea: 1, floorCol: 1, floorRow: 1 });

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
    console.error('getStalls error:', err);
    res.status(500).json({ error: 'Failed to fetch stalls' });
  }
};

// ── GET /api/contractor/stalls/:id ───────────────────────
exports.getStallById = async (req, res) => {
  try {
    const stall = await Stall.findById(req.params.id);
    if (!stall) return res.status(404).json({ error: 'Stall not found' });
    res.json(stall);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stall' });
  }
};

// ── PATCH /api/contractor/stalls/:id/status ──────────────
exports.updateStallStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['available', 'occupied', 'pending'];
    if (!valid.includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const stall = await Stall.findByIdAndUpdate(
      req.params.id,
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    );
    if (!stall) return res.status(404).json({ error: 'Stall not found' });
    res.json(stall);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stall status' });
  }
};

// ── GET /api/contractor/applications ─────────────────────
// CORRECTED VERSION: Use stall.location (not stall.coordinates.location)
exports.getApplications = async (req, res) => {
  try {
    const { email } = req.query;
    let query = { archived: { $ne: true } };
    if (email) {
      query.contractorEmail = email.toLowerCase();
    }
    const apps = await Application.find(query).sort({ appliedAt: -1 });

    const mapped = await Promise.all(apps.map(async (app) => {
      // Fetch the stall data using the helper function
      const stall = await findStallByAppStallNumber(app.preferredStall, app.intendedBusinessUse);

      return {
        id: app._id.toString(),
        name: app.fullName,
        phone: app.contactNumber,
        email: app.email,
        // Use stall.stallNumber instead of ObjectId, fallback to preferredStall
        stall: stall ? `Stall #${stall.stallNumber}` : `Stall #${app.preferredStall}`,
        stallId: stall ? stall._id.toString() : null,
        // ✅ CORRECTED: Use stall.location (not stall.coordinates.location)
        stallLocation: stall ? (stall.location || '') : '',
        stallColor: app.avatarColor || '#f97316',
        applied: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        type: app.intendedBusinessUse,
        typeColor: '#2563eb',
        status: app.status,
        initials: app.initials,
        additionalMessage: app.additionalMessage,
        rejectionReason: app.rejectionReason,
        reviewedAt: app.reviewedAt,
        preferredStall: app.preferredStall,
      };
    }));

    res.json(mapped);
  } catch (err) {
    console.error('getApplications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

// ── POST /api/contractor/applications/:id/status ─────────
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "approve" | "reject"

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject".' });
    }

    const app = await Application.findById(id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const stall = await findStallByAppStallNumber(app.preferredStall, app.intendedBusinessUse);
    if (!stall) {
      console.warn(`[updateApplicationStatus] No stall found for preferredStall="${app.preferredStall}"`);
    }

    if (stall) {
      if (action === 'approve') {
        // Update stall to occupied and record tenant info
        await Stall.findByIdAndUpdate(stall._id, {
          $set: {
            status: 'occupied',
            tenant: {
              name: app.fullName,
              contact: app.contactNumber,
              email: app.email,
              leaseStart: new Date(),
              leaseEnd: null,
            },
            updatedAt: new Date(),
          },
        }, { new: true });
        // Create occupancy record
        const OccupancyRecord = require('../models/OccupancyRecord');
        await OccupancyRecord.create({
          stallId: stall._id,
          renterId: app._id,
          contractorEmail: stall.managedBy,
          startedAt: new Date(),
        });
      } else {
        // Rejection: ensure stall is available and tenant cleared
        await Stall.findByIdAndUpdate(stall._id, {
          $set: {
            status: 'available',
            tenant: {
              name: null,
              contact: null,
              email: null,
              leaseStart: null,
              leaseEnd: null,
            },
            updatedAt: new Date(),
          },
        },
          { new: true }
        );
      }
    }

    const updatedApp = await Application.findByIdAndUpdate(
      id,
      {
        $set: {
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewedAt: new Date(),
          reviewedBy: req.user?.name || req.user?.id || 'Admin',
        },
      },
      { new: true }
    );

    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: app.email.toLowerCase(),
      title: action === 'approve' ? 'Application Approved' : 'Application Rejected',
      message: action === 'approve'
        ? `Your application for ${app.preferredStall} has been approved.`
        : `Your application for ${app.preferredStall} has been rejected.`,
      link: '/renter/applications'
    });

    res.json({
      application: updatedApp,
      stallUpdated: !!stall,
      stallId: stall?._id,
      newStallStatus: action === 'approve' ? 'occupied' : 'available',
    });

  } catch (err) {
    console.error('updateApplicationStatus error:', err);
    res.status(500).json({ error: 'Failed to update application status' });
  }
};

// ── GET /api/contractor/records ──────────────────────────
exports.getRecords = async (req, res) => {
  try {
    const { email } = req.query;
    const approved = await Application.find({ status: 'approved', archived: { $ne: true } }).sort({ reviewedAt: -1 });
    const Payment = require('../models/Payment');
    const records = await Promise.all(approved.map(async (app) => {
      const stall = await findStallByAppStallNumber(app.preferredStall, app.intendedBusinessUse);

      if (email && (!stall || stall.managedBy?.trim().toLowerCase() !== email.trim().toLowerCase())) {
        return null;
      }

      const payments = await Payment.find({ renter: app._id }).sort({ date: -1 });
      const history = payments.map(p => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: `₱${p.amount.toLocaleString()}`,
        status: p.status,
      }));
      const lastPaid = payments.find(p => p.status === 'paid');
      const lastPayment = lastPaid ? new Date(lastPaid.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

      const baseDate = lastPaid ? lastPaid.date : (app.reviewedAt || app.appliedAt || new Date());
      const nextDueDate = new Date(baseDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      const now = new Date();
      let renterStatus = 'active';

      const diffMs = now - nextDueDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays > 30) {
        renterStatus = 'long_overdue';
      } else if (diffDays > 0) {
        renterStatus = 'late_payment';
      } else {
        renterStatus = 'active';
      }

      return {
        id: app._id.toString(),
        name: app.fullName,
        phone: app.contactNumber,
        email: app.email,
        stall: stall ? `Stall #${stall.stallNumber}` : `Stall #${app.preferredStall}`,
        stallId: stall?._id?.toString() || null,
        status: renterStatus,
        since: app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
        initials: app.initials,
        amountDue: stall?.monthlyRate ? `₱${stall.monthlyRate.toLocaleString()}` : '—',
        lastPayment,
        section: stall?.section || '',
        history,
      };
    }));
    res.json(records.filter(Boolean));
  } catch (err) {
    console.error('getRecords error:', err);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
};

// ── GET /api/contractor/records/by-stall/:stallNumber ────
exports.getRenterByStall = async (req, res) => {
  try {
    const { stallNumber } = req.params;

    // Try exact match first, then fallback to regex for padded numbers
    let application = await Application.findOne({
      preferredStall: stallNumber,
      status: 'approved',
      archived: { $ne: true },
    });

    // Fallback: try stripping leading zeros or padding
    if (!application) {
      const stripped = String(Number(stallNumber)); // "051" → "51"
      application = await Application.findOne({
        preferredStall: stripped,
        status: 'approved',
        archived: { $ne: true },
      });
    }

    // Fallback: regex match (e.g. stored as "Stall #51")
    if (!application) {
      application = await Application.findOne({
        preferredStall: { $regex: stallNumber, $options: 'i' },
        status: 'approved',
        archived: { $ne: true },
      });
    }

    if (!application) {
      return res.status(404).json({ error: 'No renter found for this stall' });
    }

    res.json({ email: application.email || '' });
  } catch (err) {
    console.error('getRenterByStall error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── GET /api/admin/contractor-applications ───────────────
exports.getContractorApplications = async (req, res) => {
  try {
    const { email } = req.query;
    const ContractorApplication = require('../models/ContractorApplication');
    let query = {};
    if (email) {
      query = { email: email.toLowerCase() };
    }

    const apps = await ContractorApplication.find(query).sort({ appliedAt: -1 });
    const formatted = apps.map(app => {
      const initials = app.fullName
        ? app.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '';
      return {
        id: app._id.toString(),
        fullName: app.fullName,
        businessName: app.businessName,
        contactNumber: app.contactNumber,
        email: app.email,
        selectedStalls: app.selectedStalls,
        status: app.status,
        rejectionReason: app.rejectionReason || '',
        appliedAt: app.appliedAt
          ? new Date(app.appliedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
          : '',
        initials,
      };
    });
    res.json(formatted);
  } catch (err) {
    console.error('getContractorApplications error:', err);
    res.status(500).json({ error: 'Failed to fetch contractor applications' });
  }
};

// ── POST /api/admin/contractor-applications/:id/status ────
exports.updateContractorApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject".' });
    }

    const ContractorApplication = require('../models/ContractorApplication');
    const app = await ContractorApplication.findById(id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const User = require('../models/User');
    if (action === 'approve') {
      const userExists = await User.findOne({ email: app.email.toLowerCase() });
      if (userExists) {
        userExists.status = 'approved';
        userExists.passwordHash = app.passwordHash; // Sync the password hash in case they resubmitted with a new password
        userExists.mustChangePassword = app.isResubmitted ? true : false;
        userExists.businessName = app.businessName;
        await userExists.save();
      } else {
        await User.create({
          full_name: app.fullName,
          email: app.email.toLowerCase(),
          contact_number: app.contactNumber,
          role: 'contractor',
          passwordHash: app.passwordHash,
          status: 'approved',
          agreed: true,
          mustChangePassword: app.isResubmitted ? true : false,
          businessName: app.businessName,
        });
      }

      if (app.selectedStalls && app.selectedStalls.length > 0) {
        await Stall.updateMany(
          { location: { $in: app.selectedStalls } },
          { $set: { managedBy: app.email.toLowerCase() } }
        );
      }

      app.status = 'approved';
      app.rejectionReason = undefined;

      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: app.email.toLowerCase(),
        title: 'Contractor Application Approved',
        message: 'Congratulations! Your application to be a contractor has been approved.',
        link: '/contractor/dashboard'
      });
    } else {
      const userExists = await User.findOne({ email: app.email.toLowerCase() });
      if (userExists) {
        userExists.status = 'rejected';
        await userExists.save();
      }

      app.status = 'rejected';
      app.rejectionReason = rejectionReason || 'Your application was rejected by the admin.';

      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: app.email.toLowerCase(),
        title: 'Contractor Application Rejected',
        message: `Your application to be a contractor was rejected. Reason: ${app.rejectionReason}`,
        link: '/login'
      });
    }

    await app.save();

    res.json({
      message: `Application successfully ${action}d`,
      application: app,
    });
  } catch (err) {
    console.error('updateContractorApplicationStatus error:', err);
    res.status(500).json({ error: 'Failed to update contractor application status' });
  }
};

// ── POST /api/contractor/records/:renterId/payments ──────
exports.recordPayment = async (req, res) => {
  try {
    const { renterId } = req.params;
    const { amount, date } = req.body;

    const Payment = require('../models/Payment');
    const Application = require('../models/Application');

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const app = await Application.findById(renterId);
    if (!app) {
      return res.status(404).json({ error: 'Renter application not found' });
    }

    const payment = await Payment.create({
      renter: renterId,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      status: 'paid',
    });

    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: app.email.toLowerCase(),
      title: 'Payment Recorded',
      message: `Your cash payment of ₱${Number(amount).toLocaleString()} has been recorded.`,
      link: '/renter/dashboard'
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error('recordPayment error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
};

// ── POST /api/contractor/records/:renterId/archive ───────
exports.archiveRenter = async (req, res) => {
  try {
    const { renterId } = req.params;
    const Application = require('../models/Application');
    const Stall = require('../models/Stall');
    const Notification = require('../models/Notification');

    const app = await Application.findById(renterId);
    if (!app) {
      return res.status(404).json({ error: 'Renter application not found' });
    }

    app.archived = true;
    app.archivedAt = new Date();
    await app.save();

    const stall = await findStallByAppStallNumber(app.preferredStall, app.intendedBusinessUse);
    if (stall) {
      await Stall.findByIdAndUpdate(stall._id, {
        $set: {
          status: 'available',
          tenant: {
            name: null,
            contact: null,
            email: null,
            leaseStart: null,
            leaseEnd: null,
          },
          updatedAt: new Date(),
        }
      });
    }

    await Notification.create({
      recipient: 'admin',
      title: 'Renter Moved Out',
      message: `Renter ${app.fullName} has moved out of Stall #${stall ? stall.stallNumber : app.preferredStall}.`,
      link: '/admin/records'
    });

    res.json({ message: 'Renter successfully moved out and archived.' });
  } catch (err) {
    console.error('archiveRenter error:', err);
    res.status(500).json({ error: 'Failed to archive renter' });
  }
};

// ── POST /api/contractor/archive-request ─────────────────
exports.requestArchiveAccess = async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.archiveAccessStatus = 'pending';
    await user.save();

    await Notification.create({
      recipient: 'admin',
      title: 'Archive Access Request',
      message: `Contractor ${user.full_name} has requested access to the renter archives.`,
      link: '/admin/records'
    });

    res.json({ message: 'Archive access requested successfully.', archiveAccessStatus: 'pending' });
  } catch (err) {
    console.error('requestArchiveAccess error:', err);
    res.status(500).json({ error: 'Failed to request archive access' });
  }
};

// ── GET /api/contractor/records/archived ─────────────────
exports.getArchivedRecords = async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const Application = require('../models/Application');
    const Payment = require('../models/Payment');
    const Stall = require('../models/Stall');

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.archiveAccessStatus === 'approved' && user.archiveAccessApprovedAt) {
      const now = new Date();
      const approvedTime = new Date(user.archiveAccessApprovedAt);
      const diffMs = now - approvedTime;
      const validityMs = 24 * 60 * 60 * 1000;
      if (diffMs > validityMs) {
        user.archiveAccessStatus = 'none';
        user.archiveAccessApprovedAt = null;
        await user.save();
      }
    }

    if (user.archiveAccessStatus !== 'approved') {
      return res.status(200).json({ error: 'Access denied. Archive request not approved.', archiveAccessStatus: user.archiveAccessStatus || 'none', isArchivedList: true });
    }

    const archivedApps = await Application.find({ archived: true }).sort({ archivedAt: -1 });

    const records = await Promise.all(archivedApps.map(async (app) => {
      const stall = await findStallByAppStallNumber(app.preferredStall, app.intendedBusinessUse);

      if (!stall || stall.managedBy !== user.email.toLowerCase()) {
        return null;
      }

      const payments = await Payment.find({ renter: app._id }).sort({ date: -1 });
      const history = payments.map(p => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: `₱${p.amount.toLocaleString()}`,
        status: p.status,
      }));
      const lastPaid = payments.find(p => p.status === 'paid');
      const lastPayment = lastPaid ? new Date(lastPaid.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

      return {
        id: app._id.toString(),
        name: app.fullName,
        phone: app.contactNumber,
        email: app.email,
        stall: `Stall #${app.preferredStall}`,
        status: 'archived',
        since: app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
        archivedAt: app.archivedAt ? new Date(app.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        initials: app.initials,
        amountDue: '—',
        lastPayment,
        section: stall?.section || '',
        history,
      };
    }));

    res.json(records.filter(Boolean));
  } catch (err) {
    console.error('getArchivedRecords error:', err);
    res.status(500).json({ error: 'Failed to fetch archived records' });
  }
};

// ── GET /api/contractor/admin/archive-requests ───────────
exports.getArchiveRequests = async (req, res) => {
  try {
    const User = require('../models/User');
    const requests = await User.find({ role: 'contractor', archiveAccessStatus: 'pending' }, 'full_name email archiveAccessStatus');
    res.json(requests);
  } catch (err) {
    console.error('getArchiveRequests error:', err);
    res.status(500).json({ error: 'Failed to fetch archive requests' });
  }
};

// ── POST /api/contractor/admin/archive-requests/:userId/status ──
exports.updateArchiveRequestStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body;
    const User = require('../models/User');
    const Notification = require('../models/Notification');

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (action === 'approve') {
      user.archiveAccessStatus = 'approved';
      user.archiveAccessApprovedAt = new Date();

      await Notification.create({
        recipient: user.email.toLowerCase(),
        title: 'Archive Request Approved',
        message: 'Your request to view renter archives has been approved. Access is valid for 24 hours.',
        link: '/contractor/records'
      });
    } else {
      user.archiveAccessStatus = 'none';
      user.archiveAccessApprovedAt = null;

      await Notification.create({
        recipient: user.email.toLowerCase(),
        title: 'Archive Request Denied',
        message: 'Your request to view renter archives was denied by the administrator.',
        link: '/contractor/records'
      });
    }

    await user.save();
    res.json({ message: `Archive request successfully ${action}d.`, user });
  } catch (err) {
    console.error('updateArchiveRequestStatus error:', err);
    res.status(500).json({ error: 'Failed to update archive request status' });
  }
};

// ── GET /api/contractor/admin/records/archived ───────────
exports.getAdminArchivedRecords = async (req, res) => {
  try {
    const Application = require('../models/Application');
    const Payment = require('../models/Payment');
    const Stall = require('../models/Stall');

    const archivedApps = await Application.find({ archived: true }).sort({ archivedAt: -1 });

    const records = await Promise.all(archivedApps.map(async (app) => {
      const stall = await findStallByAppStallNumber(app.preferredStall, app.intendedBusinessUse);
      const payments = await Payment.find({ renter: app._id }).sort({ date: -1 });
      const history = payments.map(p => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: `₱${p.amount.toLocaleString()}`,
        status: p.status,
      }));
      const lastPaid = payments.find(p => p.status === 'paid');
      const lastPayment = lastPaid ? new Date(lastPaid.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

      return {
        id: app._id.toString(),
        name: app.fullName,
        phone: app.contactNumber,
        email: app.email,
        stall: `Stall #${app.preferredStall}`,
        status: 'archived',
        since: app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
        archivedAt: app.archivedAt ? new Date(app.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        initials: app.initials,
        amountDue: '—',
        lastPayment,
        section: stall?.section || '',
        history,
      };
    }));

    res.json(records.filter(Boolean));
  } catch (err) {
    console.error('getAdminArchivedRecords error:', err);
    res.status(500).json({ error: 'Failed to fetch admin archived records' });
  }
};

// ── GET /api/contractor/notifications ────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const Notification = require('../models/Notification');

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let recipient = user.email.toLowerCase();
    if (user.role === 'admin') {
      recipient = 'admin';
    }

    const notifications = await Notification.find({ recipient }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// ── POST /api/contractor/notifications/:id/read ──────────
exports.markAsRead = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// ── POST /api/contractor/notifications/read-all ──────────
exports.markAllAsRead = async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const Notification = require('../models/Notification');

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let recipient = user.email.toLowerCase();
    if (user.role === 'admin') {
      recipient = 'admin';
    }

    await Notification.updateMany({ recipient, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};