/**
 * Response model for user endpoint.
 * Contains user information including username, password, authorities,
 * and app settings.
 *
 * @class
 */
class UserResponse {
  /**
   * @param {Object} data User data from the server
   * @param {string} data.username Username
   * @param {string} data.password Password
   * @param {string[]} data.grantedAuthorities Array of granted authorities
   * @param {Object} data.appSettings Application settings
   * @param {number} [data.dateCreated] Timestamp when the user was created
   * @param {Object[]} [data.gptThreads] Array of GPT threads
   */
  constructor(data = {}) {
    this.username = data.username;
    this.password = data.password;
    this.grantedAuthorities = data.grantedAuthorities || [];
    this.appSettings = data.appSettings;
    this.dateCreated = data.dateCreated;
    this.gptThreads = data.gptThreads || [];
  }

  /**
   * Get username
   * @return {string} username
   */
  getUsername() {
    return this.username;
  }

  /**
   * Get password
   * @return {string} password
   */
  getPassword() {
    return this.password;
  }

  /**
   * Get granted authorities
   * @return {string[]} array of granted authorities
   */
  getGrantedAuthorities() {
    return this.grantedAuthorities;
  }

  /**
   * Get application settings
   * @return {Object} application settings
   */
  getAppSettings() {
    return this.appSettings;
  }

  /**
   * Get date created
   * @return {number} timestamp when user was created
   */
  getDateCreated() {
    return this.dateCreated;
  }

  /**
   * Get GPT threads
   * @return {Object[]} array of GPT threads
   */
  getGptThreads() {
    return this.gptThreads;
  }
}

module.exports = UserResponse;
