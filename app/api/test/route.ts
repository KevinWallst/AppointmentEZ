import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
  details?: any;
}

export async function GET() {
  const results: TestResult[] = [];
  
  // Test 1: Check if bookings.csv exists and is readable
  try {
    const csvFilePath = path.join(process.cwd(), 'bookings.csv');
    if (fs.existsSync(csvFilePath)) {
      const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
      const bookingsCount = fileContent.trim().split('\n').length - 1; // Subtract 1 for the header
      
      results.push({
        name: 'Bookings CSV File',
        status: 'pass',
        message: `Bookings CSV file exists and is readable. Contains ${bookingsCount} bookings.`,
        details: {
          filePath: csvFilePath,
          fileSizeBytes: fs.statSync(csvFilePath).size,
          lastModified: fs.statSync(csvFilePath).mtime.toISOString(),
        }
      });
    } else {
      results.push({
        name: 'Bookings CSV File',
        status: 'fail',
        message: 'Bookings CSV file does not exist.',
      });
    }
  } catch (error) {
    results.push({
      name: 'Bookings CSV File',
      status: 'fail',
      message: `Error checking bookings CSV file: ${error.message}`,
    });
  }
  
  // Test 2: Check if settings.json exists and is readable
  try {
    const settingsPath = path.join(process.cwd(), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      
      results.push({
        name: 'Settings File',
        status: 'pass',
        message: 'Settings file exists and is valid JSON.',
        details: {
          filePath: settingsPath,
          fileSizeBytes: fs.statSync(settingsPath).size,
          lastModified: fs.statSync(settingsPath).mtime.toISOString(),
          hasEmailSettings: !!settings.emailSettings,
          hasAdminEmail: !!settings.emailSettings?.adminEmail,
        }
      });
    } else {
      results.push({
        name: 'Settings File',
        status: 'fail',
        message: 'Settings file does not exist.',
      });
    }
  } catch (error) {
    results.push({
      name: 'Settings File',
      status: 'fail',
      message: `Error checking settings file: ${error.message}`,
    });
  }
  
  // Test 3: Check if email configuration is valid
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPassword) {
      results.push({
        name: 'Email Configuration',
        status: 'fail',
        message: 'Email credentials are not configured in environment variables.',
      });
    } else {
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
      
      results.push({
        name: 'Email Configuration',
        status: 'pass',
        message: 'Email configuration is valid and connection to SMTP server was successful.',
        details: {
          emailUser,
          smtpHost: 'smtp.gmail.com',
        }
      });
    }
  } catch (error) {
    results.push({
      name: 'Email Configuration',
      status: 'fail',
      message: `Error checking email configuration: ${error.message}`,
    });
  }
  
  // Test 4: Check if API endpoints are working
  try {
    // Test bookings API
    const bookingsResponse = await fetch(new URL('/api/bookings', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
    
    if (bookingsResponse.ok) {
      const bookingsData = await bookingsResponse.json();
      
      results.push({
        name: 'Bookings API',
        status: 'pass',
        message: 'Bookings API endpoint is working.',
        details: {
          statusCode: bookingsResponse.status,
          bookingsCount: bookingsData.bookings?.length || 0,
        }
      });
    } else {
      results.push({
        name: 'Bookings API',
        status: 'fail',
        message: `Bookings API endpoint returned status ${bookingsResponse.status}.`,
      });
    }
    
    // Test health API
    const healthResponse = await fetch(new URL('/api/health', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      
      results.push({
        name: 'Health API',
        status: 'pass',
        message: 'Health API endpoint is working.',
        details: {
          statusCode: healthResponse.status,
          overallStatus: healthData.status,
        }
      });
    } else {
      results.push({
        name: 'Health API',
        status: 'fail',
        message: `Health API endpoint returned status ${healthResponse.status}.`,
      });
    }
  } catch (error) {
    results.push({
      name: 'API Endpoints',
      status: 'fail',
      message: `Error checking API endpoints: ${error.message}`,
    });
  }
  
  // Test 5: Check if filesystem is writable
  try {
    const testFilePath = path.join(process.cwd(), 'test-write-access.txt');
    
    // Try to write a test file
    fs.writeFileSync(testFilePath, `Test file created at ${new Date().toISOString()}`);
    
    // Try to read the test file
    const content = fs.readFileSync(testFilePath, 'utf-8');
    
    // Clean up the test file
    fs.unlinkSync(testFilePath);
    
    results.push({
      name: 'Filesystem Access',
      status: 'pass',
      message: 'Filesystem is writable and readable.',
      details: {
        testFilePath,
        writeTest: 'success',
        readTest: 'success',
        deleteTest: 'success',
      }
    });
  } catch (error) {
    results.push({
      name: 'Filesystem Access',
      status: 'fail',
      message: `Error checking filesystem access: ${error.message}`,
    });
  }
  
  // Calculate overall test status
  const failedTests = results.filter(result => result.status === 'fail');
  const overallStatus = failedTests.length === 0 ? 'pass' : 'fail';
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overallStatus,
    passedTests: results.length - failedTests.length,
    failedTests: failedTests.length,
    totalTests: results.length,
    results,
  });
}
