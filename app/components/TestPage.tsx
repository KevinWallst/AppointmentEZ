'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useLanguage } from '../contexts/LanguageContext';

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
  details?: any;
}

interface TestResponse {
  timestamp: string;
  overallStatus: 'pass' | 'fail';
  passedTests: number;
  failedTests: number;
  totalTests: number;
  results: TestResult[];
}

export default function TestPage() {
  const { t } = useLanguage();
  const [testData, setTestData] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Function to run tests
  const runTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test');
      
      if (!response.ok) {
        throw new Error(`Tests failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      setTestData(data);
      setLastChecked(new Date().toISOString());
    } catch (err) {
      console.error('Error running tests:', err);
      setError(err.message || 'Failed to run tests');
    } finally {
      setLoading(false);
    }
  };

  // Run tests on component mount
  useEffect(() => {
    runTests();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          System Test Suite
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={runTests}
          disabled={loading}
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
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

      {!loading && !error && testData && (
        <>
          {/* Overall Status */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Overall Status:</Typography>
            <Chip 
              icon={testData.overallStatus === 'pass' ? <CheckCircleIcon /> : <ErrorIcon />}
              label={testData.overallStatus === 'pass' ? 'All Tests Passed' : 'Some Tests Failed'}
              color={testData.overallStatus === 'pass' ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>

          {/* Test Summary */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle1">
              {testData.passedTests} of {testData.totalTests} tests passed ({Math.round(testData.passedTests / testData.totalTests * 100)}%)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last run: {formatDate(testData.timestamp)}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Test Results Table */}
          <Typography variant="h6" sx={{ mb: 2 }}>Test Results</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testData.results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {result.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small"
                        icon={result.status === 'pass' ? <CheckCircleIcon /> : <ErrorIcon />}
                        label={result.status === 'pass' ? 'Pass' : 'Fail'}
                        color={result.status === 'pass' ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{result.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Test Details */}
          <Typography variant="h6" sx={{ mb: 2 }}>Test Details</Typography>
          {testData.results.map((result, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip 
                    size="small"
                    icon={result.status === 'pass' ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={result.status === 'pass' ? 'Pass' : 'Fail'}
                    color={result.status === 'pass' ? 'success' : 'error'}
                    variant="outlined"
                  />
                  <Typography>{result.name}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {result.message}
                </Typography>
                {result.details && (
                  <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <pre style={{ margin: 0, overflow: 'auto' }}>
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Last Checked */}
          {lastChecked && (
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Typography variant="caption">
                Last checked: {formatDate(lastChecked)}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}
