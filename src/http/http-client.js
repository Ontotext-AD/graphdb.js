const axios = require('axios');
const uuidv4 = require('uuid/v4');
const qs = require('qs');

/**
 * Promise based HTTP client that delegates requests to Axios.
 *
 * The purpose of the delegating is to have an abstraction layer on top of the
 * used library.
 *
 * By default all requests are without a timeout, e.g. execution time is not
 * limited. To change that use {@link #setDefaultReadTimeout} and
 * {@link #setDefaultWriteTimeout} or provide one in each request's
 * configuration object.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class HttpClient {
  /**
   * Instantiates new HTTP client with the supplied base URL and default
   * request timeouts.
   *
   * @constructor
   * @param {string} baseURL base URL that will be prepend to all requests
   * GET
   */
  constructor(baseURL) {
    this.axios = axios.create({
      baseURL,
      paramsSerializer: HttpClient.paramsSerializer
    });
    this.readTimeout = 0;
    this.writeTimeout = 0;
  }

  /**
   * Sets the provided header map as default for all requests.
   *
   * Any additional headers provided in the request configuration will
   * be merged with this default map.
   *
   * @param {Map<string, string>} headers map with default headers
   * @return {HttpClient} the current client for method chaining
   */
  setDefaultHeaders(headers) {
    this.axios.defaults.headers = headers;
    return this;
  }

  /**
   * Sets the default request read timeout. It will be used in case requests
   * don't explicitly specify it in their request configurations.
   *
   * @param {number} readTimeout the default read timeout
   * @return {HttpClient} the current client for method chaining
   */
  setDefaultReadTimeout(readTimeout) {
    this.readTimeout = readTimeout;
    return this;
  }

  /**
   * Sets the default request write timeout. It will be used in case requests
   * don't explicitly specify it in their request configurations.
   *
   * @param {number} writeTimeout the default write timeout
   * @return {HttpClient} the current client for method chaining
   */
  setDefaultWriteTimeout(writeTimeout) {
    this.writeTimeout = writeTimeout;
    return this;
  }

  /**
   * Performs a GET request to the provided URL with the given request
   * configuration.
   *
   * Note: If <code>baseUrl</code> is defined, it will be prepend to the
   * given URL.
   *
   * @param {string} url URL to the requested resource
   * @param {object} [config={}] request configuration that can include params
   *                        and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  get(url, config = {}) {
    this.addXRequestIdHeader(config);
    this.addDefaultReadTimeout(config);
    return this.axios.get(url, config);
  }

  /**
   * Performs a POST request to the provided URL with the given payload and
   * request configuration.
   *
   * Note: If <code>baseUrl</code> is defined, it will be prepend to the
   * given URL.
   *
   * @param {string} url URL to the requested resource
   * @param {object} data the request body
   * @param {object} [config={}] request configuration that can include params
   *                        and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  post(url, data, config = {}) {
    this.addXRequestIdHeader(config);
    this.addDefaultWriteTimeout(config);
    return this.axios.post(url, data, config);
  }

  /**
   * Performs a PUT request to the provided URL with the given payload and
   * request configuration.
   *
   * Note: If <code>baseUrl</code> is defined, it will be prepend to the
   * given URL.
   *
   * @param {string} url URL to the requested resource
   * @param {object} data the request body
   * @param {object} [config={}] request configuration that can include params
   *                        and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  put(url, data, config = {}) {
    this.addXRequestIdHeader(config);
    this.addDefaultWriteTimeout(config);
    return this.axios.put(url, data, config);
  }

  /**
   * Performs a DELETE request to the provided URL with the given request
   * configuration.
   *
   * Note: If <code>baseUrl</code> is defined, it will be prepend to the
   * given URL.
   *
   * @param {string} url URL to the requested resource
   * @param {object} [config={}] request configuration that can include params
   *                        and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  deleteResource(url, config = {}) {
    this.addXRequestIdHeader(config);
    this.addDefaultWriteTimeout(config);
    return this.axios.delete(url, config);
  }

  /**
   * Sets the required x-request-id header.
   *
   * @private
   * @param {Object} requestConfig
   */
  addXRequestIdHeader(requestConfig) {
    if (!requestConfig.headers) {
      requestConfig.headers = {};
    }
    requestConfig.headers['x-request-id'] = uuidv4();
  }

  /**
   * Adds a default read timeout if it is not explicitly specified in the
   * request configuration object.
   *
   * @param {object} requestConfig request configuration object supplied to
   * the http client for specific request
   */
  addDefaultReadTimeout(requestConfig) {
    if (!requestConfig.timeout) {
      requestConfig.timeout = this.readTimeout;
    }
  }

  /**
   * Adds a default write timeout if it is not explicitly specified in the
   * request configuration object.
   *
   * @param {object} requestConfig request configuration object supplied to
   * the http client for specific request
   */
  addDefaultWriteTimeout(requestConfig) {
    if (!requestConfig.timeout) {
      requestConfig.timeout = this.writeTimeout;
    }
  }

  /**
   * Serializes the provided parameters in a way that can be properly read by
   * the RDF4J server.
   *
   * It ignores any null or undefined parameters and repeats array parameters.
   *
   * @private
   * @static
   * @param {object} params the parameters for serialization
   * @return {string} the serialized parameters
   */
  static paramsSerializer(params) {
    return qs.stringify(params, {
      arrayFormat: 'repeat',
      skipNulls: true
    });
  }
}

module.exports = HttpClient;
