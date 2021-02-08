const HttpClient = require('http/http-client');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const ClientConfigBuilder = require('http/client-config-builder');
const TransactionalRepositoryClient =
  require('transaction/transactional-repository-client');
const TransactionIsolationLevel =
  require('transaction/transaction-isolation-level');
const GetStatementsPayload = require('repository/get-statements-payload');
const RDFMimeType = require('http/rdf-mime-type');
const FileUtils = require('util/file-utils');
const AddStatementPayload = require('repository/add-statement-payload');
const GetQueryPayload = require('query/get-query-payload');
const QueryType = require('query/query-type');
const UpdateQueryPayload = require('query/update-query-payload');
const QueryContentType = require('http/query-content-type');
const HttpRequestBuilder = require('http/http-request-builder');
const Stream = require('stream');

const {namedNode, literal, quad} = require('n3').DataFactory;

const httpClientStub = require('../http/http-client.stub');
const testUtils = require('../utils');
const path = require('path');

jest.mock('http/http-client');

describe('RDFRepositoryClient - transactions', () => {
  let repoClientConfig;
  let rdfRepositoryClient;
  let httpRequest;

  const defaultHeaders = {
    'Accept': 'application/json'
  };
  const transactionUrl = 'http://localhost:8080/repositories/test/transactions/64a5937f-c112-d014-a044-f0123b93';

  const context = '<urn:x-local:graph1>';
  const baseURI = '<urn:x-local:graph2>';

  const testFilePath = path.resolve(__dirname,
    './data/add-statements-complex.txt');

  beforeEach(() => {
    repoClientConfig = new ClientConfigBuilder().repositoryConfig('http://localhost:8080')
      .setEndpoints([
        'http://localhost:8080/repositories/test',
        'http://localhost:8081/repositories/test'
      ])
      .setHeaders(defaultHeaders)
      .setReadTimeout(100)
      .setWriteTimeout(200);

    HttpClient.mockImplementation((baseUrl) => httpClientStub(baseUrl));

    rdfRepositoryClient = new RDFRepositoryClient(repoClientConfig);
    httpRequest = rdfRepositoryClient.httpClients[0].request;

    const response = {
      headers: {
        'location': transactionUrl
      }
    };
    httpRequest.mockResolvedValue(response);
  });

  describe('beginTransaction()', () => {
    test('should start a transaction and produce transactional client', () => {
      return rdfRepositoryClient.beginTransaction()
        .then((transactionalClient) => {
          expect(transactionalClient).
            toBeInstanceOf(TransactionalRepositoryClient);

          const transactionalConfig = transactionalClient
            .repositoryClientConfig;
          expect(transactionalConfig).toBeDefined();
          expect(transactionalConfig.endpoints).toEqual([transactionUrl]);
          expect(transactionalConfig.defaultRDFContentType)
            .toEqual(repoClientConfig.defaultRDFContentType);
          expect(transactionalConfig.headers).toEqual(repoClientConfig.headers);
          expect(transactionalConfig.readTimeout)
            .toEqual(repoClientConfig.readTimeout);
          expect(transactionalConfig.writeTimeout)
            .toEqual(repoClientConfig.writeTimeout);

          // Transactions must be executed against single endpoint
          expect(transactionalClient.httpClients).toBeDefined();
          expect(transactionalClient.httpClients.length).toEqual(1);
          expect(transactionalClient.httpClients[0].baseUrl)
            .toEqual(transactionUrl);
          expect(transactionalClient.httpClients[0].setDefaultHeaders)
            .toHaveBeenCalledWith(defaultHeaders);

          expect(transactionalClient.isActive()).toEqual(true);

          expect(httpRequest).toHaveBeenCalledTimes(1);
          expect(httpRequest)
            .toHaveBeenCalledWith(HttpRequestBuilder.httpPost('/transactions'));
        });
    });

    test('should start a transaction with specified isolation level', () => {
      return rdfRepositoryClient
        .beginTransaction(TransactionIsolationLevel.READ_UNCOMMITTED)
        .then((transactionalClient) => {
          expect(transactionalClient)
            .toBeInstanceOf(TransactionalRepositoryClient);

          const expectedRequest = HttpRequestBuilder.httpPost('/transactions')
            .setParams({
              'isolation-level': TransactionIsolationLevel.READ_UNCOMMITTED
            });
          expect(httpRequest).toHaveBeenCalledTimes(1);
          expect(httpRequest).toHaveBeenCalledWith(expectedRequest);
        });
    });

    test('should start a transaction that can be committed', () => {
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then((client) => {
        transactionalClient = client;
        return transactionalClient.commit();
      }).then(() => {
        const expectedRequest = HttpRequestBuilder.httpPut('').setParams({
          action: 'COMMIT'
        });
        const transactionalHttpRequest =
          transactionalClient.httpClients[0].request;
        expect(transactionalHttpRequest).toHaveBeenCalledTimes(1);
        expect(transactionalHttpRequest).toHaveBeenCalledWith(expectedRequest);
        expect(transactionalClient.isActive()).toEqual(false);
      });
    });

    test('should start a transaction that can be rollbacked', () => {
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then((client) => {
        transactionalClient = client;
        return transactionalClient.rollback();
      }).then(() => {
        const transactionalHttpRequest =
          transactionalClient.httpClients[0].request;
        expect(transactionalHttpRequest).toHaveBeenCalledTimes(1);
        expect(transactionalHttpRequest)
          .toHaveBeenCalledWith(HttpRequestBuilder.httpDelete(''));
        expect(transactionalClient.isActive()).toEqual(false);
      });
    });

    test('should reject if it cannot start a transaction', () => {
      const err = new Error('Cannot begin transaction');
      httpRequest.mockRejectedValue(err);
      return expect(rdfRepositoryClient.beginTransaction())
        .rejects.toEqual(err);
    });

    test('should disallow using inactive transaction after commit', () => {
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then((client) => {
        transactionalClient = client;
        return transactionalClient.commit();
      }).then(() => {
        expect(() => transactionalClient.getSize()).toThrow();
        expect(() => transactionalClient.commit()).toThrow();
        expect(() => transactionalClient.rollback()).toThrow();
      });
    });

    test('should reject if the transactional client cannot commit ' +
      'in case of server error', () => {
      const err = new Error('cannot commit');
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then((client) => {
        transactionalClient = client;
        transactionalClient.httpClients[0].request.mockRejectedValue(err);
        return expect(transactionalClient.commit()).rejects.toEqual(err);
      });
    });

    test('should disallow using inactive transaction after ' +
      'commit failure', () => {
      const err = new Error('cannot commit');
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then((client) => {
        transactionalClient = client;
        transactionalClient.httpClients[0].request.mockRejectedValue(err);
        return transactionalClient.commit();
      }).catch(() => {
        expect(() => transactionalClient.getSize()).toThrow();
        expect(() => transactionalClient.commit()).toThrow();
        expect(() => transactionalClient.rollback()).toThrow();
      });
    });

    test('should disallow using inactive transaction after rollback', () => {
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then((client) => {
        transactionalClient = client;
        return transactionalClient.rollback();
      }).then(() => {
        expect(() => transactionalClient.getSize()).toThrow();
        expect(() => transactionalClient.commit()).toThrow();
        expect(() => transactionalClient.rollback()).toThrow();
      });
    });

    test('should reject if the transactional client cannot rollback ' +
      'in case of server error', () => {
      const err = new Error('cannot rollback');
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then((client) => {
        transactionalClient = client;
        transactionalClient.httpClients[0].request.mockRejectedValue(err);
        return expect(transactionalClient.rollback()).rejects.toEqual(err);
      });
    });

    test('should disallow using inactive transaction after ' +
      'rollback failure', () => {
      const err = new Error('cannot rollback');
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then((client) => {
        transactionalClient = client;
        transactionalClient.httpClients[0].request.mockRejectedValue(err);
        return transactionalClient.rollback();
      }).catch(() => {
        expect(() => transactionalClient.getSize()).toThrow();
        expect(() => transactionalClient.commit()).toThrow();
        expect(() => transactionalClient.rollback()).toThrow();
      });
    });

    test('should reject if it cannot obtain transaction ID', () => {
      // Reset headers
      const response = {headers: {}};
      httpRequest.mockResolvedValue(response);
      return expect(rdfRepositoryClient.beginTransaction()).rejects
        .toEqual(Error('Couldn\'t obtain transaction ID'));
    });
  });

  describe('Having started transaction', () => {
    let transaction;
    let transactionHttpRequest;

    const data = '<http://domain/resource/resource-1> <http://domain/property/relation-1> "Title"@en.';

    beforeEach(() => {
      return rdfRepositoryClient.beginTransaction().then((tr) => {
        transaction = tr;
        transactionHttpRequest = transaction.httpClients[0].request;
      });
    });

    describe('getSize()', () => {
      test('should retrieve the repository size', () => {
        transactionHttpRequest.mockResolvedValue({data: 123});
        return transaction.getSize().then((size) => {
          expect(size).toEqual(123);

          const expectedRequest = HttpRequestBuilder.httpPut('').setParams({
            action: 'SIZE',
            context: undefined
          });
          expect(transactionHttpRequest).toHaveBeenCalledTimes(1);
          expect(transactionHttpRequest).toHaveBeenCalledWith(expectedRequest);
        });
      });

      test('should retrieve the repository size in specific context', () => {
        transactionHttpRequest.mockResolvedValue({data: 123});
        return transaction.getSize('<http://domain/context>').then((size) => {
          expect(size).toEqual(123);

          const expectedRequest = HttpRequestBuilder.httpPut('').setParams({
            action: 'SIZE',
            context: '<http://domain/context>'
          });
          expect(transactionHttpRequest).toHaveBeenCalledTimes(1);
          expect(transactionHttpRequest).toHaveBeenCalledWith(expectedRequest);
        });
      });

      test('should reject if the transaction cannot retrieve ' +
        'the repository size', () => {
        transactionHttpRequest.mockRejectedValue('Error during size retrieve');
        return expect(transaction.getSize()).rejects
          .toEqual('Error during size retrieve');
      });
    });

    describe('get()', () => {
      test('should retrieve statements', () => {
        const data = testUtils.loadFile(testFilePath).trim();
        transactionHttpRequest.mockResolvedValue({data});
        return transaction.get(getStatementPayload()).then((result) => {
          expect(result).toEqual(data);
        });
      });

      test('should properly request to retrieve statements', () => {
        return transaction.get(getStatementPayload()).then(() => {
          const expectedRequest = HttpRequestBuilder.httpPut('')
            .setHeaders({
              'Accept': RDFMimeType.RDF_JSON
            })
            .setParams({
              action: 'GET',
              context: '<http://example.org/graph3>',
              infer: true,
              obj: '"7931000"^^http://www.w3.org/2001/XMLSchema#integer',
              pred: '<http://eunis.eea.europa.eu/rdf/schema.rdf#population>',
              subj: '<http://eunis.eea.europa.eu/countries/AZ>'
            });
          expect(transactionHttpRequest).toHaveBeenCalledTimes(1);
          expect(transactionHttpRequest).toHaveBeenCalledWith(expectedRequest);
        });
      });

      test('should reject if the transaction cannot ' +
        'retrieve statements', () => {
        transactionHttpRequest.mockRejectedValue('Error during retrieve');
        return expect(transaction.get(getStatementPayload())).rejects
          .toEqual('Error during retrieve');
      });
    });

    describe('query()', () => {
      const payload = new GetQueryPayload()
        .setQuery('ask {?s ?p ?o}')
        .setQueryType(QueryType.ASK)
        .setResponseType(RDFMimeType.BOOLEAN_RESULT)
        .setContentType(QueryContentType.SPARQL_QUERY)
        .setTimeout(5);

      test('should query data', () => {
        transactionHttpRequest.mockResolvedValue({data: true});
        return transaction.query(payload).then((response) => {
          expect(response).toEqual(true);
        });
      });

      test('should properly perform query request', () => {
        transactionHttpRequest.mockResolvedValue({data: true});
        return transaction.query(payload).then(() => {
          const expectedRequest = HttpRequestBuilder.httpPut('')
            .setData('ask {?s ?p ?o}')
            .setHeaders({
              'Accept': 'text/boolean',
              'Content-Type': QueryContentType.SPARQL_QUERY
            })
            .setParams({
              action: 'QUERY'
            })
            .setResponseType('stream');
          expect(transactionHttpRequest).toHaveBeenCalledTimes(1);
          expect(transactionHttpRequest).toHaveBeenCalledWith(expectedRequest);
        });
      });

      test('should reject if the transaction cannot perform ' +
        'a query request', () => {
        const err = new Error('Cannot query');
        transactionHttpRequest.mockRejectedValue(err);
        return expect(transaction.query(payload)).rejects.toEqual(err);
      });
    });

    describe('update()', () => {
      const updatePayload = new UpdateQueryPayload()
        .setContentType(QueryContentType.SPARQL_UPDATE)
        .setQuery('INSERT {?s ?p ?o} WHERE {?s ?p ?o}');

      test('should perform update with proper request', () => {
        return transaction.update(updatePayload).then(() => {
          const expectedRequest = HttpRequestBuilder.httpPut('')
            .setData('INSERT {?s ?p ?o} WHERE {?s ?p ?o}')
            .setHeaders({
              'Content-Type': QueryContentType.SPARQL_UPDATE
            })
            .setParams({
              action: 'UPDATE'
            });
          expect(transactionHttpRequest).toHaveBeenCalledTimes(1);
          expect(transactionHttpRequest).toHaveBeenCalledWith(expectedRequest);
        });
      });

      test('should reject if the transaction cannot perform ' +
        'an update request', () => {
        const err = new Error('Cannot update');
        transactionHttpRequest.mockRejectedValue(err);
        return expect(transaction.update(updatePayload)).rejects.toEqual(err);
      });

      test('should resolve to empty response (HTTP 204)', () => {
        return expect(transaction.update(updatePayload)).resolves.toEqual();
      });
    });

    describe('add()', () => {
      let payload = new AddStatementPayload()
        .setSubject('http://domain/resource/resource-1')
        .setPredicate('http://domain/property/relation-1')
        .setObject('http://domain/value/uri-1')
        .setContext('http://domain/graph/data-graph-1')
        .setBaseURI(baseURI);

      test('should convert the payload to proper Turtle and ' +
        'send it to the server', () => {
        const expectedData = testUtils
          .loadFile('repository/data/add-statements-context.txt').trim();
        return transaction.add(payload).then(() => {
          expectInsertedData(expectedData, '<http://domain/graph/data-graph-1>', baseURI);
        });
      });

      test('should convert the literal payload to proper Turtle and ' +
        'send it to the server', () => {
        payload = new AddStatementPayload()
          .setSubject('http://domain/resource/resource-1')
          .setPredicate('http://domain/property/property-1')
          .setObject('Title')
          .setLanguage('en')
          .setContext('http://domain/graph/data-graph-1')
          .setBaseURI(baseURI);

        const expectedData = testUtils
          .loadFile('repository/data/add-statements-context-literal.txt')
          .trim();
        return transaction.add(payload).then(() => {
          expectInsertedData(expectedData, '<http://domain/graph/data-graph-1>', baseURI);
        });
      });

      test('should throw error when a payload is not provided', () => {
        expect(() => transaction.add())
          .toThrow(Error('Cannot add statement without payload'));
        expectNoInsertedData();
      });

      test('should reject adding the payload if it is empty', () => {
        const payload = new AddStatementPayload();
        expect(() => transaction.add(payload)).toThrow(Error);
        expectNoInsertedData();
      });

      test('should reject adding the payload if it lacks ' +
        'required terms', () => {
        const payload = new AddStatementPayload()
          .setSubject('http://domain/resource/resource-1')
          .setPredicate('http://domain/property/property-1');
        expect(() => transaction.add(payload)).toThrow(Error);
        expectNoInsertedData();
      });

      test('should reject if the transaction cannot insert statements', () => {
        transactionHttpRequest.mockRejectedValue('Error during add');
        return expect(transaction.add(payload)).rejects
          .toEqual('Error during add');
      });

      test('should resolve to empty response (HTTP 204)', () => {
        return expect(transaction.add(payload)).resolves.toEqual();
      });
    });

    describe('addQuads()', () => {
      test('should add quads', () => {
        const q = quad(
          namedNode('http://domain/resource/resource-1'),
          namedNode('http://domain/property/relation-1'),
          literal('Title', 'en'));

        return transaction.addQuads([q]).then(() => {
          expectInsertedData(data, undefined, undefined);
        });
      });

      test('should support adding quads in given context and base URI ' +
        'for resolving', () => {
        const q = quad(
          namedNode('http://domain/resource/resource-1'),
          namedNode('http://domain/property/relation-1'),
          literal('Title', 'en'));

        return transaction.addQuads([q], context, baseURI).then(() => {
          expectInsertedData(data, context, baseURI);
        });
      });

      test('should reject if the transaction cannot add quads', () => {
        const q = quad(
          namedNode('http://domain/resource/resource-1'),
          namedNode('http://domain/property/relation-1'),
          literal('Title', 'en'));

        transactionHttpRequest.mockRejectedValue('Error during quads add');
        return expect(transaction.addQuads([q])).rejects
          .toEqual('Error during quads add');
      });

      test('should resolve to empty response (HTTP 204)', () => {
        const q = quad(
          namedNode('http://domain/resource/resource-1'),
          namedNode('http://domain/property/relation-1'),
          literal('Title', 'en'));
        return expect(transaction.addQuads([q])).resolves.toEqual();
      });
    });

    function expectInsertedData(expectedData, expectedContext,
      expectedBaseURI) {
      const expectedRequest = HttpRequestBuilder.httpPut('')
        .setData(expectedData)
        .setHeaders({
          'Content-Type': RDFMimeType.TRIG
        })
        .setParams({
          action: 'ADD',
          context: expectedContext,
          baseURI: expectedBaseURI
        });
      expect(transactionHttpRequest).toHaveBeenCalledTimes(1);
      expect(transactionHttpRequest).toHaveBeenCalledWith(expectedRequest);
    }

    function expectNoInsertedData() {
      expect(transactionHttpRequest).toHaveBeenCalledTimes(0);
    }

    describe('deleteData()', () => {
      test('should delete data', () => {
        return transaction.deleteData(data).then(() => {
          const expectedRequest = HttpRequestBuilder.httpPut('')
            .setData(data)
            .setHeaders({
              'Content-Type': RDFMimeType.TRIG
            })
            .setParams({
              action: 'DELETE'
            });
          expect(transactionHttpRequest).toHaveBeenCalledTimes(1);
          expect(transactionHttpRequest).toHaveBeenCalledWith(expectedRequest);
        });
      });

      test('should require data when deleting', () => {
        expect(() => transaction.deleteData()).toThrow();
        expect(() => transaction.deleteData('')).toThrow();
        expect(() => transaction.deleteData('  ')).toThrow();
        expect(transactionHttpRequest).toHaveBeenCalledTimes(0);
      });

      test('should reject if the transaction cannot delete data', () => {
        transactionHttpRequest.mockRejectedValue('Error during delete');
        return expect(transaction.deleteData(data)).rejects
          .toEqual('Error during delete');
      });

      test('should resolve to empty response (HTTP 204)', () => {
        return expect(transaction.deleteData(data)).resolves.toEqual();
      });
    });

    describe('download()', () => {
      test('should download data', () => {
        transactionHttpRequest.mockResolvedValue({
          data: FileUtils.getReadStream(testFilePath)
        });
        return transaction.download(getStatementPayload())
          .then((dataStream) => {
            return testUtils.readStream(dataStream);
          }).then((data) => {
            const turtleData = testUtils.loadFile(testFilePath).trim();
            expect(data).toEqual(turtleData);
          });
      });

      test('should properly request to download data', () => {
        transactionHttpRequest.mockResolvedValue({
          data: FileUtils.getReadStream(testFilePath)
        });
        return transaction.download(getStatementPayload()).then(() => {
          const expectedRequest = HttpRequestBuilder.httpPut('')
            .setHeaders({
              'Accept': RDFMimeType.RDF_JSON
            })
            .setParams({
              action: 'GET',
              context: '<http://example.org/graph3>',
              infer: true,
              obj: '"7931000"^^http://www.w3.org/2001/XMLSchema#integer',
              pred: '<http://eunis.eea.europa.eu/rdf/schema.rdf#population>',
              subj: '<http://eunis.eea.europa.eu/countries/AZ>'
            })
            .setResponseType('stream');
          expect(transactionHttpRequest).toHaveBeenCalledTimes(1);
          expect(transactionHttpRequest).toHaveBeenCalledWith(expectedRequest);
        });
      });

      test('should reject if the transaction cannot download data', () => {
        const err = new Error('Cannot download data');
        transactionHttpRequest.mockRejectedValue(err);
        return expect(transaction.download(getStatementPayload())).rejects
          .toEqual(err);
      });
    });

    describe('upload()', () => {
      test('should upload data stream in given context and base URI', () => {
        const turtleStream = FileUtils.getReadStream(testFilePath);

        return transaction
          .upload(turtleStream, RDFMimeType.TRIG, context, baseURI)
          .then(() => {
            expect(transactionHttpRequest).toHaveBeenCalledTimes(1);
            const requestBuilder = transactionHttpRequest.mock.calls[0][0];
            verifyUploadRequestBuilder(requestBuilder);
            return testUtils.readStream(requestBuilder.getData());
          }).then((streamData) => {
            const turtleData = testUtils.loadFile(testFilePath).trim();
            expect(streamData).toEqual(turtleData);
          });
      });

      test('should reject if the server cannot consume ' +
        'the upload request', () => {
        const error = new Error('cannot-upload');
        transactionHttpRequest.mockRejectedValue(error);

        const turtleStream = FileUtils.getReadStream(testFilePath);
        const promise = transaction
          .upload(turtleStream, RDFMimeType.TRIG, context, null);
        return expect(promise).rejects.toEqual(error);
      });

      test('should resolve to empty response (HTTP 204)', () => {
        const turtleStream = FileUtils.getReadStream(testFilePath);
        return expect(transaction
          .upload(turtleStream, RDFMimeType.TRIG, context, baseURI)).resolves
          .toEqual();
      });
    });

    describe('addFile()', () => {
      const testFilePath = path
        .resolve(__dirname, './data/add-statements-complex.txt');

      test('should upload file with data as stream in given context ' +
        'and base URI', () => {
        return transaction
          .addFile(testFilePath, RDFMimeType.TRIG, context, baseURI)
          .then(() => {
            expect(transactionHttpRequest).toHaveBeenCalledTimes(1);
            const requestBuilder = transactionHttpRequest.mock.calls[0][0];
            verifyUploadRequestBuilder(requestBuilder);
            return testUtils.readStream(requestBuilder.getData());
          }).then((streamData) => {
            const turtleData = testUtils.loadFile(testFilePath).trim();
            expect(streamData).toEqual(turtleData);
          });
      });

      test('should reject if the server cannot consume the file ' +
        'upload request', () => {
        const error = new Error('cannot-upload');
        transactionHttpRequest.mockRejectedValue(error);

        const promise = transaction
          .addFile(testFilePath, RDFMimeType.TRIG, context, null);
        return expect(promise).rejects.toEqual(error);
      });

      test('should disallow uploading missing files', () => {
        expect(() => transaction
          .addFile(null, RDFMimeType.TRIG, context, baseURI))
          .toThrow(Error);
        expect(() => transaction
          .addFile('', RDFMimeType.TRIG, context, baseURI))
          .toThrow(Error);
        expect(() => transaction
          .addFile('missing-file-123', RDFMimeType.TRIG, context, baseURI))
          .toThrow(Error);
      });

      test('should resolve to empty response (HTTP 204)', () => {
        return expect(transaction
          .addFile(testFilePath, RDFMimeType.TRIG, context, baseURI)).resolves
          .toEqual();
      });
    });

    function verifyUploadRequestBuilder(requestBuilder) {
      expect(requestBuilder).toBeInstanceOf(HttpRequestBuilder);
      expect(requestBuilder.getMethod()).toEqual('put');
      expect(requestBuilder.getUrl()).toEqual('');
      expect(requestBuilder.getData()).toBeInstanceOf(Stream);
      expect(requestBuilder.getHeaders()).toEqual({
        'Content-Type': RDFMimeType.TRIG
      });
      expect(requestBuilder.getParams()).toEqual({
        action: 'ADD',
        baseURI,
        context
      });
      expect(requestBuilder.getResponseType()).toEqual('stream');
    }

    function getStatementPayload() {
      return new GetStatementsPayload()
        .setResponseType(RDFMimeType.RDF_JSON)
        .setSubject('<http://eunis.eea.europa.eu/countries/AZ>')
        .setPredicate('<http://eunis.eea.europa.eu/rdf/schema.rdf#population>')
        .setObject('"7931000"^^http://www.w3.org/2001/XMLSchema#integer')
        .setContext('<http://example.org/graph3>')
        .setInference(true);
    }
  });
});
