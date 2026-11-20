const ServerClientConfig = require('server/server-client-config');

describe('ServerClientConfig', () => {
  const endpoint = 'http://endpoint';

  test('should initialize with the default parameters', () => {
    const config = new ServerClientConfig(endpoint);

    expect(config.getEndpoint()).toEqual(endpoint);
    expect(config.getHeaders()).toEqual({});
    expect(config.getTimeout()).toEqual(10000);
    expect(config.getUsername()).toEqual(undefined);
    expect(config.getPassword()).toEqual(undefined);
    expect(config.getBasicAuthentication()).toBeFalsy();
    expect(config.getKeepAlive()).toBeTruthy();
  });

  test('should support initialization via fluent API ', () => {
    const headers = {'Accept': 'text/plain'};
    const config = new ServerClientConfig(endpoint)
      .setTimeout(1000)
      .setHeaders(headers)
      .useBasicAuthentication('testuser', 'P@sw0rd');
    expect(config.getEndpoint()).toEqual('http://endpoint');
    expect(config.getTimeout()).toEqual(1000);
    expect(config.getHeaders()).toEqual(headers);
    expect(config.getUsername()).toEqual('testuser');
    expect(config.getPassword()).toEqual('P@sw0rd');
    expect(config.getBasicAuthentication()).toBeTruthy();
    expect(config.getGdbTokenAuthentication()).toBeFalsy();
    expect(config.getKeepAlive()).toBeTruthy();

    config.setKeepAlive(false);
    expect(config.getKeepAlive()).toBeFalsy();

    config.useGdbTokenAuthentication('testuser2', 'P@sw0rd2');
    expect(config.getUsername()).toEqual('testuser2');
    expect(config.getPassword()).toEqual('P@sw0rd2');
    expect(config.getBasicAuthentication()).toBeFalsy();
    expect(config.getGdbTokenAuthentication()).toBeTruthy();
  });

  test('should switch and disable authentication', () => {
    const config = new ServerClientConfig(endpoint);
    expect(config.getBasicAuthentication()).toBeFalsy();
    expect(config.getGdbTokenAuthentication()).toBeFalsy();

    config.useGdbTokenAuthentication('user', 'pass');
    expect(config.getBasicAuthentication()).toBeFalsy();
    expect(config.getGdbTokenAuthentication()).toBeTruthy();

    config.useBasicAuthentication('user', 'pass');
    expect(config.getBasicAuthentication()).toBeTruthy();
    expect(config.getGdbTokenAuthentication()).toBeFalsy();

    config.disableAuthentication();
    expect(config.getBasicAuthentication()).toBeFalsy();
    expect(config.getGdbTokenAuthentication()).toBeFalsy();
  });

  test('disableAuthentication should support method chaining', () => {
    const config = new ServerClientConfig(endpoint)
      .useBasicAuthentication('user', 'pass')
      .disableAuthentication()
      .setTimeout(5000)
      .setHeaders({'Accept': 'application/json'});

    expect(config.getBasicAuthentication()).toBeFalsy();
    expect(config.getGdbTokenAuthentication()).toBeFalsy();
    expect(config.getTimeout()).toEqual(5000);
    expect(config.getHeaders()).toEqual({'Accept': 'application/json'});
  });
});
