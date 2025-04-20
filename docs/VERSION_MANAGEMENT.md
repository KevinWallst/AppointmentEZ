# Version Management in AppointmentEZ

This document explains how version numbers are managed in the AppointmentEZ project.

## Versioning Scheme

AppointmentEZ follows [Semantic Versioning](https://semver.org/) (SemVer) with the format `MAJOR.MINOR.PATCH`:

- **MAJOR**: Incremented for incompatible API changes
- **MINOR**: Incremented for new functionality in a backward compatible manner
- **PATCH**: Incremented for backward compatible bug fixes

## Automatic Version Updates

The version number is automatically updated during the build process:

1. The `scripts/update-version.js` script runs before each build (as part of the `prebuild` script)
2. It increments the patch version number (e.g., from 0.2.1 to 0.2.2)
3. It updates the `package.json` file with the new version
4. It adds a new entry to the `CHANGELOG.md` file with:
   - The new version number
   - The current date
   - Recent commit messages
   - Git diff showing the changes

## Manual Version Updates

For major or minor version updates, you should manually update the version number:

```bash
# Edit package.json to update the version number
# For example, change "version": "0.2.1" to "version": "0.3.0"

# Then update the CHANGELOG.md file with the new version and changes
```

## Version History

All version changes are documented in the `CHANGELOG.md` file, which includes:

- Version number
- Release date
- Changes made in each version
- Git diff showing the exact code changes

## Build Process Integration

The version update process is integrated into the build process:

1. When you run `npm run build`, the `prebuild` script runs first
2. The `prebuild` script runs `scripts/update-version.js` to update the version
3. Then it runs `scripts/validate-build-config.js` to validate the build configuration
4. Finally, the actual build process runs

This ensures that every build has a unique version number and all changes are documented in the `CHANGELOG.md` file.
