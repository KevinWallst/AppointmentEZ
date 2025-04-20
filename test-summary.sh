#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running tests and generating summary table...${NC}"
echo

# Run Jest with JSON output
TEST_OUTPUT=$(npm test)

# Create a temporary file to store the test results
echo "| # | Test Suite | Purpose | Tests | Result | Failure Reason / Details |" > test_results.md
echo "|---|-----------|---------|-------|--------|--------------------------|" >> test_results.md

# Process each test file
count=1
for file in $(find __tests__ -name "*.js" -o -name "*.ts" -o -name "*.tsx" | sort); do
  # Extract the test file name
  filename=$(basename "$file")
  
  # Extract the purpose from the first describe block
  purpose=$(grep -m 1 "describe(" "$file" | sed 's/describe(//' | sed "s/'//g" | sed 's/"//g' | sed 's/,.*$//' | tr -d '\n')
  if [ -z "$purpose" ]; then
    purpose="N/A"
  fi
  
  # Count the number of tests
  test_count=$(grep -c -E "test\(|it\(" "$file")
  
  # Check if the test file is in the failing tests from the output
  if echo "$TEST_OUTPUT" | grep -q "FAIL.*$filename"; then
    result="❌ FAIL"
    
    # Extract failure reason
    failure_reason=$(echo "$TEST_OUTPUT" | grep -A 20 "FAIL.*$filename" | grep -m 1 "Error:" | sed 's/Error: //' | tr -d '\n')
    if [ -z "$failure_reason" ]; then
      failure_reason="Unknown failure"
    fi
  else
    result="✅ PASS"
    failure_reason="N/A"
  fi
  
  # Add to the table
  echo "| $count | $filename | $purpose | $test_count | $result | $failure_reason |" >> test_results.md
  
  ((count++))
done

# Add summary row
total_files=$(find __tests__ -name "*.js" -o -name "*.ts" -o -name "*.tsx" | wc -l)
passing_files=$(echo "$TEST_OUTPUT" | grep -c "PASS")
failing_files=$(echo "$TEST_OUTPUT" | grep -c "FAIL")
total_tests=$(echo "$TEST_OUTPUT" | grep "Tests:" | tail -n 1 | sed 's/.*Tests:[[:space:]]*\([0-9]*\) failed, \([0-9]*\) passed.*/\1 + \2/' | bc)
passing_tests=$(echo "$TEST_OUTPUT" | grep "Tests:" | tail -n 1 | sed 's/.*Tests:[[:space:]]*[0-9]* failed, \([0-9]*\) passed.*/\1/')
failing_tests=$(echo "$TEST_OUTPUT" | grep "Tests:" | tail -n 1 | sed 's/.*Tests:[[:space:]]*\([0-9]*\) failed.*/\1/')

echo "| - | **SUMMARY** | **All Tests** | **$total_tests** | **$passing_files/$total_files PASS** | **$failing_tests failing, $passing_tests passing** |" >> test_results.md

# Display the table
cat test_results.md

echo -e "\n${GREEN}Test summary table generated.${NC}"
