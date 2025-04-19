# AppointmentEZ v0.2.0 - Render Build

This build has been prepared for deployment on Render.com's free tier.

## Changes Made

1. Updated version to 0.2.0
2. Added Render-specific build and start scripts in package.json
3. Created render.yaml configuration file
4. Added health check endpoint at /api/health
5. Created comprehensive .gitignore file
6. Added .env.example file for reference
7. Created Procfile for Render deployment
8. Updated README.md with Render deployment instructions

## Deployment Instructions

1. Push this code to a GitHub repository
2. Sign up for a Render account at https://dashboard.render.com/register
3. In the Render dashboard, click **New > Web Service**
4. Connect your GitHub repository
5. Use the following settings:
   - **Name**: appointmentez (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm run render-start`
   - **Plan**: Free

## Environment Variables

Make sure to set these environment variables in the Render dashboard:

- EMAIL_USER=your-email@gmail.com
- EMAIL_PASS=your-app-password
- EMAIL_HOST=smtp.gmail.com
- EMAIL_PORT=587
- BASE_URL=https://your-render-app-name.onrender.com
- PORT=3000 (configured to match existing code that references port 3000)

## Important Notes for Free Tier

- Free tier services will spin down after 15 minutes of inactivity
- Initial loading after inactivity may take up to 30 seconds
- Limited to 750 hours of usage per month
- For production use, consider upgrading to a paid plan
