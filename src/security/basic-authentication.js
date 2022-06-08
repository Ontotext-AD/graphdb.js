const Authentication = require('./authentication');
const HttpRequestBuilder = require('../http/http-request-builder');

/**
 * Basic authentication type class.
 * Used for basic authentication against secured gdb server.
 *
 * @class
 * @author Teodossi Dossev
 */
export class BasicAuthentication extends Authentication {
  /**
   * @override
   * @return {HttpRequestBuilder} requestBuilder
   */
  getLoginRequestBuilder() {
    const username = this.clientConfig.getUsername();
    const pass = this.clientConfig.getPass();
    const credentials = `${username}:${pass}`;

    return HttpRequestBuilder.httpGet(`/rest/security/authenticatedUser`)
      .addAuthorizationHeader(`Basic ${this.toBase64(credentials)}`);
  }

  /**
   * Converts string to Base64
   * @param {String} string
   * @return {string} converted string
   */
  toBase64(string) {
    return Buffer.from(string).toString('base64');
  }

  /**
   * @override
   * @return {string} token
   */
  getResponseAuthToken(response) {
    return response.config.headers['authorization'];
  }
}

module.exports = BasicAuthentication;
