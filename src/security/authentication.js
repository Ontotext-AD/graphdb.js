/**
 * An abstract class that specifies common methods for different types
 * of authentication. Concrete authentication types must extend
 * this class and override it's methods
 *
 * @abstract
 * @class
 * @author Teodossi Dossev
 */
export class Authentication {
  /**
   * Constructor.
   * @param {ClientConfig} clientConfig
   */
  constructor(clientConfig) {
    this.clientConfig = clientConfig;
  }
  /**
   * Returns authentication type related {@link HttpRequestBuilder}
   * login request builder
  */
  getLoginRequestBuilder() {
    throw new Error('Method #getLoginRequestBuilder() must be implemented!');
  }

  /**
   * Returns authentication type related {string}
   * token from response
   */
  getResponseAuthToken() {
    throw new Error('Method #getResponseAuthToken() must be implemented!');
  }
}

module.exports = Authentication;
