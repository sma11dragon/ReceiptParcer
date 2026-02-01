#!/usr/bin/env python3
"""
Simple script to update n8n workflow to use environment variable
"""

import json
import os

def update_workflow():
    """Update the main workflow file"""
    workflow_file = "n8n/v18 Dashboard - Telegram Chat ID Fix.json"
    
    if not os.path.exists(workflow_file):
        print(f"❌ Workflow file not found: {workflow_file}")
        return False
    
    print(f"📄 Processing: {workflow_file}")
    
    try:
        with open(workflow_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        updated = False
        
        # Find Google Vision OCR node
        if 'nodes' in data:
            for node in data['nodes']:
                if node.get('name') == 'Google Vision OCR' and 'parameters' in node:
                    params = node['parameters']
                    
                    if 'url' in params:
                        old_url = params['url']
                        
                        # Check if it contains the hardcoded key
                        if 'AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc' in old_url:
                            # Update to use environment variable
                            new_url = "https://vision.googleapis.com/v1/images:annotate?key={{ $env.GOOGLE_VISION_API_KEY }}"
                            params['url'] = new_url
                            print(f"  🔄 Updated URL from hardcoded key to environment variable")
                            print(f"  📝 Old: {old_url[:80]}...")
                            print(f"  📝 New: {new_url}")
                            updated = True
                        elif '{{ $env.GOOGLE_VISION_API_KEY }}' in old_url:
                            print(f"  ✅ Already using environment variable")
                            updated = True
                        else:
                            print(f"  ⚠️  URL doesn't contain expected key: {old_url[:80]}...")
        
        if updated:
            # Create backup
            backup_file = workflow_file + '.backup'
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"  💾 Backup saved to: {backup_file}")
            
            # Save updated file
            with open(workflow_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"  ✅ Workflow updated successfully!")
            
            return True
        else:
            print(f"  ⚠️  No changes made - Google Vision node not found or already updated")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("🔄 n8n Workflow Updater")
    print("=" * 50)
    
    # Update the main workflow
    success = update_workflow()
    
    if success:
        print("\n✅ Success! Now you need to:")
        print("1. Import the updated workflow to n8n")
        print("2. Test the workflow")
        print("\n📋 Import steps:")
        print("   a. Go to: https://n8ntest.daeit.com.sg/home/workflows")
        print("   b. Click 'Import from file'")
        print("   c. Select: 'n8n/v18 Dashboard - Telegram Chat ID Fix.json'")
        print("   d. Click 'Import Workflow'")
        print("\n🧪 Test steps:")
        print("   a. Run the workflow with a test receipt")
        print("   b. Verify Google Vision API is called successfully")
        print("   c. Check that data is saved to database")
    else:
        print("\n❌ Update failed. Check the error message above.")

if __name__ == "__main__":
    main()