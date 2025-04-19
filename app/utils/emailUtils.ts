import { readFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * Get the BCC email addresses from settings
 * @returns Array of BCC email addresses
 */
export function getBccEmails(): string[] {
  try {
    // Default BCC emails if settings can't be loaded
    const defaultBccEmails = ['leyelaw@gmail.com', 'kevin@leyelaw.com', 'leye@leyelaw.com'];

    // Try to read settings from localStorage on the server side
    if (typeof window === 'undefined') {
      const settingsPath = path.join(process.cwd(), 'settings.json');

      if (existsSync(settingsPath)) {
        const settingsData = readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsData);

        if (settings) {
          // Ensure emailSettings exists
          if (settings.emailSettings && settings.emailSettings.bccEmails && Array.isArray(settings.emailSettings.bccEmails)) {
            return settings.emailSettings.bccEmails;
          }
        }
      }
    }

    return defaultBccEmails;
  } catch (error) {
    console.error('Error getting BCC emails:', error);
    return ['leyelaw@gmail.com', 'kevin@leyelaw.com', 'leye@leyelaw.com'];
  }
}
