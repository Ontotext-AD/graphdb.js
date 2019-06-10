const axios = require('axios');
const uuidv4 = require('uuid/v4');
const qs = require('qs');
const ConsoleLogger = require('../logging/console-logger');

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
   * Performs HTTP request using the supplied request builder.
   *
   * @param {HttpRequestBuilder} requestBuilder
   * @return {Promise<any>} a promise resolving to the request's response
   */
  request(requestBuilder) {
    const config = this.getRequestConfig(requestBuilder);
    this.logger.trace({config}, 'Executing request');
    return this.axios.request(config);
  }

  /**
   * Returns request configuration suitable for from the provided request
   * builder.
   *
   * It generates correlation identifier under the <code>x-request-id</code>
   * header and sets default timeout if it was not provided in the builder.
   *
   * @private
   * @param {HttpRequestBuilder} requestBuilder request builder
   * configuration builder used to produce the request configuration
   * request config builder
   * @return {Object<string, string>}
   */
  getRequestConfig(requestBuilder) {
    this.addXRequestIdHeader(requestBuilder);
    this.addDefaultTimeout(requestBuilder);
    return requestBuilder.get();
  }

  /**
   * Sets the required x-request-id header.
   *
   * @private
   * @param {HttpRequestBuilder} requestBuilder
   */
  addXRequestIdHeader(requestBuilder) {
    requestBuilder.addHeader(REQUEST_ID_HEADER, uuidv4());
  }

  /**
   * Adds a default timeout if it is not explicitly specified in the
   * request builder.
   *
   * @private
   * @param {HttpRequestBuilder} requestBuilder request object supplied to
   * the http client for specific request
   */
  addDefaultTimeout(requestBuilder) {
    if (!requestBuilder.getTimeout()) {
      if (requestBuilder.getMethod() === 'get') {
        requestBuilder.setTimeout(this.readTimeout);
      } else {
        requestBuilder.setTimeout(this.writeTimeout);
      }
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
