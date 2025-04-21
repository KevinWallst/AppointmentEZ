# AppointmentEZ v0.2.15

AppointmentEZ is a simple and elegant appointment booking system that supports both Chinese and English languages and handles time zone differences automatically. Perfect for professionals who need to manage client appointments efficiently.

## Features

- **Bilingual Support**: Toggle between Chinese and English interfaces
- **Time Zone Handling**: Automatically adjusts for different time zones (all times are in Eastern Time - EST/EDT)
- **Two-Step Booking Confirmation**: Users can review their booking details before finalizing
- **Admin Dashboard**: Manage appointments with calendar and list views
- **System Testing**: Comprehensive test suite to verify system functionality
- **Email Notifications**: Automatic email confirmations with cancellation links
- **Responsive Design**: Works on desktop and mobile devices
- **Settings Management**: Customizable attorney name, styling, and email settings

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Testing

The application includes comprehensive tests to ensure correct time zone handling, date management, and system functionality.

### System Tests

Access the system test suite from the admin dashboard by clicking the "System Tests" button. This runs a series of tests to verify:

- Bookings CSV file integrity
- Settings file configuration
- Email configuration
- API endpoints functionality
- Filesystem access permissions

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only time zone specific tests
npm run test:timezone
```

### Time Zone Testing

We have implemented specific tests to ensure that the application correctly handles time zones, particularly for afternoon appointments. These tests verify that:

1. UTC to EST conversion preserves the correct date
2. EST to UTC conversion preserves the correct date
3. Time slot generation uses the correct EST offset
4. Afternoon appointments do not shift to the previous day

These tests run automatically:
- On every code push to the main branch
- On every pull request
- Before each commit (via pre-commit hook)

This ensures that the time zone handling remains correct as the codebase evolves.

## Deployment

### Local Deployment

```bash
# Build the application
npm run build

# Start the production server
npm start
```

### Render.com Deployment

This application is configured for easy deployment on Render.com's free tier:

1. Fork or clone this repository to your GitHub account
2. Sign up for a [Render account](https://dashboard.render.com/register)
3. In the Render dashboard, click **New > Web Service**
4. Connect your GitHub repository
5. Use the following settings:
   - **Name**: appointmentez (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm run render-start`
   - **Plan**: Free

Alternatively, you can use the **Deploy to Render** button below:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

#### Important Notes for Free Tier

- Free tier services will spin down after 15 minutes of inactivity
- Initial loading after inactivity may take up to 30 seconds
- Limited to 750 hours of usage per month
- For production use, consider upgrading to a paid plan

## Environment Variables

Create a `.env.local` file with the following variables:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
BASE_URL=http://localhost:3000
```

## Admin Access

Access the admin dashboard at `/admin/login` with these credentials:
- Username: admin
- Password: notpassword

## Data Storage

All appointments are stored in a CSV file (`bookings.csv`) in the root directory.

## Configuration

Application settings are stored in `settings.json` in the root directory. This file contains:

- Attorney name in both languages
- Title styling preferences
- Background configuration
- Email settings including BCC recipients and admin email

These settings can be modified through the System Maintenance tab in the admin dashboard.

## Repository Name

The repository folder name has been updated from 'CursorTest' to 'AppointmentEZ' to match the project name.

## Data Persistence

AppointmentEZ stores booking data in a CSV file (`bookings.csv`) at the root of the project. To ensure this data is not lost during deployments, an automatic archiving system has been implemented:

### Booking Data Archives

- Daily backups are created in the `data/archives` directory
- Archives are automatically restored after deployments
- Up to 30 days of booking history is maintained

### Manual Archive Commands

```bash
# Archive current bookings
npm run archive-bookings

# Restore from latest archive
npm run restore-bookings

# Run post-deployment restore (happens automatically on Render)
npm run post-deploy
```

### Render.com Configuration

The `render.yaml` file includes a persistent disk configuration to ensure the archives directory is preserved between deployments:

```yaml
disk:
  name: data
  mountPath: /opt/render/project/src/data
  sizeGB: 1
```

For more details, see the [archives README](data/archives/README.md).
