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
    
    // Find all Box components in the file
    const boxRegex = /<Box/g;
    const matches = content.match(boxRegex);
    
    if (matches) {
      console.error(`❌ ERROR: Found ${matches.length} Box components in ${filePath}`);
      
      // Find the line numbers
      const lines = content.split('\n');
      let boxLocations = [];
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('<Box')) {
          boxLocations.push({
            lineNumber: i + 1,
            line: lines[i].trim()
          });
        }
      }
      
      // Print the first 5 Box components
      console.error(`   First ${Math.min(5, boxLocations.length)} Box components:`);
      boxLocations.slice(0, 5).forEach(loc => {
        console.error(`   Line ${loc.lineNumber}: ${loc.line}`);
      });
      
      return false;
    } else {
      console.log(`✅ No Box components found in ${filePath}`);
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
  console.error('\n❌ Some pages have Box components that need to be fixed.');
  console.error('   Replace <Box with <div and sx={{ with style={{');
}
