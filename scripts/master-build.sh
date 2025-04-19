#!/bin/bash

# master-build.sh
# Master script to run the entire build, test, and deployment process
# Usage: ./scripts/master-build.sh "Feature description" [patch|minor|major]

# Exit on any error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if feature description was provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: No feature description provided${NC}"
  echo "Usage: ./scripts/master-build.sh \"Feature description\" [patch|minor|major]"
  exit 1
fi

FEATURE_DESCRIPTION="$1"
VERSION_TYPE=${2:-"patch"}

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}Error: Invalid version type. Use 'patch', 'minor', or 'major'${NC}"
  exit 1
fi

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

# Make sure all scripts are executable
chmod +x scripts/*.sh

# Step 1: Update CHANGELOG.md
step "Step 1: Updating CHANGELOG.md"
./scripts/pre-build.sh "$FEATURE_DESCRIPTION" || error "Failed to update CHANGELOG.md"
success "CHANGELOG.md updated"

# Step 2: Build and commit changes
step "Step 2: Building and committing changes"
./scripts/build-and-commit.sh "$FEATURE_DESCRIPTION" || error "Failed to build and commit changes"
success "Changes built and committed"

# Step 3: Update version numbers
step "Step 3: Updating version numbers"
./scripts/post-build.sh "$VERSION_TYPE" || error "Failed to update version numbers"
success "Version numbers updated"

echo -e "\n${GREEN}==>${NC} ${GREEN}Master build process completed successfully!${NC}"
echo -e "Feature: ${YELLOW}$FEATURE_DESCRIPTION${NC}"
echo -e "Version type: ${YELLOW}$VERSION_TYPE${NC}"

# Display current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}v$CURRENT_VERSION${NC}"
