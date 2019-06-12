const ServerClient = require('server/server-client');
const ServerClientConfig = require('server/server-client-config');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const HttpRequestBuilder = require('http/http-request-builder');

import data from './server-client.data';

describe('ServerClient', () => {
  let config;
  let server;

  beforeEach(() => {
    config = new TestServerConfig()
      .setEndpoint('server/url')
      .setTimeout(0)
      .setHeaders({});
    server = new ServerClient(config);

    server.httpClient.request = jest.fn().mockImplementation((request) => {
      if (request.getMethod() === 'get') {
        return Promise.resolve({data: data.repositories.GET});
      } else if (request.getMethod() === 'delete') {
        return Promise.resolve(true);
      }
      return Promise.reject();
    });
  });

  describe('initialization', () => {
    test('new ServerClient instance should not return null', () => {
      expect(new ServerClient(config)).not.toBeNull();
    });

    test('should initialize with the provided server client configuration', () => {
      expect(server.config).toEqual(config);
      expect(server.config.getEndpoint()).toEqual('server/url');
    });
  });

  describe('getRepositoryIDs', () => {
    test('should make request with required service url parameter', () => {
      return server.getRepositoryIDs().then(() => {
        expect(server.httpClient.request).toHaveBeenCalledTimes(1);
        const expectedRequest = HttpRequestBuilder.httpGet('/repositories')
          .setHeaders({
            'Accept': 'application/sparql-results+json'
          });
        expect(server.httpClient.request).toHaveBeenCalledWith(expectedRequest);
      });
    });

    test('should resolve with array holding repository ids', () => {
      const expected = ['ff-news', 'automotive', 'OscarsNominees'];
      return expect(server.getRepositoryIDs()).resolves.toEqual(expected);
    });

    test('should resolve with an empty array if no repositories are present', () => {
      server.httpClient.request.mockResolvedValue({
        data: {
          results: {
            bindings: []
          }
        }
      });
      return expect(server.getRepositoryIDs()).resolves.toEqual([]);
    });

    test('should reject with error if request fails', () => {
      server.httpClient.request.mockRejectedValue('Server error');
      return expect(server.getRepositoryIDs()).rejects.toEqual('Server error');
    });
  });

  describe('hasRepository', () => {
    test('should resolve with true if repository exists', () => {
      return expect(server.hasRepository('automotive')).resolves.toBeTruthy();
    });

    test('should resolve with false if repository does not exist', () => {
      return expect(server.hasRepository('non_existing')).resolves.toBeFalsy();
    });

    test('should reject with error if repository id is not provided', () => {
      expect(() => server.hasRepository()).toThrow(Error('Repository id is required parameter!'));
    });

    test('should reject with error if request fails', () => {
      server.httpClient.request.mockRejectedValue('Server error');
      return expect(server.hasRepository('automotive')).rejects.toEqual('Server error');
    });
  });

  describe('getRepository', () => {
    test('should reject with error if repository id is not provided', () => {
      expect(() => server.getRepository()).toThrow(Error('Repository id is required parameter!'));
    });

    test('should reject with error if repository config is not provided', () => {
      expect(() => server.getRepository('automotive')).toThrow(Error('RepositoryClientConfig is required parameter!'));
    });

    test('should reject with error if repository config is not of desired type', () => {
      expect(() => server.getRepository('automotive', {})).toThrow(Error('RepositoryClientConfig is required parameter!'));
    });

    test('should reject with error if repository with provided id does not exists', () => {
      const repositoryClientConfig = new RepositoryClientConfig(['endpoint'], {}, '', 3000, 3000);
      return expect(server.getRepository('non_existing', repositoryClientConfig)).rejects.toEqual(Error('Repository with id non_existing does not exists.'));
    });

    test('should resolve with a RDFRepositoryClient instance if repository with provided id exists', () => {
      const repositoryClientConfig = new RepositoryClientConfig().setEndpoints(['endpoint']);
      const expected = new RDFRepositoryClient(repositoryClientConfig);
      return server.getRepository('automotive', repositoryClientConfig).then((actual) => {
        // Omit axios instances, they fail the deep equal check
        actual.httpClients.forEach((client) => delete client.axios);
        expected.httpClients.forEach((client) => delete client.axios);
        expect(actual).toEqual(expected);
      });
    });
  });

  describe('deleteRepository', () => {
    test('should make request with required parameter', () => {
      return server.deleteRepository('automotive').then(() => {
        expect(server.httpClient.request).toHaveBeenCalledTimes(1);
        const expectedRequest = HttpRequestBuilder.httpDelete('/repositories/automotive');
        expect(server.httpClient.request).toHaveBeenCalledWith(expectedRequest);
      });
    });

    test('should delete repository', () => {
      return expect(server.deleteRepository('automotive')).resolves.toEqual();
    });

    test('should reject with error if repository id is not provided', () => {
      expect(() => server.deleteRepository()).toThrow(Error('Repository id is required parameter!'));
    });

    test('should reject with an error if request fails', () => {
      server.httpClient.request.mockRejectedValue('Server error');
      return expect(server.deleteRepository('automotive')).rejects.toEqual('Server error');
    });
  });
});

/**
 * Test implementation for the {@link ServerClientConfig}
 */
class TestServerConfig extends ServerClientConfig {
}
