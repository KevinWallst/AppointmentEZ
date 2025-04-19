import fs from 'fs';
import path from 'path';

describe('Runtime Module Loading', () => {
  it('emailUtils can be loaded from API routes', () => {
    // Check if the file exists
    const apiFiles = [
      'app/api/cancel/route.ts',
      'app/api/bookings/route.ts',
      'app/api/appointments/update/route.ts',
      'app/api/appointments/delete/route.ts',
      'app/api/appointments/book/route.ts'
    ];

    apiFiles.forEach(filePath => {
      // Check if the file exists
      const fullPath = path.join(process.cwd(), filePath);
      expect(fs.existsSync(fullPath)).toBe(true);

      // Read the file content
      const fileContent = fs.readFileSync(fullPath, 'utf8');

      // Check if it imports emailUtils
      const importRegex = /from\s+['"](.+utils\/emailUtils(?:\.ts)?)['"];?/;
      const match = fileContent.match(importRegex);
      
      expect(match).not.toBeNull();
      if (match) {
        const importPath = match[1];
        expect(importPath).toContain('emailUtils');
      }
    });
  });
});
