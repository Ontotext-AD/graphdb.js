/**
 * Holds configuration applicable to the http client.
 * @class
 */
class HttpClientConfig {
  /**
   * Constructor.
   */
  constructor() {
    this.config = {};
  }

  /**
   * Add a new http header entry.
   *
   * @param {string} header type
   * @param {string} value the header value
   * @return {HttpClientConfig}
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
   * @return {HttpClientConfig}
   */
  addAcceptHeader(value) {
    return this.addHeader('Accept', value);
  }

  /**
   * Add a specific header of type <code>Content-Type</code> with the given
   * value.
   *
   * @param {string} value
   * @return {HttpClientConfig}
   */
  addContentTypeHeader(value) {
    return this.addHeader('Content-Type', value);
  }

  /**
   * Set request parameters object.
   *
   * @param {Object} params
   * @return {HttpClientConfig}
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
   * @return {HttpClientConfig}
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
   * @return {HttpClientConfig}
   */
  setTimeout(timeout) {
    this.config.timeout = timeout;
    return this;
  }

  /**
   * Set a responseType config.
   *
   * @param {string} responseType
   * @return {HttpClientConfig}
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

module.exports = HttpClientConfig;
