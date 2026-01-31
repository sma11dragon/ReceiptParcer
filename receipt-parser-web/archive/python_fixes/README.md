# Python Fix Scripts Archive

This directory contains Python scripts that were used for one-time fixes and migrations during project development. These scripts are preserved for historical reference but are no longer needed for daily operations.

## Files Archived

The following scripts were archived in `python_fixes.tar.gz`:

1. **`extract_classification.py`** - Extracts classification logic from n8n workflows
2. **`fix_classification_ordering.py`** - Fixes classification ordering in n8n workflows
3. **`fix_all_telegram_references.py`** - Updates Telegram references in n8n workflows
4. **`fix_escaped.py`** - Fixes escaped characters in n8n workflows
5. **`fix_telegram_trigger.py`** - Updates Telegram trigger configurations
6. **`fix_workflow_simple.py`** - Simplifies n8n workflow structure
7. **`remove_debug.py`** - Removes debug nodes from n8n workflows
8. **`reorder_classification.py`** - Reorders classification logic in n8n workflows
9. **`update_classification.py`** - Updates classification node configurations
10. **`update_merge_results.py`** - Updates merge results node configurations
11. **`update_readme.py`** - Updates project README documentation
12. **`update_simple_formatter.py`** - Updates simple formatter node configurations

## Extraction

To extract the archived files:

```bash
tar -xzf python_fixes.tar.gz
```

## Usage Notes

These scripts were typically run from the project root directory with commands like:

```bash
python fix_classification_ordering.py
```

They read from and write to n8n workflow JSON files in the `n8n/` directory.

## Last Updated

2025-01-25 - Archived during project cleanup phase