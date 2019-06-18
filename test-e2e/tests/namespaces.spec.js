const path = require('path');
const {RDFRepositoryClient} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const Utils = require('utils');
const Config = require('config');

describe('Should test namespaces', () => {

  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath).then(() => {
      let wineRdf = path.resolve(__dirname, './data/wine.rdf');
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
