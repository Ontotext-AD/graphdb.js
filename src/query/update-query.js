/**
 * Defines a wrapper for update query parameters.
 * @class
 */
export class UpdateQuery {
  /**
   * @param {string} query
   * @param {boolean} infer
   * @param {number} timeout
   */
  constructor(query, infer, timeout) {
    this.query = query;
    this.infer = infer;
    this.timeout = timeout;
  }
}
