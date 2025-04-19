'use client';
import React, { useState } from 'react';
import {
  Container,
  Paper,
  Grid,
  Button,
  Typography,
  TextField,
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import Link from 'next/link';
// Import date-fns-tz functions
import { formatInTimeZone } from 'date-fns-tz';
// Import language context
import { useLanguage } from './contexts/LanguageContext';
import { useSettings } from './contexts/SettingsContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';

// Define the booking interface to match the server
interface Booking {
  appointmentTime: string;
  requestTime: string;
  email: string;
}

export default function Home() {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [wechatId, setWechatId] = useState('');
  const [topic, setTopic] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [processingSlot, setProcessingSlot] = useState<Date | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  // Generate time slots for a given day
  const generateTimeSlots = (date: Date) => {
    // Extract the date components to ensure we preserve the correct date
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    console.log(`Generating time slots for: ${year}-${month + 1}-${day}`);

    // Create a new date object to avoid modifying the original
    const baseDate = new Date(year, month, day);
    // Reset hours to ensure we're working with just the date
    baseDate.setHours(0, 0, 0, 0);

    // Check if the selected date is a weekend (Saturday = 6, Sunday = 0)
    const dayOfWeek = baseDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('Weekend selected, no slots available');
      return []; // No slots available on weekends
    }

    const slots: Date[] = [];

    // Create time slots from 9 AM to 5 PM in New York time (America/New_York)
    // We'll use date-fns-tz to handle the time zone conversion properly
    const nyTimeZone = 'America/New_York';

    // Use date-fns-tz to get the correct offset for the selected date in New York
    // This will automatically handle DST transitions
    const selectedDateInNY = new Date(year, month, day, 12, 0, 0);

    // Format the date in New York time zone to see what time zone is in effect
    const timeZoneAbbr = formatInTimeZone(selectedDateInNY, nyTimeZone, 'zzz');

    // Determine if the selected date is in EDT or EST
    // EDT = Eastern Daylight Time (UTC-4), EST = Eastern Standard Time (UTC-5)
    const isDST = timeZoneAbbr === 'EDT';
    const nyOffset = isDST ? 4 : 5;

    console.log(`Selected date ${year}-${month+1}-${day} is in ${timeZoneAbbr}`);
    console.log(`Using ${isDST ? 'EDT (UTC-4)' : 'EST (UTC-5)'} offset: ${nyOffset} hours`);

    // Create the start and end times in New York time
    // 9:00 AM New York time on the selected date
    const startTimeNY = new Date(Date.UTC(
      year,
      month,
      day,
      9 + nyOffset, // 9 AM NY time = 1 PM or 2 PM UTC depending on DST
      0,  // Minutes
      0   // Seconds
    ));

    // 5:00 PM New York time on the selected date
    const endTimeNY = new Date(Date.UTC(
      year,
      month,
      day,
      17 + nyOffset, // 5 PM NY time = 9 PM or 10 PM UTC depending on DST
      0,  // Minutes
      0   // Seconds
    ));

    // For debugging
    console.log('Booking - Start time (9 AM NY):', formatInTimeZone(startTimeNY, nyTimeZone, 'h:mm a'));
    console.log('Booking - End time (5 PM NY):', formatInTimeZone(endTimeNY, nyTimeZone, 'h:mm a'));

    // Check if the selected date is today
    const now = new Date();
    const isToday = baseDate.getDate() === now.getDate() &&
                   baseDate.getMonth() === now.getMonth() &&
                   baseDate.getFullYear() === now.getFullYear();

    // Current time in UTC for comparison
    const currentUTC = new Date();

    // Start with the first time slot
    let currentTime = new Date(startTimeNY);

    while (currentTime < endTimeNY) {
      // Skip lunch break (12 PM - 1 PM NY time)
      const lunchStartNY = new Date(Date.UTC(
        year,
        month,
        day,
        12 + nyOffset, // 12 PM NY time = 4 PM or 5 PM UTC depending on DST
        0
      ));

      const lunchEndNY = new Date(Date.UTC(
        year,
        month,
        day,
        13 + nyOffset, // 1 PM NY time = 5 PM or 6 PM UTC depending on DST
        0
      ));

      const skipLunch = currentTime >= lunchStartNY && currentTime < lunchEndNY;

      // Skip past times if the selected date is today
      const isPastTime = isToday && currentTime < currentUTC;

      if (!skipLunch && !isPastTime) {
        // Create a copy of the current time slot
        const timeSlot = new Date(currentTime.getTime());
        console.log(`Adding slot: ${timeSlot.toISOString()} (${formatInTimeZone(timeSlot, nyTimeZone, 'h:mm a')} NY time)`);
        slots.push(timeSlot);
      }

      // Add 30 minutes for the next slot
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }

    console.log('Booking - Generated slots count:', slots.length);
    console.log('Booking - Last slot:', slots.length > 0 ? formatInTimeZone(slots[slots.length - 1], nyTimeZone, 'h:mm a') : 'No slots');
    return slots;
  };

  // Fetch booked slots from the server
  const fetchBookedSlots = async () => {
    try {
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const data = await response.json();
        return data.bookings || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      return [];
    }
  };

  // Handle date selection
  const handleDateSelect = async (date: Date) => {
    console.log('Selected date:', date);
    // Create a new date object to ensure proper date handling
    // Extract the year, month, and day components to preserve the date
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    // Create a new date with the same components
    const selectedDate = new Date(year, month, day, 12, 0, 0, 0);
    console.log('Processed date:', selectedDate, 'Year:', year, 'Month:', month + 1, 'Day:', day);
    setSelectedDate(selectedDate);
    setIsFetchingSlots(true);
    setAvailableSlots([]); // Clear previous slots while loading

    try {
      // Generate all possible time slots for the selected date
      const allSlots = generateTimeSlots(selectedDate);
      console.log('All possible slots:', allSlots);

      // Fetch booked slots from the server
      const bookedSlots = await fetchBookedSlots();
      console.log('Booked slots:', bookedSlots);

      // Filter out already booked slots
      const availableSlots = allSlots.filter(slot => {
        const slotTime = slot.toISOString();
        return !bookedSlots.some((booking: Booking) => booking.appointmentTime === slotTime);
      });

      console.log('Available slots:', availableSlots);
      setAvailableSlots(availableSlots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setErrors({ general: 'Failed to load available time slots. Please try again.' });
    } finally {
      setIsFetchingSlots(false);
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: Date) => {
    // Reset errors
    const newErrors: {[key: string]: string} = {};
    let hasErrors = false;

    // Validate name
    if (!name.trim()) {
      newErrors.name = '请输入您的姓名';
      hasErrors = true;
    }

    // Validate email
    if (!email) {
      newErrors.email = '请输入您的电子邮箱';
      hasErrors = true;
    } else if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = '请输入有效的电子邮箱地址';
      hasErrors = true;
    }

    // Validate WeChat ID
    if (!wechatId.trim()) {
      newErrors.wechatId = '请输入您的微信号';
      hasErrors = true;
    }

    // Validate topic
    if (!topic.trim()) {
      newErrors.topic = '请输入咨询主题';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // Clear any previous errors
    setErrors({});

    // Set the selected slot and open the confirmation modal
    setSelectedSlot(slot);
    setConfirmationModalOpen(true);
  };

  // Handle booking confirmation
  const handleBookingConfirm = async () => {
    if (!selectedSlot) return;

    try {
      // Set loading state
      setIsLoading(true);
      setProcessingSlot(selectedSlot);

      // Log the booking data for debugging
      console.log('Booking data being sent:', {
        datetime: selectedSlot.toISOString(),
        name: name,
        email: email,
        wechatId: wechatId,
        topic: topic,
        language: language // Include the current language preference
      });

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datetime: selectedSlot.toISOString(),
          name: name,
          email: email,
          wechatId: wechatId,
          topic: topic,
          language: language // Include the current language preference
        }),
      });

      // Log the response for debugging
      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      // Parse the response
      let data: any;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (e) {
        console.error('Error parsing response:', e);
      }

      // Close the confirmation modal
      setConfirmationModalOpen(false);

      if (response.ok && data) {
        // Success - remove the slot from available slots
        setAvailableSlots(availableSlots.filter(s => s.getTime() !== selectedSlot.getTime()));

        // Log success for debugging
        console.log('Booking successful, showing snackbar');

        // Show success message with Snackbar instead of alert
        setSnackbarMessage(`${t('message.bookingSuccess')} ${email}`);
        setSnackbarOpen(true);

        // Reset form fields after alert is dismissed
        setName('');
        setEmail('');
        setWechatId('');
        setTopic('');
        setErrors({});
      } else {
        // Handle conflict (409) status specifically
        if (response.status === 409) {
          // Refresh available slots to reflect the current state
          setAvailableSlots(availableSlots.filter(s => s.getTime() !== selectedSlot.getTime()));
          // Use Snackbar instead of alert
          setSnackbarMessage(t('message.slotTaken'));
          setSnackbarOpen(true);
        }

        setErrors({ general: data.error || t('message.bookingFailed') });
      }
    } catch (error) {
      console.error('Booking error:', error);
      setErrors({ general: t('message.bookingFailed') });
      // Close the confirmation modal on error
      setConfirmationModalOpen(false);
    } finally {
      // Clear loading state
      setIsLoading(false);
      setProcessingSlot(null);
    }
  };

  // Handle closing the confirmation modal
  const handleCloseConfirmationModal = () => {
    setConfirmationModalOpen(false);
    setSelectedSlot(null);
  };

  const backgroundStyle = {
    ...(settings.background.type === 'color'
      ? { backgroundColor: settings.background.value }
      : {
          backgroundImage: `url(${settings.background.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }),
    minHeight: '100vh',
    paddingTop: '1.5rem',
    paddingBottom: '1.5rem'
  };

  return (
    <div style={backgroundStyle}>
      <Container maxWidth="md">
        <Paper style={{ padding: "3rem", backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: "2rem"
          }}>
            {/* Title Section - Full Width */}
            <div style={{ width: '100%', textAlign: 'center', marginBottom: '1rem' }}>
              <Typography variant="h4" style={{
                fontFamily: settings.titleStyle.fontFamily,
                fontSize: settings.titleStyle.fontSize,
                color: settings.titleStyle.color
              }}>
                {language === 'zh' ? settings.attorneyName.zh : settings.attorneyName.en}
              </Typography>
              <Typography variant="subtitle1" style={{ fontSize: "0.85rem" }} color="text.secondary">
                {t('page.title')}
              </Typography>
            </div>

            {/* Controls Section - Second Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <LanguageSwitcher />
              <Link href="/admin/login" passHref>
                <Button variant="outlined" size="small">
                  {t('button.admin')}
                </Button>
              </Link>
            </div>
          </div>

        <Alert severity="info" style={{ marginBottom: "3rem" }}>
          <Typography variant="body1">
            <strong>{t('timezone.info')}</strong>
          </Typography>
        </Alert>

        <div style={{ marginBottom: "3rem" }}>
          {errors.general && (
            <Alert severity="error" style={{ marginBottom: "2rem" }}>
              {errors.general}
            </Alert>
          )}

          <TextField
            fullWidth
            label={t('form.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name || ''}
            style={{ marginBottom: "2rem" }}
          />

          <div style={{ display: 'flex', gap: "1rem", marginBottom: "2rem" }}>
            <TextField
              fullWidth
              label={t('form.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email || ''}
            />

            <TextField
              fullWidth
              label={t('form.wechatId')}
              value={wechatId}
              onChange={(e) => setWechatId(e.target.value)}
              error={!!errors.wechatId}
              helperText={errors.wechatId || ''}
            />
          </div>

          <TextField
            fullWidth
            label={t('form.topic')}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            error={!!errors.topic}
            helperText={errors.topic || ''}
            style={{ marginBottom: "2rem" }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: "1rem" }}>
            <Typography variant="body1" style={{ minWidth: '80px' }}>
              {t('form.date')}
            </Typography>
            <TextField
              type="date"
              size="small"
              style={{ width: '200px' }}
              InputLabelProps={{
                shrink: true,
              }}
              // Set min attribute to today's date
              inputProps={{
                min: new Date().toISOString().split('T')[0]
              }}
              onChange={(e) => {
                console.log('Date input value:', e.target.value);
                // Parse the date in local time zone to preserve the date
                const [year, month, day] = e.target.value.split('-').map(Number);
                // Create a date object with the selected date components
                // Month is 0-indexed in JavaScript Date
                const dateValue = new Date(year, month - 1, day, 12, 0, 0, 0);
                console.log('Created date object:', dateValue);
                handleDateSelect(dateValue);
              }}
            />
          </div>
        </div>

        {selectedDate && (
          <>
            {isFetchingSlots ? (
              <Typography variant="body1" style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '1rem' }}>
                {t('message.loading')}
              </Typography>
            ) : availableSlots.length > 0 ? (
              <>
                {/* Only show Shanghai time zone info if the user might be in China */}
                {Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Asia') && (
                  <Alert severity="info" style={{ marginBottom: "2rem" }}>
                    <Typography variant="body2">
                      {t('timezone.shanghai')}
                    </Typography>
                  </Alert>
                )}
                <Grid container spacing={2}>
                  {availableSlots.map((slot, index) => {
                    // Get the user's time zone
                    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                    // Only calculate Shanghai time if the user is in an Asian time zone
                    const isAsianTimeZone = userTimeZone.includes('Asia');

                    // Check if this slot would be after midnight in Shanghai
                    // Shanghai is GMT+8, New York is GMT-4 (EDT) or GMT-5 (EST)
                    // So the difference is either 12 or 13 hours depending on DST
                    // Instead of manual calculation, use date-fns-tz to get the correct time
                    const shanghaiTime = formatInTimeZone(slot, 'Asia/Shanghai', 'HH:mm');
                    const [shanghaiHour] = shanghaiTime.split(':').map(Number);

                    // If the hour is between 0 (midnight) and 9 AM, it's after midnight
                    const isAfterMidnight = isAsianTimeZone && shanghaiHour >= 0 && shanghaiHour < 9;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleTimeSlotSelect(slot)}
                          disabled={isLoading && processingSlot?.getTime() === slot.getTime()}
                          color={isAfterMidnight ? 'warning' : 'primary'}
                          style={{
                            backgroundColor: isAfterMidnight ? 'rgba(255, 152, 0, 0.1)' : 'transparent'
                          }}
                        >
                          {isLoading && processingSlot?.getTime() === slot.getTime()
                            ? t('button.book') + '...'
                            : (
                              <>
                                {formatInTimeZone(slot, 'America/New_York', 'h:mm a')}
                                {isAfterMidnight && (
                                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'orange' }}>
                                    {t('timezone.nextDay')}
                                  </span>
                                )}
                              </>
                            )}
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>
              </>
            ) : (
              <Typography variant="body1" style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '1rem' }}>
                {t('message.noSlots')}
              </Typography>
            )}
          </>
        )}
        </Paper>

        {/* Snackbar for success messages */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />

        {/* Booking Confirmation Modal */}
        <BookingConfirmationModal
          open={confirmationModalOpen}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleBookingConfirm}
          slot={selectedSlot}
          name={name}
          email={email}
          wechatId={wechatId}
          topic={topic}
          isLoading={isLoading}
        />
      </Container>
    </div>
  );
}