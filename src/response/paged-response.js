/**
 * Defines a wrapper around query result which can be fetched in
 * pages, defining pagination configuration and holding reference
 * to {@link BaseRepositoryClient} used internally for the fetch
 * operations.
 * @class
 */
export class PagedResponse {
  /**
   * @param {BaseRepositoryClient} repository
   * @param {number} total
   * @param {number} offset
   * @param {number} limit
   * @param {RDFContentType} responseType
   * @param {(string|sparql|ResponseIterator)} result
   */
  constructor(repository, total, offset, limit, responseType, result) {
    this.repository = repository;
    this.total = total;
    this.offset = offset;
    this.limit = limit;
    this.responseType = responseType;
    this.result = result;
  }
}
