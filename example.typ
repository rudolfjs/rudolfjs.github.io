#set page(
  paper: "us-letter",
  margin: (
    top: 0.85in,
    left: 2.75in,
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

A very convenient way to manage your typst environment is to use the `typstenv` tool. This tool allows you to easily switch between different versions of typst, manage dependencies, and create isolated environments for your projects.

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
