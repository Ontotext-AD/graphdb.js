const LoggingUtils = require('../logging/logging-utils');
const MediaType = require('../http/media-type');
const HttpRequestBuilder = require('../http/http-request-builder');
const ObjectUtils = require('../util/object-utils');
const Server = require('./server');
const RepositoryClientConfig =
    require('../repository/repository-client-config');
const RDFRepositoryClient = require('../repository/rdf-repository-client');

// Imports used by TypeScript type generation
const RepositoryConfig = require('../repository/repository-config');
const RepositoryListResponse = require('../model/repository-list-response');
const UserResponse = require('../model/user-response');
const AuthSettingsResponse = require('../model/auth-settings-response');

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
   * Retrieves the list of repositories from the specified location.
   *
   * @param {string} [location] - Optional repository location. If provided,
   *                              the request will be executed for
   *                              the specified location.
   * @return {Promise<RepositoryListResponse>} A promise that resolves to
   *         a RepositoryListResponse containing repository descriptors.
   */
  getRepositories(location) {
    const locationParameter = this.getLocationParameter(location);
    const url = `${REPOSITORY_SERVICE_URL}/all${locationParameter}`;
    const requestBuilder = HttpRequestBuilder
      .httpGet(url)
      .addAcceptHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder).then((response) => {
      return new RepositoryListResponse(response.getData());
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
    return this.getRepositories(location).then((response) => {
      return response.getRepositoryIds().indexOf(id) !== -1;
    });
  }

  /**
   * Creates a repository client instance with the provided id and
   * configuration.
   * @param {string} id of the repository
   * @param {RepositoryClientConfig} config for the overridable repository
   *    configuration.
   * @param {string} [location] The location of the repository (optional).
   * @return {Promise<RDFRepositoryClient>} promise which resolves with
   *    new RDFRepositoryClient instance.
   */
  getRepository(id, config, location) {
    if (!id) {
      throw new Error('Repository id is required parameter!');
    }
    if (!config || !(config instanceof RepositoryClientConfig)) {
      throw new Error('RepositoryClientConfig is required parameter!');
    }
    return this.hasRepository(id, location).then((exists) => {
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
   * @return {Promise<RepositoryConfig>} a promise which resolves to a
   * RepositoryConfig or rejects with error if thrown during execution.
   */
  getDefaultConfig(repositoryType) {
    if (!repositoryType) {
      throw new Error('Repository type is required parameter!');
    }

    const requestBuilder = HttpRequestBuilder
      .httpGet(
        `${REPOSITORY_SERVICE_URL}/default-config/${repositoryType}`)
      .addAcceptHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder).then((response) => {
      return new RepositoryConfig(response.getData());
    });
  }

  /**
   * Retrieves the configuration of a repository.
   *
   * @param {string} repositoryId The ID of the repository whose configuration
   *                              is to be retrieved.
   * @param {string} [location] The optional location of the repository.
   *
   * @return {Promise<RepositoryConfig>} A promise that resolves to
   *         a RepositoryConfig, or rejects with an error if one occurs
   *         during the execution.
   */
  getRepositoryConfig(repositoryId, location) {
    if (!repositoryId) {
      throw new Error('Repository id is required parameter!');
    }

    const loc = this.getLocationParameter(location);
    const requestBuilder = HttpRequestBuilder
      .httpGet(`${REPOSITORY_SERVICE_URL}/${repositoryId}${loc}`)
      .addAcceptHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder).then((response) => {
      return new RepositoryConfig(response.getData());
    });
  }

  /**
   * Download the repository configuration in turtle format using content
   * negotiation.
   *
   * @param {string} repositoryId the repository id
   * @param {string} [location] optional repository location
   *
   * @return {Promise<string | any>} a service request that will resolve to a
   * readable stream to which the client can subscribe and consume the emitted
   * strings as soon as they are available. Resolves to turtle format.
   */
  downloadRepositoryConfig(repositoryId, location) {
    if (!repositoryId) {
      throw new Error('Repository id is required parameter!');
    }
    const loc = this.getLocationParameter(location);
    const requestBuilder = HttpRequestBuilder
      .httpGet(`${REPOSITORY_SERVICE_URL}/${repositoryId}${loc}`)
      .addAcceptHeader(MediaType.TEXT_TURTLE)
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
   * @return {Promise<void>} A promise that resolves when the repository
   *         is successfully created, or rejects with an error if one occurs
   *         during execution.
   */
  createRepository(repositoryConfig) {
    if (!repositoryConfig) {
      throw new Error('RepositoryConfig is required parameter!');
    }
    const requestBuilder = HttpRequestBuilder.httpPost(REPOSITORY_SERVICE_URL);
    return this.sendRepositoryConfig(requestBuilder, repositoryConfig,
      'Created repository');
  }

  /**
   * Updates an existing repository with the provided configuration.
   *
   * @param {RepositoryConfig} repositoryConfig The configuration of
   *                                    the repository to be updated.
   *
   * @return {Promise<void>} A promise that resolves when the repository
   *         is successfully updated, or rejects with an error if one occurs
   *         during execution.
   */
  updateRepository(repositoryConfig) {
    if (!repositoryConfig) {
      throw new Error('RepositoryConfig is required parameter!');
    }
    if (!repositoryConfig.id) {
      throw new Error('Repository id is required parameter!');
    }
    const url = `${REPOSITORY_SERVICE_URL}/${repositoryConfig.id}`;
    return this.sendRepositoryConfig(HttpRequestBuilder.httpPut(url),
      repositoryConfig, 'Updated repository');
  }

  /**
   * Sends the repository configuration as the request body. The location of
   * the repository is part of the configuration, so no query parameter is
   * added.
   *
   * @private
   *
   * @param {HttpRequestBuilder} requestBuilder The create or update request.
   * @param {RepositoryConfig} repositoryConfig The configuration to send.
   * @param {string} message The message to log on success.
   *
   * @return {Promise<void>} A promise that resolves when the request succeeds.
   */
  sendRepositoryConfig(requestBuilder, repositoryConfig, message) {
    const configuredRequest = requestBuilder
      .setData(this.objectToJson(repositoryConfig))
      .addContentTypeHeader(MediaType.APPLICATION_JSON)
      .addAcceptHeader(MediaType.TEXT_PLAIN);
    return this.execute(configuredRequest).then(() => {
      this.logger.info({repoId: repositoryConfig.id}, message);
    });
  }

  /**
   * Rotates the data encryption key of an encrypted repository.
   *
   * New writes use the new key; existing data stays encrypted with the
   * previous keys. Needs GraphDB 11.4+ and a repository created with
   * <code>storageEncryption</code>, see {@link RepositoryConfig}.
   *
   * @param {string} repositoryId The ID of the encrypted repository.
   * @param {string} [location] The optional location of the repository.
   *
   * @return {Promise<HttpResponse|Error>} A promise that resolves to
   *         the response wrapper, or rejects with an error if one occurs
   *         during execution.
   */
  rotateDataEncryptionKey(repositoryId, location) {
    if (!repositoryId) {
      throw new Error('Repository id is required parameter!');
    }

    const loc = this.getLocationParameter(location);
    const url = `${REPOSITORY_SERVICE_URL}/${repositoryId}` +
      `/rotate-data-encryption-key${loc}`;
    const requestBuilder = HttpRequestBuilder.httpPost(url);
    return this.execute(requestBuilder);
  }

  /**
   * Restarts a repository.
   *
   * @param {string} repositoryId The ID of the repository to restart.
   * @param {string} [location] The optional location of the repository.
   *
   * @return {Promise<void>} A promise that resolves when the repository
   *         is successfully restarted, or rejects with an error if one occurs
   *         during execution.
   */
  restartRepository(repositoryId, location) {
    if (!repositoryId) {
      throw new Error('Repository id is required parameter!');
    }

    const loc = this.getLocationParameter(location);
    const url = `${REPOSITORY_SERVICE_URL}/${repositoryId}/restart${loc}`;
    const requestBuilder = HttpRequestBuilder.httpPost(url);
    return this.execute(requestBuilder).then(() => {
      this.logger.info({repositoryId}, 'Restarted repository');
    });
  }

  /**
   * Checks if GraphDB security is enabled.
   * @return {Promise<boolean>} a promise which resolves to <code>true</code>
   * if security is enabled and <code>false</code> otherwise, or rejects with
   * error if thrown during execution.
   */
  isSecurityEnabled() {
    const requestBuilder =
      HttpRequestBuilder.httpGet(SECURITY_SERVICE_URL)
        .addAcceptHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder).then((response) => {
      return response.getData();
    });
  }

  /**
   * Enable or disable GraphDB security.
   * @param {boolean} enabled <code>true</code> if security is enabled and
   * <code>false</code> otherwise.
   * @return {Promise<void>} a promise which resolves when the security setting
   * is successfully changed, or rejects with error if thrown during execution.
   */
  toggleSecurity(enabled) {
    const requestBuilder =
      HttpRequestBuilder
        .httpPost(`${SECURITY_SERVICE_URL}?useSecurity=${enabled}`)
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .setData(`${enabled}`);
    return this.execute(requestBuilder).then(() => {
      this.logger.info({enabled}, 'Toggled security');
    });
  }

  /**
   * Enable or disable access to a predefined set of functionalities
   * without having to log in.
   * To use free access, you must have security enabled.
   * Use with extreme caution, as the changes that are made to the
   * application settings may possibly change the behavior of the
   * GraphDB Workbench for the logged-in user or for all users
   * if logged in as admin.
   * @param {boolean} enabled <code>true</code> if free access is enabled
   * and <code>false</code> otherwise.
   * @param {string[]} authorities additional permissions of the free access
   * user, see {@link Authority}
   * @param {AppSettings} appSettings configure the default behavior
   * of the GraphDB Workbench
   * @return {Promise<void>} a promise which resolves when the free access
   * setting is successfully updated, or rejects with error if thrown
   * during execution.
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
    return this.execute(requestBuilder).then(() => {
      this.logger.info({enabled}, 'Updated free access');
    });
  }

  /**
   * Check if free access is enabled
   * @return {Promise<AuthSettingsResponse>} a promise which resolves
   * to an AuthSettingsResponse or rejects with error if thrown during
   * execution.
   */
  getFreeAccess() {
    const requestBuilder =
      HttpRequestBuilder
        .httpGet(`${SECURITY_SERVICE_URL}/free-access`)
        .addAcceptHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder).then((response) => {
      return new AuthSettingsResponse(response.getData());
    });
  }

  /**
   * Create a user
   * @param {string} username User name
   * @param {string} password User password
   * @param {string[]} [grantedAuthorities] the user role, additional
   * permissions and custom roles, see {@link Authority}
   * @param {AppSettings} [appSettings] configure the default behavior
   * of the GraphDB Workbench
   * @return {Promise<void>} a promise which resolves when the user is
   * successfully created, or rejects with error if thrown during execution.
   */
  createUser(username, password, grantedAuthorities, appSettings) {
    const requestBuilder =
      HttpRequestBuilder
        .httpPost(this.getUserUrl(username))
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .addAcceptHeader(MediaType.TEXT_PLAIN)
        .setData({
          username,
          password,
          grantedAuthorities,
          appSettings: this.objectToJson(appSettings)
        });
    return this.execute(requestBuilder).then(() => {
      this.logger.info({username}, 'Created user');
    });
  }

  /**
   * Edit user.
   * Use with extreme caution, as the changes that are made to the
   * application settings may possibly change the behavior of the
   * GraphDB Workbench for the user.
   * @param {string} username User name
   * @param {string} [password] User password
   * @param {string[]} [grantedAuthorities] the user role, additional
   * permissions and custom roles, see {@link Authority}
   * @param {AppSettings} [appSettings] configure the default behavior
   * of the GraphDB Workbench
   * @return {Promise<void>} a promise which resolves when the user is
   * successfully updated, or rejects with error if thrown during execution.
   */
  updateUser(username, password, grantedAuthorities, appSettings) {
    const requestBuilder =
      HttpRequestBuilder
        .httpPut(this.getUserUrl(username))
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .addAcceptHeader(MediaType.TEXT_PLAIN)
        .setData({
          username,
          password,
          grantedAuthorities,
          appSettings: this.objectToJson(appSettings)
        });
    return this.execute(requestBuilder).then(() => {
      this.logger.info({username}, 'Updated user');
    });
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
   * @return {Promise<void>} a promise which resolves when the user data is
   * successfully updated, or rejects with error if thrown during execution.
   */
  updateUserData(username, password, appSettings) {
    const requestBuilder =
      HttpRequestBuilder
        .httpPatch(this.getUserUrl(username))
        .addContentTypeHeader(MediaType.APPLICATION_JSON)
        .addAcceptHeader(MediaType.TEXT_PLAIN)
        .setData({
          username,
          password,
          appSettings: this.objectToJson(appSettings)
        });
    return this.execute(requestBuilder).then(() => {
      this.logger.info({username}, 'Updated user data');
    });
  }

  /**
   * Get a user
   * @param {string} username User name
   * @return {Promise<UserResponse>} a promise which resolves
   * to a UserResponse or rejects with error if thrown during execution.
   */
  getUser(username) {
    const requestBuilder =
      HttpRequestBuilder
        .httpGet(this.getUserUrl(username))
        .addAcceptHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder).then((response) => {
      return new UserResponse(response.getData());
    });
  }

  /**
   * Retrieves all users.
   * @return {Promise<UserResponse[]>} a promise which resolves
   * to an array of UserResponse or rejects with error if thrown during
   * execution.
   */
  getUsers() {
    const requestBuilder =
      HttpRequestBuilder
        .httpGet(`${SECURITY_SERVICE_URL}/users`)
        .addAcceptHeader(MediaType.APPLICATION_JSON);
    return this.execute(requestBuilder).then((response) => {
      return response.getData().map((user) => new UserResponse(user));
    });
  }

  /**
   * Deletes a user
   * @param {string} username User name
   * @return {Promise<void>} a promise which resolves when the user is
   * successfully deleted, or rejects with error if thrown during execution.
   */
  deleteUser(username) {
    const requestBuilder =
      HttpRequestBuilder
        .httpDelete(this.getUserUrl(username))
        .addAcceptHeader(MediaType.TEXT_PLAIN);
    return this.execute(requestBuilder).then(() => {
      this.logger.info({username}, 'Deleted user');
    });
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
   * Returns the URL-encoded query parameter for the repository location if
   * it's provided, otherwise returns an empty string.
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
      '' : `?location=${encodeURIComponent(location)}`;
  }

  /**
   * Returns the URL of the user with the provided username. The username is
   * percent-encoded, including <code>!'()*</code>, except for <code>/</code>,
   * which GraphDB rejects when encoded.
   *
   * @private
   *
   * @param {string} username User name
   *
   * @return {string} the URL of the user
   */
  getUserUrl(username) {
    // encodeURIComponent leaves !'()* as they are
    const encodedUsername = encodeURIComponent(username)
      .replace(/[!'()*]/g,
        (c) => `%${c.codePointAt(0).toString(16).toUpperCase()}`)
      .replaceAll('%2F', '/');
    return `${SECURITY_SERVICE_URL}/users/${encodedUsername}`;
  }
}

module.exports = GraphDBServerClient;
