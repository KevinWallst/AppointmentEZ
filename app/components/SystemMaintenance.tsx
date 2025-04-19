'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings, SystemSettings, defaultSettings } from '../contexts/SettingsContext';

export default function SystemMaintenance() {
  const { t, language } = useLanguage();
  const { settings: globalSettings, updateSettings, resetSettings: resetGlobalSettings } = useSettings();
  const [settings, setSettings] = useState<SystemSettings>(globalSettings);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Font options
  const fontOptions = [
    'Inter, sans-serif',
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Times New Roman, serif',
    'Georgia, serif',
    'Courier New, monospace',
  ];

  // Update local settings when global settings change
  useEffect(() => {
    setSettings(globalSettings);
  }, [globalSettings]);

  // Save settings to context and localStorage
  const saveSettings = async () => {
    setSaving(true);
    try {
      updateSettings(settings);

      // Show success message
      setSnackbar({
        open: true,
        message: t('admin.settings.saveSuccess'),
        severity: 'success',
      });

      // Reload the page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: t('admin.settings.saveError'),
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset settings to default
  const resetSettings = () => {
    setSettings(defaultSettings);
    setSnackbar({
      open: true,
      message: t('admin.settings.resetSuccess'),
      severity: 'success',
    });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };



  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {t('admin.settings.title')}
      </Typography>

      <Grid container spacing={3}>
        {/* Attorney Name Settings */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('admin.settings.attorneyName')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('admin.settings.attorneyNameEn')}
                value={settings.attorneyName.en}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    attorneyName: {
                      ...settings.attorneyName,
                      en: e.target.value,
                    },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('admin.settings.attorneyNameZh')}
                value={settings.attorneyName.zh}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    attorneyName: {
                      ...settings.attorneyName,
                      zh: e.target.value,
                    },
                  })
                }
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* Title Style Settings */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('admin.settings.titleStyle')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>{t('admin.settings.fontFamily')}</InputLabel>
                <Select
                  value={settings.titleStyle.fontFamily}
                  label={t('admin.settings.fontFamily')}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      titleStyle: {
                        ...settings.titleStyle,
                        fontFamily: e.target.value,
                      },
                    })
                  }
                >
                  {fontOptions.map((font) => (
                    <MenuItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font.split(',')[0]}</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('admin.settings.fontSize')}
                value={settings.titleStyle.fontSize}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    titleStyle: {
                      ...settings.titleStyle,
                      fontSize: e.target.value,
                    },
                  })
                }
                placeholder="2rem"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('admin.settings.color')}
                value={settings.titleStyle.color}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    titleStyle: {
                      ...settings.titleStyle,
                      color: e.target.value,
                    },
                  })
                }
                placeholder="#1976d2"
                type="color"
              />
            </Grid>
          </Grid>

          {/* Preview */}
          <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('admin.settings.preview')}:
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontFamily: settings.titleStyle.fontFamily,
                fontSize: settings.titleStyle.fontSize,
                color: settings.titleStyle.color,
              }}
            >
              {language === 'zh' ? settings.attorneyName.zh : settings.attorneyName.en}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* Background Settings */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('admin.settings.background')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('admin.settings.backgroundType')}</InputLabel>
                <Select
                  value={settings.background.type}
                  label={t('admin.settings.backgroundType')}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      background: {
                        ...settings.background,
                        type: e.target.value as 'color' | 'image',
                      },
                    })
                  }
                >
                  <MenuItem value="color">{t('admin.settings.backgroundColor')}</MenuItem>
                  <MenuItem value="image">{t('admin.settings.backgroundImage')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              {settings.background.type === 'color' ? (
                <TextField
                  fullWidth
                  label={t('admin.settings.colorValue')}
                  value={settings.background.value}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      background: {
                        ...settings.background,
                        value: e.target.value,
                      },
                    })
                  }
                  type="color"
                />
              ) : (
                <TextField
                  fullWidth
                  label={t('admin.settings.imageUrl')}
                  value={settings.background.value}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      background: {
                        ...settings.background,
                        value: e.target.value,
                      },
                    })
                  }
                  placeholder="https://example.com/background.jpg"
                />
              )}
            </Grid>
          </Grid>

          {/* Background Preview */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              height: '100px',
              borderRadius: 1,
              ...(settings.background.type === 'color'
                ? { backgroundColor: settings.background.value }
                : {
                    backgroundImage: `url(${settings.background.value})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }),
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                color: settings.background.type === 'color' ?
                  (settings.background.value === '#ffffff' || settings.background.value === '#f5f5f5' ? '#000000' : '#ffffff') :
                  '#ffffff',
                textShadow: settings.background.type === 'image' ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none',
              }}
            >
              {t('admin.settings.backgroundPreview')}
            </Typography>
          </Box>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={resetSettings}>
            {t('admin.settings.reset')}
          </Button>
          <Button
            variant="contained"
            onClick={saveSettings}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? t('admin.settings.saving') : t('admin.settings.save')}
          </Button>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
