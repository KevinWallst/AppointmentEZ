#!/usr/bin/env node

/**
 * This script validates the build configuration to prevent conflicts
 * between Next.js font loader and Babel configuration.
 * 
 * Run this script before building the application to detect potential issues.
 */

const fs = require('fs');
const path = require('path');

// Define the root directory
const rootDir = path.resolve(__dirname, '..');

// Check for font imports in layout files
function checkForFontImports() {
  const layoutFiles = [
    path.join(rootDir, 'app/layout.tsx'),
    path.join(rootDir, 'app/layout.jsx'),
    path.join(rootDir, 'app/layout.js')
  ];

  let hasFontImports = false;
  
  for (const file of layoutFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('next/font')) {
        hasFontImports = true;
        console.log(`Found Next.js font import in ${file}`);
      }
    }
  }
  
  return hasFontImports;
}

// Check for Babel configuration files
function checkForBabelConfig() {
  const babelConfigFiles = [
    path.join(rootDir, 'babel.config.js'),
    path.join(rootDir, 'babel.config.json'),
    path.join(rootDir, '.babelrc'),
    path.join(rootDir, '.babelrc.js'),
    path.join(rootDir, '.babelrc.json')
  ];
  
  const foundConfigs = [];
  
  for (const file of babelConfigFiles) {
    if (fs.existsSync(file)) {
      foundConfigs.push(file);
      console.log(`Found Babel configuration file: ${file}`);
    }
  }
  
  return foundConfigs;
}

// Check if Jest configuration contains inline Babel config
function checkJestConfig() {
  const jestConfigFiles = [
    path.join(rootDir, 'jest.config.js'),
    path.join(rootDir, 'jest.config.json'),
    path.join(rootDir, 'jest.config.mjs')
  ];
  
  let hasInlineBabelConfig = false;
  
  for (const file of jestConfigFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('babel-jest') && content.includes('presets')) {
        hasInlineBabelConfig = true;
        console.log(`Found inline Babel configuration in Jest config: ${file}`);
      }
    }
  }
  
  return hasInlineBabelConfig;
}

// Main validation function
function validateBuildConfig() {
  console.log('Validating build configuration...');
  
  const hasFontImports = checkForFontImports();
  const babelConfigFiles = checkForBabelConfig();
  const hasInlineBabelConfig = checkJestConfig();
  
  if (hasFontImports && babelConfigFiles.length > 0) {
    console.log('\n⚠️ CONFLICT DETECTED: Next.js font imports and Babel configuration files');
    console.log('This will cause build errors with the message:');
    console.log('"next/font" requires SWC although Babel is being used due to a custom babel config being present.');
    console.log('\nRecommended actions:');
    console.log('1. Remove standalone Babel configuration files');
    console.log('2. Move Babel configuration into Jest configuration');
    console.log('3. See: https://nextjs.org/docs/messages/babel-font-loader-conflict');
    
    return false;
  }
  
  if (hasFontImports) {
    console.log('✓ Next.js font imports detected, but no conflicting Babel configuration found.');
  } else {
    console.log('ℹ️ No Next.js font imports detected.');
  }
  
  if (babelConfigFiles.length === 0) {
    console.log('✓ No standalone Babel configuration files found.');
  }
  
  if (hasInlineBabelConfig) {
    console.log('✓ Babel configuration is properly inlined in Jest config.');
  }
  
  console.log('\nBuild configuration validation passed!');
  return true;
}

// Run the validation
const isValid = validateBuildConfig();

// Exit with appropriate code
process.exit(isValid ? 0 : 1);
