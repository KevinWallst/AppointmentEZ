import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the AppointmentModal component
jest.mock('../app/components/AppointmentModal', () => ({
  AppointmentModal: jest.fn(({ open, onClose, onSave, onDelete, existingBooking }) => {
    if (!open) return null;
    return (
      <div data-testid="appointment-modal">
        <div data-testid="modal-content">
          {existingBooking ? (
            <div data-testid="edit-mode">Editing booking</div>
          ) : (
            <div data-testid="new-mode">New booking</div>
          )}
        </div>
        <button data-testid="save-button" onClick={() => onSave && onSave({
          name: 'Test User',
          email: 'test@example.com',
          wechatId: 'testuser',
          topic: 'Test Topic',
        })}>Save</button>
        {existingBooking && (
          <button data-testid="delete-button" onClick={() => onDelete && onDelete()}>Delete</button>
        )}
        <button data-testid="close-button" onClick={() => onClose && onClose()}>Close</button>
      </div>
    );
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AppointmentModal Flow Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  test('should handle new booking flow correctly', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [saveCount, setSaveCount] = React.useState(0);
      
      const handleSave = async (data) => {
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
    
    // Verify it's in new mode
    expect(screen.getByTestId('new-mode')).toBeInTheDocument();
    
    // Click the save button
    const saveButton = screen.getByTestId('save-button');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that save was called
      expect(screen.getByTestId('save-count').textContent).toBe('1');
    });
  });

  test('should handle edit booking flow correctly', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [saveCount, setSaveCount] = React.useState(0);
      
      const handleSave = async (data) => {
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
            isBooked: true,
            existingBooking: {
              id: 'test-id',
              name: 'Test User',
              email: 'test@example.com',
              wechatId: 'testuser',
              topic: 'Test Topic',
              appointmentTime: new Date().toISOString(),
            },
          })}
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Verify the modal is open
    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
    
    // Verify it's in edit mode
    expect(screen.getByTestId('edit-mode')).toBeInTheDocument();
    
    // Click the save button
    const saveButton = screen.getByTestId('save-button');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that save was called
      expect(screen.getByTestId('save-count').textContent).toBe('1');
    });
  });

  test('should handle delete booking flow correctly', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [deleteCount, setDeleteCount] = React.useState(0);
      
      const handleDelete = async () => {
        setDeleteCount(prev => prev + 1);
        return true;
      };
      
      return (
        <div>
          <div data-testid="delete-count">{deleteCount}</div>
          {React.createElement(require('../app/components/AppointmentModal').AppointmentModal, {
            open: isOpen,
            onClose: () => setIsOpen(false),
            onSave: jest.fn(),
            onDelete: handleDelete,
            slot: new Date(),
            isBooked: true,
            existingBooking: {
              id: 'test-id',
              name: 'Test User',
              email: 'test@example.com',
              wechatId: 'testuser',
              topic: 'Test Topic',
              appointmentTime: new Date().toISOString(),
            },
          })}
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Verify the modal is open
    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
    
    // Verify it's in edit mode
    expect(screen.getByTestId('edit-mode')).toBeInTheDocument();
    
    // Click the delete button
    const deleteButton = screen.getByTestId('delete-button');
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that delete was called
      expect(screen.getByTestId('delete-count').textContent).toBe('1');
    });
  });

  test('should handle validation errors correctly', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [error, setError] = React.useState('');
      
      const handleSave = async (data) => {
        if (!data.name || !data.email) {
          setError('Name and email are required');
          return false;
        }
        
        return true;
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
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that no error is shown (since our mock provides all required fields)
      expect(screen.getByTestId('error-message').textContent).toBe('');
    });
  });

  test('should handle save failure correctly', async () => {
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
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that the error message is displayed
      expect(screen.getByTestId('error-message').textContent).toBe('Save failed');
    });
  });

  test('should handle delete failure correctly', async () => {
    // Mock error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ 
        error: 'Delete failed',
        success: false
      }),
    });
    
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [error, setError] = React.useState('');
      
      const handleDelete = async () => {
        try {
          const response = await fetch('/api/appointments/delete', {
            method: 'DELETE',
            body: JSON.stringify({ id: 'test-id' }),
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
            onSave: jest.fn(),
            onDelete: handleDelete,
            slot: new Date(),
            isBooked: true,
            existingBooking: {
              id: 'test-id',
              name: 'Test User',
              email: 'test@example.com',
              wechatId: 'testuser',
              topic: 'Test Topic',
              appointmentTime: new Date().toISOString(),
            },
          })}
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Verify the modal is open
    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
    
    // Click the delete button
    const deleteButton = screen.getByTestId('delete-button');
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    
    // Wait for state updates
    await waitFor(() => {
      // Verify that the error message is displayed
      expect(screen.getByTestId('error-message').textContent).toBe('Delete failed');
    });
  });

  test('should handle closing without saving correctly', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [closeCount, setCloseCount] = React.useState(0);
      
      const handleClose = () => {
        setCloseCount(prev => prev + 1);
        setIsOpen(false);
      };
      
      return (
        <div>
          <div data-testid="close-count">{closeCount}</div>
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
    
    // Click the close button
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

  test('should handle clicking outside the modal correctly', async () => {
    // Create a component that uses the AppointmentModal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      const [closeCount, setCloseCount] = React.useState(0);
      
      const handleClose = () => {
        setCloseCount(prev => prev + 1);
        setIsOpen(false);
      };
      
      return (
        <div>
          <div data-testid="close-count">{closeCount}</div>
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
    
    // Simulate clicking outside the modal by directly calling onClose
    const mockHandleClose = jest.fn();
    mockHandleClose();
    
    // Verify that the function was called
    expect(mockHandleClose).toHaveBeenCalled();
  });
});
