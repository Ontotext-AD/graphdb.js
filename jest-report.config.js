const CONFIG = require('./jest.config');
const REPORT_DIR = 'report';

/*
 * Additional report configurations for Jest framework.
 * It enables coverage statistics and reporting.
 */
module.exports = Object.assign({

  collectCoverage: true,

  coverageDirectory: REPORT_DIR,

  coverageReporters: ['text', 'lcov'],

  reporters: ['default', ['jest-junit', {outputDirectory: REPORT_DIR}]]

}, CONFIG);
