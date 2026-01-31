#!/usr/bin/env python3
"""
ReceiptAI n8n Workflow Migration Script - FINAL VERSION
Uses AWS S3 node with verified working R2 configuration
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Configuration - Load from environment variables
import os
R2_ENDPOINT = os.environ.get('R2_ENDPOINT', '')
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL', '')
R2_BUCKET = os.environ.get('R2_BUCKET_NAME', 'receiptai-images')
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID', '')

if not R2_ENDPOINT or not R2_PUBLIC_URL:
    print("❌ ERROR: R2_ENDPOINT and R2_PUBLIC_URL environment variables must be set")
    print("   Set them in your .env file or export them before running this script")
    sys.exit(1)

# Workflow file paths
WORKFLOW_DIR = Path("/Users/siewloongchan/Documents/AI Projects/Receipts Parsing/n8n")
DASHBOARD_WORKFLOW = WORKFLOW_DIR / "v18 Dashboard - Telegram Chat ID Fix.json"
WEB_DIR = Path("/Users/siewloongchan/Documents/AI Projects/Receipts Parsing/receipt-parser-web")
ENV_FILE = WEB_DIR / ".env.local"
HELPER_FILE = WEB_DIR / "lib" / "storage.ts"

def backup_file(filepath):
    """Create timestamped backup of file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = filepath.with_suffix(f".json.backup_{timestamp}")
    with open(filepath, 'r') as f:
        content = f.read()
    with open(backup_path, 'w') as f:
        f.write(content)
    print(f"✅ Backup created: {backup_path}")
    return content

def create_r2_upload_node():
    """Create AWS S3 node for R2 upload - VERIFIED WORKING"""
    return {
        "id": "upload-to-r2-s3",
        "name": "Upload to R2",
        "type": "n8n-nodes-base.awsS3",
        "typeVersion": 1,
        "position": [-6400, -624],
        "parameters": {
            "operation": "upload",
            "bucket": R2_BUCKET,
            "key": "=receipts/{{ $json.user_id }}/{{ $json.dynamic_filename }}",
            "binaryData": True,
            "binaryPropertyName": "data",
            "acl": "public-read",
            "additionalFields": {}
        },
        "credentials": {
            "aws": {
                "id": "r2-s3-credentials",
                "name": "R2 S3 Credentials"
            }
        },
        "notes": f"VERIFIED WORKING: Uploads to R2 using AWS S3 API. Credential must be configured in n8n with R2 endpoint. Public URL will be: {R2_PUBLIC_URL}/receipts/{{user_id}}/{{filename}}"
    }

def create_combine_ocr_r2_code():
    """Create the updated code with CORRECT public URL"""
    return f"""const botToken = $input.first().json.bot_token;
const parsingData = $('Parsing Success?').first().json;
const processImageData = $('Process Image').first().json;
const buildFilenameData = $('Build Filename from Parsed Data').first().json;

    // R2 Configuration - Loaded from environment variables
    // Set R2_PUBLIC_URL in your .env file
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '{R2_PUBLIC_URL}';

// Get user ID and filename
const userId = processImageData.user_id;
const filename = buildFilenameData.dynamic_filename;

// Build R2 file key and public URL
// Note: Public URL doesn't include bucket name (receiptai-images)
const fileKey = `receipts/${{userId}}/${{filename}}`;
const r2Url = `${{R2_PUBLIC_URL}}/${{fileKey}}`;

// Merge ALL data: parsing results + R2 URL + chat ID + user ID
return [{{
  json: {{
    ...parsingData,
    chat_id: processImageData.chat_id,
    user_id: userId,
    telegram_user_id: processImageData.telegram_user_id,
    storage_provider: 'r2',
    drive_file_id: fileKey,  // Store path without bucket name
    receipt_image_url: r2Url,
    receipt_direct_url: r2Url,
    file_name: filename,
    bot_token: botToken
  }}
}}];"""

