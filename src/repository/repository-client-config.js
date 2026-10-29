const ClientConfig = require('../http/client-config');
const RDFMimeType = require('../http/rdf-mime-type');
const ObjectUtils = require('../util/object-utils');

const defaultTimeout = 10000;

/**
 * Matches URLs that start with a scheme or are protocol-relative.
 *
 * @type {RegExp}
 */
const ABSOLUTE_URL_PATTERN = /^([a-z][a-z\d+\-.]*:)?\/\//i;

/**
 * Configuration wrapper used for initialization of {@link BaseRepositoryClient}
 * implementations.
 *
 * @class
 * @extends ClientConfig
 * @author Mihail Radkov
 * @author Svilen Velikov
 * @author Teodossi Dossev
 */
class RepositoryClientConfig extends ClientConfig {
  /**
   * Repository client configuration constructor.
   * Initializes [endpoints]{@link RepositoryClientConfig#endpoints} and
   * sets configuration default values to
   * [defaultRDFMimeType]{@link RepositoryClientConfig#defaultRDFMimeType},
   * [readTimeout]{@link RepositoryClientConfig#readTimeout} and
   * [writeTimeout]{@link RepositoryClientConfig#writeTimeout}
   *
   * @param {string} endpoint server base URL that will be prepend
   * to all server requests
   */
  constructor(endpoint) {
    super(endpoint);
    this.setEndpoints([]);
    this.setHeaders({});
    this.setKeepAlive(true);
    this.setDefaultRDFMimeType(RDFMimeType.SPARQL_RESULTS_JSON);
    this.setReadTimeout(defaultTimeout);
    this.setWriteTimeout(defaultTimeout);
  }

  /**
   * Sets the repository endpoint URLs, absolute or relative to the server
   * base URL (see {@link RepositoryClientConfig#getEndpoints}).
   *
   * @param {string[]} endpoints the endpoint URLs
   *
   * @return {this} current config for method chaining
   */
  setEndpoints(endpoints) {
    this.endpoints = endpoints;
    return this;
  }

  /**
   * Inserts a repository endpoint URL to the rest of the endpoints. It may be
   * relative to the server base URL
   * (see {@link RepositoryClientConfig#getEndpoints}).
   *
   * @param {string} endpoint repository endpoint URL
   *
   * @return {this} current config for method chaining
   */
  addEndpoint(endpoint) {
    if (!this.endpoints) {
      this.endpoints = [];
    }
    this.endpoints.push(endpoint);
    return this;
  }

  /**
   * Gets the repository endpoint URLs. Relative endpoints are prefixed with
   * the server base [endpoint]{@link ClientConfig#getEndpoint}, while
   * absolute ones are returned unchanged.
   *
   * @return {string[]} the resolved endpoint URLs
   */
  getEndpoints() {
    return (this.endpoints || [])
      .map((endpoint) => this.resolveEndpoint(endpoint));
  }

  /**
   * Prepends the server base URL to the provided endpoint unless it is an
   * absolute URL.
   *
   * @private
   * @param {string} endpoint repository endpoint URL
   * @return {string} the resolved repository endpoint URL
   */
  resolveEndpoint(endpoint) {
    if (ABSOLUTE_URL_PATTERN.test(endpoint)) {
      return endpoint;
    }
    const baseUrl = this.getEndpoint();
    let baseUrlEnd = baseUrl.length;
    while (baseUrlEnd > 0 && baseUrl[baseUrlEnd - 1] === '/') {
      baseUrlEnd--;
    }
    return baseUrl.substring(0, baseUrlEnd) + '/' +
      endpoint.replace(/^\/+/, '');
  }

  /**
   * Sets the default RDF MIME type.
   *
   * @param {string} defaultRDFMimeType
   *
   * @return {this} current config for method chaining
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
   * @return {this} current config for method chaining
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
   * @return {this} current config for method chaining
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

  /**
   * Sets the location of the remote GraphDB instance.
   * <p>
   * This method updates the request headers with
   * the "x-graphdb-repository-location" header to specify the location of
   * the target GraphDB instance.
   * </p>
   *
   * @param {string} location - The location of the remote GraphDB instance.
   * @return {this} current config for method chaining
   */
  setLocation(location) {
    if (!ObjectUtils.isNullOrUndefined(location)) {
      this.headers['x-graphdb-repository-location'] = location;
    }
    return this;
  }
}

module.exports = RepositoryClientConfig;
