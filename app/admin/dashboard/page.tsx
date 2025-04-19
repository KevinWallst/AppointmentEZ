'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/LanguageContext';
import { AppointmentModal } from '../../components/AppointmentModal';
import SystemMaintenance from '../../components/SystemMaintenance';
import HealthCheck from '../../components/HealthCheck';
import { Tabs, Tab, Box } from '@mui/material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay
} from 'date-fns';

// Define the booking interface
interface Booking {
  appointmentTime: string;
  requestTime: string;
  name: string;
  email: string;
  wechatId: string;
  topic: string;
  id?: string; // Optional ID for existing bookings
}

interface TimeSlot {
  time: Date;
  isBooked: boolean;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'day'>('all');
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    router.push('/admin/login');
  };

  // Authentication check
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    // Load bookings
    fetchBookings();
    // Generate calendar days
    generateCalendarDays();
  }, []);

  // Set up fetch interceptor in a separate effect with proper cleanup
  useEffect(() => {
    // Store the original fetch function
    const originalFetch = window.fetch;

    // Create the interceptor function
    const interceptFetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      const method = init?.method || 'GET';

      // Reduce logging to minimize memory usage
      console.log(`Fetch: ${method} ${url}`);

      // If modal close is in progress and this is a booking request, abort it
      if ((window as any).__modalCloseInProgress &&
          (url.includes('/api/appointments/book') || url.includes('/api/appointments/update'))) {
        console.error(`Aborting fetch during modal close: ${method} ${url}`);
        return Promise.reject(new Error('Fetch aborted: Modal close in progress'));
      }

      // Call the original fetch
      return originalFetch.apply(window, [input, init])
        .then((response: Response) => {
          // Minimal logging
          console.log(`Fetch completed: ${response.status}`);
          return response;
        })
        .catch((error: Error) => {
          console.error(`Fetch failed: ${error.message}`);
          throw error;
        });
    };

    // Replace the global fetch
    window.fetch = interceptFetch;

    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
      console.log('Fetch interceptor removed');
    };
  }, []);

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);

    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start, end });

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = start.getDay();

    // Create empty slots for days before the first day of the month
    const prefixDays = Array(firstDayOfWeek).fill(null);

    // Combine prefix days with actual days
    const allDays = [...prefixDays, ...daysInMonth];

    setCalendarDays(allDays);
  };

  // Fetch bookings from the server
  const fetchBookings = async () => {
    console.log('Fetching latest bookings data...');

    try {
      setLoading(true);
      // Add cache-busting query parameter to ensure we get fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/bookings?_=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Fetched ${data.bookings.length} bookings from server`);

        // Sort bookings by appointment time (newest first)
        const sortedBookings = data.bookings.sort((a: Booking, b: Booking) => {
          // Convert appointment times to Date objects
          const dateA = new Date(a.appointmentTime);
          const dateB = new Date(b.appointmentTime);

          // First sort by date (year, month, day) in ascending order (oldest first)
          const dateADay = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
          const dateBDay = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
          const dateCompare = dateADay.getTime() - dateBDay.getTime();

          if (dateCompare !== 0) return dateCompare;

          // If same date, sort by time in ascending order (earliest first)
          return dateA.getTime() - dateB.getTime();
        });

        setBookings(sortedBookings);

        // If in day view, filter for the selected date
        if (viewMode === 'day' && selectedDate) {
          console.log(`Filtering bookings for date: ${selectedDate.toISOString().split('T')[0]}`);
          const filtered = sortedBookings.filter((booking: Booking) => {
            const bookingDate = new Date(booking.appointmentTime);
            return isSameDay(bookingDate, selectedDate);
          });
          setFilteredBookings(filtered);
        } else {
          console.log('Showing all bookings');
          setFilteredBookings(sortedBookings);
        }

        console.log('%cBookings data refreshed successfully', 'color: green; font-weight: bold;');
      } else {
        console.error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots for a given day (9 AM to 5 PM, 30 min intervals, excluding lunch hour)
  const generateTimeSlots = (date: Date) => {
    console.log('%cGenerating time slots for date:', 'color: blue; font-weight: bold;', format(date, 'yyyy-MM-dd'));
    setLoadingTimeSlots(true);

    // Create a new date object to avoid modifying the original
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Create slots from 9 AM to 5 PM
    const slots: TimeSlot[] = [];

    // Start time: 9 AM
    let currentTime = new Date(year, month, day, 9, 0, 0);
    // End time: 5 PM
    const endTime = new Date(year, month, day, 17, 0, 0);

    // Current time for filtering past slots
    const now = new Date();
    console.log('Current time:', format(now, 'yyyy-MM-dd HH:mm:ss'));

    // Check if the selected date is today
    const isToday = date.getDate() === now.getDate() &&
                   date.getMonth() === now.getMonth() &&
                   date.getFullYear() === now.getFullYear();

    console.log('Is today:', isToday);
    console.log('Total bookings to check against:', bookings.length);

    // Count available and booked slots
    let availableSlots = 0;
    let bookedSlots = 0;
    let pastSlots = 0;

    while (currentTime < endTime) {
      // Skip lunch break (12 PM - 1 PM)
      if (!(currentTime.getHours() === 12 && currentTime.getMinutes() === 0)) {
        // Skip past time slots if the selected date is today
        const isPastTimeSlot = isToday && currentTime < now;

        if (!isPastTimeSlot) {
          // Check if this slot is booked
          const isBooked = bookings.some(booking => {
            const bookingTime = new Date(booking.appointmentTime);
            const matches = (
              bookingTime.getFullYear() === currentTime.getFullYear() &&
              bookingTime.getMonth() === currentTime.getMonth() &&
              bookingTime.getDate() === currentTime.getDate() &&
              bookingTime.getHours() === currentTime.getHours() &&
              bookingTime.getMinutes() === currentTime.getMinutes()
            );

            if (matches) {
              console.log('Found booking for slot:', format(currentTime, 'HH:mm'), '- ID:', booking.id);
            }

            return matches;
          });

          slots.push({
            time: new Date(currentTime),
            isBooked
          });

          if (isBooked) {
            bookedSlots++;
          } else {
            availableSlots++;
          }
        } else {
          pastSlots++;
        }
      }

      // Add 30 minutes for the next slot
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    console.log(`Generated ${slots.length} time slots: ${availableSlots} available, ${bookedSlots} booked, ${pastSlots} past`);
    setTimeSlots(slots);
    setLoadingTimeSlots(false);
  };

  // Handle date selection in the calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');

    // Filter bookings for the selected date
    const filtered = bookings.filter(booking => {
      const bookingDate = new Date(booking.appointmentTime);
      return isSameDay(bookingDate, date);
    });

    setFilteredBookings(filtered);

    // Generate time slots for the selected date
    generateTimeSlots(date);
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'all' | 'day') => {
    setViewMode(mode);

    if (mode === 'all') {
      setFilteredBookings(bookings);
    } else if (selectedDate) {
      // Filter bookings for the selected date
      const filtered = bookings.filter(booking => {
        const bookingDate = new Date(booking.appointmentTime);
        return isSameDay(bookingDate, selectedDate);
      });
      setFilteredBookings(filtered);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Format date as yyyy-MM-dd HH:mm (24-hour format)
      return format(date, 'yyyy-MM-dd HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Calculate days until/since the appointment
  const getBookingStatus = (appointmentTime: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const appointmentDate = new Date(appointmentTime);
    const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());

    // Calculate the difference in days
    const diffTime = appointmentDay.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Return the difference as a string with a + or - sign
    if (diffDays === 0) {
      return '0';
    } else if (diffDays > 0) {
      return `+${diffDays}`;
    } else {
      return `${diffDays}`; // Already has a negative sign
    }
  };

  // Handle time slot click
  const handleTimeSlotClick = async (slot: TimeSlot) => {
    console.log('%cTime slot clicked:', 'color: blue; font-weight: bold;', format(slot.time, 'yyyy-MM-dd HH:mm'));

    // Refresh bookings first to ensure we have the latest data
    console.log('Refreshing bookings before opening modal...');
    await fetchBookings();

    // If a date is selected, refresh the time slots
    if (selectedDate) {
      console.log('Refreshing time slots for selected date...');
      generateTimeSlots(selectedDate);

      // Re-check if the slot is still available after refresh
      const updatedSlot = timeSlots.find(ts => {
        return (
          ts.time.getFullYear() === slot.time.getFullYear() &&
          ts.time.getMonth() === slot.time.getMonth() &&
          ts.time.getDate() === slot.time.getDate() &&
          ts.time.getHours() === slot.time.getHours() &&
          ts.time.getMinutes() === slot.time.getMinutes()
        );
      });

      if (updatedSlot && updatedSlot.isBooked !== slot.isBooked) {
        console.log('%cSlot status changed during refresh!', 'color: red; font-weight: bold;');
        console.log('Original status:', slot.isBooked ? 'Booked' : 'Available');
        console.log('Updated status:', updatedSlot.isBooked ? 'Booked' : 'Available');

        // If the slot was available but is now booked, show an alert and don't open the modal
        if (!slot.isBooked && updatedSlot.isBooked) {
          alert(t('message.slotTaken'));
          return;
        }

        // Update the slot reference to use the latest status
        slot = updatedSlot;
      }
    }

    setSelectedSlot(slot.time);

    if (slot.isBooked) {
      // Find the booking for this slot
      const booking = bookings.find(b => {
        const bookingTime = new Date(b.appointmentTime);
        return (
          bookingTime.getFullYear() === slot.time.getFullYear() &&
          bookingTime.getMonth() === slot.time.getMonth() &&
          bookingTime.getDate() === slot.time.getDate() &&
          bookingTime.getHours() === slot.time.getHours() &&
          bookingTime.getMinutes() === slot.time.getMinutes()
        );
      });

      if (booking) {
        console.log('Found existing booking:', booking);
        setSelectedBooking(booking);
        setIsEditMode(true);
      } else {
        // This shouldn't happen, but just in case
        console.warn('Slot is marked as booked but no booking was found!');
        setSelectedBooking(null);
        setIsEditMode(false);
      }
    } else {
      // New booking
      console.log('Creating new booking for available slot');
      setSelectedBooking(null);
      setIsEditMode(false);
    }

    setModalOpen(true);
  };

  // Handle save booking (create or update)
  const handleSaveBooking = async (bookingData: Booking): Promise<boolean> => {
    console.log('%c=== SAVE BOOKING OPERATION STARTED ===', 'background: #0000ff; color: white; font-size: 16px;');
    console.log('Booking data:', JSON.stringify(bookingData, null, 2));
    console.log('Is edit mode:', isEditMode);

    // Check if modal close is in progress
    if ((window as any).__modalCloseInProgress) {
      console.error('%c=== MODAL CLOSE IN PROGRESS, ABORTING SAVE ===', 'background: #ff0000; color: white; font-size: 16px;');
      return false;
    }

    // Add a global error handler to catch any unhandled errors
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      console.error('%cUNHANDLED ERROR in handleSaveBooking', 'color: red; font-size: 16px; font-weight: bold;');
      console.error('Error message:', message);
      console.error('Source:', source);
      console.error('Line:', lineno, 'Column:', colno);
      console.error('Error object:', error);

      // Call the original handler if it exists
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    try {
      const endpoint = isEditMode ? '/api/appointments/update' : '/api/appointments/book';
      const method = isEditMode ? 'PUT' : 'POST';
      console.log(`Using endpoint: ${endpoint} with method: ${method}`);

      // If editing, include the booking ID
      const data = isEditMode && selectedBooking?.id
        ? { ...bookingData, id: selectedBooking.id }
        : bookingData;

      console.log('Prepared request data:', JSON.stringify(data, null, 2));

      try {
        // Create a timeout promise to detect if the fetch is hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Fetch timeout - request took too long')), 10000);
        });

        // Race the fetch against the timeout
        console.log('Sending request to server...');
        const response = await Promise.race([
          fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }),
          timeoutPromise
        ]) as any; // Use 'any' type to avoid TypeScript errors

        console.log('%cSave response received', 'color: blue; font-weight: bold;');
        console.log('Response status:', response.status);
        console.log('Response status text:', response.statusText);
        console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));

        // Clone the response before reading it
        const clonedResponse = response.clone();

        // Get the response text first for logging
        const responseText = await clonedResponse.text();
        console.log('Response text:', responseText);

        // Try to parse the text as JSON
        let responseData: any = null;
        try {
          if (responseText) {
            responseData = JSON.parse(responseText);
            console.log('Parsed response data:', JSON.stringify(responseData, null, 2));
          } else {
            console.log('Response text is empty');
          }
        } catch (jsonError) {
          console.error('%cError parsing response as JSON:', 'color: red; font-weight: bold;', jsonError);
          console.log('Invalid JSON:', responseText);
        }

        if (response.ok) {
          console.log('%cSave operation successful', 'color: green; font-weight: bold;');
          // Refresh bookings after successful save
          console.log('Refreshing bookings list...');
          await fetchBookings();

          // Refresh time slots if a date is selected
          if (selectedDate) {
            console.log('Refreshing time slots for date:', selectedDate);
            generateTimeSlots(selectedDate);
          }

          console.log('%c=== SAVE OPERATION COMPLETED SUCCESSFULLY ===', 'background: #00ff00; color: black; font-size: 16px;');
          return true;
        } else {
          console.error('%c=== SERVER ERROR DETAILS ===', 'background: #ff0000; color: white; font-size: 16px; padding: 10px;');
          console.error('Status code:', response.status);
          console.error('Status text:', response.statusText);
          console.error('Error message:', responseData?.error || 'Unknown error');
          console.error('Error details:', responseData?.details || 'No additional details');
          console.error('Full response text:', responseText);
          console.error('Response headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
          console.error('Request endpoint:', endpoint);
          console.error('Request method:', method);
          console.error('Request data:', JSON.stringify(data, null, 2));

          // Create a new error to capture the stack trace
          const stackError = new Error(`Server error: ${responseData?.error || 'Unknown error'}. Status: ${response.status}`);
          console.error('Stack trace:', stackError.stack);

          // Log the call stack in a more readable format
          console.error('%c=== CALL STACK ===', 'background: #ff0000; color: white; font-size: 16px; padding: 10px;');
          const stackLines = stackError.stack?.split('\n') || [];
          stackLines.forEach((line, index) => {
            console.error(`${index}: ${line.trim()}`);
          });

          console.log('%c=== SAVE OPERATION FAILED ===', 'background: #ff0000; color: white; font-size: 16px; padding: 10px;');

          // Display the error in an alert for immediate visibility
          alert(`Server error: ${responseData?.error || 'Unknown error'}. Status: ${response.status}`);

          // Log the current state of the component
          console.error('Current component state:', {
            isEditMode,
            selectedSlot: selectedSlot ? selectedSlot.toISOString() : null,
            selectedBooking: selectedBooking ? JSON.stringify(selectedBooking) : null,
            modalOpen,
            selectedDate: selectedDate ? selectedDate.toISOString() : null,
            viewMode
          });

          return false;
        }
      } catch (fetchError) {
        console.error('%cFetch operation failed:', 'color: red; font-weight: bold;', fetchError);
        console.error('Error type:', fetchError instanceof Error ? fetchError.name : typeof fetchError);
        console.error('Error message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
        console.error('Error stack:', fetchError instanceof Error ? fetchError.stack : 'No stack trace available');

        // Display the error in an alert for immediate visibility
        alert(`Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);

        return false;
      }
    } catch (error) {
      console.error('%cERROR IN SAVE OPERATION:', 'background: red; color: white; font-size: 16px; padding: 4px;', error);
      console.log('Error type:', error instanceof Error ? error.name : typeof error);
      console.log('Error message:', error instanceof Error ? error.message : String(error));
      console.log('Error stack:', (error as Error).stack);
      console.log('%c=== SAVE OPERATION FAILED WITH EXCEPTION ===', 'background: #ff0000; color: white; font-size: 16px;');

      // Display the error in an alert for immediate visibility
      alert(`Error saving appointment: ${error instanceof Error ? error.message : String(error)}`);

      return false;
    } finally {
      // Restore the original error handler
      window.onerror = originalOnError;
    }
  };

  // Handle delete booking
  const handleDeleteBooking = async (): Promise<boolean> => {
    console.log('%c=== DELETE OPERATION STARTED ===', 'background: #ff0000; color: white; font-size: 16px;');
    console.log('selectedBooking:', selectedBooking);

    // Check if modal close is in progress
    if ((window as any).__modalCloseInProgress) {
      console.error('%c=== MODAL CLOSE IN PROGRESS, ABORTING DELETE ===', 'background: #ff0000; color: white; font-size: 16px;');
      return false;
    }

    // Add a global error handler to catch any unhandled errors
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      console.error('%cUNHANDLED ERROR in handleDeleteBooking', 'color: red; font-size: 16px; font-weight: bold;');
      console.error('Error message:', message);
      console.error('Source:', source);
      console.error('Line:', lineno, 'Column:', colno);
      console.error('Error object:', error);

      // Call the original handler if it exists
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    try {
      if (!selectedBooking) {
        console.error('%cERROR: Cannot delete booking: selectedBooking is null or undefined', 'color: red; font-weight: bold;');
        alert('Technical error: No booking selected. Check console for details.');
        return false;
      }

      if (!selectedBooking.id) {
        console.error('%cERROR: Cannot delete booking: No booking ID provided', 'color: red; font-weight: bold;');
        console.log('selectedBooking object:', JSON.stringify(selectedBooking, null, 2));
        alert('Technical error: Booking has no ID. Check console for details.');
        return false;
      }

      console.log('Attempting to delete booking with ID:', selectedBooking.id);
      console.log('Full booking data:', JSON.stringify(selectedBooking, null, 2));

      try {
        const requestData = { id: selectedBooking.id };
        console.log('Sending delete request with data:', JSON.stringify(requestData, null, 2));

        // Use direct fetch with detailed logging
        console.log('Sending POST request to /api/appointments/delete');

        // Create a timeout promise to detect if the fetch is hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Fetch timeout - request took too long')), 10000);
        });

        // Race the fetch against the timeout
        const response = await Promise.race([
          fetch('/api/appointments/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          }),
          timeoutPromise
        ]) as any; // Use 'any' type to avoid TypeScript errors

        console.log('%cDelete response received', 'color: blue; font-weight: bold;');
        console.log('Response status:', response.status);
        console.log('Response status text:', response.statusText);
        console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));

        // Clone the response before reading it
        const clonedResponse = response.clone();

        // Get the response text first for logging
        const responseText = await clonedResponse.text();
        console.log('Response text:', responseText);

        // Try to parse the text as JSON
        let responseData: any = null;
        try {
          if (responseText) {
            responseData = JSON.parse(responseText);
            console.log('Parsed response data:', JSON.stringify(responseData, null, 2));
          } else {
            console.log('Response text is empty');
          }
        } catch (jsonError) {
          console.error('%cError parsing response as JSON:', 'color: red; font-weight: bold;', jsonError);
          console.log('Invalid JSON:', responseText);
        }

        if (response.ok) {
          console.log('%cDelete operation successful', 'color: green; font-weight: bold;');
          // Refresh bookings after successful delete
          console.log('Refreshing bookings list...');
          await fetchBookings();

          // Refresh time slots if a date is selected
          if (selectedDate) {
            console.log('Refreshing time slots for date:', selectedDate);
            generateTimeSlots(selectedDate);
          }

          console.log('%c=== DELETE OPERATION COMPLETED SUCCESSFULLY ===', 'background: #00ff00; color: black; font-size: 16px;');
          return true;
        } else {
          console.error('%cServer returned error status:', 'color: red; font-weight: bold;', response.status);
          console.error('Error details:', responseData?.error || responseText || 'Unknown error');
          console.log('%c=== DELETE OPERATION FAILED ===', 'background: #ff0000; color: white; font-size: 16px;');

          // Display the error in an alert for immediate visibility
          alert(`Server error: ${responseData?.error || 'Unknown error'}. Status: ${response.status}`);

          return false;
        }
      } catch (fetchError) {
        console.error('%cFetch operation failed:', 'color: red; font-weight: bold;', fetchError);
        console.error('Error type:', fetchError instanceof Error ? fetchError.name : typeof fetchError);
        console.error('Error message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
        console.error('Error stack:', fetchError instanceof Error ? fetchError.stack : 'No stack trace available');

        // Display the error in an alert for immediate visibility
        alert(`Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);

        return false;
      }
    } catch (error) {
      console.error('%cERROR IN DELETE OPERATION:', 'background: red; color: white; font-size: 16px; padding: 4px;', error);
      console.log('Error type:', error instanceof Error ? error.name : typeof error);
      console.log('Error message:', error instanceof Error ? error.message : String(error));
      console.log('Error stack:', (error as Error).stack);
      console.log('%c=== DELETE OPERATION FAILED WITH EXCEPTION ===', 'background: #ff0000; color: white; font-size: 16px;');

      // Display the error in an alert for immediate visibility
      alert(`Error deleting appointment: ${error instanceof Error ? error.message : String(error)}`);

      return false;
    } finally {
      // Restore the original error handler
      window.onerror = originalOnError;
    }
  };

  // Close modal
  const handleCloseModal = () => {
    console.log('%c=== ADMIN DASHBOARD CLOSE MODAL TRIGGERED ===', 'background: #9c27b0; color: white; font-size: 14px;');
    console.log('Modal state:', { modalOpen, isEditMode });
    console.log('Selected slot:', selectedSlot ? selectedSlot.toISOString() : 'null');
    console.log('Selected booking:', selectedBooking ? JSON.stringify(selectedBooking, null, 2) : 'null');

    // First, set state variables to close the modal
    console.log('Setting modalOpen to false');
    setModalOpen(false);

    console.log('Setting selectedSlot to null');
    setSelectedSlot(null);

    console.log('Setting selectedBooking to null');
    setSelectedBooking(null);

    // Then, refresh data with a slight delay to avoid race conditions
    console.log('Scheduling data refresh with a slight delay...');
    setTimeout(() => {
      // Refresh bookings list to ensure we have the latest data
      console.log('Refreshing bookings list after modal close');
      fetchBookings();

      // Refresh time slots if a date is selected
      if (selectedDate) {
        console.log('Refreshing time slots for date:', selectedDate);
        generateTimeSlots(selectedDate);
      }

      console.log('%c=== ADMIN DASHBOARD CLOSE MODAL COMPLETED ===', 'background: #9c27b0; color: white; font-size: 14px;');
    }, 100); // Small delay to ensure modal is fully closed first
  };

  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      padding: '1.5rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Title Section - Full Width */}
        <div style={{ 
          width: '100%', 
          textAlign: 'center', 
          marginBottom: '1rem' 
        }}>
          <h1 style={{ marginBottom: '0.5rem' }}>{t('main.title')}</h1>
          <h3 style={{ color: '#666', fontSize: '0.85rem' }}>{t('admin.title')}</h3>
        </div>

        {/* Controls Section - Second Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => {
                console.log('Manual refresh triggered');
                fetchBookings();
                if (selectedDate) {
                  generateTimeSlots(selectedDate);
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              {t('button.refresh')}
            </button>
            <button
              onClick={() => router.push('/admin/test')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              System Tests
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'white',
                color: 'red',
                border: '1px solid red',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {t('button.logout')}
            </button>
          </div>
        </div>

        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#e8f4fd',
          borderRadius: '4px'
        }}>
          <p><strong>{t('timezone.info')}</strong></p>
          <p style={{ marginTop: '0.5rem' }}>{t('timezone.shanghai')}</p>
        </div>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="admin tabs"
          >
            <Tab label={t('admin.tabs.dashboard')} id="tab-0" aria-controls="tabpanel-0" />
            <Tab label={t('admin.tabs.maintenance')} id="tab-1" aria-controls="tabpanel-1" />
            <Tab label={t('admin.tabs.health')} id="tab-2" aria-controls="tabpanel-2" />
          </Tabs>
        </Box>

        {/* Dashboard Tab */}
        <div role="tabpanel" hidden={activeTab !== 0} id="tabpanel-0" aria-labelledby="tab-0">
          {activeTab === 0 && (
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Left side - Calendar */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>
                {selectedDate && format(selectedDate, 'yyyy年MM月')}
              </h3>

              {/* Calendar Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                  <div key={day} style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    padding: '0.5rem'
                  }}>
                    {day}
                  </div>
                ))}

                {calendarDays.map((day, index) => {
                  // If day is null (empty slot before the first day of the month), render an empty cell
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${index}`}
                        style={{
                          textAlign: 'center',
                          padding: '0.5rem',
                          backgroundColor: 'transparent'
                        }}
                      ></div>
                    );
                  }

                  // Check if there are bookings for this day
                  const hasBookings = bookings.some(booking => {
                    const bookingDate = new Date(booking.appointmentTime);
                    return isSameDay(bookingDate, day);
                  });

                  // Check if this is the selected date
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  // Check if this is a weekend (0 = Sunday, 6 = Saturday)
                  const dayOfWeek = day.getDay();
                  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

                  // Determine background color
                  let backgroundColor: string;
                  if (isSelected) {
                    backgroundColor = '#1976d2'; // Blue for selected
                  } else if (isWeekendDay) {
                    backgroundColor = '#f5f5f5'; // Light gray for weekends
                  } else if (hasBookings) {
                    backgroundColor = '#ffcdd2'; // Red for days with bookings
                  } else {
                    backgroundColor = '#c8e6c9'; // Green for available days
                  }

                  return (
                    <div
                      key={`day-${index}`}
                      onClick={() => !isWeekendDay && handleDateSelect(day)}
                      style={{
                        textAlign: 'center',
                        padding: '0.5rem',
                        backgroundColor,
                        color: isSelected ? 'white' : isWeekendDay ? '#9e9e9e' : 'inherit',
                        borderRadius: '4px',
                        cursor: isWeekendDay ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {format(day, 'd')}
                    </div>
                  );
                })}
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>
                    {format(selectedDate, 'yyyy-MM-dd')} {t('admin.timeSlots')}
                  </h4>

                  {loadingTimeSlots ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <p>{t('message.loading')}</p>
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <p>{t('admin.noTimeSlots')}</p>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      gap: '0.5rem'
                    }}>
                      {timeSlots.map((slot, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleTimeSlotClick(slot)}
                          style={{
                            padding: '0.5rem',
                            textAlign: 'center',
                            backgroundColor: slot.isBooked ? '#ffcdd2' : '#c8e6c9',
                            color: slot.isBooked ? '#b71c1c' : '#1b5e20',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {format(slot.time, 'HH:mm')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* View Mode Toggle */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => handleViewModeChange('all')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: viewMode === 'all' ? '#1976d2' : 'white',
                    color: viewMode === 'all' ? 'white' : '#1976d2',
                    border: '1px solid #1976d2',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flex: '1'
                  }}
                >
                  {t('admin.viewAll')}
                </button>
                <button
                  onClick={() => selectedDate && handleViewModeChange('day')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: viewMode === 'day' ? '#1976d2' : 'white',
                    color: viewMode === 'day' ? 'white' : '#1976d2',
                    border: '1px solid #1976d2',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flex: '1'
                  }}
                >
                  {t('admin.viewDay')}
                </button>
              </div>
            </div>

            {/* Legend */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ marginBottom: '0.5rem' }}>{t('admin.legend')}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#ffcdd2',
                    borderRadius: '4px'
                  }}></div>
                  <span>{t('admin.hasBookings')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#c8e6c9',
                    borderRadius: '4px'
                  }}></div>
                  <span>{t('admin.available')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#1976d2',
                    borderRadius: '4px'
                  }}></div>
                  <span>{t('admin.selectedDay')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                  }}></div>
                  <span>{t('admin.weekend')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Bookings List */}
          <div style={{ flex: '2', minWidth: '500px' }}>
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>
                {viewMode === 'day' && selectedDate
                  ? `${format(selectedDate, 'yyyy-MM-dd')} ${t('admin.appointments')}`
                  : t('admin.allAppointments')}
              </h3>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>{t('message.loading')}</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>{t('admin.noAppointments')}</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '600px'
                  }}>
                    <thead>
                      <tr>
                        <th style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderBottom: '2px solid #e0e0e0'
                        }}>
                          {t('admin.table.date')}
                        </th>
                        <th style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderBottom: '2px solid #e0e0e0'
                        }}>
                          {t('admin.table.name')}
                        </th>
                        <th style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderBottom: '2px solid #e0e0e0'
                        }}>
                          {t('admin.table.contact')}
                        </th>
                        <th style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderBottom: '2px solid #e0e0e0'
                        }}>
                          {t('admin.table.topic')}
                        </th>
                        <th style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderBottom: '2px solid #e0e0e0'
                        }}>
                          {t('admin.table.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking, index) => {
                        const status = getBookingStatus(booking.appointmentTime);
                        return (
                          <tr key={index}>
                            <td style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid #e0e0e0'
                            }}>
                              {formatDate(booking.appointmentTime)}
                            </td>
                            <td style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid #e0e0e0'
                            }}>
                              {booking.name}
                            </td>
                            <td style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid #e0e0e0'
                            }}>
                              <div>{booking.email}</div>
                              <div>{booking.wechatId}</div>
                            </td>
                            <td style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid #e0e0e0'
                            }}>
                              {booking.topic}
                            </td>
                            <td style={{
                              padding: '0.75rem',
                              borderBottom: '1px solid #e0e0e0'
                            }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: parseInt(status) < 0 ? '#e0e0e0' : parseInt(status) === 0 ? '#ffcdd2' : '#bbdefb',
                                color: parseInt(status) < 0 ? '#616161' : parseInt(status) === 0 ? '#b71c1c' : '#0d47a1',
                                fontWeight: parseInt(status) === 0 ? 'bold' : 'normal'
                              }}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
            </div>
          )}
        </div>

        {/* System Maintenance Tab */}
        <div role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1" aria-labelledby="tab-1">
          {activeTab === 1 && <SystemMaintenance />}
        </div>

        {/* Health Check Tab */}
        <div role="tabpanel" hidden={activeTab !== 2} id="tabpanel-2" aria-labelledby="tab-2">
          {activeTab === 2 && <HealthCheck />}
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        open={modalOpen}
        onClose={handleCloseModal}
        slot={selectedSlot}
        isBooked={isEditMode}
        existingBooking={selectedBooking}
        onSave={handleSaveBooking}
        onDelete={handleDeleteBooking}
        onRefresh={() => {
          console.log('Refreshing admin dashboard after modal operation');
          fetchBookings();
          if (selectedDate) {
            generateTimeSlots(selectedDate);
          }
        }}
      />
    </div>
  );
}
