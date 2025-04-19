/**
 * @jest-environment jsdom
 */

import { waitFor } from '@testing-library/react';

describe('Fetch Interceptor Tests', () => {
  // Original fetch
  const originalFetch = global.fetch;
  
  // Mock fetch implementation
  const mockFetchImplementation = jest.fn();
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock console methods to track calls
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Reset the modal close flag
    delete window.__modalCloseInProgress;
    
    // Reset fetch
    global.fetch = originalFetch;
    mockFetchImplementation.mockReset();
  });
  
  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.error.mockRestore();
    
    // Restore fetch
    global.fetch = originalFetch;
  });
  
  test('should intercept fetch requests and log details', async () => {
    // Mock a successful fetch response
    mockFetchImplementation.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });
    
    // Create a fetch interceptor
    const originalFetch = global.fetch;
    global.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';
      
      console.log(`Fetch request started: ${method} ${url}`);
      console.log('Request details:', {
        url,
        method,
        headers: init?.headers,
        body: init?.body,
        modalCloseInProgress: window.__modalCloseInProgress || false,
      });
      
      // Call the mock implementation
      return mockFetchImplementation(input, init)
        .then(response => {
          console.log(`Fetch request completed: ${method} ${url}`);
          console.log('Response status:', response.status);
          return response;
        })
        .catch(error => {
          console.error(`Fetch request failed: ${method} ${url}`);
          console.error('Error:', error);
          throw error;
        });
    };
    
    // Make a fetch request
    const response = await fetch('/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });
    
    // Verify the mock implementation was called
    expect(mockFetchImplementation).toHaveBeenCalledTimes(1);
    expect(mockFetchImplementation).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    }));
    
    // Verify the logs
    expect(console.log).toHaveBeenCalledWith('Fetch request started: POST /api/test');
    expect(console.log).toHaveBeenCalledWith('Request details:', expect.objectContaining({
      url: '/api/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
      modalCloseInProgress: false,
    }));
    expect(console.log).toHaveBeenCalledWith('Fetch request completed: POST /api/test');
    expect(console.log).toHaveBeenCalledWith('Response status:', 200);
  });
  
  test('should abort fetch requests during modal close', async () => {
    // Mock a successful fetch response
    mockFetchImplementation.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });
    
    // Create a fetch interceptor that aborts requests during modal close
    global.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';
      
      console.log(`Fetch request started: ${method} ${url}`);
      console.log('Request details:', {
        url,
        method,
        headers: init?.headers,
        body: init?.body,
        modalCloseInProgress: window.__modalCloseInProgress || false,
      });
      
      // If modal close is in progress and this is a booking request, abort it
      if (window.__modalCloseInProgress && 
          (url.includes('/api/appointments/book') || url.includes('/api/appointments/update'))) {
        console.error(`Aborting fetch during modal close: ${method} ${url}`);
        return Promise.reject(new Error('Fetch aborted: Modal close in progress'));
      }
      
      // Call the mock implementation
      return mockFetchImplementation(input, init)
        .then(response => {
          console.log(`Fetch request completed: ${method} ${url}`);
          console.log('Response status:', response.status);
          return response;
        })
        .catch(error => {
          console.error(`Fetch request failed: ${method} ${url}`);
          console.error('Error:', error);
          throw error;
        });
    };
    
    // Set the modal close flag
    window.__modalCloseInProgress = true;
    
    // Try to make a booking request
    try {
      await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      });
      
      // This should not be reached
      expect(true).toBe(false);
    } catch (error) {
      // Verify the error
      expect(error.message).toBe('Fetch aborted: Modal close in progress');
    }
    
    // Verify the logs
    expect(console.log).toHaveBeenCalledWith('Fetch request started: POST /api/appointments/book');
    expect(console.error).toHaveBeenCalledWith('Aborting fetch during modal close: POST /api/appointments/book');
    
    // Verify the mock implementation was not called
    expect(mockFetchImplementation).not.toHaveBeenCalled();
    
    // Clear the flag
    window.__modalCloseInProgress = false;
    
    // Try to make a non-booking request
    await fetch('/api/test', {
      method: 'GET',
    });
    
    // Verify the mock implementation was called
    expect(mockFetchImplementation).toHaveBeenCalledTimes(1);
  });
  
  test('should handle fetch errors', async () => {
    // Mock a failed fetch response
    mockFetchImplementation.mockRejectedValue(new Error('Network error'));
    
    // Create a fetch interceptor
    global.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';
      
      console.log(`Fetch request started: ${method} ${url}`);
      
      // Call the mock implementation
      return mockFetchImplementation(input, init)
        .then(response => {
          console.log(`Fetch request completed: ${method} ${url}`);
          return response;
        })
        .catch(error => {
          console.error(`Fetch request failed: ${method} ${url}`);
          console.error('Error:', error);
          throw error;
        });
    };
    
    // Try to make a fetch request
    try {
      await fetch('/api/test', {
        method: 'GET',
      });
      
      // This should not be reached
      expect(true).toBe(false);
    } catch (error) {
      // Verify the error
      expect(error.message).toBe('Network error');
    }
    
    // Verify the logs
    expect(console.log).toHaveBeenCalledWith('Fetch request started: GET /api/test');
    expect(console.error).toHaveBeenCalledWith('Fetch request failed: GET /api/test');
    expect(console.error).toHaveBeenCalledWith('Error:', new Error('Network error'));
    
    // Verify the mock implementation was called
    expect(mockFetchImplementation).toHaveBeenCalledTimes(1);
  });
});
