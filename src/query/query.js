/**
 * Defines a wrapper for query parameters.
 * @class
 */
export class Query {
  /**
   * @param {string} query
   * @param {QueryType} queryType
   * @param {boolean} distinct
   * @param {boolean} infer
   * @param {number} limit
   * @param {number} offset
   */
  constructor(query, queryType, distinct, infer, limit, offset) {
    this.query = query;
    this.queryType = queryType;
    this.distinct = distinct;
    this.infer = infer;
    this.limit = limit;
    this.offset = offset;
  }
}
