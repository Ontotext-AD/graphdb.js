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
   * @param {Map<string, string>} [headers] An http headers map.
   * @param {string} [username] username which should be authenticated
   * @param {string} [pass] the password to be used
   * @param {boolean} [keepAlive=true] if the logged in user should be
   * reauthenticated after auth token expire. This config has meaning when the
   * server is secured and username and passwords are provided.
   * @param {boolean} [useBasicAuth] if use Basic Auth when authenticating
   * @param {string} endpoint server base URL that will be prepend
   * to all server requests
   */
  constructor(headers, username, pass, keepAlive, useBasicAuth, endpoint) {
    this.headers = headers;
    this.endpoint = endpoint;
    this.username = username;
    this.pass = pass;
    this.keepAlive = keepAlive !== undefined ? keepAlive : true;
    this.setBasicAuthentication(useBasicAuth);
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
}

module.exports = ClientConfig;
