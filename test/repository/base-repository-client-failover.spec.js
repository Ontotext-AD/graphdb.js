const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const BaseRepositoryClient = require('repository/base-repository-client');
const httpClientStub = require('../http/http-client.stub');

jest.mock('http/http-client');

describe('BaseRepositoryClient', () => {

  let repoClientConfig;
  let repositoryClient;

  describe('Automatic failover - retrying', () => {
    beforeEach(() => {
      repoClientConfig = new RepositoryClientConfig([
        'http://localhost:8080/repositories/test'
      ], {}, '', 100, 200, 50, 4);

      HttpClient.mockImplementation(() => httpClientStub());

      repositoryClient = new TestRepositoryClient(repoClientConfig);
    });

    test('should automatically retry for 503 server busy', () => {
      let httpClient = repositoryClient.httpClients[0];
      // The 4th retry should be successful -> 5 calls in total
      stubHttpClient(httpClient, [503, 503, 503, 503, 200]);
      return repositoryClient.execute((client) => client.get('url')).then(() => {
        expect(httpClient.get).toHaveBeenCalledTimes(5);
      });
    });

    test('should reject automatic retry if the status is not retriable', () => {
      let httpClient = repositoryClient.httpClients[0];
      stubHttpClient(httpClient, [404]);
      return repositoryClient.execute((client) => client.get('url')).catch(() => {
        expect(httpClient.get).toHaveBeenCalledTimes(1);
      });
    });

    test('should reject if all retry attempts were unsuccessful', () => {
      let httpClient = repositoryClient.httpClients[0];
      // The 4th retry should NOT be successful
      stubHttpClient(httpClient, [503, 503, 503, 503, 503, 503]);
      return repositoryClient.execute((client) => client.get('url')).catch(() => {
        expect(httpClient.get).toHaveBeenCalledTimes(5);
      });
    });

    test('should reject if there are no configured retries', () => {
      repoClientConfig.retryCount = 0;
      repositoryClient = new TestRepositoryClient(repoClientConfig);

      let httpClient = repositoryClient.httpClients[0];
      stubHttpClient(httpClient, [503]);
      return repositoryClient.execute((client) => client.get('url')).catch(() => {
        expect(httpClient.get).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Automatic failover - switching repo endpoints', () => {
    beforeEach(() => {
      repoClientConfig = new RepositoryClientConfig([
        'http://localhost:8081/repositories/test1',
        'http://localhost:8082/repositories/test2',
        'http://localhost:8083/repositories/test3'
      ], {}, '', 100, 200, 50, 2);

      HttpClient.mockImplementation(() => httpClientStub());

      repositoryClient = new TestRepositoryClient(repoClientConfig);
    });

    test('should automatically switch to another repository endpoint if retry attempts were unsuccessful', () => {
      let httpClient1 = repositoryClient.httpClients[0];
      stubHttpClient(httpClient1, [503, 503, 503]);

      let httpClient2 = repositoryClient.httpClients[1];
      stubHttpClient(httpClient2, [503, 503, 503]);

      // The last retry on the last client should be successful
      let httpClient3 = repositoryClient.httpClients[2];
      stubHttpClient(httpClient3, [503, 503, 200]);

      return repositoryClient.execute((client) => client.get('url')).then(() => {
        expect(httpClient1.get).toHaveBeenCalledTimes(3);
        expect(httpClient2.get).toHaveBeenCalledTimes(3);
        expect(httpClient3.get).toHaveBeenCalledTimes(3);
      });
    });

    test('should automatically switch to another repository endpoint if there are no retries configured', () => {
      repoClientConfig.retryCount = 0;
      repositoryClient = new TestRepositoryClient(repoClientConfig);

      let httpClient1 = repositoryClient.httpClients[0];
      stubHttpClient(httpClient1, [503]);

      // Second endpoint should be successful
      let httpClient2 = repositoryClient.httpClients[1];
      stubHttpClient(httpClient2, [200]);

      let httpClient3 = repositoryClient.httpClients[2];
      stubHttpClient(httpClient3, [503]);

      return repositoryClient.execute((client) => client.get('url')).then(() => {
        expect(httpClient1.get).toHaveBeenCalledTimes(1);
        expect(httpClient2.get).toHaveBeenCalledTimes(1);
        expect(httpClient3.get).toHaveBeenCalledTimes(0);
      });
    });

    test('should reject if all repository endpoint have unsuccessful responses', () => {
      let httpClient1 = repositoryClient.httpClients[0];
      stubHttpClient(httpClient1, [503, 503, 503]);

      let httpClient2 = repositoryClient.httpClients[1];
      stubHttpClient(httpClient2, [503, 503, 503]);

      let httpClient3 = repositoryClient.httpClients[2];
      stubHttpClient(httpClient3, [503, 503, 503]);

      return repositoryClient.execute((client) => client.get('url')).catch(() => {
        expect(httpClient1.get).toHaveBeenCalledTimes(3);
        expect(httpClient2.get).toHaveBeenCalledTimes(3);
        expect(httpClient3.get).toHaveBeenCalledTimes(3);
      });
    });

    test('should reject if the repository endpoint(s) is unreachable', () => {
      let httpClient1 = repositoryClient.httpClients[0];
      httpClient1.get.mockRejectedValue({});

      let httpClient2 = repositoryClient.httpClients[1];
      httpClient2.get.mockRejectedValue({});

      let httpClient3 = repositoryClient.httpClients[2];
      httpClient3.get.mockRejectedValue({});

      return repositoryClient.execute((client) => client.get('url')).catch(() => {
        expect(httpClient1.get).toHaveBeenCalledTimes(3);
        expect(httpClient2.get).toHaveBeenCalledTimes(3);
        expect(httpClient3.get).toHaveBeenCalledTimes(3);
      });
    });

    test('should automatically switch to another repository endpoint if the previous is unreachable', () => {
      let httpClient1 = repositoryClient.httpClients[0];
      httpClient1.get.mockRejectedValue({});

      let httpClient2 = repositoryClient.httpClients[1];
      httpClient2.get.mockRejectedValue({});

      // Should manage to the response on the first retry
      let httpClient3 = repositoryClient.httpClients[2];
      stubHttpClient(httpClient3, [503, 200, 200]);

      return repositoryClient.execute((client) => client.get('url')).then(() => {
        expect(httpClient1.get).toHaveBeenCalledTimes(2);
        expect(httpClient2.get).toHaveBeenCalledTimes(2);
        expect(httpClient3.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  function stubHttpClient(client, statuses) {
    client.get = jest.fn();
    statuses.forEach(status => {
      if (status < 400) {
        client.get.mockResolvedValueOnce({});
      } else {
        client.get.mockRejectedValueOnce({response: {status: status}});
      }
    });
  }

});


class TestRepositoryClient extends BaseRepositoryClient {
}
