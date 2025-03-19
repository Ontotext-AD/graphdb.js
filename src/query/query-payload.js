const QueryContentType = require('../http/query-content-type');

/**
 * Base class from which all query payload classes derives.
 * Subclasses must implement {@link #getSupportedContentTypes}
 * and may override {@link #validatePayload} if additional validation is needed
 * according to the subclass.
 *
 * @abstract
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class QueryPayload {
  /**
   * Does basic initialization.
   */
  constructor() {
    /**
     * Holds common request parameters applicable to the query endpoint.
     *
     * @type {Object}
     */
    this.params = {};

    /**
     * Holds the SPARQL query to be used in the request to the query endpoint.
     *
     * @type {string|undefined}
     */
    this.query = undefined;

    /**
     * Holds the content type value to be used in the request to the query
     * endpoint. This value will be set as the HTTP 'Content-Type' header when
     * sending the request. The value is one of the {@link QueryContentType}
     * enum values.
     *
     * @type {string}
     */
    this.contentType = QueryContentType.X_WWW_FORM_URLENCODED;
  }

  /**
   * @param {boolean} [inference] Specifies whether inferred statements should
   *                  be included in the query evaluation.
   * @return {QueryPayload}
   */
  setInference(inference) {
    if (typeof inference !== 'boolean') {
      throw new Error('Inference must be a boolean!');
    }

    this.params.infer = inference;
    return this;
  }

  /**
   * @param {number} [timeout] Specifies a maximum query execution time, in
   *                 whole seconds.
   * @return {QueryPayload}
   */
  setTimeout(timeout) {
    if (typeof timeout !== 'number') {
      throw new Error('Timeout must be a number!');
    }

    this.params.timeout = timeout;
    return this;
  }

  /**
   * An optional parameter which is used for defining the request Content-Type.
   *
   * @param {string} [contentType] The value is one of the
   * {@link QueryContentType} enum values.
   *
   * @return {QueryPayload}
   */
  setContentType(contentType) {
    const supportedTypes = this.getSupportedContentTypes();
    if (typeof contentType !== 'string' ||
      supportedTypes.indexOf(contentType) === -1) {
      throw new Error(`Content type must be one of ${supportedTypes}!`);
    }

    this.contentType = contentType;
    return this;
  }

  /**
   * @return {string} content type which was populated in this payload.
   * The value is one of the {@link QueryContentType} enum values.
   */
  getContentType() {
    return this.contentType;
  }

  /**
   *
   * @return {Object} the query payload that contains all parameters.
   */
  getParams() {
    return this.params;
  }

  /**
   * Sets the SPARQL query string to be used.
   *
   * @param {string} query - The query string to set.
   * @return {QueryPayload}
   */
  setQuery(query) {
    if (typeof query !== 'string') {
      throw new Error('Query must be a string!');
    }
    this.query = query;
    return this;
  }

  /**
   * Retrieves the current SPARQL query string.
   *
   * @return {string} The currently set SPARQL query string.
   */
  getQuery() {
    return this.query;
  }

  /**
   *
   * Validates payload for mandatory and invalid parameters.
   *
   * @throws {Error} if the payload is misconfigured
   */
  validatePayload() {
    if (!this.query) {
      throw new Error('Parameter query is mandatory!');
    }
  }
}

module.exports = QueryPayload;
