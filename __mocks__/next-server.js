// Mock for next/server
module.exports = {
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
    redirect: jest.fn((url) => ({ url })),
    next: jest.fn(() => ({})),
    rewrite: jest.fn((url) => ({ url })),
  },
  NextRequest: jest.fn(function(input, init) {
    this.url = input || '';
    this.nextUrl = {
      pathname: this.url.split('?')[0] || '/',
      searchParams: new URLSearchParams(this.url.split('?')[1] || ''),
    };
    this.cookies = {
      get: jest.fn((name) => ({ name, value: 'mock-value' })),
      getAll: jest.fn(() => []),
      set: jest.fn(),
      delete: jest.fn(),
    };
    this.headers = new Headers(init?.headers || {});
    return this;
  }),
};
