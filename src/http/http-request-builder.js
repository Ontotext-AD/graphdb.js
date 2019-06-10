const StringUtils = require('../util/string-utils');

/**
 * Holds request information applicable to {@link HttpClient}.
 *
 * @class
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class HttpRequestBuilder {
  /**
   * Does default initialization of the configuration.
   */
  constructor() {
    this.config = {};
  }

  /**
   * Add a new http header entry. Blank values are skipped.
   *
   * @param {string} header type
   * @param {string} value the header value
   * @return {HttpRequestBuilder}
   */
  addHeader(header, value) {
    if (StringUtils.isBlank(value)) {
      return this;
    }
    if (!this.config.headers) {
      this.config.headers = {};
    }
    this.config.headers[header] = value;
    return this;
  }

  /**
   * Sets the headers map.
   *
   * @param {Object<string, string>} headers the headers map
   * @return {HttpRequestBuilder}
   */
  setHeaders(headers) {
    this.config.headers = headers;
    return this;
  }

  /**
   * Returns the headers map.
   *
   * @return {Object<string, string>}
   */
  getHeaders() {
    return this.config.headers;
  }

  /**
   * Add a specific header of type <code>Accept</code> with the given value.
   *
   * @param {string} value
   * @return {HttpRequestBuilder}
   */
  addAcceptHeader(value) {
    return this.addHeader('Accept', value);
  }

  /**
   * Add a specific header of type <code>Content-Type</code> with the given
   * value.
   *
   * @param {string} value
   * @return {HttpRequestBuilder}
   */
  addContentTypeHeader(value) {
    return this.addHeader('Content-Type', value);
  }

  /**
   * Set request parameters object.
   *
   * @param {Object} params
   * @return {HttpRequestBuilder}
   */
  setParams(params) {
    this.config.params = params;
    return this;
  }

  /**
   * Add a new request param.
   *
   * @param {string} param
   * @param {*} value
   * @return {HttpRequestBuilder}
   */
  addParam(param, value) {
    if (!value) {
      return this;
    }
    if (!this.config.params) {
      this.config.params = {};
    }
    this.config.params[param] = value;
    return this;
  }

  /**
   * Returns the request parameters map.
   *
   * @return {Object<string, *>}
   */
  getParams() {
    return this.config.params;
  }

  /**
   * Set timeout configuration.
   *
   * @param {number} timeout in ms
   * @return {HttpRequestBuilder}
   */
  setTimeout(timeout) {
    this.config.timeout = timeout;
    return this;
  }

  /**
   * Returns the request timeout.
   *
   * @return {number}
   */
  getTimeout() {
    return this.config.timeout;
  }

  /**
   * Set a responseType config.
   *
   * @param {string} responseType
   * @return {HttpRequestBuilder}
   */
  setResponseType(responseType) {
    this.config.responseType = responseType;
    return this;
  }

  /**
   * Getter for the configuration.
   * @return {Object}
   */
  get() {
    return this.config;
  }
}

module.exports = HttpRequestBuilder;
