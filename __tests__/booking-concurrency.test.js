/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppointmentModal } from '../app/components/AppointmentModal';

// Mock the language context
jest.mock('../app/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

describe('Booking Concurrency Tests', () => {
  // Mock functions
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnRefresh = jest.fn();
  
  // Test data
  const testSlot = new Date('2023-12-31T14:00:00.000Z');
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock console methods to track calls
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(window, 'alert').mockImplementation();
  });
  
  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.error.mockRestore();
    window.alert.mockRestore();
  });
  
  test('should not attempt to save twice when clicking save button multiple times', async () => {
    // Mock a slow save operation
    mockOnSave.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve(true), 500);
    }));
    
    // Render the modal
    await act(async () => {
      render(
        <AppointmentModal
          open={true}
          onClose={mockOnClose}
          slot={testSlot}
          isBooked={false}
          existingBooking={null}
          onSave={mockOnSave}
          onRefresh={mockOnRefresh}
        />
      );
    });
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('form.name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('form.email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('form.wechatId'), { target: { value: 'test-wechat' } });
    fireEvent.change(screen.getByLabelText('form.topic'), { target: { value: 'Test Topic' } });
    
    // Click the save button multiple times in quick succession
    const saveButton = screen.getByText('button.save');
    
    await act(async () => {
      fireEvent.click(saveButton);
      fireEvent.click(saveButton); // Second click while first is still processing
      fireEvent.click(saveButton); // Third click while first is still processing
    });
    
    // Wait for the save operation to complete
    await waitFor(() => {
      expect(screen.getByText('message.bookingSuccess')).toBeInTheDocument();
    });
    
    // Verify onSave was called exactly once
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    
    // Verify the saveInProgress flag was logged
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Current state:'),
      expect.objectContaining({ saveInProgress: true })
    );
    
    // Verify the "save already in progress" message was logged
    expect(console.log).toHaveBeenCalledWith('Save already in progress, ignoring duplicate save request');
  });
  
  test('should not attempt to save when closing the modal after a successful save', async () => {
    // Mock a successful save operation
    mockOnSave.mockResolvedValue(true);
    
    // Render the modal
    await act(async () => {
      render(
        <AppointmentModal
          open={true}
          onClose={mockOnClose}
          slot={testSlot}
          isBooked={false}
          existingBooking={null}
          onSave={mockOnSave}
          onRefresh={mockOnRefresh}
        />
      );
    });
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('form.name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('form.email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('form.wechatId'), { target: { value: 'test-wechat' } });
    fireEvent.change(screen.getByLabelText('form.topic'), { target: { value: 'Test Topic' } });
    
    // Save the booking
    await act(async () => {
      fireEvent.click(screen.getByText('button.save'));
    });
    
    // Verify onSave was called
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was called
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    
    // Close the modal
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was NOT called again
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    
    // Verify the "skipping refresh callback" message was logged
    expect(console.log).toHaveBeenCalledWith('Skipping refresh callback on modal close to prevent double refreshing');
  });
  
  test('should handle "Time slot is already booked" error correctly', async () => {
    // Mock a save operation that fails with a 409 error
    mockOnSave.mockImplementation(() => {
      // Simulate the server returning a 409 error
      const error = new Error('Time slot is already booked');
      error.status = 409;
      throw error;
    });
    
    // Render the modal
    await act(async () => {
      render(
        <AppointmentModal
          open={true}
          onClose={mockOnClose}
          slot={testSlot}
          isBooked={false}
          existingBooking={null}
          onSave={mockOnSave}
          onRefresh={mockOnRefresh}
        />
      );
    });
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('form.name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('form.email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('form.wechatId'), { target: { value: 'test-wechat' } });
    fireEvent.change(screen.getByLabelText('form.topic'), { target: { value: 'Test Topic' } });
    
    // Try to save the booking
    await act(async () => {
      fireEvent.click(screen.getByText('button.save'));
    });
    
    // Verify onSave was called
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    
    // Verify the error was logged
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Exception during save operation:'),
      expect.any(Error)
    );
    
    // Verify the error message is shown
    expect(screen.getByText('message.errorOccurred')).toBeInTheDocument();
    
    // Verify onRefresh was NOT called
    expect(mockOnRefresh).not.toHaveBeenCalled();
    
    // Close the modal
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was NOT called
    expect(mockOnRefresh).not.toHaveBeenCalled();
  });
  
  test('should handle race conditions when saving and closing quickly', async () => {
    // Mock a slow save operation
    mockOnSave.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve(true), 500);
    }));
    
    // Render the modal
    await act(async () => {
      render(
        <AppointmentModal
          open={true}
          onClose={mockOnClose}
          slot={testSlot}
          isBooked={false}
          existingBooking={null}
          onSave={mockOnSave}
          onRefresh={mockOnRefresh}
        />
      );
    });
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('form.name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('form.email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('form.wechatId'), { target: { value: 'test-wechat' } });
    fireEvent.change(screen.getByLabelText('form.topic'), { target: { value: 'Test Topic' } });
    
    // Click save and then immediately close the modal
    await act(async () => {
      fireEvent.click(screen.getByText('button.save'));
      
      // Immediately try to close the modal
      setTimeout(() => {
        fireEvent.click(screen.getByText('button.cancel'));
      }, 100);
      
      // Wait for the save operation to complete
      await new Promise(resolve => setTimeout(resolve, 600));
    });
    
    // Verify onSave was called
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was called exactly once (by the save operation)
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    
    // Verify the saveInProgress flag was set during the operation
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Current state:'),
      expect.objectContaining({ saveInProgress: true })
    );
  });
});
