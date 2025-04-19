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

describe('Admin Dashboard Delete Functionality', () => {
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

    // Create a mock delete handler that uses fetch
    const handleDeleteBooking = async () => {
      try {
        const response = await fetch('/api/appointments/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: 'test-id-123' }),
        });

        if (response.ok) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        return false;
      }
    };

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

    // Render the AppointmentModal with the mock delete handler
    render(
      <AppointmentModal
        open={true}
        onClose={() => {}}
        slot={new Date(mockBooking.appointmentTime)}
        isBooked={true}
        existingBooking={mockBooking}
        onSave={() => {}}
        onDelete={handleDeleteBooking}
      />
    );

    // Find and click the delete button
    const deleteButton = screen.getByText('button.delete');
    
    // Use act to handle the async operation
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Check that error message is shown
    await waitFor(() => {
      expect(screen.getByText('message.deleteFailed')).toBeInTheDocument();
    });

    // Verify that fetch was called with the correct arguments
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/appointments/delete',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: 'test-id-123' }),
      })
    );
  });

  test('should handle response parsing errors', async () => {
    // Mock fetch to return a response that will cause a JSON parsing error
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Not a valid JSON')
      })
    );

    // Create a mock delete handler that uses fetch
    const handleDeleteBooking = async () => {
      try {
        const response = await fetch('/api/appointments/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: 'test-id-123' }),
        });

        // Try to parse the response text
        const responseText = await response.text();
        console.log('Response text:', responseText);

        try {
          // This will throw an error for invalid JSON
          const data = JSON.parse(responseText);
          console.log('Parsed data:', data);
        } catch (e) {
          console.error('Error parsing response JSON:', e);
        }

        if (response.ok) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        return false;
      }
    };

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

    // Render the AppointmentModal with the mock delete handler
    render(
      <AppointmentModal
        open={true}
        onClose={() => {}}
        slot={new Date(mockBooking.appointmentTime)}
        isBooked={true}
        existingBooking={mockBooking}
        onSave={() => {}}
        onDelete={handleDeleteBooking}
      />
    );

    // Find and click the delete button
    const deleteButton = screen.getByText('button.delete');
    
    // Use act to handle the async operation
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Check that error message is shown
    await waitFor(() => {
      expect(screen.getByText('message.deleteFailed')).toBeInTheDocument();
    });
  });
});
