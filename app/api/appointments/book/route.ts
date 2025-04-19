import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { formatInTimeZone } from 'date-fns-tz';
import { getBccEmails } from '../../../utils/emailUtils';

// Define the booking interface
interface Booking {
  id: string;
  appointmentTime: string;
  requestTime: string;
  name: string;
  email: string;
  wechatId: string;
  topic: string;
  language?: string; // Optional language preference
}

// Path to the CSV file - IMPORTANT: This must match the path in app/api/bookings/route.ts
const csvFilePath = path.join(process.cwd(), 'bookings.csv');

// Ensure the data directory exists - Not needed anymore since we're using the root directory
const ensureDataDirExists = () => {
  // No need to create a directory since we're using the root directory
  // This function is kept for compatibility with existing code
};

// Read bookings from CSV - This should match the function in app/api/bookings/route.ts
const readBookings = (): Booking[] => {
  ensureDataDirExists();

  if (!fs.existsSync(csvFilePath)) {
    console.log('CSV file does not exist:', csvFilePath);
    return [];
  }

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  if (!fileContent.trim()) {
    console.log('CSV file is empty');
    return [];
  }

  try {
    const bookings = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    console.log(`Successfully parsed ${bookings.length} bookings from CSV`);
    return bookings;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
};

// Write bookings to CSV - This should match the function in app/api/bookings/route.ts
const writeBookings = (bookings: Booking[]) => {
  ensureDataDirExists();

  try {
    const csv = stringify(bookings, {
      header: true,
      quoted: true, // Always quote fields to handle special characters
      quoted_empty: true, // Quote empty fields
      record_delimiter: '\n', // Use LF for line endings
      escape: '"' // Use double quotes for escaping
    });

    fs.writeFileSync(csvFilePath, csv, 'utf-8');
    console.log(`Successfully wrote ${bookings.length} bookings to CSV file: ${csvFilePath}`);
  } catch (error) {
    console.error('Error writing bookings to CSV:', error);
    throw error;
  }
};

// Check if a time slot is available
const isTimeSlotAvailable = (bookings: Booking[], appointmentTime: string): boolean => {
  const newAppointmentTime = new Date(appointmentTime);

  return !bookings.some(booking => {
    const existingAppointmentTime = new Date(booking.appointmentTime);

    return (
      existingAppointmentTime.getFullYear() === newAppointmentTime.getFullYear() &&
      existingAppointmentTime.getMonth() === newAppointmentTime.getMonth() &&
      existingAppointmentTime.getDate() === newAppointmentTime.getDate() &&
      existingAppointmentTime.getHours() === newAppointmentTime.getHours() &&
      existingAppointmentTime.getMinutes() === newAppointmentTime.getMinutes()
    );
  });
};

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Only during development
  }
});

