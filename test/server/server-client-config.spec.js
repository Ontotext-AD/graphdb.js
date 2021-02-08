const ClientConfigBuilder = require('http/client-config-builder');

describe('ServerClientConfig', () => {
  const endpoint = 'http://endpoint';

  test('should initialize with the default parameters', () => {
    const config = new ClientConfigBuilder().serverConfig(endpoint);

    expect(config.getEndpoint()).toEqual(endpoint);
    expect(config.getHeaders()).toEqual({});
    expect(config.getTimeout()).toEqual(10000);
    expect(config.getUsername()).toEqual(undefined);
    expect(config.getPass()).toEqual(undefined);
    expect(config.getBasicAuthentication()).toBeFalsy();
    expect(config.getKeepAlive()).toBeTruthy();
  });

  test('should support initialization via fluent API ', () => {
    const headers = {'Accept': 'text/plain'};
    const config = new ClientConfigBuilder().serverConfig(endpoint)
      .setTimeout(1000)
      .setHeaders(headers)
      .useBasicAuthentication('testuser', 'P@sw0rd');
    expect(config.getEndpoint()).toEqual('http://endpoint');
    expect(config.getTimeout()).toEqual(1000);
    expect(config.getHeaders()).toEqual(headers);
    expect(config.getUsername()).toEqual('testuser');
    expect(config.getPass()).toEqual('P@sw0rd');
    expect(config.getBasicAuthentication()).toBeTruthy();
    expect(config.getGdbTokenAuthentication()).toBeFalsy();
    expect(config.getKeepAlive()).toBeTruthy();

    config.setKeepAlive(false);
    expect(config.getKeepAlive()).toBeFalsy();

    config.useGdbTokenAuthentication('testuser2', 'P@sw0rd2');
    expect(config.getUsername()).toEqual('testuser2');
    expect(config.getPass()).toEqual('P@sw0rd2');
    expect(config.getBasicAuthentication()).toBeFalsy();
    expect(config.getGdbTokenAuthentication()).toBeTruthy();
  });
});
