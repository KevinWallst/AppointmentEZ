// Mock for AppointmentModal component
export const AppointmentModal = jest.fn(({ open, onClose, slot, isBooked, existingBooking, onSave, onDelete, onRefresh }) => {
  return {
    open,
    onClose,
    slot,
    isBooked,
    existingBooking,
    onSave,
    onDelete,
    onRefresh,
    render: () => null,
  };
});
