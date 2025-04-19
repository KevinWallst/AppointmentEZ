import { NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import { defaultSettings } from '../../contexts/SettingsContext';

// Helper function to ensure settings file exists
function ensureSettingsFile() {
  const settingsPath = path.join(process.cwd(), 'settings.json');
  if (!existsSync(settingsPath)) {
    // Create the settings file with default settings if it doesn't exist
    writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
    console.log('Created default settings.json file');
  }
  return settingsPath;
}

// GET endpoint to retrieve settings
export async function GET() {
  try {
    const settingsPath = ensureSettingsFile();
    const settingsData = readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(settingsData);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error retrieving settings:', error);

    // If there's an error, return the default settings
    return NextResponse.json(defaultSettings);
  }
}

// POST endpoint to save settings
export async function POST(request: Request) {
  try {
    const settings = await request.json();

    // Save settings to a file that can be accessed by server-side code
    const settingsPath = path.join(process.cwd(), 'settings.json');
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
