const { exec } = require('child_process');
const os = require('os');

console.log('Restarting the development server...');

// Find and kill any running Next.js processes
const findCommand = os.platform() === 'win32' 
  ? 'tasklist /FI "IMAGENAME eq node.exe" /FO CSV' 
  : 'ps aux | grep "next dev" | grep -v grep';

const killCommand = os.platform() === 'win32'
  ? 'taskkill /F /PID '
  : 'kill -9 ';

exec(findCommand, (error, stdout, stderr) => {
  if (error) {
    console.log('No running Next.js processes found.');
  } else {
    // Parse the output to find process IDs
    const lines = stdout.toString().split('\n');
    const pids = [];
    
    if (os.platform() === 'win32') {
      // Windows format: "node.exe","12345","Console","1","64,732 K"
      lines.forEach(line => {
        if (line.includes('node.exe')) {
          const parts = line.split(',');
          if (parts.length > 1) {
            const pid = parts[1].replace(/"/g, '');
            pids.push(pid);
          }
        }
      });
    } else {
      // Unix format: username   12345  0.0  0.0  12345 12345 pts/0    S+   12:34   0:00 node next dev
      lines.forEach(line => {
        if (line.includes('next dev')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 1) {
            pids.push(parts[1]);
          }
        }
      });
    }
    
    // Kill each process
    if (pids.length > 0) {
      console.log(`Found ${pids.length} Next.js processes to kill.`);
      pids.forEach(pid => {
        exec(killCommand + pid, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error killing process ${pid}:`, error);
          } else {
            console.log(`Killed process ${pid}`);
          }
        });
      });
    }
  }
  
  // Start a new server after a short delay
  setTimeout(() => {
    console.log('Starting new development server...');
    const server = exec('npm run dev', (error, stdout, stderr) => {
      if (error) {
        console.error('Error starting server:', error);
      }
    });
    
    // Forward stdout and stderr to the console
    server.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    server.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    console.log('Server started. Press Ctrl+C to exit.');
  }, 1000);
});
