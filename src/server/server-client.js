const HttpClient = require('../http/http-client');
const ConsoleLogger = require('../logging/console-logger');
const RDFRepositoryClient = require('../repository/rdf-repository-client');
const RepositoryClientConfig =
  require('../repository/repository-client-config');
const HttpRequestConfigBuilder = require('../http/http-request-config-builder');
const RDFMimeType = require('../http/rdf-mime-type');

const SERVICE_URL = '/repositories';

/**
 * Implementation of the RDF server operations.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class ServerClient {
  /**
   * @param {ServerClientConfig} config for the server client.
   **/
  constructor(config) {
    this.config = config;

    this.initHttpClient();
    this.initLogger();
  }

  /**
   * Get an array of repository ids available in the server.
   * @return {Promise} promise which resolves with an Array with repository ids.
   */
  getRepositoryIDs() {
    return this.httpClient.get(SERVICE_URL, new HttpRequestConfigBuilder()
      .addAcceptHeader(RDFMimeType.SPARQL_RESULTS_JSON)
      .get()
    ).then((response) => {
      return response.data.results.bindings.map(({id}) => id.value);
    });
  }

  /**
   * Check if repository with the provided id exists.
   * @param {string} id of the repository which should be checked.
   * @return {Promise<boolean>} promise which resolves with boolean value.
   */
  hasRepository(id) {
    if (!id) {
      return Promise.reject(new Error('Repository id is required parameter!'));
    }
    return this.getRepositoryIDs().then((repositoryIds) => {
      return repositoryIds.indexOf(id) !== -1;
    });
  }

  /**
   * Creates a repository client instance with the provided id and
   * configuration.
   * @param {string} id of the repository
   * @param {RepositoryClientConfig} config for the overridable repository
   *    configuration.
   * @return {Promise<RDFRepositoryClient>} promise which resolves with
   *    new RDFRepositoryClient instance.
   */
  getRepository(id, config) {
    if (!id) {
      return Promise.reject(new Error('Repository id is required parameter!'));
    }
    if (!config || !(config instanceof RepositoryClientConfig)) {
      return Promise
        .reject(new Error('RepositoryClientConfig is required parameter!'));
    }
    return this.hasRepository(id).then((exists) => {
      if (exists) {
        return new RDFRepositoryClient(config);
      }
      return Promise
        .reject(new Error(`Repository with id ${id} does not exists.`));
    });
  }

  /**
   * Delete repository with the provided id.
   * @param {string} id of the repository which should be deleted.
   * @return {Promise<any>} promise which resolves with the delete result.
   */
  deleteRepository(id) {
    if (!id) {
      return Promise.reject(new Error('Repository id is required parameter!'));
    }
    return this.httpClient.deleteResource(`${SERVICE_URL}/${id}`);
  }

  /**
   * Initializes the http client.
   */
  initHttpClient() {
    this.httpClient = new HttpClient(this.config.endpoint);
  }

  /**
   * Initializes the logger.
   */
  initLogger() {
    this.logger = new ConsoleLogger();
  }
}

module.exports = ServerClient;
