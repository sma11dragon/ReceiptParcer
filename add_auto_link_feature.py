#!/usr/bin/env python3
"""
Modify n8n Dashboard workflow to add Telegram Auto-Link feature.

This script:
1. Adds "Check Bot Token Fallback" node (Postgres query)
2. Adds "Auto-Link User" node (Postgres update)
3. Adds "Send Auto-Link Success" node (HTTP Request)
4. Adds "Bot Token Match Found?" IF node
5. Updates connections to route through fallback logic

Usage:
    python add_auto_link_feature.py [input_file] [output_file] [--postgres-id ID]
    
Example:
    python add_auto_link_feature.py workflow.json output.json --postgres-id my_credential_id
"""

import json
import sys
import uuid
import argparse
from pathlib import Path

# Constants
POSTGRES_CREDENTIALS_TEMPLATE = {
    "postgres": {
        "id": "POSTGRES_ID_PLACEHOLDER",
        "name": "Postgres account"
    }
}

# Node position offsets (relative to existing nodes)
CHECK_FALLBACK_OFFSET = [0, 200]  # Below Token Valid? node
BOT_TOKEN_MATCH_OFFSET = [200, 200]
AUTO_LINK_OFFSET = [400, 100]
SEND_SUCCESS_OFFSET = [600, 100]


