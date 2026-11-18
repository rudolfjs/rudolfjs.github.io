// Contract for the npm audit gate (scripts/npm-audit.ts) and the advisory
// exceptions it shares with OSV-Scanner (osv-scanner.toml).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { evaluate, parseAdvisories, parseExceptions } from '../scripts/npm-audit.ts';

const root = resolve(import.meta.dirname, '..');

const TOML = `
# comment
[[IgnoredVulns]]
id = "GHSA-aaaa-bbbb-cccc" # CVE-0000-0001
ignoreUntil = 2026-12-18
reason = "no fixed release yet"

[[PackageOverrides]]
name = "left-pad"
ignore = true

[[IgnoredVulns]]
id = "GHSA-dddd-eeee-ffff"
`;

// The shape `npm audit --json` returns: the advisory sits on the package it was
// filed against, and dependents point at that package by name.
const report = (...urls: string[]) => ({
  auditReportVersion: 2,
  vulnerabilities: {
    picomatch: {
      via: urls.map((url, source) => ({ source, url, severity: 'high', title: 'ReDoS' })),
    },
    anymatch: { via: ['picomatch'] },
  },
});
const ACCEPTED = 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc';
const OTHER = 'https://github.com/advisories/GHSA-zzzz-zzzz-zzzz';

test('exceptions are read from the [[IgnoredVulns]] tables only', () => {
  assert.deepEqual(parseExceptions(TOML), [
    { id: 'GHSA-aaaa-bbbb-cccc', ignoreUntil: '2026-12-18', reason: 'no fixed release yet' },
    { id: 'GHSA-dddd-eeee-ffff', ignoreUntil: undefined, reason: undefined },
  ]);
  assert.throws(() => parseExceptions('[[IgnoredVulns]]\nreason = "no id"'), /without a readable id/);
  assert.throws(() => parseExceptions('[[IgnoredVulns]]\nid = "X"\nignoreForever = true'), /unsupported key/);
});

test('an accepted advisory passes only before its expiry date', () => {
  const exceptions = parseExceptions(TOML);
  const advisories = parseAdvisories(report(ACCEPTED));
  assert.deepEqual(advisories.map((a) => [a.id, a.packages]), [['GHSA-aaaa-bbbb-cccc', ['picomatch']]]);

  assert.equal(evaluate(advisories, exceptions, '2026-12-17').blocking.length, 0);
  // Same boundary as OSV-Scanner: the exception no longer applies on the date itself.
  assert.match(evaluate(advisories, exceptions, '2026-12-18').blocking[0]?.why ?? '', /expired/);
  assert.match(evaluate(advisories, exceptions, '2027-01-01').blocking[0]?.why ?? '', /expired/);
});

test('an advisory that is not accepted, or accepted without an expiry, fails the audit', () => {
  const exceptions = parseExceptions(TOML);

  const mixed = evaluate(parseAdvisories(report(ACCEPTED, OTHER)), exceptions, '2026-11-18');
  assert.deepEqual(mixed.accepted.map((a) => a.advisory.id), ['GHSA-aaaa-bbbb-cccc']);
  assert.deepEqual(mixed.blocking.map((b) => b.advisory.id), ['GHSA-zzzz-zzzz-zzzz']);

  const noExpiry = evaluate(parseAdvisories(report('https://github.com/advisories/GHSA-dddd-eeee-ffff')), exceptions, '2026-11-18');
  assert.match(noExpiry.blocking[0]?.why ?? '', /no ignoreUntil/);
});

test('an audit report that cannot be understood is an error, not a pass', () => {
  assert.deepEqual(parseAdvisories({ auditReportVersion: 2, vulnerabilities: {} }), []);
  assert.throws(() => parseAdvisories({ error: { code: 'ENOTFOUND' } }), /unexpected/);
  assert.throws(() => parseAdvisories({ auditReportVersion: 2, vulnerabilities: { a: { via: ['missing'] } } }), /not in the report/);
  assert.throws(() => parseAdvisories({ auditReportVersion: 2, vulnerabilities: { a: { via: ['a'] } } }), /without any advisory/);
});

test('every exception in osv-scanner.toml is time-boxed and explained', () => {
  const config = resolve(root, 'osv-scanner.toml');
  const exceptions = existsSync(config) ? parseExceptions(readFileSync(config, 'utf8')) : [];
  for (const { id, ignoreUntil, reason } of exceptions) {
    assert.match(ignoreUntil ?? '', /^\d{4}-\d{2}-\d{2}$/, `${id} has no ignoreUntil date`);
    assert.ok((reason ?? '').length >= 20, `${id} has no reason`);
  }
});

test('npm audit runs through the exception-aware gate', () => {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
  assert.equal(pkg.scripts['audit:npm'], 'node scripts/npm-audit.ts');
});
