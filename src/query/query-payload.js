const QueryContentType = require('../http/query-content-type');

/**
 * Base class from which all query payload classes derives. Successors must
 * implement {@link #validateParams} and {@link #getSupportedContentTypes}.
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
    this.payload = {};
    this.contentType = null;
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

    this.payload.infer = inference;
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

    this.payload.timeout = timeout;
    return this;
  }

  /**
   * An optional parameter which is used for defining the request Content-Type.
   *
   * @param {string} [contentType] One of the supported content types for given
   * operation.
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
   */
  getContentType() {
    return this.contentType;
  }

  /**
   * Serializes all query parameters populated in the payload. Only parameters
   * which are present will be returned.
   *
   * Mandatory and dependent parameters are validated and errors are thrown if
   * necessary.
   *
   * @return {string} a serialized payload which holds all available query
   * parameters in this payload object.
   */
  getParams() {
    // when contentType is 'x-www-form-urlencoded', then all parameters should
    // be considered
    if (this.getContentType() === QueryContentType.X_WWW_FORM_URLENCODED) {
      const isValid = this.validateParams();
      return isValid && this.serialize(this.payload);
    }

    const query = this.getQuery();
    if (!query) {
      throw new Error('Parameter query is mandatory!');
    }
    return query;
  }

  /**
   * Utility method which serializes a single level json object to properly
   * encoded string that can be used in a request.
   *
   * @protected
   * @param {Object} data object which holds request parameter key:value pairs.
   * @return {string} provided object serialized and encoded to string.
   */
  serialize(data) {
    return Object.entries(data)
      .filter((x) => x[1] !== undefined)
      .map((x) => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`)
      .join('&');
  }

  /**
   * Must be implemented in successors.
   *
   * Validates payload for mandatory and invalid parameters.
   *
   * @abstract
   * @protected
   *
   * @return {boolean} <code>true</code> if parameters are valid and
   * <code>false</code> otherwise.
   */
  validateParams() {
    return false;
  }

  /**
   * Must be implemented in successors and should return a list with supported
   * content types.
   * @abstract
   * @protected
   *
   * @return {Array<string>}
   */
  getSupportedContentTypes() {
    return [];
  }
}

module.exports = QueryPayload;
