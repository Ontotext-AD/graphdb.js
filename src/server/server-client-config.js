const ClientConfig = require('../http/client-config');

/**
 * Configuration wrapper used for initialization of {@link ServerClient}
 * instances.
 *
 * @class
 * @extends ClientConfig
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class ServerClientConfig extends ClientConfig {
  /**
   * @param {string} [endpoint] Endpoint url.
   * @param {number} [timeout] Specifies the number of milliseconds before the
   *                         request times out.
   * @param {Map<string, string>} [headers] An http headers map.
   * @param {string} [username] username which should be authenticated
   * @param {string} [pass] the password to be used
   * @param {boolean} [keepAlive=true] if the logged in user should be
   * reauthenticated after auth token expire. This config has meaning when the
   * server is secured and username and passwords are provided.
   */
  constructor(endpoint, timeout, headers, username, pass,
      keepAlive) {
    super(headers, username, pass, keepAlive);
    this.endpoint = endpoint;
    this.timeout = timeout;
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

module.exports = ServerClientConfig;
