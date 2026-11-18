// `npm audit` with the time-boxed exceptions from osv-scanner.toml.
//
// npm audit has no way to accept a single advisory, so an advisory without a
// fixed release would block every push and deploy. This runs
// `npm audit --json` and fails on every advisory except the ones listed under
// [[IgnoredVulns]] in osv-scanner.toml that have not reached their ignoreUntil
// date. Anything it cannot read or understand is a failure, never a pass, and
// so is an npm that does not exit the way a finished audit does.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Exception {
  id: string;
  // YYYY-MM-DD. As in OSV-Scanner, the exception applies before this date (UTC), not on it.
  ignoreUntil: string | undefined;
  reason: string | undefined;
}

export interface Advisory {
  id: string;
  severity: string;
  title: string;
  url: string;
  packages: string[];
}

export interface Verdict {
  accepted: { advisory: Advisory; exception: Exception }[];
  blocking: { advisory: Advisory; why: string }[];
}

/** What `spawnSync` needs to start a process. */
export interface Launch {
  command: string;
  args: string[];
  shell: boolean;
}

/** How a process ended and what it printed (the part of `spawnSync`'s result the gate reads). */
export interface AuditRun {
  status: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
}

const CONFIG = resolve(import.meta.dirname, '..', 'osv-scanner.toml');

/** Reads the [[IgnoredVulns]] tables of an osv-scanner.toml (the subset that file uses). */
export function parseExceptions(toml: string): Exception[] {
  const exceptions: Exception[] = [];
  let current: Exception | undefined;
  for (const raw of toml.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    if (line.startsWith('[')) {
      current = undefined;
      if (line.replace(/\s*#.*$/, '') === '[[IgnoredVulns]]') {
        current = { id: '', ignoreUntil: undefined, reason: undefined };
        exceptions.push(current);
      }
      continue;
    }
    if (!current) continue;
    const [, key, value] = /^(\w+)\s*=\s*(.+)$/.exec(line) ?? [];
    if (key === 'id') current.id = /^"([^"]+)"/.exec(value ?? '')?.[1] ?? '';
    else if (key === 'ignoreUntil') current.ignoreUntil = /^(\d{4}-\d{2}-\d{2})\b/.exec(value ?? '')?.[1];
    else if (key === 'reason') current.reason = /^"(.*)"\s*(#.*)?$/.exec(value ?? '')?.[1];
    else throw new Error(`osv-scanner.toml: unsupported key in [[IgnoredVulns]]: ${line}`);
  }
  for (const e of exceptions) {
    if (e.id === '') throw new Error('osv-scanner.toml: [[IgnoredVulns]] entry without a readable id');
  }
  return exceptions;
}

/** Collects the distinct advisories from an `npm audit --json` report (auditReportVersion 2). */
export function parseAdvisories(report: unknown): Advisory[] {
  const { auditReportVersion, vulnerabilities } = (report ?? {}) as {
    auditReportVersion?: unknown;
    vulnerabilities?: Record<string, { via?: unknown[] }>;
  };
  if (auditReportVersion !== 2 || typeof vulnerabilities !== 'object' || vulnerabilities === null) {
    throw new Error('unexpected `npm audit --json` output (wanted auditReportVersion 2)');
  }
  const advisories = new Map<string, Advisory>();
  for (const [pkg, { via = [] }] of Object.entries(vulnerabilities)) {
    if (via.length === 0) throw new Error(`npm audit: ${pkg} is reported vulnerable without a cause`);
    for (const v of via) {
      // A string names another vulnerable package in the report; the advisory
      // itself is an object on the package it was filed against.
      if (typeof v === 'string') {
        if (!(v in vulnerabilities)) throw new Error(`npm audit: ${pkg} is vulnerable via ${v}, which is not in the report`);
        continue;
      }
      if (typeof v !== 'object' || v === null) throw new Error(`npm audit: unreadable cause for ${pkg}`);
      const cause = v as Record<string, unknown>;
      const url = String(cause['url'] ?? '');
      const id = url.split('/').pop() || `npm-advisory-${String(cause['source'])}`;
      const known = advisories.get(id);
      if (known) {
        if (!known.packages.includes(pkg)) known.packages.push(pkg);
      } else {
        advisories.set(id, { id, severity: String(cause['severity']), title: String(cause['title']), url, packages: [pkg] });
      }
    }
  }
  if (advisories.size === 0 && Object.keys(vulnerabilities).length > 0) {
    throw new Error('npm audit: vulnerable packages reported without any advisory');
  }
  return [...advisories.values()];
}

