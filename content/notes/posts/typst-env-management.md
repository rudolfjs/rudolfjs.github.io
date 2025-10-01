---
title: "Typst Environment Management and Quick Start"
date: 2025-09-29T11:11:08+10:00
lastmod: 2025-09-29T11:11:08+10:00
description: "Creating Typst workspace on Linux"
categories: ["technical-notes"]
tags: ["typst", "environment", "academic-writing"]
draft: false
---

_I have only started using Typst in my toolchain, traditionally I use LaTeX for academic writing. Currently, this note serves as a "quick start" and where Typst fits in my documentation workflow._

## Documentation Hierarchy

My documentation workflow follows a hierarchy based on audience and formality (this can/will change):

1. **Personal/Laboratory Notes** (Zero dissemination)
   - **Tool**: Obsidian/Markdown
   - **Use**: Personal knowledge management, lab notebooks, daily notes, research ideas
   - **Output**: Stay in markdown, occasionally export to PDF via Obsidian

2. **Professional Dissemination** (Internal/semi-formal, formal)
   - **Tool**: Typst
   - **Use**: Progress reports, meeting agendas, presentations, technical documentation, internal reports
   - **Output**: Direct to PDF
   - **Why**: Fast compilation, clean output, **simpler than LaTeX**

3. **Academic Dissemination** (Publication)
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

## Basics

_I am setting all the typst output with page width 10cm and diffent heights to display nicely within this page._

### Sections

```typst {.side-by-side}
#set page(width: 10cm, height: auto)
= Introduction
This is a paragraph
```

### Lists

For an unordered list use `-`, for ordered lists use `+`

```typst {.side-by-side}
#set page(width: 10cm, height: auto)
The following is an undordered list:
- Item 1
- Item 2
- Item 3
This will be an ordered list:
+ Item 1
+ Item 2
+ Item 3
```

### Tables

