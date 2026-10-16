// Contract for the built holding page (dist/) and the workflows that ship it.
// Run `npm run build` first; `npm run verify` does both.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { profile } from '../src/data/profile.ts';

const root = resolve(import.meta.dirname, '..');
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8');

const PAGES = ['dist/index.html', 'dist/404.html'];

test('build emits the holding page for / and for unknown paths (404.html)', () => {
  for (const page of PAGES) {
    assert.ok(existsSync(resolve(root, page)), `${page} is missing; run npm run build`);
  }
  assert.ok(existsSync(resolve(root, 'dist/favicon.ico')), 'favicon.ico is missing');
});

for (const page of PAGES) {
  test(`${page} identifies the site and is not indexed`, () => {
    const html = read(page);
    assert.match(html, /<title>[^<]*Rudolf J[^<]*<\/title>/);
    assert.match(html, /<h1[^>]*>/);
    assert.match(html, /<html[^>]*\slang="en"/);
    assert.match(html, /<meta\s+name="robots"\s+content="noindex[^"]*"/);
  });

  test(`${page} is self-contained (no scripts, external stylesheets or remote assets)`, () => {
    const html = read(page);
    assert.doesNotMatch(html, /<script/i, '<script> found');
    assert.doesNotMatch(html, /<link[^>]*rel="stylesheet"/i, 'external stylesheet found');
    assert.doesNotMatch(html, /@import/i, 'CSS @import found');
    assert.doesNotMatch(html, /url\(\s*['"]?https?:/i, 'remote url() asset found');
  });

  test(`${page} keeps the profile links visitors came for`, () => {
    const html = read(page);
    for (const { href } of profile.links) {
      assert.ok(html.includes(`href="${href.replaceAll('&', '&amp;')}"`), `missing link to ${href}`);
    }
  });
}

test('no Hugo leftovers', () => {
  for (const p of ['hugo.toml', 'themes', 'layouts', 'content', 'archetypes']) {
    assert.ok(!existsSync(resolve(root, p)), `${p} should be gone`);
  }
});

const workflows = readdirSync(resolve(root, '.github/workflows'))
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => [f, read(`.github/workflows/${f}`)] as const);

test('every workflow pins actions to a full commit SHA', () => {
  for (const [file, yml] of workflows) {
    for (const [, ref] of yml.matchAll(/^\s*(?:-\s*)?uses:\s*(\S+)/gm)) {
      assert.match(ref ?? '', /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/, `${file}: ${ref} is not SHA-pinned`);
    }
  }
});

test('every workflow declares top-level permissions', () => {
  for (const [file, yml] of workflows) {
    assert.match(yml, /^permissions:/m, `${file} has no top-level permissions block`);
  }
});

test('site workflow deploys dist/ to Pages from main only', () => {
  const yml = read('.github/workflows/site.yml');
  assert.match(yml, /path:\s*\.?\/?dist\b/);
  assert.match(yml, /uses:\s*actions\/deploy-pages@/);
  assert.match(yml, /group:\s*"?pages"?/);
  assert.match(yml, /if:.*github\.ref == 'refs\/heads\/main'/);
  assert.match(yml, /if:.*github\.event_name != 'pull_request'/);
});
