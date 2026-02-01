#!/usr/bin/env node

/**
 * Update n8n workflow files to use environment variable for Google Vision API
 * 
 * Usage:
 *   node update-n8n-env-variable.js [env_var_name]
 * 
 * Example:
 *   node update-n8n-env-variable.js GOOGLE_VISION_API_KEY
 */

const fs = require('fs');
const path = require('path');

// Configuration
const N8N_DIR = './n8n';
const ENV_VAR_NAME = process.argv[2] || 'GOOGLE_VISION_API_KEY';
const NEW_URL = `https://vision.googleapis.com/v1/images:annotate?key={{ $env.${ENV_VAR_NAME} }}`;

// Patterns to search for
const OLD_PATTERNS = [
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=GOOGLE_VISION_API_KEY/g,
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=GOOGLE_API_KEY8cOy0/g,
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=AIzaSyC9SlDURPMIRDFIdKTAkH5ZmSwmum8cOy0/g,
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc/g,
    // Also update the credential pattern we just added
    /https:\/\/vision\.googleapis\.com\/v1\/images:annotate\?key=\{\{\s*\$credentials\.google-vision-api-key\s*\}\}/g
];

async function updateWorkflowFiles() {
    console.log('🔄 Updating n8n workflow files to use environment variable');
    console.log('=========================================================\n');
    
    console.log(`Using environment variable: ${ENV_VAR_NAME}`);
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
                    console.log(`  ⚠️  Found pattern to update`);
                    
                    // Replace with new environment variable URL
                    updatedContent = content.replace(pattern, NEW_URL);
                    wasUpdated = true;
                    break;
                }
            }
            
            // Check if already using environment variable
            if (content.includes('$env') && content.includes('vision.googleapis.com')) {
                console.log(`  ✅ Already using environment variable`);
                continue;
            }
            
            // Save if updated
            if (wasUpdated) {
                fs.writeFileSync(filePath, updatedContent, 'utf8');
                console.log(`  ✅ Updated to use environment variable`);
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
        console.log(`1. In n8n Settings → Environment Variables`);
        console.log(`2. Add variable: "${ENV_VAR_NAME}" = "AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc"`);
        console.log(`3. Restart n8n (if needed for env vars to load)`);
        console.log(`4. Test your workflow`);
    } else {
        console.log('\n⚠️  No files needed updating.');
    }
}

// Run if called directly
if (require.main === module) {
    updateWorkflowFiles().catch(console.error);
}