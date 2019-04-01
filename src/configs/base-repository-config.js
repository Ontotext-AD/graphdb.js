/**
 * Class for base repository configuration.
 * @class BaseRepositoryConfig
 */
class BaseRepositoryConfig {
  /**
   * Constructor for base repository configuration class.
   * @param { number } retryInterval
   * @param { number } readTimeout
   * @param { number } writeTimeout
   * @param { object } headers
   */
  constructor(retryInterval, readTimeout, writeTimeout, headers) {
    this.retryInterval = retryInterval;
    this.readTimeout = readTimeout;
    this.writeTimeout = writeTimeout;
    this.headers = headers;
  }
}

export default BaseRepositoryConfig;
