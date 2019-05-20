/**
 * Holds request configuration applicable to the http client.
 *
 * @class
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class HttpRequestConfigBuilder {
  /**
   * Does default initialization of the configuration.
   */
  constructor() {
    this.config = {};
  }

  /**
   * Add a new http header entry.
   *
   * @param {string} header type
   * @param {string} value the header value
   * @return {HttpRequestConfigBuilder}
   */
  addHeader(header, value) {
    if (!this.config.headers) {
      this.config.headers = {};
    }
    this.config.headers[header] = value;
    return this;
  }

  /**
   * Add a specific header of type <code>Accept</code> with the given value.
   *
   * @param {string} value
   * @return {HttpRequestConfigBuilder}
   */
  addAcceptHeader(value) {
    return this.addHeader('Accept', value);
  }

  /**
   * Add a specific header of type <code>Content-Type</code> with the given
   * value.
   *
   * @param {string} value
   * @return {HttpRequestConfigBuilder}
   */
  addContentTypeHeader(value) {
    return this.addHeader('Content-Type', value);
  }

  /**
   * Set request parameters object.
   *
   * @param {Object} params
   * @return {HttpRequestConfigBuilder}
   */
  setParams(params) {
    this.config.params = params;
    return this;
  }

  /**
   * Add a new request param.
   *
   * @param {string} param
   * @param {any} value
   * @return {HttpRequestConfigBuilder}
   */
  addParam(param, value) {
    if (!this.config.params) {
      this.config.params = {};
    }
    this.config.params[param] = value;
    return this;
  }

  /**
   * Set timeout configuration.
   *
   * @param {number} timeout in ms
   * @return {HttpRequestConfigBuilder}
   */
  setTimeout(timeout) {
    this.config.timeout = timeout;
    return this;
  }

  /**
   * Set a responseType config.
   *
   * @param {string} responseType
   * @return {HttpRequestConfigBuilder}
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

module.exports = HttpRequestConfigBuilder;
