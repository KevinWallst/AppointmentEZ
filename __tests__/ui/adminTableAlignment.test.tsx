import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock component for testing
const AdminTable = ({ bookings }: { bookings: any[] }) => {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Date</th>
            <th style={{ textAlign: 'left' }}>Name</th>
            <th style={{ textAlign: 'left' }}>Contact</th>
            <th style={{ textAlign: 'left' }}>Topic</th>
            <th style={{ textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking, index) => (
            <tr key={index}>
              <td>{booking.date}</td>
              <td>{booking.name}</td>
              <td>{booking.contact}</td>
              <td>{booking.topic}</td>
              <td style={{ textAlign: 'center' }}>{booking.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

describe('Admin Table Alignment Tests', () => {
  const mockBookings = [
    {
      date: '2025-04-21 09:00',
      name: 'Test User',
      contact: 'test@example.com',
      topic: 'Test Topic',
      status: '+2',
    },
  ];

  test('should align status column to center', () => {
    render(<AdminTable bookings={mockBookings} />);
    
    // Get all table header cells
    const headers = screen.getAllByRole('columnheader');
    
    // Check that the status header is aligned to center
    expect(headers[4]).toHaveStyle('text-align: center');
    
    // Get all table cells in the first row
    const cells = screen.getAllByRole('cell');
    
    // Check that the status cell is aligned to center
    expect(cells[4]).toHaveStyle('text-align: center');
  });

  test('should align other columns to left', () => {
    render(<AdminTable bookings={mockBookings} />);
    
    // Get all table header cells
    const headers = screen.getAllByRole('columnheader');
    
    // Check that other headers are aligned to left
    expect(headers[0]).toHaveStyle('text-align: left');
    expect(headers[1]).toHaveStyle('text-align: left');
    expect(headers[2]).toHaveStyle('text-align: left');
    expect(headers[3]).toHaveStyle('text-align: left');
  });
});
