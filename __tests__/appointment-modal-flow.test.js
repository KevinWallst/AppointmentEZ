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

describe('AppointmentModal Flow Tests', () => {
  // Mock functions
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnRefresh = jest.fn();
  
  // Test data
  const testSlot = new Date('2023-12-31T14:00:00.000Z');
  const testBooking = {
    id: 'test-id-123',
    appointmentTime: '2023-12-31T14:00:00.000Z',
    name: 'Test User',
    email: 'test@example.com',
    wechatId: 'test-wechat',
    topic: 'Test Topic',
    language: 'en'
  };
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful save
    mockOnSave.mockResolvedValue(true);
    
    // Mock successful delete
    mockOnDelete.mockResolvedValue(true);
  });
  
  test('should handle new booking flow correctly', async () => {
    // Render the modal for a new booking
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
    
    // Verify the modal title
    expect(screen.getByText('admin.modal.createAppointment')).toBeInTheDocument();
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('form.name'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('form.email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('form.wechatId'), { target: { value: 'new-wechat' } });
    fireEvent.change(screen.getByLabelText('form.topic'), { target: { value: 'New Topic' } });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByText('button.save'));
    });
    
    // Verify onSave was called with the correct data
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      appointmentTime: testSlot.toISOString(),
      name: 'New User',
      email: 'new@example.com',
      wechatId: 'new-wechat',
      topic: 'New Topic'
    }));
    
    // Verify onRefresh was called after successful save
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    
    // Verify success message is shown
    expect(screen.getByText('message.bookingSuccess')).toBeInTheDocument();
    
    // Close the modal
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was NOT called again when closing
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });
  
  test('should handle edit booking flow correctly', async () => {
    // Render the modal for editing an existing booking
    await act(async () => {
      render(
        <AppointmentModal
          open={true}
          onClose={mockOnClose}
          slot={testSlot}
          isBooked={true}
          existingBooking={testBooking}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onRefresh={mockOnRefresh}
        />
      );
    });
    
    // Verify the modal title
    expect(screen.getByText('admin.modal.editAppointment')).toBeInTheDocument();
    
    // Verify form is pre-filled with existing booking data
    expect(screen.getByLabelText('form.name')).toHaveValue('Test User');
    expect(screen.getByLabelText('form.email')).toHaveValue('test@example.com');
    expect(screen.getByLabelText('form.wechatId')).toHaveValue('test-wechat');
    expect(screen.getByLabelText('form.topic')).toHaveValue('Test Topic');
    
    // Edit the form
    fireEvent.change(screen.getByLabelText('form.name'), { target: { value: 'Updated User' } });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByText('button.save'));
    });
    
    // Verify onSave was called with the correct data
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      id: 'test-id-123',
      appointmentTime: testSlot.toISOString(),
      name: 'Updated User',
      email: 'test@example.com',
      wechatId: 'test-wechat',
      topic: 'Test Topic',
      language: 'en'
    }));
    
    // Verify onRefresh was called after successful save
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    
    // Verify success message is shown
    expect(screen.getByText('message.updateSuccess')).toBeInTheDocument();
    
    // Close the modal
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was NOT called again when closing
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });
  
  test('should handle delete booking flow correctly', async () => {
    // Render the modal for editing an existing booking
    await act(async () => {
      render(
        <AppointmentModal
          open={true}
          onClose={mockOnClose}
          slot={testSlot}
          isBooked={true}
          existingBooking={testBooking}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onRefresh={mockOnRefresh}
        />
      );
    });
    
    // Click the delete button
    await act(async () => {
      fireEvent.click(screen.getByText('button.delete'));
    });
    
    // Verify onDelete was called
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was called after successful delete
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    
    // Verify success message is shown
    expect(screen.getByText('message.deleteSuccess')).toBeInTheDocument();
    
    // Verify the delete button is now disabled and shows "Deleted"
    const deleteButton = screen.getByText('message.deleted');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton.closest('button')).toBeDisabled();
    
    // Verify the save button is disabled
    const saveButton = screen.getByText('button.save');
    expect(saveButton.closest('button')).toBeDisabled();
    
    // Verify the close button is shown instead of cancel
    expect(screen.getByText('button.close')).toBeInTheDocument();
    expect(screen.queryByText('button.cancel')).not.toBeInTheDocument();
    
    // Click the close button
    await act(async () => {
      fireEvent.click(screen.getByText('button.close'));
    });
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was NOT called again when closing
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });
  
  test('should handle validation errors correctly', async () => {
    // Render the modal for a new booking
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
    
    // Submit the form without filling it
    await act(async () => {
      fireEvent.click(screen.getByText('button.save'));
    });
    
    // Verify validation error is shown
    expect(screen.getByText('message.allFieldsRequired')).toBeInTheDocument();
    
    // Verify onSave was not called
    expect(mockOnSave).not.toHaveBeenCalled();
    
    // Verify onRefresh was not called
    expect(mockOnRefresh).not.toHaveBeenCalled();
  });
  
  test('should handle save failure correctly', async () => {
    // Mock failed save
    mockOnSave.mockResolvedValue(false);
    
    // Render the modal for a new booking
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
    fireEvent.change(screen.getByLabelText('form.name'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('form.email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('form.wechatId'), { target: { value: 'new-wechat' } });
    fireEvent.change(screen.getByLabelText('form.topic'), { target: { value: 'New Topic' } });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByText('button.save'));
    });
    
    // Verify onSave was called
    expect(mockOnSave).toHaveBeenCalled();
    
    // Verify error message is shown
    expect(screen.getByText('message.bookingFailed')).toBeInTheDocument();
    
    // Verify onRefresh was not called
    expect(mockOnRefresh).not.toHaveBeenCalled();
  });
  
  test('should handle delete failure correctly', async () => {
    // Mock failed delete
    mockOnDelete.mockResolvedValue(false);
    
    // Render the modal for editing an existing booking
    await act(async () => {
      render(
        <AppointmentModal
          open={true}
          onClose={mockOnClose}
          slot={testSlot}
          isBooked={true}
          existingBooking={testBooking}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          onRefresh={mockOnRefresh}
        />
      );
    });
    
    // Click the delete button
    await act(async () => {
      fireEvent.click(screen.getByText('button.delete'));
    });
    
    // Verify onDelete was called
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    
    // Verify error message is shown
    expect(screen.getByText('message.deleteFailed')).toBeInTheDocument();
    
    // Verify onRefresh was not called
    expect(mockOnRefresh).not.toHaveBeenCalled();
  });
  
  test('should handle closing without saving correctly', async () => {
    // Render the modal for a new booking
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
    
    // Fill in the form but don't submit
    fireEvent.change(screen.getByLabelText('form.name'), { target: { value: 'New User' } });
    
    // Close the modal without saving
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Verify onSave was not called
    expect(mockOnSave).not.toHaveBeenCalled();
    
    // Verify onRefresh was not called
    expect(mockOnRefresh).not.toHaveBeenCalled();
  });
  
  test('should handle clicking outside the modal correctly', async () => {
    // Render the modal for a new booking
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
    
    // Simulate clicking outside the modal (by triggering the onClose prop of the Dialog)
    await act(async () => {
      // Get the Dialog component and simulate clicking outside
      const dialog = document.querySelector('[role="dialog"]');
      const backdropClick = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      });
      dialog.dispatchEvent(backdropClick);
    });
    
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Verify onRefresh was not called
    expect(mockOnRefresh).not.toHaveBeenCalled();
  });
});
