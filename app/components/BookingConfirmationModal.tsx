'use client';
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Divider
} from '@mui/material';
import { formatInTimeZone } from 'date-fns-tz';
import { useLanguage } from '../contexts/LanguageContext';

interface BookingConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  slot: Date | null;
  name: string;
  email: string;
  wechatId: string;
  topic: string;
  isLoading: boolean;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  slot,
  name,
  email,
  wechatId,
  topic,
  isLoading
}) => {
  const { t, language } = useLanguage();

  if (!slot) return null;

  // Format the appointment time in New York time zone
  const formattedTime = formatInTimeZone(slot, 'America/New_York', 'yyyy-MM-dd h:mm a');
  
  // Get the user's time zone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Format the time in the user's local time zone
  const localTime = new Date(slot).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: userTimeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });

  // Check if the user is in an Asian time zone
  const isAsianTimeZone = userTimeZone.includes('Asia');
  
  // Format the time in Shanghai time zone if the user is in Asia
  const shanghaiTime = isAsianTimeZone 
    ? formatInTimeZone(slot, 'Asia/Shanghai', 'yyyy-MM-dd h:mm a')
    : null;

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('booking.confirmTitle')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('booking.confirmMessage')}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" fontWeight="bold">
            {t('booking.appointmentDetails')}:
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('form.name')}:</strong> {name}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('form.email')}:</strong> {email}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('form.wechatId')}:</strong> {wechatId}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('form.topic')}:</strong> {topic}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('booking.timeNewYork')}:</strong> {formattedTime}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('booking.timeLocal')}:</strong> {localTime}
            </Typography>
            {shanghaiTime && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>{t('booking.timeShanghai')}:</strong> {shanghaiTime}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          color="inherit"
        >
          {t('button.cancel')}
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={isLoading}
          variant="contained" 
          color="primary"
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? t('button.processing') : t('button.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
