const ServerClientConfig = require('server/server-client-config');

describe('ServerClientConfig', () => {
  test('should initialize with the supplied parameters', () => {
    const headers = {'Accept': 'text/plain'};
    let config = new ServerClientConfig('/endpoint', 1000,
      headers, 'testuser', 'P@sw0rd');
    expect(config.getEndpoint()).toEqual('/endpoint');
    expect(config.getTimeout()).toEqual(1000);
    expect(config.getHeaders()).toEqual(headers);
    expect(config.getUsername()).toEqual('testuser');
    expect(config.getPass()).toEqual('P@sw0rd');
    expect(config.getKeepAlive()).toBeTruthy();

    config = new ServerClientConfig('/endpoint', 1000,
      headers, 'testuser', 'P@sw0rd', false);
    expect(config.getKeepAlive()).toBeFalsy();
  });

  test('should support initialization via fluent API ', () => {
    let headers = {'Accept': 'text/plain'};
    const config = new ServerClientConfig()
      .setEndpoint('/endpoint')
      .setTimeout(1000)
      .setHeaders(headers)
      .setUsername('testuser')
      .setPass('P@sw0rd');
    expect(config.getEndpoint()).toEqual('/endpoint');
    expect(config.getTimeout()).toEqual(1000);
    expect(config.getHeaders()).toEqual(headers);
    expect(config.getUsername()).toEqual('testuser');
    expect(config.getPass()).toEqual('P@sw0rd');
    expect(config.getKeepAlive()).toBeTruthy();

    config.setKeepAlive(false);
    expect(config.getKeepAlive()).toBeFalsy();

    headers = {'Accept': 'text/plain',
      'Authorization': 'Basic dGVzdHVzZXI6UEBzdzByZA=='};
    config.setBasicAuthentication(true);
    expect(config.getHeaders()).toEqual(headers);
  });
});
