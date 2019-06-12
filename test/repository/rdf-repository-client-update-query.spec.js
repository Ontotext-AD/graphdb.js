const HttpClient = require('http/http-client');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const UpdateQueryPayload = require('query/update-query-payload');
const QueryContentType = require('http/query-content-type');
const HttpRequestBuilder = require('http/http-request-builder');

const httpClientStub = require('../http/http-client.stub');

jest.mock('http/http-client');

describe('RDFRepositoryClient - update query', () => {
  let config;
  let repository;
  let httpRequest;

  beforeEach(() => {
    HttpClient.mockImplementation(() => httpClientStub());
    config = new RepositoryClientConfig()
      .addEndpoint('http://host/repositories/repo1')
      .setReadTimeout(1000)
      .setWriteTimeout(1000);
    repository = new RDFRepositoryClient(config);
    httpRequest = repository.httpClients[0].request;
  });

  test('should make a POST request with Content-Type/sparql-update header and unencoded sparql query as body', () => {
    const payload = new UpdateQueryPayload()
      .setQuery('INSERT {?s ?p ?o} WHERE {?s ?p ?o}');

    const expectedRequestConfig = HttpRequestBuilder.httpPost('/statements')
      .setData('INSERT {?s ?p ?o} WHERE {?s ?p ?o}')
      .setHeaders({
        'Content-Type': 'application/sparql-update'
      });

    return repository.update(payload).then(() => {
      expect(httpRequest).toHaveBeenCalledTimes(1);
      expect(httpRequest).toHaveBeenCalledWith(expectedRequestConfig);
    });
  });

  test('should make a POST request with Content-Type/x-www-form-urlencoded header and encoded query plus parameters as body', () => {
    const payload = new UpdateQueryPayload()
      .setQuery('INSERT {?s ?p ?o} WHERE {?s ?p ?o}')
      .setContentType(QueryContentType.X_WWW_FORM_URLENCODED)
      .setInference(true)
      .setDefaultGraphs('<http://example.org/graph1>')
      .setNamedGraphs('<http://example.org/graph2>')
      .setRemoveGraphs('<http://example.org/graph3>')
      .setInsertGraphs('<http://example.org/graph4>')
      .setTimeout(5);

    const expectedData = 'update=INSERT%20%7B%3Fs%20%3Fp%20%3Fo%7D%20WHERE%20%7B%3Fs%20%3Fp%20%3Fo%7D&infer=true&using-graph-uri=%3Chttp%3A%2F%2Fexample.org%2Fgraph1%3E&using-named-graph-uri=%3Chttp%3A%2F%2Fexample.org%2Fgraph2%3E&remove-graph-uri=%3Chttp%3A%2F%2Fexample.org%2Fgraph3%3E&insert-graph-uri=%3Chttp%3A%2F%2Fexample.org%2Fgraph4%3E&timeout=5';
    const expectedRequestConfig = HttpRequestBuilder.httpPost('/statements')
      .setData(expectedData)
      .setHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      });

    return repository.update(payload).then(() => {
      expect(httpRequest).toHaveBeenCalledTimes(1);
      expect(httpRequest).toHaveBeenCalledWith(expectedRequestConfig);
    });
  });

  describe('on payload misconfiguration', () => {
    test('should throw error if the query is missing', () => {
      const payload = new UpdateQueryPayload()
        .setContentType(QueryContentType.X_WWW_FORM_URLENCODED);

      return expect(() => repository.update(payload)).toThrow(Error('Parameter query is mandatory!'));
    });
  });

  test('should resolve to empty response (HTTP 204)', () => {
    const payload = new UpdateQueryPayload()
      .setQuery('INSERT {?s ?p ?o} WHERE {?s ?p ?o}');
    return expect(repository.update(payload)).resolves.toEqual();
  });
});
