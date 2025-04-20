/**
 * post-deploy.js
 * 
 * This script should be run after deployment to restore the bookings.csv file.
 * It first archives the current bookings.csv file (if it exists) and then
 * restores from the latest archive.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const rootDir = process.cwd();
const bookingsPath = path.join(rootDir, 'bookings.csv');
const archiveScript = path.join(rootDir, 'scripts', 'archive-bookings.js');
const restoreScript = path.join(rootDir, 'scripts', 'restore-bookings.js');

console.log('=== Post-Deployment Script ===');

// Archive the current bookings.csv file if it exists
if (fs.existsSync(bookingsPath)) {
  console.log('Archiving current bookings.csv file...');
  try {
    execSync(`node ${archiveScript}`, { stdio: 'inherit' });
    console.log('Archive completed successfully.');
  } catch (error) {
    console.error(`Error archiving bookings.csv: ${error.message}`);
  }
}

// Restore from the latest archive
console.log('Restoring bookings.csv from latest archive...');
try {
  execSync(`node ${restoreScript}`, { stdio: 'inherit' });
  console.log('Restore completed successfully.');
} catch (error) {
  console.error(`Error restoring bookings.csv: ${error.message}`);
  
  // If restore fails and there's no bookings.csv, create an empty one
  if (!fs.existsSync(bookingsPath)) {
    console.log('Creating empty bookings.csv file...');
    fs.writeFileSync(bookingsPath, 'id,appointmentTime,requestTime,name,email,wechatId,topic,language\n', 'utf8');
    console.log('Empty bookings.csv file created.');
  }
}

console.log('=== Post-Deployment Script Completed ===');
