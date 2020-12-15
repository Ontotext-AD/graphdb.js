/**
 * Configuration wrapper used for initialization of {@link ServerClient}
 * instances.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 * @author Teodossi Dossev
 */
class ClientConfig {
  /**
   * @param {Map<string, string>} [headers] An http headers map.
   * @param {string} [username] username which should be authenticated
   * @param {string} [pass] the password to be used
   * @param {boolean} [keepAlive=true] if the logged in user should be
   * reauthenticated after auth token expire. This config has meaning when the
   * server is secured and username and passwords are provided.
   */
  constructor(headers, username, pass, keepAlive) {
    this.headers = headers;
    this.username = username;
    this.pass = pass;
    this.keepAlive = keepAlive !== undefined ? keepAlive : true;
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

  /**
   * @return {string} the username
   */
  getUsername() {
    return this.username;
  }

  /**
   * @param {string} username
   * @return {ServerClientConfig} the current config for method chaining
   */
  setUsername(username) {
    this.username = username;
    return this;
  }

  /**
   * @return {string} the user password
   */
  getPass() {
    return this.pass;
  }

  /**
   * @param {string} pass
   * @return {ServerClientConfig} the current config for method chaining
   */
  setPass(pass) {
    this.pass = pass;
    return this;
  }

  /**
   * @return {boolean} if the user should be re-logged in after token expires
   */
  getKeepAlive() {
    return this.keepAlive;
  }

  /**
   * @param {boolean} keepAlive
   * @return {ServerClientConfig} the current config for method chaining
   */
  setKeepAlive(keepAlive) {
    this.keepAlive = keepAlive;
    return this;
  }

  /**
   * @param {string} credentials in form of the combination of
   * username:password. The credentials will be encoded to base64
   * and set as authorization header to allow Basic Authentication.
   * @return {ServerClientConfig} the current config for method chaining
   */
  setBasicAuthentication(credentials) {
    this.headers['Authorization'] = `Basic ${btoa(credentials)}`;
    return this;
  }
}

module.exports = ClientConfig;
