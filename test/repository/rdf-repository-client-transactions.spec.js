const HttpClient = require('http/http-client');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const TransactionalRepositoryClient = require('transaction/transactional-repository-client');
const TransactionIsolationLevel = require('transaction/transaction-isolation-level');
const GetStatementsPayload = require('repository/get-statements-payload');
const RDFMimeType = require('http/rdf-mime-type');
const FileUtils = require('util/file-utils');

const {namedNode, literal, quad} = require('n3').DataFactory;

const httpClientStub = require('../http/http-client.stub');
const {when} = require('jest-when');
const testUtils = require('../utils');
const path = require('path');

jest.mock('http/http-client');

describe('RDFRepositoryClient - transactions', () => {

  let repoClientConfig;
  let rdfRepositoryClient;

  const defaultHeaders = {
    'Accept': 'application/json'
  };
  const transactionUrl = 'http://localhost:8080/repositories/test/transactions/64a5937f-c112-d014-a044-f0123b93';

  const context = '<urn:x-local:graph1>';
  const baseURI = '<urn:x-local:graph2>';

  beforeEach(() => {
    repoClientConfig = new RepositoryClientConfig([
      'http://localhost:8080/repositories/test',
      'http://localhost:8081/repositories/test'
    ], defaultHeaders, 'application/json', 100, 200);

    HttpClient.mockImplementation((baseUrl) => httpClientStub(baseUrl));

    rdfRepositoryClient = new RDFRepositoryClient(repoClientConfig);

    const response = {
      headers: {
        'location': transactionUrl
      }
    };
    when(rdfRepositoryClient.httpClients[0].post).calledWith('/transactions').mockResolvedValue(response);
  });

  describe('beginTransaction()', () => {

    let post;
    beforeEach(() => {
      post = rdfRepositoryClient.httpClients[0].post;
    });

    test('should start a transaction and produce transactional client', () => {
      return rdfRepositoryClient.beginTransaction().then(transactionalClient => {
        expect(transactionalClient).toBeInstanceOf(TransactionalRepositoryClient);

        const transactionalConfig = transactionalClient.repositoryClientConfig;
        expect(transactionalConfig).toBeDefined();
        expect(transactionalConfig.endpoints).toEqual([transactionUrl]);
        expect(transactionalConfig.defaultRDFContentType).toEqual(repoClientConfig.defaultRDFContentType);
        expect(transactionalConfig.headers).toEqual(repoClientConfig.headers);
        expect(transactionalConfig.readTimeout).toEqual(repoClientConfig.readTimeout);
        expect(transactionalConfig.writeTimeout).toEqual(repoClientConfig.writeTimeout);

        // Transactions must be executed against single endpoint
        expect(transactionalClient.httpClients).toBeDefined();
        expect(transactionalClient.httpClients.length).toEqual(1);
        expect(transactionalClient.httpClients[0].baseUrl).toEqual(transactionUrl);
        expect(transactionalClient.httpClients[0].setDefaultHeaders).toHaveBeenCalledWith(defaultHeaders);

        verifyTransactionStart();
        expect(transactionalClient.isActive()).toEqual(true);
      });
    });

    test('should start a transaction with specified isolation level', () => {
      return rdfRepositoryClient.beginTransaction(TransactionIsolationLevel.READ_UNCOMMITTED).then(transactionalClient => {
        expect(transactionalClient).toBeInstanceOf(TransactionalRepositoryClient);
        verifyTransactionStart(TransactionIsolationLevel.READ_UNCOMMITTED);
      });
    });

    function verifyTransactionStart(isolation) {
      expect(post).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith('/transactions', {
        params: {
          'isolation-level': isolation
        }
      });
    }

    test('should start a transaction that can be committed', () => {
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then(client => {
        transactionalClient = client;
        return transactionalClient.commit();
      }).then(() => {
        expect(transactionalClient.httpClients[0].put).toHaveBeenCalledTimes(1);
        expect(transactionalClient.httpClients[0].put).toHaveBeenCalledWith('', null, {
          params: {
            action: 'COMMIT'
          }
        });
        expect(transactionalClient.isActive()).toEqual(false);
      });
    });

    test('should start a transaction that can be rollbacked', () => {
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then(client => {
        transactionalClient = client;
        return transactionalClient.rollback();
      }).then(() => {
        expect(transactionalClient.httpClients[0].deleteResource).toHaveBeenCalledTimes(1);
        expect(transactionalClient.httpClients[0].deleteResource).toHaveBeenCalledWith('', null);
        expect(transactionalClient.isActive()).toEqual(false);
      });
    });

    test('should reject if it cannot start a transaction', () => {
      const err = new Error('Cannot begin transaction');
      when(post).calledWith('/transactions').mockRejectedValue(err);
      return expect(rdfRepositoryClient.beginTransaction()).rejects.toEqual(err);
    });

    test('should disallow using inactive transaction after commit', () => {
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then(client => {
        transactionalClient = client;
        return transactionalClient.commit();
      }).then(() => {
        expect(() => transactionalClient.getSize()).toThrow();
        expect(() => transactionalClient.commit()).toThrow();
        expect(() => transactionalClient.rollback()).toThrow();
      });
    });

    test('should disallow using inactive transaction after rollback', () => {
      let transactionalClient;
      return rdfRepositoryClient.beginTransaction().then(client => {
        transactionalClient = client;
        return transactionalClient.rollback();
      }).then(() => {
        expect(() => transactionalClient.getSize()).toThrow();
        expect(() => transactionalClient.commit()).toThrow();
        expect(() => transactionalClient.rollback()).toThrow();
      });
    });

    test('should reject if it cannot obtain transaction ID', () => {
      // Reset headers
      const response = {headers: {}};
      when(rdfRepositoryClient.httpClients[0].post).calledWith('/transactions').mockResolvedValue(response);
      return expect(rdfRepositoryClient.beginTransaction()).rejects.toEqual(Error('Couldn\'t obtain transaction ID'));
    });
  });

  describe('Having started transaction', () => {

    let transaction;
    let httpPut;

    const data = '<http://domain/resource/resource-1> <http://domain/property/relation-1> "Title"@en.';

    beforeEach(() => {
      return rdfRepositoryClient.beginTransaction().then(tr => {
        transaction = tr;
        httpPut = transaction.httpClients[0].put;
      });
    });

    describe('getSize()', () => {
      test('should retrieve the repository size', () => {
        httpPut.mockResolvedValue({data: 123});
        return transaction.getSize().then(size => {
          expect(size).toEqual(123);
          expect(httpPut).toHaveBeenCalledTimes(1);
          expect(httpPut).toHaveBeenCalledWith('', null, {
            params: {
              action: 'SIZE',
              context: undefined
            }
          });
        });
      });

      test('should retrieve the repository size in specific context', () => {
        httpPut.mockResolvedValue({data: 123});
        return transaction.getSize('<http://domain/context>').then(size => {
          expect(size).toEqual(123);
          expect(httpPut).toHaveBeenCalledTimes(1);
          expect(httpPut).toHaveBeenCalledWith('', null, {
            params: {
              action: 'SIZE',
              context: '<http://domain/context>'
            }
          });
        });
      });

      test('should reject if the transaction cannot retrieve the repository size', () => {
        httpPut.mockRejectedValue('Error during size retrieve');
        return expect(transaction.getSize()).rejects.toEqual('Error during size retrieve');
      });
    });

    describe('get()', () => {
      test('should retrieve statements', () => {
        // TODO: This is not testing parsing...
        httpPut.mockImplementation(() => {
          return Promise.resolve({data: ''});
        });

        return transaction.get(getStatementPayload()).then(() => {
          expect(httpPut).toHaveBeenCalledTimes(1);
          expect(httpPut).toHaveBeenCalledWith('', null, {
            headers: {'Accept': RDFMimeType.RDF_JSON},
            params: {
              action: 'GET',
              context: '<http://example.org/graph3>',
              infer: true,
              obj: '"7931000"^^http://www.w3.org/2001/XMLSchema#integer',
              pred: '<http://eunis.eea.europa.eu/rdf/schema.rdf#population>',
              subj: '<http://eunis.eea.europa.eu/countries/AZ>'
            }
          });
        });
      });

      test('should reject if the transaction cannot retrieve statements', () => {
        httpPut.mockRejectedValue('Error during retrieve');
        return expect(transaction.get(getStatementPayload())).rejects.toEqual('Error during retrieve');
      });
    });

    describe('addQuads()', () => {
      test('should add quads', () => {
        const q = quad(
          namedNode('http://domain/resource/resource-1'),
          namedNode('http://domain/property/relation-1'),
          literal('Title', 'en'));

        return transaction.addQuads([q]).then(() => {
          expect(httpPut).toHaveBeenCalledTimes(1);
          expect(httpPut).toHaveBeenCalledWith('', data, {
            headers: {
              'Content-Type': RDFMimeType.TURTLE
            },
            params: {
              action: 'ADD',
              context: undefined,
              baseURI: undefined
            }
          });
        });
      });

      test('should support adding quads in given context and base URI for resolving', () => {
        const q = quad(
          namedNode('http://domain/resource/resource-1'),
          namedNode('http://domain/property/relation-1'),
          literal('Title', 'en'));

        return transaction.addQuads([q], context, baseURI).then(() => {
          expect(httpPut).toHaveBeenCalledTimes(1);
          expect(httpPut).toHaveBeenCalledWith('', data, {
            headers: {
              'Content-Type': RDFMimeType.TURTLE
            },
            params: {
              action: 'ADD',
              context,
              baseURI
            }
          });
        });
      });

      test('should reject if the transaction cannot add quads', () => {
        const q = quad(
          namedNode('http://domain/resource/resource-1'),
          namedNode('http://domain/property/relation-1'),
          literal('Title', 'en'));

        httpPut.mockRejectedValue('Error during quads add');
        return expect(transaction.addQuads([q])).rejects.toEqual('Error during quads add');
      });

      test('should resolve to empty response (HTTP 204)', () => {
        const q = quad(
          namedNode('http://domain/resource/resource-1'),
          namedNode('http://domain/property/relation-1'),
          literal('Title', 'en'));
        return expect(transaction.addQuads([q])).resolves.toEqual();
      });
    });

    describe('sendData()', () => {
      test('should add data', () => {
        return transaction.sendData(data).then(() => {
          expect(httpPut).toHaveBeenCalledTimes(1);
          expect(httpPut).toHaveBeenCalledWith('', data, {
            headers: {
              'Content-Type': RDFMimeType.TURTLE
            },
            params: {
              action: 'ADD'
            }
          });
        });
      });

      test('should require data when adding', () => {
        expect(() => transaction.sendData()).toThrow();
        expect(() => transaction.sendData('')).toThrow();
        expect(() => transaction.sendData('  ')).toThrow();
        expect(httpPut).toHaveBeenCalledTimes(0);
      });

      test('should reject if the transaction cannot add data', () => {
        httpPut.mockRejectedValue('Error during add');
        return expect(transaction.sendData(data)).rejects.toEqual('Error during add');
      });

      test('should resolve to empty response (HTTP 204)', () => {
        return expect(transaction.sendData(data)).resolves.toEqual();
      });
    });

    describe('deleteData()', () => {
      test('should delete data', () => {
        return transaction.deleteData(data).then(() => {
          expect(httpPut).toHaveBeenCalledTimes(1);
          expect(httpPut).toHaveBeenCalledWith('', data, {
            headers: {
              'Content-Type': RDFMimeType.TURTLE
            },
            params: {
              action: 'DELETE'
            }
          });
        });
      });

      test('should require data when deleting', () => {
        expect(() => transaction.deleteData()).toThrow();
        expect(() => transaction.deleteData('')).toThrow();
        expect(() => transaction.deleteData('  ')).toThrow();
        expect(httpPut).toHaveBeenCalledTimes(0);
      });

      test('should reject if the transaction cannot delete data', () => {
        httpPut.mockRejectedValue('Error during delete');
        return expect(transaction.deleteData(data)).rejects.toEqual('Error during delete');
      });

      test('should resolve to empty response (HTTP 204)', () => {
        return expect(transaction.deleteData(data)).resolves.toEqual();
      });
    });

    describe('upload()', () => {
      const testFilePath = path.resolve(__dirname, './data/add-statements-complex.txt');

      test('should upload data stream in given context and base URI', () => {
        const turtleStream = FileUtils.getReadStream(testFilePath);

        return transaction.upload(turtleStream, context, baseURI, RDFMimeType.TRIG).then(() => {
          expect(httpPut).toHaveBeenCalledTimes(1);

          const httpPutCall = httpPut.mock.calls[0];

          const url = httpPutCall[0];
          expect(url).toEqual('');

          const requestConfig = httpPutCall[2];
          expect(requestConfig).toEqual({
            headers: {
              'Content-Type': RDFMimeType.TRIG
            },
            params: {
              action: 'ADD',
              context,
              baseURI
            },
            responseType: 'stream'
          });

          const stream = httpPutCall[1];
          return testUtils.readStream(stream)
        }).then((streamData) => {
          const turtleData = testUtils.loadFile(testFilePath).trim();
          expect(streamData).toEqual(turtleData);
        });
      });

      test('should reject if the server cannot consume the upload request', () => {
        const error = new Error('cannot-upload');
        httpPut.mockRejectedValue(error);

        const turtleStream = FileUtils.getReadStream(testFilePath);
        const promise = transaction.upload(turtleStream, context, null, RDFMimeType.TRIG);
        return expect(promise).rejects.toEqual(error);
      });

      test('should resolve to empty response (HTTP 204)', () => {
        const turtleStream = FileUtils.getReadStream(testFilePath);
        return expect(transaction.upload(turtleStream, context, baseURI, RDFMimeType.TRIG)).resolves.toEqual();
      });
    });

    describe('addFile()', () => {
      const testFilePath = path.resolve(__dirname, './data/add-statements-complex.txt');

      test('should upload file with data as stream in given context and base URI', () => {
        return transaction.addFile(testFilePath, context, baseURI, RDFMimeType.TRIG).then(() => {
          expect(httpPut).toHaveBeenCalledTimes(1);

          const httpPutCall = httpPut.mock.calls[0];

          const url = httpPutCall[0];
          expect(url).toEqual('');

          const requestConfig = httpPutCall[2];
          expect(requestConfig).toEqual({
            headers: {
              'Content-Type': RDFMimeType.TRIG
            },
            params: {
              action: 'ADD',
              context,
              baseURI
            },
            responseType: 'stream'
          });

          const stream = httpPutCall[1];
          return testUtils.readStream(stream)
        }).then((streamData) => {
          const turtleData = testUtils.loadFile(testFilePath).trim();
          expect(streamData).toEqual(turtleData);
        });
      });

      test('should reject if the server cannot consume the file upload request', () => {
        const error = new Error('cannot-upload');
        httpPut.mockRejectedValue(error);

        const promise = transaction.addFile(testFilePath, context, null, RDFMimeType.TRIG);
        return expect(promise).rejects.toEqual(error);
      });

      test('should disallow uploading missing files', () => {
        expect(() => transaction.addFile(null, context, baseURI, RDFMimeType.TRIG)).toThrow(Error);
        expect(() => transaction.addFile('', context, baseURI, RDFMimeType.TRIG)).toThrow(Error);
        expect(() => transaction.addFile('missing-file-123', context, baseURI, RDFMimeType.TRIG)).toThrow(Error);
      });

      test('should resolve to empty response (HTTP 204)', () => {
        return expect(transaction.addFile(testFilePath, context, baseURI, RDFMimeType.TRIG)).resolves.toEqual();
      });
    });

    function getStatementPayload() {
      return new GetStatementsPayload()
        .setResponseType(RDFMimeType.RDF_JSON)
        .setSubject('<http://eunis.eea.europa.eu/countries/AZ>')
        .setPredicate('<http://eunis.eea.europa.eu/rdf/schema.rdf#population>')
        .setObject('"7931000"^^http://www.w3.org/2001/XMLSchema#integer')
        .setContext('<http://example.org/graph3>')
        .setInference(true)
        .get();
    }
  });

});
