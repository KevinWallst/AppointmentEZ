import React from 'react';

// Mock for AdminDashboard component
const AdminDashboard = jest.fn(() => {
  return (
    <div data-testid="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <h3>admin.title</h3>
      <div data-testid="calendar-section">Calendar Section</div>
      <div data-testid="bookings-section">Bookings Section</div>
    </div>
  );
});

export default AdminDashboard;
