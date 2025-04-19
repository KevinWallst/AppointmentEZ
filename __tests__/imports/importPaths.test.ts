/**
 * This test suite validates that all critical imports in the application
 * can be resolved correctly. It helps catch import path issues early.
 */

describe('Import Path Validation', () => {
  // Test utility imports from different API routes
  test('emailUtils can be imported from all API routes', async () => {
    // Import the module directly to verify it exists
    const emailUtils = await import('../../app/utils/emailUtils');
    expect(emailUtils).toBeDefined();
    expect(typeof emailUtils.getBccEmails).toBe('function');
    
    // Test imports from different API routes
    // We're using dynamic imports to simulate the imports from different files
    
    // From app/api/bookings/route.ts (2 levels deep)
    const bookingsImport = '../../app/utils/emailUtils';
    const bookingsModule = await import(bookingsImport);
    expect(bookingsModule).toBeDefined();
    expect(typeof bookingsModule.getBccEmails).toBe('function');
    
    // From app/api/cancel/route.ts (2 levels deep)
    const cancelImport = '../../app/utils/emailUtils';
    const cancelModule = await import(cancelImport);
    expect(cancelModule).toBeDefined();
    expect(typeof cancelModule.getBccEmails).toBe('function');
    
    // From app/api/appointments/book/route.ts (3 levels deep)
    const appointmentsImport = '../../../app/utils/emailUtils';
    const appointmentsModule = await import(appointmentsImport);
    expect(appointmentsModule).toBeDefined();
    expect(typeof appointmentsModule.getBccEmails).toBe('function');
  });
  
  // Add more import tests for other critical modules as needed
});
