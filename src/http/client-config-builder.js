const RepositoryClientConfig = require(
  '../repository/repository-client-config');
const ServerClientConfig = require('../server/server-client-config');

/**
 * Holds request information applicable to {@link ClientConfig}.
 *
 * @class
 * @author Teodossi Dossev
 */
class ClientConfigBuilder {
  /**
   * Does default initialization of the configuration.
   */
  constructor() {
    this.config = {
      headers: {},
      keepAlive: true
    };
  }

  /**
   * Returns new builder for {@link RepositoryClientConfig}
   * for the provided GDB endpoint with default configurations
   *
   * @param {string} endpoint
   * @return {RepositoryClientConfig}
   */
  repositoryConfig(endpoint) {
    return this.buildRepositoryClientConfig(endpoint);
  }

  /**
   * Prepares new builder for {@link ServerClientConfig}
   * for the provided GDB endpoint with default configurations
   *
   * @param {string} endpoint  server base URL that will be prepend
   * to all server requests
   * @return {ServerClientConfig}
   */
  serverConfig(endpoint) {
    return this.buildServerClientConfig(endpoint);
  }

  /**
   * Prepares new builder for {@link RepositoryClientConfig}
   * for the provided GDB endpoint.
   * Initializes default values.
   *
   * @param {string} endpoint  server base URL that will be prepend
   * to all server requests
   * @return {RepositoryClientConfig}
   */
  buildRepositoryClientConfig(endpoint) {
    return new RepositoryClientConfig(endpoint)
      .setHeaders(this.config.headers)
      .setKeepAlive(this.config.keepAlive);
  }

  /**
   * Prepares new builder for {@link ServerClientConfig}
   * for the provided GDB endpoint.
   * Initializes default values.
   *
   * @param {string} endpoint  server base URL that will be prepend
   * to all server requests
   * @return {ServerClientConfig}
   */
  buildServerClientConfig(endpoint) {
    return new ServerClientConfig(endpoint)
      .setHeaders(this.config.headers)
      .setKeepAlive(this.config.keepAlive);
  }
}

module.exports = ClientConfigBuilder;
