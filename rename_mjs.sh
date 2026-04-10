#!/bin/bash
# Rename all .mjs files to .js and update all references

set -e

BASE="/var/www/html/basile/SpaceTaskWeb"

# 1. Rename .mjs files to .js
find "$BASE/src" -name "*.mjs" | while read f; do
    mv "$f" "${f%.mjs}.js"
    echo "Renamed: $f -> ${f%.mjs}.js"
done

# 2. Update .mjs references inside .js files
find "$BASE/src" -name "*.js" | while read f; do
    sed -i 's/\.mjs/\.js/g' "$f"
    echo "Updated refs in: $f"
done

# 3. Update references in index.html
sed -i 's/\.mjs/\.js/g' "$BASE/index.html"
echo "Updated refs in: $BASE/index.html"

echo "Done."
