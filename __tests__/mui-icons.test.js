import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import Material UI icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

describe('Material UI Icons', () => {
  test('ExpandMoreIcon renders correctly', () => {
    const { container } = render(<ExpandMoreIcon />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('RefreshIcon renders correctly', () => {
    const { container } = render(<RefreshIcon />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('CheckCircleIcon renders correctly', () => {
    const { container } = render(<CheckCircleIcon />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('ErrorIcon renders correctly', () => {
    const { container } = render(<ErrorIcon />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
