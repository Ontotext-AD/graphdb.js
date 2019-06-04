const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RDFMimeType = require('http/rdf-mime-type');
const DataFactory = require('n3').DataFactory;
const NamedNode = DataFactory.internal.NamedNode;
const Namespace = require('model/namespace');
const HttpRequestConfigBuilder = require('http/http-request-config-builder');
const httpClientStub = require('../http/http-client.stub');
const namespaceData = require('./data/namespaces.json');

jest.mock('http/http-client');

/*
 * Tests the namespace management via RDFRepositoryClient: fetching, params etc.
 */
describe('RDFRepositoryClient - Namespace management', () => {

  let repoClientConfig;
  let rdfRepositoryClient;

  beforeEach(() => {
    repoClientConfig = new RepositoryClientConfig()
      .addEndpoint('http://localhost:8080/repositories/test')
      .setReadTimeout(100)
      .setWriteTimeout(200);

    HttpClient.mockImplementation(() => stubHttpClient());

    rdfRepositoryClient = new RDFRepositoryClient(repoClientConfig);
  });

  describe('getNamespaces()', () => {
    test('should retrieve the available namespaces', () => {
      return rdfRepositoryClient.getNamespaces().then((namespaces) => {
        expect(namespaces).toBeDefined();
        expect(namespaces.length).toEqual(16);
        namespaces.forEach(namespace => {
          expect(namespace).toBeInstanceOf(Namespace);
          expect(namespace.getPrefix()).toBeDefined();
          expect(namespace.getNamespace()).toBeInstanceOf(NamedNode);
        });

        let get = rdfRepositoryClient.httpClients[0].get;
        expect(get).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenCalledWith('/namespaces', new HttpRequestConfigBuilder().setHeaders({
          'Accept': RDFMimeType.SPARQL_RESULTS_JSON
        }));
      });
    });

    test('should reject retrieving all namespaces when the server request is unsuccessful', () => {
      rdfRepositoryClient.httpClients[0].get.mockRejectedValue({});
      return expect(rdfRepositoryClient.getNamespaces()).rejects.toBeTruthy();
    });
  });

  describe('getNamespace(prefix)', () => {
    test('should retrieve specific namespace', () => {
      return rdfRepositoryClient.getNamespace('rdfs').then(namespace => {
        expect(namespace).toBeInstanceOf(NamedNode);
        expect(namespace.value).toEqual('http://www.w3.org/2000/01/rdf-schema#');

        let get = rdfRepositoryClient.httpClients[0].get;
        expect(get).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenCalledWith('/namespaces/rdfs');
      });
    });

    test('should not retrieve a namespace if not provided with prefix', () => {
      expect(() => rdfRepositoryClient.getNamespace('')).toThrow(Error);
      expect(rdfRepositoryClient.httpClients[0].get).toHaveBeenCalledTimes(0);
    });

    test('should reject retrieving a namespace when the server request is unsuccessful', () => {
      rdfRepositoryClient.httpClients[0].get.mockRejectedValue({});
      return expect(rdfRepositoryClient.getNamespace('rdfs')).rejects.toBeTruthy();
    });
  });

  describe('saveNamespace(prefix, namespace)', () => {
    const newNamespace = 'http://new.namespace.com/schema#';

    test('should save a namespace from string', () => {
      return rdfRepositoryClient.saveNamespace('new', newNamespace).then(() => {
        let put = rdfRepositoryClient.httpClients[0].put;
        expect(put).toHaveBeenCalledTimes(1);
        expect(put).toHaveBeenCalledWith('/namespaces/new', newNamespace);
      });
    });

    test('should save a namespace from NamedNode', () => {
      const namespaceTerm = DataFactory.namedNode(newNamespace);
      return rdfRepositoryClient.saveNamespace('new', namespaceTerm).then(() => {
        let put = rdfRepositoryClient.httpClients[0].put;
        expect(put).toHaveBeenCalledTimes(1);
        expect(put).toHaveBeenCalledWith('/namespaces/new', namespaceTerm.value);
      });
    });

    test('should not save a namespace if not provided with prefix', () => {
      expect(() => rdfRepositoryClient.saveNamespace('', 'http://new.namespace.com/schema#')).toThrow(Error);
    });

    test('should not save a namespace if not provided with namespace', () => {
      // namespace could be either string or named node -> check with empty and undefined
      expect(() => rdfRepositoryClient.saveNamespace('new', '')).toThrow(Error);
      expect(() => rdfRepositoryClient.saveNamespace('new', undefined)).toThrow(Error)
    });

    test('should reject saving a namespace when the server request is unsuccessful', () => {
      rdfRepositoryClient.httpClients[0].put.mockRejectedValue({});
      return expect(rdfRepositoryClient.saveNamespace('new', 'http://new.namespace.com/schema#')).rejects.toBeTruthy();
    });

    test('should resolve to empty response (HTTP 204)', () => {
      return expect(rdfRepositoryClient.saveNamespace('new', newNamespace)).resolves.toEqual();
    });
  });

  describe('deleteNamespace(prefix)', () => {
    test('should delete a namespace', () => {
      return rdfRepositoryClient.deleteNamespace('rdfs').then(() => {
        let deleteResource = rdfRepositoryClient.httpClients[0].deleteResource;
        expect(deleteResource).toHaveBeenCalledTimes(1);
        expect(deleteResource).toHaveBeenCalledWith('/namespaces/rdfs');
      });
    });

    test('should not delete a namespace if not provided with prefix', () => {
      expect(() => rdfRepositoryClient.deleteNamespace('')).toThrow(Error);
    });

    test('should reject deleting a namespace when the server request is unsuccessful', () => {
      rdfRepositoryClient.httpClients[0].deleteResource.mockRejectedValue({});
      return expect(rdfRepositoryClient.deleteNamespace('rdfs')).rejects.toBeTruthy();
    });

    test('should resolve to empty response (HTTP 204)', () => {
      return expect(rdfRepositoryClient.deleteNamespace('rdfs')).resolves.toEqual();
    });
  });

  describe('deleteNamespaces()', () => {
    test('should delete all namespaces', () => {
      return rdfRepositoryClient.deleteNamespaces().then(() => {
        let deleteResource = rdfRepositoryClient.httpClients[0].deleteResource;
        expect(deleteResource).toHaveBeenCalledTimes(1);
        expect(deleteResource).toHaveBeenCalledWith('/namespaces');
      });
    });

    test('should reject deleting all namespaces when the server request is unsuccessful', () => {
      rdfRepositoryClient.httpClients[0].deleteResource.mockRejectedValue({});
      return expect(rdfRepositoryClient.deleteNamespaces()).rejects.toBeTruthy();
    });

    test('should resolve to empty response (HTTP 204)', () => {
      return expect(rdfRepositoryClient.deleteNamespaces()).resolves.toEqual();
    });
  });

  function stubHttpClient() {
    let stub = httpClientStub();

    // Stub get to handle namespaces
    stub.get = jest.fn().mockImplementation((url) => {
      // all
      if (url === '/namespaces') {
        return Promise.resolve({data: namespaceData.GET});
      }

      // concrete
      let prefix = url.substring(url.lastIndexOf('/') + 1);
      let namespace = namespaceData.GET.results.bindings.find(b => b.prefix.value === prefix);
      if (namespace) {
        return Promise.resolve({data: namespace.namespace.value});
      }

      // missing
      return Promise.reject({});
    });

    return stub;
  }

});