// Helper function to send confirmation email
const sendConfirmationEmail = async (booking: Booking) => {
  // Parse the appointment time from the booking
  const appointmentDate = new Date(booking.appointmentTime);

  // Define Eastern Time zone (EDT during daylight saving time, EST during standard time)
  const edtTimeZone = 'America/New_York';

  // Format date and time in EDT for display
  const formattedDate = formatInTimeZone(appointmentDate, edtTimeZone, 'MMMM d, yyyy');
  const formattedTime = formatInTimeZone(appointmentDate, edtTimeZone, 'h:mm a');

  // Get the base URL from environment or use a default
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Create a unique cancellation link with appointment details and language preference
  // Default to Chinese (zh) if no language is specified
  const language = booking.language || 'zh';
  const cancelUrl = `${baseUrl}/cancel?datetime=${encodeURIComponent(booking.appointmentTime)}&email=${encodeURIComponent(booking.email)}&name=${encodeURIComponent(booking.name)}&wechatId=${encodeURIComponent(booking.wechatId)}&topic=${encodeURIComponent(booking.topic)}&lang=${language}`;

  const mailOptions = {
    from: `"预约系统" <${process.env.EMAIL_USER}>`,
    to: booking.email,
    bcc: getBccEmails(),
    subject: '预约确认',
    html: `
      <h2>预约确认</h2>
      <p>尊敬的 ${booking.name},</p>
      <p>您的预约已经确认：</p>
      <p><strong>日期：</strong> ${formattedDate}</p>
      <p><strong>时间：</strong> ${formattedTime} (EDT - 美国东部时间/纽约时间)</p>
      <p><strong>主题：</strong> ${booking.topic}</p>
      <p>我们将在预约时间通过微信联系您 (ID: ${booking.wechatId}).</p>
      <p>如果您想取消预约，请点击下面的按钮：</p>
      <p>
        <a href="${cancelUrl}" style="display: inline-block; background-color: #f44336; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
          取消预约
        </a>
      </p>
      <p>您可以通过访问我们的<a href="${baseUrl}">预约页面</a>预约更多时间。</p>
      <p>谢谢！</p>
    `
  };

  try {
    console.log('Attempting to send email with the following configuration:');
    console.log('From:', mailOptions.from);
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    // Log SMTP configuration without accessing options directly
    console.log('Using SMTP configuration from environment variables');

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error code:', error.code || 'No error code');
    console.error('Error command:', error.command || 'No command info');

    // Don't throw, just return null to indicate failure
    return null;
  }
};

