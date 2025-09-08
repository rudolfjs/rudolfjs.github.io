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
