const fs = require('fs');

// Read the admin dashboard file
const filePath = 'app/admin/dashboard/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace Box components in the return statement
content = content.replace(
  /return\s*\(\s*<Box/g,
  'return (\n    <div'
);

// Replace Box with div and sx with style
const replacements = [
  // Replace Box with div
  {
    from: /<Box/g,
    to: '<div'
  },
  {
    from: /<\/Box>/g,
    to: '</div>'
  },
  // Replace the form Box
  {
    from: /<Box component="form"/g,
    to: '<form'
  },
  // Handle specific style conversions
  {
    from: /sx={{\s*display:\s*'flex'/g,
    to: 'style={{ display: "flex"'
  },
  {
    from: /sx={{\s*mb:\s*(\d+)/g,
    to: 'style={{ marginBottom: "$1rem"'
  },
  {
    from: /sx={{\s*mt:\s*(\d+)/g,
    to: 'style={{ marginTop: "$1rem"'
  },
  {
    from: /sx={{\s*p:\s*(\d+)/g,
    to: 'style={{ padding: "$1rem"'
  },
  {
    from: /sx={{\s*gap:\s*(\d+)/g,
    to: 'style={{ gap: "$1rem"'
  },
  // Handle more complex sx props
  {
    from: /sx={{\s*width:\s*(\d+),\s*height:\s*(\d+)/g,
    to: 'style={{ width: "$1px", height: "$2px"'
  },
  {
    from: /sx={{\s*textAlign:\s*'center'/g,
    to: 'style={{ textAlign: "center"'
  },
  {
    from: /sx={{\s*display:\s*'grid'/g,
    to: 'style={{ display: "grid"'
  }
];

// Apply all replacements
replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed Box components in admin dashboard page');
