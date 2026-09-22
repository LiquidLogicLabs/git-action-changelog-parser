module.exports = {
  // Coverage ratchet: the measured values when this was introduced, floored to the
  // integer below so the gate catches a real regression without failing on
  // sub-percent variation. A floor to raise, never to lower -- if a change
  // legitimately reduces coverage, say so in the commit rather than editing this
  // quietly.
  coverageThreshold: {
    global: {
      statements: 74,
      branches: 67,
      functions: 64,
      lines: 74
    }
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
};

