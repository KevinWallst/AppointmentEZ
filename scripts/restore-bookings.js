/**
 * restore-bookings.js
 * 
 * This script restores the bookings.csv file from the latest archive.
 * It can be run manually or automatically after a deployment.
 */

const fs = require('fs');
const path = require('path');

// Define paths
const rootDir = process.cwd();
const bookingsPath = path.join(rootDir, 'bookings.csv');
const archiveDir = path.join(rootDir, 'data', 'archives');
const latestArchivePath = path.join(archiveDir, 'bookings-latest.csv');
const archiveListPath = path.join(archiveDir, 'archive-list.txt');

// Check if archive directory exists
if (!fs.existsSync(archiveDir)) {
  console.error(`Error: Archive directory ${archiveDir} does not exist.`);
  process.exit(1);
}

// Function to restore from a specific archive
function restoreFromArchive(archivePath) {
  try {
    if (!fs.existsSync(archivePath)) {
      console.error(`Error: Archive file ${archivePath} does not exist.`);
      return false;
    }
    
    const archiveData = fs.readFileSync(archivePath, 'utf8');
    fs.writeFileSync(bookingsPath, archiveData, 'utf8');
    console.log(`Successfully restored bookings.csv from ${archivePath}`);
    return true;
  } catch (error) {
    console.error(`Error restoring from archive: ${error.message}`);
    return false;
  }
}

// Try to restore from the latest archive symlink first
if (fs.existsSync(latestArchivePath)) {
  if (restoreFromArchive(latestArchivePath)) {
    process.exit(0);
  }
}

// If that fails, try to find the most recent archive from the list
if (fs.existsSync(archiveListPath)) {
  try {
    const archiveList = fs.readFileSync(archiveListPath, 'utf8').split('\n');
    if (archiveList.length > 0 && archiveList[0].trim() !== '') {
      const mostRecentArchive = path.join(archiveDir, archiveList[0]);
      if (restoreFromArchive(mostRecentArchive)) {
        process.exit(0);
      }
    }
  } catch (error) {
    console.error(`Error reading archive list: ${error.message}`);
  }
}

// If all else fails, try to find any archive in the directory
try {
  const files = fs.readdirSync(archiveDir)
    .filter(file => file.startsWith('bookings-') && file.endsWith('.csv') && file !== 'bookings-latest.csv')
    .sort()
    .reverse();
  
  if (files.length > 0) {
    const mostRecentArchive = path.join(archiveDir, files[0]);
    if (restoreFromArchive(mostRecentArchive)) {
      process.exit(0);
    }
  }
} catch (error) {
  console.error(`Error finding archives in directory: ${error.message}`);
}

console.error('Failed to restore bookings.csv from any archive.');
process.exit(1);
