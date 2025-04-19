const fs = require('fs');

// List of files to fix
const filesToFix = [
  'app/page.tsx',
  'app/admin/dashboard/page.tsx'
];

// Function to fix Box components in a file
function fixBoxComponents(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace Box with div
    content = content.replace(/<Box/g, '<div');
    content = content.replace(/<\/Box>/g, '</div>');
    
    // Replace sx props with style props
    content = content.replace(/sx={{/g, 'style={{');
    
    // Replace MUI-specific styling with standard CSS
    content = content.replace(/mb: (\d+)/g, 'marginBottom: "$1rem"');
    content = content.replace(/mt: (\d+)/g, 'marginTop: "$1rem"');
    content = content.replace(/ml: (\d+)/g, 'marginLeft: "$1rem"');
    content = content.replace(/mr: (\d+)/g, 'marginRight: "$1rem"');
    content = content.replace(/px: (\d+)/g, 'paddingLeft: "$1rem", paddingRight: "$1rem"');
    content = content.replace(/py: (\d+)/g, 'paddingTop: "$1rem", paddingBottom: "$1rem"');
    content = content.replace(/p: (\d+)/g, 'padding: "$1rem"');
    content = content.replace(/gap: (\d+)/g, 'gap: "$1rem"');
    
    // Replace component="form" with actual form element
    content = content.replace(/<div component="form"/g, '<form');
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`✅ Fixed Box components in ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ ERROR: Could not fix file ${filePath}:`, error.message);
    return false;
  }
}

// Fix all files
let allFixed = true;
for (const file of filesToFix) {
  const fixed = fixBoxComponents(file);
  allFixed = allFixed && fixed;
}

if (allFixed) {
  console.log('\n✅ All files have been fixed!');
} else {
  console.error('\n❌ Some files could not be fixed.');
}
