# rudolfj.github.io

Rudolf J profile hosted using GitHub Pages.

## Development

Install `hugo` locally:

_Assuming Fedora Linux Version: 42, for other platforms please see [Installation](https://gohugo.io/installation/linux/)._

```bash
sudo dnf install hugo
```

To run the server locally:

```bash
hugo server -D --disableFastRender
```

## Creating Content

Use `hugo new` with the available archetypes to create new content:

### Blog Posts
```bash
# Structured blog post
hugo new content/blog/posts/your-post-title.md
# Creates a note
hugo new content/notes/posts/your-note-title.md
# Add a project
hugo new content/projects/your-project-name.md
# Add a publication
hugo new content/publications/your-publication-title.md
```

## Code Block Rendering

Control how code blocks are displayed vs rendered using attributes:

### Mermaid Diagrams
- ` ```mermaid ` - Default: render the diagram
- ` ```mermaid {.raw} ` - Show raw mermaid code (syntax highlighted)

### Typst Documents
- ` ```typst ` - Default: show raw typst code (syntax highlighted)
- ` ```typst {.render} ` - Compile and show output
- ` ```typst {.side-by-side} ` - Show code and output side by side

#### Rendering Typst Outputs

To generate PNG images for Typst code blocks marked with `{.render}` or `{.side-by-side}`:

```bash
bash scripts/render-typst.sh
```

This script will:
- Scan all markdown files for Typst code blocks that need rendering
- Compile them using the Typst CLI to PNG images
- Save outputs to `static/rendered/typst/{page-slug}/typst-{hash}.png`
- Cache previously rendered images (won't re-render if unchanged)

## Content Publishing Workflow

### For posts with Typst rendering:

1. **Create or edit your markdown file:**
   ```bash
   hugo new content/notes/posts/my-new-post.md
   # Edit the file, add Typst code blocks with {.render} or {.side-by-side}
   ```

2. **Generate Typst PNG outputs:**
   ```bash
   bash scripts/render-typst.sh
   ```

3. **Test locally:**
   ```bash
   hugo server -D
   # Visit http://localhost:1313 and verify your content renders correctly
   ```

4. **Commit and push:**
   ```bash
   git add content/notes/posts/my-new-post.md
   git add static/rendered/typst/my-new-post/
   git commit -m "Add new post with Typst rendering"
   git push
   ```

### For posts without Typst rendering:

1. Create/edit markdown file
2. Test locally with `hugo server -D`
3. Commit and push

### Important Notes:
- **Always commit the generated PNG files** - They must be in the repository for GitHub Pages to serve them
- The render script uses caching - only re-renders changed content
- Raw Typst code blocks (` ```typst `) don't need the script, they just show syntax-highlighted code
- Mermaid diagrams work without scripts (rendered client-side)
