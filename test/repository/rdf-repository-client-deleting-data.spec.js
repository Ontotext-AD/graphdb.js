/* eslint-disable max-len */
const HttpClient = require('http/http-client');
const ClientConfigBuilder = require('http/client-config-builder');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const HttpRequestBuilder = require('http/http-request-builder');
const httpClientStub = require('../http/http-client.stub');

jest.mock('http/http-client');

/*
 * Tests statements deletion via RDFRepositoryClient
 */
describe('RDFRepositoryClient - Deleting statements', () => {
  const subj = '<http://domain/resource/1>';
  const pred = '<http://domain/property/1>';
  const obj = '<http://domain/value/1>';
  const context = '<http://domain/graph/1>';

  let repoClientConfig;
  let rdfRepositoryClient;
  let httpRequest;

  beforeEach(() => {
    repoClientConfig = ClientConfigBuilder.repositoryConfig('http://localhost:8080')
      .setEndpoints(['http://localhost:8080/repositories/test'])
      .setReadTimeout(100)
      .setWriteTimeout(200);

    HttpClient.mockImplementation(() => httpClientStub());

    rdfRepositoryClient = new RDFRepositoryClient(repoClientConfig);
    httpRequest = rdfRepositoryClient.httpClients[0].request;
  });

  describe('deleteStatements(subject, predicate, object, contexts)', () => {
    test('should allow to delete all statements for given subject', () => {
      return rdfRepositoryClient.deleteStatements(subj).then(() => {
        expect(httpRequest).toHaveBeenCalledTimes(1);
        expect(httpRequest).toHaveBeenCalledWith(HttpRequestBuilder.httpDelete('/statements').setParams({
          subj, pred: undefined, obj: undefined, context: undefined
        }));
      });
    });

    test('should allow to delete specific statement', () => {
      return rdfRepositoryClient.deleteStatements(subj, pred, obj).then(() => {
        expect(httpRequest).toHaveBeenCalledTimes(1);
        expect(httpRequest).toHaveBeenCalledWith(HttpRequestBuilder.httpDelete('/statements').setParams({
          subj, pred, obj, context: undefined
        }));
      });
    });

    test('should allow to delete specific statements in specific graphs', () => {
      const contexts = [context, '<http://domain/graph/2>'];
      return rdfRepositoryClient.deleteStatements(subj, pred, obj, contexts).then(() => {
        expect(httpRequest).toHaveBeenCalledTimes(1);
        expect(httpRequest).toHaveBeenCalledWith(HttpRequestBuilder.httpDelete('/statements').setParams({
          subj, pred, obj, context: contexts
        }));
      });
    });

    test('should allow to delete all statements from specific graph', () => {
      return rdfRepositoryClient.deleteStatements(null, null, null, context).then(() => {
        expect(httpRequest).toHaveBeenCalledTimes(1);
        expect(httpRequest).toHaveBeenCalledWith(HttpRequestBuilder.httpDelete('/statements').setParams({
          subj: undefined, pred: undefined, obj: undefined, context
        }));
      });
    });

    test('should reject deleting statements when the server request is unsuccessful', () => {
      httpRequest.mockRejectedValue('error-deleting');
      return expect(rdfRepositoryClient.deleteStatements(subj)).rejects.toEqual('error-deleting');
    });

    test('should convert parameters to N-Triple encoded resources', () => {
      return rdfRepositoryClient.deleteStatements(
        'http://domain/resource/1',
        'http://domain/property/1',
        'http://domain/value/1',
        'http://domain/graph/1').then(() => {
        expect(httpRequest).toHaveBeenCalledTimes(1);
        expect(httpRequest).toHaveBeenCalledWith(HttpRequestBuilder.httpDelete('/statements').setParams({
          subj, pred, obj, context
        }));
      });
    });

    test('should resolve to empty response (HTTP 204)', () => {
      return expect(rdfRepositoryClient.deleteStatements(subj)).resolves.toEqual();
    });
  });

  describe('deleteAllStatements()', () => {
    test('should properly request all statements deletion', () => {
      return rdfRepositoryClient.deleteAllStatements().then(() => {
        expect(httpRequest).toHaveBeenCalledTimes(1);
        expect(httpRequest).toHaveBeenCalledWith(HttpRequestBuilder.httpDelete('/statements'));
      });
    });

    test('should reject deleting all statements when the server request is unsuccessful', () => {
      httpRequest.mockRejectedValue('error-deleting-all');
      return expect(rdfRepositoryClient.deleteAllStatements()).rejects.toEqual('error-deleting-all');
    });

    test('should resolve to empty response (HTTP 204)', () => {
      return expect(rdfRepositoryClient.deleteAllStatements()).resolves.toEqual();
    });
  });
});
