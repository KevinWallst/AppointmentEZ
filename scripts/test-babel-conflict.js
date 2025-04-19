#!/usr/bin/env node

/**
 * This script tests for the conflict between Next.js font loader and Babel configuration.
 * It creates a temporary Babel configuration file and then runs the build to see if it fails.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the root directory
const rootDir = path.resolve(__dirname, '..');

// Backup existing Babel config if it exists
function backupExistingConfig() {
  const babelConfigFile = path.join(rootDir, 'babel.config.js');
  const backupFile = path.join(rootDir, 'babel.config.js.bak');
  
  if (fs.existsSync(babelConfigFile)) {
    console.log('Backing up existing babel.config.js...');
    fs.copyFileSync(babelConfigFile, backupFile);
    return true;
  }
  
  return false;
}

// Create a temporary Babel config file
function createTemporaryBabelConfig() {
  const babelConfigFile = path.join(rootDir, 'babel.config.js');
  
  console.log('Creating temporary babel.config.js...');
  
  const babelConfig = `
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
};
`;
  
  fs.writeFileSync(babelConfigFile, babelConfig);
}

// Restore or remove the temporary Babel config
function cleanupBabelConfig(hadExistingConfig) {
  const babelConfigFile = path.join(rootDir, 'babel.config.js');
  const backupFile = path.join(rootDir, 'babel.config.js.bak');
  
  if (hadExistingConfig) {
    console.log('Restoring original babel.config.js...');
    fs.copyFileSync(backupFile, babelConfigFile);
    fs.unlinkSync(backupFile);
  } else {
    console.log('Removing temporary babel.config.js...');
    fs.unlinkSync(babelConfigFile);
  }
}

// Run the test
function runConflictTest() {
  console.log('Running Next.js font loader and Babel configuration conflict test...');
  
  // Check if layout.tsx uses next/font
  const layoutFile = path.join(rootDir, 'app/layout.tsx');
  if (!fs.existsSync(layoutFile) || !fs.readFileSync(layoutFile, 'utf8').includes('next/font')) {
    console.log('Warning: app/layout.tsx does not exist or does not use next/font.');
    console.log('This test may not be relevant for this project.');
    return;
  }
  
  // Backup existing config
  const hadExistingConfig = backupExistingConfig();
  
  try {
    // Create temporary config
    createTemporaryBabelConfig();
    
    // Try to build
    console.log('Attempting to build with conflicting configuration...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('Build succeeded unexpectedly. The conflict test failed.');
    } catch (error) {
      console.log('Build failed as expected due to the conflict.');
      console.log('Test passed: The conflict between Next.js font loader and Babel configuration was detected.');
    }
  } finally {
    // Clean up
    cleanupBabelConfig(hadExistingConfig);
  }
}

// Run the test
runConflictTest();
