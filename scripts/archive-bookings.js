/**
 * archive-bookings.js
 * 
 * This script archives the bookings.csv file to a date-stamped file in the data/archives directory.
 * It should be run daily via a cron job or similar scheduler.
 */

const fs = require('fs');
const path = require('path');

// Define paths
const rootDir = process.cwd();
const bookingsPath = path.join(rootDir, 'bookings.csv');
const archiveDir = path.join(rootDir, 'data', 'archives');
const restoreScript = path.join(rootDir, 'scripts', 'restore-bookings.js');

// Ensure archive directory exists
if (!fs.existsSync(archiveDir)) {
  console.log(`Creating archive directory: ${archiveDir}`);
  fs.mkdirSync(archiveDir, { recursive: true });
}

// Get current date in YYYY-MM-DD format
const now = new Date();
const dateStamp = now.toISOString().split('T')[0];
const timeStamp = now.toISOString().split('T')[1].replace(/:/g, '-').split('.')[0];
const archiveFileName = `bookings-${dateStamp}-${timeStamp}.csv`;
const archivePath = path.join(archiveDir, archiveFileName);

// Check if bookings.csv exists
if (!fs.existsSync(bookingsPath)) {
  console.error(`Error: ${bookingsPath} does not exist.`);
  process.exit(1);
}

// Copy the bookings.csv file to the archive
try {
  const bookingsData = fs.readFileSync(bookingsPath, 'utf8');
  fs.writeFileSync(archivePath, bookingsData, 'utf8');
  console.log(`Successfully archived bookings.csv to ${archivePath}`);
  
  // Create a symlink to the latest archive
  const latestPath = path.join(archiveDir, 'bookings-latest.csv');
  if (fs.existsSync(latestPath)) {
    fs.unlinkSync(latestPath);
  }
  fs.symlinkSync(archivePath, latestPath);
  console.log(`Updated latest archive symlink to ${archiveFileName}`);
  
  // Create a list of all archives
  const archives = fs.readdirSync(archiveDir)
    .filter(file => file.startsWith('bookings-') && file.endsWith('.csv') && file !== 'bookings-latest.csv')
    .sort()
    .reverse();
  
  // Write the list to a file
  const archiveListPath = path.join(archiveDir, 'archive-list.txt');
  fs.writeFileSync(archiveListPath, archives.join('\n'), 'utf8');
  console.log(`Updated archive list with ${archives.length} entries`);
  
  // Keep only the last 30 archives (approximately one month)
  if (archives.length > 30) {
    const toDelete = archives.slice(30);
    toDelete.forEach(file => {
      const filePath = path.join(archiveDir, file);
      fs.unlinkSync(filePath);
      console.log(`Deleted old archive: ${file}`);
    });
  }
  
} catch (error) {
  console.error(`Error archiving bookings.csv: ${error.message}`);
  process.exit(1);
}
