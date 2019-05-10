const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const httpClientStub = require('../http/http-client.stub');
const {when} = require('jest-when');

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

  beforeEach(() => {
    repoClientConfig = new RepositoryClientConfig([
      'http://localhost:8080/repositories/test'
    ], {}, '', 100, 200);

    HttpClient.mockImplementation(() => httpClientStub());

    rdfRepositoryClient = new RDFRepositoryClient(repoClientConfig);
  });

  describe('deleteStatements(subject, predicate, object, contexts)', () => {
    test('should allow to delete all statements for given subject', () => {
      return rdfRepositoryClient.deleteStatements(subj).then(() => {
        let deleteResource = rdfRepositoryClient.httpClients[0].deleteResource;
        expect(deleteResource).toHaveBeenCalledTimes(1);
        expect(deleteResource).toHaveBeenCalledWith('/statements', {
          params: {
            subj, pred: undefined, obj: undefined, context: undefined
          }
        });
      });
    });

    test('should allow to delete specific statement', () => {
      return rdfRepositoryClient.deleteStatements(subj, pred, obj).then(() => {
        let deleteResource = rdfRepositoryClient.httpClients[0].deleteResource;
        expect(deleteResource).toHaveBeenCalledTimes(1);
        expect(deleteResource).toHaveBeenCalledWith('/statements', {
          params: {
            subj, pred, obj, context: undefined
          }
        });
      });
    });

    test('should allow to delete specific statements in specific graphs', () => {
      let contexts = [context, '<http://domain/graph/2>'];
      return rdfRepositoryClient.deleteStatements(subj, pred, obj, contexts).then(() => {
        let deleteResource = rdfRepositoryClient.httpClients[0].deleteResource;
        expect(deleteResource).toHaveBeenCalledTimes(1);
        expect(deleteResource).toHaveBeenCalledWith('/statements', {
          params: {
            subj, pred, obj, context: contexts
          }
        });
      });
    });

    test('should allow to delete all statements from specific graph', () => {
      return rdfRepositoryClient.deleteStatements(null, null, null, context).then(() => {
        let deleteResource = rdfRepositoryClient.httpClients[0].deleteResource;
        expect(deleteResource).toHaveBeenCalledTimes(1);
        expect(deleteResource).toHaveBeenCalledWith('/statements', {
          params: {
            subj: null, pred: null, obj: null, context
          }
        });
      });
    });

    test('should reject deleting statements when the server request is unsuccessful', () => {
      when(rdfRepositoryClient.httpClients[0].deleteResource).calledWith('/statements').mockRejectedValue('error-deleting');
      return expect(rdfRepositoryClient.deleteStatements(subj)).rejects.toEqual('error-deleting');
    });
  });

  describe('deleteAllStatements()', () => {
    test('should properly request all statements deletion', () => {
      return rdfRepositoryClient.deleteAllStatements().then(() => {
        let deleteResource = rdfRepositoryClient.httpClients[0].deleteResource;
        expect(deleteResource).toHaveBeenCalledTimes(1);
        expect(deleteResource).toHaveBeenCalledWith('/statements');
      });
    });

    test('should reject deleting all statements when the server request is unsuccessful', () => {
      when(rdfRepositoryClient.httpClients[0].deleteResource).calledWith('/statements').mockRejectedValue('error-deleting-all');
      return expect(rdfRepositoryClient.deleteAllStatements()).rejects.toEqual('error-deleting-all');
    });
  });

});
