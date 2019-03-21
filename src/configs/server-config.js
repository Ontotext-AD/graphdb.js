/**
 * Class for server configuration
 * @class ServerConfig
 */
class ServerConfig {
  /**
   * Constructor for Server Config class
   * @param { String } url
   * @param { Object} repositoryConfig
   */
  constructor(url, repositoryConfig) {
    this.url = url;
    this.defaultRepositoryConfig = repositoryConfig;
  }
}

export default ServerConfig;
