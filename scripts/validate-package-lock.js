#!/usr/bin/env node

/**
 * This script validates that package.json and package-lock.json are in sync.
 * It checks that all dependencies in package.json match the versions in package-lock.json.
 *
 * Run this script before building the application to detect potential issues.
 */

const fs = require('fs');
const path = require('path');

// Define the root directory
const rootDir = path.resolve(__dirname, '..');

// Load package.json and package-lock.json
const packageJsonPath = path.join(rootDir, 'package.json');
const packageLockPath = path.join(rootDir, 'package-lock.json');

console.log('Validating package.json and package-lock.json...');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));

  // Check if package-lock.json version matches package.json version
  if (packageJson.version !== packageLock.version) {
    console.error(`❌ Version mismatch: package.json (${packageJson.version}) vs package-lock.json (${packageLock.version})`);
    process.exit(1);
  }

  // Combine all dependencies
  const packageDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  // Check if all dependencies in package.json are in package-lock.json with matching versions
  const errors = [];
  const lockDeps = packageLock.packages[''].dependencies || {};
  const lockDevDeps = packageLock.packages[''].devDependencies || {};
  const allLockDeps = { ...lockDeps, ...lockDevDeps };

  for (const [name, version] of Object.entries(packageDeps)) {
    // Skip if the dependency is a local file or URL
    if (version.startsWith('file:') || version.startsWith('http')) {
      continue;
    }

    // Check if the dependency exists in package-lock.json
    const lockPackage = packageLock.packages[`node_modules/${name}`];
    if (!lockPackage) {
      errors.push(`Dependency ${name} is missing in package-lock.json`);
      continue;
    }

    // Check if the version satisfies the requirement
    // For caret (^) versions, we only need to check the major version
    const actualVersion = lockPackage.version;

    if (version.startsWith('^')) {
      // For caret versions, only the major version needs to match
      const requiredMajor = parseInt(version.replace('^', '').split('.')[0]);
      const actualMajor = parseInt(actualVersion.split('.')[0]);

      if (requiredMajor !== actualMajor) {
        errors.push(`Major version mismatch for ${name}: package.json requires ${version} (major: ${requiredMajor}), but package-lock.json has ${actualVersion} (major: ${actualMajor})`);
      }
    } else if (version.startsWith('~')) {
      // For tilde versions, major and minor versions need to match
      const requiredParts = version.replace('~', '').split('.');
      const actualParts = actualVersion.split('.');

      if (parseInt(requiredParts[0]) !== parseInt(actualParts[0]) ||
          parseInt(requiredParts[1]) !== parseInt(actualParts[1])) {
        errors.push(`Major/minor version mismatch for ${name}: package.json requires ${version}, but package-lock.json has ${actualVersion}`);
      }
    } else {
      // For exact versions
      if (version !== actualVersion) {
        errors.push(`Exact version mismatch for ${name}: package.json requires ${version}, but package-lock.json has ${actualVersion}`);
      }
    }
  }

  // Report errors
  if (errors.length > 0) {
    console.error('❌ Package validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\nRun the following command to fix these issues:');
    console.error('   npm install --package-lock-only');
    process.exit(1);
  }

  console.log('✅ package.json and package-lock.json are in sync!');
  process.exit(0);
} catch (error) {
  console.error(`❌ Error validating packages: ${error.message}`);
  process.exit(1);
}
