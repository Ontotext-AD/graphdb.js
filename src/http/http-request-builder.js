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
   * Prepares new builder for HTTP GET request against the provided URL.
   *
   * @static
   * @param {string} url
   * @return {HttpRequestBuilder}
   */
  static httpGet(url) {
    return new HttpRequestBuilder().setMethod('get').setUrl(url);
  }

  /**
   * Prepares new builder for HTTP POST request against the provided URL.
   *
   * @static
   * @param {string} url
   * @return {HttpRequestBuilder}
   */
  static httpPost(url) {
    return new HttpRequestBuilder().setMethod('post').setUrl(url);
  }

  /**
   * Prepares new builder for HTTP PUT request against the provided URL.
   *
   * @static
   * @param {string} url
   * @return {HttpRequestBuilder}
   */
  static httpPut(url) {
    return new HttpRequestBuilder().setMethod('put').setUrl(url);
  }

  /**
   * Prepares new builder for HTTP PATCH request against the provided URL.
   *
   * @static
   * @param {string} url
   * @return {HttpRequestBuilder}
   */
  static httpPatch(url) {
    return new HttpRequestBuilder().setMethod('patch').setUrl(url);
  }

  /**
   * Prepares new builder for HTTP DELETE request against the provided URL.
   *
   * @static
   * @param {string} url
   * @return {HttpRequestBuilder}
   */
  static httpDelete(url) {
    return new HttpRequestBuilder().setMethod('delete').setUrl(url);
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
   * Add a custom GraphDB header which holds a user password for base
   * authentication.
   *
   * @param {string} value
   * @return {HttpRequestBuilder}
   */
  addGraphDBPasswordHeader(value) {
    return this.addHeader('x-graphdb-password', value);
  }

  /**
   * Add an Authorization header which holds an authorization token.
   *
   * @param {string} value
   * @return {HttpRequestBuilder}
   */
  addAuthorizationHeader(value) {
    return this.addHeader('authorization', value);
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
   * Returns the request's response type.
   *
   * @return {string}
   */
  getResponseType() {
    return this.config.responseType;
  }

  /**
   * Sets the data to be sent as request payload.
   *
   * @param {*} data the payload
   * @return {HttpRequestBuilder}
   */
  setData(data) {
    this.config.data = data;
    return this;
  }

  /**
   * Gets the data to be sent as payload.
   *
   * @return {*}
   */
  getData() {
    return this.config.data;
  }

  /**
   * Sets the URL against which to perform the request.
   *
   * @param {string} url
   * @return {HttpRequestBuilder}
   */
  setUrl(url) {
    this.config.url = url;
    return this;
  }

  /**
   * Gets the URL.
   *
   * @return {string}
   */
  getUrl() {
    return this.config.url;
  }

  /**
   * Sets the HTTP method.
   *
   * @param {string} method
   * @return {HttpRequestBuilder}
   */
  setMethod(method) {
    this.config.method = method;
    return this;
  }

  /**
   * Gets the HTTP method.
   *
   * @return {string}
   */
  getMethod() {
    return this.config.method;
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
