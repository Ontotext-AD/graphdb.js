const ServerClientConfig = require('server/server-client-config');

describe('ServerClientConfig', () => {
  test('should initialize with the supplied parameters', () => {
    const headers = {'Accept': 'text/plain'};
    const config = new ServerClientConfig('/endpoint', 1000, headers);
    expect(config.getEndpoint()).toEqual('/endpoint');
    expect(config.getTimeout()).toEqual(1000);
    expect(config.getHeaders()).toEqual(headers);
  });

  test('should support initialization via fluent API ', () => {
    const headers = {'Accept': 'text/plain'};
    const config = new ServerClientConfig()
      .setEndpoint('/endpoint')
      .setTimeout(1000)
      .setHeaders(headers);
    expect(config.getEndpoint()).toEqual('/endpoint');
    expect(config.getTimeout()).toEqual(1000);
    expect(config.getHeaders()).toEqual(headers);
  });
});
