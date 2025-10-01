// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Test suite for code block syntax highlighting
 *
 * This test suite verifies that:
 * 1. Standard languages (Python, Bash, Julia) have proper syntax highlighting
 * 2. Custom Typst language has proper syntax highlighting
 * 3. Custom Mermaid raw code has proper syntax highlighting
 * 4. Rendered diagrams (Mermaid, Typst) are not highlighted as code
 */

test.describe('Code Block Syntax Highlighting', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the debug page that contains all test code blocks
    await page.goto('/notes/posts/debug-code-blocks/');

    // Wait for Highlight.js to finish processing
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give extra time for JS to execute
  });

  test('Python code block has syntax highlighting', async ({ page }) => {
    // Find the Python code block
    const pythonBlock = page.locator('pre code.language-python').first();

    // Verify the code block exists
    await expect(pythonBlock).toBeVisible();

    // Verify it has been processed by Highlight.js (has hljs class)
    await expect(pythonBlock).toHaveClass(/hljs/);

    // Verify it contains highlighted elements (span tags with classes)
    const highlightedElements = pythonBlock.locator('span[class*="hljs-"]');
    await expect(highlightedElements).not.toHaveCount(0);

    // Take a screenshot for visual verification
    await pythonBlock.screenshot({ path: 'test-results/python-highlighting.png' });
  });

  test('Bash code block has syntax highlighting', async ({ page }) => {
    const bashBlock = page.locator('pre code.language-bash').first();

    await expect(bashBlock).toBeVisible();
    await expect(bashBlock).toHaveClass(/hljs/);

    const highlightedElements = bashBlock.locator('span[class*="hljs-"]');
    await expect(highlightedElements).not.toHaveCount(0);
  });

  test('Julia code block has syntax highlighting', async ({ page }) => {
    const juliaBlock = page.locator('pre code.language-julia').first();

    await expect(juliaBlock).toBeVisible();
    await expect(juliaBlock).toHaveClass(/hljs/);

    const highlightedElements = juliaBlock.locator('span[class*="hljs-"]');
    await expect(highlightedElements).not.toHaveCount(0);
  });

  test('Typst raw code block has syntax highlighting', async ({ page }) => {
    // Find the default Typst code block (should show raw code)
    const typstBlock = page.locator('pre code.language-typst').first();

    await expect(typstBlock).toBeVisible();

    // Verify it has been processed by Highlight.js
    await expect(typstBlock).toHaveClass(/hljs/);

    // Verify it contains highlighted elements
    const highlightedElements = typstBlock.locator('span[class*="hljs-"]');
    await expect(highlightedElements).not.toHaveCount(0);

    // Verify the content includes Typst syntax
    const content = await typstBlock.textContent();
    expect(content).toContain('#set');

    // Take a screenshot for visual verification
    await typstBlock.screenshot({ path: 'test-results/typst-highlighting.png' });
  });

  test('Mermaid raw code block has syntax highlighting', async ({ page }) => {
    // Find the Mermaid raw code block (with {.raw} attribute)
    const mermaidRawBlock = page.locator('pre code.language-mermaid[data-lang="mermaid"]').first();

    await expect(mermaidRawBlock).toBeVisible();

    // Verify it has been processed by Highlight.js
    await expect(mermaidRawBlock).toHaveClass(/hljs/);

    // Verify it contains highlighted elements
    const highlightedElements = mermaidRawBlock.locator('span[class*="hljs-"]');
    await expect(highlightedElements).not.toHaveCount(0);

    // Verify the content includes Mermaid syntax
    const content = await mermaidRawBlock.textContent();
    expect(content).toMatch(/graph|flowchart/);

    // Take a screenshot for visual verification
    await mermaidRawBlock.screenshot({ path: 'test-results/mermaid-raw-highlighting.png' });
  });

  test('Rendered Mermaid diagram is not highlighted as code', async ({ page }) => {
    // Find rendered Mermaid diagram (without .raw class)
    const renderedMermaid = page.locator('pre.mermaid').first();

    await expect(renderedMermaid).toBeVisible();

    // Verify it does NOT have hljs class (should not be highlighted)
    await expect(renderedMermaid).not.toHaveClass(/hljs/);

    // Verify it contains SVG (rendered diagram)
    const svg = renderedMermaid.locator('svg');
    await expect(svg).toBeVisible();
  });

  test('Unknown language code block appears plain without errors', async ({ page }) => {
    // Find the unknown language block
    const unknownBlock = page.locator('pre code.language-unknown-lang').first();

    await expect(unknownBlock).toBeVisible();

    // It may or may not have hljs class, but should not throw errors
    const content = await unknownBlock.textContent();
    expect(content).toContain('function test()');
  });


  test('Visual comparison: Typst vs Python highlighting quality', async ({ page }) => {
    // Take screenshots of both for side-by-side comparison
    const pythonBlock = page.locator('pre code.language-python').first();
    const typstBlock = page.locator('pre code.language-typst').first();

    await pythonBlock.screenshot({ path: 'test-results/comparison-python.png' });
    await typstBlock.screenshot({ path: 'test-results/comparison-typst.png' });

    // Both should have similar structure
    const pythonHighlights = await pythonBlock.locator('span[class*="hljs-"]').count();
    const typstHighlights = await typstBlock.locator('span[class*="hljs-"]').count();

    // Both should have some highlighting (exact count doesn't matter)
    expect(pythonHighlights).toBeGreaterThan(0);
    expect(typstHighlights).toBeGreaterThan(0);
  });
});

test.describe('Test Rendering Page', () => {

  test('Navigate to test rendering page', async ({ page }) => {
    await page.goto('/notes/posts/test-rendering/');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Typst side-by-side view shows both code and output', async ({ page }) => {
    await page.goto('/notes/posts/test-rendering/');
    await page.waitForLoadState('networkidle');

    // Find the side-by-side container
    const sideBySide = page.locator('.typst-container.side-by-side').first();

    if (await sideBySide.isVisible()) {
      // Verify it has both code and output sections
      const codeSection = sideBySide.locator('.typst-code');
      const outputSection = sideBySide.locator('.typst-output');

      await expect(codeSection).toBeVisible();
      await expect(outputSection).toBeVisible();

      // Code section should have highlighted Typst code
      const codeBlock = codeSection.locator('code.language-typst');
      await expect(codeBlock).toHaveClass(/hljs/);
    }
  });

  test('Typst render-only view shows image output', async ({ page }) => {
    await page.goto('/notes/posts/test-rendering/');
    await page.waitForLoadState('networkidle');

    // Find the render-only container
    const renderOnly = page.locator('.typst-render').first();

    if (await renderOnly.isVisible()) {
      // Should have an output section with image
      const outputSection = renderOnly.locator('.typst-output');
      await expect(outputSection).toBeVisible();

      // Check for image or placeholder
      const hasImage = await outputSection.locator('img').count() > 0;
      const hasPlaceholder = await outputSection.locator('.typst-placeholder').count() > 0;

      expect(hasImage || hasPlaceholder).toBeTruthy();
    }
  });
});