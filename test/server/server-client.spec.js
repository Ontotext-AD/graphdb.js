const ServerClient = require('server/server-client');
const ServerClientConfig = require('server/server-client-config');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const HttpRequestBuilder = require('http/http-request-builder');
const RDFMimeType = require('http/rdf-mime-type');
const User = require('auth/user');

import data from './data/server-client.data';
import userdata from '../auth/data/logged-user-data';

describe('ServerClient', () => {
  let config;
  let server;

  beforeEach(() => {
    createUnsecuredClient();
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

  describe('authorization', () => {
    test('should login and then execute request with auth token', () => {
      createSecuredClient();

      return server.getRepositoryIDs().then((ids) => {
        const requestMock = server.httpClient.request;
        // expect 2 invocations: first login, second getRepositoryIDs
        expect(requestMock).toHaveBeenCalledTimes(2);

        const expectedLoginRequest = HttpRequestBuilder.httpPost('/rest/login/testuser')
          .addGraphDBPasswordHeader('pass123');
        expect(requestMock).toHaveBeenNthCalledWith(1, expectedLoginRequest);

        const expectedAPIRequest = HttpRequestBuilder.httpGet('/repositories')
          .addAcceptHeader(RDFMimeType.SPARQL_RESULTS_JSON)
          .addAuthorizationHeader('token123');
        expect(requestMock).toHaveBeenNthCalledWith(2, expectedAPIRequest);
      });
    });

    test('should try relogin after token gets expired', () => {
      createSecuredClient();

      return server.getRepositoryIDs()
        .then(() => {
          return server.getRepositoryIDs();
        }).then((ids) => {
          const requestMock = server.httpClient.request;
          // expecting 5 invocations:
          // login
          // first getRepositoryIDs
          // second getRepositoryIDs which fails with 401 unauthorized
          // re-login
          // third getRepositoryIDs
          expect(requestMock).toHaveBeenCalledTimes(5);
        });
    });

    test('should not pass auth token if there is no authenticated user', () => {
      return server.getRepositoryIDs().then((ids) => {
        const expectedRequest = HttpRequestBuilder.httpGet('/repositories')
          .addAcceptHeader(RDFMimeType.SPARQL_RESULTS_JSON);
        const requestMock = server.httpClient.request;
        expect(requestMock).toHaveBeenCalledWith(expectedRequest);
      });
    });

    test('should maintain logged in User after successful login', () => {
      createSecuredClient();

      return server.getRepositoryIDs().then((ids) => {
        const expectedUser = new User('token123', 'pass123', userdata);
        expect(server.authenticationService.getLoggedUser()).toEqual(expectedUser);
      });
    });

    test('should not perform login if username and password are not provided', () => {
      return server.getRepositoryIDs().then((ids) => {
        expect(server.loggedUser).toBeUndefined();
        const requestMock = server.httpClient.request;
        // expect 1 invocation for the getRepositoryIDs API call but not for the login
        expect(requestMock).toHaveBeenCalledTimes(1);
      });
    });

    test('should remove the auth token from the logged in user', () => {
      createSecuredClient();

      return server.getRepositoryIDs()
        .then((ids) => server.logout())
        .then(() => {
          expect(server.authenticationService.getLoggedUser().getToken()).toBeUndefined();
        });
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
        expect(actual.repositoryClientConfig).toEqual(expected.repositoryClientConfig);
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

  function createUnsecuredClient() {
    config = new TestServerConfig()
      .setEndpoint('server/url')
      .setTimeout(0)
      .setHeaders({});
    server = new ServerClient(config);
    mockClient();
  }

  function createSecuredClient() {
    config = new TestServerConfig()
      .setEndpoint('server/url')
      .setTimeout(0)
      .setHeaders({})
      .setUsername('testuser')
      .setPass('pass123');
    server = new ServerClient(config);
    mockClient();
  }

  function mockClient() {
    let calls = 0;

    server.httpClient.request = jest.fn().mockImplementation((request) => {
      if (request.getMethod() === 'get') {
        calls++;
        if (server.authenticationService.getLoggedUser() && calls === 2) {
          // emulate token expiration
          server.authenticationService.getLoggedUser().clearToken();
          return Promise.reject({
            response: {
              status: 401
            }
          });
        }
        return Promise.resolve({data: data.repositories.GET});
      } else if (request.getMethod() === 'delete') {
        return Promise.resolve(true);
      } else if (request.getMethod() === 'post') {
        return Promise.resolve({
          headers: {
            authorization: 'token123'
          },
          data: userdata
        });
      }
      return Promise.reject();
    });
  }
});

/**
 * Test implementation for the {@link ServerClientConfig}
 */
class TestServerConfig extends ServerClientConfig {
}
