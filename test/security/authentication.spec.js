const AuthenticationWithNoImplementedMethods =
  require('./authentication-mocks').AuthenticationWithNoImplementedMethods;
const AuthenticationFactory = require('security/authentication-factory');
const ServerClientConfig = require('server/server-client-config');
const BasicAuthentication = require('security/basic-authentication');
const GdbTokenAuthentication = require('security/gdb-token-authentication');


describe('Authentication', () => {
  test('should throw error if auth methods are not implemented', () => {
    const auth = new AuthenticationWithNoImplementedMethods();
    expect(() => {
      auth.getLoginRequestBuilder();
    }).toThrow(Error('Method #getLoginRequestBuilder() must be implemented!'));

    expect(() => {
      auth.getResponseAuthToken();
    }).toThrow(Error('Method #getResponseAuthToken() must be implemented!'));
  });

  test('should instantiate correct authentication type', () => {
    const config = new ServerClientConfig('http://endpoint');
    config.useBasicAuthentication('user, pass');
    const factory = new AuthenticationFactory();

    expect(factory.getAuthenticationType(config) instanceof BasicAuthentication)
      .toBe(true);

    config.useGdbTokenAuthentication('user, pass');
    expect(factory.getAuthenticationType(config) instanceof
      GdbTokenAuthentication)
      .toBe(true);

    config.disableAuthentication();
    expect(() => {
      factory.getAuthenticationType(config);
    }).toThrow(Error('Authentication is not configured properly'));
  });
});
