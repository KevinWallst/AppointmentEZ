// Set a fixed timezone for tests
process.env.TZ = 'UTC';

// Mock environment variables
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test-password';

// Silence console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};
