# rudolfjs.github.io

Rudolf J profile hosted using GitHub Pages at <https://rudolfjs.id.au>.

## Maintenance mode

The site is currently a single "down for maintenance" holding page built with
[Astro](https://astro.build) and TypeScript, while the full site is rebuilt on
Astro. The page is rendered as both `/` and `/404.html`, so every old URL
lands on it.

The previous Hugo site (content, theme, Typst renders, presentations) was
removed from `main`. It is preserved at the `v3.5.0` tag:

```bash
git checkout v3.5.0 -- content/   # e.g. to bring the Markdown content back
```

## Layout

| Path | Purpose |
| --- | --- |
| `src/components/HoldingPage.astro` | The holding page (markup + inlined CSS) |
| `src/data/profile.ts` | Profile links shown on the page |
| `src/pages/index.astro`, `src/pages/404.astro` | Routes; both render the holding page |
| `public/` | Static files copied as-is (favicon) |
| `tests/site.test.ts` | Contract tests for `dist/` and the workflows (`node:test`) |
| `tests/npm-audit.test.ts` | Contract tests for the `npm audit` gate and accepted advisories |
| `osv-scanner.toml` | Advisories accepted for a limited time, with reasons |
| `.husky/pre-push` | Local CVE checks + verify before every push |
| `.github/workflows/site.yml` | CI/CD: CVE scan, build, test, deploy to Pages |
| `.github/workflows/osv-scanner.yml` | OSV-Scanner: code scanning alerts and PR checks |

## Development

Requires Node.js 22.18+ (the tests use Node's built-in TypeScript type
stripping). CI uses the version in `.nvmrc`.

```bash
npm install        # also installs the Husky git hooks
npm run dev        # http://localhost:4321
npm run verify     # astro check + build + tests
npm run preview    # serve dist/
```

## Security checks

`npm run security` runs:

1. `npm audit` through `scripts/npm-audit.ts` (GitHub Advisory Database, the
   same data Dependabot uses); any advisory of any severity fails it
2. `npm audit signatures` (registry signatures and provenance)
3. `osv-scanner` against `package-lock.json`, if it is installed locally
   ([install](https://google.github.io/osv-scanner/installation/)) or podman
   or docker can run its container image; set `OSV_REQUIRED=1` to make it
   mandatory

The Husky **pre-push** hook runs `npm run security` and then `npm run verify`,
so a push with a known CVE in the lockfile, a type error or a failing test is
refused. Bypass in an emergency with `git push --no-verify`.

### Accepted advisories

An advisory with no fixed release cannot be upgraded away, and would otherwise
block every push and deploy. Such an advisory is accepted for a limited time in
[`osv-scanner.toml`](osv-scanner.toml), as an `[[IgnoredVulns]]` entry with an
`id`, an `ignoreUntil` date and a `reason`. OSV-Scanner (locally and in both
workflows) and `scripts/npm-audit.ts` read the same file, so there is one list.
An entry stops applying on its `ignoreUntil` date (UTC) and the checks fail
again; upgrade then, or renew the date deliberately. Remove the entry as soon
as a fixed release is in the lockfile.

## CI/CD

`.github/workflows/site.yml`:

| Trigger | CVE scan | Check, build, test | Deploy |
| --- | :---: | :---: | :---: |
| Pull request | ✓ | ✓ | |
| Push to `main` / manual run on `main` | ✓ | ✓ | ✓ |
| Weekly (Mon 03:17 UTC) | ✓ | ✓ | |

The deploy job needs both the CVE scan and the build to pass.

`.github/workflows/osv-scanner.yml` runs Google's
[OSV-Scanner](https://google.github.io/osv-scanner/) reusable workflows
against [osv.dev](https://osv.dev) and uploads the results to
**Security > Code scanning**:

| Trigger | Scan | Fails on |
| --- | --- | --- |
| Pull request to `main` | PR and base branch, compared | Vulnerabilities the PR introduces |
| Push to `main`, daily (04:41 UTC), manual run | Full | Any known vulnerability |

All actions and reusable workflows are pinned to full commit SHAs, and jobs
get only the permissions they need. Dependabot (`.github/dependabot.yml`)
proposes grouped weekly updates for npm and GitHub Actions after a 7-day
cooldown; security updates are not delayed.

## Changelog

Changes are recorded with [Changie](https://changie.dev):

```bash
changie new        # add a fragment under .changes/unreleased/
changie batch auto && changie merge
```
