const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const ContractorApplication = require('./src/models/ContractorApplication');

const MONGODB_URI = 'mongodb://davejuliales_db_user:l37NHFcfPd4qRs9L@ac-dvzbxyt-shard-00-00.xzadqnj.mongodb.net:27017,ac-dvzbxyt-shard-00-01.xzadqnj.mongodb.net:27017,ac-dvzbxyt-shard-00-02.xzadqnj.mongodb.net:27017/?ssl=true&replicaSet=atlas-5ag3xj-shard-0&authSource=admin&appName=MyTalipapa';

async function run() {
  await mongoose.connect(MONGODB_URI);
  
  const email = 'contractor@mytalipapa.com';
  const user = await User.findOne({ email });
  const app = await ContractorApplication.findOne({ email });

  console.log('=== USER ===');
  console.log('User found:', !!user);
  if (user) {
    console.log('User passwordHash:', user.passwordHash);
    const match = await bcrypt.compare('password123', user.passwordHash);
    console.log('bcryptjs compare with password123:', match);
  }

  console.log('=== APP ===');
  console.log('App found:', !!app);
  if (app) {
    console.log('App passwordHash:', app.passwordHash);
    const match = await bcrypt.compare('password123', app.passwordHash);
    console.log('bcryptjs compare with password123:', match);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
