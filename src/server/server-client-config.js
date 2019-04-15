/**
 * Configuration wrapper used for initialization of {@link ServerClient}
 * instances.
 * @class
 */
export class ServerClientConfig {
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
