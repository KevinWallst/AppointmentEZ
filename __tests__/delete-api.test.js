const { DELETE, POST } = require('../app/api/appointments/delete/route');
const fs = require('fs');
const path = require('path');

// Mock the fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
}));

// Mock the path module
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn().mockReturnValue('/mocked/path/to/bookings.csv'),
}));

// Mock the email utility
jest.mock('../app/utils/emailUtils', () => ({
  getBccEmails: jest.fn().mockReturnValue(['admin@example.com']),
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mocked-message-id' }),
  }),
}));

describe('Delete API Endpoint', () => {
  let mockRequest;
  let mockResponse;
  let mockHeaders;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock CSV data
    const mockCsvData = `id,name,email,phone,date,time,notes,status,language
1,John Doe,john@example.com,123-456-7890,2025-04-21,09:00,Test notes,upcoming,en
2,Jane Smith,jane@example.com,987-654-3210,2025-04-22,10:00,More notes,upcoming,en`;

    fs.readFileSync.mockReturnValue(mockCsvData);

    // Mock headers
    mockHeaders = new Map();
    mockHeaders.set('content-type', 'application/json');

    // Mock request
    mockRequest = {
      method: 'DELETE',
      headers: mockHeaders,
      json: jest.fn().mockResolvedValue({ id: '1' }),
    };

    // Mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('DELETE should successfully delete a booking', async () => {
    // Arrange
    mockRequest.json = jest.fn().mockResolvedValue({ id: '1' });

    // Act
    const result = await DELETE(mockRequest);
    const data = await result.json();

    // Assert
    expect(result.status).toBe(200);
    expect(data).toEqual({ success: true, message: 'Booking deleted successfully' });
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('POST should successfully delete a booking', async () => {
    // Arrange
    mockRequest.method = 'POST';
    mockRequest.json = jest.fn().mockResolvedValue({ id: '1' });

    // Act
    const result = await POST(mockRequest);
    const data = await result.json();

    // Assert
    expect(result.status).toBe(200);
    expect(data).toEqual({ success: true, message: 'Booking deleted successfully' });
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('should return 400 if booking ID is missing', async () => {
    // Arrange
    mockRequest.json = jest.fn().mockResolvedValue({});

    // Act
    const result = await DELETE(mockRequest);
    const data = await result.json();

    // Assert
    expect(result.status).toBe(400);
    expect(data).toEqual({ success: false, message: 'Booking ID is required' });
  });

  it('should return 404 if booking is not found', async () => {
    // Arrange
    mockRequest.json = jest.fn().mockResolvedValue({ id: '999' });

    // Act
    const result = await DELETE(mockRequest);
    const data = await result.json();

    // Assert
    expect(result.status).toBe(404);
    expect(data).toEqual({ success: false, message: 'Booking not found' });
  });

  it('should handle JSON parsing errors', async () => {
    // Arrange
    mockRequest.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

    // Act
    const result = await DELETE(mockRequest);
    const data = await result.json();

    // Assert
    expect(result.status).toBe(400);
    expect(data).toEqual({ success: false, message: 'Invalid request body' });
  });

  it('should handle CSV parsing errors', async () => {
    // Arrange
    fs.readFileSync.mockImplementation(() => {
      throw new Error('CSV parsing error');
    });

    // Act
    const result = await DELETE(mockRequest);
    const data = await result.json();

    // Assert
    expect(result.status).toBe(500);
    expect(data).toEqual({ success: false, message: 'Error reading bookings file' });
  });
});
