const LoggingUtils = require('../logging/logging-utils');
const MediaType = require('../http/media-type');
const HttpRequestBuilder = require('../http/http-request-builder');
const ObjectUtils = require('../util/object-utils');
const Server = require('./server');
const RepositoryClientConfig =
    require('../repository/repository-client-config');
const RDFRepositoryClient = require('../repository/rdf-repository-client');

// Imports used by TypeScript type generation
const ServerClientConfig = require('./server-client-config');
const RepositoryConfig = require('../repository/repository-config');
const RepositoryType = require('../repository/repository-type');
const HttpResponse = require('../http/http-response');
const AppSettings = require('./app-settings');

const REPOSITORY_SERVICE_URL = '/rest/repositories';
const SECURITY_SERVICE_URL = '/rest/security';

/**
 * Extends the {@link Server} with GraphDB API provided by GraphDB.
 *
 *  Used to automate the security user management API:
 *  add, edit, or remove users.  Also used to add, edit,
 *  or remove a repository to/from any attached location.
 *  You can work with multiple remote locations from a
 *  single access point.
 *
 *  @class
 *  @author Teodossi Dossev
 *
 */
class GraphDBServerClient extends Server {
  /**
  * Retrieves the list of repository IDs from the specified location.
  *
  * @param {string} [location] - Optional repository location. If provided,
  *                              the request will be executed for
  *                              the specified location.
  * @return {Promise<string[]>} A promise that resolves to an array
  *                             of repository IDs.
  */
  getRepositoryIDs(location) {
    const locationParameter = this.getLocationParameter(location);
    const url = `${REPOSITORY_SERVICE_URL}${locationParameter}`;
    const requestBuilder = HttpRequestBuilder
      .httpGet(url)
      .addAcceptHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder).then((response) => {
      return response.getData().map((repository) => repository.id);
    });
  }

  /**
   * Checks if a repository with the provided ID exists.
   *
   * @param {string} id The ID of the repository to check.
   * @param {string} [location] The location of the repository (optional).
   *
   * @return {Promise<boolean>} A promise that resolves with a boolean value
   *                            indicating whether the repository exists.
   */
  hasRepository(id, location) {
    if (!id) {
      throw new Error('Repository id is required parameter!');
    }
    return this.getRepositoryIDs(location).then((repositories) => {
      return repositories.indexOf(id) !== -1;
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
   * Deletes the repository with the provided ID.
   *
   * @param {string} id The ID of the repository to delete.
   * @param {string} [location] The location of the repository (optional).
   *
   * @return {Promise<any>} A promise that resolves with the result of
   *                        the delete operation.
   */
  deleteRepository(id, location) {
    if (!id) {
      throw new Error('Repository id is required parameter!');
    }
    const loc = this.getLocationParameter(location);
    const requestBuilder =
        HttpRequestBuilder.httpDelete(`${REPOSITORY_SERVICE_URL}/${id}${loc}`);
    return this.execute(requestBuilder).then((response) => {
      this.logger.info(LoggingUtils.getLogPayload(response, {repoId: id}),
        'Deleted repository');
    });
  }

  /**
   * Get the default repository configuration for the repository type
   *
   * @param {RepositoryType|String} repositoryType the type for which a
   * default configuration is required
   *
   * @return {Promise<HttpResponse|Error>} a promise which resolves to response
   * wrapper or rejects with error if thrown during execution.
   */
  getDefaultConfig(repositoryType) {
    if (!repositoryType) {
      throw new Error('Repository type is required parameter!');
    }

    const requestBuilder = HttpRequestBuilder
      .httpGet(
        `${REPOSITORY_SERVICE_URL}/default-config/${repositoryType}`)
      .addAcceptHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder);
  }

  /**
   * Retrieves the configuration of a repository.
   *
   * @param {string} repositoryId The ID of the repository whose configuration
   *                              is to be retrieved.
   * @param {string} [location] The optional location of the repository.
   *
   * @return {Promise<HttpResponse|string|Error>} A promise that resolves to
   *         the response wrapper, or rejects with an error if one occurs
   *         during the execution.
   */
  getRepositoryConfig(repositoryId, location) {
    if (!repositoryId) {
      throw new Error('Repository id is required parameter!');
    }

    const loc = this.getLocationParameter(location);
    const requestBuilder = HttpRequestBuilder
      .httpGet(`${REPOSITORY_SERVICE_URL}/${repositoryId}${loc}`)
      .addContentTypeHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder);
  }

  /**
   * Download the repository configuration in turtle format
   *
   * @param {string} repositoryId the repository id
   * @param {string} [location] optional repository location
   *
   * @return {Promise<string | any>} a service request that will resolve to a
   * readable stream to which the client can subscribe and consume the emitted
   * strings as soon as they are available. Resolves to turtle format.
   */
  downloadRepositoryConfig(repositoryId, location) {
    const loc = this.getLocationParameter(location);
    const requestBuilder = HttpRequestBuilder
      .httpGet(`${REPOSITORY_SERVICE_URL}/${repositoryId}/download-ttl${loc}`)
      .addContentTypeHeader(MediaType.TEXT_TURTLE)
      .setResponseType('stream');
    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(LoggingUtils.getLogPayload(response,
        requestBuilder.getParams()), 'Downloaded data');
      return response.getData();
    });
  }

  /**
   * Creates a repository based on the provided configuration.
   *
   * @param {RepositoryConfig} repositoryConfig The configuration of
   *                                    the repository to be created.
   *
   * @return {Promise<HttpResponse|Error>} A promise that resolves to
   *         the response wrapper, or rejects with an error if one occurs
   *         during execution.
   */
  createRepository(repositoryConfig) {
    const location = this.getLocationParameter(repositoryConfig.location);
    const requestBuilder = HttpRequestBuilder
      .httpPut(`${REPOSITORY_SERVICE_URL}/${repositoryConfig.id}${location}`)
      .setData(this.objectToJson(repositoryConfig))
      .addContentTypeHeader(MediaType.APPLICATION_JSON)
      .addAcceptHeader(MediaType.TEXT_PLAIN);
    return this.execute(requestBuilder);
  }

  /**
   * Checks if GraphDB security is enabled.
   * @return {Promise<HttpResponse|Error>} a promise which resolves
   * to response wrapper or rejects with error if thrown during execution.
   */
  isSecurityEnabled() {
    const requestBuilder =
      HttpRequestBuilder.httpGet(SECURITY_SERVICE_URL)
        .addAcceptHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder);
  }

  /**
   * Enable or disable GraphDB security.
   * @param {boolean} enabled <code>true</code> if security is enabled and
   * <code>false</code> otherwise.
   * @return {Promise<HttpResponse|Error>} a promise which resolves
   * to response wrapper or rejects with error if thrown during execution.
   */
  toggleSecurity(enabled) {
    const requestBuilder =
      HttpRequestBuilder
        .httpPost(`${SECURITY_SERVICE_URL}?useSecurity=${enabled}`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .setData(`${enabled}`);
    return this.execute(requestBuilder);
  }

  /**
   * Enable or disable access to a predefined set of functionalities
   * without having to log in.
   * To use free access, you must have security enabled.
   * Use with extreme caution, as the changes that are made to the
   * application settings may possibly change the behavior of the
   * GraphDB Workbench for the logged-in user or for all users
   * if logged in as admin.
   * @param {boolean} enabled <code>true</code> if free access is enabled and
   * <code>false</code> otherwise.
   * @param {string[]} authorities Array of read and/or write access rights
   * described in the following template:
   * <code>READ_REPO_{repository ID}</code> to grant repository read rights
   * <code>WRITE_REPO_{repository ID}</code> to grant repository write rights
   * @param {AppSettings} appSettings configure the default behavior
   * of the GraphDB Workbench
   * @return {Promise<HttpResponse|Error>} a promise which resolves
   * to response wrapper or rejects with error if thrown during execution.
   */
  updateFreeAccess(enabled, authorities, appSettings) {
    const requestBuilder =
      HttpRequestBuilder
        .httpPost(`${SECURITY_SERVICE_URL}/free-access`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .addAcceptHeader(MediaType.TEXT_PLAIN)
        .setData({
          appSettings: this.objectToJson(appSettings),
          authorities,
          enabled
        });
    return this.execute(requestBuilder);
  }

  /**
   * Check if free access is enabled
   * @return {Promise<HttpResponse|Error>} a promise which resolves
   * to response wrapper or rejects with error if thrown during execution.
   */
  getFreeAccess() {
    const requestBuilder =
      HttpRequestBuilder
        .httpGet(`${SECURITY_SERVICE_URL}/free-access`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder);
  }

  /**
   * Create a user
   * @param {string} username User name
   * @param {string} password User password
   * @param {string[]} [grantedAuthorities] Array of read and/or write access
   * rights described in the following template:
   * <code>READ_REPO_{repository ID}</code> to grant repository read rights
   * <code>WRITE_REPO_{repository ID}</code> to grant repository write rights
   * @param {AppSettings} [appSettings] configure the default behavior
   * of the GraphDB Workbench
   * @return {Promise<HttpResponse|Error>} a promise which resolves
   * to response wrapper or rejects with error if thrown during execution.
   */
  createUser(username, password, grantedAuthorities, appSettings) {
    const requestBuilder =
      HttpRequestBuilder
        .httpPost(`${SECURITY_SERVICE_URL}/users/${username}`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .addAcceptHeader(MediaType.TEXT_PLAIN)
        .setData({
          username,
          password,
          grantedAuthorities,
          appSettings: this.objectToJson(appSettings)
        });
    return this.execute(requestBuilder);
  }

  /**
   * Edit user.
   * Use with extreme caution, as the changes that are made to the
   * application settings may possibly change the behavior of the
   * GraphDB Workbench for the user.
   * @param {string} username User name
   * @param {string} [password] User password
   * @param {string[]} [grantedAuthorities] Array of read and/or write access
   * rights described in the following template:
   * <code>READ_REPO_{repository ID}</code> to grant repository read rights
   * <code>WRITE_REPO_{repository ID}</code> to grant repository write rights
   * @param {AppSettings} [appSettings] configure the default behavior
   * of the GraphDB Workbench
   * @return {Promise<HttpResponse|Error>} a promise which resolves
   * to response wrapper or rejects with error if thrown during execution.
   */
  updateUser(username, password, grantedAuthorities, appSettings) {
    const requestBuilder =
      HttpRequestBuilder
        .httpPut(`${SECURITY_SERVICE_URL}/users/${username}`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .addAcceptHeader(MediaType.TEXT_PLAIN)
        .setData({
          username,
          password,
          grantedAuthorities,
          appSettings: this.objectToJson(appSettings)
        });
    return this.execute(requestBuilder);
  }

  /**
   * Change setting for a logged user.
   * Use with extreme caution, as the changes that are made to the
   * application settings may possibly change the behavior of the
   * GraphDB Workbench for the user.
   * @param {string} username User name
   * @param {string} [password] User password
   * @param {AppSettings} [appSettings] configure the default behavior
   * of the GraphDB Workbench
   * @return {Promise<HttpResponse|Error>} a promise which resolves
   * to response wrapper or rejects with error if thrown during execution.
   */
  updateUserData(username, password, appSettings) {
    const requestBuilder =
      HttpRequestBuilder
        .httpPatch(`${SECURITY_SERVICE_URL}/users/${username}`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .addAcceptHeader(MediaType.TEXT_PLAIN)
        .setData({
          username,
          password,
          appSettings: this.objectToJson(appSettings)
        });
    return this.execute(requestBuilder);
  }

  /**
   * Get a user
   * @param {string} username User name
   * @return {Promise<HttpResponse|Error>} a promise which resolves
   * to response wrapper or rejects with error if thrown during execution.
   */
  getUser(username) {
    const requestBuilder =
      HttpRequestBuilder
        .httpGet(`${SECURITY_SERVICE_URL}/users/${username}`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder);
  }

  /**
   * Deletes a user
   * @param {string} username User name
   * @return {Promise<HttpResponse|Error>} a promise which resolves
   * to response wrapper or rejects with error if thrown during execution.
   */
  deleteUser(username) {
    const requestBuilder =
      HttpRequestBuilder
        .httpDelete(`${SECURITY_SERVICE_URL}/users/${username}`)
        .addAcceptHeader(MediaType.TEXT_PLAIN);
    return this.execute(requestBuilder);
  }

  /**
   * @private
   * @param {Object} object to get json from
   * @return {string | {}} json representation of object
   * or empty object if undefined
   */
  objectToJson(object) {
    if (object && typeof object.toJson === 'function' ) {
      return object.toJson();
    }
    return {};
  }

  /**
   * Returns the query parameter for the repository location if it's provided,
   * otherwise returns an empty string.
   *
   * @private
   *
   * @param {string} [location] The location of the repository.
   *
   * @return {string} The query string representing the location parameter,
   *         or an empty string if the location is null or undefined.
   */
  getLocationParameter(location) {
    return ObjectUtils.isNullOrUndefined(location) ?
      '' : `?location=${location}`;
  }
}

module.exports = GraphDBServerClient;
