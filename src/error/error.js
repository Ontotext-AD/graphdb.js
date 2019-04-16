/**
 * Defines an error type wrapper.
 * @class
 */
class Error {
  /**
   * @param {ErrorCode} code
   * @param {string} message
   */
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }
}

module.exports = Error;
