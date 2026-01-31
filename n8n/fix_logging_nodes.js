const fs = require('fs');
const path = require('path');

const workflowFile = path.join(__dirname, 'v18 Dashboard - Telegram Chat ID Fix.json');
const backupFile = path.join(__dirname, 'v18 Dashboard - Telegram Chat ID Fix.json.backup');

// Read the workflow
console.log(`Reading ${workflowFile}...`);
const data = fs.readFileSync(workflowFile, 'utf8');
const workflow = JSON.parse(data);

// Extract the three PostgreSQL nodes from pinData
const pinData = workflow.pinData;
if (!pinData || !pinData['Execute Workflow Trigger']) {
    console.error('No pinData found for Execute Workflow Trigger');
    process.exit(1);
}

const triggerPinData = pinData['Execute Workflow Trigger'];
if (!Array.isArray(triggerPinData)) {
    console.error('pinData for Execute Workflow Trigger is not an array');
    process.exit(1);
}

// Find the PostgreSQL nodes in pinData (they are node definitions, not test data)
const loggingNodes = [];
for (let i = 0; i < triggerPinData.length; i++) {
    const item = triggerPinData[i];
    if (item && item.name && item.name.includes('Log')) {
        console.log(`Found logging node in pinData: ${item.name} (type: ${item.type})`);
        loggingNodes.push(item);
    }
}

console.log(`Found ${loggingNodes.length} logging nodes in pinData`);

if (loggingNodes.length === 0) {
    console.error('No logging nodes found in pinData');
    process.exit(1);
}

// Remove the logging nodes from pinData (keep only test data)
const newPinData = triggerPinData.filter(item => !item.name || !item.name.includes('Log'));
workflow.pinData['Execute Workflow Trigger'] = newPinData;

// Add the logging nodes to the main nodes array
console.log('Adding logging nodes to main nodes array...');
workflow.nodes.push(...loggingNodes);

// Create backup
console.log(`Creating backup: ${backupFile}`);
fs.copyFileSync(workflowFile, backupFile);

// Write updated workflow
console.log(`Writing updated workflow...`);
fs.writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));

console.log('Done!');
console.log(`Added ${loggingNodes.length} logging nodes to workflow.`);
console.log('Remaining in pinData:', newPinData.length, 'items (should be test data only)');