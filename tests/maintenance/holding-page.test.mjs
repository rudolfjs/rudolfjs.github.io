// Contract for the "down for maintenance" holding page and the workflow that
// deploys it. Runs with plain Node: `npm run test:maintenance`.
//
// Deliberately kept out of the Playwright suite: that harness boots the Hugo
// dev server, which is exactly what the holding page replaces.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

const PAGE = 'maintenance/index.html';
const WORKFLOW = '.github/workflows/maintenance-pages.yml';
const HUGO_WORKFLOWS = ['.github/workflows/hugo.yml', '.github/workflows/content-pages.yml'];

test('holding page exists and identifies the site', () => {
  assert.ok(existsSync(resolve(root, PAGE)), `${PAGE} is missing`);
  const html = read(PAGE);
  assert.match(html, /<title>[^<]*Rudolf J[^<]*<\/title>/);
  assert.match(html, /<h1[^>]*>/);
  assert.match(html, /<html[^>]*\slang="en"/);
});

test('holding page tells search engines not to index it', () => {
  const html = read(PAGE);
  assert.match(html, /<meta\s+name="robots"\s+content="noindex[^"]*"/);
});

test('holding page is self-contained (no CDN scripts, stylesheets or fonts)', () => {
  const html = read(PAGE);
  assert.doesNotMatch(html, /<script[^>]*\ssrc=/i, 'external <script src> found');
  assert.doesNotMatch(html, /<link[^>]*rel="stylesheet"/i, 'external stylesheet found');
  assert.doesNotMatch(html, /@import\s+url\(/i, 'CSS @import found');
  assert.doesNotMatch(html, /url\(\s*['"]?https?:/i, 'remote url() asset found');
});

test('holding page keeps the profile links visitors came for', () => {
  const html = read(PAGE);
  for (const href of [
    'https://scholar.google.com/citations?user=ExTefW8AAAAJ',
    'https://orcid.org/0000-0001-5129-5601',
    'https://github.com/rudolfjs',
    'https://www.linkedin.com/in/rudolfj/',
    'https://bsky.app/profile/rudolfj.bsky.social',
    'mailto:r.schnetler@uq.edu.au',
  ]) {
    assert.ok(html.includes(`href="${href}`), `missing link to ${href}`);
  }
});

test('maintenance workflow deploys the maintenance/ folder to Pages', () => {
  assert.ok(existsSync(resolve(root, WORKFLOW)), `${WORKFLOW} is missing`);
  const yml = read(WORKFLOW);
  assert.match(yml, /^\s+workflow_dispatch:/m, 'must be runnable by hand');
  assert.match(yml, /uses:\s*actions\/configure-pages@v\d+/);
  assert.match(yml, /uses:\s*actions\/upload-pages-artifact@v\d+/);
  assert.match(yml, /path:\s*\.?\/?maintenance\b/);
  assert.match(yml, /uses:\s*actions\/deploy-pages@v\d+/);
  assert.match(yml, /group:\s*"?pages"?/, 'must share the "pages" concurrency group with the site workflows');
});

test('maintenance workflow serves the holding page for unknown paths too (404.html)', () => {
  const yml = read(WORKFLOW);
  assert.match(yml, /cp\s+maintenance\/index\.html\s+maintenance\/404\.html/);
});

test('Hugo deploy workflows no longer trigger automatically', () => {
  for (const wf of HUGO_WORKFLOWS) {
    const yml = read(wf);
    assert.doesNotMatch(yml, /^\s+push:/m, `${wf} still deploys on push`);
    assert.doesNotMatch(yml, /^\s+release:/m, `${wf} still deploys on release`);
    assert.match(yml, /^\s+workflow_dispatch:/m, `${wf} should keep a manual trigger`);
  }
});
