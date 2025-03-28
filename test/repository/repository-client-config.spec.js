const RepositoryClientConfig = require('repository/repository-client-config');
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
    const config = new RepositoryClientConfig(endpoint);
    expect(config.getEndpoint()).toEqual(endpoint);
    expect(config.getHeaders()).toEqual({});
    expect(config.getDefaultRDFMimeType())
      .toEqual('application/sparql-results+json');
    expect(config.getEndpoints()).toEqual([]);
    expect(config.getReadTimeout()).toEqual(10000);
    expect(config.getWriteTimeout()).toEqual(10000);
    expect(config.getUsername()).toEqual(undefined);
    expect(config.getPass()).toEqual(undefined);
    expect(config.getBasicAuthentication()).toBeFalsy();
    expect(config.getKeepAlive()).toBeTruthy();
  });

  test('should support initialization via fluent API', () => {
    const config = new RepositoryClientConfig(endpoint)
      .setEndpoints(endpoints)
      .setHeaders(headers)
      .setDefaultRDFMimeType(defaultRDFMimeType)
      .setReadTimeout(readTimeout)
      .setWriteTimeout(writeTimeout)
      .useGdbTokenAuthentication('testuser', 'P@ssw0rd')
      .setKeepAlive(false);
    expect(config.getEndpoints()).toEqual(endpoints);
    expect(config.getHeaders()).toEqual(headers);
    expect(config.getDefaultRDFMimeType()).toEqual(defaultRDFMimeType);
    expect(config.getReadTimeout()).toEqual(readTimeout);
    expect(config.getWriteTimeout()).toEqual(writeTimeout);
    expect(config.getUsername()).toEqual('testuser');
    expect(config.getPass()).toEqual('P@ssw0rd');
    expect(config.getBasicAuthentication()).toBeFalsy();
    expect(config.getGdbTokenAuthentication()).toBeTruthy();
    expect(config.getKeepAlive()).toBeFalsy();

    config.useBasicAuthentication('testuser2', 'P@ssw0rd2');
    expect(config.getUsername()).toEqual('testuser2');
    expect(config.getPass()).toEqual('P@ssw0rd2');
    expect(config.getBasicAuthentication()).toBeTruthy();
    expect(config.getGdbTokenAuthentication()).toBeFalsy();
  });

  test('should allow addition of repository endpoints', () => {
    const config = new RepositoryClientConfig(endpoint);
    endpoints.forEach((endpoint) => config.addEndpoint(endpoint));
    expect(config.getEndpoints()).toEqual(endpoints);
  });

  test('should not set GraphDb location header when crete an instance of RepositoryClientConfig', () => {
    // When: I create an instance of RepositoryClientConfig.
    const config = new RepositoryClientConfig(endpoint);
    // Then: I expect the Location header to not be set.
    expect(config.getHeaders()).toEqual({});
  });

  test('setLocation should not add the GraphDB Location header if an invalid location is passed', () => {
    [undefined, null].forEach((location) => {
      const config = new RepositoryClientConfig(endpoint);
      // When: I try to set an invalid location.
      config.setLocation(location);
      // Then: I expect the Location header to not be set.
      expect(config.getHeaders()).toEqual({});
    });
  });

  test('setLocation should add the GraphDB Location header if a valid location is passed', () => {
    ['', 'http://graphdb2:7200'].forEach((location) => {
      const config = new RepositoryClientConfig(endpoint);
      // When: I try to set a valid location.
      config.setLocation(location);
      // Then: I expect the Location header to be set.
      expect(config.getHeaders()).toEqual({ "x-graphdb-repository-location": location });
    });
  });

});
