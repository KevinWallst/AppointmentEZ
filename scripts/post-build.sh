#!/bin/bash

# post-build.sh
# Script to update version numbers after a successful build
# Usage: ./scripts/post-build.sh [patch|minor|major]

# Exit on any error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default version increment type
VERSION_TYPE=${1:-"patch"}

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

# Get current version from package.json
OLD_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}v$OLD_VERSION${NC}"

# Update version in package.json
step "Updating version in package.json ($VERSION_TYPE)"
npm version $VERSION_TYPE --no-git-tag-version || error "Failed to update version"

# Get new version from package.json
NEW_VERSION=$(node -p "require('./package.json').version")
success "Version updated from v$OLD_VERSION to v$NEW_VERSION"

# Update version in README.md
step "Updating version in README.md"
sed -i '' "s/# AppointmentEZ v$OLD_VERSION/# AppointmentEZ v$NEW_VERSION/g" README.md || error "Failed to update README.md"
success "Updated version in README.md"

# Commit version changes
step "Committing version changes"
git add package.json package-lock.json README.md || error "Failed to stage version changes"
git commit -m "Bump version to v$NEW_VERSION" || error "Failed to commit version changes"
success "Version changes committed"

# Push changes to remote repository
step "Pushing version changes to remote repository"
git push origin main || error "Failed to push version changes"
success "Version changes pushed to remote repository"

echo -e "\n${GREEN}==>${NC} ${GREEN}Version updated successfully!${NC}"
echo -e "New version: ${YELLOW}v$NEW_VERSION${NC}"
