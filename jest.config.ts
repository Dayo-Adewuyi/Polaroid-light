export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/server.ts',
      '!src/types/index.ts',
    ],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      },
      coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    clearMocks: true,
    verbose: true,
  };