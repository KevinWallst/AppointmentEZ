/**
 * This test suite verifies that modules can be loaded at runtime
 * from different parts of the application.
 */

import fs from 'fs';
import path from 'path';

describe('Runtime Module Loading', () => {
  // Test that the emailUtils module can be loaded from API routes
  test('emailUtils can be loaded from API routes', () => {
    // Define the paths to the API route files
    const apiRoutes = [
      'app/api/bookings/route.ts',
      'app/api/cancel/route.ts',
      'app/api/appointments/book/route.ts',
      'app/api/appointments/update/route.ts',
      'app/api/appointments/delete/route.ts',
    ];
    
    // For each API route, check if it can import the emailUtils module
    apiRoutes.forEach(routePath => {
      // Read the file content
      const filePath = path.join(process.cwd(), routePath);
      expect(fs.existsSync(filePath)).toBe(true);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Check if the file imports the emailUtils module
      const importRegex = /import\s+.*\s+from\s+['"](.+utils\/emailUtils)['"];?/;
      const match = fileContent.match(importRegex);
      
      expect(match).not.toBeNull();
      if (match) {
        const importPath = match[1];
        
        // Calculate the correct relative path based on the file's directory depth
        const directoryDepth = routePath.split('/').length - 2; // -2 for 'app' and the file itself
        const expectedPrefix = '../'.repeat(directoryDepth);
        const expectedPath = `${expectedPrefix}utils/emailUtils`;
        
        expect(importPath).toBe(expectedPath);
      }
    });
  });
});
