'use client';
import React, { useState, useEffect, Suspense } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

// Wrapper component that uses searchParams
function CancelAppointmentContent() {
  const searchParams = useSearchParams();
  const { t, language, setLanguage } = useLanguage();
  const [datetime, setDatetime] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [wechatId, setWechatId] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [formattedDate, setFormattedDate] = useState<string | null>(null);
  const [formattedTime, setFormattedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');



  useEffect(() => {
    // Get query parameters
    const datetimeParam = searchParams.get('datetime');
    const emailParam = searchParams.get('email');
    const nameParam = searchParams.get('name');
    const wechatIdParam = searchParams.get('wechatId');
    const topicParam = searchParams.get('topic');
    const langParam = searchParams.get('lang');

    // Set language from URL parameter if provided
    if (langParam && (langParam === 'zh' || langParam === 'en')) {
      setLanguage(langParam);
    }

    if (datetimeParam && emailParam) {
      setDatetime(datetimeParam);
      setEmail(emailParam);
      setName(nameParam);
      setWechatId(wechatIdParam);
      setTopic(topicParam);

      // Format the date and time for display
      try {
        const date = new Date(datetimeParam);
        setFormattedDate(date.toLocaleDateString());
        setFormattedTime(date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }));
      } catch (error) {
        console.error('Error parsing date:', error);
      }

      // Fetch appointment details if not provided in URL
      if (!nameParam || !wechatIdParam || !topicParam) {
        fetchAppointmentDetails(datetimeParam, emailParam);
      }
    }
  }, [searchParams]);

  // Fetch appointment details from the server
  const fetchAppointmentDetails = async (datetime: string, email: string) => {
    try {
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const data = await response.json();
        const booking = data.bookings.find(
          (b: any) => b.appointmentTime === datetime && b.email === email
        );

        if (booking) {
          setName(booking.name || null);
          setWechatId(booking.wechatId || null);
          setTopic(booking.topic || null);
        }
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
    }
  };

  const handleCancel = async () => {
    if (!datetime || !email) {
      setStatus('error');
      setMessage('Missing appointment information');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datetime,
          email,
          reason,
          language // Include language preference for the cancellation email
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Your appointment has been successfully cancelled.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to cancel appointment. Please try again.');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      setStatus('error');
      setMessage('An error occurred while cancelling your appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundStyle = {
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    paddingTop: '1.5rem',
    paddingBottom: '1.5rem'
  };

  return (
    <div style={backgroundStyle}>
      <Container maxWidth="md">
        <Paper sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {t('main.title')}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {t('cancel.title')}
              </Typography>
            </div>
            <div style={{ marginLeft: '-20px' }}>
              <LanguageSwitcher />
            </div>
          </div>

        {status === 'success' ? (
          <div style={{ marginTop: '1rem' }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('message.cancelSuccess')}
            </Alert>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Button variant="contained" color="primary">
                {t('button.back')}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {formattedDate && formattedTime ? (
              <div style={{ marginBottom: '1rem' }}>
                <Typography variant="body1">
                  {t('cancel.info')}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {formattedDate} at {formattedTime}
                </Typography>

                {name && (
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>{t('admin.table.name')}:</strong> {name}
                  </Typography>
                )}

                {wechatId && (
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>{t('admin.table.wechatId')}:</strong> {wechatId}
                  </Typography>
                )}

                {topic && (
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>{t('admin.table.topic')}:</strong> {topic}
                  </Typography>
                )}
              </div>
            ) : (
              <Alert severity="error" sx={{ mb: 3 }}>
                Invalid appointment information. Please check your cancellation link.
              </Alert>
            )}

            {status === 'error' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}

            {formattedDate && formattedTime && (
              <>
                <TextField
                  fullWidth
                  label={t('cancel.reason')}
                  multiline
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Button
                  variant="contained"
                  color="error"
                  onClick={handleCancel}
                  disabled={isLoading}
                  sx={{ mb: 2 }}
                >
                  {isLoading ? t('button.cancel') + '...' : t('cancel.confirm')}
                </Button>
              </>
            )}

            <div style={{ marginTop: '1rem' }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Button variant="text">
                  {t('button.back')}
                </Button>
              </Link>
            </div>
          </>
        )}
        </Paper>
      </Container>
    </div>
  );
}

// Main component that wraps the content in a Suspense boundary
export default function CancelAppointment() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><CircularProgress /></div>}>
      <CancelAppointmentContent />
    </Suspense>
  );
}
