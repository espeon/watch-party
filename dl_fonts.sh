#!/bin/bash

# Create target directory if it doesn't exist
mkdir -p src/assets/fonts

# Fetch font data and process entries
curl -s https://api.anime.nexus/api/anime/fonts | \
jq -r 'to_entries[] | select(.value != null) | "\(.key)\t\(.value)"' | \
while IFS=$'\t' read -r font_name url; do
    # Get filename from URL
    filename=$(basename "${url%%\?*}")
    # Create output path
    output_file="react/public/fonts/${filename}"
    
    # Download the font
    echo "Downloading $font_name..."
    curl -s -o "$output_file" "$url"
done

echo "All fonts downloaded to src/assets/fonts/"
