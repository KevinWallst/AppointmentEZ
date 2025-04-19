'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useLanguage } from '../contexts/LanguageContext';

// Define the health check response type
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  components: {
    database: {
      status: 'healthy' | 'unhealthy';
      message: string;
      details?: any;
    };
    email: {
      status: 'healthy' | 'unhealthy';
      message: string;
      details?: any;
    };
    filesystem: {
      status: 'healthy' | 'unhealthy';
      message: string;
      details?: any;
    };
    memory: {
      status: 'healthy' | 'unhealthy';
      message: string;
      details?: any;
    };
  };
  systemInfo: any;
}

export default function HealthCheck() {
  const { t } = useLanguage();
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Function to fetch health check data
  const fetchHealthData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/health');

      // Don't treat 503 as an error - it's expected when health status is unhealthy
      if (!response.ok && response.status !== 503) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }

      const data = await response.json();
      setHealthData(data);
      setLastChecked(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError(err.message || 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch health data on component mount
  useEffect(() => {
    fetchHealthData();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format uptime to human-readable format
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          {t('admin.health.title')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchHealthData}
          disabled={loading}
        >
          {loading ? t('admin.health.refreshing') : t('admin.health.refresh')}
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && healthData && (
        <>
          {/* Overall Status */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">{t('admin.health.overallStatus')}:</Typography>
            <Chip
              icon={healthData.status === 'healthy' ? <CheckCircleIcon /> : <ErrorIcon />}
              label={healthData.status === 'healthy' ? t('admin.health.healthy') : t('admin.health.unhealthy')}
              color={healthData.status === 'healthy' ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>

          {/* Basic Information */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1">{t('admin.health.version')}:</Typography>
              <Typography variant="body1">{healthData.version}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1">{t('admin.health.environment')}:</Typography>
              <Typography variant="body1">{healthData.environment}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1">{t('admin.health.timestamp')}:</Typography>
              <Typography variant="body1">{formatDate(healthData.timestamp)}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Component Status */}
          <Typography variant="h6" sx={{ mb: 2 }}>{t('admin.health.componentStatus')}</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('admin.health.component')}</TableCell>
                  <TableCell>{t('admin.health.status')}</TableCell>
                  <TableCell>{t('admin.health.message')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(healthData.components).map(([key, component]) => (
                  <TableRow key={key}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {t(`admin.health.components.${key}`)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={component.status === 'healthy' ? <CheckCircleIcon /> : <ErrorIcon />}
                        label={component.status === 'healthy' ? t('admin.health.healthy') : t('admin.health.unhealthy')}
                        color={component.status === 'healthy' ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{component.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 3 }} />

          {/* System Information */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{t('admin.health.systemInfo')}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">{t('admin.health.platform')}:</Typography>
                  <Typography variant="body1">{healthData.systemInfo.platform}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">{t('admin.health.nodeVersion')}:</Typography>
                  <Typography variant="body1">{healthData.systemInfo.nodeVersion}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">{t('admin.health.uptime')}:</Typography>
                  <Typography variant="body1">{formatUptime(healthData.systemInfo.uptime)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">{t('admin.health.hostname')}:</Typography>
                  <Typography variant="body1">{healthData.systemInfo.hostname}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">{t('admin.health.cpus')}:</Typography>
                  <Typography variant="body1">{healthData.systemInfo.cpus}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">{t('admin.health.memory')}:</Typography>
                  <Typography variant="body1">
                    {t('admin.health.systemInfo')}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Component Details */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{t('admin.health.componentDetails')}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {Object.entries(healthData.components).map(([key, component]) => (
                  <Grid item xs={12} key={key}>
                    <Typography variant="subtitle1">{t(`admin.health.components.${key}`)}</Typography>
                    {component.details && (
                      <Box sx={{ mt: 1, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <pre style={{ margin: 0, overflow: 'auto' }}>
                          {JSON.stringify(component.details, null, 2)}
                        </pre>
                      </Box>
                    )}
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Last Checked */}
          {lastChecked && (
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Typography variant="caption">
                {t('admin.health.lastChecked')}: {formatDate(lastChecked)}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}
