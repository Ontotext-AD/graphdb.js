/**
 * Configuration wrapper used for initialization of {@link ServerClient}
 * instances.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class ServerClientConfig {
  /**
   * @param {string} [endpoint] Endpoint url.
   * @param {number} [timeout] Specifies the number of milliseconds before the
   *                         request times out.
   * @param {Map<string, string>} [headers] An http headers map.
   */
  constructor(endpoint, timeout, headers) {
    this.endpoint = endpoint;
    this.timeout = timeout;
    this.headers = headers;
  }

  /**
   * Sets the server's endpoint URL.
   *
   * @param {string} endpoint the endpoint URL
   *
   * @return {ServerClientConfig} the current config for method chaining
   */
  setEndpoint(endpoint) {
    this.endpoint = endpoint;
    return this;
  }

  /**
   * Returns the server's endpoint URL.
   *
   * @return {string} the endpoint URL
   */
  getEndpoint() {
    return this.endpoint;
  }

  /**
   * Sets the default headers map for each HTTP request.
   *
   * @param {Object<string, string>} headers the default headers
   *
   * @return {ServerClientConfig} the current config for method chaining
   */
  setHeaders(headers) {
    this.headers = headers;
    return this;
  }

  /**
   * Returns the default headers for each HTTP request.
   *
   * @return {Object<string, string>} the default headers map
   */
  getHeaders() {
    return this.headers;
  }

  /**
   * Sets the timeout for HTTP requests.
   *
   * @param {number} timeout the timeout in milliseconds
   *
   * @return {ServerClientConfig} the current config for method chaining
   */
  setTimeout(timeout) {
    this.timeout = timeout;
    return this;
  }

  /**
   * Returns the HTTP requests's timeout.
   *
   * @return {number} the timeout in milliseconds
   */
  getTimeout() {
    return this.timeout;
  }
}

module.exports = ServerClientConfig;
