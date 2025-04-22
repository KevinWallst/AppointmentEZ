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
  isSameDay,
  getDay
} from 'date-fns';
import Cookies from 'js-cookie';

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
  time: string;
  isBooked: boolean;
}

export default function AdminDashboard() {
  const { t, language, setLanguage } = useLanguage();
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

  // Fetch bookings from the API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      const data = await response.json();

      if (data.bookings) {
        // Sort bookings by date (most recent at the bottom)
        const sortedBookings = data.bookings.sort((a: Booking, b: Booking) => {
          return new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime();
        });

        setBookings(sortedBookings);
        filterBookings(sortedBookings, viewMode, selectedDate);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on view mode and selected date
  const filterBookings = (allBookings: Booking[], mode: 'all' | 'day', date: Date | null) => {
    if (mode === 'all' || !date) {
      setFilteredBookings(allBookings);
    } else {
      const filtered = allBookings.filter(booking => {
        const bookingDate = new Date(booking.appointmentTime);
        return (
          bookingDate.getFullYear() === date.getFullYear() &&
          bookingDate.getMonth() === date.getMonth() &&
          bookingDate.getDate() === date.getDate()
        );
      });
      setFilteredBookings(filtered);
    }
  };

  // Generate calendar days for the current month
  const generateCalendarDays = (date: Date = new Date()) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });
    setCalendarDays(days);
  };

  // Generate time slots for the selected date
  const generateTimeSlots = async (date: Date) => {
    try {
      setLoadingTimeSlots(true);

      // Format the date as YYYY-MM-DD
      const formattedDate = format(date, 'yyyy-MM-dd');

      // Fetch available time slots from the API
      const response = await fetch(`/api/bookings?date=${formattedDate}`);
      const data = await response.json();

      if (data.timeSlots) {
        // Use the time slots directly from the API
        setTimeSlots(data.timeSlots);
      }
    } catch (error) {
      console.error('Error generating time slots:', error);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  // Handle date selection in the calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
    generateTimeSlots(date);
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(new Date(slot.time));
    setIsEditMode(false);
    setModalOpen(true);
  };

  // Handle booking selection for editing
  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsEditMode(true);
    setModalOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm');
  };

  // Get booking status based on appointment time
  const getBookingStatus = (appointmentTimeStr: string) => {
    const appointmentTime = new Date(appointmentTimeStr);
    const now = new Date();

    // Calculate days difference
    const diffTime = appointmentTime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Return relative days
    return diffDays.toString();
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle logout
  const handleLogout = () => {
    // Clear both cookie and localStorage
    Cookies.remove('adminAuthenticated', { path: '/' });
    localStorage.removeItem('adminAuthenticated');

    // Redirect to login page
    router.push('/admin/login');
  };

  // Get cell background color based on date and bookings
  const getCellBackgroundColor = (day: Date) => {
    // Check if this is the selected date
    if (selectedDate && isSameDay(day, selectedDate)) {
      return '#2196f3'; // Blue for selected date
    }

    // Check if there are any bookings for this day
    const hasBookings = bookings.some(booking => {
      const bookingDate = new Date(booking.appointmentTime);
      return isSameDay(bookingDate, day);
    });

    if (hasBookings) {
      return '#ffcdd2'; // Red for days with bookings
    }

    // Check if it's a weekend
    const dayOfWeek = getDay(day);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return '#f5f5f5'; // Gray for weekends
    }

    return '#e8f5e9'; // Green for available days
  };

  // Authentication check
  useEffect(() => {
    // Check both cookie and localStorage for authentication
    const isAuthenticatedCookie = Cookies.get('adminAuthenticated') === 'true';
    const isAuthenticatedLocal = localStorage.getItem('adminAuthenticated') === 'true';

    if (!isAuthenticatedCookie && !isAuthenticatedLocal) {
      router.push('/admin/login');
      return;
    }

    // If only localStorage is set, also set the cookie for middleware protection
    if (!isAuthenticatedCookie && isAuthenticatedLocal) {
      Cookies.set('adminAuthenticated', 'true', {
        expires: 1, // Expires in 1 day
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }

    // Load bookings
    fetchBookings();
    // Generate calendar days
    generateCalendarDays();
  }, []);

  // Update filtered bookings when view mode or selected date changes
  useEffect(() => {
    filterBookings(bookings, viewMode, selectedDate);
  }, [viewMode, selectedDate, bookings]);

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 16px' }}>
      {/* Title Section */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '16px 0 8px' }}>{t('main.title')}</h1>
        <h3 style={{ fontSize: '14px', color: '#666', margin: '0' }}>{t('admin.title')}</h3>
      </div>

      {/* Controls Section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              fetchBookings();
              if (selectedDate) {
                generateTimeSlots(selectedDate);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
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
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            System Tests
          </button>
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#2196F3',
              border: '1px solid #2196F3',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            {language === 'en' ? '中文' : 'English'}
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#F44336',
              border: '1px solid #F44336',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {t('button.logout')}
          </button>
        </div>
      </div>

      {/* Timezone Info Box */}
      <div style={{
        backgroundColor: '#E3F2FD',
        padding: '16px',
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        <p style={{ margin: '0', fontWeight: 'bold' }}>{t('timezone.info')}</p>
        <p style={{ margin: '8px 0 0' }}>{t('timezone.shanghai')}</p>
      </div>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: '16px' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label={t('admin.tabs.dashboard')} />
          <Tab label={t('admin.tabs.maintenance')} />
          <Tab label={t('admin.tabs.health')} />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      {activeTab === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
          {/* Left Column - Calendar */}
          <div style={{ width: '365px', flexShrink: 0 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              {format(selectedDate || new Date(), 'yyyy年MM月')}
            </h2>

            {/* Calendar Header - Days of Week */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              <div>日</div>
              <div>一</div>
              <div>二</div>
              <div>三</div>
              <div>四</div>
              <div>五</div>
              <div>六</div>
            </div>

            {/* Calendar Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px'
            }}>
              {/* Empty cells for days before the start of the month */}
              {Array.from({ length: getDay(startOfMonth(selectedDate || new Date())) }).map((_, index) => (
                <div key={`empty-start-${index}`} style={{ height: '40px' }}></div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const backgroundColor = getCellBackgroundColor(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <div
                    key={index}
                    onClick={() => handleDateSelect(day)}
                    style={{
                      height: '40px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor,
                      color: isSelected ? 'white' : 'black',
                      borderRadius: '4px'
                    }}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>

            {/* Time Slots Section */}
            {viewMode === 'day' && selectedDate && (
              <div style={{ marginTop: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                  {format(selectedDate, 'yyyy-MM-dd')} {t('admin.timeSlots')}
                </h2>
                {loadingTimeSlots ? (
                  <p>{t('loading')}</p>
                ) : timeSlots.length === 0 ? (
                  <p>{t('admin.noTimeSlots')}</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {timeSlots.map((slot, index) => (
                      <div
                        key={index}
                        onClick={() => !slot.isBooked && handleTimeSlotSelect(slot)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: slot.isBooked ? '#ffcdd2' : '#e8f5e9',
                          color: 'black',
                          borderRadius: '4px',
                          cursor: slot.isBooked ? 'default' : 'pointer',
                          opacity: slot.isBooked ? 0.7 : 1
                        }}
                      >
                        {format(new Date(slot.time), 'HH:mm')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Bookings Table */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                {viewMode === 'all' ? t('admin.allBookings') : `${format(selectedDate || new Date(), 'yyyy-MM-dd')} ${t('admin.bookings')}`}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setViewMode('all')}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: viewMode === 'all' ? '#2196F3' : '#e0e0e0',
                    color: viewMode === 'all' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {t('admin.viewAll')}
                </button>
                <button
                  onClick={() => {
                    if (selectedDate) {
                      setViewMode('day');
                      filterBookings(bookings, 'day', selectedDate);
                    }
                  }}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: viewMode === 'day' ? '#2196F3' : '#e0e0e0',
                    color: viewMode === 'day' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedDate ? 'pointer' : 'not-allowed',
                    opacity: selectedDate ? 1 : 0.5
                  }}
                >
                  {t('admin.viewDay')}
                </button>
              </div>
            </div>

            {loading ? (
              <p>{t('loading')}</p>
            ) : filteredBookings.length === 0 ? (
              <p>{t('admin.noBookings')}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderBottom: '1px solid #ddd'
                      }}>
                        {t('admin.table.date')}
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderBottom: '1px solid #ddd'
                      }}>
                        {t('admin.table.name')}
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderBottom: '1px solid #ddd'
                      }}>
                        {t('admin.table.contact')}
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderBottom: '1px solid #ddd'
                      }}>
                        {t('admin.table.topic')}
                      </th>
                      <th style={{
                        textAlign: 'center',
                        padding: '12px',
                        borderBottom: '1px solid #ddd'
                      }}>
                        {t('admin.table.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking, index) => {
                      const status = getBookingStatus(booking.appointmentTime);
                      return (
                        <tr
                          key={index}
                          onClick={() => handleBookingSelect(booking)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9'
                          }}
                        >
                          <td style={{
                            padding: '12px',
                            borderBottom: '1px solid #ddd'
                          }}>
                            {formatDate(booking.appointmentTime)}
                          </td>
                          <td style={{
                            padding: '12px',
                            borderBottom: '1px solid #ddd'
                          }}>
                            {booking.name}
                          </td>
                          <td style={{
                            padding: '12px',
                            borderBottom: '1px solid #ddd'
                          }}>
                            <div>{booking.email}</div>
                            <div>{booking.wechatId}</div>
                          </td>
                          <td style={{
                            padding: '12px',
                            borderBottom: '1px solid #ddd'
                          }}>
                            {booking.topic}
                          </td>
                          <td style={{
                            padding: '12px',
                            borderBottom: '1px solid #ddd',
                            textAlign: 'center'
                          }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: parseInt(status) < 0 ? '#e0e0e0' : parseInt(status) === 0 ? '#ffcdd2' : '#bbdefb',
                              color: parseInt(status) < 0 ? '#616161' : parseInt(status) === 0 ? '#b71c1c' : '#0d47a1'
                            }}>
                              {status.startsWith('-') ? status : `+${status}`}
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
      )}

      {/* System Maintenance Tab */}
      {activeTab === 1 && (
        <div style={{ padding: '16px 0' }}>
          <SystemMaintenance />
        </div>
      )}

      {/* Health Check Tab */}
      {activeTab === 2 && (
        <div style={{ padding: '16px 0' }}>
          <HealthCheck />
        </div>
      )}

      {/* Appointment Modal */}
      {modalOpen && (
        <AppointmentModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedSlot(null);
            setSelectedBooking(null);
            // Refresh data after modal is closed
            fetchBookings();
            if (selectedDate) {
              generateTimeSlots(selectedDate);
            }
          }}
          slot={selectedSlot}
          isBooked={false}
          existingBooking={selectedBooking}
          onSave={async (bookingData) => {
            try {
              const endpoint = isEditMode ? '/api/appointments/update' : '/api/appointments/book';
              const method = isEditMode ? 'PUT' : 'POST';

              const response = await fetch(endpoint, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData)
              });

              const data = await response.json();
              return data.success;
            } catch (error) {
              console.error('Error saving booking:', error);
              return false;
            }
          }}
          onDelete={async () => {
            if (!selectedBooking || !selectedBooking.id) {
              return false;
            }

            try {
              const response = await fetch('/api/appointments/delete', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: selectedBooking.id })
              });

              const data = await response.json();
              return data.success;
            } catch (error) {
              console.error('Error deleting booking:', error);
              return false;
            }
          }}
          onRefresh={() => {
            fetchBookings();
            if (selectedDate) {
              generateTimeSlots(selectedDate);
            }
          }}
        />
      )}
    </div>
  );
}
