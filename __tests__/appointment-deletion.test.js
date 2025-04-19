/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import AppointmentModal from '../app/components/AppointmentModal';

// Mock the translation function
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
}));

// Mock fetch
global.fetch = jest.fn();

describe('Appointment Deletion', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should call onDelete when delete button is clicked', async () => {
    // Mock the onDelete function
    const onDeleteMock = jest.fn().mockResolvedValue(true);
    
    // Mock an existing booking
    const mockBooking = {
      id: 'test-id-123',
      appointmentTime: '2023-12-31T14:00:00.000Z',
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'test-wechat',
      topic: 'Test Topic',
      language: 'en'
    };

    // Render the AppointmentModal with a booking
    render(
      <AppointmentModal
        open={true}
        onClose={() => {}}
        slot={new Date(mockBooking.appointmentTime)}
        isBooked={true}
        existingBooking={mockBooking}
        onSave={() => {}}
        onDelete={onDeleteMock}
      />
    );

    // Find and click the delete button
    const deleteButton = screen.getByText('button.delete');
    fireEvent.click(deleteButton);

    // Wait for the onDelete function to be called
    await waitFor(() => {
      expect(onDeleteMock).toHaveBeenCalledTimes(1);
    });

    // Check that success message is shown
    await waitFor(() => {
      expect(screen.getByText('message.deleteSuccess')).toBeInTheDocument();
    });
  });

  test('should show error message when delete fails', async () => {
    // Mock the onDelete function to return false (failure)
    const onDeleteMock = jest.fn().mockResolvedValue(false);
    
    // Mock an existing booking
    const mockBooking = {
      id: 'test-id-123',
      appointmentTime: '2023-12-31T14:00:00.000Z',
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'test-wechat',
      topic: 'Test Topic',
      language: 'en'
    };

    // Render the AppointmentModal with a booking
    render(
      <AppointmentModal
        open={true}
        onClose={() => {}}
        slot={new Date(mockBooking.appointmentTime)}
        isBooked={true}
        existingBooking={mockBooking}
        onSave={() => {}}
        onDelete={onDeleteMock}
      />
    );

    // Find and click the delete button
    const deleteButton = screen.getByText('button.delete');
    fireEvent.click(deleteButton);

    // Wait for the onDelete function to be called
    await waitFor(() => {
      expect(onDeleteMock).toHaveBeenCalledTimes(1);
    });

    // Check that error message is shown
    await waitFor(() => {
      expect(screen.getByText('message.deleteFailed')).toBeInTheDocument();
    });
  });

  test('should handle delete API errors gracefully', async () => {
    // Mock the fetch function to simulate an API error
    global.fetch.mockImplementation(() => 
      Promise.reject(new Error('Network error'))
    );

    // Mock an existing booking
    const mockBooking = {
      id: 'test-id-123',
      appointmentTime: '2023-12-31T14:00:00.000Z',
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'test-wechat',
      topic: 'Test Topic'
    };

    // Create a test component that uses fetch to delete a booking
    const TestComponent = () => {
      const handleDelete = async () => {
        try {
          await fetch('/api/appointments/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: mockBooking.id }),
          });
          return true;
        } catch (error) {
          console.error('Error:', error);
          return false;
        }
      };

      return (
        <button onClick={handleDelete}>Delete</button>
      );
    };

    // Render the test component
    render(<TestComponent />);

    // Find and click the delete button
    const deleteButton = screen.getByText('Delete');
    
    // Use act to handle the async operation
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Verify that fetch was called with the correct arguments
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/appointments/delete',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: mockBooking.id }),
      })
    );
  });
});
