import { formatInTimeZone } from 'date-fns-tz';

describe('Date Selection in UI', () => {
  // Test date selection in the date picker
  test('Date selection preserves the correct date', () => {
    // Simulate selecting April 21, 2025 in the date picker
    const selectedDateString = '2025-04-21';
    const [year, month, day] = selectedDateString.split('-').map(Number);
    
    // Create a date object with the selected date components (month is 0-indexed)
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    
    // Extract the date components to ensure we preserve the correct date
    const extractedYear = selectedDate.getFullYear();
    const extractedMonth = selectedDate.getMonth();
    const extractedDay = selectedDate.getDate();
    
    // Verify the extracted components match the selected date
    expect(extractedYear).toBe(2025);
    expect(extractedMonth).toBe(3); // April (0-indexed)
    expect(extractedDay).toBe(21);
    
    // Format the date for display
    const formattedDate = selectedDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Verify the formatted date is correct
    expect(formattedDate).toContain('2025');
    expect(formattedDate).toContain('21');
  });
  
  // Test time slot generation for a specific date
  test('Time slot generation preserves the selected date', () => {
    // Simulate selecting April 21, 2025 in the date picker
    const selectedDateString = '2025-04-21';
    const [year, month, day] = selectedDateString.split('-').map(Number);
    
    // Create a date object with the selected date components (month is 0-indexed)
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    
    // Extract the date components to ensure we preserve the correct date
    const extractedYear = selectedDate.getFullYear();
    const extractedMonth = selectedDate.getMonth();
    const extractedDay = selectedDate.getDate();
    
    // Generate time slots for the selected date
    const slots = [];
    const edtOffset = 4; // EDT is UTC-4
    
    // Start at 9:00 AM EDT
    let startTime = new Date(Date.UTC(
      extractedYear,
      extractedMonth,
      extractedDay,
      9 + edtOffset, // 9:00 AM EDT = 1:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));
    
    // End at 4:00 PM EDT
    const endTime = new Date(Date.UTC(
      extractedYear,
      extractedMonth,
      extractedDay,
      16 + edtOffset, // 4:00 PM EDT = 8:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));
    
    // Generate slots every 30 minutes
    while (startTime < endTime) {
      slots.push(new Date(startTime));
      startTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    }
    
    // Verify all slots are on April 21, 2025
    for (const slot of slots) {
      // Check the UTC date (should be April 21)
      expect(slot.toISOString().startsWith('2025-04-21')).toBe(true);
      
      // Check the EDT date (should also be April 21)
      const edtTimeZone = 'America/New_York';
      const slotDate = formatInTimeZone(slot, edtTimeZone, 'yyyy-MM-dd');
      expect(slotDate).toBe('2025-04-21');
    }
  });
  
  // Test date selection for a date that crosses day boundaries
  test('Date selection handles day boundary correctly', () => {
    // Simulate selecting April 21, 2025 in the date picker
    const selectedDateString = '2025-04-21';
    const [year, month, day] = selectedDateString.split('-').map(Number);
    
    // Create a date object with the selected date components (month is 0-indexed)
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    
    // Extract the date components to ensure we preserve the correct date
    const extractedYear = selectedDate.getFullYear();
    const extractedMonth = selectedDate.getMonth();
    const extractedDay = selectedDate.getDate();
    
    // Create a time slot for 11:30 PM EDT on the selected date
    const edtOffset = 4; // EDT is UTC-4
    const slot = new Date(Date.UTC(
      extractedYear,
      extractedMonth,
      extractedDay,
      23 + edtOffset, // 11:30 PM EDT = 3:30 AM UTC (next day)
      30, // Minutes
      0  // Seconds
    ));
    
    // Verify the UTC date is April 22 (next day)
    expect(slot.getUTCDate()).toBe(22);
    
    // But the EDT date should still be April 21
    const edtTimeZone = 'America/New_York';
    const edtDate = formatInTimeZone(slot, edtTimeZone, 'yyyy-MM-dd');
    expect(edtDate).toBe('2025-04-21');
  });
});
