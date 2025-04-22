/**
 * Timezone Handling Test Suite
 *
 * This test suite verifies that the appointment booking system correctly handles
 * different time zones for both booking creation and display.
 */

import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

// Mock the fs module to prevent actual file operations
jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');
  return {
    ...originalModule,
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
  };
});

// Import the API handlers
import { POST as bookAppointment } from '../app/api/bookings/route';
import { GET as getTimeSlots } from '../app/api/bookings/route';

describe('Timezone Handling Tests', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock the CSV file with some existing bookings
    const mockCsvContent = `id,name,email,wechatId,topic,appointmentTime
1,Kevin,kevinwallst@yahoo.com,kevinwallst,h1,4/21/2025, 9:00:00 AM
2,Kevin,kevinwallst@yahoo.com,kevinwallst,k,4/21/2025, 9:30:00 AM`;

    // Mock fs.existsSync to return true for our bookings file
    fs.existsSync.mockImplementation((filePath) => {
      if (filePath.includes('bookings.csv')) {
        return true;
      }
      return false;
    });

    // Mock fs.readFileSync to return our mock CSV content
    fs.readFileSync.mockImplementation((filePath, options) => {
      if (filePath.includes('bookings.csv')) {
        return mockCsvContent;
      }
      throw new Error(`Unexpected file read: ${filePath}`);
    });

    // Mock fs.writeFileSync to capture what would be written
    fs.writeFileSync.mockImplementation(() => {});

    // Mock the Request object
    global.Request = class {
      constructor(url, options = {}) {
        this.url = url;
        this.method = options.method || 'GET';
        this.headers = new Headers(options.headers || {});
        this.body = options.body;
      }

      json() {
        return Promise.resolve(JSON.parse(this.body));
      }
    };

    // Mock the Headers object
    global.Headers = class {
      constructor(init = {}) {
        this.headers = { ...init };
      }

      get(name) {
        return this.headers[name.toLowerCase()];
      }

      set(name, value) {
        this.headers[name.toLowerCase()] = value;
      }
    };

    // Mock the Response object
    global.Response = class {
      constructor(body, options = {}) {
        this.body = body;
        this.status = options.status || 200;
        this.statusText = options.statusText || '';
        this.headers = new Headers(options.headers || {});
      }

      json() {
        return Promise.resolve(JSON.parse(this.body));
      }
    };
  });

  /**
   * Test Case 1: Booking from Los Angeles (PST/PDT)
   *
   * If a user books a time on 4/24/25 9AM from Los Angeles (PST/PDT),
   * the system should:
   * 1. Save the corresponding time in UTC/GMT (16:00)
   * 2. Display the time as 12PM EST for admin
   */
  test('Booking from Los Angeles (PST) is correctly converted to UTC and displayed in EST', async () => {
    // Mock the browser's timezone to be Los Angeles (PST/PDT)
    const originalDateTimeFormat = Intl.DateTimeFormat;
    global.Intl.DateTimeFormat = function() {
      return {
        resolvedOptions: () => ({
          timeZone: 'America/Los_Angeles'
        })
      };
    };

    // Create a booking for 9AM PST on April 24, 2025
    const bookingData = {
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'testuser',
      topic: 'Test Topic',
      datetime: '2025-04-24T09:00:00.000-07:00' // 9AM PST
    };

    // Create the request
    const request = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    // Call the API handler
    const response = await bookAppointment(request);
    const responseData = await response.json();

    // Verify the response
    expect(responseData.success).toBe(true);

    // Check what was written to the CSV file
    expect(fs.writeFileSync).toHaveBeenCalled();
    const writeCall = fs.writeFileSync.mock.calls[0];
    const csvContent = writeCall[1];

    // The time should be saved in UTC (16:00)
    expect(csvContent).toContain('2025-04-24T16:00:00.000Z');

    // Restore the original DateTimeFormat
    global.Intl.DateTimeFormat = originalDateTimeFormat;

    // Now test how this would be displayed in EST
    // Create a request to get time slots for April 24, 2025
    const getRequest = new Request('http://localhost:3000/api/bookings?date=2025-04-24');

    // Call the API handler
    const getResponse = await getTimeSlots(getRequest);
    const getResponseData = await getResponse.json();

    // Find the 12PM EST slot (which should be booked)
    const noonSlot = getResponseData.timeSlots.find(slot => {
      const slotTime = new Date(slot.time);
      return slotTime.getUTCHours() === 16 && slotTime.getUTCMinutes() === 0;
    });

    // Verify that the 12PM EST slot is marked as booked
    expect(noonSlot).toBeDefined();
    expect(noonSlot.isBooked).toBe(true);
  });

  /**
   * Test Case 2: Booking from New York (EST/EDT)
   *
   * If a user books a time on 4/24/25 9AM from New York (EST/EDT),
   * the system should:
   * 1. Save the corresponding time in UTC/GMT (13:00)
   * 2. Display the time as 9AM EST for admin
   */
  test('Booking from New York (EST) is correctly converted to UTC and displayed in EST', async () => {
    // Mock the browser's timezone to be New York (EST/EDT)
    const originalDateTimeFormat = Intl.DateTimeFormat;
    global.Intl.DateTimeFormat = function() {
      return {
        resolvedOptions: () => ({
          timeZone: 'America/New_York'
        })
      };
    };

    // Create a booking for 9AM EST on April 24, 2025
    const bookingData = {
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'testuser',
      topic: 'Test Topic',
      datetime: '2025-04-24T09:00:00.000-04:00' // 9AM EST
    };

    // Create the request
    const request = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    // Call the API handler
    const response = await bookAppointment(request);
    const responseData = await response.json();

    // Verify the response
    expect(responseData.success).toBe(true);

    // Check what was written to the CSV file
    expect(fs.writeFileSync).toHaveBeenCalled();
    const writeCall = fs.writeFileSync.mock.calls[0];
    const csvContent = writeCall[1];

    // The time should be saved in UTC (13:00)
    expect(csvContent).toContain('2025-04-24T13:00:00.000Z');

    // Restore the original DateTimeFormat
    global.Intl.DateTimeFormat = originalDateTimeFormat;

    // Now test how this would be displayed in EST
    // Create a request to get time slots for April 24, 2025
    const getRequest = new Request('http://localhost:3000/api/bookings?date=2025-04-24');

    // Call the API handler
    const getResponse = await getTimeSlots(getRequest);
    const getResponseData = await getResponse.json();

    // Find the 9AM EST slot (which should be booked)
    const nineAmSlot = getResponseData.timeSlots.find(slot => {
      const slotTime = new Date(slot.time);
      return slotTime.getUTCHours() === 13 && slotTime.getUTCMinutes() === 0;
    });

    // Verify that the 9AM EST slot is marked as booked
    expect(nineAmSlot).toBeDefined();
    expect(nineAmSlot.isBooked).toBe(true);
  });

  /**
   * Test Case 3: Booking from Beijing, China (CST)
   *
   * If a user books a time on 4/24/25 10PM from Beijing (CST),
   * the system should:
   * 1. Save the corresponding time in UTC/GMT (14:00)
   * 2. Display the time as 10AM EST for admin
   */
  test('Booking from Beijing (CST) is correctly converted to UTC and displayed in EST', async () => {
    // Mock the browser's timezone to be Beijing (CST)
    const originalDateTimeFormat = Intl.DateTimeFormat;
    global.Intl.DateTimeFormat = function() {
      return {
        resolvedOptions: () => ({
          timeZone: 'Asia/Shanghai'
        })
      };
    };

    // Create a booking for 10PM CST on April 24, 2025
    const bookingData = {
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'testuser',
      topic: 'Test Topic',
      datetime: '2025-04-24T22:00:00.000+08:00' // 10PM CST
    };

    // Create the request
    const request = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    // Call the API handler
    const response = await bookAppointment(request);
    const responseData = await response.json();

    // Verify the response
    expect(responseData.success).toBe(true);

    // Check what was written to the CSV file
    expect(fs.writeFileSync).toHaveBeenCalled();
    const writeCall = fs.writeFileSync.mock.calls[0];
    const csvContent = writeCall[1];

    // The time should be saved in UTC (14:00)
    expect(csvContent).toContain('2025-04-24T14:00:00.000Z');

    // Restore the original DateTimeFormat
    global.Intl.DateTimeFormat = originalDateTimeFormat;

    // Now test how this would be displayed in EST
    // Create a request to get time slots for April 24, 2025
    const getRequest = new Request('http://localhost:3000/api/bookings?date=2025-04-24');

    // Call the API handler
    const getResponse = await getTimeSlots(getRequest);
    const getResponseData = await getResponse.json();

    // Find the 10AM EST slot (which should be booked)
    const tenAmSlot = getResponseData.timeSlots.find(slot => {
      const slotTime = new Date(slot.time);
      return slotTime.getUTCHours() === 14 && slotTime.getUTCMinutes() === 0;
    });

    // Verify that the 10AM EST slot is marked as booked
    expect(tenAmSlot).toBeDefined();
    expect(tenAmSlot.isBooked).toBe(true);
  });

  /**
   * Test Case 4: Booking from Shanghai, China (CST) crossing day boundary
   *
   * If a user books a time on 4/25/25 9AM from Shanghai (CST),
   * the system should:
   * 1. Save the corresponding time in UTC/GMT (01:00)
   * 2. Display the time as 9PM EST on 4/24/2025 for admin
   */
  test('Booking from Shanghai (CST) crossing day boundary is correctly converted to UTC and displayed in EST', async () => {
    // Mock the browser's timezone to be Shanghai (CST)
    const originalDateTimeFormat = Intl.DateTimeFormat;
    global.Intl.DateTimeFormat = function() {
      return {
        resolvedOptions: () => ({
          timeZone: 'Asia/Shanghai'
        })
      };
    };

    // Create a booking for 9AM CST on April 25, 2025
    const bookingData = {
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'testuser',
      topic: 'Test Topic',
      datetime: '2025-04-25T09:00:00.000+08:00' // 9AM CST
    };

    // Create the request
    const request = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    // Call the API handler
    const response = await bookAppointment(request);
    const responseData = await response.json();

    // Verify the response
    expect(responseData.success).toBe(true);

    // Check what was written to the CSV file
    expect(fs.writeFileSync).toHaveBeenCalled();
    const writeCall = fs.writeFileSync.mock.calls[0];
    const csvContent = writeCall[1];

    // The time should be saved in UTC (01:00 on April 25)
    expect(csvContent).toContain('2025-04-25T01:00:00.000Z');

    // Restore the original DateTimeFormat
    global.Intl.DateTimeFormat = originalDateTimeFormat;

    // Now test how this would be displayed in EST
    // Create a request to get time slots for April 24, 2025 (since 9PM EST on April 24 is the equivalent time)
    const getRequest = new Request('http://localhost:3000/api/bookings?date=2025-04-24');

    // Call the API handler
    const getResponse = await getTimeSlots(getRequest);
    const getResponseData = await getResponse.json();

    // Find the 9PM EST slot (which should be booked)
    const ninePmSlot = getResponseData.timeSlots.find(slot => {
      const slotTime = new Date(slot.time);
      // 9PM EST is 01:00 UTC of the next day
      return slotTime.getUTCHours() === 1 && slotTime.getUTCMinutes() === 0 &&
             slotTime.getUTCDate() === 25; // Check that it's the 25th in UTC
    });

    // Verify that the 9PM EST slot is marked as booked
    expect(ninePmSlot).toBeDefined();
    expect(ninePmSlot.isBooked).toBe(true);

    // Also check that the booking appears in the calendar for April 24 (EST)
    // by checking if the booking is included in the day's bookings
    const calendarRequest = new Request('http://localhost:3000/api/bookings?date=2025-04-24');
    const calendarResponse = await getTimeSlots(calendarRequest);
    const calendarData = await calendarResponse.json();

    // The booking should be included in the day's bookings
    expect(calendarData.bookings).toContainEqual(
      expect.objectContaining({
        email: 'test@example.com',
        appointmentTime: expect.stringContaining('2025-04-25T01:00:00.000Z')
      })
    );
  });
});
