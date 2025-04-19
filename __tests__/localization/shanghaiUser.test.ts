import { formatInTimeZone } from 'date-fns-tz';

describe('Shanghai User Time Zone Handling', () => {
  // Test time slot display for a user in Shanghai (UTC+8)
  test('User in Shanghai sees correct local time for EDT time slots', () => {
    // Simulate selecting April 21, 2025 in the date picker
    const selectedDateString = '2025-04-21';
    const [year, month, day] = selectedDateString.split('-').map(Number);
    
    // Create a date object with the selected date components (month is 0-indexed)
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    
    // Extract the date components to ensure we preserve the correct date
    const extractedYear = selectedDate.getFullYear();
    const extractedMonth = selectedDate.getMonth();
    const extractedDay = selectedDate.getDate();
    
    // Create a time slot for 10:00 AM EDT on the selected date
    const edtOffset = 4; // EDT is UTC-4
    const slot = new Date(Date.UTC(
      extractedYear,
      extractedMonth,
      extractedDay,
      10 + edtOffset, // 10:00 AM EDT = 2:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));
    
    // Verify the slot is on April 21, 2025 at 2:00 PM UTC
    expect(slot.toISOString()).toBe('2025-04-21T14:00:00.000Z');
    
    // Format the time in EDT (America/New_York)
    const edtTimeZone = 'America/New_York';
    const edtFormattedTime = formatInTimeZone(slot, edtTimeZone, 'h:mm a');
    expect(edtFormattedTime).toBe('10:00 AM');
    
    // Format the time in Shanghai time (Asia/Shanghai, UTC+8)
    const shanghaiTimeZone = 'Asia/Shanghai';
    const shanghaiFormattedTime = formatInTimeZone(slot, shanghaiTimeZone, 'h:mm a');
    const shanghaiFormattedDate = formatInTimeZone(slot, shanghaiTimeZone, 'yyyy-MM-dd');
    
    // 2:00 PM UTC = 10:00 PM Shanghai time (UTC+8)
    expect(shanghaiFormattedTime).toBe('10:00 PM');
    
    // Verify the date in Shanghai (should be April 21, 2025)
    expect(shanghaiFormattedDate).toBe('2025-04-21');
    
    // Test a time slot that crosses day boundary for Shanghai users
    // Create a time slot for 3:00 PM EDT on April 21, 2025
    const lateSlot = new Date(Date.UTC(
      extractedYear,
      extractedMonth,
      extractedDay,
      15 + edtOffset, // 3:00 PM EDT = 7:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));
    
    // Format the time in Shanghai time
    const shanghaiLateTime = formatInTimeZone(lateSlot, shanghaiTimeZone, 'h:mm a');
    const shanghaiLateDate = formatInTimeZone(lateSlot, shanghaiTimeZone, 'yyyy-MM-dd');
    
    // 7:00 PM UTC = 3:00 AM Shanghai time (next day)
    expect(shanghaiLateTime).toBe('3:00 AM');
    
    // Verify the date in Shanghai (should be April 22, 2025 - next day)
    expect(shanghaiLateDate).toBe('2025-04-22');
    
    // Verify the original date in EDT is still April 21
    const edtLateDate = formatInTimeZone(lateSlot, edtTimeZone, 'yyyy-MM-dd');
    expect(edtLateDate).toBe('2025-04-21');
  });
  
  // Test displaying time slots to a user in Shanghai
  test('Time slot display for Shanghai user shows correct local time', () => {
    // Create time slots for April 21, 2025 (9:00 AM to 4:00 PM EDT)
    const slots = [];
    const year = 2025;
    const month = 3; // April (0-indexed)
    const day = 21;
    const edtOffset = 4; // EDT is UTC-4
    
    // Start at 9:00 AM EDT
    let startTime = new Date(Date.UTC(
      year,
      month,
      day,
      9 + edtOffset, // 9:00 AM EDT = 1:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));
    
    // End at 4:00 PM EDT
    const endTime = new Date(Date.UTC(
      year,
      month,
      day,
      16 + edtOffset, // 4:00 PM EDT = 8:00 PM UTC
      0, // Minutes
      0  // Seconds
    ));
    
    // Generate slots every 30 minutes
    while (startTime < endTime) {
      slots.push(new Date(startTime));
      startTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    }
    
    // Verify we have the expected number of slots
    expect(slots.length).toBe(14); // 7 hours with 2 slots per hour
    
    // Format each slot for display to a user in Shanghai
    const shanghaiTimeZone = 'Asia/Shanghai';
    const displayedSlots = slots.map(slot => {
      return {
        utcTime: slot.toISOString(),
        shanghaiTime: formatInTimeZone(slot, shanghaiTimeZone, 'h:mm a'),
        shanghaiDate: formatInTimeZone(slot, shanghaiTimeZone, 'yyyy-MM-dd'),
        edtTime: formatInTimeZone(slot, 'America/New_York', 'h:mm a'),
        edtDate: formatInTimeZone(slot, 'America/New_York', 'yyyy-MM-dd')
      };
    });
    
    // Verify the first slot (9:00 AM EDT = 9:00 PM Shanghai time)
    expect(displayedSlots[0].edtTime).toBe('9:00 AM');
    expect(displayedSlots[0].shanghaiTime).toBe('9:00 PM');
    expect(displayedSlots[0].edtDate).toBe('2025-04-21');
    expect(displayedSlots[0].shanghaiDate).toBe('2025-04-21');
    
    // Verify a slot that crosses day boundary for Shanghai users
    // 3:00 PM EDT = 3:00 AM Shanghai time (next day)
    const lateSlotIndex = 12; // 3:00 PM EDT is the 12th slot (9:00 AM + 6 hours)
    expect(displayedSlots[lateSlotIndex].edtTime).toBe('3:00 PM');
    expect(displayedSlots[lateSlotIndex].shanghaiTime).toBe('3:00 AM');
    expect(displayedSlots[lateSlotIndex].edtDate).toBe('2025-04-21');
    expect(displayedSlots[lateSlotIndex].shanghaiDate).toBe('2025-04-22');
    
    // Simulate displaying these slots to a user in Shanghai
    // The UI should show the Shanghai time but store the UTC time
    const uiDisplayForShanghai = displayedSlots.map(slot => {
      return {
        displayTime: slot.shanghaiTime,
        displayDate: slot.shanghaiDate,
        storedUtcTime: slot.utcTime
      };
    });
    
    // Verify the UI display for the first slot
    expect(uiDisplayForShanghai[0].displayTime).toBe('9:00 PM');
    expect(uiDisplayForShanghai[0].displayDate).toBe('2025-04-21');
    expect(uiDisplayForShanghai[0].storedUtcTime).toBe('2025-04-21T13:00:00.000Z');
    
    // Verify the UI display for a slot that crosses day boundary
    expect(uiDisplayForShanghai[lateSlotIndex].displayTime).toBe('3:00 AM');
    expect(uiDisplayForShanghai[lateSlotIndex].displayDate).toBe('2025-04-22');
    expect(uiDisplayForShanghai[lateSlotIndex].storedUtcTime).toBe('2025-04-21T19:00:00.000Z');
  });
});
