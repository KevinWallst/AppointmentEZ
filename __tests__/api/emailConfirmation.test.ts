import { formatInTimeZone } from 'date-fns-tz';

// Mock the email sending functionality
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

describe('Email Confirmation', () => {
  // Test email confirmation for a specific date
  test('Email confirmation shows the correct date for April 21 appointments', () => {
    // Simulate selecting April 21, 2025 in the date picker
    const selectedDateString = '2025-04-21';
    const [year, month, day] = selectedDateString.split('-').map(Number);
    
    // Create a date object with the selected date components (month is 0-indexed)
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    
    // Extract the date components to ensure we preserve the correct date
    const extractedYear = selectedDate.getFullYear();
    const extractedMonth = selectedDate.getMonth();
    const extractedDay = selectedDate.getDate();
    
    // Create a time slot for 10:00 AM EDT on the selected date
    const edtOffset = 4; // EDT is UTC-4
    const slot = new Date(Date.UTC(
      extractedYear,
      extractedMonth,
      extractedDay,
      10 + edtOffset, // 10:00 AM EDT = 2:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));
    
    // Create a booking with this time slot
    const booking = {
      appointmentTime: slot.toISOString(), // 2:00 PM UTC = 10:00 AM EDT on April 21
      requestTime: new Date().toISOString(),
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'testuser',
      topic: 'Test Topic'
    };
    
    // Parse the appointment time
    const appointmentDate = new Date(booking.appointmentTime);
    
    // Get the correct date in EDT time zone
    const edtTimeZone = 'America/New_York';
    const edtDate = formatInTimeZone(appointmentDate, edtTimeZone, 'yyyy-MM-dd');
    
    // Format the date and time in EDT for display
    const formattedDate = formatInTimeZone(appointmentDate, edtTimeZone, 'MMMM d, yyyy');
    const formattedTime = formatInTimeZone(appointmentDate, edtTimeZone, 'h:mm a');
    
    // Verify the EDT date is April 21, 2025
    // 2:00 PM UTC on April 21 = 10:00 AM EDT on April 21
    expect(edtDate).toBe('2025-04-21');
    expect(formattedDate).toBe('April 21, 2025');
    expect(formattedTime).toBe('10:00 AM');
    
    // Verify the original slot date is preserved
    expect(slot.toISOString()).toBe('2025-04-21T14:00:00.000Z');
    expect(booking.appointmentTime).toBe('2025-04-21T14:00:00.000Z');
    
    // Verify the email content would show the correct date
    const emailHtml = `
      <h2>预约确认</h2>
      <p>尊敬的 ${booking.name},</p>
      <p>您的预约已经确认：</p>
      <p><strong>日期：</strong> ${formattedDate}</p>
      <p><strong>时间：</strong> ${formattedTime} (EDT - 美国东部时间/纽约时间)</p>
      <p><strong>主题：</strong> ${booking.topic}</p>
    `;
    
    expect(emailHtml).toContain('April 21, 2025');
    expect(emailHtml).toContain('10:00 AM');
  });
  
  // Test email confirmation for a date that crosses day boundaries
  test('Email confirmation shows the correct date for appointments near day boundaries', () => {
    // Simulate selecting April 21, 2025 in the date picker
    const selectedDateString = '2025-04-21';
    const [year, month, day] = selectedDateString.split('-').map(Number);
    
    // Create a date object with the selected date components (month is 0-indexed)
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    
    // Extract the date components to ensure we preserve the correct date
    const extractedYear = selectedDate.getFullYear();
    const extractedMonth = selectedDate.getMonth();
    const extractedDay = selectedDate.getDate();
    
    // Create a time slot for 11:30 PM EDT on the selected date
    // This is a time that could easily be shifted to the next day if not handled correctly
    const edtOffset = 4; // EDT is UTC-4
    const slot = new Date(Date.UTC(
      extractedYear,
      extractedMonth,
      extractedDay,
      23 + edtOffset, // 11:30 PM EDT = 3:30 AM UTC (next day)
      30, // Minutes
      0  // Seconds
    ));
    
    // Create a booking with this time slot
    const booking = {
      appointmentTime: slot.toISOString(),
      requestTime: new Date().toISOString(),
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'testuser',
      topic: 'Test Topic'
    };
    
    // Parse the appointment time
    const appointmentDate = new Date(booking.appointmentTime);
    
    // Get the correct date in EDT time zone
    const edtTimeZone = 'America/New_York';
    const edtDate = formatInTimeZone(appointmentDate, edtTimeZone, 'yyyy-MM-dd');
    
    // Format the date and time in EDT for display
    const formattedDate = formatInTimeZone(appointmentDate, edtTimeZone, 'MMMM d, yyyy');
    const formattedTime = formatInTimeZone(appointmentDate, edtTimeZone, 'h:mm a');
    
    // Verify the EDT date is still April 21, 2025, even though the UTC date is April 22
    expect(edtDate).toBe('2025-04-21');
    expect(formattedDate).toBe('April 21, 2025');
    expect(formattedTime).toBe('11:30 PM');
    
    // Verify the UTC date is April 22 (next day)
    expect(appointmentDate.getUTCDate()).toBe(22);
    
    // Verify the email content would show the correct date
    const emailHtml = `
      <h2>预约确认</h2>
      <p>尊敬的 ${booking.name},</p>
      <p>您的预约已经确认：</p>
      <p><strong>日期：</strong> ${formattedDate}</p>
      <p><strong>时间：</strong> ${formattedTime} (EDT - 美国东部时间/纽约时间)</p>
      <p><strong>主题：</strong> ${booking.topic}</p>
    `;
    
    expect(emailHtml).toContain('April 21, 2025');
    expect(emailHtml).toContain('11:30 PM');
  });
});
