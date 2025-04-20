import React from 'react';

// Mock for AppointmentModal component
export const AppointmentModal = jest.fn(({ open, onClose, slot, isBooked, existingBooking, onSave, onDelete, onRefresh }) => {
  if (!open) return null;
  
  return (
    <div data-testid="appointment-modal">
      <div data-testid="modal-content">
        {existingBooking ? (
          <div data-testid="edit-mode">Editing booking</div>
        ) : (
          <div data-testid="new-mode">New booking</div>
        )}
      </div>
      <button data-testid="save-button" onClick={() => onSave && onSave({})}>Save</button>
      {existingBooking && (
        <button data-testid="delete-button" onClick={() => onDelete && onDelete()}>Delete</button>
      )}
      <button data-testid="close-button" onClick={() => onClose && onClose()}>Close</button>
    </div>
  );
});
