const {defaults} = require('jest-config');

/*
 * Additional configurations for Jest framework.
 */
module.exports = {

  // Includes the sources so they can be imported in tests without having to use paths like ../../src
  moduleDirectories: [...defaults.moduleDirectories, 'src'],

  // Preparation/mocks before each test
  setupFilesAfterEnv: [...defaults.setupFilesAfterEnv, './test/setup.js'],

  // Ignores all of the acceptance tests
  testPathIgnorePatterns: [...defaults.testPathIgnorePatterns, 'test-e2e/']
};
