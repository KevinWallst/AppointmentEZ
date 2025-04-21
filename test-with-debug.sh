#!/bin/bash

# Run Jest with --detectOpenHandles and --forceExit flags
echo "Running Jest with debug flags..."
npm test -- --detectOpenHandles --forceExit

# Capture the exit code
EXIT_CODE=$?
echo "Jest exited with code: $EXIT_CODE"

# If exit code is non-zero, print more debug info
if [ $EXIT_CODE -ne 0 ]; then
  echo "Tests failed with exit code $EXIT_CODE. Checking for open handles..."
  
  # Run with --logHeapUsage to check memory usage
  echo "Running with --logHeapUsage..."
  npm test -- --detectOpenHandles --forceExit --logHeapUsage
  
  # Check Node.js version
  echo "Node.js version:"
  node --version
  
  # Check npm version
  echo "npm version:"
  npm --version
  
  # Check available memory
  echo "Available memory:"
  free -m || echo "free command not available"
  
  # Check for process leaks
  echo "Running processes:"
  ps aux | grep node || echo "ps command not available"
fi

exit $EXIT_CODE
