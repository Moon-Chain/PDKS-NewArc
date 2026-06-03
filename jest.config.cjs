/** @type {import('jest').Config} */
module.exports = {
  preset:          'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module:           'CommonJS',
        moduleResolution: 'node',
        target:           'ES2022',
        esModuleInterop:  true,
        strict:           true,
      },
    }],
  },
  testMatch: ['**/tests/**/*.test.ts'],
};
