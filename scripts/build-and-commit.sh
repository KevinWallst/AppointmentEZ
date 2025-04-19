#!/bin/bash

# build-and-commit.sh
# Script to build the project, run tests, and commit changes to Git
# Usage: ./scripts/build-and-commit.sh "Your commit message"

# Exit on any error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if commit message was provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: No commit message provided${NC}"
  echo "Usage: ./scripts/build-and-commit.sh \"Your commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"

# Function to display step information
step() {
  echo -e "\n${BLUE}==>${NC} ${YELLOW}$1${NC}"
}

# Function to display success message
success() {
  echo -e "${GREEN}✓${NC} $1"
}

# Function to display error message and exit
error() {
  echo -e "${RED}✗${NC} $1"
  exit 1
}

# Check if there are uncommitted changes
step "Checking for uncommitted changes"
if [[ -z $(git status -s) ]]; then
  echo "No changes to commit. Exiting."
  exit 0
fi

# Build the project
step "Building the project"
npm run build || error "Build failed"
success "Build completed successfully"

# Run tests
step "Running tests"
npm test || error "Tests failed"
success "All tests passed"

# Stage all changes
step "Staging changes for commit"
git add . || error "Failed to stage changes"
success "Changes staged"

# Commit changes
step "Committing changes"
git commit -m "$COMMIT_MESSAGE" || error "Failed to commit changes"
success "Changes committed with message: $COMMIT_MESSAGE"

# Push changes to remote repository
step "Pushing changes to remote repository"
git push origin main || error "Failed to push changes"
success "Changes pushed to remote repository"

# Update version in package.json if needed
# This is commented out but can be uncommented if you want to automatically increment version
# step "Updating version in package.json"
# npm version patch --no-git-tag-version || error "Failed to update version"
# success "Version updated"

echo -e "\n${GREEN}==>${NC} ${GREEN}Build, test, commit, and push completed successfully!${NC}"
echo -e "Commit message: ${YELLOW}$COMMIT_MESSAGE${NC}"

# Display current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}v$CURRENT_VERSION${NC}"
