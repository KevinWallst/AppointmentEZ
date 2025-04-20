/**
 * setup-cron.js
 * 
 * This script sets up a cron job to run the archive-bookings.js script daily.
 * It should be run once after deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Define paths
const rootDir = process.cwd();
const archiveScript = path.join(rootDir, 'scripts', 'archive-bookings.js');
const cronJobPath = path.join(os.tmpdir(), 'appointmentez-cron');

console.log('=== Setting up daily archive cron job ===');

// Create cron job content
const cronContent = `0 0 * * * cd ${rootDir} && node ${archiveScript} >> ${rootDir}/data/archives/archive.log 2>&1\n`;

// Write to temporary file
fs.writeFileSync(cronJobPath, cronContent, 'utf8');

// Check if we're on a system that supports crontab
try {
  // Check if crontab is available
  execSync('which crontab', { stdio: 'ignore' });
  
  // Add to crontab
  console.log('Adding cron job to crontab...');
  execSync(`crontab -l | grep -v "${archiveScript}" | cat - ${cronJobPath} | crontab -`, {
    stdio: 'inherit',
    shell: '/bin/bash'
  });
  console.log('Cron job added successfully.');
  
  // Verify cron job was added
  console.log('Current crontab:');
  execSync('crontab -l', { stdio: 'inherit' });
  
} catch (error) {
  console.log('Crontab not available. Manual setup required.');
  console.log('To archive bookings daily, add the following line to your crontab:');
  console.log(cronContent);
  
  // For Windows, suggest Task Scheduler
  if (process.platform === 'win32') {
    console.log('\nOn Windows, use Task Scheduler instead:');
    console.log('1. Open Task Scheduler');
    console.log('2. Create a Basic Task');
    console.log('3. Set it to run daily');
    console.log(`4. Action: Start a program`);
    console.log(`5. Program: node.exe`);
    console.log(`6. Arguments: ${archiveScript}`);
    console.log(`7. Start in: ${rootDir}`);
  }
}

// Clean up
fs.unlinkSync(cronJobPath);

console.log('=== Cron job setup completed ===');
