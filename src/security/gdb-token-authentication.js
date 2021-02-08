const Authentication = require('./authentication');
const HttpRequestBuilder = require('../http/http-request-builder');

/**
 * Gdb token authentication type class.
 * Used for gdb token authentication against secured gdb server.
 *
 * @class
 * @author Teodossi Dossev
 */
export class GdbTokenAuthentication extends Authentication {
  /**
   * @override
   * @return {HttpRequestBuilder} requestBuilder
   */
  getLoginRequestBuilder() {
    const username = this.clientConfig.getUsername();
    const pass = this.clientConfig.getPass();

    return HttpRequestBuilder.httpPost(`/rest/login/${username}`)
      .addGraphDBPasswordHeader(pass);
  }

  /**
   * @override
   * @return {string} token
   */
  getResponseAuthToken(response) {
    return response.headers['authorization'];
  }
}

module.exports = GdbTokenAuthentication;
