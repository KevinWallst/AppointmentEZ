#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Listing all test cases and their purposes...${NC}"
echo

# Function to extract test descriptions from a file
extract_test_descriptions() {
  local file=$1
  echo -e "${GREEN}=== $file ===${NC}"
  
  # Extract describe blocks
  DESCRIBES=$(grep -n "describe(" "$file" | sed 's/:.*//')
  
  # If no describes, just list the tests
  if [ -z "$DESCRIBES" ]; then
    grep -n -E "test\(|it\(" "$file" | while read -r line; do
      LINE_NUM=$(echo "$line" | cut -d: -f1)
      TEST_NAME=$(echo "$line" | sed 's/^[[:space:]]*//' | sed 's/^[0-9]*://' | sed 's/test(/Test: /' | sed 's/it(/Test: /' | sed 's/,.*$//')
      echo -e "${BLUE}$TEST_NAME${NC}"
    done
  else
    # Process each describe block
    for DESC_LINE in $DESCRIBES; do
      DESC=$(sed -n "${DESC_LINE}p" "$file" | sed 's/^[[:space:]]*//' | sed 's/describe(/Describe: /' | sed 's/,.*$//')
      echo -e "${BLUE}$DESC${NC}"
      
      # Find the next describe line or end of file
      NEXT_DESC_LINE=$(grep -n "describe(" "$file" | awk -F: -v current="$DESC_LINE" '$1 > current {print $1; exit}')
      if [ -z "$NEXT_DESC_LINE" ]; then
        NEXT_DESC_LINE=$(wc -l < "$file")
      fi
      
      # Extract tests within this describe block
      sed -n "${DESC_LINE},${NEXT_DESC_LINE}p" "$file" | grep -E "test\(|it\(" | sed 's/^[[:space:]]*//' | sed 's/test(/  - Test: /' | sed 's/it(/  - Test: /' | sed 's/,.*$//'
    done
  fi
  
  echo
}

# Process each test file
for file in $(find __tests__ -name "*.js" -o -name "*.ts" -o -name "*.tsx" | sort); do
  extract_test_descriptions "$file"
done

echo -e "${YELLOW}All test cases listed.${NC}"
