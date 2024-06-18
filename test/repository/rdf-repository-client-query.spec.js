const HttpClient = require('http/http-client');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const GetQueryPayload = require('query/get-query-payload');
const QueryLanguage = require('query/query-language');
const QueryType = require('query/query-type');
const RDFMimeType = require('http/rdf-mime-type');
const {ObjectReadableMock} = require('stream-mock');
const SparqlJsonResultParser = require('parser/sparql-json-result-parser');
const SparqlXmlResultParser = require('parser/sparql-xml-result-parser');
const DataFactory = require('n3').DataFactory;
const namedNode = DataFactory.namedNode;
const HttpRequestBuilder = require('http/http-request-builder');

const httpClientStub = require('../http/http-client.stub');

import data from './data/sparql-query-result';

jest.mock('http/http-client');

describe('RDFRepositoryClient - query', () => {
  let config;
  let repository;
  let httpRequest;

  beforeEach(() => {
    HttpClient.mockImplementation(() => httpClientStub());
    config = new RepositoryClientConfig('http://host')
      .setEndpoints(['http://host/repositories/repo1'])
      .setReadTimeout(1000)
      .setWriteTimeout(1000);
    repository = new RDFRepositoryClient(config);
    httpRequest = repository.httpClients[0].request;
  });

  describe('should execute query and stream the result', () => {
    let source;
    let reader;
    let expected;
    let expectedIt;

    beforeEach(() => {
      source = streamSource();
      reader = new ObjectReadableMock(source);
      expected = expectedStream();
      expectedIt = expected[Symbol.iterator]();
      httpRequest.mockResolvedValue({
        data: reader
      });
    });

    test('from SELECT query', (done) => {
      const payload = new GetQueryPayload()
        .setQuery('select * where {?s ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setLimit(100);

      repository.query(payload).then((stream) => {
        stream.on('data', (chunk) => {
          expect(chunk).toEqual(expectedIt.next().value);
        });
        stream.on('end', done);
      });
    });

    test('from DESCRIBE query', (done) => {
      const payload = new GetQueryPayload()
        .setQuery('PREFIX books: <http://www.example/book/> DESCRIBE books:book6')
        .setQueryType(QueryType.DESCRIBE)
        .setResponseType(RDFMimeType.RDF_XML)
        .setLimit(100);

      repository.query(payload).then((stream) => {
        stream.on('data', (chunk) => {
          expect(chunk).toEqual(expectedIt.next().value);
        });
        stream.on('end', done);
      });
    });

    test('from CONSTRUCT query', (done) => {
      const payload = new GetQueryPayload()
        .setQuery('PREFIX books: <http://www.example/book/> DESCRIBE books:book6')
        .setQueryType(QueryType.CONSTRUCT)
        .setResponseType(RDFMimeType.RDF_XML)
        .setLimit(100);

      repository.query(payload).then((stream) => {
        stream.on('data', (chunk) => {
          expect(chunk).toEqual(expectedIt.next().value);
        });
        stream.on('end', done);
      });
    });

    test('from ASK query', (done) => {
      const payload = new GetQueryPayload()
        .setQuery('ask {?s ?p ?o}')
        .setQueryType(QueryType.ASK)
        .setResponseType(RDFMimeType.BOOLEAN_RESULT)
        .setLimit(100);

      repository.query(payload).then((stream) => {
        stream.on('data', (chunk) => {
          expect(chunk).toEqual(expectedIt.next().value);
        });
        stream.on('end', done);
      });
    });
  });

  describe('should execute query and stream parsed to objects', () => {
    test('xml result', (done) => {
      const source = [data.select.xml];
      const reader = new ObjectReadableMock(source);
      const expected = expectedParsedStream();
      const expectedIt = expected[Symbol.iterator]();
      httpRequest.mockResolvedValue({
        data: reader
      });

      const payload = new GetQueryPayload()
        .setQuery('select * where {?s ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_XML)
        .setLimit(100);

      repository.registerParser(new SparqlXmlResultParser());

      repository.query(payload).then((stream) => {
        stream.on('data', (bindings) => {
          expect(bindings).toEqual(expectedIt.next().value);
        });
        stream.on('end', done);
      });
    });

    test('xml boolean result', (done) => {
      const source = [data.ask.xml];
      const reader = new ObjectReadableMock(source);
      httpRequest.mockResolvedValue({
        data: reader
      });

      const payload = new GetQueryPayload()
        .setQuery('ask {?s ?p ?o}')
        .setQueryType(QueryType.ASK)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_XML)
        .setLimit(100);

      repository.registerParser(new SparqlXmlResultParser());

      repository.query(payload).then((data) => {
        expect(data).toEqual(true);
        done();
      });
    });

    test('json result', (done) => {
      const source = [data.select.json];
      const reader = new ObjectReadableMock(source);
      const expected = expectedParsedStream();
      const expectedIt = expected[Symbol.iterator]();
      httpRequest.mockResolvedValue({
        data: reader
      });

      const payload = new GetQueryPayload()
        .setQuery('select * where {?s ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setLimit(100);

      repository.registerParser(new SparqlJsonResultParser());

      repository.query(payload).then((stream) => {
        stream.on('data', (bindings) => {
          expect(bindings).toEqual(expectedIt.next().value);
        });
        stream.on('end', done);
      });
    });

    test('json boolean result', (done) => {
      const source = [data.ask.json];
      const reader = new ObjectReadableMock(source);
      httpRequest.mockResolvedValue({
        data: reader
      });

      const payload = new GetQueryPayload()
        .setQuery('ask {?s ?p ?o}')
        .setQueryType(QueryType.ASK)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON);

      repository.registerParser(new SparqlJsonResultParser());

      repository.query(payload).then((data) => {
        expect(data).toEqual(false);
        done();
      });
    });
  });

  test('should make a POST request with proper parameters and headers', () => {
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

    const expectedData = 'query=select%20*%20where%20%7B%3Fs%20%3Fp%20%3Fo%7D' +
      '&queryLn=sparql&infer=true&distinct=true&limit=100&offset=0&timeout=5';
    const expectedRequestConfig = HttpRequestBuilder.httpPost('')
      .setData(expectedData)
      .setParams({
        'distinct': true,
        'infer': true,
        'limit': 100,
        'offset': 0,
        'query': 'select * where {?s ?p ?o}',
        'queryLn': 'sparql',
        'timeout': 5
      })
      .setHeaders({
        'Accept': 'application/sparql-results+json',
        'Content-Type': 'application/x-www-form-urlencoded'
      })
      .setResponseType('stream');

    return repository.query(payload).then(() => {
      expect(httpRequest).toHaveBeenCalledTimes(1);
      expect(httpRequest).toHaveBeenCalledWith(expectedRequestConfig);
    });
  });

  describe('on payload misconfiguration', () => {
    test('should throw error if responseType is not properly configured for ' +
      'CONSTRUCT query', () => {
      const payload = new GetQueryPayload()
        .setQuery('select * where {?s ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.RDF_XML);

      return expect(() => repository.query(payload)).toThrow(Error);
    });

    test('should throw error if responseType is not properly configured for ' +
      'DESCRIBE query', () => {
      const payload = new GetQueryPayload()
        .setQuery('PREFIX books: <http://www.example/book/> DESCRIBE books:book6')
        .setQueryType(QueryType.DESCRIBE)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON);

      return expect(() => repository.query(payload)).toThrow(Error);
    });

    test('should throw error if responseType is not properly configured for ' +
      'CONSTRUCT query', () => {
      const payload = new GetQueryPayload()
        .setQuery('construct {?s ?p ?o} where {?s ?p ?o}')
        .setQueryType(QueryType.CONSTRUCT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON);

      return expect(() => repository.query(payload)).toThrow(Error);
    });

    test('should throw error if responseType is not properly configured for ' +
      'ASK query', () => {
      const payload = new GetQueryPayload()
        .setQuery('ask {?s ?p ?o}')
        .setQueryType(QueryType.ASK)
        .setResponseType(RDFMimeType.BINARY_RDF);

      return expect(() => repository.query(payload)).toThrow(Error);
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

  function expectedParsedStream() {
    return [
      {
        p: namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        s: namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        o: namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property')
      },
      {
        p: namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        s: namedNode('http://www.w3.org/2000/01/rdf-schema#subPropertyOf'),
        o: namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property')
      },
      {
        p: namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        s: namedNode('http://www.w3.org/2000/01/rdf-schema#subPropertyOf'),
        o: namedNode('http://www.w3.org/2002/07/owl#TransitiveProperty')
      },
      {
        p: namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        s: namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
        o: namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property')
      }
    ];
  }
});
