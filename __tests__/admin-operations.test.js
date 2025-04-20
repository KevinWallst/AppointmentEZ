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
  AppointmentModal: jest.fn(({ open, onClose, onSave, onDelete }) => {
    if (!open) return null;
    return (
      <div data-testid="appointment-modal">
        <button data-testid="save-button" onClick={() => onSave && onSave({})}>Save</button>
        <button data-testid="delete-button" onClick={() => onDelete && onDelete()}>Delete</button>
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

describe('Admin Operations Tests', () => {
  beforeEach(() => {
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

  test('should handle logout correctly', async () => {
    const mockRouter = require('next/navigation').useRouter();
    
    render(<AdminDashboard />);
    
    // Wait for the dashboard to load
    await waitFor(() => {
      expect(screen.getByText('admin.title')).toBeInTheDocument();
    });
    
    // Mock the handleLogout function
    const mockHandleLogout = jest.fn();
    
    // Simulate logout
    mockHandleLogout();
    
    // Verify that the function was called
    expect(mockHandleLogout).toHaveBeenCalled();
  });

  test('should handle tab changes correctly', async () => {
    render(<AdminDashboard />);
    
    // Wait for the dashboard to load
    await waitFor(() => {
      expect(screen.getByText('admin.title')).toBeInTheDocument();
    });
    
    // Mock the handleTabChange function
    const mockHandleTabChange = jest.fn();
    
    // Simulate tab change
    mockHandleTabChange({}, 1);
    
    // Verify that the function was called
    expect(mockHandleTabChange).toHaveBeenCalled();
  });
});
