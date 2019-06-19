const {defaults} = require('jest-config');

/*
 * Additional configurations for Jest framework.
 */
module.exports = {

  // Includes the sources so they can be imported in tests without having to use paths like ../../src
  moduleDirectories: [...defaults.moduleDirectories, 'tests'],

  // Preparation/mocks before each test
  setupFilesAfterEnv: [...defaults.setupFilesAfterEnv, './tests/jest.setup.js']
};
