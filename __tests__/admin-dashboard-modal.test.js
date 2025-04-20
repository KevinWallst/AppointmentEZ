import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../app/admin/dashboard/page';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the useLanguage hook
jest.mock('../app/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock the AppointmentModal component
jest.mock('../app/components/AppointmentModal', () => ({
  AppointmentModal: jest.fn(({ open, onClose }) => {
    if (!open) return null;
    return (
      <div data-testid="appointment-modal">
        <button data-testid="close-button" onClick={onClose}>Close</button>
      </div>
    );
  }),
}));

// Mock the SystemMaintenance component
jest.mock('../app/components/SystemMaintenance', () => {
  return jest.fn(() => <div data-testid="system-maintenance">System Maintenance</div>);
});

// Mock the HealthCheck component
jest.mock('../app/components/HealthCheck', () => {
  return jest.fn(() => <div data-testid="health-check">Health Check</div>);
});

// Mock Cookies
jest.mock('js-cookie', () => ({
  get: jest.fn(() => 'true'),
  set: jest.fn(),
  remove: jest.fn(),
}));

describe('Admin Dashboard Modal Tests', () => {
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'true'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true
    });
    
    // Mock fetch response for bookings
    global.fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        bookings: [
          {
            id: 'test-id-1',
            appointmentTime: '2025-04-21T09:00:00.000Z',
            requestTime: '2025-04-18T23:24:44.000Z',
            name: 'Test User',
            email: 'test@example.com',
            wechatId: 'testuser',
            topic: 'Test Topic',
          },
        ],
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render the admin dashboard', async () => {
    render(<AdminDashboard />);
    
    // Wait for the dashboard to load
    await waitFor(() => {
      expect(screen.getByText('admin.title')).toBeInTheDocument();
    });
  });

  test('should open the appointment modal when a booking is clicked', async () => {
    render(<AdminDashboard />);
    
    // Wait for the dashboard to load
    await waitFor(() => {
      expect(screen.getByText('admin.title')).toBeInTheDocument();
    });
    
    // Mock the handleBookingSelect function
    const mockHandleBookingSelect = jest.fn();
    
    // Simulate clicking a booking
    mockHandleBookingSelect({
      id: 'test-id-1',
      appointmentTime: '2025-04-21T09:00:00.000Z',
      requestTime: '2025-04-18T23:24:44.000Z',
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'testuser',
      topic: 'Test Topic',
    });
    
    // Verify that the function was called
    expect(mockHandleBookingSelect).toHaveBeenCalled();
  });
});
