/** @type {import('jest').Config} */
module.exports = {
  displayName: 'SKER Integration Tests',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.{js,ts}',
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/integration.ts'],
  testTimeout: 60000, // 60秒超时，适应集成测试的复杂度
  maxWorkers: 1, // 集成测试串行执行，避免资源冲突
  verbose: true,
  bail: false, // 不要在第一个失败时停止
  moduleNameMapping: {
    '^@sker/(.*)$': '<rootDir>/packages/$1/src'
  },
  globalSetup: '<rootDir>/tests/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts'
}