def add_auto_link_nodes(workflow, postgres_credential_id="zHzuThcTrBfWy9Xw"):
    """Add auto-link nodes to the workflow.
    
    Args:
        workflow: The n8n workflow JSON object
        postgres_credential_id: The n8n credential ID for PostgreSQL
        
    Returns:
        Modified workflow dict or None if failed
    """
    # Generate unique IDs for new nodes
    check_fallback_id = str(uuid.uuid4())
    bot_token_match_id = str(uuid.uuid4())
    auto_link_id = str(uuid.uuid4())
    send_auto_link_success_id = str(uuid.uuid4())
    
    # Get existing node IDs we need to reference
    token_valid_node = None
    send_token_error_node = None
    
    for node in workflow['nodes']:
        if node['name'] == 'Token Valid?':
            token_valid_node = node
        elif node['name'] == 'Send Token Error':
            send_token_error_node = node
    
    if not token_valid_node or not send_token_error_node:
        print("ERROR: Could not find required nodes 'Token Valid?' or 'Send Token Error'")
        return None
    
    # Calculate positions for new nodes (relative to Token Valid? position)
    token_valid_pos = token_valid_node['position']
    check_fallback_pos = [
        token_valid_pos[0] + CHECK_FALLBACK_OFFSET[0],
        token_valid_pos[1] + CHECK_FALLBACK_OFFSET[1]
    ]
    bot_token_match_pos = [
        token_valid_pos[0] + BOT_TOKEN_MATCH_OFFSET[0],
        token_valid_pos[1] + BOT_TOKEN_MATCH_OFFSET[1]
    ]
    auto_link_pos = [
        token_valid_pos[0] + AUTO_LINK_OFFSET[0],
        token_valid_pos[1] + AUTO_LINK_OFFSET[1]
    ]
    send_auto_link_success_pos = [
        token_valid_pos[0] + SEND_SUCCESS_OFFSET[0],
        token_valid_pos[1] + SEND_SUCCESS_OFFSET[1]
    ]
    
    # Create credentials object
    credentials = {
        "postgres": {
            "id": postgres_credential_id,
            "name": "Postgres account"
        }
    }
    
    # SQL queries
    check_fallback_sql = """SELECT id, username, email, telegram_bot_token
FROM users
WHERE telegram_bot_token = '{{ $json.text.split(" ")[1] }}'
LIMIT 1;"""
    
    auto_link_sql = """UPDATE users 
SET telegram_chat_id = {{ $json.chat_id }}, 
    telegram_user_id = {{ $json.telegram_user_id }}, 
    is_verified = true, 
    updated_at = NOW() 
WHERE id = {{ $json.user_id }} 
RETURNING id, username, email, telegram_chat_id, telegram_user_id;"""
    
    # 1. Add "Check Bot Token Fallback" node (Postgres)
    check_fallback_node = {
        "parameters": {
            "operation": "executeQuery",
            "query": check_fallback_sql,
            "options": {}
        },
        "type": "n8n-nodes-base.postgres",
        "typeVersion": 2.6,
        "position": check_fallback_pos,
        "id": check_fallback_id,
        "name": "Check Bot Token Fallback",
        "credentials": credentials,
        "notes": "Fallback: Check if token matches users.telegram_bot_token for auto-link"
    }
    
    # 2. Add "Bot Token Match Found?" IF node
    # Note: Using != null instead of !== undefined for broader null/undefined checking
    bot_token_match_node = {
        "parameters": {
            "conditions": {
                "options": {
                    "caseSensitive": True,
                    "leftValue": "",
                    "typeValidation": "strict",
                    "version": 3
                },
                "conditions": [
                    {
                        "id": str(uuid.uuid4()),
                        "leftValue": "={{ $json.id != null }}",
                        "rightValue": 0,
                        "operator": {
                            "type": "boolean",
                            "operation": "true",
                            "singleValue": True
                        }
                    }
                ],
                "combinator": "and"
            },
            "options": {}
        },
        "type": "n8n-nodes-base.if",
        "typeVersion": 2.3,
        "position": bot_token_match_pos,
        "id": bot_token_match_id,
        "name": "Bot Token Match Found?",
        "notes": "Check if bot_token fallback found a matching user"
    }
    
    # 3. Add "Auto-Link User" node (Postgres update)
    auto_link_node = {
        "parameters": {
            "operation": "executeQuery",
            "query": auto_link_sql,
            "options": {}
        },
        "type": "n8n-nodes-base.postgres",
        "typeVersion": 2.6,
        "position": auto_link_pos,
        "id": auto_link_id,
        "name": "Auto-Link User",
        "credentials": credentials,
        "notes": "Auto-link user by updating telegram_chat_id and telegram_user_id"
    }
    
    # 4. Add "Send Auto-Link Success" node (HTTP Request to Telegram)
    json_body = """={{ {
  chat_id: $json.chat_id,
  text: `✅ **Welcome! Your Telegram account has been automatically linked!**

Your account ({{ $json.email || $json.username }}) is now connected to this Telegram bot.

You can now send receipt images and I'll parse them for you.

Try it: Send me a photo of a receipt! 📸`,
  parse_mode: "Markdown"
} }}"""
    
    send_auto_link_success_node = {
        "parameters": {
            "method": "POST",
            "url": "=https://api.telegram.org/bot{{ $json.bot_token || $('Execute Workflow Trigger').first().json.bot_token }}/sendMessage",
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": json_body,
            "options": {
                "timeout": 30000
            }
        },
        "id": send_auto_link_success_id,
        "name": "Send Auto-Link Success",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": send_auto_link_success_pos
    }
    
    # Add nodes to workflow
    workflow['nodes'].append(check_fallback_node)
    workflow['nodes'].append(bot_token_match_node)
    workflow['nodes'].append(auto_link_node)
    workflow['nodes'].append(send_auto_link_success_node)
    
    # Update connections
    # Current: Token Valid? (NO) → Send Token Error
    # New: Token Valid? (NO) → Check Bot Token Fallback → Bot Token Match Found?
    #      Bot Token Match Found? (YES) → Auto-Link User → Send Auto-Link Success
    #      Bot Token Match Found? (NO) → Send Token Error
    
    # Update Token Valid? connection (change NO branch)
    workflow['connections']['Token Valid?'] = {
        "main": [
            [
                {
                    "node": "Update Telegram ID",
                    "type": "main",
                    "index": 0
                }
            ],
            [
                {
                    "node": "Check Bot Token Fallback",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
    
    # Add connection for Check Bot Token Fallback
    workflow['connections']['Check Bot Token Fallback'] = {
        "main": [
            [
                {
                    "node": "Bot Token Match Found?",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
    
    # Add connection for Bot Token Match Found?
    workflow['connections']['Bot Token Match Found?'] = {
        "main": [
            [
                {
                    "node": "Auto-Link User",
                    "type": "main",
                    "index": 0
                }
            ],
            [
                {
                    "node": "Send Token Error",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
    
    # Add connection for Auto-Link User
    workflow['connections']['Auto-Link User'] = {
        "main": [
            [
                {
                    "node": "Send Auto-Link Success",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
    
    print(f"✅ Added 4 new nodes:")
    print(f"   - Check Bot Token Fallback")
    print(f"   - Bot Token Match Found?")
    print(f"   - Auto-Link User")
    print(f"   - Send Auto-Link Success")
    print(f"\n✅ Updated connections for /start command flow")
    
    return workflow


def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description='Add Telegram Auto-Link feature to n8n Dashboard workflow',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python add_auto_link_feature.py
  python add_auto_link_feature.py workflow.json output.json
  python add_auto_link_feature.py workflow.json output.json --postgres-id my_credential_id
        """
    )
    parser.add_argument(
        'input_file',
        nargs='?',
        default='n8n/v18 Dashboard - Telegram Chat ID Fix.json',
        help='Input workflow JSON file (default: n8n/v18 Dashboard - Telegram Chat ID Fix.json)'
    )
    parser.add_argument(
        'output_file',
        nargs='?',
        default='n8n/v18 Dashboard - Telegram Chat ID Fix - AUTO_LINK.json',
        help='Output workflow JSON file (default: n8n/v18 Dashboard - Telegram Chat ID Fix - AUTO_LINK.json)'
    )
    parser.add_argument(
        '--postgres-id',
        default='zHzuThcTrBfWy9Xw',
        help='PostgreSQL credential ID in n8n (default: zHzuThcTrBfWy9Xw)'
    )
    
    args = parser.parse_args()
    
    input_path = Path(args.input_file)
    output_path = Path(args.output_file)
    
    # Read the original workflow
    print(f"📖 Reading workflow from: {input_path}")
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            workflow = json.load(f)
    except FileNotFoundError:
        print(f"❌ ERROR: Input file not found: {input_path}")
        print(f"   Current directory: {Path.cwd()}")
        print(f"   Absolute path tried: {input_path.absolute()}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ ERROR: Invalid JSON in input file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ ERROR: Could not read input file: {e}")
        sys.exit(1)
    
    print(f"✅ Loaded workflow with {len(workflow['nodes'])} nodes")
    
    # Add auto-link feature
    modified_workflow = add_auto_link_nodes(workflow, args.postgres_id)
    
    if modified_workflow:
        # Write modified workflow
        print(f"\n💾 Writing modified workflow to: {output_path}")
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(modified_workflow, f, indent=2)
            print(f"✅ Successfully created: {output_path}")
        except PermissionError:
            print(f"❌ ERROR: Permission denied writing to: {output_path}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ ERROR: Could not write output file: {e}")
            sys.exit(1)
        
        print(f"📊 Total nodes: {len(modified_workflow['nodes'])}")
        print("\n" + "="*60)
        print("🎉 AUTO-LINK FEATURE IMPLEMENTATION COMPLETE!")
        print("="*60)
        print("\nNext steps:")
        print("1. Upload the new JSON file to n8n")
        print("2. Test the /start BOT_TOKEN command with a new user")
        print("3. Verify the auto-link flow works correctly")
        print("\n" + "="*60)
    else:
        print("❌ Failed to modify workflow")
        sys.exit(1)


if __name__ == "__main__":
    main()
