#!/usr/bin/env node

/**
 * This script automatically updates the version number and CHANGELOG.md file
 * before each build. It increments the patch version number (e.g., 0.2.1 to 0.2.2)
 * and adds a new entry to the CHANGELOG.md file.
 *
 * Usage:
 * - Run manually: node scripts/update-version.js
 * - Automatically run before build by adding to package.json scripts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define file paths
const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

// Get the current version without incrementing
function getCurrentVersion() {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;

  console.log(`Current version: ${currentVersion}`);

  return { currentVersion, newVersion: currentVersion };
}

// Get git changes since last version update
function getGitChanges() {
  try {
    // Get the git diff
    const gitDiff = execSync('git diff --staged', { encoding: 'utf8' });

    // Get the git log for commit messages since the last version update
    const gitLog = execSync('git log -n 10 --pretty=format:"%s"', { encoding: 'utf8' })
      .split('\n')
      .filter(line => !line.includes('Version bump') && line.trim() !== '')
      .map(line => `  - ${line}`)
      .join('\n');

    return { gitDiff, gitLog };
  } catch (error) {
    console.error('Error getting git changes:', error.message);
    return { gitDiff: '', gitLog: '  - No commit messages available' };
  }
}

// Update the CHANGELOG.md file
function updateChangelog(newVersion, currentVersion, gitChanges) {
  // Read the current changelog
  let changelog = fs.readFileSync(changelogPath, 'utf8');

  // Create new changelog entry
  const currentDate = getCurrentDate();
  const newEntry = `## [${newVersion}] - ${currentDate}

### Changes
${gitChanges.gitLog}

### Git Diff
\`\`\`diff
${gitChanges.gitDiff}
\`\`\`

`;

  // Find the position to insert the new entry (after the header)
  const headerEndPos = changelog.indexOf('## [');

  // Insert the new entry
  changelog = changelog.slice(0, headerEndPos) + newEntry + changelog.slice(headerEndPos);

  // Write the updated changelog
  fs.writeFileSync(changelogPath, changelog);

  console.log(`Updated CHANGELOG.md with version ${newVersion}`);
}

// Main function
function main() {
  try {
    // Get current version without incrementing
    const { currentVersion, newVersion } = getCurrentVersion();

    // Get git changes
    const gitChanges = getGitChanges();

    // Update changelog
    updateChangelog(newVersion, currentVersion, gitChanges);

    console.log('CHANGELOG update completed successfully!');
  } catch (error) {
    console.error('Error updating CHANGELOG:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
