#!/usr/bin/env node

/**
 * Security monitor for Google Vision API usage
 * Run this daily to check for abuse
 */

const https = require('https');

// Configuration
const PROJECT_ID = 'YOUR_GOOGLE_CLOUD_PROJECT_ID'; // Find in Google Cloud Console
const API_KEY = 'YOUR_NEW_API_KEY'; // Your new unrestricted key

async function checkVisionAPIUsage() {
    console.log('🔍 Google Vision API Security Check');
    console.log('===================================\n');
    
    // Note: For detailed monitoring, you need to use Google Cloud Monitoring API
    // This is a basic check script
    
    console.log('⚠️  IMPORTANT: Your API key is UNRESTRICTED');
    console.log('   Follow these security measures:\n');
    
    console.log('1. DAILY QUOTA CHECK:');
    console.log('   - Go to Google Cloud Console');
    console.log('   - APIs & Services → Dashboard → Cloud Vision API → Quotas');
    console.log('   - Check "Requests per day" usage');
    console.log('   - Set alert at 80% of quota\n');
    
    console.log('2. MONITOR FOR UNUSUAL ACTIVITY:');
    console.log('   - Check billing for unexpected charges');
    console.log('   - Look for requests from unusual IPs');
    console.log('   - Monitor request frequency\n');
    
    console.log('3. IMMEDIATE ACTIONS IF ABUSE SUSPECTED:');
    console.log('   - Revoke the API key immediately');
    console.log('   - Create new key with restrictions');
    console.log('   - Check Google Cloud logs\n');
    
    console.log('4. FIND CLOUD VISION API FOR RESTRICTIONS:');
    console.log('   - Go to APIs & Services → Library');
    console.log('   - Search for "Cloud Vision API"');
    console.log('   - Click ENABLE if not already enabled');
    console.log('   - Wait 5 minutes, then try adding restrictions again\n');
    
    console.log('📊 Current Security Status:');
    console.log('   - API Key: UNRESTRICTED (HIGH RISK)');
    console.log('   - Action Required: Find and enable Cloud Vision API restrictions');
    
    console.log('\n🔗 Useful Links:');
    console.log('   - Cloud Vision API: https://console.cloud.google.com/apis/library/vision.googleapis.com');
    console.log('   - API Credentials: https://console.cloud.google.com/apis/credentials');
    console.log('   - Quotas: https://console.cloud.google.com/apis/api/vision.googleapis.com/quotas');
}

// Test the API key (optional)
async function testAPIKey() {
    console.log('\n🧪 Testing API Key...');
    
    const testData = JSON.stringify({
        requests: [{
            image: { content: 'BASE64_ENCODED_IMAGE' }, // Would need actual base64
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
        }]
    });
    
    const options = {
        hostname: 'vision.googleapis.com',
        port: 443,
        path: `/v1/images:annotate?key=${API_KEY}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': testData.length
        }
    };
    
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            console.log(`   Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log('   ✅ API Key is working');
            } else if (res.statusCode === 403) {
                console.log('   ❌ API Key rejected (might be revoked)');
            } else {
                console.log(`   ⚠️  Unexpected status: ${res.statusCode}`);
            }
            resolve();
        });
        
        req.on('error', (error) => {
            console.log(`   ❌ Connection error: ${error.message}`);
            resolve();
        });
        
        req.write(testData);
        req.end();
    });
}

async function main() {
    await checkVisionAPIUsage();
    
    if (API_KEY && API_KEY !== 'YOUR_NEW_API_KEY') {
        await testAPIKey();
    }
    
    console.log('\n🚨 SECURITY REMINDER:');
    console.log('This unrestricted key should be TEMPORARY only.');
    console.log('Find "Cloud Vision API" in restrictions list ASAP.');
}

if (require.main === module) {
    main().catch(console.error);
}