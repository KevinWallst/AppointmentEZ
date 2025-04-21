#!/bin/bash

# Test script for post-build.sh
# This script tests the post-build.sh script in various scenarios

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing post-build.sh in various scenarios...${NC}"

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo -e "${BLUE}Created temporary directory: $TEMP_DIR${NC}"

# Copy necessary files to the temporary directory
cp package.json package-lock.json scripts/post-build.sh "$TEMP_DIR/"
cd "$TEMP_DIR"

# Test 1: README.md doesn't exist
echo -e "\n${YELLOW}Test 1: README.md doesn't exist${NC}"
rm -f README.md
./post-build.sh
if [ -f README.md ]; then
  echo -e "${GREEN}✓ Test 1 passed: README.md was created${NC}"
else
  echo -e "${RED}✗ Test 1 failed: README.md was not created${NC}"
fi

# Test 2: README.md exists but doesn't have version
echo -e "\n${YELLOW}Test 2: README.md exists but doesn't have version${NC}"
echo "# AppointmentEZ" > README.md
echo "This is a test README" >> README.md
./post-build.sh
if grep -q "# AppointmentEZ v" README.md; then
  echo -e "${GREEN}✓ Test 2 passed: Version was added to README.md${NC}"
else
  echo -e "${RED}✗ Test 2 failed: Version was not added to README.md${NC}"
  cat README.md
fi

# Test 3: README.md exists with old version
echo -e "\n${YELLOW}Test 3: README.md exists with old version${NC}"
echo "# AppointmentEZ v0.1.0" > README.md
echo "This is a test README" >> README.md
OLD_VERSION=$(grep -o "v[0-9]*\.[0-9]*\.[0-9]*" README.md)
./post-build.sh
NEW_VERSION=$(grep -o "v[0-9]*\.[0-9]*\.[0-9]*" README.md)
if [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
  echo -e "${GREEN}✓ Test 3 passed: Version was updated from $OLD_VERSION to $NEW_VERSION${NC}"
else
  echo -e "${RED}✗ Test 3 failed: Version was not updated${NC}"
  cat README.md
fi

# Test 4: README.md in a different directory
echo -e "\n${YELLOW}Test 4: README.md in a different directory${NC}"
mkdir -p subdir
cd subdir
echo "# AppointmentEZ v0.1.0" > README.md
echo "This is a test README" >> README.md
cd ..
./post-build.sh
if [ -f "./README.md" ]; then
  echo -e "${GREEN}✓ Test 4 passed: README.md was created in current directory${NC}"
else
  echo -e "${RED}✗ Test 4 failed: README.md was not created in current directory${NC}"
fi

# Clean up
cd /Users/kevinzhu/AppointmentEZ
rm -rf "$TEMP_DIR"
echo -e "\n${GREEN}Tests completed. Temporary directory removed.${NC}"
