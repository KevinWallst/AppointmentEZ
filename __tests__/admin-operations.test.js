/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import AdminDashboard from '../app/admin/dashboard/page';
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

describe('Admin Dashboard Operations', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage to simulate authenticated state
    global.localStorage.getItem.mockReturnValue('true');
    
    // Mock successful fetch for bookings
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            bookings: [
              {
                id: 'test-id-123',
                appointmentTime: '2023-12-31T14:00:00.000Z',
                requestTime: '2023-12-01T10:00:00.000Z',
                name: 'Test User',
                email: 'test@example.com',
                wechatId: 'test-wechat',
                topic: 'Test Topic',
                language: 'en'
              }
            ]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  test('should load and display bookings', async () => {
    await act(async () => {
      render(<AdminDashboard />);
    });

    // Wait for bookings to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/bookings'), expect.any(Object));
    });

    // Check if the booking is displayed
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  test('should add a new appointment from admin dashboard', async () => {
    // Mock the booking API
    global.fetch.mockImplementation((url, options) => {
      if (url.includes('/api/appointments/book')) {
        // Parse the request body
        const requestBody = JSON.parse(options.body);
        
        // Check if the request contains the expected data
        expect(requestBody.name).toBe('New User');
        expect(requestBody.email).toBe('new@example.com');
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            booking: {
              id: 'new-id-456',
              ...requestBody
            }
          }),
          text: () => Promise.resolve(JSON.stringify({
            success: true,
            booking: {
              id: 'new-id-456',
              ...requestBody
            }
          })),
          clone: function() { return this; }
        });
      }
      
      // Default response for other requests (like fetching bookings)
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          bookings: [
            {
              id: 'test-id-123',
              appointmentTime: '2023-12-31T14:00:00.000Z',
              requestTime: '2023-12-01T10:00:00.000Z',
              name: 'Test User',
              email: 'test@example.com',
              wechatId: 'test-wechat',
              topic: 'Test Topic',
              language: 'en'
            }
          ]
        }),
        text: () => Promise.resolve(JSON.stringify({
          bookings: [
            {
              id: 'test-id-123',
              appointmentTime: '2023-12-31T14:00:00.000Z',
              requestTime: '2023-12-01T10:00:00.000Z',
              name: 'Test User',
              email: 'test@example.com',
              wechatId: 'test-wechat',
              topic: 'Test Topic',
              language: 'en'
            }
          ]
        })),
        clone: function() { return this; }
      });
    });

    // Mock the onSave function
    const onSaveMock = jest.fn().mockResolvedValue(true);
    
    // Render the AppointmentModal directly for easier testing
    await act(async () => {
      render(
        <AppointmentModal
          open={true}
          onClose={jest.fn()}
          slot={new Date('2023-12-31T15:00:00.000Z')}
          isBooked={false}
          existingBooking={null}
          onSave={onSaveMock}
          onRefresh={jest.fn()}
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

    // Check if onSave was called with the correct data
    await waitFor(() => {
      expect(onSaveMock).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New User',
        email: 'new@example.com',
        wechatId: 'new-wechat',
        topic: 'New Topic'
      }));
    });

    // Check if success message is shown
    await waitFor(() => {
      expect(screen.getByText('message.bookingSuccess')).toBeInTheDocument();
    });
  });

  test('should delete an appointment from admin dashboard', async () => {
    // Mock the delete API
    global.fetch.mockImplementation((url, options) => {
      if (url.includes('/api/appointments/delete')) {
        // Parse the request body
        const requestBody = JSON.parse(options.body);
        
        // Check if the request contains the expected ID
        expect(requestBody.id).toBe('test-id-123');
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            booking: {
              id: 'test-id-123',
              appointmentTime: '2023-12-31T14:00:00.000Z',
              name: 'Test User',
              email: 'test@example.com',
              wechatId: 'test-wechat',
              topic: 'Test Topic',
              language: 'en'
            }
          }),
          text: () => Promise.resolve(JSON.stringify({
            success: true,
            booking: {
              id: 'test-id-123',
              appointmentTime: '2023-12-31T14:00:00.000Z',
              name: 'Test User',
              email: 'test@example.com',
              wechatId: 'test-wechat',
              topic: 'Test Topic',
              language: 'en'
            }
          })),
          clone: function() { return this; }
        });
      }
      
      // Default response for other requests
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          bookings: [
            {
              id: 'test-id-123',
              appointmentTime: '2023-12-31T14:00:00.000Z',
              requestTime: '2023-12-01T10:00:00.000Z',
              name: 'Test User',
              email: 'test@example.com',
              wechatId: 'test-wechat',
              topic: 'Test Topic',
              language: 'en'
            }
          ]
        }),
        text: () => Promise.resolve(JSON.stringify({
          bookings: [
            {
              id: 'test-id-123',
              appointmentTime: '2023-12-31T14:00:00.000Z',
              requestTime: '2023-12-01T10:00:00.000Z',
              name: 'Test User',
              email: 'test@example.com',
              wechatId: 'test-wechat',
              topic: 'Test Topic',
              language: 'en'
            }
          ]
        })),
        clone: function() { return this; }
      });
    });

    // Mock the onDelete function
    const onDeleteMock = jest.fn().mockResolvedValue(true);
    
    // Render the AppointmentModal directly for easier testing
    await act(async () => {
      render(
        <AppointmentModal
          open={true}
          onClose={jest.fn()}
          slot={new Date('2023-12-31T14:00:00.000Z')}
          isBooked={true}
          existingBooking={{
            id: 'test-id-123',
            appointmentTime: '2023-12-31T14:00:00.000Z',
            name: 'Test User',
            email: 'test@example.com',
            wechatId: 'test-wechat',
            topic: 'Test Topic',
            language: 'en'
          }}
          onSave={jest.fn()}
          onDelete={onDeleteMock}
          onRefresh={jest.fn()}
        />
      );
    });

    // Click the delete button
    await act(async () => {
      fireEvent.click(screen.getByText('button.delete'));
    });

    // Check if onDelete was called
    await waitFor(() => {
      expect(onDeleteMock).toHaveBeenCalledTimes(1);
    });

    // Check if success message is shown
    await waitFor(() => {
      expect(screen.getByText('message.deleteSuccess')).toBeInTheDocument();
    });
  });

  test('should handle errors when adding an appointment', async () => {
    // Mock the booking API to return an error
    global.fetch.mockImplementation((url, options) => {
      if (url.includes('/api/appointments/book')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          statusText: 'Conflict',
          json: () => Promise.resolve({
            error: 'Time slot is already booked'
          }),
          text: () => Promise.resolve(JSON.stringify({
            error: 'Time slot is already booked'
          })),
          clone: function() { return this; }
        });
      }
      
      // Default response for other requests
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          bookings: []
        }),
        text: () => Promise.resolve(JSON.stringify({
          bookings: []
        })),
        clone: function() { return this; }
      });
    });

    // Mock the onSave function to simulate the API call
    const onSaveMock = jest.fn().mockImplementation(async () => {
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentTime: '2023-12-31T15:00:00.000Z',
          name: 'New User',
          email: 'new@example.com',
          wechatId: 'new-wechat',
          topic: 'New Topic'
        }),
      });
      return response.ok;
    });
    
    // Render the AppointmentModal directly for easier testing
    await act(async () => {
      render(
        <AppointmentModal
          open={true}
          onClose={jest.fn()}
          slot={new Date('2023-12-31T15:00:00.000Z')}
          isBooked={false}
          existingBooking={null}
          onSave={onSaveMock}
          onRefresh={jest.fn()}
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

    // Check if onSave was called
    await waitFor(() => {
      expect(onSaveMock).toHaveBeenCalledTimes(1);
    });

    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText('message.bookingFailed')).toBeInTheDocument();
    });
  });

  test('should handle errors when deleting an appointment', async () => {
    // Mock the delete API to return an error
    global.fetch.mockImplementation((url, options) => {
      if (url.includes('/api/appointments/delete')) {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({
            error: 'Booking not found'
          }),
          text: () => Promise.resolve(JSON.stringify({
            error: 'Booking not found'
          })),
          clone: function() { return this; }
        });
      }
      
      // Default response for other requests
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          bookings: [
            {
              id: 'test-id-123',
              appointmentTime: '2023-12-31T14:00:00.000Z',
              requestTime: '2023-12-01T10:00:00.000Z',
              name: 'Test User',
              email: 'test@example.com',
              wechatId: 'test-wechat',
              topic: 'Test Topic',
              language: 'en'
            }
          ]
        }),
        text: () => Promise.resolve(JSON.stringify({
          bookings: [
            {
              id: 'test-id-123',
              appointmentTime: '2023-12-31T14:00:00.000Z',
              requestTime: '2023-12-01T10:00:00.000Z',
              name: 'Test User',
              email: 'test@example.com',
              wechatId: 'test-wechat',
              topic: 'Test Topic',
              language: 'en'
            }
          ]
        })),
        clone: function() { return this; }
      });
    });

    // Mock the onDelete function to simulate the API call
    const onDeleteMock = jest.fn().mockImplementation(async () => {
      const response = await fetch('/api/appointments/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'test-id-123'
        }),
      });
      return response.ok;
    });
    
    // Render the AppointmentModal directly for easier testing
    await act(async () => {
      render(
        <AppointmentModal
          open={true}
          onClose={jest.fn()}
          slot={new Date('2023-12-31T14:00:00.000Z')}
          isBooked={true}
          existingBooking={{
            id: 'test-id-123',
            appointmentTime: '2023-12-31T14:00:00.000Z',
            name: 'Test User',
            email: 'test@example.com',
            wechatId: 'test-wechat',
            topic: 'Test Topic',
            language: 'en'
          }}
          onSave={jest.fn()}
          onDelete={onDeleteMock}
          onRefresh={jest.fn()}
        />
      );
    });

    // Click the delete button
    await act(async () => {
      fireEvent.click(screen.getByText('button.delete'));
    });

    // Check if onDelete was called
    await waitFor(() => {
      expect(onDeleteMock).toHaveBeenCalledTimes(1);
    });

    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText('message.deleteFailed')).toBeInTheDocument();
    });
  });
});
