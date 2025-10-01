# Mobile Typst PDF Handling

## Analysis
- The `.render` Typst blocks fall back to `<embed>` when only a PDF exists, which fails on
  iOS/WebKit-based browsers (e.g. Firefox on iPhone) and results in a blank area.
- Current assets already include the compiled PDF (e.g. `typst-2236670690.pdf`), so a download
  fallback can reuse the same path without new renders.
- CSS media queries are sufficient for a coarse “mobile” check; no user-agent sniffing or JS is
  required and we stay within Hugo’s static rendering model.

## Plan
1. Extend `layouts/_default/_markup/render-codeblock-typst.html` so render blocks output two
   wrappers: the existing PDF `<embed>` plus a fallback panel containing a download prompt that
   links to the PDF path.
2. Adjust `static/css/typst-render.css` to hide the `<embed>` on narrow viewports (e.g.
   `max-width: 768px`) and show the fallback panel instead; keep desktop behaviour unchanged.
3. Optionally add an accessible hint (e.g. `aria-label`, visually hidden text) so assistive
   technologies know the panel is a download link.
4. Re-run `bash scripts/render-typst.sh` only if template changes modify hash calculations (not
   expected), then validate on desktop and a WebKit-based mobile browser.

## Potential Issues
- CSS breakpoint approximates “mobile” and may trigger on narrow desktop windows; ensure the
  download prompt still feels reasonable in that context.
- If future Typst renders include both PDF and per-page PNGs, we should confirm the fallback logic
  prefers the richer preview when available.
- Some older browsers may not fully respect the CSS; adding a `<noscript>` block with the download
  link is an extra safeguard if that becomes necessary.

## Other Notes
- No Hugo front matter or site configuration changes required; the behaviour stays confined to the
  Typst code-block partial and shared stylesheet.
- Keep the fallback wording neutral (“PDF preview unavailable on mobile – tap to download”) so it
  applies across devices and avoids promising inline rendering.
