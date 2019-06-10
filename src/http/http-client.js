const axios = require('axios');
const uuidv4 = require('uuid/v4');
const qs = require('qs');
const ConsoleLogger = require('../logging/console-logger');
const HttpRequestBuilder = require('./http-request-builder');

const REQUEST_ID_HEADER = 'x-request-id';

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
    this.initLogger(baseURL);
  }

  /**
   * Instantiates a logger for this http client instance.
   *
   * @private
   * @param {string} baseURL the URL for this client that will be
   * logged for each request
   */
  initLogger(baseURL) {
    this.logger = new ConsoleLogger({
      name: 'HttpClient',
      baseURL
    });
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
   * @param {HttpRequestBuilder} [requestConfigBuilder] request
   * configuration builder that include params and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  get(url, requestConfigBuilder) {
    const config = this.getReadRequestConfig(requestConfigBuilder);
    this.logger.trace({url, config}, 'Executing GET request');
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
   * @param {HttpRequestBuilder} [requestConfigBuilder] request
   * configuration builder that include params and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  post(url, data, requestConfigBuilder) {
    const config = this.getWriteRequestConfig(requestConfigBuilder);
    this.logger.trace({url, config, data}, 'Executing POST request');
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
   * @param {HttpRequestBuilder} [requestConfigBuilder] request
   * configuration builder that include params and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  put(url, data, requestConfigBuilder) {
    const config = this.getWriteRequestConfig(requestConfigBuilder);
    this.logger.trace({url, config, data}, 'Executing PUT request');
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
   * @param {HttpRequestBuilder} [requestConfigBuilder] request
   * configuration builder that include params and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  deleteResource(url, requestConfigBuilder) {
    const config = this.getWriteRequestConfig(requestConfigBuilder);
    this.logger.trace({url, config}, 'Executing DELETE request');
    return this.axios.delete(url, config);
  }

  /**
   * Returns request configuration for GET requests from the
   * provided request configuration builder.
   *
   * @private
   * @param {HttpRequestBuilder} [requestConfigBuilder] request
   * configuration builder used to produce the request configuration
   * @return {Object<string, string>}
   */
  getReadRequestConfig(requestConfigBuilder) {
    return this.getRequestConfig(requestConfigBuilder, this.readTimeout);
  }

  /**
   * Returns request configuration for POST/PUT/DELETE requests from the
   * provided request configuration builder.
   *
   * @private
   * @param {HttpRequestBuilder} [requestConfigBuilder] request
   * configuration builder used to produce the request configuration
   * @return {Object<string, string>}
   */
  getWriteRequestConfig(requestConfigBuilder) {
    return this.getRequestConfig(requestConfigBuilder, this.writeTimeout);
  }

  /**
   * Returns request configuration suitable for from the provided request
   * configuration builder and default timeout.
   *
   * @private
   * @param {HttpRequestBuilder} [requestConfigBuilder] request
   * configuration builder used to produce the request configuration
   * @param {number} timeout default timeout if one is not specified in the
   * request config builder
   * @return {Object<string, string>}
   */
  getRequestConfig(requestConfigBuilder, timeout) {
    requestConfigBuilder = requestConfigBuilder ||
      new HttpRequestBuilder();

    this.addXRequestIdHeader(requestConfigBuilder);
    this.addDefaultTimeout(requestConfigBuilder, timeout);

    return requestConfigBuilder.get();
  }

  /**
   * Sets the required x-request-id header.
   *
   * @private
   * @param {Object} requestConfig
   */
  addXRequestIdHeader(requestConfig) {
    requestConfig.addHeader(REQUEST_ID_HEADER, uuidv4());
  }

  /**
   * Adds a default timeout if it is not explicitly specified in the
   * request configuration object.
   *
   * @private
   * @param {object} requestConfig request configuration object supplied to
   * the http client for specific request
   * @param {number} timeout the timeout to set in the request config
   */
  addDefaultTimeout(requestConfig, timeout) {
    if (!requestConfig.getTimeout()) {
      requestConfig.setTimeout(timeout);
    }
  }

  /**
   * Returns the base URL which this http client uses to send requests.
   *
   * @return {string} the base URL for each request
   */
  getBaseURL() {
    return this.axios.defaults.baseURL;
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
