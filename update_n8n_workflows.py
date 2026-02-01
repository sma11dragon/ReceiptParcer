#!/usr/bin/env python3
"""
Update n8n workflow files to use environment variable for Google Vision API key
"""

import json
import os
import glob
import sys

def update_workflow_file(filepath, use_proxy=False):
    """Update a single n8n workflow file"""
    print(f"📄 Processing: {os.path.basename(filepath)}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        updated = False
        
        # Find and update Google Vision OCR nodes
        if 'nodes' in data:
            for node in data['nodes']:
                if node.get('name') == 'Google Vision OCR' and 'parameters' in node:
                    params = node['parameters']
                    
                    if 'url' in params:
                        old_url = params['url']
                        
                        if use_proxy:
                            # Update to use proxy server
                            new_url = "http://localhost:3001/vision/ocr"
                            params['url'] = new_url
                            print(f"  🔄 Updated URL to proxy: {new_url}")
                        else:
                            # Update to use environment variable
                            if 'AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc' in old_url:
                                new_url = "https://vision.googleapis.com/v1/images:annotate?key={{ $env.GOOGLE_VISION_API_KEY }}"
                                params['url'] = new_url
                                print(f"  🔄 Updated URL to use env var")
                        
                        updated = True
        
        if updated:
            # Save updated file
            backup_path = filepath + '.backup'
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"  💾 Backup saved to: {backup_path}")
            
            # Save original file with updates
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"  ✅ File updated successfully")
        else:
            print(f"  ⚠️  No Google Vision nodes found to update")
        
        return updated
        
    except Exception as e:
        print(f"  ❌ Error processing file: {e}")
        return False

def main():
    print("🔄 n8n Workflow Updater")
    print("=" * 50)
    
    # Ask for update method
    print("\n📝 Choose update method:")
    print("1. Use n8n environment variable ({{ $env.GOOGLE_VISION_API_KEY }})")
    print("2. Use proxy server (http://localhost:3001/vision/ocr)")
    print("3. Update all workflow files in n8n directory")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    use_proxy = False
    if choice == '2':
        use_proxy = True
        print("🔒 Using proxy server method")
    elif choice == '1':
        print("🌍 Using environment variable method")
    elif choice == '3':
        print("📁 Processing all workflow files...")
    else:
        print("❌ Invalid choice")
        return
    
    # Find workflow files
    n8n_dir = "n8n"
    if not os.path.exists(n8n_dir):
        print(f"❌ n8n directory not found: {n8n_dir}")
        return
    
    # Get list of workflow files
    workflow_files = []
    for pattern in ["*.json", "*.r2-*.json"]:
        workflow_files.extend(glob.glob(os.path.join(n8n_dir, pattern)))
    
    print(f"\n📂 Found {len(workflow_files)} workflow files")
    
    if choice == '3':
        # Update all files
        updated_count = 0
        for filepath in workflow_files:
            if update_workflow_file(filepath, use_proxy):
                updated_count += 1
            print()
        
        print(f"✅ Updated {updated_count} out of {len(workflow_files)} files")
    
    else:
        # Update specific files
        print("\n📋 Available workflow files:")
        for i, filepath in enumerate(workflow_files[:20], 1):  # Show first 20
            filename = os.path.basename(filepath)
            print(f"{i:2}. {filename}")
        
        if len(workflow_files) > 20:
            print(f"   ... and {len(workflow_files) - 20} more")
        
        print("\n0. Update all files")
        
        try:
            selection = input("\nEnter file number(s) separated by commas (or 0 for all): ").strip()
            
            if selection == '0':
                # Update all files
                updated_count = 0
                for filepath in workflow_files:
                    if update_workflow_file(filepath, use_proxy):
                        updated_count += 1
                    print()
                
                print(f"✅ Updated {updated_count} out of {len(workflow_files)} files")
            
            else:
                # Update selected files
                indices = [int(i.strip()) - 1 for i in selection.split(',')]
                updated_count = 0
                
                for idx in indices:
                    if 0 <= idx < len(workflow_files):
                        filepath = workflow_files[idx]
                        if update_workflow_file(filepath, use_proxy):
                            updated_count += 1
                        print()
                    else:
                        print(f"❌ Invalid index: {idx + 1}")
                
                print(f"✅ Updated {updated_count} out of {len(indices)} selected files")
        
        except ValueError:
            print("❌ Invalid input")
    
    print("\n📋 Next steps:")
    if use_proxy:
        print("1. Deploy proxy server on your n8n server")
        print("2. Import updated workflow to n8n")
        print("3. Test the workflow")
    else:
        print("1. Set GOOGLE_VISION_API_KEY environment variable in n8n")
        print("2. Import updated workflow to n8n")
        print("3. Test the workflow")
    
    print("\n⚠️  IMPORTANT: Always backup your workflows before importing!")

if __name__ == "__main__":
    main()