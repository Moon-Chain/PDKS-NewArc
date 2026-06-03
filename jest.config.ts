import type { Config } from 'jest';

const config: Config = {
  preset:           'ts-jest',
  testEnvironment:  'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // .js → .ts çözümü
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM:     true,
      tsconfig: {
        module:           'ESNext',
        moduleResolution: 'bundler',
        target:           'ES2022',
      },
    }],
  },
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'services/**/*.ts',
    'repositories/**/*.ts',
    'shared/**/*.ts',
    '!**/*.d.ts',
  ],
};

export default config;
