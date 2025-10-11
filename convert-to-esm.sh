#\!/bin/bash
# Convert CommonJS modules to ES6 modules for browser

# Helper function to convert a file
convert_file() {
  local src=$1
  local dest=$2
  
  cat "$src" | \
    # Convert require statements
    sed -E "s/const \{([^}]+)\} = require\('\.\/([^']+)'\);/import { \1 } from \".\/\2.js\";/g" | \
    sed -E "s/const \{([^}]+)\} = require\(\"\.\/([^\"]+)\"\);/import { \1 } from \".\/\2.js\";/g" | \
    # Convert module.exports to export
    sed 's/^module\.exports = {/export {/' | \
    sed 's/^};$/};/' \
    > "$dest"
}

# Create browser directory if it doesn't exist
mkdir -p src/browser

# Convert each module
for file in src/*.js; do
  basename=$(basename "$file")
  if [ "$basename" \!= "constants.js" ] && [ "$basename" \!= "deck.js" ]; then
    convert_file "$file" "src/browser/$basename"
    echo "Converted $basename"
  fi
done
