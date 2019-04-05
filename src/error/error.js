/**
 * Defines an error type wrapper.
 * @class
 */
export class Error {
  /**
   * @param {ErrorCode} code
   * @param {string} message
   */
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }
}
