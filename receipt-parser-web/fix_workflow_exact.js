const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'n8n', 'v18 Dashboard - Telegram Chat ID Fix.json');
let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log(`Loaded workflow with ${workflow.nodes.length} nodes`);

function replaceAll(str) {
  if (typeof str !== 'string') return str;
  
  let result = str;
  // Replace $node["Telegram Trigger"].json.message.chat.id with $json.chat_id
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]\.json\.message\.chat\.id/g, '$json.chat_id');
  // Replace $node["Telegram Trigger"].json.message.from.id with $json.telegram_user_id
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]\.json\.message\.from\.id/g, '$json.telegram_user_id');
  // Replace $node["Telegram Trigger"].json.message.from.username with $json.telegram_username
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]\.json\.message\.from\.username/g, '$json.telegram_username');
  // Replace $node["Telegram Trigger"].json.message.text with $json.text
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]\.json\.message\.text/g, '$json.text');
  // Replace $node["Telegram Trigger"].json.message with $json (catch-all)
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]\.json\.message/g, '$json');
  // Replace $node["Telegram Trigger"] with $json (for any remaining)
  result = result.replace(/\$node\[\\"Telegram Trigger\\"\]/g, '$json');
  
  return result;
}

function deepReplace(obj) {
  if (typeof obj === 'string') {
    return replaceAll(obj);
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

let modifiedCount = 0;
for (let i = 0; i < workflow.nodes.length; i++) {
  const node = workflow.nodes[i];
  const original = JSON.stringify(node.parameters);
  const updated = deepReplace(node.parameters);
  if (JSON.stringify(updated) !== original) {
    workflow.nodes[i].parameters = updated;
    modifiedCount++;
    console.log(`Modified node: ${node.name} (${node.id})`);
  }
}

// Also fix any references in connections? Not needed.

fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
console.log(`Modified ${modifiedCount} nodes. Workflow saved.`);

// Validate JSON
try {
  JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  console.log('JSON validation passed.');
} catch (err) {
  console.error('JSON validation failed:', err.message);
}