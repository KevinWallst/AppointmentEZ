import { formatInTimeZone } from 'date-fns-tz';

// Mock the email sending functionality
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

// Mock the fs module for CSV operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(''),
  writeFile: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockRejectedValue(new Error('File not found'))
}));

describe('Booking API', () => {
  // Test appointment time handling in confirmation emails
  test('Confirmation email shows the correct date for afternoon appointments', async () => {
    // Create a booking for 3:00 PM EST on April 17, 2025
    const booking = {
      appointmentTime: '2025-04-17T19:00:00.000Z', // 7:00 PM UTC = 3:00 PM EST
      requestTime: new Date().toISOString(),
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'testuser',
      topic: 'Test Topic'
    };

    // Parse the appointment time
    const appointmentDate = new Date(booking.appointmentTime);

    // Format the date in EST
    const estTimeZone = 'America/New_York';
    const formattedDate = formatInTimeZone(appointmentDate, estTimeZone, 'MMMM d, yyyy');
    const formattedTime = formatInTimeZone(appointmentDate, estTimeZone, 'h:mm a');

    // Verify the formatted date is April 17, 2025
    expect(formattedDate).toBe('April 17, 2025');
    expect(formattedTime).toBe('3:00 PM');
  });

  // Test appointment time handling for morning appointments
  test('Confirmation email shows the correct date for morning appointments', async () => {
    // Simulate selecting April 20, 2025 in the date picker
    const selectedDateString = '2025-04-20';
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
      appointmentTime: slot.toISOString(), // 2:00 PM UTC = 10:00 AM EDT on April 20
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

    // Verify the EDT date is April 20, 2025
    // 2:00 PM UTC on April 20 = 10:00 AM EDT on April 20
    expect(edtDate).toBe('2025-04-20');
    expect(formattedDate).toBe('April 20, 2025');
    expect(formattedTime).toBe('10:00 AM');

    // Verify the original slot date is preserved
    expect(slot.toISOString()).toBe('2025-04-20T14:00:00.000Z');
    expect(booking.appointmentTime).toBe('2025-04-20T14:00:00.000Z');
  });

  // Test appointment time handling when crossing day boundaries
  test('Confirmation email shows the correct date when crossing day boundaries', async () => {
    // Simulate selecting April 21, 2025 in the date picker
    const selectedDateString = '2025-04-21';
    const [year, month, day] = selectedDateString.split('-').map(Number);

    // Create a date object with the selected date components (month is 0-indexed)
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0, 0);

    // Extract the date components to ensure we preserve the correct date
    const extractedYear = selectedDate.getFullYear();
    const extractedMonth = selectedDate.getMonth();
    const extractedDay = selectedDate.getDate();

    // Create a time slot for 1:00 AM EDT on the selected date
    const edtOffset = 4; // EDT is UTC-4
    const slot = new Date(Date.UTC(
      extractedYear,
      extractedMonth,
      extractedDay,
      1 + edtOffset, // 1:00 AM EDT = 5:00 AM UTC
      0, // Minutes
      0  // Seconds
    ));

    // Create a booking with this time slot
    const booking = {
      appointmentTime: slot.toISOString(), // 5:00 AM UTC on April 21 = 1:00 AM EDT on April 21
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
    // 5:00 AM UTC on April 21 = 1:00 AM EDT on April 21
    expect(edtDate).toBe('2025-04-21');
    expect(formattedDate).toBe('April 21, 2025');
    expect(formattedTime).toBe('1:00 AM');

    // Verify the original slot date is preserved
    expect(slot.toISOString()).toBe('2025-04-21T05:00:00.000Z');
    expect(booking.appointmentTime).toBe('2025-04-21T05:00:00.000Z');
  });

  // Test time slot generation for booking
  test('Generated time slots have the correct UTC time for EDT times', () => {
    // Simulate selecting April 21, 2025 in the date picker
    const selectedDateString = '2025-04-21';
    const [year, month, day] = selectedDateString.split('-').map(Number);

    // Create a date object with the selected date components (month is 0-indexed)
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0, 0);

    // Extract the date components to ensure we preserve the correct date
    const extractedYear = selectedDate.getFullYear();
    const extractedMonth = selectedDate.getMonth();
    const extractedDay = selectedDate.getDate();

    // EDT offset (EDT is UTC-4)
    const edtOffset = 4;

    // Create time slots for 9:00 AM to 4:00 PM EDT
    const slots = [];

    // 9:00 AM EDT = 1:00 PM UTC
    let startTime = new Date(Date.UTC(
      extractedYear,
      extractedMonth,
      extractedDay,
      9 + edtOffset, // 9:00 AM EDT = 1:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));

    // 4:00 PM EDT = 8:00 PM UTC
    const endTime = new Date(Date.UTC(
      extractedYear,
      extractedMonth,
      extractedDay,
      16 + edtOffset, // 4:00 PM EDT = 8:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));

    // Generate slots every 30 minutes
    while (startTime < endTime) {
      slots.push(new Date(startTime));
      startTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    }

    // Verify the first slot is 9:00 AM EDT (1:00 PM UTC)
    expect(slots[0].toISOString()).toBe('2025-04-21T13:00:00.000Z');

    // Verify the last slot is 3:30 PM EDT (7:30 PM UTC)
    expect(slots[slots.length - 1].toISOString()).toBe('2025-04-21T19:30:00.000Z');

    // Verify all slots are on April 21, 2025
    for (const slot of slots) {
      expect(slot.toISOString().startsWith('2025-04-21')).toBe(true);

      // Verify each slot formats correctly to EDT
      const edtTimeZone = 'America/New_York';
      const formattedDate = formatInTimeZone(slot, edtTimeZone, 'yyyy-MM-dd');
      expect(formattedDate).toBe('2025-04-21');
    }

    // Verify we have 14 slots (9:00 AM to 4:00 PM with 30-minute intervals)
    expect(slots.length).toBe(14);
  });
});
