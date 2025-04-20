#!/bin/bash

# Set error handling
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running all tests and generating summary...${NC}"
echo

# Run Jest with JSON output
TEST_OUTPUT=$(npm test -- --json)

# Extract test results from JSON
echo "$TEST_OUTPUT" | grep -q "Test Suites:" && {
  # Parse test results
  TEST_SUITES=$(echo "$TEST_OUTPUT" | grep "Test Suites:" | sed 's/Test Suites: //')
  TESTS=$(echo "$TEST_OUTPUT" | grep "Tests:" | sed 's/Tests: //')
  
  echo -e "${GREEN}=== TEST SUMMARY ===${NC}"
  echo -e "${GREEN}$TEST_SUITES${NC}"
  echo -e "${GREEN}$TESTS${NC}"
  echo
} || {
  echo -e "${RED}Failed to parse test results${NC}"
  echo "$TEST_OUTPUT"
  exit 1
}

# List all test files
echo -e "${YELLOW}=== TEST FILES ===${NC}"
find __tests__ -name "*.js" -o -name "*.ts" -o -name "*.tsx" | sort

# Function to extract test descriptions from a file
extract_test_descriptions() {
  local file=$1
  echo -e "${GREEN}=== $file ===${NC}"
  
  # Extract describe and test blocks
  grep -E "describe\(|test\(|it\(" "$file" | sed 's/^[[:space:]]*//' | sed 's/describe(/Describe: /' | sed 's/test(/Test: /' | sed 's/it(/Test: /' | sed 's/,.*$//'
  
  # Run the specific test file
  echo -e "${YELLOW}Running tests for $file...${NC}"
  npm test -- "$file" --silent || echo -e "${RED}Tests failed for $file${NC}"
  echo
}

# Process each test file
for file in $(find __tests__ -name "*.js" -o -name "*.ts" -o -name "*.tsx" | sort); do
  extract_test_descriptions "$file"
done

echo -e "${GREEN}All tests processed.${NC}"
