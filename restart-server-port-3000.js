const { exec } = require('child_process');
const os = require('os');

console.log('Restarting the development server on port 3000...');

// First, kill any process using port 3000
const findPortCommand = os.platform() === 'win32'
  ? 'netstat -ano | findstr :3000'
  : 'lsof -i :3000';

const killPortCommand = os.platform() === 'win32'
  ? 'taskkill /F /PID '
  : 'kill -9 ';

// Kill any process using port 3000
exec(findPortCommand, (error, stdout, stderr) => {
  if (error) {
    console.log('No process found using port 3000.');
  } else {
    console.log('Found processes using port 3000:');
    console.log(stdout);

    // Parse the output to find process IDs
    const lines = stdout.toString().split('\n');
    const pids = new Set(); // Use a Set to avoid duplicate PIDs

    if (os.platform() === 'win32') {
      // Windows format: TCP    127.0.0.1:3000         0.0.0.0:0              LISTENING       12345
      lines.forEach(line => {
        if (line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4) {
            pids.add(parts[parts.length - 1]);
          }
        }
      });
    } else {
      // Unix format: node      12345 username   20u  IPv6 0x1234567890 0t0 TCP *:3000 (LISTEN)
      lines.forEach(line => {
        if (line.trim()) {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 2) {
            pids.add(parts[1]);
          }
        }
      });
    }

    // Kill each process
    if (pids.size > 0) {
      console.log(`Found ${pids.size} processes to kill.`);
      pids.forEach(pid => {
        exec(killPortCommand + pid, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error killing process ${pid}:`, error);
          } else {
            console.log(`Killed process ${pid}`);
          }
        });
      });
    }
  }

  // Now find and kill any running Next.js processes
  const findNextCommand = os.platform() === 'win32'
    ? 'tasklist /FI "IMAGENAME eq node.exe" /FO CSV'
    : 'ps aux | grep "next dev" | grep -v grep';

  exec(findNextCommand, (error, stdout, stderr) => {
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
          exec(killPortCommand + pid, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error killing process ${pid}:`, error);
            } else {
              console.log(`Killed process ${pid}`);
            }
          });
        });
      }
    }

    // Start a new server after a short delay with PORT=3000
    setTimeout(() => {
      console.log('Starting new development server on port 3000...');

      // Set PORT environment variable to 3000
      const env = { ...process.env, PORT: 3000 };

      // Use cross-platform command
      const command = os.platform() === 'win32' ? 'set PORT=3000 && npm run dev' : 'PORT=3000 npm run dev';

      const server = exec(command, (error, stdout, stderr) => {
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

      console.log('Server started on port 3000. Press Ctrl+C to exit.');
    }, 2000); // Increased delay to ensure all processes are killed
  });
});
