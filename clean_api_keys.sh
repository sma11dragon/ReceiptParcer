#!/bin/bash
# Script to clean exposed API keys from files

echo "=== CLEANING EXPOSED API KEYS ==="

# List of exposed API keys to remove
EXPOSED_KEYS=(
  "AIzaSyC9SlDURPMIRDFIdKTAkH5ZmSwmum8cOy0"
  "AIzaSyA2cfjpSVhdVgBVJPNUyTDDzAxtEcASEpk"
  "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"
  "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"
  "44ceef4e6dfb9e28b4a917428b8fa60cd2534337df09c21571a414f45646eade"
  "sk-c63707cb7e0e40b7962d8615ceb9f348"
  "sk-b95a3b9d3fc04656a5862bf56319bebb"
)

# Files to clean
FILES_TO_CLEAN=(
  "n8n/v18 Dashboard - Telegram Chat ID Fix.r2-s3.json"
  "n8n/v18 Dashboard - Telegram Chat ID Fix copy.json"
  "n8n/v18_Dashboard_BACKUP_20260131_103610.json"
  "n8n/v18_Dashboard_R2_Base64_20260131_101933.json"
  "n8n/v18_Dashboard_R2_Binary_20260131_103610.json"
)

# Create backup directory
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Backing up files to: $BACKUP_DIR"

for file in "${FILES_TO_CLEAN[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$BACKUP_DIR/"
    
    # Create temp file
    temp_file="${file}.cleaned"
    
    # Replace each exposed key with placeholder
    cp "$file" "$temp_file"
    
    for key in "${EXPOSED_KEYS[@]}"; do
      echo "  Removing key: ${key:0:20}..."
      
      # Replace Google Vision API key in URL
      sed -i '' "s|key=${key}|key=GOOGLE_VISION_API_KEY|g" "$temp_file"
      
      # Replace Google Gemini API key in URL
      sed -i '' "s|key=${key}|key=GOOGLE_GEMINI_API_KEY|g" "$temp_file"
      
      # Replace Anthropic API key
      sed -i '' "s|${key}|ANTHROPIC_API_KEY|g" "$temp_file"
      
      # Replace Groq API key
      sed -i '' "s|${key}|GROQ_API_KEY|g" "$temp_file"
      
      # Replace Together AI API key
      sed -i '' "s|${key}|TOGETHER_AI_API_KEY|g" "$temp_file"
      
      # Replace Alibaba API key
      sed -i '' "s|${key}|ALIBABA_API_KEY|g" "$temp_file"
      
      # Replace DeepSeek API key
      sed -i '' "s|${key}|DEEPSEEK_API_KEY|g" "$temp_file"
    done
    
    # Replace the original file
    mv "$temp_file" "$file"
    echo "  ✓ Cleaned: $file"
  else
    echo "  ⚠ File not found: $file"
  fi
done

echo ""
echo "=== VERIFICATION ==="
echo "Checking for remaining exposed keys..."

# Check if any keys remain
for file in "${FILES_TO_CLEAN[@]}"; do
  if [ -f "$file" ]; then
    remaining_keys=$(grep -o "AIzaSy[[:alnum:]]\{28\}\|sk-ant-[[:alnum:]-]\{100,\}\|gsk_[[:alnum:]]\{50,\}\|[[:alnum:]]\{64,\}\|sk-[[:alnum:]]\{32,\}" "$file" | head -5)
    
    if [ -n "$remaining_keys" ]; then
      echo "⚠ WARNING: Still found keys in $file:"
      echo "$remaining_keys" | while read key; do
        echo "  - ${key:0:30}..."
      done
    else
      echo "✓ Clean: $file"
    fi
  fi
done

echo ""
echo "=== NEXT STEPS ==="
echo "1. REVOKE ALL EXPOSED KEYS in respective platforms"
echo "2. Set new API keys as environment variables in n8n:"
echo "   - GOOGLE_VISION_API_KEY"
echo "   - GOOGLE_GEMINI_API_KEY" 
echo "   - ANTHROPIC_API_KEY"
echo "   - GROQ_API_KEY"
echo "   - TOGETHER_AI_API_KEY"
echo "   - ALIBABA_API_KEY"
echo "   - DEEPSEEK_API_KEY"
echo "3. Update n8n workflows to use environment variables"
echo "4. Commit cleaned files to GitHub"
echo ""
echo "Backups saved in: $BACKUP_DIR"