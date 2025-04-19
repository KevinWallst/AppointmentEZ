import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import nodemailer from 'nodemailer';
import { formatInTimeZone } from 'date-fns-tz';
import { getBccEmails } from '../../../utils/emailUtils.ts';

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

// Helper function to send cancellation email
const sendCancellationEmail = async (booking: Booking) => {
  // Parse the appointment time from the booking
  const appointmentDate = new Date(booking.appointmentTime);

  // Define Eastern Time zone (EDT during daylight saving time, EST during standard time)
  const edtTimeZone = 'America/New_York';

  // Format date and time in EDT for display
  const formattedDate = formatInTimeZone(appointmentDate, edtTimeZone, 'MMMM d, yyyy');
  const formattedTime = formatInTimeZone(appointmentDate, edtTimeZone, 'h:mm a');

  // Get the base URL from environment or use a default
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Determine language for the email (default to Chinese if not specified)
  const language = booking.language || 'zh';

  // Prepare email content based on language
  let subject, html;

  if (language === 'en') {
    // English email
    subject = 'Appointment Cancellation Confirmation';
    html = `
      <h2>Appointment Cancellation Confirmation</h2>
      <p>Dear ${booking.name || 'User'},</p>
      <p>Your appointment has been cancelled:</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${formattedTime} (EDT - Eastern Time/New York Time)</p>
      <p><strong>Topic:</strong> ${booking.topic || 'Not specified'}</p>
      <p>You can book a new appointment by visiting our <a href="${baseUrl}">booking page</a>.</p>
      <p>Thank you!</p>
    `;
  } else {
    // Chinese email (default)
    subject = '预约取消确认';
    html = `
      <h2>预约取消确认</h2>
      <p>尊敬的 ${booking.name || '用户'},</p>
      <p>您的以下预约已被取消：</p>
      <p><strong>日期：</strong> ${formattedDate}</p>
      <p><strong>时间：</strong> ${formattedTime} (EDT - 美国东部时间/纽约时间)</p>
      <p><strong>主题：</strong> ${booking.topic || '未指定'}</p>
      <p>您可以通过访问我们的<a href="${baseUrl}">预约页面</a>预约新的时间。</p>
      <p>谢谢！</p>
    `;
  }

  const mailOptions = {
    from: `"${language === 'en' ? 'Appointment System' : '预约系统'}" <${process.env.EMAIL_USER}>`,
    to: booking.email,
    bcc: getBccEmails(),
    subject: subject,
    html: html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Cancellation email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw new Error(`Failed to send cancellation email: ${error.message}`);
  }
};

// Helper function to handle both DELETE and POST requests
async function handleDeleteRequest(request: Request) {
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('=== DELETE API ENDPOINT CALLED ===');
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
    if (!data) {
      console.error('ERROR: Request body is empty or null');
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }

    if (!data.id) {
      console.error('ERROR: Missing booking ID');
      console.error('Received data:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: 'Missing booking ID' },
        { status: 400 }
      );
    }

    console.log('Looking for booking with ID:', data.id);

    // Read existing bookings
    let bookings;
    try {
      bookings = readBookings();
      console.log(`Found ${bookings.length} bookings in the system`);
    } catch (readError) {
      console.error('ERROR READING BOOKINGS:', readError);
      console.error('Error stack:', (readError as Error).stack);
      return NextResponse.json(
        { error: 'Error reading bookings database', details: String(readError) },
        { status: 500 }
      );
    }

    // Find the booking to delete
    console.log('Searching for booking with ID:', data.id);
    console.log('Booking ID type:', typeof data.id);

    // Dump all bookings for debugging
    console.log('=== ALL BOOKINGS IN THE SYSTEM ===');
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index}:`, JSON.stringify(booking, null, 2));
      console.log(`ID: ${booking.id}, Type: ${typeof booking.id}`);
      console.log(`ID equality test: ${booking.id === data.id}`);
      console.log('---');
    });

    // Try different comparison methods
    const bookingIndexExact = bookings.findIndex(booking => booking.id === data.id);
    const bookingIndexString = bookings.findIndex(booking => String(booking.id) === String(data.id));
    const bookingIndexLoose = bookings.findIndex(booking => booking.id == data.id);

    console.log(`Exact comparison (===) found at index: ${bookingIndexExact}`);
    console.log(`String comparison (String() === String()) found at index: ${bookingIndexString}`);
    console.log(`Loose comparison (==) found at index: ${bookingIndexLoose}`);

    // Use the most successful comparison method
    const bookingIndex = Math.max(bookingIndexExact, bookingIndexString, bookingIndexLoose);
    console.log(`Using index: ${bookingIndex}`);

    if (bookingIndex === -1) {
      // Log all bookings for debugging
      console.error('ERROR: BOOKING NOT FOUND');
      console.log('All booking IDs in the system:');
      bookings.forEach((booking, index) => {
        console.log(`Booking ${index}: ID=${booking.id}, Time=${booking.appointmentTime}`);
      });

      return NextResponse.json(
        { error: 'Booking not found', requestedId: data.id },
        { status: 404 }
      );
    }

    // Remove the booking
    const deletedBooking = bookings.splice(bookingIndex, 1)[0];
    console.log('Successfully deleted booking:', JSON.stringify(deletedBooking, null, 2));

    // Write the updated bookings to the CSV file
    try {
      writeBookings(bookings);
      console.log('Updated bookings file after deletion');
    } catch (writeError) {
      console.error('ERROR WRITING BOOKINGS:', writeError);
      console.error('Error stack:', (writeError as Error).stack);
      return NextResponse.json(
        { error: 'Error updating bookings database', details: String(writeError) },
        { status: 500 }
      );
    }

    // Send cancellation email
    try {
      await sendCancellationEmail(deletedBooking);
      console.log('Cancellation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      console.error('Error stack:', (emailError as Error).stack);
      // Continue with the response even if email fails
    }

    console.log('Sending successful response');
    const response = NextResponse.json(
      { success: true, booking: deletedBooking },
      { status: 200 }
    );
    console.log('Response created with status 200');
    console.log('='.repeat(80));
    console.log('=== DELETE API ENDPOINT COMPLETED SUCCESSFULLY ===');
    console.log('='.repeat(80));
    console.log('\n\n');
    return response;
  } catch (error) {
    console.error('='.repeat(80));
    console.error('=== ERROR IN DELETE APPOINTMENT HANDLER ===');
    console.error('='.repeat(80));
    console.error('Error object:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Non-Error object thrown:', String(error));
    }
    console.error('='.repeat(80));
    console.error('=== DELETE API ENDPOINT FAILED ===');
    console.error('='.repeat(80));
    console.log('\n\n');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Export DELETE handler
export async function DELETE(request: Request) {
  return handleDeleteRequest(request);
}

// Also export POST handler as a fallback
export async function POST(request: Request) {
  return handleDeleteRequest(request);
}
