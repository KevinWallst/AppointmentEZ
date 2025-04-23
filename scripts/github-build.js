#!/usr/bin/env node

/**
 * This script is a modified version of the build script for GitHub Actions.
 * It skips the version increment step to prevent double version increments.
 */

const { execSync } = require('child_process');

// Run the build without incrementing the version
try {
  console.log('Building the project without version increment...');

  // Run the prebuild script (without version increment)
  execSync('node scripts/validate-build-config.js && node scripts/validate-package-lock.js', {
    stdio: 'inherit'
  });

  // Run the Next.js build using npx to ensure the command is found
  execSync('npx next build', {
    stdio: 'inherit'
  });

  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
