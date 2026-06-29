const user = {
  first_name: 'Test',
  last_name: 'User',
  email: 'e2e_' + Date.now() + '@example.com',
  contact_number: '09123456789',
  password: 'Password123!',
  role: 'renter',
  agreed: true
};

async function runTest() {
  console.log('--- Phase 1: Register ---');
  let res = await fetch('http://localhost:5000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  let data = await res.json();
  console.log('Register Response:', res.status, data);

  if (res.status === 201 || res.status === 400) { // 400 if already exists
    console.log('--- Phase 1.5: Verify User in DB ---');
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://davejuliales_db_user:l37NHFcfPd4qRs9L@ac-dvzbxyt-shard-00-00.xzadqnj.mongodb.net:27017,ac-dvzbxyt-shard-00-01.xzadqnj.mongodb.net:27017,ac-dvzbxyt-shard-00-02.xzadqnj.mongodb.net:27017/?ssl=true&replicaSet=atlas-5ag3xj-shard-0&authSource=admin&appName=MyTalipapa', { dbName: 'MyTalipapa' });
    const User = require('../models/User');
    await User.updateOne({ email: user.email }, { $set: { isVerified: true } });
    console.log('User verified in DB');

    console.log('--- Phase 2: Login ---');
    res = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password, role: 'renter' })
    });
    data = await res.json();
    console.log('Login Response:', res.status, 'Token length:', data.token?.length);
    
    if (data.token) {
      console.log('--- Phase 3: Fetch Stalls ---');
      res = await fetch('http://localhost:5000/api/stalls');
      let stalls = await res.json();
      console.log('Stalls found:', stalls.length);
      
      const availableStall = stalls.find(s => s.status === 'available');
      if (availableStall) {
        console.log('--- Phase 4: Apply for Stall ---');
        res = await fetch('http://localhost:5000/api/renter/applications', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + data.token
          },
          body: JSON.stringify({
            fullName: 'Test User',
            contactNumber: '09123456789',
            email: user.email,
            preferredStall: availableStall.stallNumber,
            intendedBusinessUse: 'Vegetable Stand',
            additionalMessage: 'Test application'
          })
        });
        const appData = await res.json();
        console.log('Application Response:', res.status, appData);
      }
    }
    mongoose.disconnect();
  }
}

runTest().catch(console.error);
