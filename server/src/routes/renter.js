  const express = require('express');
  const router = express.Router();
  const Stall = require('../models/Stall');
  const Application = require('../models/Application');
  const Payment = require('../models/Payment');
  const User = require('../models/User');
  // Duplicate User import removed

  // ── GET /api/renter/stalls ──
  router.get('/stalls', async (req, res) => {
    try {
      const stalls = await Stall.find({
        managedBy: { $exists: true, $nin: [null, ''] }
      }).sort({ stallNumber: 1 });
      
      // Find all users who are contractors to map their emails to names
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
      console.error('Renter getStalls error:', err);
      res.status(500).json({ error: 'Failed to fetch stalls' });
    }
  });

  // ── GET /api/renter/applications ──
  router.get('/applications', async (req, res) => {
    try {
      const { email } = req.query;
      let query = {};
      if (email) {
        query = { email: email.toLowerCase() };
      }
      const apps = await Application.find(query).sort({ appliedAt: -1 });
      
      // Format to match client-side expectations
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
      const mapped = await Promise.all(apps.map(async (app) => {
        // Determine productType from intendedBusinessUse to handle duplicate numbers across different sections
        const use = (app.intendedBusinessUse || '').toLowerCase();
        let productType = '';
        if (use.includes('fish') || use.includes('sea')) productType = 'fish';
        else if (use.includes('meat')) productType = 'meat';
        else if (use.includes('veg') || use.includes('produce')) productType = 'veggies';

        let stall;
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(app.preferredStall)) {
          stall = await Stall.findById(app.preferredStall);
        }
        if (!stall) {
          let query = { stallNumber: app.preferredStall };
          if (productType) {
            query.productType = productType;
          }
          stall = await Stall.findOne(query);
        }
        if (!stall) {
          stall = await Stall.findOne({ stallNumber: app.preferredStall });
        }
        const rate = stall && stall.monthlyRate ? `₱${stall.monthlyRate.toLocaleString()}/mo` : '—';
        
        let initials = app.initials;
        if (!initials && app.fullName) {
          initials = app.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        
        let status = 'Pending';
        if (app.status === 'approved') status = 'Approved';
        if (app.status === 'rejected') status = 'Rejected';
        
        const formattedDate = app.appliedAt
          ? new Date(app.appliedAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
          : '';

        return {
          id: app._id.toString(),
          stall: stall ? `#${stall.stallNumber}` : (app.preferredStall.startsWith('#') ? app.preferredStall : `#${app.preferredStall}`),
          stallId: stall ? stall._id : null,
          stallLocation: stall ? stall.coordinates?.location || '' : '',
          zone: stall ? stall.zone : (app.stallLabel || 'Market Stall'),
          section: stall ? stall.section : (app.stallLabel || 'Market Stall'),
          status: status,
          submittedOn: formattedDate,
          date: formattedDate,
          fee: rate,
          monthlyRate: stall ? stall.monthlyRate : null,
          size: stall ? stall.size : null,
          fullName: app.fullName,
          contactNumber: app.contactNumber,
          email: app.email,
          intendedBusinessUse: app.intendedBusinessUse,
          additionalMessage: app.additionalMessage,
          rejectionReason: app.rejectionReason,
          contractorName: stall && stall.managedBy ? (contractorMap[stall.managedBy.toLowerCase()] || stall.managedBy) : 'None',
          contractorContact: stall && stall.managedBy ? (contractorContactMap[stall.managedBy.toLowerCase()] || 'N/A') : 'N/A',
          // contractorName already defined at line 111; duplicate removed
        };
      }));

      res.json(mapped);
    } catch (err) {
      console.error('Renter getApplications error:', err);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  });

  // ── GET /api/renter/active-lease ──
  router.get('/active-lease', async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ error: 'Email parameter is required.' });
      }
      
      // Find a stall occupied by the tenant with this email
      const stall = await Stall.findOne({
        status: 'occupied',
        'tenant.email': email.toLowerCase()
      });

      if (!stall) {
        return res.json(null);
      }

      // Find renter's approved application to get payment history
      const app = await Application.findOne({
        email: email.toLowerCase(),
        status: 'approved'
      });

      let lastPaidDate = null;
      if (app) {
        const payments = await Payment.find({ renter: app._id }).sort({ date: -1 });
        const lastPaid = payments.find(p => p.status === 'paid');
        if (lastPaid) {
          lastPaidDate = lastPaid.date;
        }
      }

      // Base date for next payment due calculation: last paid date or leaseStart date
      const baseDate = lastPaidDate || stall.tenant.leaseStart || stall.createdAt || new Date();
      const nextDueDate = new Date(baseDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1); // validity is exactly 1 month from previous payment

      const formattedNextDue = nextDueDate.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });

      const now = new Date();
      let status = 'Active';

      // Calculate dynamic status based on payment validity window
      const diffMs = now - nextDueDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays > 30) {
        status = 'long_overdue';
      } else if (diffDays > 0) {
        status = 'late_payment';
      } else {
        status = 'active';
      }

      res.json({
        id: stall._id.toString(),
        stallNumber: stall.stallNumber.startsWith('#') ? stall.stallNumber : `#${stall.stallNumber}`,
        section: stall.section,
        monthlyRate: stall.monthlyRate ? `₱${stall.monthlyRate.toLocaleString()}` : '—',
        status: status,
        nextDue: formattedNextDue,
        leaseStart: stall.tenant.leaseStart
          ? new Date(stall.tenant.leaseStart).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
          : '—',
        leaseEnd: stall.tenant.leaseEnd
          ? new Date(stall.tenant.leaseEnd).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
          : 'No Expiry',
      });
    } catch (err) {
      console.error('Renter getActiveLease error:', err);
      res.status(500).json({ error: 'Failed to fetch active lease' });
    }
  });

  // ── POST /api/renter/applications ──
  router.post('/applications', async (req, res) => {
    try {
      const { fullName, contactNumber, email, preferredStall, intendedBusinessUse, additionalMessage } = req.body;

      if (!fullName || !contactNumber || !email || !preferredStall || !intendedBusinessUse) {
        return res.status(400).json({ error: 'Required fields are missing.' });
      }

      // Clean preferredStall (e.g. extract "11" from "Stall #11" or "#11")
      const cleanedStall = preferredStall.replace(/Stall\s*#/gi, '').replace('#', '').trim();

      // Determine productType from intendedBusinessUse to handle duplicate numbers across different sections
      const use = (intendedBusinessUse || '').toLowerCase();
      let productType = '';
      if (use.includes('fish') || use.includes('sea')) productType = 'fish';
      else if (use.includes('meat')) productType = 'meat';
      else if (use.includes('veg') || use.includes('produce')) productType = 'veggies';

      // Check if the stall exists
      let stall;
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(cleanedStall)) {
        stall = await Stall.findById(cleanedStall);
      }
      if (!stall) {
        let query = { stallNumber: cleanedStall };
        if (productType) {
          query.productType = productType;
        }
        stall = await Stall.findOne(query);
      }
      if (!stall) {
        stall = await Stall.findOne({ stallNumber: cleanedStall });
      }
      if (!stall) {
        console.warn(`Stall number ${cleanedStall} not found in database.`);
      }

      // Generate avatar color
      const colors = ['#1a5c2a', '#e8621a', '#2563eb', '#7c3aed', '#db2777', '#059669'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      // Generate initials
      const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

      const newApp = await Application.create({
        fullName,
        contactNumber,
        email: email.toLowerCase(),
        preferredStall: stall ? stall._id.toString() : cleanedStall,
        stallLabel: stall ? `${stall.section} (${stall.floorArea === 'upper' ? 'Upper' : 'Lower'} Floor)` : 'Market Stall',
        intendedBusinessUse,
        additionalMessage: additionalMessage || '',
        status: 'pending',
        initials,
        avatarColor: randomColor,
      });

      // Update Stall status to pending so it reflects immediately in Floor Plan!
      if (stall && stall.status === 'available') {
        await Stall.findByIdAndUpdate(stall._id, { $set: { status: 'pending' } });
      }

      // Trigger notification to the contractor who manages this stall (or admin if unmanaged)
      const Notification = require('../models/Notification');
      if (stall && stall.managedBy) {
        await Notification.create({
          recipient: stall.managedBy.toLowerCase(),
          title: 'New Stall Application',
          message: `${fullName} has applied for Stall #${stall.stallNumber} in the ${stall.section} section.`,
          link: '/contractor/applications'
        });
      } else {
        await Notification.create({
          recipient: 'admin',
          title: 'New Stall Application',
          message: `${fullName} has applied for Stall #${cleanedStall}. This stall is currently unmanaged.`,
          link: '/admin/applications'
        });
      }

      res.status(201).json(newApp);
    } catch (err) {
      console.error('Renter createApplication error:', err);
      res.status(500).json({ error: 'Failed to submit application.' });
    }
  });
  // ── POST /api/renter/stalls/:id/move-out ──
  router.post('/stalls/:id/move-out', async (req, res) => {
    try {
      const { id } = req.params;
      const { contactNumber, reason } = req.body;

      if (!contactNumber) {
        return res.status(400).json({ error: 'Contact number is required for move out request.' });
      }

      const stall = await Stall.findById(id);
      if (!stall) {
        return res.status(404).json({ error: 'Stall not found.' });
      }

      // Set contact number
      stall.tenant.contact = contactNumber;
      await stall.save();

      // Trigger notification to the contractor who manages this stall (or admin if unmanaged)
      const Notification = require('../models/Notification');
      if (stall.managedBy) {
        await Notification.create({
          recipient: stall.managedBy.toLowerCase(),
          title: 'Stall Move Out Request',
          message: `Tenant at Stall #${stall.stallNumber} (${stall.section}) has requested to move out. Renter Contact: ${contactNumber}. Reason: ${reason || 'Not specified'}`,
          link: '/contractor/stalls'
        });
      } else {
        await Notification.create({
          recipient: 'admin',
          title: 'Stall Move Out Request',
          message: `Tenant at Stall #${stall.stallNumber} has requested to move out. Renter Contact: ${contactNumber}. Reason: ${reason || 'Not specified'}`,
          link: '/admin/stalls'
        });
      }

      res.json({ success: true, message: 'Move out request submitted successfully.' });
    } catch (err) {
      console.error('Renter moveOutRequest error:', err);
      res.status(500).json({ error: 'Failed to submit move out request.' });
    }
  });

  // ── GET /api/renter/profile ──
router.get('/profile', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mytalipapa-secret-key-12345');

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      email: user.email || '',
      contactNumber: user.contact_number || '',
      fullName: user.full_name || '',
    });
  } catch (err) {
    console.error('Renter profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

  module.exports = router;

