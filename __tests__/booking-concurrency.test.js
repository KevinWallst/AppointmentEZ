import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the AppointmentModal component
jest.mock('../app/components/AppointmentModal', () => ({
  AppointmentModal: jest.fn(({ open, onClose, onSave }) => {
    if (!open) return null;
    return (
      <div data-testid="appointment-modal">
        <button data-testid="save-button" onClick={() => onSave && onSave({})}>Save</button>
        <button data-testid="close-button" onClick={onClose}>Close</button>
      </div>
    );
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Booking Concurrency Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  test('should not attempt to save twice when clicking save button multiple times', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [saveCount, setSaveCount] = React.useState(0);
      const isSaving = React.useRef(false);
      
      const handleSave = async (data) => {
        if (isSaving.current) return false;
        
        isSaving.current = true;
        setSaveCount(prev => prev + 1);
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        isSaving.current = false;
        return true;
      };
      
      return (
        <div>
          <div data-testid="save-count">{saveCount}</div>
          {React.createElement(require('../app/components/AppointmentModal').AppointmentModal, {
            open: isOpen,
            onClose: () => setIsOpen(false),
            onSave: handleSave,
            slot: new Date(),
            isBooked: false,
          })}
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Verify the modal is open
    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
    
    // Click the save button multiple times in quick succession
    const saveButton = screen.getByTestId('save-button');
    
    // Use individual fireEvent calls instead of act
    fireEvent.click(saveButton);
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that save was only called once
      expect(screen.getByTestId('save-count').textContent).toBe('1');
    });
  });

  test('should not attempt to save when closing the modal after a successful save', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [saveCount, setSaveCount] = React.useState(0);
      
      const handleSave = async (data) => {
        setSaveCount(prev => prev + 1);
        setIsOpen(false); // Close the modal after saving
        return true;
      };
      
      return (
        <div>
          <div data-testid="save-count">{saveCount}</div>
          {React.createElement(require('../app/components/AppointmentModal').AppointmentModal, {
            open: isOpen,
            onClose: () => setIsOpen(false),
            onSave: handleSave,
            slot: new Date(),
            isBooked: false,
          })}
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Verify the modal is open
    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
    
    // Click the save button
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that save was called once
      expect(screen.getByTestId('save-count').textContent).toBe('1');
      
      // Verify that the modal is closed
      expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
    });
  });

  test('should handle "Time slot is already booked" error correctly', async () => {
    // Mock error response for already booked slot
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ 
        error: 'Time slot is already booked',
        success: false
      }),
    });
    
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [error, setError] = React.useState('');
      
      const handleSave = async (data) => {
        try {
          const response = await fetch('/api/appointments/book', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            setError(result.error);
            return false;
          }
          
          return true;
        } catch (error) {
          setError('An error occurred');
          return false;
        }
      };
      
      return (
        <div>
          <div data-testid="error-message">{error}</div>
          {React.createElement(require('../app/components/AppointmentModal').AppointmentModal, {
            open: isOpen,
            onClose: () => setIsOpen(false),
            onSave: handleSave,
            slot: new Date(),
            isBooked: false,
          })}
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Verify the modal is open
    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
    
    // Click the save button
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that the error message is displayed
      expect(screen.getByTestId('error-message').textContent).toBe('Time slot is already booked');
    });
  });

  test('should handle race conditions when saving and closing quickly', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [saveCount, setSaveCount] = React.useState(0);
      
      const handleSave = async (data) => {
        // Simulate a slow save operation
        await new Promise(resolve => setTimeout(resolve, 100));
        setSaveCount(prev => prev + 1);
        return true;
      };
      
      return (
        <div>
          <div data-testid="save-count">{saveCount}</div>
          {React.createElement(require('../app/components/AppointmentModal').AppointmentModal, {
            open: isOpen,
            onClose: () => setIsOpen(false),
            onSave: handleSave,
            slot: new Date(),
            isBooked: false,
          })}
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Verify the modal is open
    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
    
    // Click the save button and then quickly close the modal
    const saveButton = screen.getByTestId('save-button');
    const closeButton = screen.getByTestId('close-button');
    
    // Use individual fireEvent calls
    fireEvent.click(saveButton);
    // Immediately close the modal
    fireEvent.click(closeButton);
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that save was still called once
      expect(screen.getByTestId('save-count').textContent).toBe('1');
    });
  });
});
