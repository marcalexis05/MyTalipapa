require('dotenv').config();
const app = require('../src/index.js'); // Imports your main express app, middleware, and db connections
const mongoose = require('mongoose'); // Assuming you use Mongoose for MongoDB

// 1. If you imported your Mongoose 'User' model elsewhere, require it here.
// Replace the path below with the actual path to your User schema file.
const User = require('../src/models/User'); 

// 2. Define the verification route handler
app.get('/api/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    // 3. Find the user by the verification token/OTP, 
    // update 'isVerified' to true, and clear out the single-use token.
    const updatedUser = await User.findOneAndUpdate(
      { verificationToken: token },
      { 
        $set: { isVerified: true }, 
        $unset: { verificationToken: "" } // Removes the token field so it can't be reused
      },
      { new: true } // Returns the modified document rather than the original
    );

    // 4. If no user matches that token, it's invalid or already used
    if (!updatedUser) {
      return res.status(400).json({ error: 'Invalid or expired verification link.' });
    }

    // 5. Send successful response back to your React Frontend
    return res.status(200).json({ message: 'Email verified successfully!' });

  } catch (error) {
    console.error('MongoDB Verification Error:', error);
    return res.status(500).json({ error: 'Internal server error during verification.' });
  }
});

module.exports = app;