export async function POST(request: Request) {
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('=== BOOKING API ENDPOINT CALLED ===');
  console.log('='.repeat(80));
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);
  console.log('Request headers:', Object.fromEntries([...request.headers]));

  try {
    // Parse the request body
    let data;
    try {
      const requestText = await request.text();
      console.log('Raw request body:', requestText);

      try {
        data = JSON.parse(requestText);
        console.log('Request body parsed successfully:', JSON.stringify(data, null, 2));
      } catch (jsonError) {
        console.error('ERROR PARSING JSON:', jsonError);
        console.error('Invalid JSON text:', requestText);
        return NextResponse.json(
          { error: 'Invalid JSON in request body', details: String(jsonError) },
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error('ERROR READING REQUEST BODY:', parseError);
      return NextResponse.json(
        { error: 'Could not read request body', details: String(parseError) },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.appointmentTime || !data.name || !data.email || !data.wechatId || !data.topic) {
      console.error('ERROR: Missing required fields');
      console.error('Received data:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the appointment time is in the past
    const appointmentTime = new Date(data.appointmentTime);
    const now = new Date();

    if (appointmentTime < now) {
      return NextResponse.json(
        { error: 'Cannot book appointments in the past' },
        { status: 400 }
      );
    }

    // Read existing bookings
    console.log('Reading existing bookings from:', csvFilePath);
    let bookings = readBookings();
    console.log(`Found ${bookings.length} existing bookings`);

    // Check if the time slot is available
    console.log('Checking if time slot is available:', data.appointmentTime);
    if (!isTimeSlotAvailable(bookings, data.appointmentTime)) {
      console.error('ERROR: Time slot is already booked');
      console.error('Appointment time:', data.appointmentTime);
      console.error('Conflicting bookings:', bookings.filter(booking => {
        const bookingTime = new Date(booking.appointmentTime);
        const newTime = new Date(data.appointmentTime);
        return (
          bookingTime.getFullYear() === newTime.getFullYear() &&
          bookingTime.getMonth() === newTime.getMonth() &&
          bookingTime.getDate() === newTime.getDate() &&
          bookingTime.getHours() === newTime.getHours() &&
          bookingTime.getMinutes() === newTime.getMinutes()
        );
      }).map(b => JSON.stringify(b, null, 2)));
      console.error('Stack trace:', new Error().stack);

      return NextResponse.json(
        {
          error: 'Time slot is already booked',
          details: 'The requested time slot is already booked by another user.'
        },
        { status: 409 }
      );
    }
    console.log('Time slot is available');

    // Re-read the bookings file to ensure we have the latest data before proceeding
    // This helps prevent race conditions where another booking might have been made
    // between our initial check and when we try to write the new booking
    console.log('Re-reading bookings file to ensure latest data...');
    const latestBookings = readBookings();
    console.log(`Re-read ${latestBookings.length} bookings`);

    // Check again if the time slot is still available
    if (!isTimeSlotAvailable(latestBookings, data.appointmentTime)) {
      console.error('ERROR: Time slot was booked by someone else while processing');
      console.error('Appointment time:', data.appointmentTime);
      console.error('Conflicting bookings in latest data:', latestBookings.filter(booking => {
        const bookingTime = new Date(booking.appointmentTime);
        const newTime = new Date(data.appointmentTime);
        return (
          bookingTime.getFullYear() === newTime.getFullYear() &&
          bookingTime.getMonth() === newTime.getMonth() &&
          bookingTime.getDate() === newTime.getDate() &&
          bookingTime.getHours() === newTime.getHours() &&
          bookingTime.getMinutes() === newTime.getMinutes()
        );
      }).map(b => JSON.stringify(b, null, 2)));
      console.error('Stack trace:', new Error().stack);
      console.error('Original bookings count:', bookings.length);
      console.error('Latest bookings count:', latestBookings.length);

      // Compare the two booking arrays to see what changed
      const originalIds = new Set(bookings.map(b => b.id));
      const newBookings = latestBookings.filter(b => !originalIds.has(b.id));
      console.error('New bookings added between checks:', newBookings.map(b => JSON.stringify(b, null, 2)));

      return NextResponse.json(
        {
          error: 'Time slot is already booked',
          details: 'The slot was booked by someone else while processing your request',
          debug: {
            requestTime: new Date().toISOString(),
            appointmentTime: data.appointmentTime,
            conflictCount: latestBookings.filter(booking => {
              const bookingTime = new Date(booking.appointmentTime);
              const newTime = new Date(data.appointmentTime);
              return (
                bookingTime.getFullYear() === newTime.getFullYear() &&
                bookingTime.getMonth() === newTime.getMonth() &&
                bookingTime.getDate() === newTime.getDate() &&
                bookingTime.getHours() === newTime.getHours() &&
                bookingTime.getMinutes() === newTime.getMinutes()
              );
            }).length
          }
        },
        { status: 409 }
      );
    }
    console.log('Time slot is still available after double-check');

    // Use the latest bookings data
    bookings = latestBookings;


    // Create a new booking with a unique ID
    const bookingId = uuidv4();
    console.log('Generated new booking ID:', bookingId);

    const newBooking: Booking = {
      id: bookingId,
      appointmentTime: data.appointmentTime,
      requestTime: new Date().toISOString(),
      name: data.name,
      email: data.email,
      wechatId: data.wechatId,
      topic: data.topic,
      language: data.language || 'zh' // Default to Chinese if not specified
    };

    console.log('Created new booking:', JSON.stringify(newBooking, null, 2));

    // Add the new booking to the list
    bookings.push(newBooking);
    console.log(`Added new booking to list. Total bookings: ${bookings.length}`);

    // Write the updated bookings to the CSV file
    console.log('Writing updated bookings to CSV file');
    writeBookings(bookings);
    console.log('Successfully wrote bookings to CSV file');


    // Send confirmation email
    let emailSent = false;
    try {
      // Check if email credentials are available
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('Email credentials not found in environment variables');
        console.warn('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
        console.warn('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');
      } else {
        const emailResult = await sendConfirmationEmail(newBooking);
        if (emailResult) {
          console.log('Confirmation email sent successfully');
          emailSent = true;
        } else {
          console.warn('Email sending returned null, indicating failure');
        }
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      console.error('Error details:', emailError instanceof Error ? emailError.message : String(emailError));
      console.error('Error stack:', emailError instanceof Error ? emailError.stack : 'No stack trace');
      // Continue with the response even if email fails
    }

    return NextResponse.json(
      { success: true, booking: newBooking, emailSent: emailSent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error booking appointment:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Provide more specific error message if available
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
