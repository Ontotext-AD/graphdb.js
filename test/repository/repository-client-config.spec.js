const RepositoryClientConfig = require('repository/repository-client-config');
const RDFMimeType = require('http/rdf-mime-type');

describe('RepositoryClientConfig', () => {
  const endpoints = [
    'http://localhost:8081/repositories/test1',
    'http://localhost:8082/repositories/test2',
    'http://localhost:8083/repositories/test3'
  ];
  const headers = {
    'Accept': 'application/json'
  };
  const defaultRDFMimeType = RDFMimeType.TURTLE;
  const readTimeout = 1000;
  const writeTimeout = 2000;

  test('should instantiate with the provided configuration parameters', () => {
    const config = new RepositoryClientConfig(endpoints, headers,
      defaultRDFMimeType, readTimeout, writeTimeout, 'testuser', 'P@ssw0rd',
      false);
    expect(config.getEndpoints()).toEqual(endpoints);
    expect(config.getHeaders()).toEqual(headers);
    expect(config.getDefaultRDFMimeType()).toEqual(defaultRDFMimeType);
    expect(config.getReadTimeout()).toEqual(readTimeout);
    expect(config.getWriteTimeout()).toEqual(writeTimeout);
    expect(config.getUsername()).toEqual('testuser');
    expect(config.getPass()).toEqual('P@ssw0rd');
    expect(config.getKeepAlive()).toBeFalsy();

    const securedHeaders = {'Accept': 'application/json',
      'Authorization': 'Basic dGVzdHVzZXI6UEBzc3cwcmQ='};
    config.setBasicAuthentication(true);
    expect(config.getHeaders()).toEqual(securedHeaders);
  });

  test('should support initialization via fluent API', () => {
    const config = new RepositoryClientConfig()
      .setEndpoints(endpoints)
      .setHeaders(headers)
      .setDefaultRDFMimeType(defaultRDFMimeType)
      .setReadTimeout(readTimeout)
      .setWriteTimeout(writeTimeout)
      .setUsername('testuser')
      .setPass('P@ssw0rd')
      .setKeepAlive(false);
    expect(config.getEndpoints()).toEqual(endpoints);
    expect(config.getHeaders()).toEqual(headers);
    expect(config.getDefaultRDFMimeType()).toEqual(defaultRDFMimeType);
    expect(config.getReadTimeout()).toEqual(readTimeout);
    expect(config.getWriteTimeout()).toEqual(writeTimeout);
    expect(config.getUsername()).toEqual('testuser');
    expect(config.getPass()).toEqual('P@ssw0rd');
    expect(config.getKeepAlive()).toBeFalsy();
  });

  test('should allow addition of repository endpoints', () => {
    const config = new RepositoryClientConfig();
    endpoints.forEach((endpoint) => config.addEndpoint(endpoint));
    expect(config.getEndpoints()).toEqual(endpoints);
  });
});
