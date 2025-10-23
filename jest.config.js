module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^react-router-dom$': '<rootDir>/src/__mocks__/react-router-dom.js',
    '^react-i18next$': '<rootDir>/src/__mocks__/react-i18next.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-router-dom|react-i18next)/)',
  ],
};


