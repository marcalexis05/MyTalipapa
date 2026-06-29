const express = require('express');
const router = express.Router();

// Models that participate in the system-wide soft-delete / restore feature.
// NOTE: only these names are accepted from the client — never resolve an
// arbitrary model string off the wire.
const MODELS = {
  User: require('../models/User'),
  Stall: require('../models/Stall'),
  Application: require('../models/Application'),
  Announcement: require('../models/Announcement'),
  Payment: require('../models/Payment'),
  StallRequest: require('../models/StallRequest'),
  StallRemovalRequest: require('../models/StallRemovalRequest'),
  ContractorApplication: require('../models/ContractorApplication'),
  Notification: require('../models/Notification'),
  AdminContactMessage: require('../models/AdminContactMessage'),
  OccupancyRecord: require('../models/OccupancyRecord'),
};

// Friendly per-model display so the Trash UI can show something meaningful
// regardless of the record shape.
function labelFor(modelName, doc) {
  switch (modelName) {
    case 'User':
      return { primary: doc.full_name || doc.email || 'Account', secondary: `${doc.role || ''} · ${doc.email || ''}`.trim() };
    case 'Stall':
      return { primary: `Stall #${doc.stallNumber || ''}`, secondary: [doc.section, doc.status].filter(Boolean).join(' · ') };
    case 'Application':
      return { primary: doc.fullName || 'Application', secondary: `Stall #${doc.preferredStall || ''} · ${doc.status || ''}` };
    case 'Announcement':
      return { primary: doc.title || 'Announcement', secondary: doc.targetAudience || '' };
    case 'Payment':
      return { primary: `₱${doc.amount != null ? doc.amount : '?'}`, secondary: doc.status || '' };
    case 'StallRequest':
      return { primary: `Stall Request`, secondary: `${doc.contractorEmail || ''} · ${doc.status || ''}` };
    case 'StallRemovalRequest':
      return { primary: `Removal Request`, secondary: doc.status || '' };
    case 'ContractorApplication':
      return { primary: doc.fullName || doc.email || 'Contractor Application', secondary: doc.status || '' };
    case 'Notification':
      return { primary: doc.title || 'Notification', secondary: doc.recipient || '' };
    case 'AdminContactMessage':
      return { primary: doc.name || doc.email || 'Message', secondary: (doc.subject || doc.message || '').slice(0, 60) };
    case 'OccupancyRecord':
      return { primary: 'Occupancy Record', secondary: doc.contractorEmail || '' };
    default:
      return { primary: String(doc._id), secondary: '' };
  }
}

// GET /api/admin/trash — all soft-deleted records, grouped by model.
// Passing `isDeleted: true` explicitly bypasses the softDeletePlugin filter
// (the plugin only injects its filter when isDeleted is undefined).
router.get('/', async (req, res) => {
  try {
    const groups = [];
    for (const [name, Model] of Object.entries(MODELS)) {
      const docs = await Model.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean();
      if (!docs.length) continue;
      groups.push({
        model: name,
        count: docs.length,
        items: docs.map((d) => ({
          id: String(d._id),
          ...labelFor(name, d),
          deletedAt: d.deletedAt || d.updatedAt || null,
        })),
      });
    }
    res.json(groups);
  } catch (err) {
    console.error('Trash list error:', err);
    res.status(500).json({ error: 'Failed to load archived records' });
  }
});

// POST /api/admin/trash/:model/:id/archive — soft-delete (archive) a record.
// Used for account archiving and any admin-initiated soft delete.
router.post('/:model/:id/archive', async (req, res) => {
  const { model, id } = req.params;
  const Model = MODELS[model];
  if (!Model) return res.status(400).json({ error: 'Unknown model' });
  try {
    const updated = await Model.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: `${model} archived`, id });
  } catch (err) {
    console.error('Trash archive error:', err);
    res.status(500).json({ error: 'Failed to archive record' });
  }
});

// POST /api/admin/trash/:model/:id/restore — undelete a soft-deleted record.
router.post('/:model/:id/restore', async (req, res) => {
  const { model, id } = req.params;
  const Model = MODELS[model];
  if (!Model) return res.status(400).json({ error: 'Unknown model' });
  try {
    // Match by _id while bypassing the plugin's isDeleted filter so we can find
    // the archived doc, then clear the soft-delete flags.
    const updated = await Model.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Archived record not found' });
    res.json({ message: `${model} restored`, id });
  } catch (err) {
    console.error('Trash restore error:', err);
    res.status(500).json({ error: 'Failed to restore record' });
  }
});

module.exports = router;
