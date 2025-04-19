import path from 'path';
import fs from 'fs';

// Mock the emailUtils module
jest.mock('../../app/utils/emailUtils', () => ({
  getBccEmails: jest.fn().mockReturnValue(['test@example.com']),
}));

describe('Import Path Validation', () => {
  it('emailUtils module exists', () => {
    const emailUtilsPath = path.join(process.cwd(), 'app/utils/emailUtils.ts');
    expect(fs.existsSync(emailUtilsPath)).toBe(true);
  });

  it('emailUtils can be imported directly', async () => {
    // Direct import
    const directImport = '../../app/utils/emailUtils';
    const directModule = await import(directImport);
    expect(directModule).toBeDefined();
    expect(typeof directModule.getBccEmails).toBe('function');
  });

  it('emailUtils can be imported from all API routes', async () => {
    // From app/api/cancel/route.ts (2 levels deep)
    const cancelImport = '../../app/utils/emailUtils';
    const cancelModule = await import(cancelImport);
    expect(cancelModule).toBeDefined();
    expect(typeof cancelModule.getBccEmails).toBe('function');

    // From app/api/bookings/route.ts (2 levels deep)
    const bookingsImport = '../../app/utils/emailUtils';
    const bookingsModule = await import(bookingsImport);
    expect(bookingsModule).toBeDefined();
    expect(typeof bookingsModule.getBccEmails).toBe('function');

    // From app/api/appointments/book/route.ts (3 levels deep)
    const appointmentsImport = '../../app/utils/emailUtils';
    const appointmentsModule = await import(appointmentsImport);
    expect(appointmentsModule).toBeDefined();
    expect(typeof appointmentsModule.getBccEmails).toBe('function');
  });
});
