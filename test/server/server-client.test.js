const ServerClient = require('server/server-client');
const ServerClientConfig = require('server/server-client-config');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RepositoryClientConfig = require('repository/repository-client-config');

import data from './server-client.data';

describe('ServerClient', () => {
  let config;
  let server;

  beforeEach(() => {
    config = new TestServerConfig('server/url', 0, {});
    server = new ServerClient(config);

    server.httpClient.get = jest.fn();
    server.httpClient.get.mockImplementation(() => Promise.resolve({
      data: data.repositories.GET
    }));

    server.httpClient.deleteResource = jest.fn();
    server.httpClient.deleteResource.mockImplementation(() => Promise.resolve(true));
  });

  describe('initialization', () => {
    test('new ServerClient instance should not return null', () => {
      const config = new TestServerConfig('server/url', 0, {});
      expect(new ServerClient(config)).not.toBeNull();
    });

    test('should set required class member fields', () => {
      const config = new TestServerConfig('server/url', 0, {});
      const server = new ServerClient(config);
      expect(server.config).toEqual({
        endpoint: 'server/url',
        timeout: 0,
        headers: {}
      });
    });
  });

  describe('getRepositoryIDs', () => {
    test('should make request with required service url parameter', () => {
      return server.getRepositoryIDs().then(() => {
        expect(server.httpClient.get).toHaveBeenCalledTimes(1);
        expect(server.httpClient.get).toHaveBeenCalledWith('/repositories', {
          headers: {'Accept': 'application/sparql-results+json'}
        });
      });
    });

    test('should resolve with array holding repository ids', () => {
      const expected = ['ff-news', 'automotive', 'OscarsNominees'];
      return expect(server.getRepositoryIDs()).resolves.toEqual(expected);
    });

    test('should resolve with an empty array if no repositories are present', () => {
      server.httpClient.get.mockImplementation(() => Promise.resolve({
        data: {
          results: {
            bindings: []
          }
        }
      }));
      return expect(server.getRepositoryIDs()).resolves.toEqual([]);
    });

    test('should reject with error if request fails', () => {
      server.httpClient.get.mockImplementation(() => Promise.reject('Server error'));
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
      return expect(server.hasRepository()).rejects.toEqual(Error('Repository id is required parameter!'));
    });

    test('should reject with error if request fails', () => {
      server.httpClient.get.mockImplementation(() => Promise.reject('Server error'));
      return expect(server.hasRepository('automotive')).rejects.toEqual('Server error');
    });
  });

  describe('getRepository', () => {
    test('should reject with error if repository id is not provided', () => {
      return expect(server.getRepository()).rejects.toEqual(Error('Repository id is required parameter!'));
    });

    test('should reject with error if repository config is not provided', () => {
      return expect(server.getRepository('automotive')).rejects.toEqual(Error('RepositoryClientConfig is required parameter!'));
    });

    test('should reject with error if repository config is not of desired type', () => {
      return expect(server.getRepository('automotive', {})).rejects.toEqual(Error('RepositoryClientConfig is required parameter!'));
    });

    test('should reject with error if repository with provided id does not exists', () => {
      const repositoryClientConfig = new RepositoryClientConfig(['endpoint'], {}, '', 3000, 3000);
      return expect(server.getRepository('non_existing', repositoryClientConfig)).rejects.toEqual(Error('Repository with id non_existing does not exists.'));
    });

    test('should resolve with a RDFRepositoryClient instance if repository with provided id exists', () => {
      const repositoryClientConfig = new RepositoryClientConfig(['endpoint'], {}, '', 3000, 3000);
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
        expect(server.httpClient.deleteResource).toHaveBeenCalledTimes(1);
        expect(server.httpClient.deleteResource).toHaveBeenCalledWith('/repositories/automotive');
      });
    });

    test('should delete repository', () => {
      return expect(server.deleteRepository('automotive')).resolves.toBeTruthy();
    });

    test('should reject with error if repository id is not provided', () => {
      return expect(server.hasRepository()).rejects.toEqual(Error('Repository id is required parameter!'));
    });

    test('should reject with an error if request fails', () => {
      server.httpClient.deleteResource.mockImplementation(() => Promise.reject('Server error'));
      return expect(server.deleteRepository('automotive')).rejects.toEqual('Server error');
    });
  });
});

/**
 * Test implementation for the {@link ServerClientConfig}
 */
class TestServerConfig extends ServerClientConfig {
}
