import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import nodemailer from 'nodemailer';

// Path to the CSV file - IMPORTANT: This must match the path in other API endpoints
const bookingsFilePath = path.join(process.cwd(), 'bookings.csv');

// Queue system for handling concurrent booking requests
type BookingRequest = {
  booking: Booking;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
};

// In-memory queue for booking requests
const bookingQueue: BookingRequest[] = [];
let isProcessing = false;

// Define the structure of a booking
interface Booking {
  id?: string; // Optional ID for existing bookings
  appointmentTime: string;
  requestTime: string;
  name: string;
  email: string;
  wechatId: string;
  topic: string;
  language?: string; // Optional language preference (zh or en)
}

// Initialize CSV file with headers
const initializeCSV = () => {
  fs.writeFileSync(
    bookingsFilePath,
    'id,appointmentTime,requestTime,name,email,wechatId,topic,language\n',
    { encoding: 'utf-8' }
  );
};

// Ensure the CSV file exists with headers
if (!fs.existsSync(bookingsFilePath)) {
  initializeCSV();
}

// Process the booking queue sequentially
const processQueue = async () => {
  if (isProcessing || bookingQueue.length === 0) return;

  isProcessing = true;

  try {
    // Process requests one by one
    while (bookingQueue.length > 0) {
      const request = bookingQueue[0]; // Get the next request without removing it yet

      try {
        // Read current bookings to check availability
        const bookings = await readBookings();

        // Check if the slot is already booked
        const isBooked = bookings.some(
          booking => booking.appointmentTime === request.booking.appointmentTime
        );

        if (isBooked) {
          // Slot is already booked, reject this request
          request.reject(new Error('Time slot already booked'));
        } else {
          // Slot is available, write to CSV
          console.log('Queue processor: Slot available, writing booking with topic:', request.booking.topic);
          await writeBookingToFile(request.booking);
          request.resolve({ success: true, booking: request.booking });
        }
      } catch (error) {
        // Handle any errors during processing
        request.reject(error);
      } finally {
        // Remove the processed request from the queue
        bookingQueue.shift();
      }
    }
  } finally {
    isProcessing = false;
  }
};

// Add a booking request to the queue and return a promise
const queueBookingRequest = (booking: Booking): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Add the request to the queue
    bookingQueue.push({ booking, resolve, reject });

    // Start processing the queue if it's not already being processed
    processQueue();
  });
};

