const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'MyTalipapa' });
    console.log("Connected to DB");
    const users = await User.find({ role: 'contractor' });
    console.log(`Found ${users.length} contractors:`);
    users.forEach((user, i) => {
      console.log(`[${i+1}] Name: ${user.name || user.full_name} | Email: ${user.email} | Password (hash): ${user.password}`);
    });
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
