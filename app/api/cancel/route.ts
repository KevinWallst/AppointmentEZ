import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import nodemailer from 'nodemailer';

const bookingsFilePath = path.join(process.cwd(), 'bookings.csv');

// Define the structure of a booking
interface Booking {
  id: string;
  appointmentTime: string;
  requestTime: string;
  name: string;
  email: string;
  wechatId: string;
  topic: string;
  language?: string;
}

// Helper function to read bookings from CSV
const readBookings = (): Booking[] => {
  // Check if the file exists
  if (!fs.existsSync(bookingsFilePath)) {
    return [];
  }

  // Read the file content
  const fileContent = fs.readFileSync(bookingsFilePath, 'utf-8');
  if (!fileContent.trim()) {
    return [];
  }

  try {
    // Parse the CSV content
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
};

// Helper function to write bookings to CSV
const writeBookings = (bookings: Booking[]): void => {
  // Convert bookings to CSV string
  const csv = stringify(bookings, {
    header: true,
    quoted: true, // Always quote fields to handle special characters
    quoted_empty: true, // Quote empty fields
    record_delimiter: '\n', // Use LF for line endings
    escape: '"' // Use double quotes for escaping
  });

  // Write to file
  fs.writeFileSync(bookingsFilePath, csv, 'utf-8');
};

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

import { formatInTimeZone } from 'date-fns-tz';
import { getBccEmails } from '../../utils/emailUtils.ts';

// Helper function to send cancellation confirmation email
const sendCancellationEmail = async (booking: Booking, reason: string, language: string = 'zh') => {
  const appointmentDate = new Date(booking.appointmentTime);

  // Define Eastern Time zone (EDT during daylight saving time, EST during standard time)
  const edtTimeZone = 'America/New_York';

  // Format date and time in EDT for display
  const formattedDate = formatInTimeZone(appointmentDate, edtTimeZone, 'yyyy年MM月dd日');
  const formattedTime = formatInTimeZone(appointmentDate, edtTimeZone, 'HH:mm');

  // Get the base URL from environment or use a default
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

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
      <p><strong>WeChat ID:</strong> ${booking.wechatId || 'Not provided'}</p>
      <p><strong>Reason for cancellation:</strong> ${reason || 'No reason provided'}</p>
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
      <p><strong>微信ID：</strong> ${booking.wechatId || '未提供'}</p>
      <p><strong>取消原因：</strong> ${reason || '未提供原因'}</p>
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

// POST endpoint to cancel an appointment
export async function POST(request: Request) {
  try {
    const { datetime, email, reason, language = 'zh' } = await request.json();

    if (!datetime || !email) {
      return NextResponse.json(
        { error: 'Datetime and email are required' },
        { status: 400 }
      );
    }

    console.log('Cancellation request:', { datetime, email });

    // Read all bookings
    const bookings = readBookings();
    console.log(`Found ${bookings.length} bookings in the system`);

    // Find the booking to cancel
    const bookingIndex = bookings.findIndex(booking => {
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
          bookingDate = new Date(year, month, day,
            isPM && hours < 12 ? hours + 12 : hours,
            minutes, seconds);
        }

        // Parse the input datetime
        const inputDate = new Date(datetime);

        console.log(`Comparing booking date: ${bookingDate.toISOString()} with input date: ${inputDate.toISOString()}`);

        // Compare the dates
        const dateMatch = (
          bookingDate.getFullYear() === inputDate.getFullYear() &&
          bookingDate.getMonth() === inputDate.getMonth() &&
          bookingDate.getDate() === inputDate.getDate() &&
          bookingDate.getHours() === inputDate.getHours() &&
          bookingDate.getMinutes() === inputDate.getMinutes()
        );

        return dateMatch && booking.email === email;
      } catch (error) {
        console.error(`Error parsing date: ${booking.appointmentTime}`, error);
        return false;
      }
    });

    console.log('Booking index:', bookingIndex);

    if (bookingIndex === -1) {
      // Log all bookings for debugging
      bookings.forEach((booking, index) => {
        console.log(`Booking ${index}:`, {
          appointmentTime: booking.appointmentTime,
          email: booking.email,
          matches: booking.appointmentTime === datetime && booking.email === email
        });
      });

      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Get the booking before removing it
    const cancelledBooking = bookings[bookingIndex];
    console.log('Found booking to cancel:', cancelledBooking);

    // Remove the booking
    bookings.splice(bookingIndex, 1);

    // Write the updated bookings back to the CSV
    writeBookings(bookings);
    console.log('Updated bookings file after cancellation');

    // Send cancellation confirmation email
    try {
      await sendCancellationEmail(cancelledBooking, reason || 'No reason provided', language);
      console.log('Cancellation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Continue with the cancellation even if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json(
      { error: `Failed to cancel appointment: ${error.message}` },
      { status: 500 }
    );
  }
}