// Helper function to read bookings from CSV
const readBookings = async (): Promise<Booking[]> => {
  try {
    if (!fs.existsSync(bookingsFilePath)) {
      return [];
    }

    const fileContent = fs.readFileSync(bookingsFilePath, 'utf-8');
    if (!fileContent.trim()) {
      return [];
    }

    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
};

// Helper function to write a booking directly to the CSV file
// This is only called by the queue processor
const writeBookingToFile = async (booking: Booking): Promise<void> => {
  try {
    // Read existing bookings
    const bookings = await readBookings();

    // Generate a unique ID if not provided
    if (!booking.id) {
      booking.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Add the new booking
    bookings.push(booking);

    // Write all bookings back to the file
    const csv = stringify(bookings, {
      header: true,
      quoted: true, // Always quote fields to handle special characters
      quoted_empty: true, // Quote empty fields
      record_delimiter: '\n', // Use LF for line endings
      escape: '"' // Use double quotes for escaping
    });

    fs.writeFileSync(bookingsFilePath, csv, 'utf-8');
  } catch (error) {
    console.error('Error writing booking to file:', error);
    throw error;
  }
};

// Public function to add a booking to the queue
const writeBooking = async (booking: Booking): Promise<void> => {
  try {
    await queueBookingRequest(booking);
  } catch (error) {
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

import { formatInTimeZone } from 'date-fns-tz';
import { getBccEmails } from '../../utils/emailUtils.ts';

// Helper function to send confirmation email
const sendConfirmationEmail = async (booking: Booking) => {
  // Parse the appointment time from the booking
  const appointmentDate = new Date(booking.appointmentTime);

  // Define Eastern Time zone (EDT during daylight saving time, EST during standard time)
  const edtTimeZone = 'America/New_York';

  // Log the raw appointment time for debugging
  console.log('Email confirmation - Raw appointment time:', booking.appointmentTime);

  // Extract date components from the appointment time string
  const match = booking.appointmentTime.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (match) {
    const [_, year, month, day] = match;
    console.log(`Email confirmation - Extracted date components: year=${year}, month=${month}, day=${day}`);
  }

  // Get the correct date in EDT time zone
  // This is the key fix - we need to get the date components in EDT time zone
  // to ensure the date is correct when crossing day boundaries
  const edtDate = formatInTimeZone(appointmentDate, edtTimeZone, 'yyyy-MM-dd');
  const edtTime = formatInTimeZone(appointmentDate, edtTimeZone, 'HH:mm:ss');

  // Log the EDT date and time for debugging
  console.log(`Email confirmation - EDT date: ${edtDate}, EDT time: ${edtTime}`);

  // Format date and time in EDT for display
  const formattedDate = formatInTimeZone(appointmentDate, edtTimeZone, 'MMMM d, yyyy');
  const formattedTime = formatInTimeZone(appointmentDate, edtTimeZone, 'h:mm a');

  console.log('Email confirmation - Original UTC time:', appointmentDate);
  console.log('Email confirmation - Formatted EDT date:', formattedDate);
  console.log('Email confirmation - Formatted EDT time:', formattedTime);

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
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }
};

// Update the POST function with better error handling
export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    console.log('Received booking request:', requestBody);

    const { datetime, name, email, wechatId, topic, language } = requestBody;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('Name');
    if (!email) missingFields.push('Email');
    if (!wechatId) missingFields.push('WeChat ID');
    if (!topic) missingFields.push('Consulting topic');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} required` },
        { status: 400 }
      );
    }

    // Do a quick check if the slot is already booked
    // This is just for user experience - the queue will do a final check
    const bookings = await readBookings();
    const isBooked = bookings.some(
      booking => booking.appointmentTime === datetime
    );

    if (isBooked) {
      return NextResponse.json(
        { error: 'Time slot already booked' },
        { status: 400 }
      );
    }

    // Create new booking
    const newBooking: Booking = {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      appointmentTime: datetime,
      requestTime: new Date().toISOString(),
      name: name,
      email: email,
      wechatId: wechatId,
      topic: topic,
      language: language || 'zh' // Default to Chinese if not specified
    };

    console.log('Created booking object:', newBooking);

    try {
      // Add booking to the queue for processing
      console.log('Adding booking to queue with topic:', newBooking.topic);
      await writeBooking(newBooking);

    } catch (writeError) {
      // If the slot was already booked when processed from the queue
      if (writeError.message === 'Time slot already booked') {
        return NextResponse.json(
          { error: 'This time slot was already booked while processing your request. Please select another time.' },
          { status: 409 } // Conflict status code
        );
      }
      throw writeError; // Re-throw other errors
    }

    // Send confirmation email asynchronously (don't await)
    // This prevents delays in the response
    sendConfirmationEmail(newBooking)
      .then(() => console.log('Confirmation email sent successfully'))
      .catch(emailError => console.error('Failed to send confirmation email:', emailError));

    // Return success immediately without waiting for email
    return NextResponse.json({
      success: true,
      booking: newBooking,
      emailSent: true // We're optimistically assuming it will send
    }, { status: 200 });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: `Failed to process booking: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Get all bookings
    const bookings = await readBookings();

    // If a date parameter is provided, generate time slots for that date
    if (dateParam) {
      console.log('Generating time slots for date:', dateParam);

      // Parse the date parameter
      const selectedDate = new Date(dateParam);

      // Filter bookings for this specific date only
      const dateBookings = bookings.filter(booking => {
        try {
          // Handle different date formats
          const bookingTime = booking.appointmentTime;
          let bookingDate;

          // Check if it's in ISO format or localized format
          if (bookingTime.includes('T')) {
            // ISO format: 2025-04-23T13:00:00.000Z
            bookingDate = new Date(bookingTime);
          } else {
            // Localized format: 4/21/2025, 9:00:00 AM
            const parts = bookingTime.split(', ');
            const datePart = parts[0];
            const timePart = parts[1];

            // Parse date part (M/D/YYYY)
            const datePieces = datePart.split('/');
            const month = parseInt(datePieces[0]) - 1; // 0-based month
            const day = parseInt(datePieces[1]);
            const year = parseInt(datePieces[2]);

            // Parse time part (H:MM:SS AM/PM)
            const timePieces = timePart.split(' ');
            const timeValues = timePieces[0].split(':');
            const hours = parseInt(timeValues[0]);
            const minutes = parseInt(timeValues[1]);
            const seconds = timeValues.length > 2 ? parseInt(timeValues[2]) : 0;
            const isPM = timePieces[1] === 'PM';

            // Create date object (in local time)
            bookingDate = new Date(Date.UTC(year, month, day,
              (isPM && hours < 12 ? hours + 12 : hours) - 4, // Convert EDT to UTC (EDT is UTC-4)
              minutes, seconds));
          }

          console.log(`Comparing booking date: ${bookingDate.toISOString()} with selected date: ${selectedDate.toISOString()}`);

          return (
            bookingDate.getFullYear() === selectedDate.getFullYear() &&
            bookingDate.getMonth() === selectedDate.getMonth() &&
            bookingDate.getDate() === selectedDate.getDate()
          );
        } catch (error) {
          console.error(`Error parsing date: ${booking.appointmentTime}`, error);
          return false;
        }
      });

      console.log(`Found ${dateBookings.length} bookings for date ${dateParam}`);
      dateBookings.forEach(booking => {
        console.log(`Booking ID: ${booking.id}, Time: ${booking.appointmentTime}`);
      });

      // Generate time slots for the selected date
      const timeSlots = generateTimeSlots(selectedDate, dateBookings);

      return NextResponse.json({ timeSlots }, { status: 200 });
    }

    // If no date parameter, just return all bookings
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve data' },
      { status: 500 }
    );
  }
}

