'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the settings interface
export interface SystemSettings {
  attorneyName: {
    en: string;
    zh: string;
  };
  titleStyle: {
    fontFamily: string;
    fontSize: string;
    color: string;
  };
  background: {
    type: 'color' | 'image';
    value: string;
  };
  emailSettings: {
    bccEmails: string[];
    adminEmail: string;
  };
}

// Default settings
export const defaultSettings: SystemSettings = {
  attorneyName: {
    en: 'Attorney Ye Le',
    zh: '叶乐律师',
  },
  titleStyle: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '2rem',
    color: '#1976d2',
  },
  background: {
    type: 'color',
    value: '#f5f5f5',
  },
  emailSettings: {
    bccEmails: ['leyelaw@gmail.com', 'kevin@leyelaw.com', 'leye@leyelaw.com'],
    adminEmail: 'kevinwallst@gmail.com',
  },
};

// Create context
interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: SystemSettings) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from API and localStorage on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // First try to load from localStorage for quick startup
        const savedSettings = localStorage.getItem('appointmentEZ_settings');
        let parsedSettings = null;

        if (savedSettings) {
          parsedSettings = JSON.parse(savedSettings);
          // Apply local settings immediately for fast UI rendering
          setSettings({
            ...defaultSettings,
            ...parsedSettings,
            // Ensure emailSettings exists and has all required properties
            emailSettings: {
              ...defaultSettings.emailSettings,
              ...(parsedSettings.emailSettings || {})
            }
          });
        }

        // Then fetch from API to ensure we have the latest server-side settings
        try {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const apiSettings = await response.json();

            // Merge with default settings to ensure all properties exist
            const mergedSettings = {
              ...defaultSettings,
              ...apiSettings,
              // Ensure emailSettings exists and has all required properties
              emailSettings: {
                ...defaultSettings.emailSettings,
                ...(apiSettings.emailSettings || {})
              }
            };

            // Update state with API settings
            setSettings(mergedSettings);

            // Also update localStorage
            localStorage.setItem('appointmentEZ_settings', JSON.stringify(mergedSettings));
          }
        } catch (apiError) {
          console.error('Error fetching settings from API:', apiError);
          // If API fetch fails but we have local settings, continue using those
        }

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading settings:', error);
        setIsLoaded(true);
      }
    };

    // Only run in browser environment
    if (typeof window !== 'undefined') {
      loadSettings();
    } else {
      setIsLoaded(true);
    }
  }, []);

  // Update settings
  const updateSettings = async (newSettings: SystemSettings) => {
    setSettings(newSettings);
    localStorage.setItem('appointmentEZ_settings', JSON.stringify(newSettings));

    // Also save settings to server for email functions to access
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        console.error('Failed to save settings to server');
      }
    } catch (error) {
      console.error('Error saving settings to server:', error);
    }
  };

  // Reset settings to default
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('appointmentEZ_settings', JSON.stringify(defaultSettings));
  };

  // Only render children once settings are loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
