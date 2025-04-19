'use client';
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import { LanguageProvider } from './contexts/LanguageContext';
import { SettingsProvider } from './contexts/SettingsContext';

const theme = createTheme();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}