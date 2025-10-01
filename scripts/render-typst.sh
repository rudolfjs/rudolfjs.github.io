#!/bin/bash

# Typst renderer for Hugo
# This script processes Typst code blocks in markdown files and generates PNG outputs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONTENT_DIR="${1:-content}"
OUTPUT_DIR="${2:-static/rendered/typst}"
TEMP_DIR=".typst-temp-$$"

# Create temp directory
mkdir -p "$TEMP_DIR"

# Cleanup on exit
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${GREEN}Starting Typst rendering...${NC}"

# Create output directory structure
mkdir -p "$OUTPUT_DIR"

# Find all markdown files
find "$CONTENT_DIR" -name "*.md" -type f | while read -r file; do
    # Get the slug from the file path
    slug=$(basename "$file" .md)
    dir_name=$(dirname "$file")

    # Check if file contains typst code blocks with render or side-by-side attributes
    if grep -q '```typst.*{.*render.*}' "$file" || grep -q '```typst.*{.*side-by-side.*}' "$file"; then
        echo -e "${YELLOW}Processing: $file${NC}"

        # Create output directory for this post
        post_output_dir="$OUTPUT_DIR/$slug"
        mkdir -p "$post_output_dir"

        # Track needed hashes for this post
        needed_hashes_file="$TEMP_DIR/needed-$slug.txt"
        > "$needed_hashes_file"

        # Extract typst code blocks that need rendering
        awk '
        /```typst.*{.*(render|side-by-side).*}/ {
            in_block=1
            block_content=""
            next
        }
        /```$/ && in_block {
            in_block=0
            # Remove trailing newline to match Hugo .Inner behavior
            sub(/\n$/, "", block_content)

            # Write content to temp file
            temp_file="'$TEMP_DIR'/temp-block-" NR ".typ"
            printf "%s", block_content > temp_file
            close(temp_file)

            # Generate FNV32a hash for this content (matches Hugo hash.FNV32a)
            hash_cmd="python3 scripts/fnv32a.py < " temp_file
            hash_cmd | getline hash
            close(hash_cmd)

            # Rename to final name with hash
            final_file="'$TEMP_DIR'/typst-" hash ".typ"
            system("mv " temp_file " " final_file)

            # Print the hash and filename for processing
            print "typst-" hash
            next
        }
        in_block {
            if (block_content != "") block_content = block_content "\n"
            block_content = block_content $0
        }
        ' "$file" | while read -r hash_name; do

            if [ -n "$hash_name" ]; then
                # Record this hash as needed
                echo "$hash_name" >> "$needed_hashes_file"

                temp_typst_file="$TEMP_DIR/${hash_name}.typ"
                output_png="$post_output_dir/${hash_name}.png"

                # Check if output already exists (caching)
                if [ -f "$output_png" ]; then
                    echo "  Cached: ${hash_name}.png"
                else
                    # Compile Typst to PNG
                    echo "  Compiling: ${hash_name}.typ -> ${hash_name}.png"

                    # Copy any referenced assets from project root to temp dir
                    # This allows relative paths in Typst code to work
                    for ext in png jpg jpeg bib svg; do
                        for asset in *."$ext"; do
                            [ -f "$asset" ] && cp "$asset" "$TEMP_DIR/" 2>/dev/null || true
                        done
                    done

                    # Try PNG first (for simple single-page docs)
                    if typst compile "$temp_typst_file" "$output_png" 2>/dev/null; then
                        echo -e "  ${GREEN}✓${NC} Generated: ${hash_name}.png"
                    else
                        # Multi-page document - use PDF instead
                        output_pdf="${output_png%.png}.pdf"
                        if typst compile "$temp_typst_file" "$output_pdf"; then
                            echo -e "  ${GREEN}✓${NC} Generated: ${hash_name}.pdf"
                        else
                            echo -e "  ${RED}✗${NC} Failed to compile: ${hash_name}.typ"
                        fi
                    fi
                fi
            fi
        done

        # Cleanup orphaned PNGs (files no longer referenced in the markdown)
        if [ -d "$post_output_dir" ] && [ -f "$needed_hashes_file" ]; then
            for png_file in "$post_output_dir"/*.png; do
                if [ -f "$png_file" ]; then
                    png_basename=$(basename "$png_file" .png)
                    if ! grep -q "^${png_basename}$" "$needed_hashes_file"; then
                        echo -e "  ${RED}Removing orphaned:${NC} ${png_basename}.png"
                        rm "$png_file"
                    fi
                fi
            done
        fi
    else
        # No typst render blocks found - remove entire directory if it exists
        post_output_dir="$OUTPUT_DIR/$slug"
        if [ -d "$post_output_dir" ]; then
            echo -e "${YELLOW}No render blocks in: $file${NC}"
            echo -e "  ${RED}Removing directory:${NC} $slug/"
            rm -rf "$post_output_dir"
        fi
    fi
done

echo -e "${GREEN}Typst rendering complete!${NC}"

# Cleanup directories for deleted markdown files
echo -e "${YELLOW}Checking for orphaned directories...${NC}"
for post_dir in "$OUTPUT_DIR"/*; do
    if [ -d "$post_dir" ]; then
        slug=$(basename "$post_dir")
        # Check if corresponding markdown file exists
        md_found=false
        while IFS= read -r md_file; do
            md_slug=$(basename "$md_file" .md)
            if [ "$md_slug" = "$slug" ]; then
                md_found=true
                break
            fi
        done < <(find "$CONTENT_DIR" -name "*.md" -type f)

        if [ "$md_found" = false ]; then
            echo -e "  ${RED}Removing directory for deleted post:${NC} $slug/"
            rm -rf "$post_dir"
        fi
    fi
done

# Count total rendered files
total_files=$(find "$OUTPUT_DIR" -name "*.png" -type f 2>/dev/null | wc -l)
echo -e "${GREEN}Total rendered files: $total_files${NC}"