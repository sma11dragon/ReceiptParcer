#!/usr/bin/env node

/**
 * Update n8n workflow files to use credentials for Google Vision API
 * 
 * Usage:
 *   node update-n8n-vision-api.js [credential_name]
 * 
 * Example:
 *   node update-n8n-vision-api.js google-vision-api-key
 */

const fs = require('fs');
const path = require('path');

// Configuration
const N8N_DIR = './n8n';
const CREDENTIAL_NAME = process.argv[2] || 'google-vision-api-key';
const NEW_URL = `https://vision.googleapis.com/v1/images:annotate?key={{ $credentials.${CREDENTIAL_NAME} }}`;

// Patterns to search for
const OLD_PATTERNS = [
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=GOOGLE_VISION_API_KEY/g,
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=GOOGLE_API_KEY8cOy0/g,
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=AIzaSyC9SlDURPMIRDFIdKTAkH5ZmSwmum8cOy0/g,
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc/g
];

async function updateWorkflowFiles() {
    console.log('🔄 Updating n8n workflow files for Google Vision API');
    console.log('====================================================\n');
    
    console.log(`Using credential: ${CREDENTIAL_NAME}`);
    console.log(`New URL pattern: ${NEW_URL}\n`);
    
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
                    console.log(`  ⚠️  Found old API key pattern`);
                    
                    // Replace with new credential-based URL
                    updatedContent = content.replace(pattern, NEW_URL);
                    wasUpdated = true;
                    break;
                }
            }
            
            // Check if already using credentials
            if (content.includes('$credentials') && content.includes('vision.googleapis.com')) {
                console.log(`  ✅ Already using credentials`);
                continue;
            }
            
            // Save if updated
            if (wasUpdated) {
                fs.writeFileSync(filePath, updatedContent, 'utf8');
                console.log(`  ✅ Updated to use credentials`);
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
        console.log('\n📋 Next steps:');
        console.log(`1. In n8n, create credential named: "${CREDENTIAL_NAME}"`);
        console.log(`2. Add your API key: AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc`);
        console.log(`3. Test your workflow`);
    } else {
        console.log('\n⚠️  No files needed updating.');
        console.log('Check if your workflows already use credentials or different patterns.');
    }
}

// Run if called directly
if (require.main === module) {
    updateWorkflowFiles().catch(console.error);
}