// Test API with authentication
const https = require('https');

const API_URL = 'https://receipt-parcer.vercel.app/api/upload-receipt';

// Test data
const testData = {
  userId: 1, // This should be the actual user ID from your database
  filename: 'test-receipt.jpg',
  // Add other required fields based on your API
};

// Function to make authenticated API call
function testAPIAuth(token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(testData);
    
    const options = {
      hostname: 'receipt-parcer.vercel.app',
      port: 443,
      path: '/api/upload-receipt',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
        console.log(`Response: ${responseData}`);
        resolve({ status: res.statusCode, body: responseData });
      });
    });
    
    req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Main test
async function main() {
  console.log('=== Testing API Authentication ===\n');
  
  // Check if token is provided
  const token = process.argv[2];
  if (!token) {
    console.log('Usage: node test-api-with-auth.js <JWT_TOKEN>');
    console.log('\nTo get a JWT token:');
    console.log('1. First, create a service account in your database');
    console.log('2. Generate a JWT token using your auth library');
    console.log('3. Or use the test token from test-api-auth.js');
    console.log('\nExample:');
    console.log('node test-api-with-auth.js "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."');
    return;
  }
  
  console.log(`Testing API with token: ${token.substring(0, 30)}...\n`);
  
  try {
    const result = await testAPIAuth(token);
    
    console.log('\n=== Test Results ===');
    if (result.status === 200 || result.status === 201) {
      console.log('✅ API call successful with authentication!');
    } else if (result.status === 401) {
      console.log('❌ Authentication failed - invalid token');
    } else if (result.status === 403) {
      console.log('❌ Authorization failed - insufficient permissions');
    } else {
      console.log(`⚠️  API returned status ${result.status}`);
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testAPIAuth };