'use client';

import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLanguage: 'zh' | 'en' | null
  ) => {
    if (newLanguage !== null) {
      setLanguage(newLanguage);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginRight: '20px' }}>
      <Typography variant="body2" sx={{ minWidth: '60px' }}>{t('language')}:</Typography>
      <ToggleButtonGroup
        value={language}
        exclusive
        onChange={handleChange}
        aria-label="language"
        size="small"
      >
        <ToggleButton value="zh" aria-label="chinese" sx={{ minWidth: '60px' }}>
          中文
        </ToggleButton>
        <ToggleButton value="en" aria-label="english" sx={{ minWidth: '70px' }}>
          English
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};
