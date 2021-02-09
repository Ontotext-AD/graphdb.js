const User = require('../auth/user');
const AuthenticationFactory = require('../security/authentication-factory');

/**
 * Service dealing with user authentication in a secured server.
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 * @author Teodossi Dossev
 */
class AuthenticationService {
  /**
   * Instantiates the service with the provided HTTP request executor.
   *
   * @param {HttpClient} [httpClient] used to execute HTTP requests
   */
  constructor(httpClient) {
    this.httpClient = httpClient;
    this.authenticationFactory = new AuthenticationFactory();
  }

  /**
   * Performs a login request against secured server with provided username and
   * password. Upon successful authentication a {@link User} instance is created
   * with the user data and the auth token and returned to the client.
   *
   * @param {ClientConfig} clientConfig concrete client configuration
   * @param {User} user logged in user
   *
   * @return {Promise<User>} a promise resolving to an authenticated
   * {@link User} instance.
   */
  login(clientConfig, user) {
    if (!clientConfig.shouldAuthenticate() ||
      !this.isAlreadyAuthenticated(clientConfig, user)) {
      return Promise.resolve(user);
    }

    const authentication = this.getAuthentication(clientConfig);
    return this.httpClient.request(this.getLoginRequest(clientConfig))
      .then((response) => {
        const token = authentication.getResponseAuthToken(response);
        return new User(token, clientConfig.getPass(), response.data);
      });
  }

  /**
   * Performs a logout of logged in user. This effectively removes the stored in
   * the client user. Every consecutive call against secured server will result
   * in <code>Unauthorized</code> error with status code <code>401</code>.
   *
   * @param {User} user logged in user
   *
   * @return {Promise} returns a promise which resolves with undefined.
   */
  logout(user) {
    user.clearToken();
    return Promise.resolve();
  }

  /**
   * Return an effective valid token as string which is going to be send as a
   * request header <code>Authorization: token</code>. If there is no logged in
   * user, then this method returns <code>undefined</code>.
   *
   * @param {User} user logged in user
   * @return {string|undefined} authentication token
   */
  getAuthenticationToken(user) {
    return user && user.getToken();
  }

  /**
   * Checks if user credentials are provided and there isn't authenticated user
   * yet. If that's the case, authentication should be made.
   *
   * @private
   * @param {ClientConfig} clientConfig concrete client config
   * @param {User} user logged in user
   *
   * @return {boolean} true if authentication should be made
   */
  isAlreadyAuthenticated(clientConfig, user) {
    const hasCredentials = clientConfig.getUsername() && clientConfig.getPass();
    const isAuthenticated = user && user.getToken();
    return hasCredentials && !isAuthenticated;
  }

  /**
   * Returns authentication type related {@link HttpRequestBuilder}
   * login request builder
   *
   * @param {ClientConfig} clientConfig concrete client configuration
   * @return {HttpRequestBuilder} request builder
   */
  getLoginRequest(clientConfig) {
    return this.getAuthentication(clientConfig).getLoginRequestBuilder();
  }

  /**
   * Authentication type getter
   * @param {ClientConfig} clientConfig concrete client configuration
   * @return {BasicAuthentication|GdbTokenAuthentication} concrete
   * authentication type
   */
  getAuthentication(clientConfig) {
    return this.authenticationFactory.getAuthenticationType(clientConfig);
  }
}

module.exports = AuthenticationService;
