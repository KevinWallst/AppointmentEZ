# AppointmentEZ Changelog

All notable changes to the AppointmentEZ project will be documented in this file.

## [0.2.0] - 2025-04-19

### Added
- Two-step booking confirmation process
  - New BookingConfirmationModal component that shows all booking details before finalizing
  - Explicit confirmation required from users before booking is completed
  - Improved user experience with clear feedback during booking
  - Added translations for confirmation dialog in both English and Chinese
- System Test page in admin dashboard
  - Comprehensive test suite to verify system functionality
  - Tests for bookings CSV file, settings file, email configuration, API endpoints, and filesystem access
  - Visual indicators for test status with detailed information
- Settings management system
  - Created settings.json file with default application settings
  - Added GET endpoint to retrieve current settings
  - Implemented helper function to ensure settings file always exists
  - Updated SettingsContext to fetch settings from both localStorage and API

### Fixed
- System Test button in admin dashboard now works correctly
- Authentication mechanism in test page now uses the same key as other admin pages
- Health check API simplified to reduce memory usage
- Memory-intensive components removed to improve performance

### Changed
- Booking flow now requires explicit confirmation before finalizing
- Settings management now more robust with fallbacks and error handling
- Health check API returns 200 status code even when components are unhealthy

## [0.1.0] - 2025-04-01

### Added
- Initial release of AppointmentEZ
- Basic appointment booking functionality
- Admin dashboard for managing appointments
- Email notifications for bookings
- Multilingual support (English/Chinese)
- Responsive design for mobile and desktop
