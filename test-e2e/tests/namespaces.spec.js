const path = require('path');
const {RDFRepositoryClient} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const Utils = require('utils');
const Config = require('config');

describe('Should test namespaces', () => {
  const rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath).then(() => {
      const wineRdf = path.resolve(__dirname, './data/wine.rdf');
      return rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null);
    });
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should verify namespaces', () => {
    return rdfClient.getNamespaces().then((namespaces) => {
      expect(namespaces.length).toEqual(9);
    }).then(() => {
      return rdfClient.saveNamespace('new', 'http://new.namespace.com/schema#');
    }).then(() => {
      return rdfClient.getNamespace('new');
    }).then((namespace) => {
      expect(namespace.value).toEqual('http://new.namespace.com/schema#');
      return rdfClient.saveNamespace('new', 'http://new.namespace.com/schema1#');
    }).then(() => {
      return rdfClient.getNamespace('new');
    }).then((namespace) => {
      expect(namespace.value).toEqual('http://new.namespace.com/schema1#');
      return rdfClient.deleteNamespace('new');
    }).then(() => {
      return rdfClient.getNamespaces();
    }).then((namespaces) => {
      expect(namespaces.length).toEqual(9);
    });
  });
});

describe('Should test namespaces in secured environment', () => {
  const rdfSecuredClient =
    new RDFRepositoryClient(Config.restApiBasicAuthConfig);

  beforeAll((done) => {
    Utils.createRepo(Config.testRepoPath)
      .then(() => {
        return Utils.toggleSecurity(true);
      }).then(() => {
        const wineRdf = path.resolve(__dirname, './data/wine.rdf');
        return rdfSecuredClient
          .addFile(wineRdf, RDFMimeType.RDF_XML, null, null);
      }).then(() => {
        return done();
      }).catch((e) => {
        throw new Error(e);
      });
  });

  afterAll((done) => {
    Utils.toggleSecurity(false).then(() => {
      return Utils.deleteRepo('Test_repo');
    }).then(()=> done());
  });

  test('Should list namespaces', () => {
    rdfSecuredClient.getNamespaces().then(() => {
      return rdfSecuredClient.getSize();
    }).then((response) => {
      expect(response).toBe(1839);
    });
  });

  test('Should delete all namespaces', () => {
    return rdfSecuredClient.deleteNamespaces().then(() => {
      return rdfSecuredClient.getNamespaces();
    }).then((resp) => {
      expect(resp.length).toBe(0);
    });
  });
});
