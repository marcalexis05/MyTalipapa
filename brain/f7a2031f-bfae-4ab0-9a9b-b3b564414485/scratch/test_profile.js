const http = require('http');

const request = (method, path, headers, payload) => {
  return new Promise((resolve, reject) => {
    const postData = payload ? JSON.stringify(payload) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let body = {};
        try {
          body = JSON.parse(data);
        } catch (e) {
          body = data;
        }
        resolve({
          statusCode: res.statusCode,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (payload) {
      req.write(postData);
    }
    req.end();
  });
};

async function run() {
  console.log('Running End-to-End Profile Connection Test...');
  try {
    const testEmail = `renter_${Date.now()}@mytalipapa.com`;
    const password = 'password123';

    // 1. Register a new test renter
    console.log(`\n1. Registering new renter: ${testEmail}...`);
    const regRes = await request('POST', '/api/register', {}, {
      full_name: 'Test Renter User',
      email: testEmail,
      password: password,
      contact_number: '123-456-7890',
      role: 'renter',
      agreed: true
    });
    console.log('Status Code:', regRes.statusCode);
    if (regRes.statusCode !== 201) {
      console.log('Error payload:', regRes.body);
      throw new Error('Registration failed');
    }
    console.log('Registration success.');

    // 2. Login to get token
    console.log('\n2. Logging in...');
    const loginRes = await request('POST', '/api/login', {}, {
      email: testEmail,
      password: password,
      role: 'renter'
    });
    console.log('Status Code:', loginRes.statusCode);
    if (loginRes.statusCode !== 200) {
      console.log('Error payload:', loginRes.body);
      throw new Error('Login failed');
    }
    const token = loginRes.body.token;
    console.log('Token retrieved.');

    // 3. Fetch profile
    console.log('\n3. Fetching profile (GET)...');
    const getRes = await request('GET', '/api/profile', { 'Authorization': `Bearer ${token}` });
    console.log('Status Code:', getRes.statusCode);
    console.log('Profile retrieved:', getRes.body);

    // 4. Update profile (PUT)
    console.log('\n4. Updating profile (PUT)...');
    const updateRes = await request('PUT', '/api/profile', { 'Authorization': `Bearer ${token}` }, {
      full_name: 'Updated Test Name',
      contact_number: '999-888-7777',
      profilePicture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    });
    console.log('Status Code:', updateRes.statusCode);
    console.log('Update response:', updateRes.body);

    // 5. Fetch profile again to verify persistence
    console.log('\n5. Verifying profile update (GET)...');
    const getRes2 = await request('GET', '/api/profile', { 'Authorization': `Bearer ${token}` });
    console.log('Status Code:', getRes2.statusCode);
    console.log('Updated Profile from DB:', getRes2.body);

    if (getRes2.body.full_name === 'Updated Test Name' && getRes2.body.contact_number === '999-888-7777') {
      console.log('\nSuccess: Profile updates persist in the database and are fetched successfully!');
    } else {
      console.log('\nError: Updated details did not match!');
    }
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

run();
