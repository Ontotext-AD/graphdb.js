const HttpClient = require('../http/http-client');
const HttpResponse = require('../http/http-response');
const ConsoleLogger = require('../logging/console-logger');
const LoggingUtils = require('../logging/logging-utils');
const RDFRepositoryClient = require('../repository/rdf-repository-client');
const RepositoryClientConfig =
  require('../repository/repository-client-config');
const HttpRequestBuilder = require('../http/http-request-builder');
const AuthenticationService = require('../service/authentication-service');
const RDFMimeType = require('../http/rdf-mime-type');

const SERVICE_URL = '/repositories';

/**
 * Implementation of the server operations.
 *
 * If the server against which this client will be used has security enabled,
 * then it should be configured with the username and password in the
 * {#link ServerClientConfig}. In this case a login attempt is made before any
 * API method to be executed. Upon successful login an {@link User} which holds
 * the credentials and the authorization token in the context of the client is
 * created. In all consecutive API calls the authorization token is sent as a
 * http header.
 *
 * By default {#link ServerClientConfig} is configured with
 * <code>keepAlive = true</code> which means that upon authorization token
 * expiration current logged in user would be re-logged automatically before
 * next API call. This configuration can be changed within the configuration.
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

    this.authenticationService = new AuthenticationService(this.httpClient);
  }

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

  /**
   * Initializes the http client.
   */
  initHttpClient() {
    this.httpClient = new HttpClient(this.config.getEndpoint())
      .setDefaultReadTimeout(this.config.getTimeout())
      .setDefaultWriteTimeout(this.config.getTimeout());
  }

  /**
   * Initializes the logger.
   */
  initLogger() {
    this.logger = new ConsoleLogger({
      name: 'ServerClient',
      serverURL: this.config.getEndpoint()
    });
  }

  /**
   * Executes http request wrapped in provided request builder.
   * If the server config provides username and password, then a logging attempt
   * is made. Upon successful login the auth data is stored for later requests.
   *
   * @private
   *
   * @param {HttpRequestBuilder} requestBuilder
   *
   * @return {Promise<HttpResponse|Error>} a promise which resolves to response
   * wrapper or rejects with error if thrown during execution.
   */
  execute(requestBuilder) {
    const startTime = Date.now();
    const username = this.config.getUsername();
    const pass = this.config.getPass();
    return this.authenticationService.login(username, pass)
      .then((user) => {
        this.decorateRequestConfig(requestBuilder);
        return this.httpClient.request(requestBuilder);
      })
      .then((response) => {
        const executionResponse = new HttpResponse(response, this.httpClient);
        executionResponse.setElapsedTime(Date.now() - startTime);
        return executionResponse;
      })
      .catch((error) => {
        const status = error.response ? error.response.status : null;
        // Unauthorized
        if (status && status === 401 && this.config.getKeepAlive()) {
          // re-execute will try to re-login the user and update it
          return this.execute(requestBuilder);
        }
        return Promise.reject(error);
      });
  }

  /**
   * Performs a logout of logged in user.
   *
   * This method normally shouldn't be called as it does nothing but just clears
   * current authentication token. After that any consecutive API call against
   * the secured server will throw <code>Unauthorized</code> error with status
   * code <code>401</code> because the token is not sent any more, which in
   * result will force re-login for the same user to be executed by default,
   * unless the client is configured with
   * <code>ServerClientConfig.keepAlive = false</code>
   *
   * @private
   *
   * @return {Promise} returns a promise which resolves with undefined.
   */
  logout() {
    return this.authenticationService.logout();
  }

  /**
   * Allow request config to be altered before sending.
   *
   * @private
   * @param {HttpRequestBuilder} requestBuilder
   */
  decorateRequestConfig(requestBuilder) {
    const token = this.authenticationService.getAuthentication();
    if (token) {
      requestBuilder.addAuthorizationHeader(token);
    }
  }
}

module.exports = ServerClient;
