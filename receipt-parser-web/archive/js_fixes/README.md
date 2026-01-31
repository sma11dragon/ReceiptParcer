# JavaScript Fix Scripts Archive

This directory contains JavaScript scripts that were used for one-time fixes and migrations during project development. These scripts are preserved for historical reference but are no longer needed for daily operations.

## Files Archived

The following scripts were archived in `js_fixes.tar.gz`:

1. **`n8n/fix_logging_nodes.js`** - Fixes logging node configurations in n8n workflows
2. **`receipt-parser-web/fix_workflow_exact.js`** - Exact workflow fixes for n8n JSON
3. **`receipt-parser-web/fix_workflow_permissive.js`** - Permissive workflow fixes for n8n JSON
4. **`receipt-parser-web/fix_workflow_references.js`** - Workflow reference fixes for n8n JSON
5. **`receipt-parser-web/update_simple_formatter.js`** - Updates simple formatter node configurations

## Extraction

To extract the archived files:

```bash
tar -xzf js_fixes.tar.gz
```

## Usage Notes

These scripts were typically run from the project root directory with commands like:

```bash
node receipt-parser-web/fix_workflow_exact.js
```

They read from and write to n8n workflow JSON files in the `n8n/` directory.

## Important Note

Due to iCloud Drive restrictions, the original source files could not be deleted automatically. They remain in their original locations but are no longer needed.

## Last Updated

2025-01-25 - Archived during project cleanup phase