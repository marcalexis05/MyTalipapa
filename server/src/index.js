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
const contactRoutes = require('./routes/Contacts'); // ← updated




const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));



const PORT = process.env.PORT || 5001;


const primaryUri = process.env.MONGODB_URI || process.env.MONGODB_URI_DEV;
const fallbackUri = process.env.MONGODB_URI_DEV;

async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(primaryUri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Primary MongoDB connection error:', err.message || err);
    if (fallbackUri && fallbackUri !== primaryUri) {
      try {
        console.log('Attempting fallback MongoDB connection...');
        await mongoose.connect(fallbackUri);
        console.log('MongoDB connected via fallback URI');
      } catch (fallbackErr) {
        console.error('Fallback MongoDB connection error:', fallbackErr.message || fallbackErr);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

connectDB();

app.use('/api', authRoutes);
app.use('/api/contractor', contractorRoutes);
app.use('/api/admin', contractorRoutes);
app.use('/api/renter', renterRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/stalls', stallsRoutes);
app.use('/api', contactRoutes); // ← added

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

// Export for Vercel serverless
module.exports = app;

// Start server only in local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}