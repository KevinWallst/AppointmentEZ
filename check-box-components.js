const fs = require('fs');
const path = require('path');

// List of page files to check
const pagesToCheck = [
  'app/page.tsx',
  'app/admin/dashboard/page.tsx',
  'app/admin/login/page.tsx',
  'app/cancel/page.tsx'
];

// Function to check for Box components in return statements
function checkForBoxComponents(filePath) {
  console.log(`Checking ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find the return statement and check for Box components
    const returnRegex = /return\s*\(\s*<Box/g;
    const matches = content.match(returnRegex);
    
    if (matches) {
      console.error(`❌ ERROR: Found Box component in return statement in ${filePath}`);
      
      // Find the line number
      const lines = content.split('\n');
      let lineNumber = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('return (') && lines[i+1] && lines[i+1].trim().startsWith('<Box')) {
          lineNumber = i + 2; // +2 because we're looking at the next line and 1-indexed
          break;
        }
      }
      
      console.error(`   Issue at around line ${lineNumber}:`);
      console.error(`   Replace <Box with <div and sx={{ with style={{`);
      return false;
    } else {
      console.log(`✅ No Box component issues found in ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ ERROR: Could not read file ${filePath}:`, error.message);
    return false;
  }
}

// Check all pages
let allPassed = true;
for (const page of pagesToCheck) {
  const passed = checkForBoxComponents(page);
  allPassed = allPassed && passed;
}

if (allPassed) {
  console.log('\n✅ All pages passed the Box component check!');
} else {
  console.error('\n❌ Some pages have Box component issues that need to be fixed.');
  console.error('   Replace <Box with <div and sx={{ with style={{');
}
