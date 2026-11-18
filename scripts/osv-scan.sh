#!/bin/sh
# Scan package-lock.json against the OSV database (covers GHSA, the source
# Dependabot uses, plus other advisory feeds).
#
# Uses a local osv-scanner if installed, otherwise the same container image
# the CI action runs (via podman or docker). With neither, it skips: the
# pre-push hook still has `npm audit`. Set OSV_REQUIRED=1 to make that an error.
set -eu

# Keep in step with google/osv-scanner-action in .github/workflows/site.yml
# and .github/workflows/osv-scanner.yml
OSV_IMAGE="ghcr.io/google/osv-scanner-action:v2.7.0"

if command -v osv-scanner >/dev/null 2>&1; then
  exec osv-scanner scan source --lockfile=package-lock.json
fi

for engine in podman docker; do
  if command -v "$engine" >/dev/null 2>&1; then
    # osv-scanner reads osv-scanner.toml (accepted advisories) from the
    # lockfile's directory, so it has to be mounted next to the lockfile.
    set -- -v "$PWD/package-lock.json:/src/package-lock.json:ro,Z"
    if [ -f osv-scanner.toml ]; then
      set -- "$@" -v "$PWD/osv-scanner.toml:/src/osv-scanner.toml:ro,Z"
    fi
    exec "$engine" run --rm "$@" "$OSV_IMAGE" --lockfile=/src/package-lock.json
  fi
done

if [ "${OSV_REQUIRED:-0}" = "1" ]; then
  echo "osv-scanner: not installed and no podman/docker (OSV_REQUIRED=1)" >&2
  exit 1
fi
echo "osv-scanner: not installed and no podman/docker, skipping (install: https://google.github.io/osv-scanner/installation/)" >&2
