const BasicAuthentication = require('./basic-authentication');
const GdbTokenAuthentication = require('./gdb-token-authentication');

/**
 * Factory to create concrete authentication type, based on
 * client configuration.
 *
 * @class
 * @author Teodossi Dossev
 */
export class AuthenticationFactory {
  /**
   * Concrete authentication type generator.
   * @param {ClientConfig} clientConfig
   * @return {BasicAuthentication | GdbTokenAuthentication}
   */
  getAuthenticationType(clientConfig) {
    if (clientConfig.getBasicAuthentication()) {
      return new BasicAuthentication(clientConfig);
    } else if (clientConfig.getGdbTokenAuthentication()) {
      return new GdbTokenAuthentication(clientConfig);
    }
  }
}

module.exports = AuthenticationFactory;