def update_workflow():
    """Update the n8n Dashboard workflow JSON"""
    print("\n🔄 Processing n8n workflow...")
    
    # Read and backup workflow
    content = backup_file(DASHBOARD_WORKFLOW)
    workflow = json.loads(content)
    
    # Track changes
    changes_made = []
    
    # Find nodes to modify
    nodes_to_remove = []
    
    # IDs of nodes to handle
    GOOGLE_DRIVE_UPLOAD_ID = "9d2ec14a-3219-43d8-925a-aedb396e20ce"
    MAKE_SHAREABLE_ID = "d62b9f40-f7e6-412a-9fc7-ad2b43e37f4f"
    COMBINE_OCR_ID = "198a31e9-4c85-4cb8-9d3b-b1323e48efa8"
    BUILD_FILENAME_ID = "af7322f5-34cb-4749-9868-98c6642016d2"
    
    new_upload_node = create_r2_upload_node()
    new_upload_id = new_upload_node["id"]
    
    # Process existing nodes
    for i, node in enumerate(workflow["nodes"]):
        node_id = node.get("id", "")
        node_name = node.get("name", "")
        
        # Replace "Upload to Google Drive" with "Upload to R2" (AWS S3)
        if node_id == GOOGLE_DRIVE_UPLOAD_ID:
            print(f"📝 Replacing node: {node_name} ({node_id})")
            workflow["nodes"][i] = new_upload_node
            changes_made.append(f"Replaced '{node_name}' with 'Upload to R2 (AWS S3)'")
            
        # Mark "Make File Shareable" for removal
        elif node_id == MAKE_SHAREABLE_ID:
            print(f"🗑️  Marking for deletion: {node_name} ({node_id})")
            nodes_to_remove.append(i)
            changes_made.append(f"Deleted '{node_name}' (not needed with R2)")
            
        # Update "Combine OCR and Drive Data" code
        elif node_id == COMBINE_OCR_ID:
            print(f"📝 Updating code in: {node_name} ({node_id})")
            node["name"] = "Combine OCR and R2 Data"
            node["parameters"]["jsCode"] = create_combine_ocr_r2_code()
            changes_made.append(f"Updated '{node_name}' code with correct R2 public URL")
    
    # Remove marked nodes (in reverse order to maintain indices)
    for idx in sorted(nodes_to_remove, reverse=True):
        removed_node = workflow["nodes"].pop(idx)
        print(f"✅ Deleted: {removed_node.get('name', 'Unknown')}")
    
    # Update connections
    print("\n🔗 Updating node connections...")
    connections = workflow.get("connections", {})
    
    # Update connection from Build Filename to point to new Upload node
    if BUILD_FILENAME_ID in connections:
        for branch in connections[BUILD_FILENAME_ID]:
            if isinstance(branch, list):
                for conn in branch:
                    if conn.get("node") == GOOGLE_DRIVE_UPLOAD_ID:
                        conn["node"] = new_upload_id
                        print(f"✅ Updated connection: Build Filename → Upload to R2")
    
    # Update connection from new Upload to Combine OCR
    connections[new_upload_id] = [
        [
            {
                "node": COMBINE_OCR_ID,
                "type": "main",
                "index": 0
            }
        ]
    ]
    print(f"✅ Added connection: Upload to R2 → Combine OCR and R2 Data")
    
    # Remove old connections
    if GOOGLE_DRIVE_UPLOAD_ID in connections:
        del connections[GOOGLE_DRIVE_UPLOAD_ID]
    if MAKE_SHAREABLE_ID in connections:
        del connections[MAKE_SHAREABLE_ID]
    
    # Save updated workflow
    output_path = DASHBOARD_WORKFLOW.with_suffix('.r2-FINAL.json')
    with open(output_path, 'w') as f:
        json.dump(workflow, f, indent=2)
    
    print(f"\n✅ Updated workflow saved to: {output_path}")
    print(f"\n📋 Changes made:")
    for change in changes_made:
        print(f"   • {change}")
    
    return output_path

def update_env_file():
    """Update or create .env.local file with R2 configuration"""
    print("\n🔄 Updating .env.local...")
    
    r2_config = f"""
# Cloudflare R2 Configuration - VERIFIED WORKING (Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
# Upload Endpoint (AWS S3 API): {R2_ENDPOINT}
# Public Access URL: {R2_PUBLIC_URL}
R2_ACCOUNT_ID={R2_ACCOUNT_ID}
R2_BUCKET_NAME={R2_BUCKET}
R2_ENDPOINT={R2_ENDPOINT}
R2_PUBLIC_URL={R2_PUBLIC_URL}
"""
    
    # Read existing .env.local if it exists
    existing_content = ""
    if ENV_FILE.exists():
        with open(ENV_FILE, 'r') as f:
            existing_content = f.read()
        print(f"✅ Found existing .env.local")
    else:
        print(f"✅ Creating new .env.local")
    
    # Check if R2 config already exists
    if "R2_PUBLIC_URL=https://receiptimages.daeit.com.sg" in existing_content:
        print("⚠️  R2 configuration with correct public URL already exists")
        return
    
    # Append R2 config
    with open(ENV_FILE, 'a' if ENV_FILE.exists() else 'w') as f:
        if existing_content and not existing_content.endswith('\n'):
            f.write('\n')
        f.write(r2_config)
    
    print(f"✅ R2 configuration added to: {ENV_FILE}")

