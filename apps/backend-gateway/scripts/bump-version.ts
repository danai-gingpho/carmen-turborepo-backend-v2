/**
 * Auto-generate version number for backend-gateway
 * Format: MAJOR.MINOR.PATCH-build.YYYYMMDD.SHORT_HASH
 *
 * Usage:
 *   bun run version:bump          # bump patch: 1.0.1 -> 1.0.2
 *   bun run version:bump minor    # bump minor: 1.0.2 -> 1.1.0
 *   bun run version:bump major    # bump major: 1.1.0 -> 2.0.0
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const gatewayDir = resolve(__dirname, '..');
const versionFilePath = resolve(gatewayDir, 'src/version.ts');
const packageJsonPath = resolve(gatewayDir, 'package.json');

// Get current version from version.ts
const versionFileContent = readFileSync(versionFilePath, 'utf-8');
const currentVersionMatch = versionFileContent.match(/APP_VERSION\s*=\s*'([^']+)'/);
if (!currentVersionMatch) {
  console.error('Could not read current version from version.ts');
  process.exit(1);
}

const currentVersion = currentVersionMatch[1];
// Extract semver part (strip build metadata if present)
const semverPart = currentVersion.split('-')[0];
const [major, minor, patch] = semverPart.split('.').map(Number);

// Determine bump type from CLI args
const bumpType = process.argv[2] || 'patch';

let newMajor = major;
let newMinor = minor;
let newPatch = patch;

switch (bumpType) {
  case 'major':
    newMajor++;
    newMinor = 0;
    newPatch = 0;
    break;
  case 'minor':
    newMinor++;
    newPatch = 0;
    break;
  case 'patch':
    newPatch++;
    break;
  default:
    console.error(`Unknown bump type: ${bumpType}. Use: major, minor, or patch`);
    process.exit(1);
}

// Generate build metadata
const now = new Date();
const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

let shortHash = 'unknown';
try {
  shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
} catch {
  // not in a git repo or git not available
}

const semver = `${newMajor}.${newMinor}.${newPatch}`;
const fullVersion = `${semver}-build.${dateStr}.${shortHash}`;

// Update version.ts
const newVersionFileContent = `export const APP_VERSION = '${fullVersion}';\n`;
writeFileSync(versionFilePath, newVersionFileContent);

// Update package.json
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
packageJson.version = semver;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`Version bumped: ${currentVersion} -> ${fullVersion}`);
console.log(`  package.json: ${semver}`);
console.log(`  version.ts:   ${fullVersion}`);
