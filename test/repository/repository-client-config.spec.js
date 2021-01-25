/* eslint-disable max-len */
const ClientConfigBuilder = require('http/client-config-builder');
const RDFMimeType = require('http/rdf-mime-type');

describe('RepositoryClientConfig', () => {
  const endpoint = 'http://localhost:8081';
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

  test('should instantiate with the default configuration parameters', () => {
    const config = ClientConfigBuilder.repositoryConfig(endpoint);
    expect(config.getEndpoint()).toEqual(endpoint);
    expect(config.getHeaders()).toEqual({});
    expect(config.getDefaultRDFMimeType()).toEqual('application/sparql-results+json');
    expect(config.getEndpoints()).toEqual([]);
    expect(config.getReadTimeout()).toEqual(10000);
    expect(config.getWriteTimeout()).toEqual(10000);
    expect(config.getUsername()).toEqual(undefined);
    expect(config.getPass()).toEqual(undefined);
    expect(config.getBasicAuthentication()).toBeFalsy();
    expect(config.getKeepAlive()).toBeTruthy();
  });

  test('should support initialization via fluent API', () => {
    const config = ClientConfigBuilder.repositoryConfig(endpoint)
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
    const config = ClientConfigBuilder.repositoryConfig(endpoint);
    endpoints.forEach((endpoint) => config.addEndpoint(endpoint));
    expect(config.getEndpoints()).toEqual(endpoints);
  });

  test('should instantiate with basic auth configuration parameters', () => {
    const config = ClientConfigBuilder.repositoryConfig(endpoint);
    expect(config.getEndpoint()).toEqual(endpoint);
    const securedHeaders = {'Authorization': 'Basic dGVzdHVzZXI6UEBzc3cwcmQ='};
    config.setUsername('testuser')
      .setPass('P@ssw0rd')
      .setBasicAuthentication(true);
    expect(config.getHeaders()).toEqual(securedHeaders);
  });
});
