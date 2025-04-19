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

  // Load settings from localStorage on component mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('appointmentEZ_settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
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
  const updateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    localStorage.setItem('appointmentEZ_settings', JSON.stringify(newSettings));
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
