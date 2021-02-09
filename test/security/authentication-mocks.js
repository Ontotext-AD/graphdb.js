const Authentication = require('security/authentication');

/**
 * For testing purposes.
 */
class AuthenticationWithNoImplementedMethods extends Authentication {
  constructor() {
    super({});
  }
}

module.exports = {AuthenticationWithNoImplementedMethods};
