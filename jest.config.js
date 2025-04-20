module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      jsx: 'react-jsx',
      isolatedModules: true
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }],
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js|jsx)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^app/(.*)$': '<rootDir>/app/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^next/server$': '<rootDir>/__mocks__/next-server.js',
    '^../app/components/AppointmentModal$': '<rootDir>/__mocks__/app/components/AppointmentModal.js',
    '^../app/admin/dashboard/page$': '<rootDir>/__mocks__/app/admin/dashboard/page.js'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@testing-library)/)',
  ],
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  // Add this to handle Next.js specific modules
  moduleDirectories: ['node_modules', '<rootDir>'],
};
