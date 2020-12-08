/**
 * Logged in user credentials and settings.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class User {
  /**
   * Instantiates the user.
   * @param {string} token is the authentication token obtained with the login.
   * @param {string} password of the user
   * @param {Object} data is the logged in user data which contains the username
   * the role and settings.
   */
  constructor(token, password, data) {
    this.token = token;
    this.password = password;
    this.data = data;
  }

  /**
   * @return {string} the authentication token.
   */
  getToken() {
    return this.token;
  }

  /**
   * Removes the token which effectively make the user unauthenticated.
   */
  clearToken() {
    this.token = undefined;
  }

  /**
   * @return {string} the logged in username.
   */
  getUsername() {
    return this.getProperty('username');
  }

  /**
   * @return {string} the user's password.
   */
  getPassword() {
    return this.password;
  }

  /**
   * @return {Array<string>} an array of user roles.
   */
  getAuthorities() {
    return this.getProperty('authorities');
  }

  /**
   * @private
   * @param {string} name is the property name
   * @return {*} the property value or undefined if data or property is missing.
   */
  getProperty(name) {
    return this.data ? this.data[name] : undefined;
  }
}

module.exports = User;