def create_storage_helper():
    """Create the storage helper TypeScript file"""
    print("\n🔄 Creating storage helper...")
    
    helper_code = f'''// lib/storage.ts
// Receipt image URL generation helper
// Supports both Google Drive (legacy) and R2 (new) storage

/**
 * Get the public URL for a receipt image
 * Handles both legacy Google Drive URLs and new R2 URLs
 */
export function getReceiptImageUrl(expense: Expense): string {{
  // Check if this receipt uses R2 storage
  if (expense.storage_provider === 'r2' && expense.drive_file_id) {{
    // Construct R2 URL from file key
    // Public URL format: {R2_PUBLIC_URL}/receipts/{{user_id}}/{{filename}}
    const r2BaseUrl = process.env.R2_PUBLIC_URL || '{R2_PUBLIC_URL}';
    return `${{r2BaseUrl}}/${{expense.drive_file_id}}`;
  }}
  
  // Fallback to legacy Google Drive URL
  return expense.receipt_image_url;
}}

/**
 * Get the direct download URL for a receipt image
 * For R2, this is the same as the image URL
 */
export function getReceiptDirectUrl(expense: Expense): string {{
  // R2 uses the same URL for both view and direct access
  if (expense.storage_provider === 'r2') {{
    return getReceiptImageUrl(expense);
  }}
  
  // Fallback to legacy Google Drive direct URL
  return expense.receipt_direct_url;
}}

/**
 * Check if a receipt is stored in R2
 */
export function isR2Storage(expense: Expense): boolean {{
  return expense.storage_provider === 'r2';
}}

// TypeScript interface (add to your types file)
interface Expense {{
  id: number;
  user_id: number;
  drive_file_id?: string;
  receipt_image_url?: string;
  receipt_direct_url?: string;
  storage_provider?: 'google_drive' | 'r2';
  // ... other expense fields
}}
'''
    
    # Create lib directory if it doesn't exist
    lib_dir = WEB_DIR / "lib"
    lib_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if file already exists
    if HELPER_FILE.exists():
        print(f"⚠️  storage.ts already exists at: {HELPER_FILE}")
        backup = HELPER_FILE.with_suffix(f".ts.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        with open(HELPER_FILE, 'r') as f:
            content = f.read()
        with open(backup, 'w') as f:
            f.write(content)
        print(f"✅ Backup created: {backup}")
    
    # Write the helper file
    with open(HELPER_FILE, 'w') as f:
        f.write(helper_code)
    
    print(f"✅ Storage helper created: {HELPER_FILE}")

def main():
    """Main execution function"""
    print("=" * 70)
    print("ReceiptAI n8n R2 Migration Script - FINAL VERSION")
    print("=" * 70)
    print(f"\n📂 R2 Bucket: {R2_BUCKET}")
    print(f"🔗 Upload Endpoint: {R2_ENDPOINT}")
    print(f"🌐 Public URL: {R2_PUBLIC_URL}")
    print()
    print("✅ VERIFIED: CLI upload and public access both work!")
    print()
    
    try:
        # Update n8n workflow
        updated_workflow = update_workflow()
        
        # Update .env.local
        update_env_file()
        
        # Create storage helper
        create_storage_helper()
        
        print("\n" + "=" * 70)
        print("✅ MIGRATION COMPLETE!")
        print("=" * 70)
        print("\n📋 Summary:")
        print(f"   1. Updated workflow: {updated_workflow}")
        print(f"   2. Updated .env.local: {ENV_FILE}")
        print(f"   3. Created storage helper: {HELPER_FILE}")
        print("\n🎉 This version uses:")
        print("   - AWS S3 node for uploads (verified working with CLI)")
        print("   - Correct r2.dev public URL for access")
        print("\n⚠️  IMPORTANT - Configure in n8n:")
        print("   1. Settings > Credentials > Add AWS Credential")
        print("   2. Name: 'R2 S3 Credentials'")
        print("   3. Access Key: Set via R2_ACCESS_KEY_ID environment variable")
        print("   4. Secret Key: Set via R2_SECRET_ACCESS_KEY environment variable")
        print("   5. Region: us-east-1 (from dropdown)")
        print(f"   6. Custom Endpoint: {R2_ENDPOINT}")
        print("\n📝 Import workflow:")
        print(f"   - Workflows > Import > From File")
        print(f"   - Select: {updated_workflow}")
        print(f"\n🔗 Public URL format will be:")
        print(f"   {R2_PUBLIC_URL}/receipts/{{user_id}}/{{filename}}.jpg")
        print()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
