module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy'
  },
  testPathIgnorePatterns: ['/node_modules/']
};
