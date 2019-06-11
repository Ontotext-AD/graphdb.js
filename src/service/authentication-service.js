const HttpRequestBuilder = require('../http/http-request-builder');
const User = require('../auth/user');

/**
 * Service dealing with user authentication in a secured server.
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class AuthenticationService {
  /**
   * Instantiates the service with the provided HTTP request executor.
   *
   * @param {HttpClient} [httpClient] used to execute HTTP requests
   */
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Performs a login request against secured server with provided username and
   * password. Upon successful authentication a {@link User} instance is created
   * with the user data and the auth token and returned to the client.
   *
   * @param {string} username is the username of the logged in user
   * @param {string} pass is the password of the logged in user
   *
   * @return {Promise<User>} a promise resolving to an authenticated
   * {@link User} instance.
   */
  login(username, pass) {
    if (!this.shouldAuthenticate(username, pass)) {
      return Promise.resolve();
    }
    const requestBuilder =
      HttpRequestBuilder.httpPost(`/rest/login/${username}`)
        .addGraphDBPasswordHeader(pass);
    return this.httpClient.request(requestBuilder).then((response) => {
      const token = response.headers['authorization'];
      const user = new User(token, pass, response.data);
      this.setLoggedUser(user);
      return user;
    });
  }

  /**
   * Performs a logout of logged in user. This effectively removes the stored in
   * the client user. Every consecutive call against secured server will result
   * in <code>Unauthorized</code> error with status code <code>401</code>.
   *
   * @return {Promise} returns a promise which resolves with undefined.
   */
  logout() {
    this.getLoggedUser() && this.getLoggedUser().clearToken();
    return Promise.resolve();
  }

  /**
   * Return an effective valid token as string which is going to be send as a
   * request header <code>Authorization: token</code>. If there is no logged in
   * user, then this method returns <code>undefined</code>.
   *
   * @return {string|undefined}
   */
  getAuthentication() {
    return this.getLoggedUser() && this.getLoggedUser().getToken();
  }

  /**
   * Checks if user credentials are provided and there isn't authenticated user
   * yet. If that's the case, authentication should be made.
   *
   * @private
   *
   * @param {string} username is the username of the logged in user
   * @param {string} pass is the password of the logged in user
   *
   * @return {boolean} true if authentication should be made
   */
  shouldAuthenticate(username, pass) {
    const hasCredentials = username && pass;
    const isAuthenticated = this.getLoggedUser()
      && this.getLoggedUser().getToken();
    return hasCredentials && !isAuthenticated;
  }

  /**
   * @param {User} user
   */
  setLoggedUser(user) {
    this.loggedUser = user;
  }

  /**
   * @return {User}
   */
  getLoggedUser() {
    return this.loggedUser;
  }

  /**
   * @param {HttpClient} httpClient
   * @return {AuthenticationService}
   */
  setHttpClient(httpClient) {
    this.httpClient = httpClient;
    return this;
  }
}

module.exports = AuthenticationService;
