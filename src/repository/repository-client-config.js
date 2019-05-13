/**
 * Configuration wrapper used for initialization of {@link BaseRepositoryClient}
 * implementations.
 * @class
 */
class RepositoryClientConfig {
  /**
   * @param {string[]} endpoints is an array with repository endpoints
   * @param {Object} headers is a key:value mapping of http headers and values
   * @param {string} defaultRDFMimeType one of {@link RDFMimeType} values
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
