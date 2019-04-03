import BaseRepositoryConfig from './base-repository-config';

/**
 * Class for repository endpoint configuration.
 * @class RepositoryEndpointConfig
 * @extends BaseRepositoryConfig
 */
class RepositoryEndpointConfig extends BaseRepositoryConfig {
  /**
   * Constructor for repository endpoint configuration class.
   * @param { number } retryInterval
   * @param { number } readTimeout
   * @param { number } writeTimeout
   * @param { object } headers
   * @param { string } url
   */
  constructor(retryInterval, readTimeout, writeTimeout, headers, url) {
    super(retryInterval, readTimeout, writeTimeout, headers);
    this.url = url;
  }
}

export default RepositoryEndpointConfig;
