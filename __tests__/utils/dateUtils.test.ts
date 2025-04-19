import { formatInTimeZone } from 'date-fns-tz';

describe('Date and Time Zone Handling', () => {
  // Test UTC to EST conversion
  test('UTC to EST conversion preserves the correct date', () => {
    // Create a date in UTC for 3:00 PM EST on April 17, 2025
    // EST is UTC-4, so 3:00 PM EST = 7:00 PM UTC
    const utcDate = new Date('2025-04-17T19:00:00.000Z');

    // Format the date in EST
    const estTimeZone = 'America/New_York';
    const formattedDate = formatInTimeZone(utcDate, estTimeZone, 'MMMM d, yyyy');
    const formattedTime = formatInTimeZone(utcDate, estTimeZone, 'h:mm a');

    // Verify the formatted date is April 17, 2025
    expect(formattedDate).toBe('April 17, 2025');
    expect(formattedTime).toBe('3:00 PM');
  });

  // Test EST to UTC conversion
  test('EST to UTC conversion preserves the correct date', () => {
    // Create a date representing 3:00 PM EST on April 17, 2025
    const estDate = new Date(Date.UTC(2025, 3, 17, 19, 0, 0)); // 7:00 PM UTC = 3:00 PM EST

    // Verify the UTC date components
    expect(estDate.getUTCFullYear()).toBe(2025);
    expect(estDate.getUTCMonth()).toBe(3); // April (0-indexed)
    expect(estDate.getUTCDate()).toBe(17);
    expect(estDate.getUTCHours()).toBe(19);
    expect(estDate.getUTCMinutes()).toBe(0);
  });

  // Test time slot generation with correct EDT offset
  test('Time slot generation uses correct EDT offset', () => {
    // Create a base date for April 17, 2025
    const baseDate = new Date(2025, 3, 17);
    baseDate.setHours(0, 0, 0, 0);

    // Extract date components
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();

    // EDT offset (EDT is UTC-4)
    const edtOffset = 4;

    // Create a time slot for 3:00 PM EDT
    const slot = new Date(Date.UTC(
      year,
      month,
      day,
      15 + edtOffset, // 3:00 PM EDT = 7:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));

    // Verify the slot is on April 17, 2025 at 7:00 PM UTC
    expect(slot.toISOString()).toBe('2025-04-17T19:00:00.000Z');

    // Verify the slot formats correctly to EDT
    const edtTimeZone = 'America/New_York';
    const formattedDate = formatInTimeZone(slot, edtTimeZone, 'MMMM d, yyyy');
    const formattedTime = formatInTimeZone(slot, edtTimeZone, 'h:mm a');

    expect(formattedDate).toBe('April 17, 2025');
    expect(formattedTime).toBe('3:00 PM');
  });

  // Test that afternoon appointments don't shift to the previous day
  test('Afternoon appointments do not shift to the previous day', () => {
    // Create a date for 3:00 PM EDT on April 17, 2025
    const edtTimeZone = 'America/New_York';
    const utcDate = new Date('2025-04-17T19:00:00.000Z'); // 7:00 PM UTC = 3:00 PM EDT

    // Format the date in EDT
    const formattedDate = formatInTimeZone(utcDate, edtTimeZone, 'yyyy-MM-dd');

    // Verify the date is still April 17, 2025
    expect(formattedDate).toBe('2025-04-17');
  });

  // Test date selection and time slot generation for a specific date
  test('Date selection preserves the correct date for time slot generation', () => {
    // Simulate selecting April 21, 2025 in the date picker
    const selectedDateString = '2025-04-21';
    const [year, month, day] = selectedDateString.split('-').map(Number);

    // Create a date object with the selected date components (month is 0-indexed)
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0, 0);

    // Extract the date components to ensure we preserve the correct date
    const extractedYear = selectedDate.getFullYear();
    const extractedMonth = selectedDate.getMonth();
    const extractedDay = selectedDate.getDate();

    // Verify the extracted components match the selected date
    expect(extractedYear).toBe(2025);
    expect(extractedMonth).toBe(3); // April (0-indexed)
    expect(extractedDay).toBe(21);

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

    // Verify the slot is on April 21, 2025 at 2:00 PM UTC
    expect(slot.toISOString()).toBe('2025-04-21T14:00:00.000Z');

    // Verify the slot formats correctly to EDT
    const edtTimeZone = 'America/New_York';
    const formattedDate = formatInTimeZone(slot, edtTimeZone, 'MMMM d, yyyy');
    const formattedTime = formatInTimeZone(slot, edtTimeZone, 'h:mm a');

    expect(formattedDate).toBe('April 21, 2025');
    expect(formattedTime).toBe('10:00 AM');
  });
});