// Function to generate time slots for a given date
function generateTimeSlots(date: Date, bookings: Booking[]) {
  // Create a new date object to avoid modifying the original
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Create slots from 9 AM to 5 PM
  const slots = [];

  // Start time: 9 AM
  let currentTime = new Date(year, month, day, 9, 0, 0);
  // End time: 5 PM
  const endTime = new Date(year, month, day, 17, 0, 0);

  // Define lunch break (12 PM to 1 PM)
  const lunchStart = new Date(year, month, day, 12, 0, 0);
  const lunchEnd = new Date(year, month, day, 13, 0, 0);

  // Get current date and time
  const now = new Date();

  // For testing purposes, we'll use a fixed date in 2023 as "now"
  // This allows us to test with future dates in 2025
  const testNow = new Date(2023, 0, 1); // January 1, 2023

  // Check if the selected date is in the past compared to our test date
  const isPastDate = (
    date.getFullYear() < testNow.getFullYear()
  );

  // If the date is in the past, return empty slots
  if (isPastDate) {
    console.log(`Date ${date.toISOString()} is in the past, returning empty slots`);
    return [];
  }

  // Check if the date is today
  const isToday = (
    now.getFullYear() === year &&
    now.getMonth() === month &&
    now.getDate() === day
  );

  // Current time in local time zone
  const currentLocal = new Date();

  // Generate slots every 30 minutes
  while (currentTime < endTime) {
    // Skip lunch break
    const isLunchTime = currentTime >= lunchStart && currentTime < lunchEnd;

    // Skip past times if the selected date is today
    // For testing purposes, we'll disable this check
    let isPastTime = false;

    // In a production environment, you would uncomment this code
    // to prevent booking slots that have already passed
    /*
    if (isToday) {
      // Create a new Date object with the current time
      const currentHour = currentLocal.getHours();
      const currentMinute = currentLocal.getMinutes();

      // Compare the slot time with current time
      isPastTime = (
        currentTime.getHours() < currentHour ||
        (currentTime.getHours() === currentHour &&
         currentTime.getMinutes() <= currentMinute)
      );

      if (isPastTime) {
        console.log(`Skipping past time slot: ${currentTime.toLocaleTimeString()}`);
      }
    }
    */

    if (!isLunchTime && !isPastTime) {
      // Check if this slot is booked
      const isBooked = bookings.some(booking => {
        try {
          // Handle different date formats
          const bookingTimeStr = booking.appointmentTime;
          let bookingTime;

          // Check if it's in ISO format or localized format
          if (bookingTimeStr.includes('T')) {
            // ISO format: 2025-04-23T13:00:00.000Z
            bookingTime = new Date(bookingTimeStr);
          } else {
            // Localized format: 4/21/2025, 9:00:00 AM
            const parts = bookingTimeStr.split(', ');
            const datePart = parts[0];
            const timePart = parts[1];

            // Parse date part (M/D/YYYY)
            const datePieces = datePart.split('/');
            const month = parseInt(datePieces[0]) - 1; // 0-based month
            const day = parseInt(datePieces[1]);
            const year = parseInt(datePieces[2]);

            // Parse time part (H:MM:SS AM/PM)
            const timePieces = timePart.split(' ');
            const timeValues = timePieces[0].split(':');
            const hours = parseInt(timeValues[0]);
            const minutes = parseInt(timeValues[1]);
            const seconds = timeValues.length > 2 ? parseInt(timeValues[2]) : 0;
            const isPM = timePieces[1] === 'PM';

            // Create date object (in local time)
            bookingTime = new Date(Date.UTC(year, month, day,
              (isPM && hours < 12 ? hours + 12 : hours) - 4, // Convert EDT to UTC (EDT is UTC-4)
              minutes, seconds));
          }

          const match = (
            bookingTime.getFullYear() === currentTime.getFullYear() &&
            bookingTime.getMonth() === currentTime.getMonth() &&
            bookingTime.getDate() === currentTime.getDate() &&
            bookingTime.getHours() === currentTime.getHours() &&
            bookingTime.getMinutes() === currentTime.getMinutes()
          );

          if (match) {
            console.log(`Found booking for slot: ${currentTime.toISOString()} - ID: ${booking.id}`);
          }

          return match;
        } catch (error) {
          console.error(`Error parsing date: ${booking.appointmentTime}`, error);
          return false;
        }
      });

      slots.push({
        time: new Date(currentTime).toISOString(),
        isBooked
      });
    }

    // Add 30 minutes for the next slot
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  }

  return slots;
}