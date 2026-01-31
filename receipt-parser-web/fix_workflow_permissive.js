const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'n8n', 'v18 Dashboard - Telegram Chat ID Fix.json');
let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log(`Loaded workflow with ${workflow.nodes.length} nodes`);

function replaceTelegramTrigger(str) {
  if (typeof str !== 'string') return str;
  
  // First, let's just log any occurrence
  if (str.includes('Telegram Trigger')) {
    console.log('Found "Telegram Trigger" in string, length:', str.length);
    // Extract a snippet
    const idx = str.indexOf('Telegram Trigger');
    const snippet = str.substring(Math.max(0, idx - 50), Math.min(str.length, idx + 100));
    console.log('Snippet:', snippet);
  }
  
  // Generic replacement: replace $node["Telegram Trigger"].json.message.chat.id with $json.chat_id
  // Use regex that matches the pattern with any amount of escaping
  let result = str;
  
  // Pattern: $node["Telegram Trigger"].json.message.chat.id (with optional escaping)
  // We'll match $node[\\"Telegram Trigger\\"] (with any number of backslashes)
  const nodePattern = /(\$node\[\\*"Telegram Trigger\\*"\])/g;
  const matches = result.match(nodePattern);
  if (matches) {
    console.log('Matches:', matches);
    // For each match, we need to replace the whole property chain.
    // Since the chain after the node reference is consistent, we can do a more specific replacement.
  }
  
  // Try direct substring replacement for known patterns
  // Since we know the exact strings from earlier inspection, we can do simple replace.
  // The JSON string contains backslashes: $node[\"Telegram Trigger\"]
  // Let's replace that exact substring.
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]\.json\.message\.chat\.id/g, '$json.chat_id');
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]\.json\.message\.from\.id/g, '$json.telegram_user_id');
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]\.json\.message\.from\.username/g, '$json.telegram_username');
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]\.json\.message\.text/g, '$json.text');
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]\.json\.message/g, '$json');
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]/g, '$json');
  
  return result;
}

function deepReplace(obj) {
  if (typeof obj === 'string') {
    return replaceTelegramTrigger(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(deepReplace);
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = deepReplace(obj[key]);
    }
    return newObj;
  }
  return obj;
}

console.log('Processing...');
const modifiedWorkflow = deepReplace(workflow);

// Write back if changed
if (JSON.stringify(modifiedWorkflow) !== JSON.stringify(workflow)) {
  fs.writeFileSync(workflowPath, JSON.stringify(modifiedWorkflow, null, 2));
  console.log('Workflow saved with replacements.');
} else {
  console.log('No changes made.');
}

// Let's also explicitly list nodes that contain "Telegram Trigger"
console.log('\nNodes containing "Telegram Trigger":');
workflow.nodes.forEach((node, idx) => {
  const str = JSON.stringify(node.parameters);
  if (str.includes('Telegram Trigger')) {
    console.log(`- ${node.name} (${node.id})`);
    // Print the exact pattern found
    const match = str.match(/(\$node\[\\*"Telegram Trigger\\*"\][^}]*)/);
    if (match) console.log('  Pattern:', match[0].substring(0, 100));
  }
});