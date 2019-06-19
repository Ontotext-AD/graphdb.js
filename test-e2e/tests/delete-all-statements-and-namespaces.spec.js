const {RDFRepositoryClient} = require('graphdb').repository;
const path = require('path');
const {RDFMimeType} = require('graphdb').http;
const Utils = require('utils');
const Config = require('config');

describe('Should delete everything', () => {

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

  test('Should delete all statements', () => {
    return rdfClient.deleteAllStatements().then(() => {
      return rdfClient.getSize();
    }).then((response) => {
      expect(response).toBe(0);
    });
  });

  test('Should delete all namespaces', () => {
    return rdfClient.deleteNamespaces().then(() => {
      return rdfClient.getNamespaces();
    }).then((resp) => {
      expect(resp.length).toBe(0)
    });
  });
});
