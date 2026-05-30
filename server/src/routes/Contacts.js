const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/AdminContactMessage');

router.post('/contact-admin', async (req, res) => {
  try {
    const { subject, message, renterName, renterEmail, renterContact } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    await ContactMessage.create({ subject, message, renterName, renterEmail, renterContact });

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('Contact admin error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET all messages for admin
router.get('/admin/contact-messages', async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error('Fetch contact messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Update message status (e.g., mark as read/unread)
router.patch('/admin/contact-messages/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(message);
  } catch (err) {
    console.error('Update contact message error:', err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete a message
router.delete('/admin/contact-messages/:id', async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Delete contact message error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Admin reply to a message
router.post('/admin/contact-messages/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) {
      return res.status(400).json({ error: 'Reply content is required' });
    }
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      {
        reply,
        repliedAt: new Date(),
        status: 'read'
      },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Create a notification for the renter
    if (message.renterEmail) {
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          recipient: message.renterEmail.toLowerCase(),
          title: 'Feedback Response',
          message: `The admin replied to your message: "${message.subject}"`,
          link: '/renter/profile'
        });
      } catch (notifErr) {
        console.error('Failed to create notification for renter:', notifErr);
      }
    }

    res.json(message);
  } catch (err) {
    console.error('Reply contact message error:', err);
    res.status(500).json({ error: 'Failed to submit reply' });
  }
});

// GET messages sent by a specific renter
router.get('/renter/contact-messages', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email query parameter is required' });
    }
    const messages = await ContactMessage.find({
      renterEmail: { $regex: new RegExp(`^${email}$`, 'i') }
    }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error('Fetch renter contact messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;