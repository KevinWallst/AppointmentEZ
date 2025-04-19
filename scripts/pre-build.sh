#!/bin/bash

# pre-build.sh
# Script to update CHANGELOG.md before building
# Usage: ./scripts/pre-build.sh "Feature description"

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
  echo "Usage: ./scripts/pre-build.sh \"Feature description\""
  exit 1
fi

FEATURE_DESCRIPTION="$1"
DATE=$(date +%Y-%m-%d)
CHANGELOG_FILE="CHANGELOG.md"

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
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}v$CURRENT_VERSION${NC}"

# Check if CHANGELOG.md exists
step "Checking for CHANGELOG.md"
if [ ! -f "$CHANGELOG_FILE" ]; then
  echo "CHANGELOG.md does not exist. Creating it..."
  
  # Create CHANGELOG.md with initial content
  cat > "$CHANGELOG_FILE" << EOF
# AppointmentEZ Changelog

All notable changes to the AppointmentEZ project will be documented in this file.

## [$CURRENT_VERSION] - $DATE

### Added
- $FEATURE_DESCRIPTION

EOF
  success "Created CHANGELOG.md with initial content"
else
  # Update existing CHANGELOG.md
  step "Updating CHANGELOG.md"
  
  # Check if the current version already exists in the changelog
  if grep -q "## \[$CURRENT_VERSION\]" "$CHANGELOG_FILE"; then
    # Version exists, add the feature to the existing version
    sed -i '' "/## \[$CURRENT_VERSION\]/a\\
- $FEATURE_DESCRIPTION" "$CHANGELOG_FILE"
  else
    # Version doesn't exist, add a new version section
    sed -i '' "s/# AppointmentEZ Changelog/# AppointmentEZ Changelog\\
\\
## [$CURRENT_VERSION] - $DATE\\
\\
### Added\\
- $FEATURE_DESCRIPTION\\
/g" "$CHANGELOG_FILE"
  fi
  
  success "Updated CHANGELOG.md with new feature"
fi

echo -e "\n${GREEN}==>${NC} ${GREEN}CHANGELOG.md updated successfully!${NC}"
echo -e "Added feature: ${YELLOW}$FEATURE_DESCRIPTION${NC}"
