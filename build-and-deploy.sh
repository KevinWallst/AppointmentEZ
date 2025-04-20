#!/bin/bash

# Set error handling
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting build and deploy process...${NC}"
echo

# Display current directory
echo -e "${YELLOW}Current directory: $(pwd)${NC}"

# Display git status before build
echo -e "${YELLOW}Git status before build:${NC}"
git status

# Check if there are any uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}Warning: There are uncommitted changes. Please commit them before proceeding.${NC}"
  git status -s
  
  # Ask user if they want to continue
  read -p "Do you want to commit these changes? (y/n): " answer
  if [[ "$answer" != "y" ]]; then
    echo -e "${RED}Build aborted. Please commit your changes manually.${NC}"
    exit 1
  fi
  
  # Commit changes
  read -p "Enter commit message: " commit_message
  git add .
  git commit -m "$commit_message"
fi

# Pull latest changes
echo -e "\n${YELLOW}Pulling latest changes from remote...${NC}"
git pull origin main

# Function to generate test summary table
generate_test_summary() {
  local test_output=$1
  
  echo "| # | Test Suite | Purpose | Tests | Result | Failure Reason / Details |"
  echo "|---|-----------|---------|-------|--------|--------------------------|"
  
  # Process each test file
  count=1
  while IFS= read -r file; do
    # Extract the test file name
    filename=$(basename "$file")
    
    # Extract the purpose from the first describe block
    purpose=""
    while IFS= read -r line; do
      if [[ "$line" =~ describe\( ]]; then
        purpose=$(echo "$line" | sed 's/describe(//' | sed "s/'//g" | sed 's/"//g' | sed 's/,.*$//' | tr -d '\n')
        break
      fi
    done < "$file"
    
    if [ -z "$purpose" ]; then
      purpose="N/A"
    fi
    
    # Count the number of tests
    test_count=0
    while IFS= read -r line; do
      if [[ "$line" =~ test\( || "$line" =~ it\( ]]; then
        ((test_count++))
      fi
    done < "$file"
    
    # Check if the test file is in the failing tests from the output
    if echo "$test_output" | grep -q "FAIL.*$filename"; then
      result="❌ FAIL"
      
      # Extract failure reason
      failure_reason=""
      capture=false
      while IFS= read -r line; do
        if [[ "$line" =~ FAIL.*$filename ]]; then
          capture=true
        elif [[ "$capture" == true && "$line" =~ Error: ]]; then
          failure_reason=$(echo "$line" | sed 's/Error: //' | tr -d '\n')
          break
        fi
      done < <(echo "$test_output")
      
      if [ -z "$failure_reason" ]; then
        failure_reason="Unknown failure"
      fi
    else
      result="✅ PASS"
      failure_reason="N/A"
    fi
    
    # Add to the table
    echo "| $count | $filename | $purpose | $test_count | $result | $failure_reason |"
    
    ((count++))
  done < <(find __tests__ -name "*.js" -o -name "*.ts" -o -name "*.tsx" | sort)
  
  # Add summary row
  total_files=0
  while IFS= read -r file; do
    ((total_files++))
  done < <(find __tests__ -name "*.js" -o -name "*.ts" -o -name "*.tsx")
  
  passing_files=0
  while IFS= read -r line; do
    if [[ "$line" =~ PASS ]]; then
      ((passing_files++))
    fi
  done < <(echo "$test_output")
  
  failing_files=0
  while IFS= read -r line; do
    if [[ "$line" =~ FAIL ]]; then
      ((failing_files++))
    fi
  done < <(echo "$test_output")
  
  # Extract total tests, passing tests, and failing tests using pure bash
  total_tests="Unknown"
  passing_tests="Unknown"
  failing_tests="Unknown"
  
  if [[ "$test_output" =~ Tests:[[:space:]]*([0-9]+)[[:space:]]failed,[[:space:]]*([0-9]+)[[:space:]]passed,[[:space:]]*([0-9]+)[[:space:]]total ]]; then
    failing_tests="${BASH_REMATCH[1]}"
    passing_tests="${BASH_REMATCH[2]}"
    total_tests="${BASH_REMATCH[3]}"
  elif [[ "$test_output" =~ Tests:[[:space:]]*([0-9]+)[[:space:]]passed,[[:space:]]*([0-9]+)[[:space:]]total ]]; then
    passing_tests="${BASH_REMATCH[1]}"
    total_tests="${BASH_REMATCH[2]}"
    failing_tests=0
  fi
  
  echo "| - | **SUMMARY** | **All Tests** | **$total_tests** | **$passing_files/$total_files PASS** | **$failing_tests failing, $passing_tests passing** |"
}

# Run tests
echo -e "\n${YELLOW}Running tests...${NC}"
TEST_OUTPUT=$(npm test || true)
echo "$TEST_OUTPUT"

# Generate and display test summary table
echo -e "\n${GREEN}Test Summary Table:${NC}"
generate_test_summary "$TEST_OUTPUT"

# Check if tests failed
if echo "$TEST_OUTPUT" | grep -q "FAIL"; then
  echo -e "\n${RED}Tests failed! Build aborted.${NC}"
  exit 1
fi

echo -e "\n${GREEN}All tests passed successfully!${NC}"

# Increment version
echo -e "\n${YELLOW}Incrementing version...${NC}"
npm version patch

# Get the new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}New version: $NEW_VERSION${NC}"

# Generate changelog
echo -e "\n${YELLOW}Generating changelog...${NC}"
echo "## Version $NEW_VERSION - $(date +%Y-%m-%d)" > CHANGELOG.md.new
echo "" >> CHANGELOG.md.new
git log --pretty=format:"- %s" $(git describe --tags --abbrev=0 @^)..@ >> CHANGELOG.md.new
echo "" >> CHANGELOG.md.new
echo "" >> CHANGELOG.md.new
cat CHANGELOG.md >> CHANGELOG.md.new
mv CHANGELOG.md.new CHANGELOG.md

# Commit changelog
git add CHANGELOG.md
git commit -m "Update CHANGELOG.md for version $NEW_VERSION"

# Build the application
echo -e "\n${YELLOW}Building the application...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "\n${RED}Build failed! Deployment aborted.${NC}"
  exit 1
fi
echo -e "\n${GREEN}Build completed successfully!${NC}"

# Display git status after build
echo -e "\n${YELLOW}Git status after build:${NC}"
git status

# Check if there are any uncommitted changes from the build
if [[ -n $(git status -s) ]]; then
  echo -e "\n${YELLOW}Committing build artifacts...${NC}"
  git add .
  git commit -m "Build artifacts for version $NEW_VERSION"
fi

# Push changes
echo -e "\n${YELLOW}Pushing changes to remote...${NC}"
git push origin main
git push --tags

echo -e "\n${GREEN}Build and deploy completed successfully!${NC}"
echo -e "${GREEN}Version $NEW_VERSION is now ready for deployment.${NC}"
