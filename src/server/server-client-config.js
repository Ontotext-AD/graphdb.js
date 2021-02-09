const ClientConfig = require('../http/client-config');

const defaultTimeout = 10000;

/**
 * Configuration wrapper used for initialization of {@link ServerClient}
 * instances.
 *
 * @class
 * @extends ClientConfig
 * @author Mihail Radkov
 * @author Svilen Velikov
 * @author Teodossi Dossev
 */
class ServerClientConfig extends ClientConfig {
  /**
   * Server client configuration constructor.
   * Sets configuration default value to
   * [timeout]{@link ServerClientConfig#timeout}
   *
   * @param {string} [endpoint] Endpoint url.
   */
  constructor(endpoint) {
    super(endpoint);
    this.setHeaders({});
    this.setKeepAlive(true);
    this.setTimeout(defaultTimeout);
  }

  /**
    * Sets the timeout for HTTP requests.
    *
    * @param {number} timeout the timeout in milliseconds before the
    * request times out.
    * @return {this} the concrete configuration config for method chaining
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
