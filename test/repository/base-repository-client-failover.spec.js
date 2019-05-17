const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const BaseRepositoryClient = require('repository/base-repository-client');
const httpClientStub = require('../http/http-client.stub');

jest.mock('http/http-client');

describe('BaseRepositoryClient', () => {

  let repoClientConfig;
  let repositoryClient;

  describe('Automatic failover - retrying with different repo endpoint', () => {
    beforeEach(() => {
      repoClientConfig = new RepositoryClientConfig([
        'http://localhost:8081/repositories/test1',
        'http://localhost:8082/repositories/test2',
        'http://localhost:8083/repositories/test3'
      ], {}, '', 100, 200, 50, 2);

      HttpClient.mockImplementation(() => httpClientStub());

      repositoryClient = new TestRepositoryClient(repoClientConfig);
    });

    test('should automatically switch to another repository endpoint if the status is allowed for retry', () => {
      let httpClient1 = repositoryClient.httpClients[0];
      stubHttpClient(httpClient1, 503);

      let httpClient2 = repositoryClient.httpClients[1];
      stubHttpClient(httpClient2, 503);

      // The last retry on the last client should be successful
      let httpClient3 = repositoryClient.httpClients[2];
      stubHttpClient(httpClient3, 200);

      return repositoryClient.execute((client) => client.get('url')).then(() => {
        expect(httpClient1.get).toHaveBeenCalledTimes(1);
        expect(httpClient2.get).toHaveBeenCalledTimes(1);
        expect(httpClient3.get).toHaveBeenCalledTimes(1);
      });
    });

    test('should reject if all repository endpoint have unsuccessful responses', () => {
      let httpClient1 = repositoryClient.httpClients[0];
      stubHttpClient(httpClient1, 503);

      let httpClient2 = repositoryClient.httpClients[1];
      stubHttpClient(httpClient2, 503);

      let httpClient3 = repositoryClient.httpClients[2];
      stubHttpClient(httpClient3, 503);

      return repositoryClient.execute((client) => client.get('url')).catch(() => {
        expect(httpClient1.get).toHaveBeenCalledTimes(1);
        expect(httpClient2.get).toHaveBeenCalledTimes(1);
        expect(httpClient3.get).toHaveBeenCalledTimes(1);
      });
    });

    test('should automatically switch to another repository endpoint if the previous is/are unreachable', () => {
      let httpClient1 = repositoryClient.httpClients[0];
      stubHttpClientWithoutResponse(httpClient1);

      let httpClient2 = repositoryClient.httpClients[1];
      stubHttpClientWithoutResponse(httpClient2);

      // Should manage to get response from the 3rd endpoint
      let httpClient3 = repositoryClient.httpClients[2];
      stubHttpClient(httpClient3, 200);

      return repositoryClient.execute((client) => client.get('url')).then(() => {
        expect(httpClient1.get).toHaveBeenCalledTimes(1);
        expect(httpClient2.get).toHaveBeenCalledTimes(1);
        expect(httpClient3.get).toHaveBeenCalledTimes(1);
      });
    });

    test('should reject if all repository endpoints are unreachable', () => {
      // Stub with request but without response object
      let httpClient1 = repositoryClient.httpClients[0];
      stubHttpClientWithoutResponse(httpClient1);

      let httpClient2 = repositoryClient.httpClients[1];
      stubHttpClientWithoutResponse(httpClient2);

      let httpClient3 = repositoryClient.httpClients[2];
      stubHttpClientWithoutResponse(httpClient3);

      return repositoryClient.execute((client) => client.get('url')).catch(() => {
        expect(httpClient1.get).toHaveBeenCalledTimes(1);
        expect(httpClient2.get).toHaveBeenCalledTimes(1);
        expect(httpClient3.get).toHaveBeenCalledTimes(1);
      });
    });

    test('should reject if the error is not from the HTTP request', () => {
      //
      let httpClient1 = repositoryClient.httpClients[0];
      httpClient1.get.mockRejectedValue(new Error('Error before/after request'));

      let httpClient2 = repositoryClient.httpClients[1];
      let httpClient3 = repositoryClient.httpClients[2];

      return repositoryClient.execute((client) => client.get('url')).catch(() => {
        expect(httpClient1.get).toHaveBeenCalledTimes(1);
        expect(httpClient2.get).toHaveBeenCalledTimes(0);
        expect(httpClient3.get).toHaveBeenCalledTimes(0);
      });
    });

    test('should reject if there is no provided error', () => {
      // No error/response
      let httpClient1 = repositoryClient.httpClients[0];
      httpClient1.get.mockRejectedValue();

      let httpClient2 = repositoryClient.httpClients[1];
      let httpClient3 = repositoryClient.httpClients[2];

      return repositoryClient.execute((client) => client.get('url')).catch(() => {
        expect(httpClient1.get).toHaveBeenCalledTimes(1);
        expect(httpClient2.get).toHaveBeenCalledTimes(0);
        expect(httpClient3.get).toHaveBeenCalledTimes(0);
      });
    });

    test('should propagate response mapper between retries', () => {
      let httpClient1 = repositoryClient.httpClients[0];
      stubHttpClientWithoutResponse(httpClient1);

      let httpClient2 = repositoryClient.httpClients[1];
      stubHttpClientWithoutResponse(httpClient2);

      // Should manage to get response from the 3rd endpoint
      let httpClient3 = repositoryClient.httpClients[2];
      stubHttpClient(httpClient3, 200);

      let responseMapper = response => response.status;
      return repositoryClient.execute((client) => client.get('url'), responseMapper).then((status) => {
        expect(status).toEqual(200);
      });
    });
  });

  function stubHttpClient(client, status) {
    client.get = jest.fn();
    if (status < 400) {
      client.get.mockResolvedValueOnce({
        request: {},
        status
      });
    } else {
      client.get.mockRejectedValueOnce({
        request: {},
        response: {status}
      });
    }
  }

  function stubHttpClientWithoutResponse(client) {
    client.get.mockRejectedValue({
      request: {}
    });
  }

});


class TestRepositoryClient extends BaseRepositoryClient {
}
