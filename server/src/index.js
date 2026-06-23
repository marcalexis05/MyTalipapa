const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const contractorRoutes = require('./routes/contractor');
const renterRoutes = require('./routes/renter');
const publicRoutes = require('./routes/public');
const stallsRoutes = require('./routes/stalls');
const contactRoutes = require('./routes/Contacts');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_DEV;

mongoose
  .connect(mongoUri, { dbName: 'MyTalipapa' })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const adminRoutes = require('./routes/admin');

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);         // ✅ admin routes
app.use('/api/admin/stall-requests', require('./routes/adminStallRequests'));
app.use('/api/contractor/stall-requests', require('./routes/contractorStallRequests'));
app.use('/api/stall-removal-requests', require('./routes/stallRemovalRequests'));
app.use('/api/contractor', contractorRoutes); // ✅ restored
app.use('/api/renter', renterRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/stalls', stallsRoutes);
app.use('/api', contactRoutes);

app.post('/api/log-error', (req, res) => {
  console.error('\n----------------------------------------\n🚨 FRONTEND ERROR:', req.body.message);
  if (req.body.error) {
    console.error(req.body.error);
  } else {
    console.error(`At ${req.body.filename}:${req.body.lineno}:${req.body.colno}`);
  }
  console.error('----------------------------------------\n');
  res.sendStatus(200);
});

// Unknown API endpoints return JSON (not an HTML error page) so the client can handle them cleanly
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Export for Vercel serverless
module.exports = app;

// Start server only in local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}