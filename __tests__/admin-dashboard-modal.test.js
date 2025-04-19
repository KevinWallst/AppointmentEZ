/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
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

// Mock console methods to track calls
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

describe('Admin Dashboard Modal Integration Tests', () => {
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
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('{}'),
        clone: function() { return this; }
      });
    });
    
    // Mock console methods
    console.log = (...args) => {
      mockConsoleLog(...args);
      originalConsoleLog(...args);
    };
    console.error = (...args) => {
      mockConsoleError(...args);
      originalConsoleError(...args);
    };
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  test('should open modal when clicking a time slot', async () => {
    // Mock the date-fns functions
    jest.mock('date-fns', () => ({
      ...jest.requireActual('date-fns'),
      isSameDay: () => true,
      format: () => '2023-12-31',
    }));
    
    // Render the dashboard
    let container;
    await act(async () => {
      const result = render(<AdminDashboard />);
      container = result.container;
    });
    
    // Wait for bookings to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/bookings'), expect.any(Object));
    });
    
    // Mock the handleTimeSlotClick function
    const mockHandleTimeSlotClick = jest.fn();
    
    // Create a test component that simulates the dashboard's modal handling
    const TestComponent = () => {
      const [modalOpen, setModalOpen] = useState(false);
      const [selectedSlot, setSelectedSlot] = useState(null);
      
      const handleTimeSlotClick = () => {
        mockHandleTimeSlotClick();
        setSelectedSlot(new Date('2023-12-31T14:00:00.000Z'));
        setModalOpen(true);
      };
      
      const handleCloseModal = () => {
        console.log('Closing modal in test component');
        setModalOpen(false);
        setSelectedSlot(null);
      };
      
      return (
        <>
          <button data-testid="time-slot" onClick={handleTimeSlotClick}>14:00</button>
          <AppointmentModal
            open={modalOpen}
            onClose={handleCloseModal}
            slot={selectedSlot}
            isBooked={false}
            existingBooking={null}
            onSave={jest.fn().mockResolvedValue(true)}
            onRefresh={jest.fn()}
          />
        </>
      );
    };
    
    // Render the test component
    await act(async () => {
      render(<TestComponent />);
    });
    
    // Click a time slot
    await act(async () => {
      fireEvent.click(screen.getByTestId('time-slot'));
    });
    
    // Verify the modal was opened
    expect(mockHandleTimeSlotClick).toHaveBeenCalledTimes(1);
    
    // Verify the modal title is shown
    await waitFor(() => {
      expect(screen.getByText('admin.modal.createAppointment')).toBeInTheDocument();
    });
  });
  
  test('should handle modal close correctly', async () => {
    // Create a test component that simulates the dashboard's modal handling
    const TestComponent = () => {
      const [modalOpen, setModalOpen] = useState(true);
      const [refreshCount, setRefreshCount] = useState(0);
      
      const handleCloseModal = () => {
        console.log('Closing modal in test component');
        setModalOpen(false);
        // Simulate refreshing data
        setRefreshCount(prev => prev + 1);
      };
      
      const handleRefresh = () => {
        console.log('Refresh callback called');
        setRefreshCount(prev => prev + 1);
      };
      
      return (
        <>
          <div data-testid="refresh-count">{refreshCount}</div>
          <AppointmentModal
            open={modalOpen}
            onClose={handleCloseModal}
            slot={new Date('2023-12-31T14:00:00.000Z')}
            isBooked={false}
            existingBooking={null}
            onSave={jest.fn().mockResolvedValue(true)}
            onRefresh={handleRefresh}
          />
        </>
      );
    };
    
    // Render the test component
    await act(async () => {
      render(<TestComponent />);
    });
    
    // Verify the modal is open
    expect(screen.getByText('admin.modal.createAppointment')).toBeInTheDocument();
    
    // Initial refresh count should be 0
    expect(screen.getByTestId('refresh-count').textContent).toBe('0');
    
    // Close the modal
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify the refresh count was incremented only once
    expect(screen.getByTestId('refresh-count').textContent).toBe('1');
    
    // Verify the modal was closed
    expect(screen.queryByText('admin.modal.createAppointment')).not.toBeInTheDocument();
    
    // Verify the console logs
    expect(mockConsoleLog).toHaveBeenCalledWith('%c=== MODAL CLOSE TRIGGERED ===', expect.any(String));
    expect(mockConsoleLog).toHaveBeenCalledWith('Skipping refresh callback on modal close to prevent double refreshing');
    expect(mockConsoleLog).toHaveBeenCalledWith('Closing modal in test component');
    expect(mockConsoleLog).toHaveBeenCalledWith('%c=== MODAL CLOSE COMPLETED ===', expect.any(String));
  });
  
  test('should handle save and close without double refreshing', async () => {
    // Create a test component that simulates the dashboard's modal handling
    const TestComponent = () => {
      const [modalOpen, setModalOpen] = useState(true);
      const [refreshCount, setRefreshCount] = useState(0);
      
      const handleCloseModal = () => {
        console.log('Closing modal in test component');
        setModalOpen(false);
        // Simulate refreshing data
        setRefreshCount(prev => prev + 1);
      };
      
      const handleRefresh = () => {
        console.log('Refresh callback called');
        setRefreshCount(prev => prev + 1);
      };
      
      const handleSave = async () => {
        console.log('Save function called');
        // Simulate successful save
        await new Promise(resolve => setTimeout(resolve, 100));
        // Return true to indicate success
        return true;
      };
      
      return (
        <>
          <div data-testid="refresh-count">{refreshCount}</div>
          <AppointmentModal
            open={modalOpen}
            onClose={handleCloseModal}
            slot={new Date('2023-12-31T14:00:00.000Z')}
            isBooked={false}
            existingBooking={null}
            onSave={handleSave}
            onRefresh={handleRefresh}
          />
        </>
      );
    };
    
    // Render the test component
    await act(async () => {
      render(<TestComponent />);
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
    
    // Verify the success message is shown
    expect(screen.getByText('message.bookingSuccess')).toBeInTheDocument();
    
    // Verify the refresh count was incremented once
    expect(screen.getByTestId('refresh-count').textContent).toBe('1');
    
    // Close the modal
    await act(async () => {
      fireEvent.click(screen.getByText('button.cancel'));
    });
    
    // Verify the refresh count was incremented again (to 2)
    expect(screen.getByTestId('refresh-count').textContent).toBe('2');
    
    // Verify the console logs
    expect(mockConsoleLog).toHaveBeenCalledWith('Save function called');
    expect(mockConsoleLog).toHaveBeenCalledWith('Refresh callback called');
    expect(mockConsoleLog).toHaveBeenCalledWith('%c=== MODAL CLOSE TRIGGERED ===', expect.any(String));
    expect(mockConsoleLog).toHaveBeenCalledWith('Skipping refresh callback on modal close to prevent double refreshing');
    expect(mockConsoleLog).toHaveBeenCalledWith('Closing modal in test component');
  });
});
