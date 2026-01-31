const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'n8n', 'v18 Dashboard - Telegram Chat ID Fix.json');
let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log(`Loaded workflow with ${workflow.nodes.length} nodes`);

// Mapping of old references to new references
const replacements = [
  // $node["Telegram Trigger"].json.message.chat.id -> $json.chat_id
  {
    old: /\$\node\["Telegram Trigger"\]\.json\.message\.chat\.id/g,
    new: '$json.chat_id'
  },
  // $node["Telegram Trigger"].json.message.from.id -> $json.telegram_user_id
  {
    old: /\$\node\["Telegram Trigger"\]\.json\.message\.from\.id/g,
    new: '$json.telegram_user_id'
  },
  // $node["Telegram Trigger"].json.message.from.username -> $json.telegram_username
  {
    old: /\$\node\["Telegram Trigger"\]\.json\.message\.from\.username/g,
    new: '$json.telegram_username'
  },
  // $node["Telegram Trigger"].json.message.text -> $json.text
  {
    old: /\$\node\["Telegram Trigger"\]\.json\.message\.text/g,
    new: '$json.text'
  },
  // $node["Telegram Trigger"].json.message -> $json (maybe not used)
  {
    old: /\$\node\["Telegram Trigger"\]\.json\.message/g,
    new: '$json'
  }
];

function replaceInObject(obj) {
  if (typeof obj === 'string') {
    let newStr = obj;
    for (const rep of replacements) {
      newStr = newStr.replace(rep.old, rep.new);
    }
    return newStr;
  } else if (Array.isArray(obj)) {
    return obj.map(item => replaceInObject(item));
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = replaceInObject(obj[key]);
    }
    return newObj;
  }
  return obj;
}

let modifiedCount = 0;
for (let i = 0; i < workflow.nodes.length; i++) {
  const node = workflow.nodes[i];
  const originalJson = JSON.stringify(node.parameters);
  const newParams = replaceInObject(node.parameters);
  if (JSON.stringify(newParams) !== originalJson) {
    workflow.nodes[i].parameters = newParams;
    modifiedCount++;
    console.log(`Modified node: ${node.name} (${node.id})`);
  }
}

// Also fix connections? No, connections are node references only.

// Write back
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
console.log(`Modified ${modifiedCount} nodes. Workflow saved.`);