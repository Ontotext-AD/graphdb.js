const path = require('path');
const {RDFRepositoryClient} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const Utils = require('utils.js');
const Config = require('config.js');

describe('Import RDF', () => {

  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should load wine rdf via addFile', () => {
    let wineRdf = path.resolve(__dirname, './../../data/wine.rdf');

    return rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null).then(() => {
      return rdfClient.getSize();
    }).then((response) => {
      expect(response).toBe(1839);
    });
  });

  test('Should overwrite file via putFile', () => {
    let rowsRdf = path.resolve(__dirname, './../../data/rows.rdf');

    return rdfClient.putFile(rowsRdf, RDFMimeType.RDF_XML, null, null).then(() => {
      return rdfClient.getSize();
    }).then((resp) => {
      expect(resp).toBe(462);
    });
  });
});
