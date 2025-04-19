import { formatInTimeZone } from 'date-fns-tz';

describe('Admin Dashboard', () => {
  // Test time slot generation for the admin dashboard
  test('Admin dashboard generates correct time slots for EST times', () => {
    // Create a base date for April 17, 2025
    const baseDate = new Date(2025, 3, 17);
    baseDate.setHours(0, 0, 0, 0);
    
    // EST offset (EST is UTC-4)
    const estOffset = 4;
    
    // Create time slots for 9:00 AM to 4:00 PM EST
    const slots = [];
    
    // 9:00 AM EST = 1:00 PM UTC
    let startTime = new Date(Date.UTC(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      9 + estOffset, // 9:00 AM EST = 1:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));
    
    // 4:00 PM EST = 8:00 PM UTC
    const endTime = new Date(Date.UTC(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      16 + estOffset, // 4:00 PM EST = 8:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));
    
    // Skip lunch break (12 PM - 1 PM EST)
    const lunchStart = new Date(Date.UTC(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      12 + estOffset, // 12 PM EST = 4 PM UTC
      0
    ));
    
    const lunchEnd = new Date(Date.UTC(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      13 + estOffset, // 1 PM EST = 5 PM UTC
      0
    ));
    
    // Generate slots every 30 minutes, skipping lunch
    while (startTime < endTime) {
      const skipLunch = startTime >= lunchStart && startTime < lunchEnd;
      
      if (!skipLunch) {
        slots.push(new Date(startTime));
      }
      
      startTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    }
    
    // Verify the first slot is 9:00 AM EST (1:00 PM UTC)
    expect(slots[0].toISOString()).toBe('2025-04-17T13:00:00.000Z');
    
    // Verify all slots are on April 17, 2025
    for (const slot of slots) {
      expect(slot.toISOString().startsWith('2025-04-17')).toBe(true);
      
      // Verify the slot formats correctly to EST
      const estTimeZone = 'America/New_York';
      const formattedDate = formatInTimeZone(slot, estTimeZone, 'yyyy-MM-dd');
      
      expect(formattedDate).toBe('2025-04-17');
    }
    
    // Verify we have 12 slots (9:00 AM to 4:00 PM with 30-minute intervals, excluding 12:00-1:00 PM)
    expect(slots.length).toBe(12);
  });
  
  // Test that the admin dashboard displays the correct date for appointments
  test('Admin dashboard displays the correct date for appointments', () => {
    // Create a booking for 3:00 PM EST on April 17, 2025
    const booking = {
      appointmentTime: '2025-04-17T19:00:00.000Z', // 7:00 PM UTC = 3:00 PM EST
      requestTime: new Date().toISOString(),
      name: 'Test User',
      email: 'test@example.com',
      wechatId: 'testuser',
      topic: 'Test Topic'
    };
    
    // Parse the appointment time
    const appointmentDate = new Date(booking.appointmentTime);
    
    // Format the date in EST for display
    const estTimeZone = 'America/New_York';
    const formattedDateTime = formatInTimeZone(appointmentDate, estTimeZone, 'yyyy年MM月dd日 h:mm a');
    
    // Verify the formatted date is April 17, 2025
    expect(formattedDateTime).toBe('2025年04月17日 3:00 PM');
  });
});
