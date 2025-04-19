#!/bin/bash

# Check if port 3000 is in use
echo "Checking for processes using port 3000..."
PIDS=$(lsof -ti:3000)

# Kill processes using port 3000 if any
if [ -n "$PIDS" ]; then
  echo "Killing processes using port 3000: $PIDS"
  kill -9 $PIDS
fi

# Start the production server on port 3000
echo "Starting production server on port 3000..."
PORT=3000 npm run start
