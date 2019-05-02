const HttpClient = require('http/http-client');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const GetQueryPayload = require('query/query-payload');
const QueryLanguage = require('query/query-language');
const QueryType = require('query/query-type');
const RDFMimeType = require('http/rdf-mime-type');
const {ObjectReadableMock} = require('stream-mock');

const httpClientStub = require('../http/http-client.stub');

jest.mock('http/http-client');

describe('RDFRepositoryClient - query', () => {
  let config;
  let repository;

  beforeEach(() => {
    HttpClient.mockImplementation(() => httpClientStub());
  });

  test('should execute query and stream the result', (done) => {
    config = new RepositoryClientConfig(
      ['http://host/repositories/repo1'], {}, '', 1000, 1000);

    repository = new RDFRepositoryClient(config);

    const source = streamSource();
    const reader = new ObjectReadableMock(source);
    const expected = expectedStream();
    const expectedIt = expected[Symbol.iterator]();

    repository.httpClients[0].post.mockResolvedValue({
      data: reader
    });

    const payload = new GetQueryPayload()
      .setQuery('select * where {?s ?p ?o}')
      .setQueryType(QueryType.SELECT)
      .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
      .setLimit(100);

    return repository.query(payload).then((stream) => {
      stream.on('data', (chunk) => {
        expect(chunk).toEqual(expectedIt.next().value);
      });
      stream.on('end', done);
    });
  });

  test('should make a POST request with proper parameters and headers', () => {
    config = new RepositoryClientConfig(
      ['http://host/repositories/repo1'], {}, '', 1000, 1000);

    repository = new RDFRepositoryClient(config);

    const postMock = repository.httpClients[0].post;

    const payload = new GetQueryPayload()
      .setQuery('select * where {?s ?p ?o}')
      .setQueryType(QueryType.SELECT)
      .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
      .setQueryLn(QueryLanguage.SPARQL)
      .setInference(true)
      .setDistinct(true)
      .setLimit(100)
      .setOffset(0)
      .setTimeout(5);

    return repository.query(payload).then(() => {
      expect(postMock).toHaveBeenCalledTimes(1);
      expect(postMock).toHaveBeenCalledWith('',
        'query=select%20*%20where%20%7B%3Fs%20%3Fp%20%3Fo%7D&queryLn=sparql&infer=true&distinct=true&limit=100&offset=0&timeout=5', {
          headers: {
            'Accept': 'application/sparql-results+json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          responseType: 'stream',
          timeout: 1000
        });
    });
  });

  function streamSource() {
    return [
      '<rdf:Description rdf:about="http://www.w3.org/1999/02/22-rdf-syntax-ns#type"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description>',
      '<rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#subPropertyOf"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/><rdf:type rdf:resource="http://www.w3.org/2002/07/owl#TransitiveProperty"/></rdf:Description>',
      '<rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#domain"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description>'
    ];
  }

  function expectedStream() {
    return [
      '<rdf:Description rdf:about="http://www.w3.org/1999/02/22-rdf-syntax-ns#type"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description>',
      '<rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#subPropertyOf"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/><rdf:type rdf:resource="http://www.w3.org/2002/07/owl#TransitiveProperty"/></rdf:Description>',
      '<rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#domain"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description>'
    ];
  }
});
