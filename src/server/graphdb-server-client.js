const ServerClient = require('./server-client');
const LoggingUtils = require('../logging/logging-utils');
const MediaType = require('../http/media-type');
const HttpRequestBuilder = require('../http/http-request-builder');

const REPOSITORY_SERVICE_URL = '/rest/repositories';
const SECURITY_SERVICE_URL = '/rest/security';

/**
 * Implementation of the graphDB server operations.
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
class GraphDBServerClient extends ServerClient {
  /**
   * @param {ServerClientConfig} config for the server client.
   **/
  constructor(config) {
    super(config);
  }

  /**
   * Get the default repository configuration for the repository type
   *
   * @param {RepositoryType|String} repositoryType the type for which a
   * default configuration is required
   * @return {Promise<HttpResponse|Error>} a promise which resolves to response
   * wrapper or rejects with error if thrown during execution.
   */
  getDefaultConfig(repositoryType) {
    if (!repositoryType) {
      throw new Error('Repository type is required parameter!');
    }

    const requestBuilder = HttpRequestBuilder
      .httpGet(
        `${REPOSITORY_SERVICE_URL}/defaultConfig/${repositoryType}`)
      .addAcceptHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder);
  }

  /**
   * Get the repository configuration
   *
   * @param {string} repositoryId the repository id
   * @param {string} [location] optional repository location
   * @return {Promise<HttpResponse|string|Error>} a promise which resolves
   * to response wrapper or rejects with error if thrown during execution.
   */
  getRepositoryConfig(repositoryId, location) {
    if (!repositoryId) {
      throw new Error('Repository id is required parameter!');
    }

    const repositoryLocation = location ? `?location=${location}` : '';
    const requestBuilder = HttpRequestBuilder
      .httpGet(
        `${REPOSITORY_SERVICE_URL}/${repositoryId}${repositoryLocation}`)
      .addContentTypeHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder);
  }

  /**
   * Download the repository configuration in turtle format
   * @param {string} repositoryId the repository id
   * @param {string} [location] optional repository location
   * @return {Promise<string | any>} a service request that will resolve to a
   * readable stream to which the client can subscribe and consume the emitted
   * strings as soon as they are available. Resolves to turtle format.
   */
  downloadRepositoryConfig(repositoryId, location) {
    const requestBuilder = HttpRequestBuilder
      .httpGet(`${REPOSITORY_SERVICE_URL}/${repositoryId}/download`)
      .addContentTypeHeader(MediaType.TEXT_TURTLE)
      .setResponseType('stream');
    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(LoggingUtils.getLogPayload(response,
        requestBuilder.getParams()), 'Downloaded data');
      return response.getData();
    });
  }

  /**
   * Create repository according to the provided configuration
   * @param {RepositoryConfig} repositoryConfig
   * @return {Promise<HttpResponse|Error>} a promise which resolves
   * to response wrapper or rejects with error if thrown during execution.
   */
  createRepository(repositoryConfig) {
    const requestBuilder = HttpRequestBuilder
      .httpPut(`${REPOSITORY_SERVICE_URL}/${repositoryConfig.id}`)
      .setData(this.getObjectToString(repositoryConfig))
      .addContentTypeHeader(MediaType.APPLICATION_JSON)
      .addAcceptHeader(MediaType.TEXT_PLAIN);
    return this.execute(requestBuilder);
  }

  /**
   * Delete repository with the provided id.
   * @override
   * @param {string} id of the repository which should be deleted.
   * @return {Promise<any>} promise which resolves with the delete result.
   */
  deleteRepository(id) {
    if (!id) {
      throw new Error('Repository id is required parameter!');
    }
    const requestBuilder =
      HttpRequestBuilder.httpDelete(`${REPOSITORY_SERVICE_URL}/${id}`);
    return this.execute(requestBuilder).then((response) => {
      this.logger.info(LoggingUtils.getLogPayload(response, {repoId: id}),
        'Deleted repository');
    });
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
        .httpPost(`${SECURITY_SERVICE_URL}/freeaccess`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .addAcceptHeader(MediaType.TEXT_PLAIN)
        .setData({
          appSettings: this.getObjectToString(appSettings),
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
        .httpGet(`${SECURITY_SERVICE_URL}/freeaccess`)
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
        .httpPost(`${SECURITY_SERVICE_URL}/user/${username}`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .addAcceptHeader(MediaType.TEXT_PLAIN)
        .setData({
          username,
          password,
          grantedAuthorities,
          appSettings: this.getObjectToString(appSettings)
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
        .httpPut(`${SECURITY_SERVICE_URL}/user/${username}`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .addAcceptHeader(MediaType.TEXT_PLAIN)
        .setData({
          username,
          password,
          grantedAuthorities,
          appSettings: this.getObjectToString(appSettings)
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
        .httpPatch(`${SECURITY_SERVICE_URL}/user/${username}`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .addAcceptHeader(MediaType.TEXT_PLAIN)
        .setData({
          username,
          password,
          appSettings: this.getObjectToString(appSettings)
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
        .httpGet(`${SECURITY_SERVICE_URL}/user/${username}`)
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
        .httpDelete(`${SECURITY_SERVICE_URL}/user/${username}`)
        .addAcceptHeader(MediaType.TEXT_PLAIN);
    return this.execute(requestBuilder);
  }

  /**
   * @private
   * @param {Object} object to get text from
   * @return {string | {}} text representation of object
   * or empty object if undefined
   */
  getObjectToString(object) {
    return object && object.toString() || {};
  }
}

module.exports = GraphDBServerClient;
