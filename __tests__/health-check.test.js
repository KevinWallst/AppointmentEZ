import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HealthCheck from '../app/components/HealthCheck';

// Mock the fetch function
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'en'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the Material UI components to avoid SVG rendering issues in tests
jest.mock('@mui/material/Accordion', () => {
  return ({ children, expanded, onChange }) => (
    <div data-testid="accordion" data-expanded={expanded} onClick={onChange}>
      {children}
    </div>
  );
});

jest.mock('@mui/material/AccordionSummary', () => {
  return ({ children, expandIcon }) => (
    <div data-testid="accordion-summary">
      {children}
      {expandIcon}
    </div>
  );
});

jest.mock('@mui/material/AccordionDetails', () => {
  return ({ children }) => (
    <div data-testid="accordion-details">
      {children}
    </div>
  );
});

jest.mock('@mui/icons-material/ExpandMore', () => {
  return () => <div data-testid="expand-more-icon" />;
});

jest.mock('@mui/icons-material/Refresh', () => {
  return () => <div data-testid="refresh-icon" />;
});

jest.mock('@mui/icons-material/CheckCircle', () => {
  return () => <div data-testid="check-circle-icon" />;
});

jest.mock('@mui/icons-material/Error', () => {
  return () => <div data-testid="error-icon" />;
});

// Mock translations
jest.mock('../app/contexts/LanguageContext', () => {
  const originalModule = jest.requireActual('../app/contexts/LanguageContext');
  
  return {
    ...originalModule,
    useLanguage: () => ({
      language: 'en',
      setLanguage: jest.fn(),
      t: (key) => {
        const translations = {
          'admin.health.title': 'Health Check',
          'admin.health.refresh': 'Refresh',
          'admin.health.refreshing': 'Refreshing...',
          'admin.health.overallStatus': 'Overall Status',
          'admin.health.healthy': 'Healthy',
          'admin.health.unhealthy': 'Unhealthy',
          'admin.health.version': 'Version',
          'admin.health.environment': 'Environment',
          'admin.health.timestamp': 'Timestamp',
          'admin.health.componentStatus': 'Component Status',
          'admin.health.component': 'Component',
          'admin.health.status': 'Status',
          'admin.health.message': 'Message',
          'admin.health.systemInfo': 'System Information',
          'admin.health.componentDetails': 'Component Details',
          'admin.health.lastChecked': 'Last Checked',
          'admin.health.platform': 'Platform',
          'admin.health.nodeVersion': 'Node Version',
          'admin.health.uptime': 'Uptime',
          'admin.health.hostname': 'Hostname',
          'admin.health.cpus': 'CPUs',
          'admin.health.memory': 'Memory',
          'admin.health.components.database': 'Database',
          'admin.health.components.email': 'Email',
          'admin.health.components.filesystem': 'Filesystem',
          'admin.health.components.memory': 'Memory',
        };
        return translations[key] || key;
      }
    }),
  };
});

describe('HealthCheck Component', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock successful fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '0.2.7',
        environment: 'test',
        components: {
          database: {
            status: 'healthy',
            message: 'Connected to database',
          },
          email: {
            status: 'healthy',
            message: 'Email service is working',
          },
          filesystem: {
            status: 'healthy',
            message: 'Filesystem is accessible',
          },
          memory: {
            status: 'healthy',
            message: 'Memory usage is normal',
          },
        },
        systemInfo: {
          platform: 'darwin',
          nodeVersion: '18.x',
          uptime: 3600,
          hostname: 'localhost',
          cpus: 8,
          memory: {
            total: 16000000000,
            free: 8000000000,
          },
        },
      }),
    });
  });

  test('renders the HealthCheck component with Material UI icons', async () => {
    render(<HealthCheck />);
    
    // Check that the component renders
    expect(screen.getByText('Health Check')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that the refresh button is rendered
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    
    // Check for the refresh icon
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
  });

  test('displays error state when health check fails', async () => {
    // Mock error response
    global.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    render(<HealthCheck />);
    
    // Wait for the error state to be displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('displays success state when health check succeeds', async () => {
    render(<HealthCheck />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for the check circle icon (success state)
    const checkCircleIcons = screen.getAllByTestId('check-circle-icon');
    expect(checkCircleIcons.length).toBeGreaterThan(0);
    
    // Check for the version information
    expect(screen.getByText('0.2.7')).toBeInTheDocument();
    
    // Check for the environment information
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
