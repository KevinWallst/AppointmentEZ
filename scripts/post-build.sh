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

# Function to display warning message
warning() {
  echo -e "${YELLOW}!${NC} $1"
}

# Function to display error message and exit
error() {
  echo -e "${RED}✗${NC} $1"
  echo -e "${BLUE}==>${NC} ${RED}Build failed 😞${NC}"
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

# First, check if README.md exists in the current directory
if [ -f "./README.md" ]; then
  # Check if the file contains the AppointmentEZ title with a version
  if grep -q "# AppointmentEZ v" "./README.md"; then
    # Use a more flexible pattern that matches any version number
    sed -i.bak "s/# AppointmentEZ v[0-9]*\.[0-9]*\.[0-9]*/# AppointmentEZ v$NEW_VERSION/g" "./README.md" && \
    rm -f "./README.md.bak" && \
    success "Updated version in README.md" || \
    warning "Failed to update README.md with sed, but continuing build"
  else
    # If the title doesn't exist, add it at the beginning of the file
    echo -e "# AppointmentEZ v$NEW_VERSION\n\n$(cat ./README.md)" > ./README.md.new && \
    mv ./README.md.new ./README.md && \
    success "Added version to README.md" || \
    warning "Failed to add version to README.md, but continuing build"
  fi
else
  # Create README.md if it doesn't exist
  echo -e "# AppointmentEZ v$NEW_VERSION\n\nAppointmentEZ is a simple and elegant appointment booking system." > ./README.md && \
  success "Created README.md with version" || \
  warning "Failed to create README.md, but continuing build"
fi

# Try to find README.md in other common locations
if [ ! -f "./README.md" ]; then
  for dir in "." ".." "../.." "/opt/render/project/src"; do
    if [ -f "$dir/README.md" ]; then
      echo "Found README.md in $dir"
      # Try to update it there
      if grep -q "# AppointmentEZ v" "$dir/README.md"; then
        sed -i.bak "s/# AppointmentEZ v[0-9]*\.[0-9]*\.[0-9]*/# AppointmentEZ v$NEW_VERSION/g" "$dir/README.md" && \
        rm -f "$dir/README.md.bak" && \
        success "Updated version in $dir/README.md" || \
        warning "Failed to update README.md in $dir, but continuing build"
      else
        warning "README.md found in $dir but doesn't contain version pattern"
      fi
      break
    fi
  done
fi

# Commit version changes - don't exit on error
step "Committing version changes"
git add package.json package-lock.json || warning "Failed to stage package.json changes, but continuing build"
[ -f "./README.md" ] && git add README.md || warning "README.md not found for git add, but continuing build"

git commit -m "Bump version to v$NEW_VERSION" || warning "Failed to commit version changes, but continuing build"
success "Version changes committed"

# Push changes to remote repository - don't exit on error
step "Pushing version changes to remote repository"
git push origin main || warning "Failed to push version changes, but continuing build"
success "Version changes pushed to remote repository"

echo -e "\n${GREEN}==>${NC} ${GREEN}Version updated successfully!${NC}"
echo -e "New version: ${YELLOW}v$NEW_VERSION${NC}"
