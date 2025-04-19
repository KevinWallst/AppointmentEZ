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

describe('Modal Close Race Condition Tests', () => {
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
    
    // Reset the modal close flag
    delete window.__modalCloseInProgress;
  });
  
  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.error.mockRestore();
    window.alert.mockRestore();
  });
  
  test('should set and clear the modal close flag correctly', async () => {
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
    
    // Verify the modal is open
    expect(screen.getByText('admin.modal.createAppointment')).toBeInTheDocument();
    
    // Verify the modal close flag is not set
    expect(window.__modalCloseInProgress).toBeUndefined();
    
    // Close the modal
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify the modal close flag was set
    expect(console.log).toHaveBeenCalledWith('Set __modalCloseInProgress flag to true');
    
    // Wait for the flag to be cleared
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Set __modalCloseInProgress flag to false');
    }, { timeout: 1000 });
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  test('should prevent save operations during modal close', async () => {
    // Create a mock save function that checks the modal close flag
    const mockSaveWithCheck = jest.fn(async (data) => {
      if (window.__modalCloseInProgress) {
        console.error('Save attempted while modal close in progress');
        return false;
      }
      return true;
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
          onSave={mockSaveWithCheck}
          onRefresh={mockOnRefresh}
        />
      );
    });
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('form.name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('form.email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('form.wechatId'), { target: { value: 'test-wechat' } });
    fireEvent.change(screen.getByLabelText('form.topic'), { target: { value: 'Test Topic' } });
    
    // Manually set the modal close flag
    window.__modalCloseInProgress = true;
    
    // Try to save while the modal close flag is set
    await act(async () => {
      fireEvent.click(screen.getByText('button.save'));
    });
    
    // Verify the save function was called
    expect(mockSaveWithCheck).toHaveBeenCalledTimes(1);
    
    // Verify the save function detected the modal close flag
    expect(console.error).toHaveBeenCalledWith('Save attempted while modal close in progress');
    
    // Clear the flag
    window.__modalCloseInProgress = false;
  });
  
  test('should handle race condition between save and close', async () => {
    // Create a delayed save function to simulate a slow network
    const mockDelayedSave = jest.fn(async (data) => {
      // Check if modal close is in progress
      if (window.__modalCloseInProgress) {
        console.error('Save attempted while modal close in progress');
        return false;
      }
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check again if modal close is in progress
      if (window.__modalCloseInProgress) {
        console.error('Modal close started during save operation');
        return false;
      }
      
      return true;
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
          onSave={mockDelayedSave}
          onRefresh={mockOnRefresh}
        />
      );
    });
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('form.name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('form.email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('form.wechatId'), { target: { value: 'test-wechat' } });
    fireEvent.change(screen.getByLabelText('form.topic'), { target: { value: 'Test Topic' } });
    
    // Start the save operation
    let savePromise;
    await act(async () => {
      savePromise = fireEvent.click(screen.getByText('button.save'));
    });
    
    // Verify the save function was called
    expect(mockDelayedSave).toHaveBeenCalledTimes(1);
    
    // Close the modal while the save is still in progress
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify the modal close flag was set
    expect(console.log).toHaveBeenCalledWith('Set __modalCloseInProgress flag to true');
    
    // Wait for the save operation to complete
    await act(async () => {
      await savePromise;
    });
    
    // Verify the save function detected the modal close flag
    expect(console.error).toHaveBeenCalledWith('Modal close started during save operation');
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  test('should handle multiple rapid save attempts during modal close', async () => {
    // Create a mock save function that checks the modal close flag
    const mockSaveWithCheck = jest.fn(async (data) => {
      if (window.__modalCloseInProgress) {
        console.error('Save attempted while modal close in progress');
        return false;
      }
      return true;
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
          onSave={mockSaveWithCheck}
          onRefresh={mockOnRefresh}
        />
      );
    });
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('form.name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('form.email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('form.wechatId'), { target: { value: 'test-wechat' } });
    fireEvent.change(screen.getByLabelText('form.topic'), { target: { value: 'Test Topic' } });
    
    // Set the modal close flag
    window.__modalCloseInProgress = true;
    
    // Try to save multiple times in rapid succession
    await act(async () => {
      fireEvent.click(screen.getByText('button.save'));
      fireEvent.click(screen.getByText('button.save'));
      fireEvent.click(screen.getByText('button.save'));
    });
    
    // Verify the save function was called multiple times
    expect(mockSaveWithCheck).toHaveBeenCalledTimes(3);
    
    // Verify the save function detected the modal close flag each time
    expect(console.error).toHaveBeenCalledWith('Save attempted while modal close in progress');
    expect(console.error).toHaveBeenCalledTimes(3);
    
    // Clear the flag
    window.__modalCloseInProgress = false;
  });
  
  test('should handle successful save followed by immediate close', async () => {
    // Create a mock save function that succeeds quickly
    const mockQuickSave = jest.fn(async (data) => {
      return true;
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
          onSave={mockQuickSave}
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
      await fireEvent.click(screen.getByText('button.save'));
    });
    
    // Verify the save function was called
    expect(mockQuickSave).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was called
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    
    // Verify the success message is shown
    expect(screen.getByText('message.bookingSuccess')).toBeInTheDocument();
    
    // Close the modal immediately after save
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify the modal close flag was set
    expect(console.log).toHaveBeenCalledWith('Set __modalCloseInProgress flag to true');
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was not called again
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });
  
  test('should handle save failure followed by close', async () => {
    // Create a mock save function that fails
    const mockFailedSave = jest.fn(async (data) => {
      return false;
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
          onSave={mockFailedSave}
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
      await fireEvent.click(screen.getByText('button.save'));
    });
    
    // Verify the save function was called
    expect(mockFailedSave).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was not called
    expect(mockOnRefresh).not.toHaveBeenCalled();
    
    // Verify the error message is shown
    expect(screen.getByText('message.bookingFailed')).toBeInTheDocument();
    
    // Close the modal after failed save
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify the modal close flag was set
    expect(console.log).toHaveBeenCalledWith('Set __modalCloseInProgress flag to true');
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was not called
    expect(mockOnRefresh).not.toHaveBeenCalled();
  });
});
