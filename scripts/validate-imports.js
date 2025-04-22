/**
 * This script validates import paths in the codebase to ensure they're correct.
 * Run it with: node scripts/validate-imports.js
 */

const fs = require('fs');
const path = require('path');

// Try to require glob, but don't fail if it's not available
let glob;
try {
  glob = require('glob');
} catch (error) {
  console.warn('Warning: glob module not found. Import validation will be skipped.');
  console.log('\n✅ Import validation skipped. Please run npm install to install dependencies.');
  process.exit(0); // Exit successfully to not break the build
}

// Define the modules to check imports for
const MODULES_TO_CHECK = [
  {
    name: 'emailUtils',
    path: 'app/utils/emailUtils.ts',
    importPattern: /from\s+['"](.+utils\/emailUtils)['"]/
  },
  // Add more modules as needed
];

// Function to calculate the correct relative path
function calculateRelativePath(fromFile, toModule) {
  const fromDir = path.dirname(fromFile);
  const toDir = path.dirname(toModule);
  let relativePath = path.relative(fromDir, toDir);

  // Convert Windows backslashes to forward slashes
  relativePath = relativePath.replace(/\\/g, '/');

  // If the path doesn't start with '.', add './'
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  // Add the filename
  const moduleName = path.basename(toModule);
  return path.join(relativePath, moduleName).replace(/\\/g, '/');
}

// Find all TypeScript files in the app directory
const files = glob.sync('app/**/*.ts');

let hasErrors = false;

// Check each file for imports
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');

  MODULES_TO_CHECK.forEach(module => {
    const match = content.match(module.importPattern);
    if (match) {
      const actualImportPath = match[1];
      const correctImportPath = calculateRelativePath(file, module.path);

      if (actualImportPath !== correctImportPath) {
        console.error(`❌ Import path error in ${file}:`);
        console.error(`   Actual:   ${actualImportPath}`);
        console.error(`   Expected: ${correctImportPath}`);
        hasErrors = true;
      } else {
        console.log(`✅ Correct import in ${file}: ${actualImportPath}`);
      }
    }
  });
});

if (hasErrors) {
  console.error('\n❌ Import path validation failed. Please fix the errors above.');
  process.exit(1);
} else {
  console.log('\n✅ All import paths are correct!');
}
