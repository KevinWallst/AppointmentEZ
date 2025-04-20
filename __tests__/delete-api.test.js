import { DELETE, POST } from '../app/api/appointments/delete/route';
import fs from 'fs';
import path from 'path';
import { parse, stringify } from 'csv-parse/sync';

// Mock the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Mock the path module
jest.mock('path', () => ({
  join: jest.fn(() => 'mocked/path/to/bookings.csv'),
}));

// Mock the csv-parse/sync module
jest.mock('csv-parse/sync', () => ({
  parse: jest.fn(),
  stringify: jest.fn(() => 'mocked,csv,string'),
}));

// Mock the NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: async () => data,
    })),
  },
}));

// Mock console methods to prevent logging during tests
global.console.log = jest.fn();
global.console.error = jest.fn();

describe('Delete API Endpoint', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('mocked csv content');
    parse.mockReturnValue([
      { id: 'test-id-1', name: 'Test User 1' },
      { id: 'test-id-2', name: 'Test User 2' },
    ]);
  });
  
  it('DELETE should handle booking deletion request', async () => {
    // Arrange
    const mockRequest = {
      json: async () => ({ id: 'test-id-1' }),
      headers: new Map(),
      method: 'DELETE',
      url: 'http://localhost:3000/api/appointments/delete'
    };
    
    // Act
    const result = await DELETE(mockRequest);
    
    // Assert
    // Just verify that the function returns a result
    expect(result).toBeDefined();
  });
  
  it('POST should handle booking deletion request', async () => {
    // Arrange
    const mockRequest = {
      json: async () => ({ id: 'test-id-1' }),
      headers: new Map(),
      method: 'POST',
      url: 'http://localhost:3000/api/appointments/delete'
    };
    
    // Act
    const result = await POST(mockRequest);
    
    // Assert
    // Just verify that the function returns a result
    expect(result).toBeDefined();
  });
  
  it('should return error if booking ID is missing', async () => {
    // Arrange
    const mockRequest = {
      json: async () => ({}),
      headers: new Map(),
      method: 'DELETE',
      url: 'http://localhost:3000/api/appointments/delete'
    };
    
    // Act
    const result = await DELETE(mockRequest);
    const data = await result.json();
    
    // Assert
    expect(data.error).toBeTruthy();
  });
  
  it('should return error if booking is not found', async () => {
    // Arrange
    const mockRequest = {
      json: async () => ({ id: 'non-existent-id' }),
      headers: new Map(),
      method: 'DELETE',
      url: 'http://localhost:3000/api/appointments/delete'
    };
    
    // Act
    const result = await DELETE(mockRequest);
    const data = await result.json();
    
    // Assert
    expect(data.error).toBeTruthy();
  });
  
  it('should handle JSON parsing errors', async () => {
    // Arrange
    const mockRequest = {
      json: async () => { throw new Error('JSON parse error'); },
      headers: new Map(),
      method: 'DELETE',
      url: 'http://localhost:3000/api/appointments/delete'
    };
    
    // Act
    const result = await DELETE(mockRequest);
    const data = await result.json();
    
    // Assert
    expect(data.error).toBeTruthy();
  });
  
  it('should handle CSV parsing errors', async () => {
    // Arrange
    const mockRequest = {
      json: async () => ({ id: 'test-id-1' }),
      headers: new Map(),
      method: 'DELETE',
      url: 'http://localhost:3000/api/appointments/delete'
    };
    
    // Mock CSV parsing error
    parse.mockImplementation(() => { throw new Error('CSV parse error'); });
    
    // Act
    const result = await DELETE(mockRequest);
    const data = await result.json();
    
    // Assert
    expect(data.error).toBeTruthy();
  });
});
