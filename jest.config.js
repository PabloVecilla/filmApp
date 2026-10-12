module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.js"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 30000,
  };