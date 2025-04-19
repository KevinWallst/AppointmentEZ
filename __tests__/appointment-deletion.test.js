/**
 * @jest-environment jsdom
 */

const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');

// Mock the translation function
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
}));

// Mock the fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
);

// Mock component for testing appointment deletion
const AppointmentDeletion = () => {
  const [deleted, setDeleted] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleDelete = async (id) => {
    try {
      const response = await fetch('/api/appointments/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeleted(true);
      } else {
        setError(data.message || 'Failed to delete appointment');
      }
    } catch (err) {
      setError('An error occurred while deleting the appointment');
    }
  };

  return (
    <div>
      {deleted && <div data-testid="success-message">Appointment deleted successfully</div>}
      {error && <div data-testid="error-message">{error}</div>}
      <button onClick={() => handleDelete('123')} data-testid="delete-button">
        Delete Appointment
      </button>
    </div>
  );
};

describe('Appointment Deletion', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should show success message when appointment is deleted', async () => {
    render(<AppointmentDeletion />);
    
    fireEvent.click(screen.getByTestId('delete-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
    
    expect(fetch).toHaveBeenCalledWith('/api/appointments/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: '123' }),
    });
  });

  it('should show error message when deletion fails', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false, message: 'Booking not found' }),
      })
    );
    
    render(<AppointmentDeletion />);
    
    fireEvent.click(screen.getByTestId('delete-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('error-message')).toHaveTextContent('Booking not found');
  });

  it('should show error message when network error occurs', async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    
    render(<AppointmentDeletion />);
    
    fireEvent.click(screen.getByTestId('delete-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('error-message')).toHaveTextContent('An error occurred while deleting the appointment');
  });
});
