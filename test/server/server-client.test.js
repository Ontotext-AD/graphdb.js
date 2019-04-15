import ServerClient from '../../src/server/server-client';
import {ServerClientConfig} from '../../src/server/server-client-config';
import {RDFRepositoryClient} from '../../src/repository/rdf-repository-client';
import {RepositoryClientConfig} from '../../src/repository/repository-client-config';

import data from '../../test/server/server-client.data';


describe('ServerClient', () => {
  let config;
  let server;
  beforeEach(() => {
    config = new TestServerConfig('server/url', 0, {});
    server = new ServerClient(config);

    server.httpClient.get = jest.fn();
    server.httpClient.get.mockImplementation(() => Promise.resolve({
      data: data.repositories.GET,
    }));

    server.httpClient.delete = jest.fn();
    server.httpClient.delete.mockImplementation(() => Promise.resolve(true));
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
        headers: {},
      });
    });
  });

  describe('getRepositoryIDs', () => {
    test('should make request with required service url parameter', () => {
      return server.getRepositoryIDs().then(() => {
        expect(server.httpClient.get).toHaveBeenCalledTimes(1);
        expect(server.httpClient.get).toHaveBeenCalledWith('/repositories');
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
            bindings: [],
          },
        },
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
      const repositoryClientConfig = new RepositoryClientConfig([], [], '', 3000, 3000, 5000);
      return expect(server.getRepository('non_existing', repositoryClientConfig)).rejects.toEqual(Error('Repository with id non_existing does not exists.'));
    });

    test('should resolve with a RDFRepositoryClient instance if repository with provided id exists', () => {
      const repositoryClientConfig = new RepositoryClientConfig([], [], '', 3000, 3000, 5000);
      const expected = new RDFRepositoryClient(repositoryClientConfig);
      return expect(server.getRepository('automotive', repositoryClientConfig)).resolves.toEqual(expected);
    });
  });

  describe('deleteRepository', () => {
    test('should make request with required parameter', () => {
      return server.deleteRepository('automotive').then(() => {
        expect(server.httpClient.delete).toHaveBeenCalledTimes(1);
        expect(server.httpClient.delete).toHaveBeenCalledWith('/repositories/automotive');
      });
    });

    test('should delete repository', () => {
      return expect(server.deleteRepository('automotive')).resolves.toBeTruthy();
    });

    test('should reject with error if repository id is not provided', () => {
      return expect(server.hasRepository()).rejects.toEqual(Error('Repository id is required parameter!'));
    });

    test('should reject with an error if request fails', () => {
      server.httpClient.delete.mockImplementation(() => Promise.reject('Server error'));
      return expect(server.deleteRepository('automotive')).rejects.toEqual('Server error');
    });
  });
});

/**
 * Test implementation for the {@link ServerClientConfig}
 */
class TestServerConfig extends ServerClientConfig {
}
