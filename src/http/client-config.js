const BASIC_AUTH = 'BASIC';
const GDB_TOKEN = 'GDB_TOKEN';
const OFF = 'OFF';

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
   * @return {string} the user password
   */
  getPass() {
    return this.pass;
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
   * Username and password for user logging setter.
   * Sets basic authentication as client authentication type.
   *
   * @param {string} [username]
   * @param {string} [pass]
   *
   * @return {this} the concrete configuration config for method chaining
   */
  useBasicAuthentication(username, pass) {
    this.username = username;
    this.pass = pass;
    this.switchAuthentication(BASIC_AUTH);
    return this;
  }


  /**
   * @return {boolean} [basicAuth] if use Basic Auth
   */
  getBasicAuthentication() {
    return this.basicAuth;
  }

  /**
   * @private
   * @param {string} auth authentication type
   */
  switchAuthentication(auth) {
    this.basicAuth = auth === BASIC_AUTH;
    this.gdbTokenAuth = auth === GDB_TOKEN;
  }

  /**
   * @return {boolean} [gdbTokenAuth] if use Gdb Token Auth
   */
  getGdbTokenAuthentication() {
    return this.gdbTokenAuth;
  }

  /**
   * Username and password for user logging setter.
   * Sets gdb token authentication as client authentication type.
   * *
   * @param {string} [username]
   * @param {string} [pass]
   *
   * @return {this} the concrete configuration config for method chaining
   */
  useGdbTokenAuthentication(username, pass) {
    this.username = username;
    this.pass = pass;
    this.switchAuthentication(GDB_TOKEN);
    return this;
  }

  /**
   * Disables authentication.
   */
  disableAuthentication() {
    this.switchAuthentication(OFF);
  }

  /**
   * Sets the server's endpoint URL.
   *
   * @param {string} endpoint the endpoint URL
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
   * @return {string} the endpoint URL
   */
  getEndpoint() {
    return this.endpoint;
  }

  /**
   * Returns <code>true</code> if basic or gdb token authentication
   * is enabled. <code>false</code> otherwise.
   *
   * @return {boolean} is authentication enabled
   */
  shouldAuthenticate() {
    return this.basicAuth || this.gdbTokenAuth;
  }
}

module.exports = ClientConfig;
