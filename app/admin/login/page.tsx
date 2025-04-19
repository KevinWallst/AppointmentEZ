'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AdminLogin() {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple hardcoded authentication
    if (username === 'admin' && password === 'notpassword') {
      // Set a session cookie or localStorage item to maintain login state
      localStorage.setItem('adminAuthenticated', 'true');
      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } else {
      setError(t('message.loginFailed'));
    }
  };

  const backgroundStyle = {
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    paddingTop: '2rem',
    paddingBottom: '2rem'
  };

  return (
    <div style={backgroundStyle}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <Typography variant="h4" sx={{ mb: 1 }} align="center">
            {t('main.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" align="center" gutterBottom>
            {t('admin.login.title')}
          </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin} style={{ marginTop: '1rem' }}>
          <TextField
            fullWidth
            label={t('form.name')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label={t('form.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            {t('button.login')}
          </Button>
        </form>
      </Paper>
    </Container>
    </div>
  );
}
