#!/usr/bin/env node

/**
 * Update n8n workflow files to use direct API key
 * For self-hosted n8n without credential/environment variable support
 */

const fs = require('fs');
const path = require('path');

// Configuration
const N8N_DIR = './n8n';
const API_KEY = 'AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc';
const NEW_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

// Patterns to search for
const OLD_PATTERNS = [
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=GOOGLE_VISION_API_KEY/g,
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=GOOGLE_API_KEY8cOy0/g,
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=AIzaSyC9SlDURPMIRDFIdKTAkH5ZmSwmum8cOy0/g,
    // Also update any credential or env var patterns
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=\{\{\s*\$credentials\.google-vision-api-key\s*\}\}/g,
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=\{\{\s*\$env\.GOOGLE_VISION_API_KEY\s*\}\}/g,
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=\{\{\s*\$googleVisionApiKey\s*\}\}/g
];

async function updateWorkflowFiles() {
    console.log('🔄 Updating n8n workflow files with direct API key');
    console.log('==================================================\n');
    
    console.log(`Using API key: ${API_KEY.substring(0, 10)}...`);
    console.log(`New URL: ${NEW_URL.substring(0, 60)}...\n`);
    
    // Get all JSON files in n8n directory
    const files = fs.readdirSync(N8N_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(N8N_DIR, file));
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const filePath of files) {
        try {
            console.log(`Processing: ${path.basename(filePath)}`);
            
            // Read file
            const content = fs.readFileSync(filePath, 'utf8');
            let updatedContent = content;
            let wasUpdated = false;
            
            // Check for old patterns
            for (const pattern of OLD_PATTERNS) {
                if (pattern.test(content)) {
                    console.log(`  ⚠️  Found pattern to update`);
                    
                    // Replace with direct API key URL
                    updatedContent = content.replace(pattern, NEW_URL);
                    wasUpdated = true;
                    break;
                }
            }
            
            // Check if already has the correct key
            if (content.includes(API_KEY)) {
                console.log(`  ✅ Already has correct API key`);
                continue;
            }
            
            // Save if updated
            if (wasUpdated) {
                fs.writeFileSync(filePath, updatedContent, 'utf8');
                console.log(`  ✅ Updated with direct API key`);
                updatedCount++;
            } else {
                console.log(`  ⏭️  No changes needed`);
            }
            
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            errorCount++;
        }
    }
    
    console.log('\n📊 Summary:');
    console.log(`Files processed: ${files.length}`);
    console.log(`Files updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (updatedCount > 0) {
        console.log('\n✅ Update complete!');
        console.log('\n⚠️  SECURITY WARNING:');
        console.log('API key is now hardcoded in workflow files.');
        console.log('This is less secure but necessary for self-hosted n8n.');
        console.log('\n📋 Next steps:');
        console.log('1. Import updated workflow files to n8n');
        console.log('2. Test receipt processing');
        console.log('3. Set Google Cloud quotas (1000/day, 60/min)');
        console.log('4. Monitor for abuse');
    } else {
        console.log('\n⚠️  No files needed updating.');
    }
}

// Run if called directly
if (require.main === module) {
    updateWorkflowFiles().catch(console.error);
}