const AuthenticationService = require('../service/authentication-service');
const HttpClient = require('../http/http-client');
const ConsoleLogger = require('../logging/console-logger');
const HttpResponse = require('../http/http-response');

// Imports used by TypeScript type generation
const ServerClientConfig = require('./server-client-config');
const HttpRequestBuilder = require('../http/http-request-builder');
const User = require('../auth/user');

/**
 * Implementation of the server operations.
 *
 * If the server against which this client will be used has security enabled,
 * then it should be configured with the username and password in the
 * {@link ServerClientConfig}. In this case a login attempt is made before any
 * API method to be executed. Upon successful login an {@link User} which holds
 * the credentials and the authorization token in the context of the client is
 * created. In all consecutive API calls the authorization token is sent as a
 * http header.
 *
 * By default {@link ServerClientConfig} is configured with
 * <code>keepAlive = true</code> which means that upon authorization token
 * expiration current logged-in user would be re-logged automatically before
 * next API call. This configuration can be changed within the configuration.
 *
 * @class
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 * @author Boyan Tonchev
 */
class Server {
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
      name: 'Server',
      serverURL: this.config.getEndpoint()
    });
  }

  /**
  * Executes http request wrapped in provided request builder.
  * If the server config provides username and password, then a logging attempt
  * is made. Upon successful login the auth data is stored for later requests.
  *
  * @public
  *
  * @param {HttpRequestBuilder} requestBuilder
  *
  * @return {Promise<HttpResponse|Error>} a promise which resolves to response
  * wrapper or rejects with error if thrown during execution.
  */
  execute(requestBuilder) {
    const startTime = Date.now();
    return this.authenticationService.login(this.config, this.getLoggedUser())
      .then((user) => {
        this.setLoggedUser(user);
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
  * Performs a logout of logged-in user.
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
    return this.authenticationService.logout(this.getLoggedUser());
  }

  /**
  * Allow request config to be altered before sending.
  *
  * @private
  * @param {HttpRequestBuilder} requestBuilder
  */
  decorateRequestConfig(requestBuilder) {
    const token = this.authenticationService
      .getAuthenticationToken(this.getLoggedUser());
    if (token) {
      requestBuilder.addAuthorizationHeader(token);
    }
  }

  /**
   * Logged user getter.
   * @return {User} user
   */
  getLoggedUser() {
    return this.user;
  }

  /**
  * User setter
  * @param {User} user
  *
  * @return {Server}
  */
  setLoggedUser(user) {
    this.user = user;
    return this;
  }
}

module.exports = Server;
