/**
 * Configuration wrapper used for initialization of {@link ServerClient}
 * instances.
 * @class
 */
export class ServerClientConfig {
  /**
   * @param {string} url Endpoint url.
   * @param {Map<string, string>} headers http headers map.
   */
  constructor(url, headers) {
    this.url = url;
    this.headers = headers;
  }
}
