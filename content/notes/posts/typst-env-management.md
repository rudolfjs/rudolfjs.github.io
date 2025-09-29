---
title: "Typst Environment Management and Quick Start"
date: 2025-09-29T11:11:08+10:00
lastmod: 2025-09-29T11:11:08+10:00
description: "Creating Typst workspace on Linux"
categories: ["technical-notes"]
tags: ["typst", "environment", "academic-writing"]
draft: true
---

_I have only started using Typst in my toolchain, traditionally I use LaTeX for academic writing. Currently, this note serves as a "quick start" and where Typst fits in my documentation workflow._

## Documentation Hierarchy

My documentation workflow follows a hierarchy based on audience and formality (this can/will change):

1. **Personal/Laboratory Notes** (Zero dissemination)
   - **Tool**: Obsidian/Markdown
   - **Use**: Personal knowledge management, lab notebooks, daily notes, research ideas
   - **Output**: Stay in markdown, occasionally export to PDF via Obsidian

2. **Professional Dissemination** (Internal/semi-formal)
   - **Tool**: Typst
   - **Use**: Progress reports, meeting agendas, presentations, technical documentation, internal reports
   - **Output**: Direct to PDF
   - **Why**: Fast compilation, clean output, **simpler than LaTeX**

3. **Academic Dissemination** (Formal publication)
   - **Tool**: LaTeX
   - **Use**: Journal articles, conference papers, thesis chapters
   - **Output**: PDF for submission, or LaTeX source if required
   - **Why**: Universal journal acceptance, mature ecosystem, required by most publishers
4. **Word.docx**
   - Only if I **must**.
# Environment

1. Fedora Linux 42
2. cargo 1.89.0
3. typst 0.13.1

## Install typst-cli

I am assuming [cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html) has been installed.  
1. To install typst: 

```bash
cargo install --locked typst-cli
```
2. Check that it is installed correctly:

```bash
typst --version
```

Expected Output:
```console {.no-copy}
typst 0.13.1
```
From here you can use VSCode as the editor, I am using the [tinymist plugin](https://myriad-dreamin.github.io/tinymist/).

To official typst app is [online only](https://typst.app/pricing/).

## Quick Start 


## Notes

- 

## References

- 