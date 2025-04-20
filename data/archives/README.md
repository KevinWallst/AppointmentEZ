# Booking Data Archives

This directory contains archived copies of the `bookings.csv` file, which stores all appointment data for the AppointmentEZ application.

## Purpose

These archives serve as backups to ensure booking data is not lost during deployments or server restarts. The archiving system:

1. Creates daily backups of the bookings.csv file
2. Maintains a history of up to 30 days of booking data
3. Provides a mechanism to restore data after deployments

## Files

- `bookings-YYYY-MM-DD-HH-MM-SS.csv`: Archived copies of the bookings.csv file
- `bookings-latest.csv`: Symbolic link to the most recent archive
- `archive-list.txt`: List of all available archives, sorted by date (newest first)

## Usage

### Manually Archive Current Bookings

```bash
npm run archive-bookings
```

### Restore from Latest Archive

```bash
npm run restore-bookings
```

### Post-Deployment Restore

This happens automatically when the server starts via the `render-start` script:

```bash
npm run post-deploy
```

## Automatic Archiving

The system is configured to automatically archive the bookings.csv file:

1. Daily at midnight (via cron job)
2. Before each deployment
3. When manually triggered

## Important Notes

- This directory is excluded from Git to prevent overwriting archives during deployments
- The Render.yaml configuration includes a persistent disk mount for this directory
- Only the last 30 archives are kept to manage disk space

## Troubleshooting

If booking data is lost:

1. Check this directory for the most recent archive
2. Run `npm run restore-bookings` to restore from the latest archive
3. If no archives exist, check the server logs for errors
