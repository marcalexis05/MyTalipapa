const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

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
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
