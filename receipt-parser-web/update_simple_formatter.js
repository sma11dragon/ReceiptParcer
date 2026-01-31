const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'n8n', 'v18 Dashboard - Telegram Chat ID Fix.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

const nodeId = 'c4137d57-6982-4f6c-9d5a-7febb2195f65';
const node = workflow.nodes.find(n => n.id === nodeId);
if (!node) {
  console.error('Node not found');
  process.exit(1);
}

let jsCode = node.parameters.jsCode;

// Add sessionId variable after chatId extraction
const lines = jsCode.split('\n');
let newLines = [];
for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  // Look for line that extracts chatId
  if (lines[i].includes('const chatId = classifyData.chat_id;')) {
    // Add sessionId after chatId
    newLines.push('const sessionId = classifyData.session_id;');
  }
}
jsCode = newLines.join('\n');

// Now add session_id to each return statement
// Pattern: return [{ json: { ... } }];
// We'll use regex to insert session_id: sessionId, after opening brace of json object
// But careful with nested braces. Simpler: replace each occurrence of 'json: {' with 'json: { session_id: sessionId,'
// However, there might be multiple json objects. Let's do a more targeted replacement.
// We'll look for specific patterns.

// 1. For invalid queries block: lines containing 'chat_id: chatId,'
// 2. For ambiguous queries block: similar
// 3. For empty results block: similar
// 4. For fallback block: similar
// 5. For verified fallback block: similar
// 6. For AI result block: similar

// Instead of complex regex, we'll do a simple replacement for each pattern.
// Since the code is structured, we can replace 'chat_id: chatId,' with 'session_id: sessionId, chat_id: chatId,'
// That should cover all cases.
jsCode = jsCode.replace(/chat_id:\s*chatId,/g, 'session_id: sessionId, chat_id: chatId,');

// Also need to add session_id to the fallback output where maybe chat_id is not present? It is.
// Also need to add session_id to the AI-formatted result where chat_id appears.
// The regex above should catch all.

// Additionally, need to add session_id to the empty results block where chat_id appears.
// Good.

node.parameters.jsCode = jsCode;

// Write back
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
console.log('Updated Simple Formatter node.');