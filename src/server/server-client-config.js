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
   * @param {string} endpoint Endpoint url.
   * @param {number} timeout Specifies the number of milliseconds before the
   *                         request times out.
   * @param {Map<string, string>} headers An http headers map.
   */
  constructor(endpoint, timeout, headers) {
    this.endpoint = endpoint;
    this.timeout = timeout;
    this.headers = headers;
  }
}

module.exports = ServerClientConfig;
