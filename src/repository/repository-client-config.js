/**
 * Configuration wrapper used for initialization of {@link BaseRepositoryClient}
 * implementations.
 * @class
 */
class RepositoryClientConfig {
  /**
   * @param {string[]} endpoints
   * @param {Map<string, string>} headers
   * @param {RDFContentType} defaultRDFContentType
   * @param {number} readTimeout
   * @param {number} writeTimeout
   * @param {number} retryInterval
   * @param {number} retryCount
   */
  constructor(endpoints, headers, defaultRDFContentType, readTimeout,
      writeTimeout, retryInterval, retryCount) {
    this.endpoints = endpoints;
    this.headers = headers;
    this.defaultRDFContentType = defaultRDFContentType;
    this.readTimeout = readTimeout;
    this.writeTimeout = writeTimeout;
    this.retryInterval = retryInterval;
    this.retryCount = retryCount;
  }
}

module.exports = RepositoryClientConfig;
