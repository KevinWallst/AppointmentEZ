/**
 * @jest-environment jsdom
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppointmentModal } from '../app/components/AppointmentModal';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the language context
jest.mock('../app/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

describe('Admin Dashboard Race Condition Tests', () => {
  // Mock functions
  const mockFetch = jest.fn();
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage to simulate authenticated state
    global.localStorage.getItem.mockReturnValue('true');
    
    // Mock fetch
    global.fetch = mockFetch;
    
    // Mock console methods to track calls
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(window, 'alert').mockImplementation();
    
    // Reset the modal close flag
    delete window.__modalCloseInProgress;
  });
  
  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.error.mockRestore();
    window.alert.mockRestore();
  });
  
  test('should abort fetch requests during modal close', async () => {
    // Create a test component that simulates the dashboard's modal handling
    const TestComponent = () => {
      const [modalOpen, setModalOpen] = useState(true);
      
      const handleCloseModal = () => {
        console.log('Closing modal in test component');
        
        // Set the modal close flag
        window.__modalCloseInProgress = true;
        console.log('Set __modalCloseInProgress flag to true');
        
        // Close the modal
        setModalOpen(false);
        
        // Clear the flag after a delay
        setTimeout(() => {
          window.__modalCloseInProgress = false;
          console.log('Set __modalCloseInProgress flag to false');
        }, 500);
      };
      
      const handleSaveBooking = async (data) => {
        console.log('Save booking called with data:', data);
        
        // Check if modal close is in progress
        if (window.__modalCloseInProgress) {
          console.error('Save attempted while modal close in progress');
          return false;
        }
        
        try {
          // Attempt to fetch
          const response = await fetch('/api/appointments/book', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          return response.ok;
        } catch (error) {
          console.error('Fetch error:', error);
          return false;
        }
      };
      
      return (
        <>
          <div data-testid="modal-status">{modalOpen ? 'Open' : 'Closed'}</div>
          <div data-testid="flag-status">{window.__modalCloseInProgress ? 'Flag Set' : 'Flag Not Set'}</div>
          {modalOpen && (
            <AppointmentModal
              open={modalOpen}
              onClose={handleCloseModal}
              slot={new Date('2023-12-31T14:00:00.000Z')}
              isBooked={false}
              existingBooking={null}
              onSave={handleSaveBooking}
              onRefresh={() => {}}
            />
          )}
          <button data-testid="trigger-save" onClick={() => handleSaveBooking({
            appointmentTime: '2023-12-31T14:00:00.000Z',
            name: 'Test User',
            email: 'test@example.com',
            wechatId: 'test-wechat',
            topic: 'Test Topic'
          })}>
            Trigger Save
          </button>
        </>
      );
    };
    
    // Mock a successful fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    
    // Render the test component
    await act(async () => {
      render(<TestComponent />);
    });
    
    // Verify the modal is open
    expect(screen.getByTestId('modal-status').textContent).toBe('Open');
    
    // Verify the flag is not set
    expect(screen.getByTestId('flag-status').textContent).toBe('Flag Not Set');
    
    // Close the modal
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify the modal is closed
    expect(screen.getByTestId('modal-status').textContent).toBe('Closed');
    
    // Verify the flag is set
    expect(screen.getByTestId('flag-status').textContent).toBe('Flag Set');
    
    // Try to trigger a save while the flag is set
    await act(async () => {
      fireEvent.click(screen.getByTestId('trigger-save'));
    });
    
    // Verify the save function detected the modal close flag
    expect(console.error).toHaveBeenCalledWith('Save attempted while modal close in progress');
    
    // Verify fetch was not called
    expect(mockFetch).not.toHaveBeenCalled();
    
    // Wait for the flag to be cleared
    await waitFor(() => {
      expect(screen.getByTestId('flag-status').textContent).toBe('Flag Not Set');
    }, { timeout: 1000 });
    
    // Try to trigger a save after the flag is cleared
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('trigger-save'));
    });
    
    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/appointments/book', expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.any(String),
    }));
  });
  
  test('should handle race condition between fetch and modal close', async () => {
    // Create a delayed fetch mock to simulate a slow network
    const delayedFetch = jest.fn(async (url, options) => {
      // Check if modal close is in progress
      if (window.__modalCloseInProgress) {
        throw new Error('Fetch aborted: Modal close in progress');
      }
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check again if modal close is in progress
      if (window.__modalCloseInProgress) {
        throw new Error('Modal close started during fetch operation');
      }
      
      return {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      };
    });
    
    // Replace the global fetch with our delayed version
    global.fetch = delayedFetch;
    
    // Create a test component that simulates the dashboard's modal handling
    const TestComponent = () => {
      const [modalOpen, setModalOpen] = useState(true);
      const [saveResult, setSaveResult] = useState(null);
      
      const handleCloseModal = () => {
        console.log('Closing modal in test component');
        
        // Set the modal close flag
        window.__modalCloseInProgress = true;
        console.log('Set __modalCloseInProgress flag to true');
        
        // Close the modal
        setModalOpen(false);
        
        // Clear the flag after a delay
        setTimeout(() => {
          window.__modalCloseInProgress = false;
          console.log('Set __modalCloseInProgress flag to false');
        }, 500);
      };
      
      const handleSaveBooking = async (data) => {
        console.log('Save booking called with data:', data);
        
        try {
          // Attempt to fetch
          const response = await fetch('/api/appointments/book', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          setSaveResult('success');
          return true;
        } catch (error) {
          console.error('Fetch error:', error);
          setSaveResult('error: ' + error.message);
          return false;
        }
      };
      
      return (
        <>
          <div data-testid="modal-status">{modalOpen ? 'Open' : 'Closed'}</div>
          <div data-testid="flag-status">{window.__modalCloseInProgress ? 'Flag Set' : 'Flag Not Set'}</div>
          <div data-testid="save-result">{saveResult || 'No Result'}</div>
          {modalOpen && (
            <AppointmentModal
              open={modalOpen}
              onClose={handleCloseModal}
              slot={new Date('2023-12-31T14:00:00.000Z')}
              isBooked={false}
              existingBooking={null}
              onSave={handleSaveBooking}
              onRefresh={() => {}}
            />
          )}
          <button data-testid="trigger-save" onClick={() => handleSaveBooking({
            appointmentTime: '2023-12-31T14:00:00.000Z',
            name: 'Test User',
            email: 'test@example.com',
            wechatId: 'test-wechat',
            topic: 'Test Topic'
          })}>
            Trigger Save
          </button>
          <button data-testid="close-modal" onClick={handleCloseModal}>
            Close Modal
          </button>
        </>
      );
    };
    
    // Render the test component
    await act(async () => {
      render(<TestComponent />);
    });
    
    // Start the save operation
    let savePromise;
    await act(async () => {
      savePromise = fireEvent.click(screen.getByTestId('trigger-save'));
    });
    
    // Verify fetch was called
    expect(delayedFetch).toHaveBeenCalledTimes(1);
    
    // Close the modal while the fetch is still in progress
    await act(async () => {
      fireEvent.click(screen.getByTestId('close-modal'));
    });
    
    // Verify the modal is closed
    expect(screen.getByTestId('modal-status').textContent).toBe('Closed');
    
    // Verify the flag is set
    expect(screen.getByTestId('flag-status').textContent).toBe('Flag Set');
    
    // Wait for the save operation to complete
    await act(async () => {
      try {
        await savePromise;
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Verify the save result shows the error
    expect(screen.getByTestId('save-result').textContent).toBe('error: Modal close started during fetch operation');
    
    // Wait for the flag to be cleared
    await waitFor(() => {
      expect(screen.getByTestId('flag-status').textContent).toBe('Flag Not Set');
    }, { timeout: 1000 });
  });
});
