#!/usr/bin/env node
/**
 * Tag-aware version bump.
 *
 * The old `bump-package-versions --strategy=highest` only looked at the
 * package.json files, so whenever those drifted behind the git tags it happily
 * produced an already-released version. electron-builder publishes to the
 * release named after package.json, so a wrong version silently ships assets to
 * the wrong release (see the version-check job in .github/workflows/release.yml).
 *
 * This script takes the highest of *both* the package.json versions and the
 * existing `v*` git tags as its base, so the result is always unreleased.
 *
 * Usage: node scripts/bump-version.mjs [--part=major|minor|patch] [--set=X.Y.Z]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Anchored to the repo root so the script behaves identically whether it is run
// from the root or from api/ and client/, which both delegate to it.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const at = (file) => join(ROOT, file);

const PACKAGES = ['package.json', 'api/package.json', 'client/package.json'].map(at);
const LOCKFILES = ['package-lock.json', 'api/package-lock.json', 'client/package-lock.json'].map(at);

const args = process.argv.slice(2);
const argOf = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

const part = argOf('part') ?? 'patch';
if (!['major', 'minor', 'patch'].includes(part)) {
  throw new Error(`--part must be major, minor or patch (got "${part}")`);
}

const parse = (version) => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  return match ? match.slice(1, 4).map(Number) : null;
};
const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const format = ([major, minor, patch]) => `${major}.${minor}.${patch}`;

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

const tagVersions = execFileSync('git', ['tag', '--list', 'v*'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .map(parse)
  .filter(Boolean);
const packageVersions = PACKAGES.map((file) => parse(readJson(file).version)).filter(Boolean);

const candidates = [...tagVersions, ...packageVersions];
if (!candidates.length) {
  throw new Error('Could not determine a base version from git tags or package.json files.');
}
const base = candidates.sort(compare).at(-1);

let next;
const explicit = argOf('set');
if (explicit) {
  next = parse(explicit);
  if (!next) {
    throw new Error(`--set must be a plain X.Y.Z version (got "${explicit}")`);
  }
  if (compare(next, base) <= 0) {
    throw new Error(
      `--set=${explicit} is not higher than the highest existing version ${format(base)} (tag or package.json).`
    );
  }
} else if (part === 'major') {
  next = [base[0] + 1, 0, 0];
} else if (part === 'minor') {
  next = [base[0], base[1] + 1, 0];
} else {
  next = [base[0], base[1], base[2] + 1];
}

const version = format(next);

for (const file of PACKAGES) {
  const json = readJson(file);
  json.version = version;
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}

for (const file of LOCKFILES) {
  const json = readJson(file);
  json.version = version;
  if (json.packages?.['']) {
    json.packages[''].version = version;
  }
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}

console.log(`Bumped from ${format(base)} to ${version} (highest existing version: ${format(base)}).`);
console.log(`Next: commit, then \`git tag v${version} && git push origin HEAD v${version}\`.`);
