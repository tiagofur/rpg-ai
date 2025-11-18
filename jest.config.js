/**
 * Configuración de Jest para testing supremo
 * Estándares de Google/Microsoft aplicados
 */

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Configuración de TypeScript
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          compilerOptions: {
            module: 'commonjs',
            target: 'es2022',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
        },
      },
    ],
  },

  // Coverage - EXIGENTE como Google
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.ts', // Archivos de barril
    '!src/**/types.ts', // Archivos de tipos
  ],

  coverageThreshold: {
    global: {
      branches: 99, // ¡EXIGENTE!
      functions: 99,
      lines: 99,
      statements: 99,
    },
    './src/core/': {
      branches: 100, // Core perfecto
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/services/': {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
    './src/utils/': {
      branches: 100, // Utils perfectos
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },

  // Ignorar archivos
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/prisma/generated/',
  ],

  // Test files
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/?(*.)+(spec|test).ts',
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],

  // Module aliases - iguales que TypeScript
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@plugins/(.*)$': '<rootDir>/src/plugins/$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Global variables
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  // Performance
  maxWorkers: '50%', // Balance entre velocidad y recursos
  workerIdleMemoryLimit: '512MB', // Límite de memoria por worker
  
  // Verbosidad para debugging
  verbose: true,
  
  // Limpiar mocks entre tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Tiempo límite para tests
  testTimeout: 10000, // 10 segundos
  
  // Detect leaks de memoria
  detectLeaks: true,
  
  // Fail fast - como Google
  bail: false, // Cambiar a true en CI para fallar rápido
  
  // Cobertura detallada
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'clover',
  ],
  
  // Reporter personalizado para ver bonito
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'RPG AI Supreme - Test Report',
      outputPath: 'coverage/test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
    }]
  ],
};