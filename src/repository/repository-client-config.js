/**
 * Configuration wrapper used for initialization of {@link BaseRepositoryClient}
 * implementations.
 * @class
 */
class RepositoryClientConfig {
  /**
   * @param {string[]} endpoints
   * @param {Map<string, string>} headers
   * @param {RDFMimeType} defaultRDFMimeType
   * @param {number} readTimeout
   * @param {number} writeTimeout
   */
  constructor(endpoints, headers, defaultRDFMimeType, readTimeout,
      writeTimeout) {
    this.endpoints = endpoints;
    this.headers = headers;
    this.defaultRDFMimeType = defaultRDFMimeType;
    this.readTimeout = readTimeout;
    this.writeTimeout = writeTimeout;
  }
}

module.exports = RepositoryClientConfig;
