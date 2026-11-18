// Contract for the npm audit gate (scripts/npm-audit.ts) and the advisory
// exceptions it shares with OSV-Scanner (osv-scanner.toml).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { auditLaunch, evaluate, parseAdvisories, parseExceptions, readAdvisories } from '../scripts/npm-audit.ts';

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
const CLEAN = { auditReportVersion: 2, vulnerabilities: {} };
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

test('a report is only believed from an npm that finished as an audit does', () => {
  const run = (status: number | null, stdout: unknown, signal: string | null = null) => ({
    status,
    signal,
    stdout: typeof stdout === 'string' ? stdout : JSON.stringify(stdout),
    stderr: '',
  });

  assert.deepEqual(readAdvisories(run(0, CLEAN)), []);
  assert.deepEqual(readAdvisories(run(1, report(ACCEPTED))).map((a) => a.id), ['GHSA-aaaa-bbbb-cccc']);
  // A clean report from an npm that failed or was killed is not a clean audit.
  assert.throws(() => readAdvisories(run(2, CLEAN)), /status 2, not 0 or 1/);
  assert.throws(() => readAdvisories(run(null, CLEAN, 'SIGTERM')), /killed by SIGTERM/);
  assert.throws(() => readAdvisories(run(1, CLEAN)), /status 1 but its report lists no advisory/);
  assert.throws(() => readAdvisories(run(1, { error: { code: 'ENOLOCK' } })), /npm audit failed: .*ENOLOCK/);
  assert.throws(() => readAdvisories(run(0, 'npm warn')), /did not return JSON/);
});

test('npm is started without a shell whenever `npm run` says where its CLI is', () => {
  const audit = ['audit', '--json'];
  const windows = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';
  const posix = '/usr/lib/node_modules/npm/bin/npm-cli.js';
  assert.deepEqual(auditLaunch({ npm_execpath: windows }, 'win32'), { command: process.execPath, args: [windows, ...audit], shell: false });
  assert.deepEqual(auditLaunch({ npm_execpath: posix }, 'linux'), { command: process.execPath, args: [posix, ...audit], shell: false });

  // Run directly, npm comes from PATH. On Windows that is npm.cmd, which only a shell can start.
  assert.deepEqual(auditLaunch({}, 'linux'), { command: 'npm', args: audit, shell: false });
  assert.deepEqual(auditLaunch({}, 'win32'), { command: 'npm audit --json', args: [], shell: true });
  // Another package manager's CLI is not npm's.
  assert.deepEqual(auditLaunch({ npm_execpath: '/usr/lib/node_modules/pnpm/bin/pnpm.cjs' }, 'linux'), { command: 'npm', args: audit, shell: false });
});

test('the gate runs the npm it is given and fails when that npm fails', () => {
  // Stand-ins for npm's CLI: both print a clean report, one of them then fails.
  const dir = mkdtempSync(join(tmpdir(), 'npm-audit-'));
  try {
    const gate = (name: string, exitCode: number) => {
      const cli = join(dir, name, 'npm-cli.js');
      mkdirSync(join(dir, name));
      writeFileSync(cli, `process.stdout.write(${JSON.stringify(JSON.stringify(CLEAN))});\nprocess.exitCode = ${exitCode};\n`);
      return spawnSync(process.execPath, [resolve(root, 'scripts/npm-audit.ts')], {
        cwd: root,
        env: { ...process.env, npm_execpath: cli },
        encoding: 'utf8',
      });
    };

    const passed = gate('passes', 0);
    assert.equal(passed.status, 0, passed.stderr);
    assert.match(passed.stdout, /no unaccepted advisories/);

    const failed = gate('fails', 2);
    assert.equal(failed.status, 2, failed.stdout);
    assert.match(failed.stderr, /status 2, not 0 or 1/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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
