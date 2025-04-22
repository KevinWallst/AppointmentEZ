'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';

interface Booking {
  id?: string;
  appointmentTime: string;
  name: string;
  email: string;
  wechatId: string;
  topic: string;
  language?: string;
}

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  slot: Date | null;
  isBooked: boolean;
  existingBooking?: Booking | null;
  onSave: (bookingData: Booking) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
  onCancel?: (bookingData: Booking) => Promise<boolean>;
  onRefresh?: () => void; // Optional callback to refresh the parent component
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  open,
  onClose,
  slot,
  isBooked,
  existingBooking,
  onSave,
  onDelete,
  onCancel,
  onRefresh
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false); // Track if a save operation is in progress
  const [deleteInProgress, setDeleteInProgress] = useState(false); // Track if a delete operation is in progress
  const [cancelInProgress, setCancelInProgress] = useState(false); // Track if a cancel operation is in progress

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [wechatId, setWechatId] = useState('');
  const [topic, setTopic] = useState('');

  // Reset form when modal opens or changes between edit/create
  useEffect(() => {
    if (open) {
      // Reset state
      setError(null);
      setSuccess(null);
      setIsDeleted(false); // Always reset the deleted state when opening the modal
      setIsCancelled(false); // Always reset the cancelled state when opening the modal
      console.log('Modal opened, reset isDeleted and isCancelled states to false');

      if (isBooked && existingBooking) {
        // Populate form with existing booking data
        setName(existingBooking.name || '');
        setEmail(existingBooking.email || '');
        setWechatId(existingBooking.wechatId || '');
        setTopic(existingBooking.topic || '');
        console.log('Populated form with existing booking data');
      } else {
        // Clear form for new booking
        setName('');
        setEmail('');
        setWechatId('');
        setTopic('');
        console.log('Cleared form for new booking');
      }
    }
  }, [open, isBooked, existingBooking]);

  const handleSave = async () => {
    console.log('%c=== APPOINTMENT MODAL SAVE STARTED ===', 'background: #4caf50; color: white; font-size: 14px;');
    console.log('Current state:', { saveInProgress, loading, isDeleted, isCancelled, success, error });

    // Prevent double submission
    if (saveInProgress) {
      console.log('Save already in progress, ignoring duplicate save request');
      return;
    }

    // Prevent saving if we already have a success message (already saved successfully)
    if (success) {
      console.log('Booking already saved successfully, ignoring duplicate save request');
      return;
    }

    // Check if the appointment has been deleted
    if (isDeleted) {
      setError(t('message.cannotSaveDeleted'));
      console.error('Cannot save a deleted appointment');
      return;
    }

    // Check if the appointment has been cancelled
    if (isCancelled) {
      setError(t('message.cannotSaveCancelled'));
      console.error('Cannot save a cancelled appointment');
      return;
    }

    // Validate form
    if (!name || !email || !wechatId || !topic) {
      setError(t('message.allFieldsRequired'));
      return;
    }

    if (!slot) {
      setError(t('message.invalidSlot'));
      return;
    }

    // Check if the appointment time is in the past
    const now = new Date();
    if (slot < now) {
      setError(t('message.pastAppointment'));
      return;
    }

    // Set flags to indicate save is in progress
    setSaveInProgress(true);
    setLoading(true);
    setError(null);

    try {
      console.log('Preparing booking data...');
      const bookingData: Booking = {
        // Include the ID if this is an existing booking being updated
        ...(isBooked && existingBooking?.id ? { id: existingBooking.id } : {}),
        appointmentTime: slot.toISOString(),
        name,
        email,
        wechatId,
        topic,
        // Preserve the language if it exists in the existing booking
        ...(existingBooking?.language ? { language: existingBooking.language } : {})
      };
      console.log('Booking data prepared:', JSON.stringify(bookingData, null, 2));

      console.log('Calling onSave function...');
      const saveResult = await onSave(bookingData);
      console.log('onSave result:', saveResult);

      if (saveResult) {
        console.log('Save successful, showing success message');
        setSuccess(isBooked ? t('message.updateSuccess') : t('message.bookingSuccess'));

        // Call the refresh callback immediately if provided
        if (onRefresh) {
          console.log('Calling refresh callback after successful save');
          onRefresh();
        }

        // Keep the modal open so the user can see the success message
        // The user can close it manually when ready
        console.log('Keeping modal open after successful save');

        // Temporarily disable buttons to prevent multiple submissions
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } else {
        console.error('Save failed, showing error message');
        setError(isBooked ? t('message.updateFailed') : t('message.bookingFailed'));
      }
    } catch (err) {
      console.error('Exception during save operation:', err);
      setError(t('message.errorOccurred'));
      console.error('Error saving appointment:', err);
    } finally {
      console.log('Save operation completed, resetting flags');
      setLoading(false);
      setSaveInProgress(false);
      console.log('%c=== APPOINTMENT MODAL SAVE COMPLETED ===', 'background: #4caf50; color: white; font-size: 14px;');
    }
  };

  const handleCancel = async () => {
    console.log('%c=== APPOINTMENT MODAL CANCEL STARTED ===', 'background: #ff9800; color: white; font-size: 16px;');
    console.log('Current state:', { cancelInProgress, loading, isCancelled, success, error });
    console.log('existingBooking:', existingBooking ? JSON.stringify(existingBooking, null, 2) : 'null');

    // Prevent double cancellation
    if (cancelInProgress) {
      console.log('Cancel already in progress, ignoring duplicate cancel request');
      return;
    }

    if (!onCancel) {
      console.error('%cERROR: Cancel handler not provided', 'color: red; font-weight: bold;');
      alert('Technical error: Cancel handler not provided. Check console for details.');
      return;
    }

    if (!existingBooking) {
      console.error('%cERROR: No booking to cancel', 'color: red; font-weight: bold;');
      setError(t('message.noBookingToCancel'));
      return;
    }

    console.log('Cancel button clicked, starting cancel process');
    setCancelInProgress(true);
    setLoading(true);
    setError(null);

    try {
      console.log('Calling onCancel handler');

      // Create a global error handler to catch any unhandled errors
      const originalOnError = window.onerror;
      window.onerror = function(message, source, lineno, colno, error) {
        console.error('%cUNHANDLED ERROR in cancel operation', 'color: red; font-size: 16px; font-weight: bold;');
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

      // Wrap the onCancel call in a try-catch for more detailed error logging
      let success = false;
      try {
        console.log('About to call onCancel()');
        success = await onCancel(existingBooking);
        console.log('Cancel operation completed with result:', success);
      } catch (callError) {
        console.error('%cException thrown from onCancel handler:', 'color: red; font-weight: bold;', callError);
        console.error('Error stack:', (callError as Error).stack);

        // Display the error in an alert for immediate visibility
        alert(`Error in cancel operation: ${callError instanceof Error ? callError.message : String(callError)}`);

        throw callError; // Re-throw to be caught by the outer try-catch
      } finally {
        // Restore the original error handler
        window.onerror = originalOnError;
      }

      if (success) {
        console.log('%cCancel successful, showing success message', 'color: green; font-weight: bold;');
        setSuccess(t('message.cancelSuccess'));

        // Mark the appointment as cancelled
        setIsCancelled(true);
        console.log('Marked appointment as cancelled');

        // Call the refresh callback immediately if provided
        if (onRefresh) {
          console.log('%cCalling refresh callback after successful cancel', 'color: green; font-weight: bold;');
          onRefresh();
        }

        // Keep the modal open so the user can see the success message
        // The user can close it manually when ready
        console.log('Keeping modal open after successful cancel');

        // Disable the cancel button to prevent multiple cancellations
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } else {
        console.error('%cCancel operation returned false', 'color: red; font-weight: bold;');
        setError(t('message.cancelFailed'));

        // Display the error in an alert for immediate visibility
        alert('Failed to cancel appointment. Check console for details.');
      }
    } catch (err) {
      console.error('%cERROR IN CANCEL OPERATION', 'background: red; color: white; font-size: 16px; padding: 4px;');
      console.error('Error object:', err);
      console.error('Error type:', err instanceof Error ? 'Error object' : typeof err);

      if (err instanceof Error) {
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      } else {
        console.error('Non-Error object thrown:', err);
      }

      // Display the error in an alert for immediate visibility
      alert(`Error cancelling appointment: ${err instanceof Error ? err.message : String(err)}`);

      setError(t('message.errorOccurred'));
    } finally {
      setLoading(false);
      setCancelInProgress(false);
      console.log('Cancel process completed, loading state reset');
      console.log('%c=== APPOINTMENT MODAL CANCEL COMPLETED ===', 'background: #ff9800; color: white; font-size: 16px;');
    }
  };

  const handleDelete = async () => {
    console.log('%c=== APPOINTMENT MODAL DELETE STARTED ===', 'background: #ff0000; color: white; font-size: 16px;');
    console.log('Current state:', { deleteInProgress, loading, isDeleted, isCancelled, success, error });
    console.log('existingBooking:', existingBooking ? JSON.stringify(existingBooking, null, 2) : 'null');

    // Prevent double deletion
    if (deleteInProgress) {
      console.log('Delete already in progress, ignoring duplicate delete request');
      return;
    }

    if (!onDelete) {
      console.error('%cERROR: Delete handler not provided', 'color: red; font-weight: bold;');
      alert('Technical error: Delete handler not provided. Check console for details.');
      return;
    }

    console.log('Delete button clicked, starting delete process');
    setDeleteInProgress(true);
    setLoading(true);
    setError(null);

    try {
      console.log('Calling onDelete handler');
      console.log('onDelete type:', typeof onDelete);
      console.log('onDelete function:', onDelete.toString().substring(0, 100) + '...');

      // Create a global error handler to catch any unhandled errors
      const originalOnError = window.onerror;
      window.onerror = function(message, source, lineno, colno, error) {
        console.error('%cUNHANDLED ERROR in delete operation', 'color: red; font-size: 16px; font-weight: bold;');
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

      // Wrap the onDelete call in a try-catch for more detailed error logging
      let success = false;
      try {
        console.log('About to call onDelete()');
        success = await onDelete();
        console.log('Delete operation completed with result:', success);
      } catch (callError) {
        console.error('%cException thrown from onDelete handler:', 'color: red; font-weight: bold;', callError);
        console.error('Error stack:', (callError as Error).stack);

        // Display the error in an alert for immediate visibility
        alert(`Error in delete operation: ${callError instanceof Error ? callError.message : String(callError)}`);

        throw callError; // Re-throw to be caught by the outer try-catch
      } finally {
        // Restore the original error handler
        window.onerror = originalOnError;
      }

      if (success) {
        console.log('%cDelete successful, showing success message', 'color: green; font-weight: bold;');
        setSuccess(t('message.deleteSuccess'));

        // Mark the appointment as deleted
        setIsDeleted(true);
        console.log('Marked appointment as deleted');

        // Call the refresh callback immediately if provided
        if (onRefresh) {
          console.log('%cCalling refresh callback after successful delete', 'color: green; font-weight: bold;');
          onRefresh();
        }

        // Keep the modal open so the user can see the success message
        // The user can close it manually when ready
        console.log('Keeping modal open after successful delete');

        // Disable the delete button to prevent multiple deletions
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } else {
        console.error('%cDelete operation returned false', 'color: red; font-weight: bold;');
        setError(t('message.deleteFailed'));

        // Display the error in an alert for immediate visibility
        alert('Failed to delete appointment. Check console for details.');
      }
    } catch (err) {
      console.error('%cERROR IN DELETE OPERATION', 'background: red; color: white; font-size: 16px; padding: 4px;');
      console.error('Error object:', err);
      console.error('Error type:', err instanceof Error ? 'Error object' : typeof err);

      if (err instanceof Error) {
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);

        // Check for specific error types
        if (err instanceof TypeError) {
          console.error('This is a TypeError - likely a property access issue or invalid function call');
        } else if (err instanceof SyntaxError) {
          console.error('This is a SyntaxError - likely an issue with parsing JSON');
        } else if (err instanceof ReferenceError) {
          console.error('This is a ReferenceError - likely an undefined variable');
        }
      } else {
        console.error('Non-Error object thrown:', err);
      }

      // Display the error in an alert for immediate visibility
      alert(`Error deleting appointment: ${err instanceof Error ? err.message : String(err)}`);

      setError(t('message.errorOccurred'));
    } finally {
      setLoading(false);
      setDeleteInProgress(false);
      console.log('Delete process completed, loading state reset');
      console.log('%c=== APPOINTMENT MODAL DELETE COMPLETED ===', 'background: #0000ff; color: white; font-size: 16px;');
    }
  };

  // Create a wrapper for onClose
  const handleClose = () => {
    console.log('%c=== MODAL CLOSE TRIGGERED ===', 'background: #ff9800; color: white; font-size: 14px;');
    console.log('Modal state:', {
      open,
      isBooked,
      success,
      error,
      isDeleted,
      saveInProgress,
      deleteInProgress,
      loading
    });
    console.log('Selected slot:', slot ? slot.toISOString() : 'null');
    console.log('Existing booking:', existingBooking ? JSON.stringify(existingBooking, null, 2) : 'null');

    // Add a special debug flag to the window object to track when the modal is being closed
    // This will help us identify if there are any unexpected calls happening
    (window as any).__modalCloseInProgress = true;
    console.log('Set __modalCloseInProgress flag to true');

    // We'll never call onRefresh here to avoid double refreshing
    // The parent component (admin dashboard) will handle refreshing when needed
    console.log('Skipping refresh callback on modal close to prevent double refreshing');

    // Call the original onClose function
    console.log('Calling onClose function');
    onClose();

    // Clear the debug flag after a short delay
    setTimeout(() => {
      (window as any).__modalCloseInProgress = false;
      console.log('Set __modalCloseInProgress flag to false');
    }, 500);

    console.log('%c=== MODAL CLOSE COMPLETED ===', 'background: #ff9800; color: white; font-size: 14px;');
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isBooked
          ? t('admin.modal.editAppointment')
          : t('admin.modal.createAppointment')}
      </DialogTitle>

      <DialogContent>
        {slot && (
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            <strong>{format(slot, 'yyyy-MM-dd HH:mm')}</strong>
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label={t('form.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            disabled={loading}
            required
          />

          <TextField
            label={t('form.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            disabled={loading}
            required
          />

          <TextField
            label={t('form.wechatId')}
            value={wechatId}
            onChange={(e) => setWechatId(e.target.value)}
            fullWidth
            disabled={loading}
            required
          />

          <TextField
            label={t('form.topic')}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={loading}
            required
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {/* Admin Delete Button - Only shown for admin users */}
        {isBooked && onDelete && (
          <Button
            onClick={handleDelete}
            color="error"
            disabled={loading || isDeleted || isCancelled}
            sx={{ mr: 'auto' }}
            title={isDeleted ? t('message.alreadyDeleted') : isCancelled ? t('message.alreadyCancelled') : ''}
          >
            {loading && deleteInProgress ? <CircularProgress size={24} /> : isDeleted ? t('message.deleted') : t('button.delete')}
          </Button>
        )}

        {/* User Cancel Button - Shown for all users with existing bookings */}
        {isBooked && onCancel && (
          <Button
            onClick={handleCancel}
            color="warning"
            disabled={loading || isDeleted || isCancelled}
            sx={{ mr: isBooked && onDelete ? '8px' : 'auto' }}
            title={isDeleted ? t('message.cannotCancelDeleted') : isCancelled ? t('message.alreadyCancelled') : ''}
          >
            {loading && cancelInProgress ? <CircularProgress size={24} /> : isCancelled ? t('message.cancelled') : t('button.cancel')}
          </Button>
        )}

        {/* Show Close button instead of Cancel when appointment is deleted, cancelled or saved successfully */}
        {isDeleted || isCancelled || success !== null ? (
          <Button
            onClick={handleClose}
            variant="contained"
            color="primary"
            sx={{ ml: 'auto' }}
          >
            {t('button.close')}
          </Button>
        ) : (
          <Button onClick={handleClose} disabled={loading}>
            {t('button.back')}
          </Button>
        )}

        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={loading || isDeleted || isCancelled || success !== null}
          title={isDeleted ? t('message.cannotSaveDeleted') : isCancelled ? t('message.cannotSaveCancelled') : success ? t('message.alreadySaved') : ''}
        >
          {loading && saveInProgress ? <CircularProgress size={24} /> : success ? t('message.saved') : t('button.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
