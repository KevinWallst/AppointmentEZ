#!/bin/bash

# Kill any process using port 3000
echo "Checking for processes using port 3000..."
if command -v lsof &> /dev/null; then
  # macOS/Linux
  PORT_PIDS=$(lsof -ti:3000)
  if [ -n "$PORT_PIDS" ]; then
    echo "Killing processes using port 3000: $PORT_PIDS"
    kill -9 $PORT_PIDS
  else
    echo "No processes found using port 3000."
  fi
elif command -v netstat &> /dev/null; then
  # Windows with Git Bash or similar
  PORT_PIDS=$(netstat -ano | grep ":3000" | grep "LISTENING" | awk '{print $5}')
  if [ -n "$PORT_PIDS" ]; then
    echo "Killing processes using port 3000: $PORT_PIDS"
    for PID in $PORT_PIDS; do
      taskkill //F //PID $PID
    done
  else
    echo "No processes found using port 3000."
  fi
else
  echo "Could not find lsof or netstat. Unable to check for processes using port 3000."
fi

# Start the server on port 3000
echo "Starting server on port 3000..."
PORT=3000 npm run dev