Creating a basic table, using the [table function](https://typst.app/docs/reference/model/table/):

```typst {.side-by-side}
#set page(width: 10cm, height: auto)
#table(
  columns: 2,
  [*Amount*], [*Ingredient*],
  [360g], [Baking flour],
  [250g], [Butter (room temp.)],
  [150g], [Brown sugar],
  [100g], [Cane sugar],
  [100g], [70% cocoa chocolate],
  [100g], [35-40% cocoa chocolate],
  [2], [Eggs],
  [Pinch], [Salt],
  [Drizzle], [Vanilla extract],
)
```

#### Table Captions

By default, Typst places captions below tables. For academic writing, captions should appear above tables. Add this configuration to place table captions at the top:

```typst {.side-by-side}
// Place table captions above tables
#set page(width: 10cm, height: 19cm)

== Default caption

By default, the caption will be at the bottom of the table:

#figure(
   table(
      columns: 2,
      [*Amount*], [*Ingredient*],
      [360g], [Baking flour],
      [250g], [Butter (room temp.)],
      [150g], [Brown sugar],
      [100g], [Cane sugar],
      [100g], [70% cocoa chocolate],
      [100g], [35-40% cocoa chocolate],
      [2], [Eggs],
      [Pinch], [Salt],
      [Drizzle], [Vanilla extract],
   ),
   caption: [Table caption appears below the table],
)

#v(1em)

== Set caption position

And now, at the top!

#show figure.where(
  kind: table
): set figure.caption(position: top)

#figure(
  table(
    columns: 2,
    [*Feature*], [*Value*],
    [Speed], [Fast],
    [Quality], [High],
  ),
  caption: [Table caption appears above the table],
)
```

### Figures / Images

Figures are very simple, using the [figure function](https://typst.app/docs/reference/model/figure/) and adding `image` to display an image:

```typst {.side-by-side}
#set page(width: 10cm, height: auto)

#figure(
  image("tree.jpg", width: 80%),
  caption: [A lonely tree.],
) 
```


#### Referencing Figures

To reference figures (or tables) in your text, use the `@` symbol followed by the label you assigned to the figure:

```typst
#figure(
  image("plot.png"),
  caption: [Results from experiment A],
) <figure1>

As shown in @figure1, the results indicate...
```

For example:

```typst {.side-by-side}
#set page(width: 10cm, height: auto)
@tree shows a figure of a tree.

#figure(
  image("tree.jpg", width: 80%),
  caption: [A lonely tree.],
) <tree>
```

The `@figure1` reference will automatically render as "Figure 1" (or the appropriate number). You can also reference:
- Tables: `@table-label`
- Equations: `@eq-label`
- Any labeled element in your document

Example with multiple references:

```typst
We installed typst using cargo @crates_io.

Our typical day is outlined in @figure1, and results
are summarized in @table1.
```

## Example - Basic Article

An internal whitepaper example, following _loose_ academic journal requirements.

- Paper size: Letter (8.5" × 11")
- Font size: 10pt
- Margins: Top 0.85in, Left 2.75in (wide for annotations), Footer 0.75in
- Text dimensions: 5.25in width × 8.75in height
- Line numbers: Right side
- Paragraph: 0.5cm indent, ragged right


```typst
#set page(
  paper: "us-letter",
  margin: (
    top: 0.85in,
    left: 1.75in,
    right: 0.5in,
    bottom: 0.85in,
  ),
  // footer: 0.75in, //this caused an error - need to review
)

// Text configuration
#set text(
  size: 10pt,
)

// Paragraph configuration
#set par(
  first-line-indent: 0.5cm,
  justify: false,  // ragged right
)

// Bibliography configuration
#set bibliography(style: "ieee")

// Table caption configuration - place captions above tables (Vancouver/MLA style)
#show figure.where(
  kind: table
): set figure.caption(position: top)

= The impact of typst on scientific writing in Digital Health

#v(1em) // vertical space, same as \vspace in LaTeX

#grid(
  columns: (1fr, 1fr),
  align(center)[
   Rudolf J Schnetler \
    The University of Queensland \
    #link("mailto:r.schnetler@uq.edu.au")
  ],
  align(center)[
    Dr. John Collaborator \
    The University of Queensland \
    #link("mailto:c.collaborator@uq.edu.au")
  ]
)

#v(1em)

#align(center)[
  #set par(justify: false)
  *Abstract* \
  Typst is a new typesetting system that aims to improve the scientific writing process. This article explores its features, advantages, and potential impact on the field of Digital Health.
]

#v(1em)

== Introduction

Typst is a modern, fast typesetting system for technical and academic documents. Start with the
#link("https://typst.app/docs/")[official documentation].

For reproducible builds across machines, use a per‑project environment manager such as typstenv. It lets
you pin the Typst version, manage dependencies, and create isolated project environments, making
collaboration and CI safer and repeatable.

== Materials & Methods

We installed typst using cargo @crates_io.

We also used some math:


$ A = pi r^2 $ <eq1>


And our typical day outlined in @fig1.
#figure(
  image("sine_is_life.png"),
  caption: [*The Function of Life.* A sinusoidal representation of daily happiness levels from 6am to 10pm, showing key life events and their impact on well-being throughout a typical day.],
) <fig1>

== Results

The main features of typst include a user-friendly syntax, powerful layout capabilities, and seamless integration with other tools. These features make it easier for researchers to create high-quality documents quickly and efficiently.

#figure(
  table(
    columns: 4,
    table.header(
      [*Feature*], [*Typst*], [*LaTeX*], [*Word*],
    ),
    [Compilation Speed], [Fast], [Slow], [N/A],
    [Learning Curve], [Low], [High], [Low],
    [Version Control], [Excellent], [Excellent], [Poor],
    [Mathematical Typesetting], [Good], [Excellent], [Fair],
  ),
  caption: [*Comparison of document preparation systems.* Feature comparison across three commonly used document preparation systems for academic writing.],
) <table1>

== Discussion

The results of our study indicate that typst has the potential to significantly improve the scientific writing process in Digital Health. Its user-friendly interface and powerful features make it an attractive option for researchers and practitioners alike.

== Conclusion

In conclusion, typst represents a promising advancement in the field of scientific writing. By streamlining the writing process and enhancing collaboration, it has the potential to improve the quality and efficiency of research in Digital Health.

#bibliography("references.bib")

```

```typst {.render}
#set page(
  paper: "us-letter",
  margin: (
    top: 0.85in,
    left: 1.75in,
    right: 0.5in,
    bottom: 0.85in,
  ),
  // footer: 0.75in, //this caused an error - need to review
)

// Text configuration
#set text(
  size: 10pt,
)

// Paragraph configuration
#set par(
  first-line-indent: 0.5cm,
  justify: false,  // ragged right
)

// Bibliography configuration
#set bibliography(style: "ieee")

// Table caption configuration - place captions above tables (Vancouver/MLA style)
#show figure.where(
  kind: table
): set figure.caption(position: top)

= The impact of typst on scientific writing in Digital Health

#v(1em) // vertical space, same as \vspace in LaTeX

#grid(
  columns: (1fr, 1fr),
  align(center)[
   Rudolf J Schnetler \
    The University of Queensland \
    #link("mailto:r.schnetler@uq.edu.au")
  ],
  align(center)[
    Dr. John Collaborator \
    The University of Queensland \
    #link("mailto:c.collaborator@uq.edu.au")
  ]
)

#v(1em)

#align(center)[
  #set par(justify: false)
  *Abstract* \
  Typst is a new typesetting system that aims to improve the scientific writing process. This article explores its features, advantages, and potential impact on the field of Digital Health.
]

#v(1em)

== Introduction

Typst is a modern, fast typesetting system for technical and academic documents. Start with the
#link("https://typst.app/docs/")[official documentation].

For reproducible builds across machines, use a per‑project environment manager such as typstenv. It lets
you pin the Typst version, manage dependencies, and create isolated project environments, making
collaboration and CI safer and repeatable.

== Materials & Methods

We installed typst using cargo @crates_io.

We also used some math:


$ A = pi r^2 $ <eq1>


And our typical day outlined in @fig1.
#figure(
  image("sine_is_life.png"),
  caption: [*The Function of Life.* A sinusoidal representation of daily happiness levels from 6am to 10pm, showing key life events and their impact on well-being throughout a typical day.],
) <fig1>

== Results

The main features of typst include a user-friendly syntax, powerful layout capabilities, and seamless integration with other tools. These features make it easier for researchers to create high-quality documents quickly and efficiently.

#figure(
  table(
    columns: 4,
    table.header(
      [*Feature*], [*Typst*], [*LaTeX*], [*Word*],
    ),
    [Compilation Speed], [Fast], [Slow], [N/A],
    [Learning Curve], [Low], [High], [Low],
    [Version Control], [Excellent], [Excellent], [Poor],
    [Mathematical Typesetting], [Good], [Excellent], [Fair],
  ),
  caption: [*Comparison of document preparation systems.* Feature comparison across three commonly used document preparation systems for academic writing.],
) <table1>

== Discussion

The results of our study indicate that typst has the potential to significantly improve the scientific writing process in Digital Health. Its user-friendly interface and powerful features make it an attractive option for researchers and practitioners alike.

== Conclusion

In conclusion, typst represents a promising advancement in the field of scientific writing. By streamlining the writing process and enhancing collaboration, it has the potential to improve the quality and efficiency of research in Digital Health.

#bibliography("references.bib")

```


## References

1. [Writing in typst](https://typst.app/docs/tutorial/writing-in-typst/)
2. [Guide for LaTex Users](https://typst.app/docs/guides/guide-for-latex-users/)
3. [Typst Table Guide](https://typst.app/docs/guides/table-guide/)