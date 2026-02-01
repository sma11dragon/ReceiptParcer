#!/bin/bash
# Script to clean ALL exposed API keys from files

echo "=== CLEANING ALL EXPOSED API KEYS ==="

# Create backup directory
BACKUP_DIR="backup_all_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Backing up files to: $BACKUP_DIR"

# Find all JSON files in n8n directory
FILES_TO_CLEAN=$(find n8n -name "*.json" -type f)

for file in $FILES_TO_CLEAN; do
  echo "Processing: $file"
  
  # Create backup
  cp "$file" "$BACKUP_DIR/"
  
  # Create temp file
  temp_file="${file}.cleaned"
  
  # Copy original
  cp "$file" "$temp_file"
  
  # Find and replace ALL API key patterns
  # Google API keys (AIzaSy...)
  sed -i '' 's/AIzaSy[[:alnum:]]\{28\}/GOOGLE_API_KEY/g' "$temp_file"
  
  # Anthropic API keys (sk-ant-...)
  sed -i '' 's/sk-ant-[[:alnum:]-]\{100,\}/ANTHROPIC_API_KEY/g' "$temp_file"
  
  # Groq API keys (gsk_...)
  sed -i '' 's/gsk_[[:alnum:]]\{50,\}/GROQ_API_KEY/g' "$temp_file"
  
  # 64-character hex keys (Together AI, etc.)
  sed -i '' 's/[[:alnum:]]\{64,\}/HEX_API_KEY/g' "$temp_file"
  
  # 32-character hex keys (DeepSeek, etc.)
  sed -i '' 's/sk-[[:alnum:]]\{32,\}/DEEPSEEK_API_KEY/g' "$temp_file"
  
  # Alibaba API keys
  sed -i '' 's/sk-[[:alnum:]]\{32,\}/ALIBABA_API_KEY/g' "$temp_file"
  
  # Replace the original file
  mv "$temp_file" "$file"
  echo "  ✓ Cleaned: $file"
done

echo ""
echo "=== VERIFICATION ==="
echo "Checking for remaining exposed keys..."

# Check for any remaining API key patterns
PATTERNS=(
  "AIzaSy[[:alnum:]]\{28\}"
  "sk-ant-[[:alnum:]-]\{100,\}"
  "gsk_[[:alnum:]]\{50,\}"
  "[[:alnum:]]\{64,\}"
  "sk-[[:alnum:]]\{32,\}"
)

for file in $FILES_TO_CLEAN; do
  remaining=false
  for pattern in "${PATTERNS[@]}"; do
    if grep -q "$pattern" "$file"; then
      if [ "$remaining" = false ]; then
        echo "⚠ WARNING: Found keys in $file:"
        remaining=true
      fi
      grep -o "$pattern" "$file" | head -3 | while read key; do
        echo "  - ${key:0:30}..."
      done
    fi
  done
  
  if [ "$remaining" = false ]; then
    echo "✓ Clean: $file"
  fi
done

echo ""
echo "=== CRITICAL NEXT STEPS ==="
echo "1. REVOKE ALL EXPOSED KEYS IMMEDIATELY:"
echo "   - Google Cloud Console: Revoke both Google API keys"
echo "   - Anthropic: Key already deactivated, check for charges"
echo "   - Groq: Revoke the exposed key"
echo "   - Together AI: Revoke the exposed key"
echo "   - Alibaba: Revoke the exposed key"
echo "   - DeepSeek: Revoke the exposed key"
echo ""
echo "2. SET NEW API KEYS as environment variables in n8n:"
echo "   - GOOGLE_VISION_API_KEY"
echo "   - GOOGLE_GEMINI_API_KEY"
echo "   - ANTHROPIC_API_KEY"
echo "   - GROQ_API_KEY"
echo "   - TOGETHER_AI_API_KEY"
echo "   - ALIBABA_API_KEY"
echo "   - DEEPSEEK_API_KEY"
echo ""
echo "3. UPDATE N8N WORKFLOWS to use environment variables:"
echo "   - Replace GOOGLE_API_KEY with {{ $env.GOOGLE_VISION_API_KEY }}"
echo "   - Replace GOOGLE_GEMINI_API_KEY with {{ $env.GOOGLE_GEMINI_API_KEY }}"
echo "   - etc."
echo ""
echo "4. COMMIT CLEANED FILES to GitHub"
echo ""
echo "5. PURGE GIT HISTORY of exposed keys (if needed):"
echo "   git filter-repo --force --invert-paths --path 'n8n/'"
echo ""
echo "Backups saved in: $BACKUP_DIR"