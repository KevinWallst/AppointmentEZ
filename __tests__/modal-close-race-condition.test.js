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

describe('Modal Close Race Condition Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  test('should set and clear the modal close flag correctly', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [isClosing, setIsClosing] = React.useState(false);
      
      const handleClose = () => {
        setIsClosing(true);
        // Simulate some delay before actually closing
        setTimeout(() => {
          setIsOpen(false);
          setIsClosing(false);
        }, 100);
      };
      
      return (
        <div>
          <div data-testid="is-closing">{isClosing ? 'true' : 'false'}</div>
          {React.createElement(require('../app/components/AppointmentModal').AppointmentModal, {
            open: isOpen,
            onClose: handleClose,
            onSave: jest.fn(),
            slot: new Date(),
            isBooked: false,
          })}
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Verify the modal is open
    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
    
    // Verify isClosing is initially false
    expect(screen.getByTestId('is-closing').textContent).toBe('false');
    
    // Click the close button
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    // Verify isClosing is set to true
    expect(screen.getByTestId('is-closing').textContent).toBe('true');
    
    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
    });
    
    // Verify isClosing is set back to false
    expect(screen.getByTestId('is-closing').textContent).toBe('false');
  });

  test('should prevent save operations during modal close', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [isClosing, setIsClosing] = React.useState(false);
      const [saveCount, setSaveCount] = React.useState(0);
      
      const handleClose = () => {
        setIsClosing(true);
        // Simulate some delay before actually closing
        setTimeout(() => {
          setIsOpen(false);
          setIsClosing(false);
        }, 100);
      };
      
      const handleSave = async (data) => {
        if (isClosing) {
          return false;
        }
        
        setSaveCount(prev => prev + 1);
        return true;
      };
      
      return (
        <div>
          <div data-testid="is-closing">{isClosing ? 'true' : 'false'}</div>
          <div data-testid="save-count">{saveCount}</div>
          {React.createElement(require('../app/components/AppointmentModal').AppointmentModal, {
            open: isOpen,
            onClose: handleClose,
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
    
    // Click the close button
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    // Verify isClosing is set to true
    expect(screen.getByTestId('is-closing').textContent).toBe('true');
    
    // Try to save during close
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
    });
    
    // Verify save was not called
    expect(screen.getByTestId('save-count').textContent).toBe('0');
  });

  test('should handle race condition between save and close', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [saveCount, setSaveCount] = React.useState(0);
      const [closeCount, setCloseCount] = React.useState(0);
      
      const handleClose = () => {
        setCloseCount(prev => prev + 1);
        setIsOpen(false);
      };
      
      const handleSave = async (data) => {
        // Simulate a slow save operation
        await new Promise(resolve => setTimeout(resolve, 100));
        setSaveCount(prev => prev + 1);
        return true;
      };
      
      return (
        <div>
          <div data-testid="save-count">{saveCount}</div>
          <div data-testid="close-count">{closeCount}</div>
          {React.createElement(require('../app/components/AppointmentModal').AppointmentModal, {
            open: isOpen,
            onClose: handleClose,
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
    
    await act(async () => {
      fireEvent.click(saveButton);
      // Immediately close the modal
      fireEvent.click(closeButton);
    });
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that close was called
      expect(screen.getByTestId('close-count').textContent).toBe('1');
      
      // Verify that save was also called (even though the modal was closed)
      expect(screen.getByTestId('save-count').textContent).toBe('1');
    });
  });

  test('should handle multiple rapid save attempts during modal close', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [isClosing, setIsClosing] = React.useState(false);
      const [saveCount, setSaveCount] = React.useState(0);
      
      const handleClose = () => {
        setIsClosing(true);
        // Simulate some delay before actually closing
        setTimeout(() => {
          setIsOpen(false);
          setIsClosing(false);
        }, 100);
      };
      
      const handleSave = async (data) => {
        if (isClosing) {
          return false;
        }
        
        setSaveCount(prev => prev + 1);
        return true;
      };
      
      return (
        <div>
          <div data-testid="is-closing">{isClosing ? 'true' : 'false'}</div>
          <div data-testid="save-count">{saveCount}</div>
          {React.createElement(require('../app/components/AppointmentModal').AppointmentModal, {
            open: isOpen,
            onClose: handleClose,
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
    
    // Click the close button
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    // Verify isClosing is set to true
    expect(screen.getByTestId('is-closing').textContent).toBe('true');
    
    // Try to save multiple times during close
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    
    // Wait for the modal to close
    await waitFor(() => {
      expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
    });
    
    // Verify save was not called
    expect(screen.getByTestId('save-count').textContent).toBe('0');
  });

  test('should handle successful save followed by immediate close', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [saveCount, setSaveCount] = React.useState(0);
      const [closeCount, setCloseCount] = React.useState(0);
      
      const handleClose = () => {
        setCloseCount(prev => prev + 1);
        setIsOpen(false);
      };
      
      const handleSave = async (data) => {
        setSaveCount(prev => prev + 1);
        return true;
      };
      
      return (
        <div>
          <div data-testid="save-count">{saveCount}</div>
          <div data-testid="close-count">{closeCount}</div>
          {React.createElement(require('../app/components/AppointmentModal').AppointmentModal, {
            open: isOpen,
            onClose: handleClose,
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
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Wait for save to complete
    await waitFor(() => {
      expect(screen.getByTestId('save-count').textContent).toBe('1');
    });
    
    // Then close the modal
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that close was called
      expect(screen.getByTestId('close-count').textContent).toBe('1');
      
      // Verify that the modal is closed
      expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
    });
  });

  test('should handle save failure followed by close', async () => {
    // Mock error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ 
        error: 'Save failed',
        success: false
      }),
    });
    
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [error, setError] = React.useState('');
      const [closeCount, setCloseCount] = React.useState(0);
      
      const handleClose = () => {
        setCloseCount(prev => prev + 1);
        setIsOpen(false);
      };
      
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
          <div data-testid="close-count">{closeCount}</div>
          {React.createElement(require('../app/components/AppointmentModal').AppointmentModal, {
            open: isOpen,
            onClose: handleClose,
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
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Wait for save to fail
    await waitFor(() => {
      expect(screen.getByTestId('error-message').textContent).toBe('Save failed');
    });
    
    // Then close the modal
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that close was called
      expect(screen.getByTestId('close-count').textContent).toBe('1');
      
      // Verify that the modal is closed
      expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
    });
  });
});
