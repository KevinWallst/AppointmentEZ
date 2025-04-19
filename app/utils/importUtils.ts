/**
 * Utility functions to help with imports and module paths
 */

import path from 'path';

/**
 * Calculates the correct relative path to a module based on the current file's path
 * @param currentFilePath The path of the current file (use __filename)
 * @param targetModulePath The path of the target module relative to the app directory
 * @returns The correct relative path to import the target module
 */
export function getRelativeImportPath(currentFilePath: string, targetModulePath: string): string {
  // Convert absolute paths to relative paths from the app directory
  const appDir = path.join(process.cwd(), 'app');
  const currentDir = path.dirname(currentFilePath);
  
  // Calculate the relative path from the current file to the app directory
  const relativeToApp = path.relative(currentDir, appDir);
  
  // Join the relative path to the app directory with the target module path
  return path.join(relativeToApp, targetModulePath).replace(/\\/g, '/');
}

/**
 * Example usage:
 * 
 * // In a file at app/api/appointments/book/route.ts
 * import { getRelativeImportPath } from getRelativeImportPath(__filename, 'utils/emailUtils');
 * import { getBccEmails } from getRelativeImportPath(__filename, 'utils/emailUtils');
 */
