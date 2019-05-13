const RepositoryClientConfig = require('repository/repository-client-config');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const ServerClientConfig = require('server/server-client-config');
const HttpClient = require('http/http-client');
const httpClientStub = require('../http/http-client.stub');
const {when} = require('jest-when');

jest.mock('http/http-client');

/*
 * Tests the initialization logic in RDFRepositoryClient
 */
describe('RDFRepositoryClient', () => {

  HttpClient.mockImplementation(() => httpClientStub());

  let defaultHeaders = {
    'Accept': 'application/json'
  };

  test('should initialize according the provided client configuration', () => {
    let repoClientConfig = new RepositoryClientConfig([
      'http://localhost:8080/repositories/test'
    ], defaultHeaders, 'application/json', 100, 200);

    let rdfRepositoryClient = new RDFRepositoryClient(repoClientConfig);

    expect(rdfRepositoryClient.repositoryClientConfig).toBeDefined();
    expect(rdfRepositoryClient.repositoryClientConfig).toEqual(repoClientConfig);

    expect(rdfRepositoryClient.httpClients).toBeDefined();
    expect(rdfRepositoryClient.httpClients.length).toEqual(1);
    expect(rdfRepositoryClient.httpClients[0].setDefaultHeaders).toHaveBeenCalledWith(defaultHeaders);
    expect(rdfRepositoryClient.httpClients[0].setDefaultReadTimeout).toHaveBeenCalledWith(100);
    expect(rdfRepositoryClient.httpClients[0].setDefaultWriteTimeout).toHaveBeenCalledWith(200);
  });

  test('should initialize with multiple endpoints from the client configuration', () => {
    let repoClientConfig = new RepositoryClientConfig([
      'http://localhost:8081/repositories/test1',
      'http://localhost:8082/repositories/test2',
      'http://localhost:8083/repositories/test3'
    ], {
      'Accept': 'application/json'
    }, 'application/json', 100, 200);

    let rdfRepositoryClient = new RDFRepositoryClient(repoClientConfig);

    expect(rdfRepositoryClient.httpClients).toBeDefined();
    expect(rdfRepositoryClient.httpClients.length).toEqual(3);

    rdfRepositoryClient.httpClients.forEach((httpClient) => {
      expect(httpClient.setDefaultHeaders).toHaveBeenCalledWith(defaultHeaders);
    });
  });

  test('should not allow to be instantiated with improper configuration', () => {
    expect(() => new RDFRepositoryClient()).toThrow(Error);
    expect(() => new RDFRepositoryClient({})).toThrow(Error);
    expect(() => new RDFRepositoryClient(new ServerClientConfig('', 1, {}))).toThrow(Error);
    expect(() => new RDFRepositoryClient(new RepositoryClientConfig([]))).toThrow(Error);
  });

  describe('getSize()', () => {

    let rdfRepositoryClient;
    let get;

    beforeEach(() => {
      let repoClientConfig = new RepositoryClientConfig([
        'http://localhost:8080/repositories/test'
      ], defaultHeaders, 'application/json', 100, 200);
      rdfRepositoryClient = new RDFRepositoryClient(repoClientConfig);
      get = rdfRepositoryClient.httpClients[0].get;
      when(get).calledWith('/size').mockResolvedValue({data: 123});
    });

    test('should retrieve the number of statements in the repository', () => {
      return expect(rdfRepositoryClient.getSize()).resolves.toEqual(123);
    });

    test('should properly request the number of statements in the repository', () => {
      return rdfRepositoryClient.getSize().then(() => {
        expect(get).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenCalledWith('/size', {
          params: {
            context: undefined
          }
        });
      });
    });

    test('should properly request the number of statements in the repository for the specified contexts', () => {
      return rdfRepositoryClient.getSize(['context-1']).then(() => {
        expect(get).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenCalledWith('/size', {
          params: {
            context: ['context-1']
          }
        });
      });
    });

    test('should reject size retrieving when the server request is unsuccessful', () => {
      when(get).calledWith('/size').mockRejectedValue('get-size-error');
      return expect(rdfRepositoryClient.getSize()).rejects.toEqual('get-size-error');
    });
  });

});