/** Splits advisories into those covered by a current exception and those that must fail the audit. */
export function evaluate(advisories: Advisory[], exceptions: Exception[], today: string): Verdict {
  const verdict: Verdict = { accepted: [], blocking: [] };
  for (const advisory of advisories) {
    const exception = exceptions.find((e) => e.id.toLowerCase() === advisory.id.toLowerCase());
    if (!exception) verdict.blocking.push({ advisory, why: 'not accepted in osv-scanner.toml' });
    else if (!exception.ignoreUntil) verdict.blocking.push({ advisory, why: 'its exception has no ignoreUntil date' });
    else if (today >= exception.ignoreUntil)
      verdict.blocking.push({ advisory, why: `its exception expired on ${exception.ignoreUntil}` });
    else verdict.accepted.push({ advisory, exception });
  }
  return verdict;
}

/**
 * How to start `npm audit --json`. The `npm` on PATH is a script (npm.cmd on
 * Windows), which only a shell can start. `npm run` exports the path of the
 * npm CLI that is running this script, so that file is run with this Node
 * instead: no shell on any platform, and the same npm as the caller.
 */
export function auditLaunch(env: NodeJS.ProcessEnv, platform: NodeJS.Platform): Launch {
  const cli = env['npm_execpath'];
  // Other package managers put their own CLI in npm_execpath, hence the name check.
  if (cli !== undefined && /(^|[\\/])npm-cli\.js$/.test(cli)) {
    return { command: process.execPath, args: [cli, 'audit', '--json'], shell: false };
  }
  // Run directly (`node scripts/npm-audit.ts`): npm comes from PATH.
  if (platform === 'win32') return { command: 'npm audit --json', args: [], shell: true };
  return { command: 'npm', args: ['audit', '--json'], shell: false };
}

/**
 * Returns the advisories a finished `npm audit --json` reported, or throws if
 * npm did not finish the way an audit does: exit 0 with nothing found, or exit
 * 1 with the advisories (or its own error) in the report. A report from an npm
 * that ended any other way is not a verdict, however clean it looks.
 */
export function readAdvisories({ status, signal, stdout, stderr }: AuditRun): Advisory[] {
  if (signal !== null) throw new Error(`npm audit was killed by ${signal}`);
  if (status !== 0 && status !== 1) {
    throw new Error(`npm audit exited with status ${status}, not 0 or 1:\n${stderr || stdout}`);
  }
  let report: unknown;
  try {
    report = JSON.parse(stdout);
  } catch {
    throw new Error(`npm audit did not return JSON (exit ${status}):\n${stderr || stdout}`);
  }
  if (typeof report === 'object' && report !== null && 'error' in report) {
    throw new Error(`npm audit failed: ${JSON.stringify(report.error)}`);
  }
  const advisories = parseAdvisories(report);
  // The exit 1 has to be explained by the report before exceptions can overrule it.
  if (status === 1 && advisories.length === 0) {
    throw new Error(`npm audit exited with status 1 but its report lists no advisory:\n${stderr || stdout}`);
  }
  return advisories;
}

function main(): number {
  const { command, args, shell } = auditLaunch(process.env, process.platform);
  const audit = spawnSync(command, args, { shell, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (audit.error) throw audit.error;

  const exceptions = existsSync(CONFIG) ? parseExceptions(readFileSync(CONFIG, 'utf8')) : [];
  const today = new Date().toISOString().slice(0, 10);
  const { accepted, blocking } = evaluate(readAdvisories(audit), exceptions, today);

  const describe = (a: Advisory): string => `${a.id} (${a.severity}) ${a.packages.join(', ')}: ${a.title}\n    ${a.url}`;
  for (const { advisory, exception } of accepted) {
    console.log(`accepted until ${exception.ignoreUntil}: ${describe(advisory)}\n    reason: ${exception.reason}`);
  }
  for (const { advisory, why } of blocking) {
    console.error(`VULNERABLE, ${why}: ${describe(advisory)}`);
  }
  if (blocking.length > 0) {
    console.error(`\nnpm audit: ${blocking.length} advisory(ies) to fix. Run \`npm audit\` for the dependency paths.`);
    return 1;
  }
  console.log(`npm audit: no unaccepted advisories (${accepted.length} accepted in osv-scanner.toml).`);
  return 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`npm audit: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
