const ClientConfig = require('../http/client-config');

/**
 * Configuration wrapper used for initialization of {@link BaseRepositoryClient}
 * implementations.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class RepositoryClientConfig extends ClientConfig {
  /**
   * @param {string[]} [endpoints] is an array with repository endpoints
   * @param {Object} [headers] is a key:value mapping of http headers and values
   * @param {string} [defaultRDFMimeType] one of {@link RDFMimeType} values
   * @param {number} [readTimeout]
   * @param {number} [writeTimeout]
   * @param {string} [username] username which should be authenticated
   * @param {string} [pass] the password to be used
   * @param {boolean} [keepAlive] if the logged in user should be
   * reauthenticated after auth token expire. This config has meaning when the
   * server is secured and username and passwords are provided.
   */
  constructor(endpoints, headers, defaultRDFMimeType, readTimeout,
      writeTimeout, username, pass, keepAlive) {
    super(headers, username, pass, keepAlive);
    this.endpoints = endpoints;
    this.defaultRDFMimeType = defaultRDFMimeType;
    this.readTimeout = readTimeout;
    this.writeTimeout = writeTimeout;
  }

  /**
   * Sets the repository endpoint URLs.
   *
   * @param {string[]} endpoints the endpoint URLs
   *
   * @return {RepositoryClientConfig} current config for method chaining
   */
  setEndpoints(endpoints) {
    this.endpoints = endpoints;
    return this;
  }

  /**
   * Inserts a repository endpoint URL to the rest of the endpoints.
   *
   * @param {string} endpoint repository endpoint URL
   *
   * @return {RepositoryClientConfig} current config for method chaining
   */
  addEndpoint(endpoint) {
    if (!this.endpoints) {
      this.endpoints = [];
    }
    this.endpoints.push(endpoint);
    return this;
  }

  /**
   * Gets the repository endpoint URLs.
   *
   * @return {string[]}
   */
  getEndpoints() {
    return this.endpoints;
  }

  /**
   * Sets the default RDF MIME type.
   *
   * @param {string} defaultRDFMimeType
   *
   * @return {RepositoryClientConfig} current config for method chaining
   */
  setDefaultRDFMimeType(defaultRDFMimeType) {
    this.defaultRDFMimeType = defaultRDFMimeType;
    return this;
  }

  /**
   * Returns the default RDF MIME type.
   *
   * @return {string}
   */
  getDefaultRDFMimeType() {
    return this.defaultRDFMimeType;
  }

  /**
   * Sets the default read timeout for HTTP requests.
   *
   * @param {number} readTimeout the timeout in milliseconds
   *
   * @return {RepositoryClientConfig} current config for method chaining
   */
  setReadTimeout(readTimeout) {
    this.readTimeout = readTimeout;
    return this;
  }

  /**
   * Returns the default read timeout for HTTP requests.
   *
   * @return {number}
   */
  getReadTimeout() {
    return this.readTimeout;
  }

  /**
   * Sets the default write timeout for HTTP requests.
   *
   * @param {number} writeTimeout the timeout in milliseconds
   *
   * @return {RepositoryClientConfig} current config for method chaining
   */
  setWriteTimeout(writeTimeout) {
    this.writeTimeout = writeTimeout;
    return this;
  }

  /**
   * Returns the default write timeout for HTTP requests.
   *
   * @return {number}
   */
  getWriteTimeout() {
    return this.writeTimeout;
  }
}

module.exports = RepositoryClientConfig;
