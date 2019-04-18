const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const RdfRepositoryClient = require('repository/rdf-repository-client');
const RDFContentType = require('http/rdf-content-type');
const DataFactory = require('n3').DataFactory;
const NamedNode = DataFactory.internal.NamedNode;
const Namespace = require('model/namespace');
const httpClientStub = require('../http/http-client.stub');
const namespaceData = require('./namespaces.data.json');

jest.mock('http/http-client');

/*
 * Tests the namespace management via RdfRepositoryClient: fetching, params etc.
 */
describe('RdfRepositoryClient - Namespace management', () => {

  let repoClientConfig;
  let rdfRepositoryClient;

  beforeEach(() => {
    // No timeout so it won't slow the test suite when testing rejections.
    repoClientConfig = new RepositoryClientConfig([
      'http://localhost:8080/repositories/test'
    ], {}, '', 100, 200, 0, 4);

    HttpClient.mockImplementation(() => stubHttpClient());

    rdfRepositoryClient = new RdfRepositoryClient(repoClientConfig);
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
        expect(get).toHaveBeenCalledWith('/namespaces', {
          headers: {'Accept': RDFContentType.SPARQL_RESULTS_JSON},
          timeout: 100
        });
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
        expect(get).toHaveBeenCalledWith('/namespaces/rdfs', {
          timeout: 100
        });
      });
    });

    test('should not retrieve a namespace if not provided with prefix', () => {
      return expect(rdfRepositoryClient.getNamespace('')).rejects.toThrow(Error);
    });

    test('should not perform a get request for namespace if not provided with prefix', () => {
      return rdfRepositoryClient.getNamespace('').catch(() => {
        return expect(rdfRepositoryClient.httpClients[0].get).toHaveBeenCalledTimes(0);
      });
    });

    test('should reject retrieving a namespace when the server request is unsuccessful', () => {
      rdfRepositoryClient.httpClients[0].get.mockRejectedValue({});
      return expect(rdfRepositoryClient.getNamespace('rdfs')).rejects.toBeTruthy();
    });
  });

  describe('saveNamespace(prefix, namespace)', () => {
    test('should save a namespace from string', () => {
      const namespace = 'http://new.namespace.com/schema#';
      return rdfRepositoryClient.saveNamespace('new', namespace).then(() => {
        let put = rdfRepositoryClient.httpClients[0].put;
        expect(put).toHaveBeenCalledTimes(1);
        expect(put).toHaveBeenCalledWith('/namespaces/new', namespace, {
          timeout: 200
        });
      });
    });

    test('should save a namespace from NamedNode', () => {
      const namespaceTerm = DataFactory.namedNode('http://new.namespace.com/schema#');
      return rdfRepositoryClient.saveNamespace('new', namespaceTerm).then(() => {
        let put = rdfRepositoryClient.httpClients[0].put;
        expect(put).toHaveBeenCalledTimes(1);
        expect(put).toHaveBeenCalledWith('/namespaces/new', namespaceTerm.value, {
          timeout: 200
        });
      });
    });

    test('should not save a namespace if not provided with prefix', () => {
      return expect(rdfRepositoryClient.saveNamespace('', 'http://new.namespace.com/schema#')).rejects.toThrow(Error);
    });

    test('should not save a namespace if not provided with namespace', () => {
      return Promise.all([
        // namespace could be either string or named node -> check with empty and undefined
        expect(rdfRepositoryClient.saveNamespace('new', '')).rejects.toThrow(Error),
        expect(rdfRepositoryClient.saveNamespace('new', undefined)).rejects.toThrow(Error)
      ]);
    });

    test('should reject saving a namespace when the server request is unsuccessful', () => {
      rdfRepositoryClient.httpClients[0].put.mockRejectedValue({});
      return expect(rdfRepositoryClient.saveNamespace('new', 'http://new.namespace.com/schema#')).rejects.toBeTruthy();
    });
  });

  describe('deleteNamespace(prefix)', () => {
    test('should delete a namespace', () => {
      return rdfRepositoryClient.deleteNamespace('rdfs').then(() => {
        let deleteResource = rdfRepositoryClient.httpClients[0].deleteResource;
        expect(deleteResource).toHaveBeenCalledTimes(1);
        expect(deleteResource).toHaveBeenCalledWith('/namespaces/rdfs', {
          timeout: 200
        });
      });
    });

    test('should not delete a namespace if not provided with prefix', () => {
      return expect(rdfRepositoryClient.deleteNamespace('')).rejects.toThrow(Error);
    });

    test('should reject deleting a namespace when the server request is unsuccessful', () => {
      rdfRepositoryClient.httpClients[0].deleteResource.mockRejectedValue({});
      return expect(rdfRepositoryClient.deleteNamespace('rdfs')).rejects.toBeTruthy();
    });
  });

  describe('deleteNamespaces()', () => {
    test('should delete all namespaces', () => {
      return rdfRepositoryClient.deleteNamespaces().then(() => {
        let deleteResource = rdfRepositoryClient.httpClients[0].deleteResource;
        expect(deleteResource).toHaveBeenCalledTimes(1);
        expect(deleteResource).toHaveBeenCalledWith('/namespaces', {
          timeout: 200
        });
      });
    });

    test('should reject deleting all namespaces when the server request is unsuccessful', () => {
      rdfRepositoryClient.httpClients[0].deleteResource.mockRejectedValue({});
      return expect(rdfRepositoryClient.deleteNamespaces()).rejects.toBeTruthy();
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
