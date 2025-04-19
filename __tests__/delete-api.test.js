/**
 * @jest-environment node
 */

import { DELETE, POST } from '../app/api/appointments/delete/route';
import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify/sync';

// Mock the NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options }))
  }
}));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/'))
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

// Mock csv-parse/sync
jest.mock('csv-parse/sync', () => ({
  parse: jest.fn()
}));

// Mock csv-stringify/sync
jest.mock('csv-stringify/sync', () => ({
  stringify: jest.fn().mockReturnValue('mocked,csv,content')
}));

// Mock date-fns-tz
jest.mock('date-fns-tz', () => ({
  formatInTimeZone: jest.fn().mockReturnValue('Mocked Date')
}));

describe('Delete API Endpoint', () => {
  // Setup environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup environment variables
    process.env = {
      ...originalEnv,
      EMAIL_USER: 'test@example.com',
      EMAIL_PASSWORD: 'test-password',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000'
    };

    // Mock process.cwd()
    jest.spyOn(process, 'cwd').mockReturnValue('/test-dir');
    
    // Mock path.join to return predictable paths
    path.join.mockImplementation((...args) => args.join('/'));
    
    // Mock fs.existsSync to return true for data directory and CSV file
    fs.existsSync.mockImplementation((path) => {
      if (path === '/test-dir/data' || path === '/test-dir/data/bookings.csv') {
        return true;
      }
      return false;
    });
    
    // Mock fs.readFileSync to return a valid CSV content
    fs.readFileSync.mockReturnValue('id,appointmentTime,requestTime,name,email,wechatId,topic,language\n' +
      'test-id-1,2023-12-31T14:00:00.000Z,2023-12-01T10:00:00.000Z,Test User,test@example.com,test-wechat,Test Topic,en\n' +
      'test-id-2,2024-01-15T15:30:00.000Z,2023-12-05T11:00:00.000Z,Another User,another@example.com,another-wechat,Another Topic,zh');
    
    // Mock the parse function to return an array of bookings
    const { parse } = require('csv-parse/sync');
    parse.mockReturnValue([
      {
        id: 'test-id-1',
        appointmentTime: '2023-12-31T14:00:00.000Z',
        requestTime: '2023-12-01T10:00:00.000Z',
        name: 'Test User',
        email: 'test@example.com',
        wechatId: 'test-wechat',
        topic: 'Test Topic',
        language: 'en'
      },
      {
        id: 'test-id-2',
        appointmentTime: '2024-01-15T15:30:00.000Z',
        requestTime: '2023-12-05T11:00:00.000Z',
        name: 'Another User',
        email: 'another@example.com',
        wechatId: 'another-wechat',
        topic: 'Another Topic',
        language: 'zh'
      }
    ]);
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  test('DELETE should successfully delete a booking', async () => {
    // Create a mock request with a valid booking ID
    const request = {
      json: jest.fn().mockResolvedValue({ id: 'test-id-1' })
    };

    // Call the DELETE handler
    const response = await DELETE(request);

    // Verify the request was processed correctly
    expect(request.json).toHaveBeenCalled();
    
    // Verify the booking was found and deleted
    expect(response.data.success).toBe(true);
    expect(response.data.booking.id).toBe('test-id-1');
    expect(response.options.status).toBe(200);
    
    // Verify the CSV file was updated
    expect(fs.writeFileSync).toHaveBeenCalled();
    
    // Verify the email was sent
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport();
    expect(transporter.sendMail).toHaveBeenCalled();
  });

  test('POST should successfully delete a booking', async () => {
    // Create a mock request with a valid booking ID
    const request = {
      json: jest.fn().mockResolvedValue({ id: 'test-id-2' })
    };

    // Call the POST handler
    const response = await POST(request);

    // Verify the request was processed correctly
    expect(request.json).toHaveBeenCalled();
    
    // Verify the booking was found and deleted
    expect(response.data.success).toBe(true);
    expect(response.data.booking.id).toBe('test-id-2');
    expect(response.options.status).toBe(200);
    
    // Verify the CSV file was updated
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('should return 400 if booking ID is missing', async () => {
    // Create a mock request with missing booking ID
    const request = {
      json: jest.fn().mockResolvedValue({})
    };

    // Call the DELETE handler
    const response = await DELETE(request);

    // Verify the error response
    expect(response.data.error).toBe('Missing booking ID');
    expect(response.options.status).toBe(400);
  });

  test('should return 404 if booking is not found', async () => {
    // Create a mock request with a non-existent booking ID
    const request = {
      json: jest.fn().mockResolvedValue({ id: 'non-existent-id' })
    };

    // Call the DELETE handler
    const response = await DELETE(request);

    // Verify the error response
    expect(response.data.error).toBe('Booking not found');
    expect(response.options.status).toBe(404);
  });

  test('should handle JSON parsing errors', async () => {
    // Create a mock request that throws an error during JSON parsing
    const request = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
    };

    // Call the DELETE handler
    const response = await DELETE(request);

    // Verify the error response
    expect(response.data.error).toBe('Internal server error');
    expect(response.options.status).toBe(500);
  });

  test('should handle CSV parsing errors', async () => {
    // Mock the parse function to throw an error
    const { parse } = require('csv-parse/sync');
    parse.mockImplementation(() => {
      throw new Error('CSV parsing error');
    });

    // Create a mock request with a valid booking ID
    const request = {
      json: jest.fn().mockResolvedValue({ id: 'test-id-1' })
    };

    // Call the DELETE handler
    const response = await DELETE(request);

    // Verify the error response
    expect(response.data.error).toBe('Internal server error');
    expect(response.options.status).toBe(500);
  });
});
