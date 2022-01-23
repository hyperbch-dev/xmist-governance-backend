module.exports = {
  rootDir: "./",
  roots: ["<rootDir>/"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],
  // transform: {
  //   "^.+\\.(ts|tsx)$": "ts-jest",
  // },
  testEnvironment: "node",
  // globalSetup: "<rootDir>/jest/node.setup.js",
  // globalTeardown: "<rootDir>/jest/node.teardown.js",
  verbose: true,
  maxConcurrency: 1,
  testTimeout: 120000,
};
