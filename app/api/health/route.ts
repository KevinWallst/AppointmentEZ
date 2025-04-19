import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import os from 'os';

// Define the health check response type
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  components: {
    database: {
      status: 'healthy' | 'unhealthy';
      message: string;
      details?: any;
    };
    email: {
      status: 'healthy' | 'unhealthy';
      message: string;
      details?: any;
    };
    filesystem: {
      status: 'healthy' | 'unhealthy';
      message: string;
      details?: any;
    };
  };
  systemInfo: {
    platform: string;
    nodeVersion: string;
    uptime: number;
    hostname: string;
    cpus: number;
  };
}

// Get system information
const getSystemInfo = () => {
  return {
    platform: process.platform,
    nodeVersion: process.version,
    uptime: process.uptime(),
    // Simplify hostname to avoid long strings
    hostname: os.hostname().split('.')[0],
    cpus: os.cpus().length,
  };
};

// Get settings from settings.json
const getSettings = () => {
  try {
    const settingsPath = path.join(process.cwd(), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(settingsData);
    }
    return null;
  } catch (error) {
    console.error('Error reading settings:', error);
    return null;
  }
};

// Check database (CSV file) health
const checkDatabaseHealth = () => {
  try {
    const csvFilePath = path.join(process.cwd(), 'bookings.csv');

    // Check if the file exists
    if (!fs.existsSync(csvFilePath)) {
      return {
        status: 'unhealthy' as const,
        message: 'Bookings CSV file does not exist',
      };
    }

    // Check if the file is readable
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

    // Check if the file has valid CSV structure (at least has a header)
    if (!fileContent.trim()) {
      return {
        status: 'unhealthy' as const,
        message: 'Bookings CSV file is empty',
      };
    }

    // Count the number of bookings
    const bookingsCount = fileContent.trim().split('\n').length - 1; // Subtract 1 for the header

    return {
      status: 'healthy' as const,
      message: 'Bookings database is healthy',
      details: {
        bookingsCount,
        fileSizeBytes: fs.statSync(csvFilePath).size,
        lastModified: fs.statSync(csvFilePath).mtime.toISOString(),
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy' as const,
      message: `Error checking database health: ${error.message}`,
      details: error,
    };
  }
};

// Check email service health
const checkEmailHealth = async () => {
  try {
    // Get email configuration from environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      return {
        status: 'unhealthy' as const,
        message: 'Email credentials are not configured',
      };
    }

    // Create a transporter but don't actually send an email
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify the connection configuration
    await transporter.verify();

    return {
      status: 'healthy' as const,
      message: 'Email service is healthy',
      details: {
        provider: 'Gmail SMTP',
        emailUser,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy' as const,
      message: `Error checking email health: ${error.message}`,
      details: error,
    };
  }
};

// Check filesystem health
const checkFilesystemHealth = () => {
  try {
    const testFilePath = path.join(process.cwd(), 'health-check-test.txt');

    // Try to write a test file
    fs.writeFileSync(testFilePath, `Health check test at ${new Date().toISOString()}`);

    // Try to read the test file
    const content = fs.readFileSync(testFilePath, 'utf-8');

    // Clean up the test file
    fs.unlinkSync(testFilePath);

    return {
      status: 'healthy' as const,
      message: 'Filesystem is healthy',
      details: {
        writeTest: 'success',
        readTest: 'success',
        deleteTest: 'success',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy' as const,
      message: `Error checking filesystem health: ${error.message}`,
      details: error,
    };
  }
};

// Removed memory health check to reduce performance impact

// Send alert email if there are health issues
const sendHealthAlertEmail = async (healthCheck: HealthCheckResponse) => {
  try {
    // Only send alert if the overall status is unhealthy
    if (healthCheck.status === 'healthy') {
      return;
    }

    // Get admin email from settings
    const settings = getSettings();
    const adminEmail = settings?.emailSettings?.adminEmail;

    if (!adminEmail) {
      console.error('Admin email not configured, cannot send health alert');
      return;
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Prepare unhealthy components list for the email
    const unhealthyComponents = Object.entries(healthCheck.components)
      .filter(([_, component]) => component.status === 'unhealthy')
      .map(([name, component]) => `<li><strong>${name}:</strong> ${component.message}</li>`)
      .join('');

    // Send the alert email
    await transporter.sendMail({
      from: `"AppointmentEZ System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: 'AppointmentEZ Health Check Alert',
      html: `
        <h2>AppointmentEZ Health Check Alert</h2>
        <p>The system health check has detected issues that require attention.</p>
        <p><strong>Timestamp:</strong> ${healthCheck.timestamp}</p>
        <p><strong>Environment:</strong> ${healthCheck.environment}</p>
        <p><strong>Version:</strong> ${healthCheck.version}</p>

        <h3>Unhealthy Components:</h3>
        <ul>
          ${unhealthyComponents}
        </ul>

        <p>Please check the system as soon as possible.</p>
        <p>For more details, visit the health check page at your admin dashboard.</p>
      `,
    });

    console.log('Health alert email sent to', adminEmail);
  } catch (error) {
    console.error('Failed to send health alert email:', error);
  }
};

export async function GET() {
  try {
    // Run all health checks
    const databaseHealth = checkDatabaseHealth();
    const emailHealth = await checkEmailHealth();
    const filesystemHealth = checkFilesystemHealth();

    // Get system information
    const systemInfo = getSystemInfo();

    // Determine overall health status
    const isHealthy =
      databaseHealth.status === 'healthy' &&
      emailHealth.status === 'healthy' &&
      filesystemHealth.status === 'healthy';

    // Create the health check response
    const healthCheck: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.2.0',
      environment: process.env.NODE_ENV || 'development',
      components: {
        database: databaseHealth,
        email: emailHealth,
        filesystem: filesystemHealth,
      },
      systemInfo,
    };

    // Send alert email if there are health issues
    if (!isHealthy) {
      await sendHealthAlertEmail(healthCheck);
    }

    // Return the health check response
    // Always return 200 so the health check page can display the information
    // The unhealthy status is still included in the response body
    return NextResponse.json(healthCheck, {
      status: 200,
    });
  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 }
    );
  }
}
