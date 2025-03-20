const LoggingUtils = require('../logging/logging-utils');
const RDFRepositoryClient = require('../repository/rdf-repository-client');
const RepositoryClientConfig =
    require('../repository/repository-client-config');
const HttpRequestBuilder = require('../http/http-request-builder');
const RDFMimeType = require('../http/rdf-mime-type');
const Server = require('./server');

const SERVICE_URL = '/repositories';

/**
 * Extends the {@link Server} with RDF4J API provided by GraphDB.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class ServerClient extends Server {
  /**
   * Get an array of repository ids available in the server.
   *
   * @return {Promise<Array>} promise which resolves with an Array with
   * repository ids.
   */
  getRepositoryIDs() {
    const requestBuilder = HttpRequestBuilder.httpGet(SERVICE_URL)
      .addAcceptHeader(RDFMimeType.SPARQL_RESULTS_JSON);
    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(LoggingUtils.getLogPayload(response, {}),
        'Fetched repositories');
      return response.getData().results.bindings.map(({id}) => id.value);
    });
  }

  /**
   * Check if repository with the provided id exists.
   * @param {string} id of the repository which should be checked.
   * @return {Promise<boolean>} promise which resolves with boolean value.
   */
  hasRepository(id) {
    if (!id) {
      throw new Error('Repository id is required parameter!');
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
      throw new Error('Repository id is required parameter!');
    }
    if (!config || !(config instanceof RepositoryClientConfig)) {
      throw new Error('RepositoryClientConfig is required parameter!');
    }
    return this.hasRepository(id).then((exists) => {
      if (exists) {
        return new RDFRepositoryClient(config);
      }
      this.logger.error({repoId: id}, 'Repository does not exist');
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
      throw new Error('Repository id is required parameter!');
    }
    const requestBuilder =
      HttpRequestBuilder.httpDelete(`${SERVICE_URL}/${id}`);
    return this.execute(requestBuilder).then((response) => {
      this.logger.info(LoggingUtils.getLogPayload(response, {repoId: id}),
        'Deleted repository');
    });
  }
}

module.exports = ServerClient;
