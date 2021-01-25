/**
 * Abstract configuration wrapper used for initialization of concrete
 * Client instances. Concrete client configuration wrappers must extend
 * this class and override it's methods if necessary.
 *
 * @abstract
 * @author Mihail Radkov
 * @author Svilen Velikov
 * @author Teodossi Dossev
 */
class ClientConfig {
  /**
   * Client configuration constructor.
   * Initializes [headers]{@link ClientConfig#headers} and
   * sets configuration default values to
   * [keepAlive]{@link ClientConfig#keepAlive} and
   * [basicAuth]{@link ClientConfig#basicAuth}
   *
   * @param {string} endpoint server base URL that will be prepend
   * to all server requests
   */
  constructor(endpoint) {
    this.setEndpoint(endpoint);
  }

  /**
   * Sets the default headers map for each HTTP request.
   *
   * @param {Object<string, string>} headers the default headers
   * @return {this} the concrete configuration config for method chaining
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
   * @return {string} the username
   */
  getUsername() {
    return this.username;
  }

  /**
   * @param {string} username
   * @return {this} the concrete configuration config for method chaining
   */
  setUsername(username) {
    this.username = username;
    this.useBasicAuthentication();
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
   * @return {this} the concrete configuration config for method chaining
   */
  setPass(pass) {
    this.pass = pass;
    this.useBasicAuthentication();
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
   * @return {this} the concrete configuration config for method chaining
   */
  setKeepAlive(keepAlive) {
    this.keepAlive = keepAlive;
    return this;
  }

  /**
   * @return {boolean} [basicAuth] if use Basic Auth
   */
  getBasicAuthentication() {
    return this.basicAuth;
  }

  /**
   * @param {boolean} [basicAuth] if use Basic Auth when authenticating
   * @return {this} the concrete configuration config for method chaining
   */
  setBasicAuthentication(basicAuth) {
    this.basicAuth = basicAuth;
    this.useBasicAuthentication();
    return this;
  }

  /**
   * @private
   */
  useBasicAuthentication() {
    if (this.basicAuth) {
      const credentials = `${this.username}:${this.pass}`;
      this.headers['Authorization'] = `Basic ${btoa(credentials)}`;
    }
  }

  /**
   * Sets the server's endpoint URL.
   *
   * @param {string} endpoint the endpoint URL
   *
   * @return {this} the current config for method chaining
   */
  setEndpoint(endpoint) {
    if (endpoint &&
      (typeof endpoint === 'string' || endpoint instanceof String)) {
      this.endpoint = endpoint;
      return this;
    } else {
      throw new Error('Invalid Endpoint parameter!');
    }
  }

  /**
   * Returns the server's endpoint URL.
   *
   * @return {string} the endpoint URL
   */
  getEndpoint() {
    return this.endpoint;
  }
}

module.exports = ClientConfig;
